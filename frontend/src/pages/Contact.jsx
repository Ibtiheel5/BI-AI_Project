// frontend/src/pages/Contact.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import "./HomePage.css";

const API_BASE = "http://localhost:8000/api/v1";

// Icons
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M22 7L12 13 2 7"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
);

export default function Contact() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("✅ Message envoyé avec succès ! Notre équipe vous répondra dans les plus brefs délais.");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        const data = await response.json();
        setError(data.detail || "Une erreur est survenue. Veuillez réessayer.");
      }
    } catch (err) {
      setError("❌ Impossible d'envoyer le message. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: MailIcon, title: "Email", info: "contact@medai.com", link: "mailto:contact@medai.com", color: "#3B82F6" },
    { icon: PhoneIcon, title: "Téléphone", info: "+216 70 123 456", link: "tel:+21670123456", color: "#10B981" },
    { icon: LocationIcon, title: "Adresse", info: "Tunis, Tunisie", link: "#", color: "#F59E0B" },
    { icon: ClockIcon, title: "Horaires", info: "Lun-Ven: 9h - 18h", link: "#", color: "#8B5CF6" },
  ];

  const socials = [
    { icon: LinkedinIcon, name: "LinkedIn", link: "https://linkedin.com/company/medai" },
    { icon: TwitterIcon, name: "Twitter", link: "https://twitter.com/medai" },
    { icon: GithubIcon, name: "GitHub", link: "https://github.com/medai" },
  ];

  return (
    <div className="hp">
      {/* Navigation */}
      <motion.nav className={`hp-nav ${scrolled ? "scrolled" : ""}`} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: .5, type: "spring", stiffness: 100 }}>
        <div className="hp-nav-logo" onClick={() => navigate("/")}>
          <div className="hp-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 4v12M8 8c-2 0-4 1-4 4s1 6 4 6M16 8c2 0 4 1 4 4s-1 6-4 6M8 8c1.5 0 3 1 4 2M16 8c-1.5 0-3 1-4 2"/>
            </svg>
          </div>
          <span>Med<span className="accent">AI</span></span>
        </div>
        <div className="hp-nav-links">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Accueil</a>
          <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: "smooth" }); }}>Features</a>
          <a href="#process" onClick={(e) => { e.preventDefault(); document.getElementById('process')?.scrollIntoView({ behavior: "smooth" }); }}>Process</a>
          <a href="#testimonials" onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: "smooth" }); }}>Testimonials</a>
          <a href="/contact" onClick={(e) => { e.preventDefault(); navigate("/contact"); }} style={{ color: "#FFD700" }}>Contact</a>
        </div>
        <div className="hp-nav-actions">
          <button className="hp-btn hp-btn-outline hp-btn-sm" onClick={() => navigate("/login")}>
            Sign In
          </button>
          <button className="hp-btn hp-btn-gold hp-btn-sm" onClick={() => navigate("/login")}>
            Start Free Trial
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hp-hero" style={{ minHeight: "50vh", position: "relative" }}>
        <div className="hp-hero-grid-bg" />
        <div className="hp-hero-glow hp-hero-glow-1" />
        <div className="hp-hero-glow hp-hero-glow-2" />
        <div className="hp-hero-ring" style={{ width: "70%", height: "70%" }} />
        
        <div className="hp-hero-content" style={{ padding: "120px 64px 60px", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="hp-badge" style={{ justifyContent: "center", marginBottom: 24 }}>
                <span className="hp-badge-dot" />
                <span>CONTACTEZ-NOUS</span>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              Notre équipe est à votre <span className="gd">écoute</span>
            </motion.h1>

            <motion.p className="hp-hero-desc" style={{ maxWidth: 550, margin: "0 auto" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              Une question ? Un projet ? Contactez-nous et nous vous répondrons dans les plus brefs délais.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 48 }}>
          
          {/* Formulaire */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: "white",
              borderRadius: 24,
              padding: 32,
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              border: "1px solid #E2E8F0"
            }}
          >
            <h2 style={{ fontSize: 24, color: "#0A2647", marginBottom: 8 }}>Envoyez-nous un message</h2>
            <p style={{ color: "#64748B", marginBottom: 24 }}>Nous vous répondrons sous 24h</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nom complet"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 12,
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={e => e.target.style.borderColor = "#FFD700"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 12,
                    fontSize: "14px",
                    outline: "none"
                  }}
                  onFocus={e => e.target.style.borderColor = "#FFD700"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Sujet"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 12,
                    fontSize: "14px",
                    outline: "none"
                  }}
                  onFocus={e => e.target.style.borderColor = "#FFD700"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Votre message"
                  rows={5}
                  required
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 12,
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  onFocus={e => e.target.style.borderColor = "#FFD700"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>

              {error && (
                <div style={{
                  padding: "12px",
                  background: "#FEE2E2",
                  borderRadius: 10,
                  color: "#DC2626",
                  fontSize: "13px",
                  marginBottom: 20
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{
                  padding: "12px",
                  background: "#D1FAE5",
                  borderRadius: 10,
                  color: "#059669",
                  fontSize: "13px",
                  marginBottom: 20
                }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Envoi en cours..." : "Envoyer le message"}
              </button>
            </form>
          </motion.div>

          {/* Informations de contact */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div style={{
              background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
              borderRadius: 24,
              padding: 32,
              color: "white",
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 22, marginBottom: 16, color: "#FFD700" }}>Informations</h3>
              <p style={{ opacity: 0.9, marginBottom: 24, lineHeight: 1.6 }}>
                Notre équipe est disponible du lundi au vendredi, de 9h à 18h.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {contactInfo.map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      color: "white",
                      textDecoration: "none",
                      transition: "opacity 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      background: `rgba(${parseInt(item.color.slice(1,3),16)}, ${parseInt(item.color.slice(3,5),16)}, ${parseInt(item.color.slice(5,7),16)}, 0.2)`,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <item.icon />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{item.title}</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{item.info}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div style={{
              background: "white",
              borderRadius: 24,
              padding: 32,
              border: "1px solid #E2E8F0"
            }}>
              <h3 style={{ fontSize: 18, color: "#0A2647", marginBottom: 16 }}>Suivez-nous</h3>
              <div style={{ display: "flex", gap: 16 }}>
                {socials.map((social, i) => (
                  <a
                    key={i}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 44,
                      height: 44,
                      background: "#F8FAFC",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0A2647",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FFD700"; e.currentTarget.style.color = "#0A2647"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#0A2647"; }}
                  >
                    <social.icon />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
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
              <p>Plateforme médicale de diagnostic assisté par IA.</p>
            </div>
            <div>
              <h4>PRODUIT</h4>
              <a className="hp-footer-link" href="/classification">Analyse IA</a>
              <a className="hp-footer-link" href="#">Radiologues</a>
              <a className="hp-footer-link" href="#">API Access</a>
            </div>
            <div>
              <h4>ENTREPRISE</h4>
              <a className="hp-footer-link" href="/contact">Contact</a>
              <a className="hp-footer-link" href="#">À propos</a>
              <a className="hp-footer-link" href="#">Carrières</a>
            </div>
            <div>
              <h4>LÉGAL</h4>
              <a className="hp-footer-link" href="#">Confidentialité</a>
              <a className="hp-footer-link" href="#">Conditions</a>
              <a className="hp-footer-link" href="#">Sécurité</a>
            </div>
          </div>
          <div className="hp-footer-bottom">
            <span>© 2025 MedAI. Tous droits réservés.</span>
            <div className="hp-footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}