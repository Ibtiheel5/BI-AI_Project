// frontend/src/components/patient/PatientPageLayout.jsx
import { motion } from "framer-motion";
import { PatientIcons } from "../../constants/patientIcons";

export const PatientPageLayout = ({ 
  title, 
  subtitle, 
  icon, 
  children, 
  actions,
  backButton,
  onBack 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 32,
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {backButton && (
            <button
              onClick={onBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-dim)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)"
              }}
            >
              <PatientIcons.ArrowRight size={20} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
          
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "linear-gradient(135deg, var(--gold-lt), var(--gold-glass))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--gold-dk)"
          }}>
            {icon}
          </div>
          
          <div>
            <h1 style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--navy)",
              letterSpacing: "-0.03em",
              marginBottom: 4
            }}>
              {title}
            </h1>
            <p style={{
              fontSize: "0.85rem",
              color: "var(--txt2)",
              margin: 0
            }}>
              {subtitle}
            </p>
          </div>
        </div>
        
        {actions && (
          <div style={{ display: "flex", gap: 12 }}>
            {actions}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div>
        {children}
      </div>
    </motion.div>
  );
};

export default PatientPageLayout;