// frontend/src/pages/patient/UpcomingCallsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:8000/api/v1";

const UpcomingCallsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("medai-token");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/appointments/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const upcoming = (data.appointments || []).filter(apt => {
          const aptDate = new Date(apt.scheduled_at);
          return apt.status === "accepted" && aptDate > new Date();
        }).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
        setAppointments(upcoming);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = {};
      appointments.forEach(apt => {
        const aptDate = new Date(apt.scheduled_at);
        const now = new Date();
        const diff = aptDate - now;
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (3600000)) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          newTimeLeft[apt.id] = { hours, minutes, seconds, total: diff };
        } else {
          newTimeLeft[apt.id] = { hours: 0, minutes: 0, seconds: 0, total: 0 };
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [appointments]);

  const joinCall = (consultationId) => {
    window.open(`/video-consultation/${consultationId}?room=medai-${consultationId}`, "_blank");
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm("Annuler ce rendez-vous ?")) return;
    try {
      const res = await fetch(`${API}/consultations/appointments/${appointmentId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getModelIcon = (modelKey) => {
    const icons = { chest: "🫁", brain: "🧠", lung: "🔬", retina: "👁️" };
    return icons[modelKey] || "🏥";
  };

  const getModelColor = (modelKey) => {
    const colors = {
      chest: "#3B82F6",
      brain: "#8B5CF6",
      lung: "#F59E0B",
      retina: "#10B981"
    };
    return colors[modelKey] || "#D4A500";
  };

  const getModelLabel = (modelKey) => {
    const labels = {
      chest: "Radio thoracique",
      brain: "IRM cérébrale",
      lung: "Scanner CT",
      retina: "Fond d'œil"
    };
    return labels[modelKey] || "Consultation";
  };

  const canJoin = (apt) => {
    const aptDate = new Date(apt.scheduled_at);
    const now = new Date();
    const diff = aptDate - now;
    return diff <= 5 * 60 * 1000 && diff > -10 * 60 * 1000;
  };

  const isToday = (dateStr) => {
    const today = new Date();
    const aptDate = new Date(dateStr);
    return today.toDateString() === aptDate.toDateString();
  };

  const isTomorrow = (dateStr) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const aptDate = new Date(dateStr);
    return tomorrow.toDateString() === aptDate.toDateString();
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

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
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

  const canJoinCount = appointments.filter(apt => canJoin(apt)).length;
  const todayCount = appointments.filter(apt => isToday(apt.scheduled_at)).length;
  const upcomingCount = appointments.filter(apt => !isToday(apt.scheduled_at) && !canJoin(apt)).length;

  return (
    <div style={{ background: "var(--bg, #F0F4FA)", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header Section - Style blanc épuré comme screenshot */}
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
            <PatientIcons.VideoCall size={14} color="#D4A500" />
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#D4A500",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Rendez-vous
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
            Vos <span style={{ color: "#D4A500" }}>consultations</span>
          </h1>
          <p style={{
            fontSize: "0.9rem",
            color: "#94A3B8",
            margin: 0,
            lineHeight: 1.5
          }}>
            Planifiez et gérez vos rendez-vous médicaux
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        {/* Section Title */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20
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
            <PatientIcons.VideoCall size={16} />
          </div>
          <h2 style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#0F1B2D",
            margin: 0
          }}>
            Rendez-vous <span style={{ color: "#94A3B8", fontWeight: 500 }}>({appointments.length})</span>
          </h2>
        </div>

        {appointments.length === 0 ? (
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
              <PatientIcons.VideoCall size={36} color="#D4A500" />
            </div>
            <h3 style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#0F1B2D",
              marginBottom: 8
            }}>
              Aucun appel programmé
            </h3>
            <p style={{
              fontSize: "0.85rem",
              color: "#94A3B8",
              maxWidth: 300,
              margin: "0 auto 24px",
              lineHeight: 1.6
            }}>
              Les rendez-vous vidéo apparaîtront ici une fois acceptés par votre médecin.
            </p>
            <button
              onClick={() => navigate("/patient")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                borderRadius: 100,
                background: "linear-gradient(135deg, #FFD700, #D4A500)",
                color: "#0F1B2D",
                fontWeight: 700,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)"
              }}
            >
              <PatientIcons.Calendar size={18} />
              Voir mes consultations
            </button>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {appointments.map((apt, idx) => {
              const time = timeLeft[apt.id] || { hours: 0, minutes: 0, seconds: 0, total: 0 };
              const canJoinNow = canJoin(apt);
              const aptDate = new Date(apt.scheduled_at);
              const modelColor = getModelColor(apt.model_key);
              const today = isToday(apt.scheduled_at);
              const tomorrow = isTomorrow(apt.scheduled_at);

              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: "24px 28px",
                    border: canJoinNow
                      ? "1.5px solid rgba(16, 185, 129, 0.4)"
                      : today
                        ? "1.5px solid rgba(255, 215, 0, 0.4)"
                        : "1px solid rgba(30, 60, 110, 0.08)",
                    boxShadow: canJoinNow
                      ? "0 4px 20px rgba(16, 185, 129, 0.12)"
                      : today
                        ? "0 4px 20px rgba(255, 215, 0, 0.08)"
                        : "0 2px 12px rgba(0, 0, 0, 0.02)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 20,
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = canJoinNow
                      ? "0 4px 20px rgba(16, 185, 129, 0.12)"
                      : today
                        ? "0 4px 20px rgba(255, 215, 0, 0.08)"
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
                    background: canJoinNow ? "#10B981" : today ? "#FFD700" : modelColor
                  }} />

                  {/* Model Icon */}
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: `${modelColor}12`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: modelColor,
                    flexShrink: 0,
                    marginLeft: 8,
                    fontSize: "1.5rem"
                  }}>
                    {getModelIcon(apt.model_key)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                      flexWrap: "wrap"
                    }}>
                      <h3 style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#0F1B2D",
                        margin: 0
                      }}>
                        Consultation #{apt.consultation_id}
                      </h3>
                      {canJoinNow && (
                        <span style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: "rgba(16, 185, 129, 0.12)",
                          color: "#10B981",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          animation: "blink 2s infinite"
                        }}>
                          EN COURS
                        </span>
                      )}
                      {today && !canJoinNow && (
                        <span style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: "rgba(255, 215, 0, 0.12)",
                          color: "#D4A500",
                          border: "1px solid rgba(255, 215, 0, 0.25)"
                        }}>
                          AUJOURD'HUI
                        </span>
                      )}
                      {tomorrow && (
                        <span style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: "rgba(59, 130, 246, 0.1)",
                          color: "#3B82F6",
                          border: "1px solid rgba(59, 130, 246, 0.2)"
                        }}>
                          DEMAIN
                        </span>
                      )}
                    </div>

                    <div style={{
                      fontSize: "0.85rem",
                      color: "#475569",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}>
                      <PatientIcons.Doctor size={14} color="#94A3B8" />
                      Dr. {apt.doctor_name || "Médecin"} • {apt.type === "video" ? "Vidéo consultation" : "Présentiel"}
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      flexWrap: "wrap"
                    }}>
                      <span style={{
                        fontSize: "0.75rem",
                        color: today ? "#D4A500" : "#94A3B8",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <PatientIcons.Calendar size={13} />
                        {formatDate(apt.scheduled_at)}
                      </span>
                      <span style={{
                        fontSize: "0.75rem",
                        color: "#94A3B8",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <PatientIcons.Clock size={13} />
                        {formatTime(apt.scheduled_at)}
                      </span>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: `${modelColor}10`,
                        color: modelColor,
                        border: `1px solid ${modelColor}25`
                      }}>
                        {getModelLabel(apt.model_key)}
                      </span>
                    </div>

                    {/* Countdown or Join button */}
                    <div style={{ marginTop: 16 }}>
                      {canJoinNow ? (
                        <button
                          onClick={() => joinCall(apt.consultation_id)}
                          style={{
                            padding: "12px 28px",
                            borderRadius: 40,
                            background: "linear-gradient(135deg, #10B981, #059669)",
                            border: "none",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            boxShadow: "0 4px 18px rgba(16, 185, 129, 0.3)",
                            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 4px 18px rgba(16, 185, 129, 0.3)";
                          }}
                        >
                          <PatientIcons.VideoCall size={18} />
                          Rejoindre l'appel
                        </button>
                      ) : time.total > 0 ? (
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 20px",
                          borderRadius: 16,
                          background: "rgba(15, 27, 45, 0.04)",
                          border: "1px solid rgba(30, 60, 110, 0.08)"
                        }}>
                          <PatientIcons.Clock size={16} color="#D4A500" />
                          <span style={{
                            fontSize: "1rem",
                            fontWeight: 800,
                            color: "#D4A500",
                            fontVariantNumeric: "tabular-nums"
                          }}>
                            {time.hours > 0 && `${time.hours}h `}
                            {time.minutes}m {time.seconds}s
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                            avant l'appel
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "#94A3B8" }}>
                          Appel passé
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: "flex",
                    gap: 8,
                    flexShrink: 0
                  }}>
                    <button
                      onClick={() => cancelAppointment(apt.id)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: "rgba(239, 68, 68, 0.06)",
                        border: "1.5px solid rgba(239, 68, 68, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#EF4444",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.06)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="Annuler le rendez-vous"
                    >
                      <PatientIcons.Trash size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Blink animation */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default UpcomingCallsPage;
