// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import "./HomePage.css";
import chestXrayImage from '../assets/chest-xray.jpg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await login(identifier.trim(), password);

      if (user.is_admin || user.role === "Administrateur") {
        navigate("/admin");
      } else if (user.role === "Patient") {
        navigate("/patient");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (username, password) => {
    setIdentifier(username);
    setPassword(password);
    setError("");
  };

  return (
    <div className="hp">
      {/* Navigation premium */}
      <motion.nav className={`hp-nav ${scrolled ? "scrolled" : ""}`} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5, type: "spring", stiffness: 100 }}>
        <div className="hp-nav-logo" onClick={() => navigate("/")}>
          <div className="hp-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 4v12M8 8c-2 0-4 1-4 4s1 6 4 6M16 8c2 0 4 1 4 4s-1 6-4 6M8 8c1.5 0 3 1 4 2M16 8c-1.5 0-3 1-4 2"/>
            </svg>
          </div>
          <span>Med<span className="accent">AI</span></span>
        </div>
       
        <div className="hp-nav-actions">
          <Link to="/register" className="hp-btn hp-btn-outline hp-btn-sm">S'inscrire</Link>
        </div>
      </motion.nav>

      {/* Hero Section avec image médicale */}
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
                <span>ACCÈS SÉCURISÉ</span>
                <span className="hp-badge-sep">•</span>
                <span>SSL/TLS</span>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              Accédez à votre<br />
              <span className="gd">espace médical</span>
            </motion.h1>

            <motion.p className="hp-hero-desc" style={{ maxWidth: 480 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            Plateforme de diagnostic assisté par IA. Connectez-vous pour accéder à vos outils médicaux.
            </motion.p>

            {/* Formulaire de connexion */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <form onSubmit={handleSubmit} style={{ marginTop: 32 }}>
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Identifiant médical ou email"
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1.5px solid rgba(255,255,255,0.2)",
                      borderRadius: 14,
                      fontSize: "0.95rem",
                      color: "white",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={e => e.target.style.borderColor = "#FFD700"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                  />
                </div>

                <div style={{ position: "relative", marginBottom: 20 }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1.5px solid rgba(255,255,255,0.2)",
                      borderRadius: 14,
                      fontSize: "0.95rem",
                      color: "white",
                      outline: "none",
                      transition: "all 0.2s",
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
                      cursor: "pointer",
                      fontSize: "1rem"
                    }}
                  >
                    {showPassword ? "🙈" : "👁️"}
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
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="hp-btn hp-btn-gold"
                  style={{ width: "100%", padding: "14px", fontSize: "0.95rem", justifyContent: "center" }}
                >
                  {loading ? (
                    <><span className="hp-pulse" style={{ marginRight: 8 }} /> Connexion en cours...</>
                  ) : (
                    <>Accéder à MedAI →</>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Comptes de démonstration */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 32 }}>
              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: 24,
                textAlign: "center"
              }}>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: 16, letterSpacing: "1px" }}>
                  COMPTES DE DÉMONSTRATION
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {[
                    { user: "dr.martin", pass: "chest123", label: "Dr. Martin", role: "Radiologue", icon: "🫁", color: "#2D5F9E" },
                    { user: "dr.lambert", pass: "neuro123", label: "Dr. Lambert", role: "Neurologue", icon: "🧠", color: "#6B4FA0" },
                    { user: "dr.benali", pass: "lung123", label: "Dr. Benali", role: "Oncologue", icon: "🔬", color: "#DC2626" },
                    { user: "dr.seddik", pass: "retina123", label: "Dr. Seddik", role: "Ophtalmologue", icon: "👁️", color: "#0E7490" },
                    { user: "patient", pass: "patient123", label: "Patient", role: "Espace patient", icon: "👤", color: "#0EA5E9" }
                  ].map((demo, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => fillDemo(demo.user, demo.pass)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        background: `rgba(${parseInt(demo.color.slice(1,3),16)}, ${parseInt(demo.color.slice(3,5),16)}, ${parseInt(demo.color.slice(5,7),16)}, 0.1)`,
                        border: `1px solid ${demo.color}40`,
                        borderRadius: 12,
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${demo.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem"
                      }}>
                        {demo.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "white" }}>{demo.label}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>{demo.role}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginTop: 24, textAlign: "center" }}>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                Nouveau praticien ? <Link to="/register" style={{ color: "#FFD700", textDecoration: "none" }}>Demander un accès professionnel</Link>
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Cryptage AES-256
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Données de santé protégées
                </div>
              </div>
            </motion.div>
          </div>

          {/* Image médicale à droite - effet visuel */}
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

            {/* Cartes flottantes */}
            <motion.div
              className="hp-fcard hp-fc1"
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="ib"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
              <div><div className="v">2.4s</div><div className="l">Temps d'analyse</div></div>
            </motion.div>

            <motion.div
              className="hp-fcard hp-fc2"
              animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 5, delay: 1, ease: "easeInOut" }}
            >
              <div className="ib"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
              <div><div className="v">98.7%</div><div className="l">Précision</div></div>
            </motion.div>

            <motion.div
              className="hp-fcard hp-fc3"
              animate={{ boxShadow: ["0 0 0px rgba(255,215,0,0.15)", "0 0 25px rgba(255,215,0,0.4)", "0 0 0px rgba(255,215,0,0.15)"] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <div className="ib"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg></div>
              <div><div className="v">250K+</div><div className="l">Patients</div></div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 4v12M8 8c-2 0-4 1-4 4s1 6 4 6M16 8c2 0 4 1 4 4s-1 6-4 6M8 8c1.5 0 3 1 4 2M16 8c-1.5 0-3 1-4 2"/>
                  </svg>
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