// frontend/src/components/patient/ResultCard.jsx
import { motion } from "framer-motion";
import { PatientIcons } from "../../constants/patientIcons";

const MODEL_CONFIG = {
  chest: { label: "Radio thoracique", icon: "🫁", color: "#2D5F9E", bg: "#EFF6FF" },
  brain: { label: "IRM cérébrale", icon: "🧠", color: "#6B4FA0", bg: "#F5F3FF" },
  lung: { label: "Scanner CT", icon: "🔬", color: "#D62828", bg: "#FEF2F2" },
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
  const confidence = (result.confidence * 100).toFixed(1);
  const date = new Date(result.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: 18,
        padding: "20px 24px",
        border: `1px solid ${severity.color}20`,
        borderLeft: `4px solid ${severity.color}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "var(--shadow-sm)"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateX(6px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateX(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        {/* Icon */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: model.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
          flexShrink: 0
        }}>
          {model.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--navy)", textTransform: "capitalize" }}>
              {result.prediction}
            </span>
            <span style={{
              padding: "2px 10px",
              borderRadius: 20,
              fontSize: "0.65rem",
              fontWeight: 700,
              background: severity.bg,
              color: severity.color
            }}>
              {severity.label}
            </span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--txt2)", display: "flex", alignItems: "center", gap: 4 }}>
              <PatientIcons.Calendar size={12} />
              {date}
            </span>
            <span style={{ fontSize: "0.75rem", color: model.color, display: "flex", alignItems: "center", gap: 4 }}>
              {model.icon} {model.label}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
              <PatientIcons.Check size={12} />
              Confiance {confidence}%
            </span>
          </div>

          <div style={{
            height: 4,
            background: "var(--border-dim)",
            borderRadius: 2,
            overflow: "hidden",
            maxWidth: 200
          }}>
            <div style={{
              width: `${confidence}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${model.color}, ${severity.color})`,
              borderRadius: 2
            }} />
          </div>
        </div>

        {/* Chevron */}
        <div style={{ color: "var(--txt3)", flexShrink: 0 }}>
          <PatientIcons.ArrowRight size={20} />
        </div>
      </div>
    </motion.div>
  );
};