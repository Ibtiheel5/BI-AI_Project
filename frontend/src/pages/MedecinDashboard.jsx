// pages/MedecinDashboard.jsx
// Dashboard médecin : stats, file rapide, cas récents
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

const MODEL_ICONS = { brain: "🧠", lung: "🔬", chest: "🫁" };
const MODEL_LABELS = { brain: "IRM cérébrale", lung: "Scanner CT", chest: "Radio thoracique" };

const STATUS_CONFIG = {
  pending:  { label: "Attente",  color: "#F59E0B", bg: "#FFFBEB" },
  accepted: { label: "Acceptée", color: "#3B82F6", bg: "#EFF6FF" },
  analyzed: { label: "Analysée", color: "#059669", bg: "#ECFDF5" },
  closed:   { label: "Terminée", color: "#6B7280", bg: "#F9FAFB" },
};

const URGENCY_CONFIG = {
  critical: { label: "Critique", color: "#DC2626", bg: "#FEE2E2" },
  urgent:   { label: "Urgent",   color: "#F59E0B", bg: "#FFFBEB" },
};

export default function MedecinDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  const [queue, setQueue] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [qRes, aRes, nRes] = await Promise.all([
        fetch(`${API}/consultations/queue`, { headers }),
        fetch(`${API}/consultations/assigned`, { headers }),
        fetch(`${API}/consultations/notifications/me?unread_only=false`, { headers }),
      ]);
      if (!qRes.ok || !aRes.ok) throw new Error("Erreur");
      const qData = await qRes.json();
      const aData = await aRes.json();
      const nData = nRes.ok ? await nRes.json() : { notifications: [], unread: 0 };

      setQueue(qData.consultations || []);
      setAssigned(aData.consultations || []);
      setNotifications(nData.notifications || []);
      setUnreadCount(nData.unread || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markAllRead = async () => {
    try {
      await fetch(`${API}/consultations/notifications/read-all`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(0);
      setNotifications(n => n.map(n => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const waitMinutes = (d) => {
    if (!d) return "—";
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h`;
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const formatNotifTime = (d) => {
    const dt = new Date(d);
    const diff = Math.floor((Date.now() - dt.getTime()) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const NOTIF_ICONS = {
    new_consultation: "📋", consultation_accepted: "✅", consultation_rejected: "❌",
    analysis_ready: "🤖", appointment_scheduled: "📅", consultation_closed: "🔒",
    new_message: "💬", doctor_changed: "🔄",
  };

  const stats = [
    { label: "En attente",   value: queue.length,                                                    icon: "⏳", bg: "#FFFBEB", color: "#D97706" },
    { label: "En cours",     value: assigned.filter(c => c.status === "accepted").length,             icon: "🔄", bg: "#EFF6FF", color: "#3B82F6" },
    { label: "Résultats prêts", value: assigned.filter(c => c.status === "analyzed").length,          icon: "🤖", bg: "#ECFDF5", color: "#059669" },
    { label: "Terminées",    value: assigned.filter(c => c.status === "closed").length,               icon: "✅", bg: "#F0FDF4", color: "#16A34A" },
  ];

  const criticalQueue = queue.filter(c => c.urgency === "critical" || c.urgency === "urgent");

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'DM Sans', sans-serif", padding: "24px 32px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        @keyframes urgentPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.25)}50%{box-shadow:0 0 0 6px rgba(220,38,38,0)}}
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0A2647", letterSpacing: "-.02em", marginBottom: 4 }}>
              Dr. {user?.full_name || "Médecin"}
            </h1>
            <p style={{ color: "#64748B", fontSize: ".9rem" }}>
              {user?.specialty || "Médecin"} · Domaines : {(user?.domains || []).map(d => (
                <span key={d} style={{ display: "inline-block", padding: "2px 8px", background: "#EDE9FE", color: "#7C3AED", borderRadius: 6, fontSize: ".75rem", fontWeight: 600, marginRight: 4, marginLeft: 4 }}>
                  {MODEL_ICONS[d]} {d}
                </span>
              ))}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowNotifs(!showNotifs)} style={{
                width: 42, height: 42, borderRadius: 12, background: "white",
                border: "1.5px solid #E2E8F0", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1.15rem", cursor: "pointer",
              }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    width: 20, height: 20, borderRadius: "50%", background: "#DC2626",
                    color: "white", fontSize: ".65rem", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "pulse 2s infinite",
                  }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>

              {showNotifs && (
                <div style={{
                  position: "absolute", top: 50, right: 0, width: 360,
                  background: "white", borderRadius: 16, border: "1px solid #E2E8F0",
                  boxShadow: "0 12px 40px rgba(0,0,0,.12)", zIndex: 100, overflow: "hidden",
                  animation: "fadeUp .2s ease",
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: ".9rem", color: "#0A2647" }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#3B82F6", fontSize: ".75rem", fontWeight: 600, cursor: "pointer" }}>Tout lire</button>
                    )}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 30, textAlign: "center", color: "#94A3B8", fontSize: ".85rem" }}>Aucune notification</div>
                    ) : notifications.slice(0, 8).map(n => (
                      <div key={n.id} onClick={() => {
                        try {
                          const d = typeof n.data === "string" ? JSON.parse(n.data) : n.data;
                          if (d.consultation_id) navigate(`/consultation/${d.consultation_id}`);
                        } catch (e) {}
                        setShowNotifs(false);
                      }} style={{
                        padding: "12px 16px", borderBottom: "1px solid #F8FAFC",
                        cursor: "pointer", background: n.is_read ? "white" : "#F0F9FF",
                      }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: "1.1rem" }}>{NOTIF_ICONS[n.type] || "📌"}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#0A2647", marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: ".73rem", color: "#64748B", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                            <div style={{ fontSize: ".65rem", color: "#94A3B8", marginTop: 4 }}>{formatNotifTime(n.created_at)}</div>
                          </div>
                          {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", flexShrink: 0, marginTop: 6 }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => navigate("/doctor/queue")} style={{
              padding: "10px 20px", background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
              border: "none", borderRadius: 12, color: "white", fontSize: ".88rem",
              fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(10,38,71,.25)",
            }}>
              {queue.length > 0 && (
                <span style={{ background: "rgba(255,255,255,.2)", padding: "1px 7px", borderRadius: 8, fontSize: ".75rem" }}>{queue.length}</span>
              )}
              Voir la file d'attente →
            </button>
          </div>
        </div>

        {/* Alert urgents */}
        {criticalQueue.length > 0 && (
          <div style={{
            padding: "16px 20px", background: "#FEE2E2", borderRadius: 14,
            border: "1.5px solid #FCA5A5", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 12,
            animation: "fadeUp .3s ease",
          }}>
            <span style={{ fontSize: "1.4rem" }}>🚨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#991B1B", marginBottom: 2 }}>
                {criticalQueue.length} demande{criticalQueue.length > 1 ? "s" : ""} urgente{criticalQueue.length > 1 ? "s" : ""} en attente
              </div>
              <div style={{ fontSize: ".78rem", color: "#B91C1C" }}>
                {criticalQueue.map(c => `#${c.id}`).join(", ")} — Prenez en charge immédiatement.
              </div>
            </div>
            <button onClick={() => navigate("/doctor/queue")} style={{
              padding: "8px 16px", background: "#DC2626", border: "none", borderRadius: 10,
              color: "white", fontSize: ".8rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}>
              Intervenir →
            </button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28, animation: "fadeUp .3s ease" }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: "white", borderRadius: 16, padding: "18px 20px",
              border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: "1.3rem" }}>{s.icon}</span>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 800, color: s.color }}>
                  {loading ? "…" : s.value}
                </div>
              </div>
              <div style={{ fontSize: ".78rem", color: "#64748B", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* File rapide */}
          <div style={{ background: "white", borderRadius: 20, padding: "22px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(10,38,71,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0A2647" }}>File d'attente</h2>
              <button onClick={() => navigate("/doctor/queue")} style={{ background: "none", border: "none", color: "#3B82F6", fontSize: ".78rem", fontWeight: 700, cursor: "pointer" }}>
                Voir tout →
              </button>
            </div>

            {queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#94A3B8", fontSize: ".85rem" }}>
                🎉 File vide
              </div>
            ) : queue.slice(0, 5).map(c => {
              const ur = URGENCY_CONFIG[c.urgency];
              return (
                <div key={c.id} onClick={() => navigate(`/consultation/${c.id}`)} style={{
                  padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                  background: ur ? ur.bg : "#F8FAFC", border: `1px solid ${ur ? ur.color + "33" : "#F1F5F9"}`,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                  transition: "all .15s",
                  animation: ur?.color === "#DC2626" ? "fadeUp .3s ease, urgentPulse 2s infinite" : "fadeUp .3s ease",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = ""}
                >
                  <span style={{ fontSize: "1.2rem" }}>{MODEL_ICONS[c.model_key]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#0A2647", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      #{c.id} — {c.patient_name}
                    </div>
                    <div style={{ fontSize: ".7rem", color: "#94A3B8" }}>{waitMinutes(c.created_at)}</div>
                  </div>
                  {ur && (
                    <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: ".65rem", fontWeight: 700, background: ur.bg, color: ur.color }}>
                      {ur.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cas récents */}
          <div style={{ background: "white", borderRadius: 20, padding: "22px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(10,38,71,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0A2647" }}>Mes cas récents</h2>
            </div>

            {assigned.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#94A3B8", fontSize: ".85rem" }}>
                📋 Aucun cas assigné
              </div>
            ) : assigned.slice(0, 5).map(c => {
              const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              return (
                <div key={c.id} onClick={() => navigate(`/consultation/${c.id}`)} style={{
                  padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                  background: "#F8FAFC", border: "1px solid #F1F5F9",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                  transition: "all .15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = ""}
                >
                  <span style={{ fontSize: "1.2rem" }}>{MODEL_ICONS[c.model_key]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#0A2647", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      #{c.id} — {c.patient_name}
                    </div>
                    <div style={{ fontSize: ".7rem", color: "#94A3B8" }}>{formatDate(c.updated_at)}</div>
                  </div>
                  <span style={{ padding: "2px 10px", borderRadius: 8, fontSize: ".68rem", fontWeight: 700, background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { icon: "🔬", label: "Classification directe", desc: "Analyser une image sans consultation", action: () => navigate("/classification"), color: "#7C3AED", bg: "#EDE9FE" },
            { icon: "📖", label: "Pathologies", desc: "Explorer les pathologies par modèle", action: () => navigate("/pathologies"), color: "#0369A1", bg: "#E0F2FE" },
            { icon: "📋", label: "File complète", desc: "Gérer toutes les demandes", action: () => navigate("/doctor/queue"), color: "#059669", bg: "#ECFDF5" },
          ].map(a => (
            <button key={a.label} onClick={a.action} style={{
              padding: "18px 20px", background: "white", borderRadius: 16,
              border: "1px solid #E2E8F0", cursor: "pointer", textAlign: "left",
              transition: "all .2s", display: "flex", alignItems: "center", gap: 14,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${a.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                {a.icon}
              </div>
              <div>
                <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#0A2647", marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: ".72rem", color: "#94A3B8" }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showNotifs && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowNotifs(false)} />}
    </div>
  );
}