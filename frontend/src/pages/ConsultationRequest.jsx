// pages/ConsultationRequest.jsx
// Patient soumet une demande de consultation avec image médicale
// Style premium identique à PatientDashboard

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import "./patient/PatientDashboard.css";

const API = "http://localhost:8000/api/v1";

// Configuration médicale détaillée par spécialité (4 modèles)
const MODEL_OPTIONS = [
  {
    key: "chest",
    icon: "🫁",
    label: "Radiographie thoracique",
    fullName: "Radiographie Pulmonaire Standard",
    desc: "10 pathologies — COVID, pneumonie, cardiomégalie, atélectasie…",
    color: "#2D5F9E",
    gradient: "linear-gradient(135deg, #2D5F9E, #0EA5E9)",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    specialties: ["Pneumologie", "Cardiologie", "Radiologie"],
    pathologies: ["Pneumonie", "COVID-19", "Cardiomégalie", "Pneumothorax", "Épanchement pleural"],
    urgencyCriteria: ["Pneumothorax", "Œdème pulmonaire aigu"],
    preparation: "Aucune préparation nécessaire.",
    contraindications: "Grossesse (protection plomb requise)."
  },
  {
    key: "brain",
    icon: "🧠",
    label: "IRM cérébrale",
    fullName: "Imagerie par Résonance Magnétique Cérébrale",
    desc: "Tumeurs cérébrales — gliome, méningiome, tumeur hypophysaire",
    color: "#6B4FA0",
    gradient: "linear-gradient(135deg, #6B4FA0, #8B5CF6)",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    specialties: ["Neurologie", "Neurochirurgie", "Neuroradiologie"],
    pathologies: ["Gliome", "Méningiome", "Tumeur hypophysaire", "Métastases cérébrales"],
    urgencyCriteria: ["Glioblastome", "Métastases cérébrales"],
    preparation: "Retirez tout objet métallique.",
    contraindications: "Implants métalliques, pacemaker."
  },
  {
    key: "lung",
    icon: "🔬",
    label: "Scanner CT pulmonaire",
    fullName: "Tomodensitométrie Thoracique",
    desc: "Cancer pulmonaire — bénin, malin, normal",
    color: "#DC2626",
    gradient: "linear-gradient(135deg, #DC2626, #EF4444)",
    bg: "#FEF2F2",
    border: "#FECACA",
    specialties: ["Pneumologie", "Oncologie", "Radiologie"],
    pathologies: ["Carcinome épidermoïde", "Adénocarcinome", "Nodule bénin", "Métastases"],
    urgencyCriteria: ["Carcinome à petites cellules", "Masse > 3cm"],
    preparation: "Jeûne de 4 heures recommandé.",
    contraindications: "Insuffisance rénale, allergie à l'iode."
  },
  {
    key: "retina",
    icon: "👁️",
    label: "Fond d'œil — Rétinopathie",
    fullName: "Photographie du fond d'œil — Rétinopathie diabétique",
    desc: "5 stades de rétinopathie diabétique",
    color: "#0E7490",
    gradient: "linear-gradient(135deg, #0E7490, #14B8A6)",
    bg: "#ECFEFF",
    border: "#67E8F9",
    specialties: ["Ophtalmologie", "Endocrinologie", "Radiologie"],
    pathologies: ["Grade 0 — No DR", "Grade 1 — Mild DR", "Grade 2 — Moderate DR", "Grade 3 — Severe DR", "Grade 4 — Proliferate DR"],
    urgencyCriteria: ["Proliferate_DR", "Hémorragie vitréenne"],
    preparation: "Dilatation pupillaire recommandée.",
    contraindications: "Glaucome aigu à angle fermé."
  }
];

const LEGAL_INFO = {
  dataRetention: "Vos images médicales sont conservées conformément à la réglementation RGPD pendant 10 ans.",
  emergencyDisclaimer: "En cas d'urgence médicale, composez le 15 (SAMU) immédiatement."
};

// Icônes SVG
const Icons = {
  Upload: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M20.5 14.5v3.8a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8v-3.8"/>
      <polyline points="16.5 8 12 3.5 7.5 8"/>
      <line x1="12" y1="3.5" x2="12" y2="14.5"/>
    </svg>
  ),
  Folder: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M21.5 18.5a1.8 1.8 0 0 1-1.8 1.8H4.3a1.8 1.8 0 0 1-1.8-1.8V5.5a1.8 1.8 0 0 1 1.8-1.8h5l2 2.8h7.2a1.8 1.8 0 0 1 1.8 1.8z"/>
    </svg>
  ),
  Check: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ArrowRight: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ArrowLeft: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  AlertCircle: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9.5"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <circle cx="12" cy="16" r="0.5" fill={color}/>
    </svg>
  ),
  Sparkles: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7z"/>
    </svg>
  ),
  Activity: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  User: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M19.5 20.5v-1.8a3.6 3.6 0 0 0-3.6-3.6H8.1a3.6 3.6 0 0 0-3.6 3.6v1.8"/>
      <circle cx="12" cy="7.5" r="3.6"/>
    </svg>
  ),
  Lungs: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M12 4.5v11M8.5 8c-1.8 0-3.5.8-3.5 3.5S7 16 8.5 16M15.5 8c1.8 0 3.5.8 3.5 3.5S17 16 15.5 16M8.5 8c1.2 0 2.5.8 3.5 2M15.5 8c-1.2 0-2.5.8-3.5 2"/>
    </svg>
  ),
  Shield: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Heart: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  )
};

