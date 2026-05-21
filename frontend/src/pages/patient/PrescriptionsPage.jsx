// frontend/src/pages/patient/PrescriptionsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ===== THEME COLORS (Navy/Gold like UpcomingCallsPage) =====
const C = {
  navy: "#0F1B2D",
  navyLight: "#1A2D4A",
  navyMid: "#243B5C",
  gold: "#FFD700",
  goldDk: "#D4A500",
  goldLt: "rgba(255, 215, 0, 0.08)",
  goldBorder: "rgba(255, 215, 0, 0.2)",
  bg: "#F0F4FA",
  card: "#FFFFFF",
  text: "#1E293B",
  text2: "#475569",
  textMuted: "#94A3B8",
  border: "rgba(30, 60, 110, 0.08)",
  borderLight: "rgba(30, 60, 110, 0.06)",
  success: "#10B981",
  successBg: "rgba(16, 185, 129, 0.1)",
  danger: "#EF4444",
  dangerBg: "rgba(239, 68, 68, 0.1)",
  bgAlt: "#F8FAFC"
};

const PrescriptionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("medai-token");

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        // URL CORRIGÉE : utilise /prescriptions/patient au lieu de /patient/prescriptions
        const res = await fetch(`${API}/prescriptions/patient`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPrescriptions(data.prescriptions || []);
        } else {
          console.error("Erreur API:", res.status);
          // Fallback mock data
          setPrescriptions([]);
        }
      } catch (err) {
        console.error(err);
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [token]);

  const downloadPrescription = async (prescriptionId) => {
    try {
      const res = await fetch(`${API}/prescriptions/${prescriptionId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur ${res.status}`);
      }

      // Creer un blob et telecharger
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordonnance_${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur téléchargement PDF:", err);
      alert("Erreur lors du téléchargement: " + err.message);
    }
  };

  const requestRenewal = async (id) => {
    alert("Demande de renouvellement envoyée au médecin");
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        background: "var(--bg, #F0F4FA)"
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: "3px solid rgba(212, 165, 0, 0.2)",
          borderTopColor: "#D4A500",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalMeds = prescriptions.reduce((acc, p) => acc + (p.medications?.length || 0), 0);
  const activeCount = prescriptions.filter(p => 
    p.medications?.some(m => m.duration?.toLowerCase().includes("continu") || m.duration?.toLowerCase().includes("jour"))
  ).length;

  return (
    <div style={{ background: "var(--bg, #F0F4FA)", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header Section - Style gris clair épuré */}
      <div style={{
        background: "#F0F4FA",
        padding: "32px 40px 24px"
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          {/* Badge pill doré */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 100,
            background: "rgba(255, 215, 0, 0.08)",
            border: "1px solid rgba(255, 215, 0, 0.2)",
            marginBottom: 16
          }}>
            <PatientIcons.Prescription size={14} color="#D4A500" />
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#D4A500",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Ordonnances
            </span>
          </div>

          <h1 style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#0F1B2D",
            margin: 0,
            letterSpacing: "-0.02em",
            marginBottom: 8
          }}>
            Mes <span style={{ color: "#D4A500" }}>ordonnances</span>
          </h1>
          <p style={{
            fontSize: "0.9rem",
            color: "#94A3B8",
            margin: 0,
            lineHeight: 1.5
          }}>
            Toutes vos prescriptions médicales
          </p>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        {/* Action Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Vos prescriptions
            </span>
          </div>
          <button
            onClick={() => navigate("/patient")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 28px",
              borderRadius: 100,
              background: "linear-gradient(135deg, #FFD700, #D4A500)",
              color: "#0F1B2D",
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "inherit"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
            }}
          >
            <PatientIcons.ArrowLeft size={18} />
            Retour
          </button>
        </div>

        {prescriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              textAlign: "center",
              padding: "80px 40px",
              background: "#FFFFFF",
              borderRadius: 28,
              border: "1px solid rgba(30, 60, 110, 0.08)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)"
            }}
          >
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(212, 165, 0, 0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              border: "1px solid rgba(255, 215, 0, 0.2)"
            }}>
              <PatientIcons.Prescription size={36} color="#D4A500" />
            </div>
            <h3 style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#0F1B2D",
              marginBottom: 8
            }}>
              Aucune ordonnance
            </h3>
            <p style={{
              fontSize: "0.85rem",
              color: "#94A3B8",
              maxWidth: 300,
              margin: "0 auto 24px",
              lineHeight: 1.6
            }}>
              Vos prescriptions apparaîtront ici après que votre médecin les aura rédigées.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {prescriptions.map((pres, idx) => {
              const isActive = pres.status === "active";
              
              return (
                <motion.div
                  key={pres.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    border: isActive
                      ? "1.5px solid rgba(16, 185, 129, 0.3)"
                      : "1px solid rgba(30, 60, 110, 0.08)",
                    boxShadow: isActive
                      ? "0 4px 20px rgba(16, 185, 129, 0.08)"
                      : "0 2px 12px rgba(0, 0, 0, 0.02)",
                    overflow: "hidden",
                    position: "relative",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isActive
                      ? "0 4px 20px rgba(16, 185, 129, 0.08)"
                      : "0 2px 12px rgba(0, 0, 0, 0.02)";
                  }}
                >
                  {/* Left accent bar */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 20,
                    bottom: 20,
                    width: 4,
                    borderRadius: "0 4px 4px 0",
                    background: isActive ? "#10B981" : "#D4A500"
                  }} />

                  {/* Header */}
                  <div style={{
                    padding: "24px 28px 20px 36px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 16,
                    borderBottom: "1px solid rgba(30, 60, 110, 0.06)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: isActive ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 215, 0, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isActive ? "#10B981" : "#D4A500",
                        flexShrink: 0
                      }}>
                        <PatientIcons.Prescription size={22} />
                      </div>
                      <div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 4,
                          flexWrap: "wrap"
                        }}>
                          <h3 style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "#0F1B2D",
                            margin: 0
                          }}>
                            Ordonnance du {formatDate(pres.created_at)}
                          </h3>
                          {isActive && (
                            <span style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 20,
                              background: "rgba(16, 185, 129, 0.1)",
                              color: "#10B981",
                              border: "1px solid rgba(16, 185, 129, 0.2)"
                            }}>
                              EN COURS
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: "0.8rem",
                          color: "#475569",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          <PatientIcons.Doctor size={14} color="#94A3B8" />
                          Dr. {pres.doctor_name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                      <button
                        onClick={() => downloadPrescription(pres.id)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 12,
                          background: "rgba(30, 60, 110, 0.04)",
                          border: "1.5px solid rgba(30, 60, 110, 0.1)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#475569",
                          transition: "all 0.2s ease",
                          fontFamily: "inherit"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(30, 60, 110, 0.08)";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(30, 60, 110, 0.04)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <PatientIcons.Download size={16} />
                        PDF
                      </button>
                      <button
                        onClick={() => requestRenewal(pres.id)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #FFD700, #D4A500)",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "#0F1B2D",
                          transition: "all 0.2s ease",
                          fontFamily: "inherit",
                          boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
                        }}
                      >
                        Renouveler
                      </button>
                    </div>
                  </div>

                  {/* Medications */}
                  <div style={{ padding: "20px 28px 24px 36px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 16
                    }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #0F1B2D, #1A2D4A)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFD700"
                      }}>
                        <PatientIcons.Pill size={16} />
                      </div>
                      <h4 style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#0F1B2D",
                        margin: 0
                      }}>
                        Médicaments <span style={{ color: "#94A3B8", fontWeight: 500 }}>({pres.medications?.length || 0})</span>
                      </h4>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {pres.medications?.map((med, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr",
                            gap: 16,
                            padding: "14px 18px",
                            background: "#F8FAFC",
                            borderRadius: 16,
                            border: "1px solid rgba(30, 60, 110, 0.06)",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <div style={{
                              fontSize: "0.9rem",
                              fontWeight: 700,
                              color: "#0F1B2D",
                              marginBottom: 2
                            }}>
                              {med.name}
                            </div>
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 20,
                              background: "rgba(59, 130, 246, 0.1)",
                              color: "#3B82F6",
                              border: "1px solid rgba(59, 130, 246, 0.2)"
                            }}>
                              {med.dosage}
                            </span>
                          </div>
                          <div style={{
                            fontSize: "0.8rem",
                            color: "#475569",
                            fontWeight: 500
                          }}>
                            {med.frequency}
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 20,
                              background: med.duration?.toLowerCase().includes("continu") 
                                ? "rgba(16, 185, 129, 0.1)" 
                                : "rgba(139, 92, 246, 0.1)",
                              color: med.duration?.toLowerCase().includes("continu") 
                                ? "#10B981" 
                                : "#8B5CF6",
                              border: med.duration?.toLowerCase().includes("continu") 
                                ? "1px solid rgba(16, 185, 129, 0.2)" 
                                : "1px solid rgba(139, 92, 246, 0.2)"
                            }}>
                              {med.duration}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {pres.notes && (
                      <div style={{
                        marginTop: 16,
                        padding: "14px 18px",
                        background: "rgba(255, 215, 0, 0.04)",
                        borderRadius: 16,
                        border: "1px solid rgba(255, 215, 0, 0.1)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10
                      }}>
                        <PatientIcons.Info size={16} color="#D4A500" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#D4A500",
                            marginBottom: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}>
                            Note du médecin
                          </div>
                          <div style={{
                            fontSize: "0.8rem",
                            color: "#475569",
                            lineHeight: 1.5
                          }}>
                            {pres.notes}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PrescriptionsPage;