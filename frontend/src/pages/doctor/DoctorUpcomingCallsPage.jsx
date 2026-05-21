import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ── Icônes SVG ────────────────────────────────────────────────────
const Svg = ({ children, size = 24, color = "currentColor", sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const I = {
  Brain: p => <Svg {...p}><path d="M12 5a3.5 3.5 0 0 1 3.5 3.5c0 1.4-.8 2.5-1.8 3.2v2.3a1.8 1.8 0 0 1-3.4 0v-2.3c-1-.7-1.8-1.8-1.8-3.2A3.5 3.5 0 0 1 12 5zM12 5v14"/></Svg>,
  Scan: p => <Svg {...p}><path d="M3.5 7V5.5a2 2 0 0 1 2-2h2M16.5 3.5h2a2 2 0 0 1 2 2V7M20.5 17v1.5a2 2 0 0 1-2 2h-2M7.5 20.5h-2a2 2 0 0 1-2-2V17"/><circle cx="12" cy="12" r="4.5"/></Svg>,
  Eye: p => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>,
  Lungs: p => <Svg {...p}><path d="M12 4.5v11M8.5 8c-1.8 0-3.5.8-3.5 3.5S7 16 8.5 16M15.5 8c1.8 0 3.5.8 3.5 3.5S17 16 15.5 16M8.5 8c1.2 0 2.5.8 3.5 2M15.5 8c-1.2 0-2.5.8-3.5 2"/></Svg>,
  Calendar: p => <Svg {...p}><rect x="3.5" y="4.5" width="17" height="16.5" rx="2"/><line x1="16" y1="2.5" x2="16" y2="6.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/></Svg>,
  Clock: p => <Svg {...p}><circle cx="12" cy="12" r="9.5"/><polyline points="12 6.5 12 12 15.5 14"/></Svg>,
  Video: p => <Svg {...p}><rect x="2" y="5" width="14" height="14" rx="2"/><polyline points="16 9 22 5 22 19 16 15"/></Svg>,
  Check: p => <Svg {...p}><circle cx="12" cy="12" r="9.5"/><polyline points="8 12 10.5 14.5 16 9"/></Svg>,
  Shield: p => <Svg {...p}><path d="M12 21s7.5-3.6 7.5-9V5.5L12 3 4.5 5.5V12c0 5.4 7.5 9 7.5 9z"/><polyline points="9 11.5 11 13.5 15 9.5"/></Svg>,
  Camera: p => <Svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Svg>,
  Users: p => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
  AlertTriangle: p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
  Plus: p => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
};

const MODEL_CONFIG = {
  brain:  { label: "IRM Cérébrale", color: "#8B5CF6", icon: I.Brain, bg: "rgba(139,92,246,0.08)" },
  lung:   { label: "Scanner CT",    color: "#EC4899", icon: I.Scan, bg: "rgba(236,72,153,0.08)" },
  chest:  { label: "Radio Thorax",  color: "#3B82F6", icon: I.Lungs, bg: "rgba(59,130,246,0.08)" },
  retina: { label: "Fond d'œil",    color: "#06B6D4", icon: I.Eye, bg: "rgba(6,182,212,0.08)" },
};

const STATUS_CONFIG = {
  pending:  { label: "En attente", color: "#F59E0B", bg: "#FFFBEB", icon: I.Clock },
  accepted: { label: "En cours",   color: "#3B82F6", bg: "#EFF6FF", icon: I.Check },
  analyzed: { label: "Résultats",  color: "#10B981", bg: "#ECFDF5", icon: I.Check },
  closed:   { label: "Terminé",   color: "#6B7280", bg: "#F9FAFB", icon: I.Shield },
};

const URGENCY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#EF4444", bg: "#FEE2E2" },
  urgent:   { label: "URGENT",   color: "#F59E0B", bg: "#FEF3C7" },
  normal:   { label: "NORMAL",   color: "#10B981", bg: "#D1FAE5" },
};

// ── Modal de planification ────────────────────────────────────────
const AppointmentModal = ({ isOpen, onClose, consultation, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !consultation) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 28, padding: 32,
        maxWidth: 500, width: "100%", position: "relative"
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0A1628", marginBottom: 8 }}>
          Planifier un rendez-vous
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#64748B", marginBottom: 24 }}>
          Patient : {consultation?.patient_name}
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            Date et heure
          </label>
          <input
            type="datetime-local"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              width: "100%", padding: 12, borderRadius: 12,
              border: "1.5px solid #E2E8F0", fontSize: "0.9rem",
              outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes pour le rendez-vous..."
            rows={3}
            style={{
              width: "100%", padding: 12, borderRadius: 12,
              border: "1.5px solid #E2E8F0", fontSize: "0.85rem",
              resize: "vertical", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: "#F1F5F9", border: "none",
              color: "#64748B", fontWeight: 700,
              fontSize: "0.85rem", cursor: "pointer"
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (!selectedDate) return;
              setLoading(true);
              onConfirm(selectedDate, notes);
              setLoading(false);
              onClose();
            }}
            disabled={!selectedDate || loading}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: "linear-gradient(135deg, #D4A500, #B8941E)",
              border: "none", color: "#fff", fontWeight: 700,
              fontSize: "0.85rem", cursor: !selectedDate ? "not-allowed" : "pointer",
              opacity: !selectedDate ? 0.6 : 1
            }}
          >
            {loading ? "..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DoctorUpcomingCallsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeConsultations, setActiveConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("medai-token");
    if (!token) { setLoading(false); return; }

    fetch(`${API}/consultations/assigned`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : { consultations: [] })
      .then(data => {
        const consultations = data.consultations || [];
        
        // Rendez-vous planifiés (avec appointment)
        const upcoming = consultations
          .filter(c => c.scheduled_at)
          .map(c => ({
            id: c.appointment_id,
            consultation_id: c.id,
            scheduled_at: c.scheduled_at,
            patient_name: c.patient_name,
            model_key: c.model_key,
            status: c.status,
            type: c.appointment_type || "video",
            notes: c.appointment_notes
          }))
          .filter(apt => new Date(apt.scheduled_at) > new Date())
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

        // Consultations actives (accepted/analyzed) - AVEC ou SANS RDV
        const active = consultations
          .filter(c => c.status === "accepted" || c.status === "analyzed")
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        setAppointments(upcoming);
        setActiveConsultations(active);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur fetch:", err);
        setLoading(false);
      });
  }, []);

  const canJoin = (scheduledAt) => {
    if (!scheduledAt) return false;
    const aptDate = new Date(scheduledAt);
    const now = new Date();
    const diff = aptDate - now;
    return diff <= 5 * 60 * 1000 && diff > -10 * 60 * 1000;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit"
    });
  };

  const joinCall = (consultationId) => {
    window.open(`/video-consultation/${consultationId}?room=medai-${consultationId}`, "_blank");
  };

  const scheduleAppointment = async (consultationId, dateStr, notes) => {
    const token = localStorage.getItem("medai-token");
    try {
      const res = await fetch(`${API}/consultations/${consultationId}/appointment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scheduled_at: new Date(dateStr).toISOString(),
          notes: notes || "",
          type: "video"
        })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Erreur lors de la planification");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const openScheduleModal = (consultation) => {
    setSelectedConsultation(consultation);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{
          width: 48, height: 48,
          border: "3px solid rgba(212,165,0,0.2)",
          borderTopColor: "#D4A500",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#64748B" }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 0" }}>
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: RENDEZ-VOUS PLANIFIÉS (EN HAUT)
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 20
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 10,
          background: "linear-gradient(135deg, #0F1B2D, #1A2D4A)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <I.Calendar size={16} color="#FFD700" />
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, marginBottom: 40 }}>
        {/* ── Colonne gauche: Liste des rendez-vous ── */}
        <div>
          {appointments.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 40px",
              background: "#FFFFFF",
              borderRadius: 28,
              border: "1px solid rgba(30, 60, 110, 0.08)"
            }}>
              <div style={{
                width: 80, height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(212,165,0,0.08))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px"
              }}>
                <I.Calendar size={36} color="#D4A500" />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F1B2D", marginBottom: 8 }}>
                Aucun rendez-vous planifié
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#94A3B8", maxWidth: 300, margin: "0 auto" }}>
                Les rendez-vous apparaîtront ici une fois planifiés avec vos patients.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {appointments.map(apt => {
                const model = MODEL_CONFIG[apt.model_key] || MODEL_CONFIG.chest;
                const joinable = canJoin(apt.scheduled_at);
                const timeLeft = new Date(apt.scheduled_at) - new Date();

                return (
                  <div key={apt.id} style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: "24px 28px",
                    border: joinable 
                      ? "1.5px solid rgba(16, 185, 129, 0.4)" 
                      : "1px solid rgba(30, 60, 110, 0.08)",
                    boxShadow: joinable
                      ? "0 4px 20px rgba(16, 185, 129, 0.12)"
                      : "0 2px 12px rgba(0,0,0,0.02)",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    transition: "all 0.3s ease"
                  }}>
                    <div style={{
                      width: 52, height: 52,
                      borderRadius: 16,
                      background: model.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <model.icon size={22} color={model.color} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F1B2D", margin: 0 }}>
                          Patient : {apt.patient_name}
                        </h3>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700,
                          padding: "3px 10px", borderRadius: 20,
                          background: "rgba(16,185,129,0.12)", color: "#10B981",
                          border: "1px solid rgba(16,185,129,0.25)",
                          display: "flex", alignItems: "center", gap: 4
                        }}>
                          <I.Check size={10} color="#10B981" />
                          CONFIRMÉ
                        </span>
                      </div>

                      <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: 10 }}>
                        Consultation #{apt.consultation_id} • {apt.type === "video" ? "Vidéo consultation" : "Présentiel"}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          <I.Calendar size={13} color="#94A3B8" />
                          {formatDate(apt.scheduled_at)}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                          <I.Clock size={13} color="#94A3B8" />
                          {formatTime(apt.scheduled_at)}
                        </span>
                      </div>

                      {!joinable && timeLeft > 0 && (
                        <div style={{ 
                          marginTop: 8, 
                          fontSize: "0.7rem", 
                          color: "#D4A500",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          <I.Clock size={12} color="#D4A500" />
                          Disponible dans {Math.ceil(timeLeft / 60000)} min
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => joinable && joinCall(apt.consultation_id)}
                      disabled={!joinable}
                      style={{
                        padding: "12px 24px",
                        borderRadius: 40,
                        background: joinable 
                          ? "linear-gradient(135deg, #10B981, #059669)" 
                          : "linear-gradient(135deg, #94A3B8, #64748B)",
                        border: "none",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: joinable ? "pointer" : "not-allowed",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        opacity: joinable ? 1 : 0.7,
                        transition: "all 0.3s ease",
                        boxShadow: joinable ? "0 4px 18px rgba(16, 185, 129, 0.3)" : "none"
                      }}
                    >
                      <I.Video size={16} />
                      {joinable ? "Rejoindre" : "En attente"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Colonne droite: Carte bleue marine ── */}
        <div style={{
          background: "linear-gradient(135deg, #0A1628 0%, #1a2d4d 50%, #0d1f3c 100%)",
          borderRadius: 24,
          padding: "32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(10,22,40,0.3)",
          height: "fit-content",
          position: "sticky",
          top: 20
        }}>
          <div style={{ position: "absolute", top: "-30%", right: "-20%", width: "70%", height: "160%", background: "radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "50%", height: "120%", background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 50, height: 50,
                borderRadius: 14,
                background: "rgba(16,185,129,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <I.Camera size={24} color="#10B981" />
              </div>
              <div>
                <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Appel sécurisé</h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", margin: 0 }}>Chiffrement de bout en bout</p>
              </div>
            </div>

            {[
              { icon: I.Shield, title: "Sécurité maximale", desc: "Conforme RGPD / HIPAA", color: "#10B981" },
              { icon: I.Clock, title: "Qualité HD", desc: "Jusqu'à 1080p", color: "#3B82F6" },
              { icon: I.Users, title: "Jusqu'à 5 participants", desc: "Incluant le patient", color: "#8B5CF6" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none"
              }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 12,
                  background: `${item.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  <item.icon size={20} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>{item.title}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: 20,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 8, height: 8,
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px #10B981",
                animation: "pulse 2s infinite"
              }} />
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>Système opérationnel • 98.5% uptime</span>
            </div>
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: CONSULTATIONS ACTIVES (EN BAS)
          ═══════════════════════════════════════════════════════════════ */}
      {activeConsultations.length > 0 && (
        <>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #0F1B2D, #1A2D4A)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I.Video size={16} color="#FFD700" />
            </div>
            <h2 style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#0F1B2D",
              margin: 0
            }}>
              Consultations actives <span style={{ color: "#94A3B8", fontWeight: 500 }}>({activeConsultations.length})</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeConsultations.map(c => {
              const model = MODEL_CONFIG[c.model_key] || MODEL_CONFIG.chest;
              const urgency = URGENCY_CONFIG[c.urgency] || URGENCY_CONFIG.normal;
              const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;

              // ── ÉTAT DU RENDEZ-VOUS ──────────────────────────────
              const hasAppointment = !!c.scheduled_at;
              const isAppointmentTime = hasAppointment && canJoin(c.scheduled_at);
              const timeLeft = hasAppointment ? new Date(c.scheduled_at) - new Date() : null;

              // Déterminer l'état du bouton
              let buttonState = "plan"; // plan | wait | call
              if (hasAppointment) {
                buttonState = isAppointmentTime ? "call" : "wait";
              }

              const buttonConfig = {
                plan: {
                  bg: "linear-gradient(135deg, #F59E0B, #D97706)",
                  text: "Planifier RDV",
                  icon: <I.Plus size={16} />,
                  cursor: "pointer",
                  opacity: 1,
                  shadow: "0 4px 18px rgba(245, 158, 11, 0.3)"
                },
                wait: {
                  bg: "linear-gradient(135deg, #94A3B8, #64748B)",
                  text: "En attente",
                  icon: <I.Clock size={16} />,
                  cursor: "not-allowed",
                  opacity: 0.7,
                  shadow: "none"
                },
                call: {
                  bg: "linear-gradient(135deg, #10B981, #059669)",
                  text: "Appel vidéo",
                  icon: <I.Video size={16} />,
                  cursor: "pointer",
                  opacity: 1,
                  shadow: "0 4px 18px rgba(16, 185, 129, 0.3)"
                }
              };

              const btn = buttonConfig[buttonState];

              return (
                <div key={c.id} style={{
                  background: "#FFFFFF",
                  borderRadius: 20,
                  padding: "20px 24px",
                  border: isAppointmentTime
                    ? "1.5px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid rgba(30, 60, 110, 0.08)",
                  borderLeft: `4px solid ${urgency.color}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  boxShadow: isAppointmentTime
                    ? "0 4px 20px rgba(16, 185, 129, 0.12)"
                    : "0 2px 12px rgba(0,0,0,0.02)",
                  transition: "all 0.3s ease"
                }}>
                  <div style={{
                    width: 48, height: 48,
                    borderRadius: 14,
                    background: model.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <model.icon size={20} color={model.color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0F1B2D", margin: 0 }}>
                        {c.patient_name}
                      </h3>
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 700,
                        padding: "2px 8px", borderRadius: 12,
                        background: urgency.bg, color: urgency.color,
                        border: `1px solid ${urgency.color}30`
                      }}>
                        {urgency.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "0.7rem", padding: "2px 10px", borderRadius: 12,
                        background: status.bg, color: status.color,
                        display: "flex", alignItems: "center", gap: 4
                      }}>
                        <status.icon size={10} color={status.color} />
                        {status.label}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#8899AA" }}>{model.label}</span>
                    </div>

                    {/* Info rendez-vous */}
                    {hasAppointment && (
                      <div style={{ 
                        marginTop: 6, 
                        fontSize: "0.7rem", 
                        color: isAppointmentTime ? "#10B981" : "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <I.Calendar size={12} color={isAppointmentTime ? "#10B981" : "#94A3B8"} />
                        {isAppointmentTime 
                          ? "Rendez-vous maintenant — prêt pour l'appel"
                          : `${formatDate(c.scheduled_at)} à ${formatTime(c.scheduled_at)}`
                        }
                        {!isAppointmentTime && timeLeft > 0 && (
                          <span style={{ color: "#D4A500", marginLeft: 4 }}>
                            (dans {Math.ceil(timeLeft / 60000)} min)
                          </span>
                        )}
                      </div>
                    )}
                    {!hasAppointment && (
                      <div style={{ 
                        marginTop: 6, 
                        fontSize: "0.7rem", 
                        color: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <I.AlertTriangle size={12} color="#F59E0B" />
                        Aucun rendez-vous planifié
                      </div>
                    )}
                  </div>

                  {/* BOUTON INTELLIGENT */}
                  <button
                    onClick={() => {
                      if (buttonState === "plan") {
                        openScheduleModal(c);
                      } else if (buttonState === "call") {
                        joinCall(c.id);
                      }
                    }}
                    disabled={buttonState === "wait"}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 40,
                      background: btn.bg,
                      border: "none",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: btn.cursor,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      opacity: btn.opacity,
                      transition: "all 0.3s ease",
                      flexShrink: 0,
                      boxShadow: btn.shadow
                    }}
                    onMouseEnter={buttonState !== "wait" ? (e) => {
                      e.target.style.transform = "translateY(-2px)";
                      if (buttonState === "call") {
                        e.target.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.4)";
                      } else if (buttonState === "plan") {
                        e.target.style.boxShadow = "0 8px 24px rgba(245, 158, 11, 0.4)";
                      }
                    } : undefined}
                    onMouseLeave={buttonState !== "wait" ? (e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = btn.shadow;
                    } : undefined}
                  >
                    {btn.icon}
                    {btn.text}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Modal de planification ── */}
      <AppointmentModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedConsultation(null); }}
        consultation={selectedConsultation}
        onConfirm={(dateStr, notes) => {
          if (selectedConsultation) {
            scheduleAppointment(selectedConsultation.id, dateStr, notes);
          }
        }}
      />
    </div>
  );
}