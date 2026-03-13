// WelcomeModal.jsx — Popup de bienvenue après connexion
import { useEffect, useState } from "react";

export default function WelcomeModal({ user, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const t = setTimeout(() => handleClose(), 5000);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const domainIcons = {
    chest: "🫁", lung: "🔬", brain: "🧠",
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div onClick={handleClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10,38,71,0.45)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white",
        borderRadius: 20,
        padding: "40px 48px",
        maxWidth: 440,
        width: "90%",
        textAlign: "center",
        boxShadow: "0 24px 80px rgba(10,38,71,0.2)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
        transition: "transform 0.3s ease",
        position: "relative",
      }}>
        {/* Close */}
        <button onClick={handleClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "#F1F5F9", border: "none", borderRadius: "50%",
          width: 30, height: 30, cursor: "pointer", fontSize: "0.85rem",
          color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>

        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #1B3B6F, #2D5F9E)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: "2rem",
          boxShadow: "0 8px 24px rgba(45,95,158,0.3)",
        }}>
          {user?.domains?.includes("brain") && !user?.domains?.includes("chest") ? "🧠" : "🫁"}
        </div>

        {/* Greeting */}
        <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0 0 4px", fontWeight: 500 }}>
          {greeting} 👋
        </p>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
          Docteur {user?.name}
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#2D5F9E", fontWeight: 600, margin: "0 0 20px" }}>
          {user?.specialty}
        </p>

        {/* Domains */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {user?.domains?.map(d => (
            <span key={d} style={{
              padding: "5px 14px", borderRadius: 20,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              fontSize: "0.8rem", fontWeight: 600, color: "#2D5F9E",
            }}>
              {domainIcons[d]} {d === "chest" ? "Thorax" : d === "lung" ? "Pulmonaire" : "Neurologie"}
            </span>
          ))}
        </div>

        {/* Message */}
        <div style={{
          background: "#F8FAFC", borderRadius: 12, padding: "16px 20px",
          border: "1px solid #E2E8F0", marginBottom: 24,
        }}>
          <p style={{ fontSize: "0.9rem", color: "#0A2647", margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
            Comment puis-je vous aider aujourd'hui ?
          </p>
        </div>

        <button onClick={handleClose} style={{
          width: "100%", padding: "12px",
          background: "linear-gradient(135deg, #1B3B6F, #2D5F9E)",
          border: "none", borderRadius: 10, color: "white",
          fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(45,95,158,0.3)",
        }}>
          Commencer l'analyse →
        </button>

        <p style={{ fontSize: "0.72rem", color: "#CBD5E1", marginTop: 12 }}>
          Ce message se ferme automatiquement dans 5s
        </p>
      </div>
    </div>
  );
}