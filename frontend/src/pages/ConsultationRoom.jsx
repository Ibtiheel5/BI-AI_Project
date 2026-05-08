// pages/ConsultationRoom.jsx
// Salle de consultation partagée : résultat IA + chat + RDV + transfert
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { predict } from "../services/api";
import "./patient/PatientDashboard.css";

const API = "http://localhost:8000/api/v1";

// SVG Icons
const Svg = ({ children, size = 24, color = "currentColor", sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const I = {
  Video: ({ size = 20 }) => (
    <Svg size={size}>
      <rect x="2" y="5" width="14" height="14" rx="2"/>
      <polyline points="16 9 22 5 22 19 16 15"/>
    </Svg>
  ),
  Calendar: ({ size = 20 }) => (
    <Svg size={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </Svg>
  ),
  Clock: ({ size = 20 }) => (
    <Svg size={size}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </Svg>
  ),
  User: ({ size = 20 }) => (
    <Svg size={size}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </Svg>
  ),
  Message: ({ size = 20 }) => (
    <Svg size={size}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </Svg>
  ),
  Brain: ({ size = 20 }) => (
    <Svg size={size}>
      <path d="M12 5a3.5 3.5 0 0 1 3.5 3.5c0 1.4-.8 2.5-1.8 3.2v2.3a1.8 1.8 0 0 1-3.4 0v-2.3c-1-.7-1.8-1.8-1.8-3.2A3.5 3.5 0 0 1 12 5z"/>
      <path d="M12 5v14"/>
    </Svg>
  ),
  Shield: ({ size = 20 }) => (
    <Svg size={size}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </Svg>
  ),
  Send: ({ size = 20 }) => (
    <Svg size={size}>
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </Svg>
  ),
  ArrowLeft: ({ size = 20 }) => (
    <Svg size={size}>
      <polyline points="15 18 9 12 15 6"/>
    </Svg>
  ),
  Check: ({ size = 20 }) => (
    <Svg size={size}>
      <polyline points="20 6 9 17 4 12"/>
    </Svg>
  ),
  X: ({ size = 20 }) => (
    <Svg size={size}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </Svg>
  ),
  Download: ({ size = 20 }) => (
    <Svg size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </Svg>
  ),
  Folder: ({ size = 20 }) => (
    <Svg size={size}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </Svg>
  ),
  ChevronRight: ({ size = 20 }) => (
    <Svg size={size} sw={2.5}>
      <polyline points="9 18 15 12 9 6"/>
    </Svg>
  ),
  Sparkles: ({ size = 20 }) => (
    <Svg size={size}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7z"/>
    </Svg>
  ),
};

const MODEL_META = {
  brain: { label: "IRM Cérébrale", icon: "🧠", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  lung:  { label: "Scanner CT",    icon: "🔬", color: "#EC4899", bg: "rgba(236,72,153,0.08)" },
  chest: { label: "Radio Thorax",  icon: "🫁", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
};

const PRED_SEVERITY = {
  glioma:           { label: "URGENCE NEURO",  color: "#EF4444", bg: "#FEE2E2" },
  malignant:        { label: "URGENCE ONCO",   color: "#EF4444", bg: "#FEE2E2" },
  COVID:            { label: "URGENCE VITALE", color: "#EF4444", bg: "#FEE2E2" },
  Pneumonia:        { label: "URGENCE VITALE", color: "#EF4444", bg: "#FEE2E2" },
  Pneumothorax:     { label: "URGENCE VITALE", color: "#EF4444", bg: "#FEE2E2" },
  Edema:            { label: "URGENCE VITALE", color: "#EF4444", bg: "#FEE2E2" },
  Mass:             { label: "URGENCE ONCO",   color: "#EF4444", bg: "#FEE2E2" },
  "Viral Pneumonia":{ label: "URGENCE VITALE", color: "#EF4444", bg: "#FEE2E2" },
  meningioma:       { label: "SURVEILLANCE",   color: "#F59E0B", bg: "#FEF3C7" },
  Cardiomegaly:     { label: "SURVEILLANCE",   color: "#F59E0B", bg: "#FEF3C7" },
  Emphysema:        { label: "SURVEILLANCE",   color: "#F59E0B", bg: "#FEF3C7" },
  Nodule:           { label: "BILAN COMPL.",   color: "#F59E0B", bg: "#FEF3C7" },
  pituitary:        { label: "SURVEILLANCE",   color: "#F59E0B", bg: "#FEF3C7" },
  Lung_Opacity:     { label: "SURVEILLANCE",   color: "#F59E0B", bg: "#FEF3C7" },
  notumor:          { label: "NORMAL",         color: "#10B981", bg: "#D1FAE5" },
  normal:           { label: "NORMAL",         color: "#10B981", bg: "#D1FAE5" },
  benign:           { label: "BENIN",          color: "#3B82F6", bg: "#EFF6FF" },
};

function authHeaders() {
  const token = localStorage.getItem("medai-token");
  return { Authorization: `Bearer ${token}` };
}

// ── Chat Message ────────────────────────────────────────────────────
function ChatMessage({ msg, isMe }) {
  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 12, gap: 8 }}>
      {!isMe && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0A2647,#2D5F9E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {msg.sender_role === "Patient" ? <I.User size={14} color="white" /> : <I.Shield size={14} color="white" />}
        </div>
      )}
      <div style={{ maxWidth: "72%" }}>
        {!isMe && <div style={{ fontSize: ".65rem", color: "#8899AA", marginBottom: 3 }}>{msg.sender_name}</div>}
        <div style={{
          padding: "10px 14px",
          background: isMe ? "linear-gradient(135deg,#0A1628,#13223E)" : "white",
          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          border: isMe ? "none" : "1px solid #E5E7EB",
          boxShadow: "0 2px 8px rgba(10,22,40,.05)",
        }}>
          <p style={{ margin: 0, fontSize: ".85rem", color: isMe ? "white" : "#0A1628", lineHeight: 1.6 }}>{msg.content}</p>
        </div>
        <div style={{ fontSize: ".6rem", color: "#8899AA", marginTop: 3, textAlign: isMe ? "right" : "left" }}>
          {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ── Analysis Result Panel ───────────────────────────────────────────
function AnalysisPanel({ analysis, modelKey, showGradcam, onToggleGradcam }) {
  const [showExplain, setShowExplain] = useState(false);
  if (!analysis) return null;

  const m = MODEL_META[modelKey] || MODEL_META.chest;
  const sev = PRED_SEVERITY[analysis.prediction] || { label: "ANALYSE", color: "#3B82F6", bg: "#EFF6FF" };
  const probs = JSON.parse(analysis.probabilities || "{}");
  const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxProb = sorted[0]?.[1] || 1;

  return (
    <div className="pd3-health-card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="pd3-health-bg-pattern"/>
      <div style={{ height: 3, background: `linear-gradient(90deg,${sev.color},${sev.color}80)` }} />
      <div className="pd3-health-content" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div className="pd3-section-badge" style={{ marginBottom: 8, display: "inline-flex" }}>RÉSULTAT IA</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A1628", textTransform: "capitalize" }}>{analysis.prediction}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: sev.color, lineHeight: 1 }}>{(analysis.confidence * 100).toFixed(1)}%</div>
            <div style={{ fontSize: ".65rem", color: "#8899AA" }}>confiance</div>
          </div>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: sev.bg, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: sev.color }} />
          <span style={{ fontSize: ".68rem", fontWeight: 700, color: sev.color }}>{sev.label}</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <motion.div 
              style={{ height: "100%", width: `${analysis.confidence * 100}%`, background: `linear-gradient(90deg,${sev.color},${sev.color}cc)`, borderRadius: 4 }}
              initial={{ width: 0 }}
              animate={{ width: `${analysis.confidence * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Distribution</div>
          {sorted.map(([cls, prob], i) => (
            <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: ".7rem", color: "#8899AA", width: 16 }}>{i+1}</span>
              <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,0.7)", flex: 1, textTransform: "capitalize" }}>{cls}</span>
              <div style={{ width: 80, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                <motion.div 
                  style={{ height: "100%", width: `${(prob/maxProb)*100}%`, background: i === 0 ? sev.color : "rgba(255,255,255,0.2)", borderRadius: 3 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(prob/maxProb)*100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
              <span style={{ fontSize: ".72rem", fontWeight: 700, color: i === 0 ? sev.color : "rgba(255,255,255,0.5)", width: 40, textAlign: "right" }}>
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {analysis.gradcam_b64 && (
          <button onClick={onToggleGradcam} className="pd3-btn pd3-btn-outline" style={{ width: "100%", marginBottom: 10, padding: "8px 14px", background: showGradcam ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.05)", borderColor: showGradcam ? "#FCA5A5" : "rgba(255,255,255,0.1)", color: showGradcam ? "#EF4444" : "rgba(255,255,255,0.7)" }}>
            {showGradcam ? "Image originale" : "Voir Grad-CAM"}
          </button>
        )}

        {analysis.explain_text && (
          <>
            <button onClick={() => setShowExplain(!showExplain)} className="pd3-btn pd3-btn-outline" style={{ width: "100%", marginBottom: 10, padding: "8px 14px", background: showExplain ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.05)", borderColor: showExplain ? "#C4B5FD" : "rgba(255,255,255,0.1)", color: showExplain ? "#8B5CF6" : "rgba(255,255,255,0.7)" }}>
              <I.Brain size={16} /> {showExplain ? "Masquer" : "Voir"} l'explication clinique
            </button>

            {showExplain && (
              <div style={{ marginTop: 12, padding: "14px", background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1px solid rgba(232,184,48,0.1)", fontSize: ".78rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, maxHeight: 280, overflowY: "auto" }}>
                {analysis.explain_text.split("\n").map((line, i) => (
                  line.startsWith("## ") ? (
                    <div key={i} style={{ fontWeight: 700, color: "#FFD700", marginTop: 12, marginBottom: 4, fontSize: ".82rem" }}>
                      {line.replace("## ", "")}
                    </div>
                  ) : (
                    <p key={i} style={{ margin: "0 0 4px" }}>{line}</p>
                  )
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══ MAIN COMPONENT ══════════════════════════════════════════════════
export default function ConsultationRoom() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("analysis");
  const [messages,     setMessages]     = useState([]);
  const [msgInput,     setMsgInput]     = useState("");
  const [sendingMsg,   setSendingMsg]   = useState(false);
  const [showGradcam,  setShowGradcam]  = useState(false);
  const [explainText,  setExplainText]  = useState("");
  const [explaining,   setExplaining]   = useState(false);
  const [running,      setRunning]      = useState(false);
  const [toast,        setToast]        = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRdv,      setShowRdv]      = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [customVideoLink, setCustomVideoLink] = useState("");
  const [doctors,      setDoctors]      = useState([]);
  const [canJoin,      setCanJoin]      = useState(false);
  const [rdvForm,      setRdvForm]      = useState({ type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" });
  const [transferForm, setTransferForm] = useState({ to_doctor_id: "", reason: "" });
  const chatEndRef = useRef(null);
  const pollRef    = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/consultations/${id}`, { headers: authHeaders() });
      if (!res.ok) { if (res.status === 404) navigate("/"); return; }
      const json = await res.json();
      setData(json);
      setMessages(json.messages || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 8000);
    return () => clearInterval(pollRef.current);
  }, [fetchData]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const appointment = data?.appointment;
    if (appointment && appointment.status === "accepted" && appointment.scheduled_at) {
      const checkTime = () => {
        const appointmentTime = new Date(appointment.scheduled_at);
        const now = new Date();
        setCanJoin(appointmentTime <= now);
      };
      checkTime();
      const interval = setInterval(checkTime, 60000);
      return () => clearInterval(interval);
    }
  }, [data?.appointment]);

  const joinVideoCall = useCallback(() => {
    if (data?.appointment?.video_link && data.appointment.video_link.trim()) {
      window.open(data.appointment.video_link, "_blank");
    } else {
      setShowJoinModal(true);
    }
  }, [data?.appointment]);

  const runAnalysis = async () => {
    if (!data?.consultation) return;
    const c = data.consultation;
    if (c.status !== "accepted") { showToast("La consultation doit être acceptée d'abord.", "error"); return; }

    setRunning(true); setExplainText(""); setExplaining(true);

    try {
      const imgRes = await fetch(`http://localhost:8000/${c.image_path.replace(/\\/g, "/")}`, { headers: authHeaders() });
      if (!imgRes.ok) throw new Error("Image introuvable sur le serveur.");
      const blob = await imgRes.blob();
      const file = new File([blob], "image.jpg", { type: blob.type });

      let predResult = null;
      let fullExplain = "";

      await predict(file, c.model_key, true, {
        onPrediction: (p) => { predResult = p; setRunning(false); },
        onChunk:  (t) => { fullExplain += t; setExplainText(prev => prev + t); },
        onError:  (e) => { console.error(e); setExplaining(false); },
        onDone:   () => { setExplaining(false); },
      });

      if (!predResult) throw new Error("Aucun résultat reçu.");

      const form = new FormData();
      form.append("prediction",    predResult.prediction);
      form.append("confidence",    predResult.confidence);
      form.append("probabilities", JSON.stringify(predResult.probabilities || {}));
      form.append("explain_text",  fullExplain);
      form.append("gradcam_b64",   predResult.gradcam_image || "");
      form.append("out_of_domain", predResult.out_of_domain ? "true" : "false");
      form.append("warning",       predResult.warning || "");

      const saveRes = await fetch(`${API}/consultations/${id}/analysis`, {
        method: "POST", headers: authHeaders(), body: form,
      });
      if (!saveRes.ok) throw new Error((await saveRes.json()).detail);

      showToast("Analyse enregistrée et visible par le patient.");
      await fetchData();

    } catch (e) {
      showToast("Erreur: " + e.message, "error");
      setRunning(false); setExplaining(false);
    }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}/consultations/${id}/messages`, {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setMsgInput("");
      await fetchData();
    } catch (e) { showToast("Erreur: " + e.message, "error"); }
    finally { setSendingMsg(false); }
  };

  const createRdv = async () => {
    try {
      const res = await fetch(`${API}/consultations/appointments`, {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: parseInt(id), ...rdvForm, duration_minutes: parseInt(rdvForm.duration_minutes) }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      showToast(`Rendez-vous ${rdvForm.type === "video" ? "vidéo" : "présentiel"} créé !`);
      setShowRdv(false);
      await fetchData();
    } catch (e) { showToast("Erreur: " + e.message, "error"); }
  };

  const doTransfer = async () => {
    if (!transferForm.to_doctor_id) { showToast("Sélectionnez un médecin.", "error"); return; }
    try {
      const res = await fetch(`${API}/consultations/${id}/transfer`, {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ to_doctor_id: parseInt(transferForm.to_doctor_id), reason: transferForm.reason }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      showToast("Dossier transféré avec succès.");
      setShowTransfer(false);
      navigate("/doctor/queue");
    } catch (e) { showToast("Erreur: " + e.message, "error"); }
  };

  const acceptAppointment = async (appointmentId) => {
    const token = localStorage.getItem("medai-token");
    try {
      const res = await fetch(`${API}/consultations/appointments/${appointmentId}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Rendez-vous accepté !");
        fetchData();
      } else {
        showToast("Erreur lors de l'acceptation", "error");
      }
    } catch (err) {
      showToast("Erreur réseau", "error");
    }
  };

  const rejectAppointment = async (appointmentId) => {
    const token = localStorage.getItem("medai-token");
    try {
      const res = await fetch(`${API}/consultations/appointments/${appointmentId}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Rendez-vous refusé");
        fetchData();
      } else {
        showToast("Erreur lors du refus", "error");
      }
    } catch (err) {
      showToast("Erreur réseau", "error");
    }
  };

  useEffect(() => {
    if (!showTransfer) return;
    fetch(`${API}/doctors?model=${data?.consultation?.model_key || "chest"}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setDoctors(d.doctors || []))
      .catch(() => {});
  }, [showTransfer, data?.consultation?.model_key]);

  if (loading) return (
    <div className="pd3" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: 20 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <I.Sparkles size={48} color="#D4A500"/>
        </motion.div>
        <p style={{ color: "var(--txt2)", fontWeight: 500 }}>Chargement de la consultation...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { consultation: c, analysis, appointment } = data;
  const m = MODEL_META[c.model_key] || MODEL_META.chest;
  const isDoctor  = user?.role === "Medecin" || user?.is_admin;
  const isPatient = user?.role === "Patient";
  const canChat   = ["accepted", "analyzed"].includes(c.status);
  const sev       = analysis ? (PRED_SEVERITY[analysis.prediction] || { label: "ANALYSE", color: "#3B82F6", bg: "#EFF6FF" }) : null;

  return (
    <div className="pd3">
      {/* Header Navigation */}
      <motion.nav className="pd3-nav scrolled" style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(244,247,252,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid var(--border)" }}>
        <div className="pd3-nav-brand" onClick={() => navigate(isDoctor ? "/home" : "/patient")}>
          <div className="pd3-nav-logo"><div className="pd3-nav-logo-inner">🏥</div></div>
          <span className="pd3-nav-name">Med<span className="accent">AI</span></span>
        </div>
        <div className="pd3-nav-links">
          <button className="pd3-nav-link active" style={{ background: "none", border: "none", cursor: "pointer" }}>Consultation #{c.id}</button>
        </div>
        <div className="pd3-nav-actions">
          <button className="pd3-btn pd3-btn-outline pd3-btn-sm" onClick={() => navigate(isDoctor ? "/home" : "/patient")}>
            <I.ArrowLeft size={15} /> Retour
          </button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="pd3-body" style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        
        {/* Header Info Card */}
        <div className="pd3-health-card" style={{ marginBottom: 24, padding: "20px 28px" }}>
          <div className="pd3-health-bg-pattern"/>
          <div className="pd3-health-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>{m.icon}</div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{m.label}</div>
                <div style={{ fontSize: ".75rem", color: "rgba(255,255,255,0.5)" }}>
                  {isDoctor ? `Patient: ${c.patient_name}` : `Médecin: ${c.doctor_name || "En attente"}`}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {sev && c.status === "analyzed" && (
                <span className="pd3-badge" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
              )}
              <StatusBadge status={c.status} />
              {isDoctor && c.status === "accepted" && (
                <button onClick={runAnalysis} disabled={running} className="pd3-btn pd3-btn-gold pd3-btn-sm" style={{ background: running ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #D4A500, #B8941E)", color: running ? "rgba(255,255,255,0.5)" : "#0A1628" }}>
                  {running ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#0A1628", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite", marginRight: 8 }} /> Analyse...</> : <><I.Brain size={14} /> Lancer l'analyse IA</>}
                </button>
              )}
              {isDoctor && c.status === "analyzed" && (
                <>
                  <button onClick={() => setShowRdv(true)} className="pd3-btn pd3-btn-gold pd3-btn-sm">
                    <I.Calendar size={14} /> Planifier RDV
                  </button>
                  <button onClick={() => setShowTransfer(true)} className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
                    <I.Shield size={14} /> Transférer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pd3-tabs" style={{ marginBottom: 24 }}>
          {[
            { key: "analysis", label: "Résultat IA", icon: <I.Brain size={16} />, show: true },
            { key: "image",    label: "Image", icon: <I.Folder size={16} />, show: true },
            { key: "chat",     label: `Chat (${messages.length})`, icon: <I.Message size={16} />, show: canChat },
            { key: "rdv",      label: "Rendez-vous", icon: <I.Calendar size={16} />, show: !!appointment },
          ].filter(t => t.show).map(t => (
            <button key={t.key} className={`pd3-tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
              <span className="pd3-tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          
          {/* Left Column */}
          <div>
            {/* Analysis Tab */}
            {activeTab === "analysis" && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {!analysis ? (
                  <div className="pd3-health-card" style={{ textAlign: "center", padding: "60px 40px" }}>
                    <div className="pd3-health-bg-pattern"/>
                    <div className="pd3-health-content">
                      {c.status === "pending" && (
                        <>
                          <I.Clock size={48} color="rgba(255,255,255,0.3)" />
                          <div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginTop: 16, marginBottom: 8 }}>En attente d'un médecin</div>
                          <div style={{ fontSize: ".85rem", color: "rgba(255,255,255,0.4)" }}>L'analyse démarrera après acceptation d'un médecin.</div>
                        </>
                      )}
                      {c.status === "accepted" && isDoctor && (
                        <>
                          <I.Brain size={48} color="rgba(255,255,255,0.3)" />
                          <div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginTop: 16, marginBottom: 8 }}>Prêt pour l'analyse</div>
                          <div style={{ fontSize: ".85rem", color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Cliquez sur "Lancer l'analyse IA" pour démarrer.</div>
                          <button onClick={runAnalysis} disabled={running} className="pd3-btn pd3-btn-gold">
                            <I.Brain size={16} /> Lancer l'analyse IA
                          </button>
                        </>
                      )}
                      {c.status === "accepted" && isPatient && (
                        <>
                          <I.Clock size={48} color="rgba(255,255,255,0.3)" />
                          <div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginTop: 16, marginBottom: 8 }}>Votre médecin prépare l'analyse</div>
                          <div style={{ fontSize: ".85rem", color: "rgba(255,255,255,0.4)" }}>Vous serez notifié dès que les résultats seront disponibles.</div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <AnalysisPanel analysis={analysis} modelKey={c.model_key} showGradcam={showGradcam} onToggleGradcam={() => setShowGradcam(!showGradcam)} />
                )}
              </motion.div>
            )}

            {/* Image Tab */}
            {activeTab === "image" && c.image_path && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="pd3-health-card" style={{ padding: 20 }}>
                  <div className="pd3-health-bg-pattern"/>
                  <div className="pd3-health-content">
                    <div style={{ borderRadius: 12, overflow: "hidden", background: "#0A1628", marginBottom: 12 }}>
                      <img 
                        src={`http://localhost:8000/${c.image_path.replace(/\\/g, "/")}`} 
                        alt="Image médicale" 
                        style={{ width: "100%", maxHeight: 450, objectFit: "contain", display: "block" }} 
                        onError={e => e.target.style.display = "none"} 
                      />
                    </div>
                    <div style={{ fontSize: ".75rem", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                      {m.icon} {m.label} · {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="pd3-health-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div className="pd3-health-bg-pattern"/>
                  <div className="pd3-health-content" style={{ padding: 0 }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(232,184,48,0.1)", background: "rgba(0,0,0,0.2)" }}>
                      <div className="pd3-section-row-title" style={{ color: "#FFD700" }}>
                        <I.Message size={16} /> Discussion · {messages.length} message{messages.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ padding: "20px", minHeight: 400, maxHeight: 450, overflowY: "auto" }}>
                      {messages.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)" }}>
                          <I.Message size={48} color="rgba(255,255,255,0.2)" />
                          <div style={{ marginTop: 12, fontSize: ".9rem", fontWeight: 600 }}>Aucun message</div>
                          <div style={{ marginTop: 4, fontSize: ".8rem" }}>Commencez la discussion avec le médecin</div>
                        </div>
                      ) : (
                        messages.map(msg => <ChatMessage key={msg.id} msg={msg} isMe={msg.sender_id === user?.id} />)
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(232,184,48,0.1)", display: "flex", gap: 12, background: "rgba(0,0,0,0.1)" }}>
                      <textarea
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder="Écrivez votre message... (Entrée pour envoyer)"
                        rows={2}
                        style={{
                          flex: 1,
                          padding: "12px 16px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 12,
                          fontSize: ".85rem",
                          color: "#fff",
                          fontFamily: "inherit",
                          resize: "none",
                          outline: "none",
                        }}
                      />
                      <button 
                        onClick={sendMessage} 
                        disabled={!msgInput.trim() || sendingMsg} 
                        className="pd3-btn pd3-btn-gold" 
                        style={{ width: 52, height: 52, padding: 0, borderRadius: 12 }}
                      >
                        {sendingMsg ? "..." : <I.Send size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RDV Tab */}
            {activeTab === "rdv" && appointment && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="pd3-health-card">
                  <div className="pd3-health-bg-pattern"/>
                  <div className="pd3-health-content">
                    <div className="pd3-section-row-title" style={{ marginBottom: 16, color: "#FFD700" }}>
                      <I.Calendar size={16} /> RENDEZ-VOUS {appointment.status === "accepted" ? "CONFIRMÉ" : appointment.status === "pending" ? "EN ATTENTE" : "PLANIFIÉ"}
                    </div>
                    
                    <div style={{ marginBottom: 20 }}>
                      {[
                        ["Type", appointment.type === "video" ? "Vidéo consultation" : "Présentiel"],
                        ["Date", new Date(appointment.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })],
                        ["Heure", new Date(appointment.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })],
                        ["Durée", `${appointment.duration_minutes || 30} minutes`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,0.5)" }}>{l}</span>
                          <span style={{ fontSize: ".85rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    
                    {appointment.status === "accepted" && canJoin && (
                      <button onClick={joinVideoCall} className="pd3-btn pd3-btn-gold" style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <I.Video size={18} /> Rejoindre l'appel vidéo
                      </button>
                    )}
                    
                    {appointment.status === "accepted" && !canJoin && (
                      <div style={{ padding: "12px", background: "rgba(245,158,11,0.1)", borderRadius: 12, textAlign: "center", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <I.Clock size={16} color="#F59E0B" /> Le rendez-vous débutera à {new Date(appointment.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                    
                    {appointment.status === "pending" && isPatient && (
                      <div style={{ padding: "16px", background: "rgba(245,158,11,0.1)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.2)", textAlign: "center" }}>
                        <div style={{ marginBottom: 12 }}><I.Clock size={20} color="#F59E0B" /> En attente de votre confirmation</div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => acceptAppointment(appointment.id)} className="pd3-btn pd3-btn-gold" style={{ flex: 1, background: "#10B981" }}>
                            <I.Check size={14} /> Accepter
                          </button>
                          <button onClick={() => rejectAppointment(appointment.id)} className="pd3-btn pd3-btn-outline" style={{ flex: 1, color: "#EF4444", borderColor: "#FCA5A5" }}>
                            <I.X size={14} /> Refuser
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="pd3-health-card">
              <div className="pd3-health-bg-pattern"/>
              <div className="pd3-health-content">
                <div className="pd3-section-row-title" style={{ marginBottom: 16, color: "#FFD700" }}>
                  <I.User size={16} /> RÉSUMÉ CONSULTATION
                </div>
                {[
                  ["Référence", `#${c.id}`],
                  ["Type", m.label],
                  [isDoctor ? "Patient" : "Médecin", isDoctor ? c.patient_name : (c.doctor_name || "En attente")],
                  ["Urgence", c.urgency === "critical" ? "Critique" : c.urgency === "urgent" ? "Urgent" : "Normal"],
                  ["Date", new Date(c.created_at).toLocaleDateString("fr-FR")],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ fontSize: ".75rem", color: "rgba(255,255,255,0.5)" }}>{l}</span>
                    <span style={{ fontSize: ".8rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {appointment && appointment.status === "accepted" && canJoin && (
              <div className="pd3-health-card">
                <div className="pd3-health-bg-pattern"/>
                <div className="pd3-health-content">
                  <button onClick={joinVideoCall} className="pd3-btn pd3-btn-gold" style={{ width: "100%", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <I.Video size={18} /> Rejoindre l'appel vidéo
                  </button>
                </div>
              </div>
            )}

            {c.patient_notes && (
              <div className="pd3-health-card">
                <div className="pd3-health-bg-pattern"/>
                <div className="pd3-health-content">
                  <div className="pd3-section-row-title" style={{ marginBottom: 12, color: "#FFD700" }}>NOTE DU PATIENT</div>
                  <p style={{ fontSize: ".8rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>"{c.patient_notes}"</p>
                </div>
              </div>
            )}

            {c.doctor_notes && (
              <div className="pd3-health-card" style={{ background: "rgba(59,130,246,0.1)" }}>
                <div className="pd3-health-content">
                  <div className="pd3-section-row-title" style={{ marginBottom: 12, color: "#3B82F6" }}>NOTE DU MÉDECIN</div>
                  <p style={{ fontSize: ".8rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: 0 }}>{c.doctor_notes}</p>
                </div>
              </div>
            )}

            {analysis && (
              <AnalysisPanel analysis={analysis} modelKey={c.model_key} showGradcam={showGradcam} onToggleGradcam={() => setShowGradcam(!showGradcam)} />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Modal RDV */}
        {showRdv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 500, width: "100%" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A1628", marginBottom: 20 }}>Planifier un rendez-vous</h2>
              
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {[{ key: "video", label: "Vidéo" }, { key: "presentiel", label: "Présentiel" }].map(t => (
                  <button key={t.key} onClick={() => setRdvForm(f => ({ ...f, type: t.key }))} style={{
                    flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${rdvForm.type === t.key ? "#D4A500" : "#E5E7EB"}`, background: rdvForm.type === t.key ? "rgba(212,165,0,0.08)" : "#fff", fontWeight: 600, cursor: "pointer"
                  }}>{t.label}</button>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Date et heure *</label>
                <input type="datetime-local" value={rdvForm.scheduled_at} onChange={e => setRdvForm(f => ({ ...f, scheduled_at: e.target.value }))} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #E5E7EB", fontSize: ".9rem", outline: "none" }} />
              </div>

              {rdvForm.type === "video" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>
                    Lien de la réunion (optionnel)
                  </label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input 
                      value={rdvForm.video_link} 
                      onChange={e => setRdvForm(f => ({ ...f, video_link: e.target.value }))} 
                      placeholder="https://meet.google.com/xxx ou https://meet.jit.si/medai-xxx"
                      style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E5E7EB", fontSize: ".9rem", outline: "none" }} 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const roomId = `medai-${c.id}-${Date.now().toString(36)}`;
                        const defaultLink = `https://meet.jit.si/${roomId}`;
                        setRdvForm(f => ({ ...f, video_link: defaultLink }));
                      }}
                      style={{ padding: "12px 16px", background: "#EFF6FF", borderRadius: 12, border: "1px solid #BFDBFE", cursor: "pointer", fontSize: ".8rem", fontWeight: 500, color: "#3B82F6" }}
                    >
                      Générer Jitsi
                    </button>
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#94A3B8", marginTop: 6 }}>
                    Laissez vide pour que le patient entre son propre lien
                  </div>
                </div>
              )}

              {rdvForm.type === "presentiel" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Adresse</label>
                  <input value={rdvForm.location} onChange={e => setRdvForm(f => ({ ...f, location: e.target.value }))} placeholder="Adresse du cabinet" style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #E5E7EB", fontSize: ".9rem", outline: "none" }} />
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button onClick={() => setShowRdv(false)} className="pd3-btn pd3-btn-outline" style={{ flex: 1 }}>Annuler</button>
                <button onClick={createRdv} disabled={!rdvForm.scheduled_at} className="pd3-btn pd3-btn-gold" style={{ flex: 2 }}>Confirmer</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Rejoindre - patient entre son lien */}
        {showJoinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 500, width: "100%" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A1628", marginBottom: 8 }}>Rejoindre l'appel vidéo</h2>
              <p style={{ fontSize: ".85rem", color: "#64748B", marginBottom: 20 }}>Entrez le lien de la réunion fourni par votre médecin</p>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Lien de la réunion</label>
                <input 
                  type="text" 
                  value={customVideoLink} 
                  onChange={e => setCustomVideoLink(e.target.value)} 
                  placeholder="https://meet.google.com/xxx ou https://meet.jit.si/xxx"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E5E7EB", fontSize: ".9rem", outline: "none" }}
                />
                <div style={{ fontSize: ".65rem", color: "#94A3B8", marginTop: 6 }}>
                  Exemple: https://meet.jit.si/medai-consultation-123
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => { setShowJoinModal(false); setCustomVideoLink(""); }} className="pd3-btn pd3-btn-outline" style={{ flex: 1 }}>Annuler</button>
                <button 
                  onClick={() => { 
                    if (customVideoLink.trim()) {
                      window.open(customVideoLink.trim(), "_blank");
                      setShowJoinModal(false);
                      setCustomVideoLink("");
                    } else {
                      alert("Veuillez entrer un lien valide");
                    }
                  }} 
                  className="pd3-btn pd3-btn-gold" 
                  style={{ flex: 1 }}
                  disabled={!customVideoLink.trim()}
                >
                  Rejoindre
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Transfert */}
        {showTransfer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 500, width: "100%" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A1628", marginBottom: 20 }}>Transférer le dossier</h2>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Médecin destinataire *</label>
                <select value={transferForm.to_doctor_id} onChange={e => setTransferForm(f => ({ ...f, to_doctor_id: e.target.value }))} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #E5E7EB", fontSize: ".9rem", outline: "none" }}>
                  <option value="">Sélectionner un médecin...</option>
                  {doctors.filter(d => d.id !== user?.id).map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.specialite}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: ".75rem", fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Motif</label>
                <textarea value={transferForm.reason} onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))} rows={3} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #E5E7EB", fontSize: ".85rem", resize: "none", outline: "none" }} />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setShowTransfer(false)} className="pd3-btn pd3-btn-outline" style={{ flex: 1 }}>Annuler</button>
                <button onClick={doTransfer} className="pd3-btn pd3-btn-gold" style={{ flex: 2 }}>Confirmer le transfert</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: 12, background: toast.type === "error" ? "#EF4444" : "#10B981", color: "white", fontSize: ".85rem", fontWeight: 500, zIndex: 9999, whiteSpace: "nowrap" }}>
          {toast.msg}
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// StatusBadge component
const StatusBadge = ({ status }) => {
  const cfg = { 
    pending: { label: "En attente", color: "#F59E0B", bg: "#FFFBEB" },
    accepted: { label: "En cours", color: "#3B82F6", bg: "#EFF6FF" },
    analyzed: { label: "Analysée", color: "#10B981", bg: "#ECFDF5" },
    closed: { label: "Clôturée", color: "#6B7280", bg: "#F9FAFB" },
    rejected: { label: "Rejetée", color: "#EF4444", bg: "#FEE2E2" },
  };
  const s = cfg[status] || cfg.pending;
  return <span className="pd3-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
};