// pages/DoctorQueue.jsx
// File d'attente médecin : consultations pending + cas assignés
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

const STATUS_CONFIG = {
  pending:  { label: "En attente",  color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "⏳" },
  accepted: { label: "Acceptée",    color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", icon: "✅" },
  analyzed: { label: "Analysée",    color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "🤖" },
  closed:   { label: "Terminée",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: "🔒" },
  rejected: { label: "Rejetée",     color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "✕" },
};

const URGENCY_CONFIG = {
  critical: { label: "Critique", color: "#DC2626", bg: "#FEE2E2", pulse: true },
  urgent:   { label: "Urgent",   color: "#F59E0B", bg: "#FFFBEB", pulse: false },
  normal:   { label: "Normal",   color: "#6B7280", bg: "#F9FAFB", pulse: false },
};

const MODEL_ICONS = { brain: "🧠", lung: "🔬", chest: "🫁" };
const MODEL_LABELS = { brain: "IRM cérébrale", lung: "Scanner CT pulmonaire", chest: "Radiographie thoracique" };

export default function DoctorQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  const [tab, setTab] = useState("queue"); // queue | assigned
  const [queue, setQueue] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [qRes, aRes] = await Promise.all([
        fetch(`${API}/consultations/queue`, { headers }),
        fetch(`${API}/consultations/assigned`, { headers }),
      ]);
      if (!qRes.ok || !aRes.ok) throw new Error("Erreur de chargement");
      const qData = await qRes.json();
      const aData = await aRes.json();
      setQueue(qData.consultations || []);
      setAssigned(aData.consultations || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Accepter ──
  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/consultations/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Erreur"); }
      fetchData();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  // ── Rejeter ──
  const handleReject = async () => {
    if (!rejectModal.id) return;
    setActionLoading(rejectModal.id);
    try {
      const form = new FormData();
      form.append("reason", rejectReason);
      const res = await fetch(`${API}/consultations/${rejectModal.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Erreur"); }
      setRejectModal({ open: false, id: null });
      setRejectReason("");
      fetchData();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const waitMinutes = (d) => {
    if (!d) return "—";
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `${diff} min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}j`;
  };

  const currentList = tab === "queue" ? queue : assigned;
  const queueCount = queue.length;
  const assignedByStatus = {
    accepted: assigned.filter(c => c.status === "accepted"),
    analyzed: assigned.filter(c => c.status === "analyzed"),
    closed:   assigned.filter(c => c.status === "closed"),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'DM Sans', sans-serif", padding: "24px 32px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes urgentPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.3)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <button onClick={() => navigate("/home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748B", fontSize: ".82rem", cursor: "pointer", marginBottom: 8, padding: 0 }}>
              ← Retour au dashboard
            </button>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", letterSpacing: "-.02em" }}>
              File de consultations
            </h1>
            <p style={{ color: "#64748B", fontSize: ".85rem" }}>
              {user?.specialty || "Médecin"} · Domaines : {(user?.domains || []).join(", ")}
            </p>
          </div>
          <button onClick={fetchData} style={{
            padding: "8px 16px", background: "white", border: "1.5px solid #E2E8F0",
            borderRadius: 10, fontSize: ".8rem", fontWeight: 600, color: "#475569",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            🔄 Actualiser
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 14, padding: 4, border: "1px solid #E2E8F0", marginBottom: 24 }}>
          {[
            { key: "queue", label: "File d'attente", count: queueCount },
            { key: "assigned", label: "Mes cas", count: assigned.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "10px", borderRadius: 11, fontSize: ".85rem", fontWeight: 700,
              background: tab === t.key ? "#0A2647" : "transparent",
              color: tab === t.key ? "white" : "#64748B",
              border: "none", cursor: "pointer", transition: "all .2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {t.label}
              {t.count > 0 && (
                <span style={{
                  padding: "1px 8px", borderRadius: 10, fontSize: ".72rem", fontWeight: 800,
                  background: tab === t.key ? "rgba(255,255,255,.2)" : "#F1F5F9",
                  color: tab === t.key ? "white" : "#64748B",
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, color: "#DC2626", fontSize: ".85rem", marginBottom: 18 }}>
            ⚠️ {error}
            <button onClick={() => setError("")} style={{ marginLeft: 12, background: "none", border: "none", color: "#DC2626", fontWeight: 700, cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTopColor: "#0A2647", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
            Chargement…
          </div>
        )}

        {/* ══ QUEUE TAB ══ */}
        {!loading && tab === "queue" && currentList.length === 0 && (
          <div style={{ background: "white", borderRadius: 20, padding: "60px 24px", border: "1px solid #E2E8F0", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 14 }}>🎉</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>File d'attente vide</div>
            <div style={{ fontSize: ".85rem", color: "#94A3B8" }}>Aucune nouvelle demande pour le moment.</div>
          </div>
        )}

        {!loading && tab === "queue" && currentList.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {currentList.map(c => {
              const ur = URGENCY_CONFIG[c.urgency] || URGENCY_CONFIG.normal;
              return (
                <div key={c.id} style={{
                  background: "white", borderRadius: 16, padding: "20px 22px",
                  border: `1.5px solid ${ur.pulse ? ur.color + "44" : "#E2E8F0"}`,
                  boxShadow: ur.pulse ? `0 0 0 0 rgba(220,38,38,.2)` : "0 1px 4px rgba(0,0,0,.04)",
                  animation: ur.pulse ? "fadeUp .3s ease, urgentPulse 2s infinite" : "fadeUp .3s ease",
                }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    {/* Icône */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.6rem", flexShrink: 0,
                    }}>
                      {MODEL_ICONS[c.model_key] || "📋"}
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: ".95rem", fontWeight: 700, color: "#0A2647" }}>
                          #{c.id} — {MODEL_LABELS[c.model_key] || c.model_key}
                        </span>
                        <span style={{
                          padding: "2px 10px", borderRadius: 20, fontSize: ".68rem", fontWeight: 700,
                          background: ur.bg, color: ur.color,
                        }}>
                          {ur.label}
                        </span>
                      </div>
                      <div style={{ fontSize: ".8rem", color: "#64748B", marginBottom: 6 }}>
                        Patient : <strong>{c.patient_name || "Inconnu"}</strong> · Attente : {waitMinutes(c.created_at)}
                      </div>
                      {c.patient_notes && (
                        <div style={{
                          padding: "8px 12px", background: "#F8FAFC", borderRadius: 10,
                          fontSize: ".78rem", color: "#475569", border: "1px solid #F1F5F9",
                          lineHeight: 1.5, marginBottom: 8,
                        }}>
                          "{c.patient_notes}"
                        </div>
                      )}
                      <div style={{ fontSize: ".72rem", color: "#94A3B8" }}>{formatDate(c.created_at)}</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleAccept(c.id)} disabled={actionLoading === c.id} style={{
                        padding: "10px 20px", background: actionLoading === c.id ? "#E2E8F0" : "linear-gradient(135deg, #059669, #047857)",
                        border: "none", borderRadius: 10, color: "white", fontSize: ".82rem",
                        fontWeight: 700, cursor: actionLoading === c.id ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                      }}>
                        {actionLoading === c.id ? (
                          <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .8s linear infinite" }} /></>)
                          : "✅ Accepter"}
                      </button>
                      <button onClick={() => setRejectModal({ open: true, id: c.id })} style={{
                        padding: "8px 16px", background: "white", border: "1.5px solid #FECACA",
                        borderRadius: 10, color: "#DC2626", fontSize: ".78rem",
                        fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                      }}>
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ASSIGNED TAB ══ */}
        {!loading && tab === "assigned" && (
          <div>
            {Object.entries(assignedByStatus).map(([status, items]) => {
              if (items.length === 0) return null;
              const sc = STATUS_CONFIG[status];
              return (
                <div key={status} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: "1rem" }}>{sc.icon}</span>
                    <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#0A2647" }}>{sc.label}</span>
                    <span style={{
                      padding: "1px 8px", borderRadius: 10, fontSize: ".7rem", fontWeight: 700,
                      background: sc.bg, color: sc.color,
                    }}>{items.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map(c => (
                      <div key={c.id} onClick={() => navigate(`/consultation/${c.id}`)} style={{
                        background: "white", borderRadius: 14, padding: "16px 20px",
                        border: "1px solid #E2E8F0", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 16,
                        transition: "all .2s",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#0A2647"; e.currentTarget.style.transform = "translateX(4px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = ""; }}
                      >
                        <span style={{ fontSize: "1.3rem" }}>{MODEL_ICONS[c.model_key]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0A2647" }}>
                            #{c.id} — {c.patient_name}
                          </div>
                          <div style={{ fontSize: ".75rem", color: "#94A3B8" }}>{formatDate(c.updated_at)}</div>
                        </div>
                        <div style={{ color: "#CBD5E1" }}>→</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {assigned.length === 0 && (
              <div style={{ background: "white", borderRadius: 20, padding: "60px 24px", border: "1px solid #E2E8F0", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: 14 }}>📋</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>Aucun cas assigné</div>
                <div style={{ fontSize: ".85rem", color: "#94A3B8" }}>Acceptez des consultations depuis la file d'attente.</div>
              </div>
            )}
          </div>
        )}

        {/* ══ REJECT MODAL ══ */}
        {rejectModal.open && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div style={{
              background: "white", borderRadius: 20, padding: "28px", maxWidth: 440, width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,.2)", animation: "fadeUp .2s ease",
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0A2647", marginBottom: 6 }}>
                Rejeter la consultation #{rejectModal.id}
              </h3>
              <p style={{ fontSize: ".82rem", color: "#64748B", marginBottom: 18 }}>
                Le patient sera notifié. Vous pouvez indiquer une raison (optionnel).
              </p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Raison du rejet (optionnel)…"
                rows={3} style={{
                  width: "100%", padding: "12px", background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0", borderRadius: 12,
                  fontSize: ".85rem", color: "#0A2647", resize: "none",
                  fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
                  marginBottom: 18,
                }}
                onFocus={e => e.target.style.borderColor = "#DC2626"}
                onBlur={e => e.target.style.borderColor = "#E2E8F0"}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setRejectModal({ open: false, id: null }); setRejectReason(""); }}
                  style={{ flex: 1, padding: "10px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: ".85rem", fontWeight: 600, cursor: "pointer" }}>
                  Annuler
                </button>
                <button onClick={handleReject} disabled={actionLoading === rejectModal.id}
                  style={{ flex: 1, padding: "10px", background: actionLoading ? "#E2E8F0" : "#DC2626", border: "none", borderRadius: 12, color: "white", fontSize: ".85rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                  {actionLoading === rejectModal.id ? "…" : "Confirmer le rejet"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}