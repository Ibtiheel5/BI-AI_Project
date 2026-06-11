// ConsultationRequest.jsx - Nouveau flux : chatbot -> detection modele -> choix medecin -> envoi
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// -- Icones SVG inline (PAS d'emoji - uniquement SVG) ----------------
const Icon = {
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Bot: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Loader: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  Image: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Map: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Phone: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Stethoscope: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 0 0-.2.2"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
  ),
  AlertTriangle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

// -- Couleurs des modeles --------------------------------------------
const MODEL_CONFIG = {
  chest:  { color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  icon: "L", label: "Radio Thorax" },
  lung:   { color: "#EC4899", bg: "rgba(236,72,153,0.1)",  icon: "S", label: "Scanner CT" },
  brain:  { color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",  icon: "B", label: "IRM Cerebrale" },
  retina: { color: "#06B6D4", bg: "rgba(6,182,212,0.1)",   icon: "E", label: "Fond d'oeil" },
};

// -- Formatage markdown simple -----------------------------------------
function formatMessage(text) {
  if (!text) return null;
  const lines = String(text).split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return <p key={i} style={{ fontWeight: 700, color: "#0A1628", margin: "8px 0 4px" }}>{trimmed.slice(2, -2)}</p>;
    }
    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      return <p key={i} style={{ fontWeight: 700, color: "#0A1628", margin: "8px 0 4px" }}>{trimmed.replace(/^#+\s/, "")}</p>;
    }
    if (trimmed.startsWith("---")) {
      return <hr key={i} style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "10px 0" }} />;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("- ")) {
      return <p key={i} style={{ margin: "3px 0", paddingLeft: 12 }}>{trimmed}</p>;
    }
    let html = trimmed;
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    return <p key={i} style={{ margin: "3px 0" }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

// -- Composant carte medecin -----------------------------------------
function DoctorCard({ doctor, selected, onSelect }) {
  const safeDoctor = doctor || {};
  const isSelected = selected && selected.id === safeDoctor.id;
  const fullName = safeDoctor.full_name || safeDoctor.name || "Medecin";
  const specialty = safeDoctor.specialty || safeDoctor.specialite || "Specialiste";
  const address = safeDoctor.address || "";
  const ville = safeDoctor.ville || "";
  const phone = safeDoctor.phone || "";
  const distance = safeDoctor.distance_km;
  const workload = safeDoctor.workload;
  const initial = String(fullName).charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect && onSelect(safeDoctor)}
      style={{
        background: isSelected ? "linear-gradient(135deg, #0A2647, #1B3B6F)" : "#fff",
        border: isSelected ? "2px solid #D4A500" : "1.5px solid #E5E7EB",
        borderRadius: 16,
        padding: "16px 20px",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.2s ease",
      }}
    >
      {isSelected && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 24, height: 24, borderRadius: "50%",
          background: "#D4A500", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon.Check />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: isSelected ? "rgba(212,165,0,0.15)" : "#F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem", fontWeight: 700,
          color: isSelected ? "#D4A500" : "#0A1628",
        }}>
          {initial}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: isSelected ? "#fff" : "#0A1628", fontSize: "0.92rem" }}>
            {fullName}
          </div>
          <div style={{ fontSize: "0.75rem", color: isSelected ? "#FFD700" : "#64748B", fontWeight: 600 }}>
            {specialty}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(address || ville) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: isSelected ? "rgba(255,255,255,0.6)" : "#64748B" }}>
            <Icon.Map /> {address ? `${String(address).slice(0, 40)}...` : ville}
          </div>
        )}
        {phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: isSelected ? "rgba(255,255,255,0.6)" : "#64748B" }}>
            <Icon.Phone /> {phone}
          </div>
        )}
        {distance != null && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, padding: "2px 8px", borderRadius: 10, background: isSelected ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.08)", color: "#10B981", fontSize: "0.68rem", fontWeight: 700 }}>
            <Icon.Map /> {distance} km
          </div>
        )}
        {workload != null && (
          <div style={{ fontSize: "0.65rem", color: isSelected ? "rgba(255,255,255,0.4)" : "#94A3B8" }}>
            {workload} consultation(s) en cours
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function ConsultationRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  // -- Etat du chat ------------------------------------------------
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Bonjour ! Je suis votre assistant sante\n\n" +
        "Decrivez-moi vos symptomes en quelques phrases.\n\n" +
        "Vous pouvez aussi **joindre une image medicale** (radiographie, scanner, IRM, fond d'oeil) " +
        "si vous en avez deja une - cela m'aidera a mieux vous orienter.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // -- Resultat de l'analyse ---------------------------------------
  const [recommendation, setRecommendation] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // -- Etape de creation de consultation -------------------------
  const [step, setStep] = useState("chat");
  const [createdConsultationId, setCreatedConsultationId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const chooseDoctorFileRef = useRef(null);

  // Scroll vers le bas a chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Geolocalisation au chargement
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // -- Gestion de l'image -----------------------------------------
  const handleImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev?.target?.result || null);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (chooseDoctorFileRef.current) chooseDoctorFileRef.current.value = "";
  };

  // -- Envoi du message au chatbot ---------------------------------
  const sendMessage = async () => {
    const text = String(inputText || "").trim();
    if (!text && !image) return;
    if (isLoading) return;

    const userMsg = {
      role: "user",
      content: text || "(Image medicale jointe)",
      imagePreview: imagePreview || null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      let data = null;
      if (image) {
        const form = new FormData();
        form.append("text", text || "Image medicale jointe");
        form.append("image", image);
        if (userLocation) {
          form.append("user_lat", String(userLocation.lat));
          form.append("user_lon", String(userLocation.lon));
        }
        const res = await fetch(`${API}/chatbot/analyze-with-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Erreur HTTP ${res.status}`);
        }
        data = await res.json();
      } else {
        const res = await fetch(`${API}/chatbot/analyze`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            user_lat: userLocation?.lat ?? null,
            user_lon: userLocation?.lon ?? null,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Erreur HTTP ${res.status}`);
        }
        data = await res.json();
      }

      // SECURITE : s'assurer que data est un objet valide
      if (!data || typeof data !== "object") {
        throw new Error("Reponse invalide du serveur");
      }

      const botMsg = {
        role: "bot",
        content: data.message || "Analyse terminee.",
        type: data.type || "unknown",
      };
      setMessages((prev) => [...prev, botMsg]);

      // SECURITE : verifier que recommendation existe et est un objet
      const hasRecommendation = data.type === "recommendation" && data.recommendation && typeof data.recommendation === "object";

      if (hasRecommendation) {
        setRecommendation(data.recommendation);
        // SECURITE : s'assurer que doctors est un tableau
        const safeDoctors = Array.isArray(data.doctors) ? data.doctors : [];
        setDoctors(safeDoctors);

        if (safeDoctors.length > 0) {
          setStep("choose_doctor");
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content:
                "J'ai analyse vos symptomes.\n\n" +
                "Veuillez maintenant **choisir un medecin** parmi les specialistes " +
                "recommandes ci-dessous, puis fournir votre image medicale pour " +
                "soumettre votre dossier.",
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content:
                "Aucun medecin disponible dans notre reseau pour ce domaine.\n\n" +
                "Veuillez contacter votre administration ou reessayer plus tard.",
            },
          ]);
          removeImage();
        }
      } else {
        removeImage();
      }
    } catch (err) {
      console.error("Erreur sendMessage:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Une erreur s'est produite. Veuillez reessayer.\n\nDetails : " + (err?.message || "Erreur inconnue"),
        },
      ]);
      removeImage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // -- Soumission de la consultation -------------------------------
  const submitConsultation = async () => {
    // CORRECTION : verifier qu'on a bien une image (soit du chat, soit uploadee maintenant)
    if (!selectedDoctor || !recommendation) {
      alert("Veuillez selectionner un medecin.");
      return;
    }
    if (!image) {
      alert("Veuillez joindre une image medicale.");
      return;
    }

    setStep("submitting");

    try {
      const form = new FormData();
      form.append("model_key", recommendation.model_key || "");
      form.append("doctor_id", String(selectedDoctor.id || ""));
      const symptomsText = (messages || [])
        .filter((m) => m && m.role === "user")
        .map((m) => m.content || "")
        .join("\n");
      form.append("symptoms", symptomsText);
      form.append("patient_notes", "");
      form.append("file", image);

      const res = await fetch(`${API}/consultations/from-chatbot`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Erreur lors de la creation");
      }

      const data = await res.json();
      setCreatedConsultationId(data?.consultation_id || null);
      setStep("done");
    } catch (err) {
      console.error("Erreur submitConsultation:", err);
      setStep("confirm");
      alert("Erreur : " + (err?.message || "Erreur inconnue"));
    }
  };

  // -- Helpers securises pour le rendu -----------------------------
  const safeDoctors = Array.isArray(doctors) ? doctors : [];
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeRecommendation = recommendation && typeof recommendation === "object" ? recommendation : null;
  const safeSelectedDoctor = selectedDoctor && typeof selectedDoctor === "object" ? selectedDoctor : null;
  const modelKey = safeRecommendation?.model_key || "";
  const modelConfig = MODEL_CONFIG[modelKey] || { color: "#D4A500", bg: "rgba(212,165,0,0.08)", icon: "?", label: "Inconnu" };

  // CORRECTION : verifier si une image valide est disponible
  const hasValidImage = image && imagePreview;

  // -- Rendu -------------------------------------------------------
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
      padding: "24px 16px",
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .msg-enter { animation: fade-in 0.3s ease; }
      `}</style>

      {/* -- En-tete -- */}
      <div style={{ maxWidth: 900, margin: "0 auto 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/patient")}
            style={{
              background: "white", border: "1.5px solid #E5E7EB", borderRadius: 12,
              width: 40, height: 40, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#0A1628",
            }}
          >
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0A1628", margin: 0 }}>
              Nouvelle consultation
            </h1>
            <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "4px 0 0" }}>
              Decrivez vos symptomes - le systeme detecte automatiquement l'examen adapte
            </p>
          </div>
          {safeRecommendation && (
            <div style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 20,
              background: modelConfig.bg,
              border: `1.5px solid ${modelConfig.color}30`,
            }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: modelConfig.color }}>
                {modelConfig.icon}
              </span>
              <span style={{
                fontSize: "0.78rem", fontWeight: 700,
                color: modelConfig.color,
              }}>
                {safeRecommendation.model_name || modelConfig.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* -- Corps -- */}
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* -- Zone de chat -- */}
        <div style={{
          background: "white", borderRadius: 24,
          border: "1px solid #E5E7EB", overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          {/* Messages */}
          <div style={{
            height: step === "chat" ? 440 : 280,
            overflowY: "auto", padding: "24px",
            display: "flex", flexDirection: "column", gap: 16,
            transition: "height 0.3s ease",
          }}>
            {safeMessages.map((msg, idx) => {
              if (!msg || typeof msg !== "object") return null;
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className="msg-enter"
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    alignItems: "flex-start", gap: 10,
                  }}
                >
                  {!isUser && (
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                      background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#FFD700",
                    }}>
                      <Icon.Bot />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "75%",
                    padding: "12px 16px",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isUser
                      ? "linear-gradient(135deg, #0A2647, #1B3B6F)"
                      : "#F8FAFC",
                    border: isUser ? "none" : "1px solid #E5E7EB",
                    color: isUser ? "#fff" : "#374151",
                    fontSize: "0.88rem", lineHeight: 1.6,
                  }}>
                    {msg.imagePreview && (
                      <img
                        src={msg.imagePreview}
                        alt="Image jointe"
                        style={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, marginBottom: 8, display: "block" }}
                      />
                    )}
                    {formatMessage(msg.content)}
                  </div>
                  {isUser && (
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                      background: "rgba(212,165,0,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#D4A500",
                    }}>
                      <Icon.User />
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700",
                }}>
                  <Icon.Bot />
                </div>
                <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E5E7EB" }}>
                  {[0, 150, 300].map((d) => (
                    <div key={d} style={{
                      width: 8, height: 8, borderRadius: "50%", background: "#D4A500",
                      animation: `fade-in 0.8s ease ${d}ms infinite alternate`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          {step === "chat" && (
            <div style={{
              borderTop: "1px solid #F1F5F9",
              padding: "16px 20px",
              background: "#FAFAFA",
            }}>
              {imagePreview && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <img src={imagePreview} alt="preview" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #E5E7EB" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0A1628" }}>{image?.name || "Image"}</div>
                    <div style={{ fontSize: "0.65rem", color: "#64748B" }}>Image medicale jointe</div>
                  </div>
                  <button onClick={removeImage} style={{ marginLeft: "auto", background: "#FEE2E2", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon.X />
                  </button>
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e?.target?.value || "")}
                  onKeyDown={handleKeyDown}
                  placeholder="Decrivez vos symptomes... (Ex: J'ai des maux de tete persistants depuis 3 jours avec des vertiges)"
                  rows={2}
                  disabled={isLoading}
                  style={{
                    flex: 1, padding: "12px 16px", borderRadius: 14,
                    border: "1.5px solid #E5E7EB", fontSize: "0.88rem",
                    fontFamily: "inherit", resize: "none", outline: "none",
                    background: "white", color: "#374151",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { if (e?.target) e.target.style.borderColor = "#D4A500"; }}
                  onBlur={(e) => { if (e?.target) e.target.style.borderColor = "#E5E7EB"; }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Joindre une image medicale"
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: imagePreview ? "rgba(212,165,0,0.15)" : "#F1F5F9",
                      border: imagePreview ? "1.5px solid #D4A500" : "1.5px solid #E5E7EB",
                      cursor: "pointer", color: imagePreview ? "#D4A500" : "#64748B",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon.Image />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || (!inputText.trim() && !image)}
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: (!inputText.trim() && !image) || isLoading
                        ? "#F1F5F9"
                        : "linear-gradient(135deg, #D4A500, #B8941E)",
                      border: "none", cursor: "pointer",
                      color: (!inputText.trim() && !image) || isLoading ? "#94A3B8" : "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {isLoading ? <Icon.Loader /> : <Icon.Send />}
                  </button>
                </div>
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              <p style={{ fontSize: "0.65rem", color: "#94A3B8", margin: "8px 0 0", textAlign: "center" }}>
                Entree pour envoyer - Shift+Entree pour nouvelle ligne - Formats image : JPG, PNG, WEBP
              </p>
            </div>
          )}
        </div>

        {/* -- Choix du medecin -- */}
        <AnimatePresence>
          {step === "choose_doctor" && safeDoctors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: "white", borderRadius: 24,
                border: "1px solid #E5E7EB", padding: 28,
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(212,165,0,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem", fontWeight: 700, color: "#D4A500",
                }}>
                  {modelConfig.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0A1628", margin: 0 }}>
                    Choisissez votre medecin
                  </h2>
                  <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "4px 0 0" }}>
                    {safeDoctors.length} specialiste{safeDoctors.length > 1 ? "s" : ""} disponible{safeDoctors.length > 1 ? "s" : ""} - Tries par disponibilite
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 20 }}>
                {safeDoctors.map((doc, idx) => (
                  <DoctorCard
                    key={doc?.id || idx}
                    doctor={doc}
                    selected={safeSelectedDoctor}
                    onSelect={setSelectedDoctor}
                  />
                ))}
              </div>

              <AnimatePresence>
                {safeSelectedDoctor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      borderTop: "1px solid #F1F5F9", paddingTop: 20, marginTop: 4,
                    }}>
                      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0A1628", marginBottom: 14 }}>
                        Joignez votre image medicale *
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: 14 }}>
                        {safeRecommendation && (
                          <>
                            Pour l&apos;examen <strong>{safeRecommendation.model_name || ""}</strong>,
                            veuillez joindre l&apos;image medicale correspondante.
                          </>
                        )}
                      </p>

                      {/* CORRECTION : Afficher l'image du chat si deja jointe */}
                      {hasValidImage ? (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", background: "#EFF6FF",
                          border: "1.5px solid #BFDBFE", borderRadius: 10,
                          marginBottom: 14,
                        }}>
                          <Icon.Check />
                          <span style={{ fontSize: "0.75rem", color: "#1E40AF" }}>
                            <strong>{image.name}</strong> - Image medicale jointe lors du chat. Elle sera utilisee pour la consultation.
                          </span>
                        </div>
                      ) : (
                        <label style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center", gap: 10, padding: "32px",
                          border: "2px dashed #D4A500", borderRadius: 16,
                          background: "rgba(212,165,0,0.03)", cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                          onMouseEnter={(e) => { if (e?.currentTarget) e.currentTarget.style.background = "rgba(212,165,0,0.08)"; }}
                          onMouseLeave={(e) => { if (e?.currentTarget) e.currentTarget.style.background = "rgba(212,165,0,0.03)"; }}
                        >
                          <Icon.Stethoscope />
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontWeight: 600, color: "#0A1628", fontSize: "0.9rem" }}>
                              Cliquez pour selectionner votre image
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
                              Formats acceptes : JPG, PNG, WEBP - Taille max : 5 Mo
                            </div>
                          </div>
                          <input type="file" ref={chooseDoctorFileRef} accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                        </label>
                      )}

                      {/* Afficher le preview si image disponible */}
                      {imagePreview && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 16,
                          padding: "16px 20px", background: "#F0FDF4",
                          border: "1.5px solid #BBF7D0", borderRadius: 14,
                          marginTop: 14,
                        }}>
                          <img src={imagePreview} alt="preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "#059669", fontSize: "0.85rem" }}>
                              <Icon.Check /> Image prete a envoyer
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: 3 }}>{image?.name || "Image"}</div>
                          </div>
                          <button onClick={removeImage} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#EF4444", fontSize: "0.75rem", fontWeight: 600 }}>
                            Changer
                          </button>
                        </div>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep("confirm")}
                        disabled={!image}
                        style={{
                          width: "100%", marginTop: 18,
                          padding: "14px 24px", borderRadius: 14, border: "none",
                          background: !image ? "#F1F5F9" : "linear-gradient(135deg, #D4A500, #B8941E)",
                          color: !image ? "#94A3B8" : "white",
                          fontSize: "0.9rem", fontWeight: 700, cursor: !image ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                        }}
                      >
                        Verifier et envoyer la demande -&gt;
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Confirmation -- */}
        <AnimatePresence>
          {step === "confirm" && safeSelectedDoctor && safeRecommendation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: "white", borderRadius: 24,
                border: "1px solid #E5E7EB", padding: 28,
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0A1628", marginBottom: 20 }}>
                Recapitulatif de votre demande
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#F8FAFC", borderRadius: 14, border: "1px solid #F1F5F9" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: modelConfig.bg,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700,
                    color: modelConfig.color,
                  }}>
                    {modelConfig.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Examen recommande</div>
                    <div style={{ fontWeight: 700, color: "#0A1628" }}>{safeRecommendation.model_name || ""}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Confiance : {Math.round((safeRecommendation.confidence || 0) * 100)}%</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#F8FAFC", borderRadius: 14, border: "1px solid #F1F5F9" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "rgba(10,38,71,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "1.1rem", color: "#0A2647",
                  }}>
                    {String(safeSelectedDoctor.full_name || safeSelectedDoctor.name || "M").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Medecin selectionne</div>
                    <div style={{ fontWeight: 700, color: "#0A1628" }}>
                      Dr. {safeSelectedDoctor.full_name || safeSelectedDoctor.name || ""}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      {safeSelectedDoctor.specialty || safeSelectedDoctor.specialite || ""}
                    </div>
                  </div>
                </div>

                {imagePreview && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#F8FAFC", borderRadius: 14, border: "1px solid #F1F5F9" }}>
                    <img src={imagePreview} alt="preview" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10 }} />
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Image medicale</div>
                      <div style={{ fontWeight: 600, color: "#0A1628", fontSize: "0.85rem" }}>{image?.name || "Image"}</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep("choose_doctor")}
                  style={{
                    flex: 1, padding: "12px 20px", borderRadius: 12,
                    border: "1.5px solid #E5E7EB", background: "white",
                    color: "#0A1628", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  &lt;- Modifier
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitConsultation}
                  style={{
                    flex: 2, padding: "12px 20px", borderRadius: 12,
                    border: "none", background: "linear-gradient(135deg, #D4A500, #B8941E)",
                    color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    fontFamily: "inherit",
                  }}
                >
                  <Icon.Send />
                  Envoyer la demande au medecin
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Envoi en cours -- */}
        <AnimatePresence>
          {step === "submitting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: "white", borderRadius: 24, border: "1px solid #E5E7EB",
                padding: "48px 28px", textAlign: "center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <Icon.Loader />
              </div>
              <h3 style={{ fontWeight: 700, color: "#0A1628", marginBottom: 8 }}>Envoi en cours...</h3>
              <p style={{ color: "#64748B", fontSize: "0.85rem" }}>Votre demande est transmise au medecin.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Succes -- */}
        <AnimatePresence>
          {step === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
                borderRadius: 24, border: "1.5px solid #6EE7B7",
                padding: "40px 28px", textAlign: "center",
                boxShadow: "0 4px 24px rgba(16,185,129,0.1)",
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#10B981", margin: "0 auto 20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
              }}>
                <Icon.Check />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#065F46", marginBottom: 10 }}>
                Demande envoyee avec succes !
              </h2>
              <p style={{ color: "#064E3B", fontSize: "0.9rem", marginBottom: 24, lineHeight: 1.6 }}>
                Votre demande a ete transmise a <strong>Dr. {safeSelectedDoctor?.full_name || safeSelectedDoctor?.name || ""}</strong>.<br />
                Vous serez notifie des qu&apos;il l&apos;accepte et commence l&apos;analyse.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    const cid = createdConsultationId;
                    if (cid) navigate(`/patient/consultation/${cid}`);
                    else navigate("/patient");
                  }}
                  style={{
                    padding: "12px 24px", borderRadius: 12,
                    background: "#059669", color: "white", border: "none",
                    fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Voir mon dossier -&gt;
                </button>
                <button
                  onClick={() => navigate("/patient")}
                  style={{
                    padding: "12px 24px", borderRadius: 12,
                    background: "white", color: "#065F46",
                    border: "1.5px solid #6EE7B7",
                    fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Retour au tableau de bord
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
