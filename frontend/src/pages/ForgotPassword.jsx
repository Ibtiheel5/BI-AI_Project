// frontend/src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./HomePage.css";
import chestXrayImage from '../assets/chest-xray.jpg';

const API_BASE = "http://localhost:8000/api/v1";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.");
        setEmail("");
      } else {
        setError(data.detail || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hp">
      {/* Navigation premium */}
      <motion.nav 
        className={`hp-nav ${scrolled ? "scrolled" : ""}`} 
        initial={{ y: -80 }} 
        animate={{ y: 0 }} 
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        <div className="hp-nav-logo" onClick={() => window.location.href = "/"}>
          <div className="hp-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 4v12M8 8c-2 0-4 1-4 4s1 6 4 6M16 8c2 0 4 1 4 4s-1 6-4 6M8 8c1.5 0 3 1 4 2M16 8c-1.5 0-3 1-4 2"/>
            </svg>
          </div>
          <span>Med<span className="accent">AI</span></span>
        </div>
        <div className="hp-nav-actions">
          <Link to="/login" className="hp-btn hp-btn-outline hp-btn-sm">Retour</Link>
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
                <span>RÉINITIALISATION</span>
                <span className="hp-badge-sep">•</span>
                <span>SÉCURISÉ</span>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              Mot de passe<br />
              <span className="gd">oublié ?</span>
            </motion.h1>

            <motion.p className="hp-hero-desc" style={{ maxWidth: 480 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </motion.p>

            {/* Formulaire */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <form onSubmit={handleSubmit} style={{ marginTop: 32 }}>
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
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

                {message && (
                  <div style={{
                    padding: "12px 16px",
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 12,
                    color: "#D1FAE5",
                    fontSize: "0.85rem",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}>
                    <span>✓</span> {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="hp-btn hp-btn-gold"
                  style={{ width: "100%", padding: "14px", fontSize: "0.95rem", justifyContent: "center" }}
                >
                  {loading ? (
                    <><span className="hp-pulse" style={{ marginRight: 8 }} /> Envoi en cours...</>
                  ) : (
                    <>Envoyer le lien →</>
                  )}
                </button>
              </form>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 24, textAlign: "center" }}>
              <Link to="/login" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textDecoration: "none" }}>
                ← Retour à la connexion
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginTop: 24, textAlign: "center" }}>
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

          {/* Image médicale à droite */}
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
    </div>
  );
}