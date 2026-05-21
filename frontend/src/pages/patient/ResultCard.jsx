// frontend/src/components/patient/ResultCard.jsx
import { motion } from "framer-motion";

const MODEL_CONFIG = {
  chest: { label: "Radiographie thoracique", icon: "🫁", color: "#2D5F9E", bg: "#EFF6FF" },
  brain: { label: "IRM cérébrale", icon: "🧠", color: "#6B4FA0", bg: "#F5F3FF" },
  lung: { label: "Scanner CT pulmonaire", icon: "🔬", color: "#D62828", bg: "#FEF2F2" },
  retina: { label: "Fond d'œil", icon: "👁️", color: "#0E7490", bg: "#ECFEFF" }
};

const SEVERITY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#EF4444", bg: "#FEE2E2" },
  urgent: { label: "URGENT", color: "#F59E0B", bg: "#FEF3C7" },
  normal: { label: "NORMAL", color: "#10B981", bg: "#D1FAE5" }
};

export const ResultCard = ({ result, onClick, index }) => {
  const model = MODEL_CONFIG[result.model_key] || MODEL_CONFIG.chest;
  const severity = SEVERITY_CONFIG[result.urgency] || SEVERITY_CONFIG.normal;
  const confidence = result.confidence ? (result.confidence * 100).toFixed(1) : null;
  const date = new Date(result.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: 16,
        padding: "20px",
        border: "1px solid var(--border-dim)",
        cursor: "pointer",
        transition: "all 0.3s ease"
      }}
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {/* Icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: model.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.8rem"
        }}>
          {model.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>
              #{result.id}
            </span>
            <span style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: severity.bg,
              color: severity.color,
              fontSize: "0.65rem",
              fontWeight: 700
            }}>
              {severity.label}
            </span>
            <span style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: model.bg,
              color: model.color,
              fontSize: "0.65rem",
              fontWeight: 600
            }}>
              {model.label}
            </span>
          </div>
          
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, textTransform: "capitalize" }}>
            {result.prediction || "En attente d'analyse"}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.75rem", color: "var(--txt2)" }}>
            <span>📅 {date}</span>
            {confidence && (
              <span>🎯 Confiance: <strong style={{ color: severity.color }}>{confidence}%</strong></span>
            )}
            <span>👨‍⚕️ {result.doctor_name || "En attente"}</span>
          </div>
        </div>

        {/* Arrow */}
        <div style={{ color: "var(--txt3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};