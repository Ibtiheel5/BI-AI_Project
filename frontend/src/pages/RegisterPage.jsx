// src/pages/RegisterPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import "./HomePage.css";
import chestXrayImage from '../assets/chest-xray.jpg';

// ═══════════════════════════════════════════════════════════════════
// SVG ICONS PROFESSIONNELS
// ═══════════════════════════════════════════════════════════════════

const SvgIcon = ({ children, size = 24, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const Icons = {
  Doctor: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
      <path d="M17 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
      <path d="M7 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
    </SvgIcon>
  ),
  Patient: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
      <path d="M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
      <path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    </SvgIcon>
  ),
  User: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </SvgIcon>
  ),
  Mail: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </SvgIcon>
  ),
  Lock: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </SvgIcon>
  ),
  UserCheck: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </SvgIcon>
  ),
  ArrowRight: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </SvgIcon>
  ),
  ArrowLeft: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </SvgIcon>
  ),
  Check: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12"/>
    </SvgIcon>
  ),
  Eye: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </SvgIcon>
  ),
  EyeOff: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </SvgIcon>
  ),
  Shield: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </SvgIcon>
  ),
  Activity: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </SvgIcon>
  ),
  Clock: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </SvgIcon>
  ),
  Star: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </SvgIcon>
  ),
  Lungs: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M12 4.5v11M8.5 8c-1.8 0-3.5.8-3.5 3.5s1 6 4 6M15.5 8c1.8 0 3.5.8 3.5 3.5s-1 6-4 6M8.5 8c1.2 0 2.5.8 3.5 2M15.5 8c-1.2 0-2.5.8-3.5 2"/>
    </SvgIcon>
  ),
  Brain: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M12 4a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V14a2 2 0 0 1-4 0v-2.5c-1.2-.7-2-2-2-3.5a4 4 0 0 1 4-4z"/>
      <path d="M12 4v16"/>
      <path d="M8 12.5c-1.2.7-2 2-2 3.5a4 4 0 0 0 8 0c0-1.5-.8-2.8-2-3.5"/>
    </SvgIcon>
  ),
  Scan: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M12 8v8M8 12h8"/>
      <circle cx="12" cy="12" r="2"/>
    </SvgIcon>
  ),
  EyeMedical: ({ size = 24, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M12 4C7 4 2 7 2 12s5 8 10 8 10-3 10-8-5-8-10-8z"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M17.66 17.66l1.41 1.41M6.34 6.34L4.93 4.93"/>
    </SvgIcon>
  ),
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    domains: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDomain = (key) => {
    const VALID_BACKEND_DOMAINS = ["chest", "lung", "brain", "retina"];
    if (!VALID_BACKEND_DOMAINS.includes(key)) return;
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(key)
        ? prev.domains.filter(d => d !== key)
        : [...prev.domains, key]
    }));
  };

  const validateStep1 = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!formData.fullName.trim()) return "Veuillez entrer votre nom complet";
    if (!formData.email.trim()) return "Veuillez entrer votre adresse email";
    if (!emailRegex.test(formData.email)) return "Adresse email invalide";
    if (!formData.username.match(/^[a-zA-Z0-9._-]{3,50}$/))
      return "Identifiant invalide (3-50 caractères, lettres/chiffres/points/tirets)";
    if (formData.password.length < 6)
      return "Le mot de passe doit contenir au moins 6 caractères";
    if (formData.password !== formData.confirmPassword)
      return "Les mots de passe ne correspondent pas";
    return null;
  };

  const handleSubmit = async () => {
    if (role === "Medecin" && formData.domains.length === 0) {
      setError("Veuillez sélectionner au moins un domaine médical");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        domains: role === "Patient" ? [] : formData.domains,
        specialty: formData.specialty || "",
        role: role,
      });
      
      setSuccessMessage(response.message || "Un email de vérification a été envoyé à votre adresse.");
      setRegisterSuccess(true);
      setStep(3);
    } catch (err) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const DOMAIN_OPTIONS = [
    {
      key: "chest",
      label: "Radiologie Thoracique",
      icon: <Icons.Lungs size={28} />,
      desc: "Analyse de radiographies pulmonaires (10 pathologies)",
      color: "#2D5F9E",
      bg: "rgba(45,95,158,0.08)",
    },
    {
      key: "brain",
      label: "Neurologie & IRM",
      icon: <Icons.Brain size={28} />,
      desc: "Analyse d'IRM cérébrales — 4 types de tumeurs",
      color: "#6B4FA0",
      bg: "rgba(107,79,160,0.08)",
    },
    {
      key: "lung",
      label: "Cancer Pulmonaire",
      icon: <Icons.Scan size={28} />,
      desc: "Détection de lésions pulmonaires sur scanner CT",
      color: "#D62828",
      bg: "rgba(214,40,40,0.08)",
    },
    {
      key: "retina",
      label: "Ophtalmologie — Rétinopathie",
      icon: <Icons.EyeMedical size={28} />,
      desc: "Détection et gradation de la rétinopathie diabétique (5 stades)",
      color: "#0E7490",
      bg: "rgba(14,116,144,0.08)",
    },
  ];

  return (
    <div className="hp">
      {/* Navigation premium */}
      <motion.nav className={`hp-nav ${scrolled ? "scrolled" : ""}`} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5, type: "spring", stiffness: 100 }}>
        <div className="hp-nav-logo" onClick={() => navigate("/")}>
          <div className="hp-logo-icon">
            <Icons.Lungs size={20} color="white" />
          </div>
          <span>Med<span className="accent">AI</span></span>
        </div>
        <div className="hp-nav-links">
          <Link to="/">Accueil</Link>
          <Link to="/classification">Analyse IA</Link>
          <Link to="/pathologies">Pathologies</Link>
        </div>
        <div className="hp-nav-actions">
          <Link to="/login" className="hp-btn hp-btn-outline hp-btn-sm">Connexion</Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hp-hero" style={{ minHeight: "100vh", position: "relative" }}>
        <div className="hp-hero-grid-bg" />
        <div className="hp-hero-glow hp-hero-glow-1" />
        <div className="hp-hero-glow hp-hero-glow-2" />
        <div className="hp-hero-glow hp-hero-glow-3" />
        <div className="hp-hero-ring" style={{ width: "80%", height: "80%" }} />
        <div className="hp-hero-ring" style={{ width: "65%", height: "65%", animationDirection: "reverse", animationDuration: "25s" }} />
        <div className="hp-hero-ring" style={{ width: "50%", height: "50%", animationDuration: "20s", borderWidth: "0.5px" }} />

        {/* Image médicale en arrière-plan */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${chestXrayImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
          zIndex: 0
        }} />

        <div className="hp-hero-content" style={{ padding: "120px 64px 80px", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: 550, marginRight: "auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="hp-badge" style={{ marginBottom: 24 }}>
                <span className="hp-badge-dot" />
                <span>INSCRIPTION SÉCURISÉE</span>
                <span className="hp-badge-sep">•</span>
                <span>SSL/TLS</span>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              Créez votre<br />
              <span className="gd">espace médical</span>
            </motion.h1>

            <motion.p className="hp-hero-desc" style={{ maxWidth: 480 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              Rejoignez la plateforme de diagnostic assisté par IA. Accédez aux outils médicaux de pointe.
            </motion.p>

            {/* ÉTAPE 0 - Choix du rôle */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ marginTop: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <button
                    onClick={() => { setRole("Medecin"); setStep(1); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      padding: "20px 24px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1.5px solid rgba(255,255,255,0.2)",
                      borderRadius: 20,
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "#FFD700"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                  >
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: "rgba(255,215,0,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Icons.Doctor size={28} color="#FFD700" />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>Professionnel de santé</div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Médecin, radiologue, neurologue...</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <Icons.ArrowRight size={20} color="#FFD700" />
                    </div>
                  </button>

                  <button
                    onClick={() => { setRole("Patient"); setStep(1); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      padding: "20px 24px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1.5px solid rgba(255,255,255,0.2)",
                      borderRadius: 20,
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "#FFD700"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                  >
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: "rgba(16,185,129,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Icons.Patient size={28} color="#10B981" />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>Patient</div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Accédez à vos résultats et suivis</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <Icons.ArrowRight size={20} color="#FFD700" />
                    </div>
                  </button>
                </div>

                <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                  Déjà un compte ? <Link to="/login" style={{ color: "#FFD700", textDecoration: "none" }}>Se connecter</Link>
                </p>
              </motion.div>
            )}

            {/* ÉTAPE 1 - Informations personnelles */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ marginTop: 32 }}>
                <button
                  onClick={() => setStep(0)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    padding: "8px 16px",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                    marginBottom: 20,
                    fontSize: "0.8rem"
                  }}
                >
                  <Icons.ArrowLeft size={14} /> Retour
                </button>

                <form onSubmit={(e) => e.preventDefault()}>
                  <div style={{ marginBottom: 16 }}>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateForm("fullName", e.target.value)}
                      placeholder="Nom complet *"
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 14,
                        fontSize: "0.95rem",
                        color: "white",
                        outline: "none",
                      }}
                      onFocus={e => e.target.style.borderColor = "#FFD700"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                    />
                  </div>

                  <div style={{ marginBottom: 16, position: "relative" }}>
                    <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                      <Icons.Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="Adresse email *"
                      style={{
                        width: "100%",
                        padding: "14px 18px 14px 45px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 14,
                        fontSize: "0.95rem",
                        color: "white",
                        outline: "none",
                      }}
                      onFocus={e => e.target.style.borderColor = "#FFD700"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateForm("username", e.target.value.toLowerCase())}
                      placeholder="Identifiant *"
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 14,
                        fontSize: "0.95rem",
                        color: "white",
                        outline: "none",
                      }}
                      onFocus={e => e.target.style.borderColor = "#FFD700"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                    />
                  </div>

                  {role === "Medecin" && (
                    <div style={{ marginBottom: 16 }}>
                      <input
                        type="text"
                        value={formData.specialty}
                        onChange={(e) => updateForm("specialty", e.target.value)}
                        placeholder="Spécialité (optionnel)"
                        style={{
                          width: "100%",
                          padding: "14px 18px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1.5px solid rgba(255,255,255,0.2)",
                          borderRadius: 14,
                          fontSize: "0.95rem",
                          color: "white",
                          outline: "none",
                        }}
                        onFocus={e => e.target.style.borderColor = "#FFD700"}
                        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: 16, position: "relative" }}>
                    <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                      <Icons.Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      placeholder="Mot de passe (6 caractères min.) *"
                      style={{
                        width: "100%",
                        padding: "14px 18px 14px 45px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 14,
                        fontSize: "0.95rem",
                        color: "white",
                        outline: "none",
                        paddingRight: "45px"
                      }}
                      onFocus={e => e.target.style.borderColor = "#FFD700"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.6)",
                        cursor: "pointer"
                      }}
                    >
                      {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                    </button>
                  </div>

                  <div style={{ marginBottom: 20, position: "relative" }}>
                    <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                      <Icons.Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => updateForm("confirmPassword", e.target.value)}
                      placeholder="Confirmer le mot de passe *"
                      style={{
                        width: "100%",
                        padding: "14px 18px 14px 45px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 14,
                        fontSize: "0.95rem",
                        color: "white",
                        outline: "none",
                        paddingRight: "45px"
                      }}
                      onFocus={e => e.target.style.borderColor = "#FFD700"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.6)",
                        cursor: "pointer"
                      }}
                    >
                      {showConfirmPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                    </button>
                  </div>

                  {error && (
                    <div style={{
                      padding: "12px 16px",
                      background: "rgba(239,68,68,0.15)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 12,
                      color: "#FEE2E2",
                      fontSize: "0.85rem",
                      marginBottom: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    }}>
                      <Icons.Shield size={16} color="#FEE2E2" /> {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const err = validateStep1();
                      if (err) { setError(err); return; }
                      setError("");
                      if (role === "Patient") handleSubmit();
                      else setStep(2);
                    }}
                    disabled={loading}
                    className="hp-btn hp-btn-gold"
                    style={{ width: "100%", padding: "14px", fontSize: "0.95rem", justifyContent: "center" }}
                  >
                    {loading ? (
                      <><Icons.Activity size={18} style={{ animation: "spin 1s linear infinite" }} /> Création en cours...</>
                    ) : (
                      <>{role === "Patient" ? "Créer mon compte" : "Continuer"} <Icons.ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ÉTAPE 2 - Domaines (médecins) */}
            {step === 2 && role === "Medecin" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ marginTop: 32 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    padding: "8px 16px",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                    marginBottom: 20,
                    fontSize: "0.8rem"
                  }}
                >
                  <Icons.ArrowLeft size={14} /> Retour
                </button>

                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
                  Sélectionnez vos spécialités médicales (plusieurs possibles)
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {DOMAIN_OPTIONS.map((domain) => {
                    const selected = formData.domains.includes(domain.key);
                    return (
                      <button
                        key={domain.key}
                        type="button"
                        onClick={() => toggleDomain(domain.key)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "16px",
                          background: selected ? `${domain.color}20` : "rgba(255,255,255,0.05)",
                          border: selected ? `2px solid ${domain.color}` : "1.5px solid rgba(255,255,255,0.15)",
                          borderRadius: 16,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: selected ? `${domain.color}30` : "rgba(255,255,255,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {domain.icon}
                        </div>
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: selected ? domain.color : "white" }}>
                            {domain.label}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{domain.desc}</div>
                        </div>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: selected ? domain.color : "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: selected ? "white" : "transparent"
                        }}>
                          {selected && <Icons.Check size={14} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {formData.domains.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                    {formData.domains.map(k => {
                      const d = DOMAIN_OPTIONS.find(o => o.key === k);
                      return d ? (
                        <span key={k} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          background: `${d.color}20`,
                          border: `1px solid ${d.color}40`,
                          borderRadius: 20,
                          fontSize: "0.7rem",
                          color: d.color,
                        }}>
                          {d.icon} {d.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {error && (
                  <div style={{
                    padding: "12px 16px",
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 12,
                    color: "#FEE2E2",
                    fontSize: "0.85rem",
                    marginTop: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}>
                    <Icons.Shield size={16} color="#FEE2E2" /> {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading || formData.domains.length === 0}
                  className="hp-btn hp-btn-gold"
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontSize: "0.95rem",
                    justifyContent: "center",
                    marginTop: 20,
                    opacity: (formData.domains.length === 0 || loading) ? 0.6 : 1,
                    cursor: (formData.domains.length === 0 || loading) ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? (
                    <><Icons.Activity size={18} style={{ animation: "spin 1s linear infinite" }} /> Création en cours...</>
                  ) : (
                    <>Créer mon compte ({formData.domains.length} domaine{formData.domains.length > 1 ? "s" : ""}) <Icons.ArrowRight size={16} /></>
                  )}
                </button>
              </motion.div>
            )}

            {/* ÉTAPE 3 - Succès */}
            {step === 3 && registerSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{ marginTop: 32, textAlign: "center" }}
              >
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(16,185,129,0.15)",
                  border: "2px solid #10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px"
                }}>
                  <Icons.Mail size={40} color="#10B981" />
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: 12 }}>
                  Vérifiez votre email !
                </h2>
                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginBottom: 28, lineHeight: 1.6 }}>
                  {successMessage}
                </p>
                <div style={{
                  padding: "16px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  marginBottom: 24,
                  border: "1px solid rgba(255,215,0,0.2)"
                }}>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                    <strong>📧 Email envoyé à :</strong><br />
                    {formData.email}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                    ⏱️ Le lien expire dans 24 heures.<br />
                    {role === "Medecin" && "✅ Après vérification, votre compte sera soumis à l'approbation de l'administrateur."}
                  </p>
                </div>
                <button onClick={() => navigate("/login")} className="hp-btn hp-btn-gold" style={{ padding: "12px 28px" }}>
                  Aller à la connexion <Icons.ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </div>

          {/* Image médicale à droite avec cartes flottantes */}
          <motion.div
            className="hp-hero-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ position: "relative" }}
          >
            <div className="hp-hero-img-wrapper">
              <div className="hp-hero-img-glow" />
              <div className="hp-hero-img">
                <img
                  src={chestXrayImage}
                  alt="Medical Imaging"
                  className="hp-hero-main-img"
                  style={{ width: "100%", height: "auto", borderRadius: 24 }}
                />
                <div className="hp-img-overlay">
                  <div className="hp-scan-line" />
                  <div className="hp-hotspot hp-hotspot-1" />
                  <div className="hp-hotspot hp-hotspot-2" />
                  <div className="hp-hotspot hp-hotspot-3" />
                </div>
              </div>
            </div>

            {/* Cartes flottantes avec SVG */}
            <motion.div
              className="hp-fcard hp-fc1"
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="ib"><Icons.Star size={20} color="#FFD700" /></div>
              <div><div className="v">98.7%</div><div className="l">Précision</div></div>
            </motion.div>

            <motion.div
              className="hp-fcard hp-fc2"
              animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 5, delay: 1, ease: "easeInOut" }}
            >
              <div className="ib"><Icons.Clock size={20} color="#FFD700" /></div>
              <div><div className="v">2.4s</div><div className="l">Analyse</div></div>
            </motion.div>

            <motion.div
              className="hp-fcard hp-fc3"
              animate={{ boxShadow: ["0 0 0px rgba(255,215,0,0.15)", "0 0 25px rgba(255,215,0,0.4)", "0 0 0px rgba(255,215,0,0.15)"] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <div className="ib"><Icons.User size={20} color="#FFD700" /></div>
              <div><div className="v">250K+</div><div className="l">Patients</div></div>
            </motion.div>
          </motion.div>
        </div>

        <div className="hp-hero-scroll">
          <span>Scroll to explore</span>
          <div className="hp-scroll-mouse">
            <div className="hp-scroll-wheel" />
          </div>
        </div>
      </section>

      {/* Footer premium */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-grid">
            <div className="hp-footer-brand">
              <div className="hp-nav-logo" style={{ marginBottom: 16 }}>
                <div className="hp-logo-icon">
                  <Icons.Lungs size={18} color="white" />
                </div>
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .hp-nav-logo span { color: white; }
        .hp-nav-links a { color: rgba(255,255,255,0.7); }
        .hp-nav-links a:hover { color: white; }
        .hp-nav-actions .hp-btn-outline { border-color: rgba(255,255,255,0.3); color: white; }
        .hp-nav-actions .hp-btn-outline:hover { background: white; color: var(--navy); border-color: white; }
        .hp-nav.scrolled .hp-nav-links a { color: var(--txt2); }
        .hp-nav.scrolled .hp-nav-links a:hover { color: var(--navy); }
        .hp-nav.scrolled .hp-nav-actions .hp-btn-outline { border-color: var(--navy); color: var(--navy); }
        .hp-nav.scrolled .hp-nav-actions .hp-btn-outline:hover { background: var(--navy); color: white; }
      `}</style>
    </div>
  );
}