const Particles = () => {
  const particles = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`,
    height: `${Math.random() * 3 + 1}px`, duration: `${Math.random() * 14 + 8}s`,
    delay: `${Math.random() * 8}s`, bottom: `-${Math.random() * 40}px`,
    glow: i % 5 === 0
  })), []);
  return (
    <div className="pd3-hero-particles" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {particles.map(p => (
        <div key={p.id} className="pd3-particle" style={{
          left: p.left, width: p.width, height: p.height,
          animationDuration: p.duration, animationDelay: p.delay,
          bottom: p.bottom, boxShadow: p.glow ? '0 0 10px rgba(255,215,0,0.6)' : 'none'
        }} />
      ))}
    </div>
  );
};

const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 35 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default function ConsultationRequest() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedModel, setModel] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageQuality, setImageQuality] = useState(null);

  const fileRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "Patient")) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const analyzeImageQuality = useCallback((imgElement) => {
    const quality = {
      resolution: `${imgElement.width}x${imgElement.height}`,
      isAdequate: imgElement.width >= 300 && imgElement.height >= 300,
      suggestions: []
    };
    if (imgElement.width < 300 || imgElement.height < 300) {
      quality.suggestions.push("Résolution faible, privilégiez une image plus grande (min 300x300px)");
      quality.isAdequate = false;
    }
    setImageQuality(quality);
    return quality;
  }, []);

  const handleFile = useCallback((f) => {
    if (!f) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type)) {
      setError("Format non supporté. Utilisez JPEG ou PNG uniquement.");
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setError("Fichier trop volumineux. Taille maximale : 10 Mo.");
      return;
    }

    const objectUrl = URL.createObjectURL(f);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width < 100 || img.height < 100) {
        setError("L'image est trop petite. Dimensions minimales : 100x100 pixels.");
        return;
      }
      analyzeImageQuality(img);
      setFile(f);
      setPreview(objectUrl);
      setError("");
      setUploadProgress(0);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Fichier image invalide ou corrompu.");
    };
    
    img.src = objectUrl;
  }, [analyzeImageQuality]);

  const validateMedicalForm = () => {
    if (!symptoms.trim()) {
      setError("Veuillez décrire vos symptômes principaux");
      return false;
    }
    if (symptoms.length < 10) {
      setError("La description des symptômes est trop courte (minimum 10 caractères)");
      return false;
    }
    if (!consentAccepted) {
      setError("Vous devez accepter les conditions de traitement des données médicales");
      return false;
    }
    return true;
  };

  const buildMedicalNotes = () => {
    const sections = [];
    if (symptoms) sections.push(`SYMPTÔMES: ${symptoms}`);
    if (duration) sections.push(`DURÉE: ${duration}`);
    if (medicalHistory) sections.push(`ANTÉCÉDENTS: ${medicalHistory}`);
    if (currentMedications) sections.push(`TRAITEMENTS: ${currentMedications}`);
    if (allergies) sections.push(`ALLERGIES: ${allergies}`);
    if (notes) sections.push(`NOTES: ${notes}`);
    return sections.join("\n\n");
  };

  const handleSubmit = async () => {
    if (!file || !selectedModel) {
      setError("Veuillez sélectionner un type d'examen et une image.");
      return;
    }
    if (!validateMedicalForm()) return;

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("medai-token");
      if (!token) throw new Error("Session expirée.");

      const form = new FormData();
      form.append("file", file);
      form.append("model_key", selectedModel.key);
      form.append("patient_notes", buildMedicalNotes());

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
      }, 200);

      const res = await fetch(`${API}/consultations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur ${res.status}`);
      }

      const data = await res.json();
      setResult({ ...data, consultation_id: data.consultation_id, model: selectedModel });
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const resetForm = () => {
    setStep(1);
    setModel(null);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSymptoms("");
    setDuration("");
    setMedicalHistory("");
    setCurrentMedications("");
    setAllergies("");
    setNotes("");
    setConsentAccepted(false);
    setResult(null);
    setError("");
    setImageQuality(null);
  };

  if (authLoading) {
    return (
      <div className="pd3" style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: 20 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
            <Icons.Sparkles size={48} color="var(--gold-bright)" />
          </motion.div>
          <p style={{ color: "var(--txt2)", fontWeight: 500 }}>Chargement de l'interface médicale...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "Patient") return null;

  return (
    <div className="pd3" style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      
      {/* ========== HERO SECTION PREMIUM ========== */}
      <section className="pd3-hero" style={{ minHeight: "40vh", position: "relative" }}>
        <div className="pd3-hero-grid" />
        <div className="pd3-hero-orb pd3-hero-orb-1" />
        <div className="pd3-hero-orb pd3-hero-orb-2" />
        <div className="pd3-hero-orb pd3-hero-orb-3" />
        <div className="pd3-hero-ring pd3-hero-ring-1" />
        <div className="pd3-hero-ring pd3-hero-ring-2" />
        <div className="pd3-hero-ring pd3-hero-ring-3" />
        <Particles />
        
        <div className="pd3-hero-content" style={{ padding: "100px 64px 60px" }}>
          <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="pd3-hero-status" style={{ justifyContent: "center" }}>
                <span className="pd3-status-pulse" />
                <span>NOUVELLE CONSULTATION</span>
                <span className="pd3-status-sep" />
                <span>CERTIFIÉ CE MÉDICAL</span>
              </div>
            </motion.div>
            
            <motion.h1 
              className="pd3-hero-welcome" 
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              📋 <span className="highlight">Demande médicale</span>
            </motion.h1>
            
            <motion.p 
              className="pd3-hero-subtitle" 
              style={{ margin: "0 auto" }}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Remplissez ce formulaire pour soumettre votre image médicale à notre équipe de spécialistes.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Navigation sticky */}
      <motion.nav 
        className="pd3-nav scrolled" 
        style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(244, 247, 252, 0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid var(--border)" }}
        initial={{ y: -80 }} 
        animate={{ y: 0 }} 
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        <div className="pd3-nav-brand" onClick={() => navigate("/patient")}>
          <div className="pd3-nav-logo">
            <div className="pd3-nav-logo-inner">
              <Icons.Lungs size={22} color="#0A1628" />
            </div>
          </div>
          <span className="pd3-nav-name">Med<span className="accent">AI</span></span>
        </div>
        <div className="pd3-nav-links">
          <button className="pd3-nav-link active" style={{ background: "none", border: "none", cursor: "pointer" }}>Nouvelle consultation</button>
        </div>
        <div className="pd3-nav-actions">
          <button className="pd3-btn pd3-btn-outline pd3-btn-sm" onClick={() => navigate("/patient")}>
            <Icons.User size={15} />
            Tableau de bord
          </button>
        </div>
      </motion.nav>

      {/* Contenu principal */}
      <div className="pd3-body" style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        
        {/* Progression */}
        <Reveal delay={0.05}>
          <div style={{
            display: "flex", alignItems: "center", background: "var(--card)", padding: "16px 24px",
            borderRadius: "var(--radius-lg)", marginBottom: 32, border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)"
          }}>
            {[
              { step: 1, label: "Type d'examen" },
              { step: 2, label: "Données cliniques" },
              { step: 3, label: "Confirmation" }
            ].map((s, i) => (
              <div key={s.step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 700,
                    background: step > s.step ? "var(--success)" : step === s.step ? "var(--info)" : "var(--border-light)",
                    color: step >= s.step ? "white" : "var(--txt3)",
                    boxShadow: step === s.step ? "0 0 0 4px rgba(59,130,246,0.2)" : "none"
                  }}>
                    {step > s.step ? "✓" : s.step}
                  </div>
                  <span style={{
                    fontSize: "0.7rem", marginTop: 6, color: step >= s.step ? "var(--navy)" : "var(--txt3)",
                    fontWeight: step === s.step ? 600 : 400
                  }}>{s.label}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? "var(--success)" : "var(--border)", marginLeft: 8, marginRight: 8 }} />}
              </div>
            ))}
          </div>
        </Reveal>

        {/* Erreur */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
            background: "rgba(239,68,68,0.1)", border: "1px solid #FECACA", borderRadius: "var(--radius-md)",
            marginBottom: 24, color: "var(--danger)"
          }}>
            <Icons.AlertCircle size={20} color="var(--danger)" />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--danger)" }}>✕</button>
          </motion.div>
        )}

        {/* ÉTAPE 1 - Sélection examen */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="pd3-metric" style={{ padding: 32 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 20 }}>
                1. Sélectionnez votre examen
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {MODEL_OPTIONS.map((model, idx) => (
                  <motion.button
                    key={model.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => { setModel(model); setStep(2); }}
                    className="pd3-action"
                    style={{
                      padding: "20px 24px",
                      border: `2px solid ${selectedModel?.key === model.key ? model.color : "var(--border)"}`,
                      textAlign: "left"
                    }}
                  >
                    <div className="pd3-action-top" style={{ marginBottom: 0 }}>
                      <div className="pd3-action-icon" style={{ background: model.bg, color: model.color, width: 56, height: 56 }}>
                        <span style={{ fontSize: "1.8rem" }}>{model.icon}</span>
                      </div>
                      <div className="pd3-action-arrow" style={{ opacity: 1, background: model.bg, color: model.color }}>
                        <Icons.ArrowRight size={14} color={model.color} />
                      </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <div className="pd3-action-label" style={{ fontSize: "1rem", color: model.color }}>{model.label}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--txt3)", marginBottom: 8 }}>{model.fullName}</div>
                      <div className="pd3-action-desc" style={{ fontSize: "0.8rem", marginBottom: 10 }}>{model.desc}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {model.specialties.map(spec => (
                          <span key={spec} className="pd3-badge" style={{ background: model.bg, color: model.color, border: "none" }}>{spec}</span>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="pd3-empty" style={{ marginTop: 24, padding: "16px 20px", background: "rgba(239,68,68,0.08)" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>
                  <strong>⚠️ Urgence médicale ?</strong> {LEGAL_INFO.emergencyDisclaimer}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ÉTAPE 2 - Formulaire clinique */}
        {step === 2 && selectedModel && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="pd3-metric" style={{ padding: 32 }}>
              
              {/* Badge modèle sélectionné */}
              <div className="pd3-section-row" style={{ marginBottom: 24 }}>
                <div className="pd3-section-row-title">
                  <div className="pd3-action-icon" style={{ background: selectedModel.bg, color: selectedModel.color, width: 40, height: 40 }}>
                    <span style={{ fontSize: "1.2rem" }}>{selectedModel.icon}</span>
                  </div>
                  <span style={{ color: selectedModel.color }}>{selectedModel.label}</span>
                </div>
                <button onClick={() => { setStep(1); setFile(null); setPreview(null); }} className="pd3-section-link">
                  Changer ←
                </button>
              </div>

              {/* Upload image */}
              <div style={{ marginBottom: 28 }}>
                <div className="pd3-section-row-title" style={{ marginBottom: 12 }}>
                  <Icons.Upload size={16} color="var(--gold-dk)" />
                  <span>Image médicale</span>
                </div>
                {!preview ? (
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                    className="pd3-empty"
                    style={{
                      border: `2px dashed ${dragOver ? selectedModel.color : "var(--border)"}`,
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={e => handleFile(e.target.files[0])} style={{ display: "none" }} />
                    <div className="pd3-empty-icon" style={{ background: selectedModel.bg, width: 64, height: 64 }}>
                      <Icons.Upload size={28} color={selectedModel.color} />
                    </div>
                    <div className="pd3-empty-title">Déposez votre image ici</div>
                    <div className="pd3-empty-desc">JPEG, PNG · Max 10 Mo · Min 300x300 px</div>
                  </div>
                ) : (
                  <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--navy)" }}>
                    <img src={preview} alt="Aperçu" style={{ width: "100%", maxHeight: 280, objectFit: "contain" }} />
                    <div className="pd3-section-row" style={{ padding: 12, background: "var(--card)", borderTop: "1px solid var(--border)" }}>
                      <div className="pd3-section-row-title">
                        <span className="pd3-badge pd3-badge-analyzed">✓ Image chargée</span>
                        {imageQuality && !imageQuality.isAdequate && (
                          <span className="pd3-badge" style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)" }}>⚠️ {imageQuality.suggestions[0]}</span>
                        )}
                      </div>
                      <button onClick={() => { setFile(null); setPreview(null); setImageQuality(null); }} className="pd3-section-link" style={{ color: "var(--danger)" }}>
                        Remplacer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Formulaire clinique */}
              <div style={{ marginBottom: 28 }}>
                <div className="pd3-section-row-title" style={{ marginBottom: 12 }}>
                  <Icons.Folder size={16} color="var(--gold-dk)" />
                  <span>Données cliniques</span>
                </div>
                <div className="pd3-metrics-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <textarea
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                      placeholder="Décrivez précisément vos symptômes..."
                      rows={3}
                      style={{
                        width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)",
                        borderRadius: "var(--radius-md)", fontSize: "0.85rem", fontFamily: "inherit",
                        resize: "vertical", outline: "none", background: "var(--bg)"
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="Durée (ex: 5 jours)"
                      style={{
                        width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)",
                        borderRadius: "var(--radius-md)", fontSize: "0.85rem", outline: "none",
                        background: "var(--bg)"
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={medicalHistory}
                      onChange={e => setMedicalHistory(e.target.value)}
                      placeholder="Antécédents médicaux"
                      style={{
                        width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)",
                        borderRadius: "var(--radius-md)", fontSize: "0.85rem", outline: "none",
                        background: "var(--bg)"
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={currentMedications}
                      onChange={e => setCurrentMedications(e.target.value)}
                      placeholder="Traitements en cours"
                      style={{
                        width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)",
                        borderRadius: "var(--radius-md)", fontSize: "0.85rem", outline: "none",
                        background: "var(--bg)"
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={allergies}
                      onChange={e => setAllergies(e.target.value)}
                      placeholder="Allergies"
                      style={{
                        width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)",
                        borderRadius: "var(--radius-md)", fontSize: "0.85rem", outline: "none",
                        background: "var(--bg)"
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Informations complémentaires..."
                      rows={2}
                      style={{
                        width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)",
                        borderRadius: "var(--radius-md)", fontSize: "0.85rem", fontFamily: "inherit",
                        resize: "vertical", outline: "none", background: "var(--bg)"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Info modèle */}
              <div className="pd3-health-card" style={{ marginBottom: 24, padding: 20, background: selectedModel.bg }}>
                <div className="pd3-section-row-title" style={{ color: selectedModel.color, marginBottom: 10 }}>
                  <span>📋</span> Pathologies détectables
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {selectedModel.pathologies.map(p => (
                    <span key={p} className="pd3-badge" style={{ background: "white", color: selectedModel.color, border: `1px solid ${selectedModel.color}30` }}>{p}</span>
                  ))}
                </div>
                <div style={{ fontSize: "0.7rem", color: selectedModel.color }}>
                  <strong>⚠️ Critères d'urgence :</strong> {selectedModel.urgencyCriteria.join(", ")}
                </div>
              </div>

              {/* Consentement */}
              <div style={{ marginBottom: 24, padding: 16, background: "var(--bg)", borderRadius: "var(--radius-lg)" }}>
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                  <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} />
                  <span style={{ fontSize: "0.8rem", color: "var(--txt2)" }}>
                    J'accepte le traitement de mes données médicales conformément au RGPD et certifie l'exactitude des informations fournies.
                  </span>
                </label>
                <small style={{ display: "block", marginTop: 8, fontSize: "0.65rem", color: "var(--txt3)" }}>{LEGAL_INFO.dataRetention}</small>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(1)} className="pd3-btn pd3-btn-outline" style={{ flex: 1 }}>
                  ← Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!file || loading || !consentAccepted}
                  className="pd3-btn pd3-btn-gold"
                  style={{
                    flex: 2,
                    background: (!file || !consentAccepted) ? "var(--border)" : selectedModel.gradient,
                    opacity: (!file || !consentAccepted) ? 0.6 : 1,
                    cursor: (!file || !consentAccepted) ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? (
                    <>⏳ Envoi en cours... {uploadProgress}%</>
                  ) : (
                    <>Soumettre la demande <Icons.ArrowRight size={16} color="var(--navy)" /></>
                  )}
                </button>
              </div>

              {loading && uploadProgress > 0 && (
                <div className="pd3-progress-bar" style={{ marginTop: 16 }}>
                  <div className="pd3-progress-fill" style={{ width: `${uploadProgress}%`, background: selectedModel.color }} />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ÉTAPE 3 - Confirmation */}
        {step === 3 && result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <div className="pd3-health-card" style={{ textAlign: "center", padding: 48, background: "var(--gradient-nav)" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.15)",
                border: "3px solid var(--success)", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 24px"
              }}>
                <Icons.Check size={40} color="var(--success)" />
              </div>
              <h2 className="pd3-section-title" style={{ color: "white", marginBottom: 12 }}>Demande transmise avec succès !</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>Votre dossier médical a été enregistré. Un médecin spécialiste va analyser votre demande.</p>

              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 32, textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Référence dossier :</span>
                  <strong style={{ color: "white" }}>#MED-{result.consultation_id}-{new Date().getFullYear()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Examen :</span>
                  <strong style={{ color: "white" }}>{result.model?.label}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Date d'envoi :</span>
                  <strong style={{ color: "white" }}>{new Date().toLocaleString("fr-FR")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Statut :</span>
                  <span className="pd3-badge pd3-badge-pending">En attente d'assignation médicale</span>
                </div>
              </div>

              <div style={{ textAlign: "left", marginBottom: 32 }}>
                <h4 style={{ color: "white", fontWeight: 700, marginBottom: 12 }}>📌 Prochaines étapes</h4>
                <ul style={{ marginLeft: 20, color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", lineHeight: 1.8 }}>
                  <li>Un médecin spécialiste examinera votre dossier sous 24-48h</li>
                  <li>L'analyse IA sera déclenchée après acceptation médicale</li>
                  <li>Vous recevrez une notification sur votre espace patient</li>
                  <li>Un rendez-vous de consultation sera programmé selon l'urgence détectée</li>
                </ul>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={resetForm} className="pd3-btn pd3-btn-outline" style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
                  📋 Nouvelle demande
                </button>
                <button onClick={() => navigate("/patient")} className="pd3-btn pd3-btn-gold">
                  🏠 Tableau de bord
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ========== FOOTER PREMIUM ========== */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-grid">
            <div className="hp-footer-brand">
              <div className="hp-nav-logo" style={{ marginBottom: 16 }}>
                <div className="hp-logo-icon"><Icons.Lungs size={18} color="white" /></div>
                <span style={{ color: "#fff" }}>Med<span style={{ color: "#FFD700" }}>AI</span></span>
              </div>
              <p>Plateforme médicale de diagnostic assisté par IA. Transformant la radiologie avec l'apprentissage profond depuis 2024.</p>
              <div className="hp-footer-socials">
                {["LI", "TW", "GH", "YT", "IN"].map((s, i) => (
                  <div className="hp-footer-social" key={i}>{s}</div>
                ))}
              </div>
            </div>
            <div>
              <h4>PRODUIT</h4>
              {["Analyse IA", "Radiologues", "API Access", "Mobile App", "Tarifs"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
            </div>
            <div>
              <h4>ENTREPRISE</h4>
              {["À propos", "Carrières", "Recherche", "Blog", "Contact"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
            </div>
            <div>
              <h4>RESSOURCES</h4>
              {["Documentation", "Études de cas", "Whitepapers", "Support", "Statut"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
            </div>
          </div>
          <div className="hp-footer-bottom">
            <span>© 2025 MedAI — Plateforme médicale certifiée · Tous droits réservés</span>
            <div className="hp-footer-bottom-links">
              {["Confidentialité", "Conditions", "Sécurité", "HIPAA", "RGPD", "Contact"].map(x => <a href="#" key={x}>{x}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}