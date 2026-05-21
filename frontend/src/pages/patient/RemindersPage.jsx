// frontend/src/pages/patient/RemindersPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PatientPageLayout } from "../../components/patient/PatientPageLayout";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";
import { useReminders } from "../../hooks/useReminders";

const RemindersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    reminders,
    loading,
    upcoming,
    completed,
    addReminder,
    toggleReminder,
    deleteReminder,
    refetch
  } = useReminders();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "medical"
  });

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.date) return;
    try {
      await addReminder(newReminder);
      setShowAddModal(false);
      setNewReminder({ title: "", description: "", date: "", time: "", type: "medical" });
    } catch (err) {
      console.error("Erreur ajout rappel:", err);
    }
  };

  const handleToggle = async (id, isCompleted) => {
    try {
      await toggleReminder(id, isCompleted);
    } catch (err) {
      console.error("Erreur toggle rappel:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rappel ?")) return;
    try {
      await deleteReminder(id);
    } catch (err) {
      console.error("Erreur suppression rappel:", err);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      medical: <PatientIcons.MedicalHistory size={16} />,
      lab: <PatientIcons.Results size={16} />,
      medication: <PatientIcons.Prescription size={16} />
    };
    return icons[type] || <PatientIcons.Clock size={16} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      medical: "#3B82F6",
      lab: "#8B5CF6",
      medication: "#10B981"
    };
    return colors[type] || "#D4A500";
  };

  const getTypeLabel = (type) => {
    const labels = {
      medical: "Médical",
      lab: "Laboratoire",
      medication: "Médicament"
    };
    return labels[type] || "Autre";
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const isOverdue = (dateStr, completed = false) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reminderDate = new Date(dateStr);
  return reminderDate < today && !completed;
};

  const isToday = (dateStr) => {
    const today = new Date();
    const reminderDate = new Date(dateStr);
    return today.toDateString() === reminderDate.toDateString();
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
            <PatientIcons.Reminder size={14} color="#D4A500" />
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#D4A500",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Rappels
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
            Vos <span style={{ color: "#D4A500" }}>rappels médicaux</span>
          </h1>
          <p style={{
            fontSize: "0.9rem",
            color: "#94A3B8",
            margin: 0,
            lineHeight: 1.5
          }}>
            Gérez vos rendez-vous et traitements
          </p>
        </div>
      </div>

      {/* Main Content */}
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
              Vos rappels
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
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
            <PatientIcons.Add size={18} />
            Nouveau rappel
          </button>
        </div>

        {/* Upcoming Reminders */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 40 }}>
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
                <PatientIcons.Clock size={16} />
              </div>
              <h2 style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#0F1B2D",
                margin: 0
              }}>
                À venir <span style={{ color: "#94A3B8", fontWeight: 500 }}>({upcoming.length})</span>
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {upcoming.map((reminder, idx) => {
                const overdue = isOverdue(reminder.date, reminder.completed);
                const today = isToday(reminder.date);
                const typeColor = getTypeColor(reminder.type);

                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 24,
                      padding: "24px 28px",
                      border: overdue
                        ? "1.5px solid rgba(239, 68, 68, 0.3)"
                        : today
                          ? "1.5px solid rgba(255, 215, 0, 0.4)"
                          : "1px solid rgba(30, 60, 110, 0.08)",
                      boxShadow: overdue
                        ? "0 4px 20px rgba(239, 68, 68, 0.08)"
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
                      e.currentTarget.style.boxShadow = overdue
                        ? "0 4px 20px rgba(239, 68, 68, 0.08)"
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
                      background: overdue ? "#EF4444" : today ? "#FFD700" : typeColor
                    }} />

                    {/* Type Icon */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: `${typeColor}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: typeColor,
                      flexShrink: 0,
                      marginLeft: 8
                    }}>
                      {getTypeIcon(reminder.type)}
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
                          {reminder.title}
                        </h3>
                        {(overdue || today) && (
                          <span style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: overdue ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 215, 0, 0.12)",
                            color: overdue ? "#EF4444" : "#D4A500",
                            border: overdue ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(255, 215, 0, 0.25)"
                          }}>
                            {overdue ? "EN RETARD" : "AUJOURD'HUI"}
                          </span>
                        )}
                      </div>

                      {reminder.description && (
                        <p style={{
                          fontSize: "0.8rem",
                          color: "#475569",
                          margin: "0 0 10px",
                          lineHeight: 1.5
                        }}>
                          {reminder.description}
                        </p>
                      )}

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        flexWrap: "wrap"
                      }}>
                        <span style={{
                          fontSize: "0.75rem",
                          color: overdue ? "#EF4444" : "#94A3B8",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          <PatientIcons.Calendar size={13} />
                          {formatDate(reminder.date)}
                        </span>
                        {reminder.time && (
                          <span style={{
                            fontSize: "0.75rem",
                            color: "#94A3B8",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            <PatientIcons.Clock size={13} />
                            {reminder.time}
                          </span>
                        )}
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: `${typeColor}10`,
                          color: typeColor,
                          border: `1px solid ${typeColor}25`
                        }}>
                          {getTypeLabel(reminder.type)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: "flex",
                      gap: 8,
                      flexShrink: 0
                    }}>
                      <button
                        onClick={() => handleToggle(reminder.id, reminder.completed)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: "rgba(16, 185, 129, 0.08)",
                          border: "1.5px solid rgba(16, 185, 129, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#10B981",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(16, 185, 129, 0.08)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title="Marquer comme terminé"
                      >
                        <PatientIcons.Check size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(reminder.id)}
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
                        title="Supprimer"
                      >
                        <PatientIcons.Trash size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Reminders */}
        {completed.length > 0 && (
          <div>
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
                background: "rgba(148, 163, 184, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94A3B8"
              }}>
                <PatientIcons.Check size={16} />
              </div>
              <h2 style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#475569",
                margin: 0
              }}>
                Terminés <span style={{ fontWeight: 500 }}>({completed.length})</span>
              </h2>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              opacity: 0.7
            }}>
              {completed.map((reminder, idx) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 16,
                    padding: "16px 24px",
                    border: "1px solid rgba(30, 60, 110, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(148, 163, 184, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94A3B8"
                  }}>
                    <PatientIcons.Check size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      color: "#94A3B8",
                      textDecoration: "line-through",
                      fontSize: "0.9rem"
                    }}>
                      {reminder.title}
                    </div>
                    <div style={{
                      fontSize: "0.7rem",
                      color: "#CBD5E1",
                      marginTop: 4
                    }}>
                      {formatDate(reminder.date)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {reminders.length === 0 && (
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
              <PatientIcons.Reminder size={36} color="#D4A500" />
            </div>
            <h3 style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#0F1B2D",
              marginBottom: 8
            }}>
              Aucun rappel
            </h3>
            <p style={{
              fontSize: "0.85rem",
              color: "#94A3B8",
              maxWidth: 300,
              margin: "0 auto 24px",
              lineHeight: 1.6
            }}>
              Créez votre premier rappel médical pour ne plus oublier vos rendez-vous et traitements.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
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
              <PatientIcons.Add size={18} />
              Créer un rappel
            </button>
          </motion.div>
        )}
      </div>

      {/* Add Reminder Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 27, 45, 0.6)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20
            }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "#FFFFFF",
                borderRadius: 28,
                padding: 36,
                maxWidth: 520,
                width: "100%",
                boxShadow: "0 24px 56px rgba(0, 0, 0, 0.15)",
                border: "1px solid rgba(30, 60, 110, 0.08)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 28
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #FFD700, #D4A500)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0F1B2D"
                }}>
                  <PatientIcons.Add size={22} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: "1.3rem",
                    fontWeight: 800,
                    color: "#0F1B2D",
                    margin: 0
                  }}>
                    Nouveau rappel
                  </h2>
                  <p style={{
                    fontSize: "0.75rem",
                    color: "#94A3B8",
                    margin: "4px 0 0"
                  }}>
                    Planifiez votre prochain rendez-vous médical
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: 8,
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Titre *
                </label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ex: Consultation cardiologue"
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.95rem",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D",
                    transition: "all 0.2s ease",
                    background: "#FAFBFC"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#D4A500";
                    e.target.style.boxShadow = "0 0 0 3px rgba(255, 215, 0, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(30, 60, 110, 0.12)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: 8,
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Description (optionnel)
                </label>
                <textarea
                  value={newReminder.description}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Détails supplémentaires..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D",
                    resize: "vertical",
                    minHeight: 80,
                    background: "#FAFBFC",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#D4A500";
                    e.target.style.boxShadow = "0 0 0 3px rgba(255, 215, 0, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(30, 60, 110, 0.12)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 20
              }}>
                <div>
                  <label style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 8,
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newReminder.date}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      borderRadius: 14,
                      border: "1.5px solid rgba(30, 60, 110, 0.12)",
                      fontSize: "0.9rem",
                      outline: "none",
                      fontFamily: "inherit",
                      color: "#0F1B2D",
                      background: "#FAFBFC",
                      transition: "all 0.2s ease"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#D4A500";
                      e.target.style.boxShadow = "0 0 0 3px rgba(255, 215, 0, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(30, 60, 110, 0.12)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 8,
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Heure
                  </label>
                  <input
                    type="time"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      borderRadius: 14,
                      border: "1.5px solid rgba(30, 60, 110, 0.12)",
                      fontSize: "0.9rem",
                      outline: "none",
                      fontFamily: "inherit",
                      color: "#0F1B2D",
                      background: "#FAFBFC",
                      transition: "all 0.2s ease"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#D4A500";
                      e.target.style.boxShadow = "0 0 0 3px rgba(255, 215, 0, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(30, 60, 110, 0.12)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: 12,
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Type de rappel
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { value: "medical", label: "Médical", icon: <PatientIcons.MedicalHistory size={16} />, color: "#3B82F6" },
                    { value: "lab", label: "Laboratoire", icon: <PatientIcons.Results size={16} />, color: "#8B5CF6" },
                    { value: "medication", label: "Médicament", icon: <PatientIcons.Prescription size={16} />, color: "#10B981" }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewReminder(prev => ({ ...prev, type: type.value }))}
                      style={{
                        flex: 1,
                        padding: "14px 12px",
                        borderRadius: 16,
                        background: newReminder.type === type.value
                          ? `${type.color}10`
                          : "#FAFBFC",
                        border: newReminder.type === type.value
                          ? `2px solid ${type.color}40`
                          : "1.5px solid rgba(30, 60, 110, 0.1)",
                        color: newReminder.type === type.value ? type.color : "#94A3B8",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s ease",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => {
                        if (newReminder.type !== type.value) {
                          e.currentTarget.style.borderColor = `${type.color}30`;
                          e.currentTarget.style.color = type.color;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newReminder.type !== type.value) {
                          e.currentTarget.style.borderColor = "rgba(30, 60, 110, 0.1)";
                          e.currentTarget.style.color = "#94A3B8";
                        }
                      }}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 14,
                    background: "transparent",
                    border: "1.5px solid rgba(30, 60, 110, 0.15)",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "#475569",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(30, 60, 110, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddReminder}
                  disabled={!newReminder.title || !newReminder.date}
                  style={{
                    flex: 2,
                    padding: "14px",
                    borderRadius: 14,
                    background: (!newReminder.title || !newReminder.date)
                      ? "rgba(30, 60, 110, 0.1)"
                      : "linear-gradient(135deg, #FFD700, #D4A500)",
                    border: "none",
                    color: (!newReminder.title || !newReminder.date) ? "#94A3B8" : "#0F1B2D",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: (!newReminder.title || !newReminder.date) ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: (!newReminder.title || !newReminder.date)
                      ? "none"
                      : "0 4px 18px rgba(255, 215, 0, 0.3)",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                  onMouseEnter={(e) => {
                    if (newReminder.title && newReminder.date) {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <PatientIcons.Add size={18} />
                    Ajouter le rappel
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blink animation for overdue indicator */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default RemindersPage;