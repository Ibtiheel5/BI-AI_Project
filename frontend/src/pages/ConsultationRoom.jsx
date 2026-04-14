// pages/ConsultationRoom.jsx
// Salle de consultation partagée patient/médecin : messages, analyse IA, RDV
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

const STATUS_FLOW = ["pending", "accepted", "analyzed", "closed"];
const STATUS_LABELS = {
  pending:  { label: "En attente",       icon: "⏳", color: "#F59E0B" },
  accepted: { label: "Acceptée",         icon: "✅", color: "#3B82F6" },
  analyzed: { label: "Résultat IA prêt", icon: "🤖", color: "#059669" },
  rejected: { label: "Rejetée",          icon: "❌", color: "#EF4444" },
  closed:   { label: "Terminée",         icon: "🔒", color: "#6B7280" },
};

const URGENCY_CONFIG = {
  critical: { label: "Critique", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" },
  urgent:   { label: "Urgent",   color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  normal:   { label: "Normal",   color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
};

const MODEL_ICONS = { brain: "🧠", lung: "🔬", chest: "🫁" };
const MODEL_LABELS = { brain: "IRM cérébrale", lung: "Scanner CT pulmonaire", chest: "Radiographie thoracique" };

export default function ConsultationRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("medai-token");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [showClose, setShowClose] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [showAppointment, setShowAppointment] = useState(false);
  const [apptData, setApptData] = useState({ type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" });

  // Analyse IA (simulation — en production appelerais le vrai endpoint ML)
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const isDoctor = user?.role === "Medecin" || user?.is_admin;
  const isPatient = user?.role === "Patient";

  // ── Fetch ──
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Erreur"); }
      const d = await res.json();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  // Polling toutes les 8s
  useEffect(() => {
    const interval = setInterval(fetchRoom, 8000);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  const c = data?.consultation;
  const a = data?.analysis;
  const msgs = data?.messages || [];
  const appt = data?.appointment;

  // ── Send message ──
  const sendMessage = async () => {
    if (!msgInput.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}/consultations/${id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }),
      });
      if (!res.ok) throw new Error("Erreur d'envoi");
      setMsgInput("");
      fetchRoom();
    } catch (e) { setError(e.message); }
    finally { setSendingMsg(false); }
  };

  // ── Accept ──
  const handleAccept = async () => {
    setActionLoading("accept");
    try {
      const res = await fetch(`${API}/consultations/${id}/accept`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchRoom();
    } catch (e) { setError("Impossible d'accepter."); }
    finally { setActionLoading(null); }
  };

  // ── Run analysis (simulation) ──
  const handleRunAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      // En production : appel au modèle ML puis POST /{id}/analysis
      // Ici on simule un résultat pour la démo
      const modelKey = c?.model_key || "chest";

      // Simuler un appel ML (remplacer par vrai appel)
      const fakeResults = {
        chest: { prediction: "Normal", confidence: 0.94, probabilities: JSON.stringify({ Normal: 0.94, "Lung Opacity": 0.03, Pneumonia: 0.02, Consolidation: 0.01 }), explain_text: "Aucune anomalie pulmonaire détectée. Les champs pulmonaires sont clairs et symétriques. Le cœur est de taille normale." },
        brain: { prediction: "no_tumor", confidence: 0.97, probabilities: JSON.stringify({ no_tumor: 0.97, glioma: 0.02, meningioma: 0.01, pituitary: 0.00 }), explain_text: "Pas de lésion intracrânienne identifiée. Les structures cérébrales présentent un aspect normal." },
        lung: { prediction: "benign", confidence: 0.89, probabilities: JSON.stringify({ benign: 0.89, malignant: 0.08, normal: 0.03 }), explain_text: "Opacité pulmonaire compatible avec une lésion bénigne. Pas de signe de malignité évident." },
      };

      const result = fakeResults[modelKey] || fakeResults.chest;

      const form = new FormData();
      form.append("prediction", result.prediction);
      form.append("confidence", String(result.confidence));
      form.append("probabilities", result.probabilities);
      form.append("explain_text", result.explain_text);
      form.append("gradcam_b64", "");
      form.append("out_of_domain", "false");
      form.append("warning", "");

      const res = await fetch(`${API}/consultations/${id}/analysis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Erreur analyse"); }
      fetchRoom();
    } catch (e) { setError(e.message); }
    finally { setAnalysisLoading(false); }
  };

  // ── Close ──
  const handleClose = async () => {
    setActionLoading("close");
    try {
      const form = new FormData();
      form.append("doctor_notes", closeNotes);
      const res = await fetch(`${API}/consultations/${id}/close`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!res.ok) throw new Error();
      setShowClose(false);
      setCloseNotes("");
      fetchRoom();
    } catch (e) { setError("Erreur clôture."); }
    finally { setActionLoading(null); }
  };

  // ── Appointment ──
  const handleCreateAppt = async () => {
    if (!apptData.scheduled_at) { setError("Choisissez une date."); return; }
    setActionLoading("appt");
    try {
      const res = await fetch(`${API}/consultations/appointments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: parseInt(id), ...apptData }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Erreur RDV"); }
      setShowAppointment(false);
      setApptData({ type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" });
      fetchRoom();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  // ── Transfer ──
  const handleTransfer = async () => {
    if (!transferTo) { setError("Sélectionnez un médecin."); return; }
    setActionLoading("transfer");
    try {
      const res = await fetch(`${API}/consultations/${id}/transfer`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to_doctor_id: parseInt(transferTo), reason: transferReason }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Erreur transfert"); }
      setShowTransfer(false);
      setTransferTo("");
      setTransferReason("");
      fetchRoom();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  // ── Helpers ──
  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatMsgTime = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center", color: "#94A3B8" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #E2E8F0", borderTopColor: "#0A2647", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
        Chargement de la consultation…
      </div>
    </div>
  );

  if (error && !data) return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 400, border: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 14 }}>⚠️</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647", marginBottom: 8 }}>{error}</div>
        <button onClick={() => navigate(-1)} style={{ padding: "10px 20px", background: "#0A2647", border: "none", borderRadius: 12, color: "white", fontSize: ".85rem", fontWeight: 700, cursor: "pointer" }}>← Retour</button>
      </div>
    </div>
  );

  const st = STATUS_LABELS[c?.status] || STATUS_LABELS.pending;
  const ur = URGENCY_CONFIG[c?.urgency] || URGENCY_CONFIG.normal;
  const canMessage = c?.status === "accepted" || c?.status === "analyzed";

  // Parse probabilities
  let probs = {};
  try { probs = a?.probabilities ? (typeof a.probabilities === "string" ? JSON.parse(a.probabilities) : a.probabilities) : {}; } catch (e) {}

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes progressFill{from{width:0}to{width:var(--fill)}}
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate(isDoctor ? "/home" : "/patient")} style={{ background: "none", border: "none", color: "#64748B", fontSize: ".82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            ← Retour
          </button>
          <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />
          <span style={{ fontSize: ".8rem", fontWeight: 700, color: "#0A2647" }}>#{c?.id}</span>
          <span style={{ fontSize: "1.1rem" }}>{MODEL_ICONS[c?.model_key]}</span>
          <span style={{ fontSize: ".82rem", color: "#475569", fontWeight: 600 }}>{MODEL_LABELS[c?.model_key]}</span>
          <span style={{
            padding: "3px 10px", borderRadius: 20, fontSize: ".7rem", fontWeight: 700,
            background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}33`,
          }}>
            {st.icon} {st.label}
          </span>
          {c?.urgency && c.urgency !== "normal" && (
            <span style={{
              padding: "3px 10px", borderRadius: 20, fontSize: ".7rem", fontWeight: 700,
              background: ur.bg, color: ur.color, border: `1px solid ${ur.border}`,
            }}>
              {ur.label}
            </span>
          )}
        </div>
        <div style={{ fontSize: ".72rem", color: "#94A3B8" }}>
          Créée {formatDate(c?.created_at)}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>

        {/* ═══ LEFT PANEL — Info + Actions ═══ */}
        <div style={{
          width: 340, flexShrink: 0, background: "white", borderRight: "1px solid #E2E8F0",
          overflowY: "auto", padding: 20,
        }}>

          {/* Patient / Doctor info */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
              {isPatient ? "Médecin" : "Patient"}
            </div>
            <div style={{
              padding: "12px 14px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #F1F5F9",
            }}>
              <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#0A2647" }}>
                {isPatient ? (c?.doctor_name ? `Dr. ${c.doctor_name}` : "Non assigné") : c?.patient_name}
              </div>
              {isPatient && c?.doctor_specialty && (
                <div style={{ fontSize: ".75rem", color: "#64748B" }}>{c.doctor_specialty}</div>
              )}
              {!isPatient && c?.patient_username && (
                <div style={{ fontSize: ".75rem", color: "#64748B" }}>@{c.patient_username}</div>
              )}
            </div>
          </div>

          {/* Notes patient */}
          {c?.patient_notes && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                Notes du patient
              </div>
              <div style={{ padding: "12px 14px", background: "#FFFBEB", borderRadius: 12, border: "1px solid #FDE68A", fontSize: ".82rem", color: "#92400E", lineHeight: 1.6 }}>
                {c.patient_notes}
              </div>
            </div>
          )}

          {/* Status timeline */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
              Progression
            </div>
            {STATUS_FLOW.map((s, i) => {
              const sl = STATUS_LABELS[s];
              const isActive = STATUS_FLOW.indexOf(c?.status) >= i;
              const isCurrent = c?.status === s;
              return (
                <div key={s} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < STATUS_FLOW.length - 1 ? 0 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isActive ? sl.color : "#F1F5F9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".7rem", color: isActive ? "white" : "#CBD5E1",
                      fontWeight: 700, flexShrink: 0,
                      boxShadow: isCurrent ? `0 0 0 4px ${sl.color}22` : "none",
                    }}>
                      {isActive ? sl.icon : (i + 1)}
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div style={{ width: 2, height: 20, background: isActive ? sl.color : "#E2E8F0" }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 4, paddingBottom: 14 }}>
                    <div style={{ fontSize: ".78rem", fontWeight: isActive ? 700 : 400, color: isActive ? "#0A2647" : "#CBD5E1" }}>
                      {sl.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Appointment */}
          {appt && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                Rendez-vous
              </div>
              <div style={{
                padding: "12px 14px", background: "#EFF6FF", borderRadius: 12,
                border: "1px solid #BFDBFE", fontSize: ".82rem",
              }}>
                <div style={{ fontWeight: 700, color: "#0369A1", marginBottom: 4 }}>
                  {appt.type === "video" ? "📹 Vidéo" : "🏥 Présentiel"} — {formatDate(appt.scheduled_at)}
                </div>
                <div style={{ color: "#64748B", fontSize: ".78rem" }}>
                  Durée : {appt.duration_minutes} min
                  {appt.video_link && <><br />Lien : <a href={appt.video_link} target="_blank" rel="noopener" style={{ color: "#3B82F6" }}>Rejoindre</a></>}
                  {appt.location && <><br />Lieu : {appt.location}</>}
                </div>
              </div>
            </div>
          )}

          {/* Doctor notes */}
          {c?.doctor_notes && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                Notes du médecin
              </div>
              <div style={{ padding: "12px 14px", background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0", fontSize: ".82rem", color: "#166534", lineHeight: 1.6 }}>
                {c.doctor_notes}
              </div>
            </div>
          )}

          {/* ═══ DOCTOR ACTIONS ═══ */}
          {isDoctor && c?.status !== "closed" && c?.status !== "rejected" && (
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
                Actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {c?.status === "pending" && (
                  <button onClick={handleAccept} disabled={actionLoading === "accept"} style={{
                    padding: "10px", background: actionLoading ? "#E2E8F0" : "linear-gradient(135deg, #059669, #047857)",
                    border: "none", borderRadius: 10, color: "white", fontSize: ".82rem",
                    fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer",
                  }}>
                    {actionLoading === "accept" ? "…" : "✅ Accepter la demande"}
                  </button>
                )}

                {c?.status === "accepted" && (
                  <button onClick={handleRunAnalysis} disabled={analysisLoading} style={{
                    padding: "10px", background: analysisLoading ? "#E2E8F0" : "linear-gradient(135deg, #7C3AED, #6D28D9)",
                    border: "none", borderRadius: 10, color: "white", fontSize: ".82rem",
                    fontWeight: 700, cursor: analysisLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {analysisLoading ? (
                      <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Analyse en cours…</>
                    ) : "🤖 Lancer l'analyse IA"}
                  </button>
                )}

                {(c?.status === "accepted" || c?.status === "analyzed") && (
                  <button onClick={() => setShowAppointment(true)} style={{
                    padding: "10px", background: "white", border: "1.5px solid #BFDBFE",
                    borderRadius: 10, color: "#0369A1", fontSize: ".82rem", fontWeight: 700, cursor: "pointer",
                  }}>
                    📅 Planifier un RDV
                  </button>
                )}

                {(c?.status === "accepted" || c?.status === "analyzed") && (
                  <button onClick={() => setShowTransfer(true)} style={{
                    padding: "10px", background: "white", border: "1.5px solid #FDE68A",
                    borderRadius: 10, color: "#D97706", fontSize: ".82rem", fontWeight: 700, cursor: "pointer",
                  }}>
                    🔄 Transférer le dossier
                  </button>
                )}

                {c?.status === "analyzed" && (
                  <button onClick={() => setShowClose(true)} style={{
                    padding: "10px", background: "white", border: "1.5px solid #E2E8F0",
                    borderRadius: 10, color: "#6B7280", fontSize: ".82rem", fontWeight: 700, cursor: "pointer",
                  }}>
                    🔒 Clôturer la consultation
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ CENTER — Messages ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: ".9rem", fontWeight: 600, marginBottom: 4 }}>
                  {canMessage ? "Aucun message pour le moment" : "Les messages seront disponibles après acceptation"}
                </div>
                <div style={{ fontSize: ".8rem" }}>
                  {canMessage ? "Commencez la discussion avec votre interlocuteur." : "En attente qu'un médecin accepte la demande."}
                </div>
              </div>
            )}

            {msgs.map(m => {
              const isMine = m.sender_id === user?.id;
              return (
                <div key={m.id} style={{
                  display: "flex", justifyContent: isMine ? "flex-end" : "flex-start",
                  marginBottom: 12, animation: "fadeUp .2s ease",
                }}>
                  <div style={{ maxWidth: "70%" }}>
                    {!isMine && (
                      <div style={{ fontSize: ".68rem", color: "#94A3B8", marginBottom: 3, fontWeight: 600 }}>
                        {m.sender_role === "Medecin" ? `Dr. ${m.sender_name}` : m.sender_name}
                      </div>
                    )}
                    <div style={{
                      padding: "10px 14px", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: isMine ? "#0A2647" : "white",
                      color: isMine ? "white" : "#0A2647",
                      fontSize: ".85rem", lineHeight: 1.6,
                      border: isMine ? "none" : "1px solid #E2E8F0",
                      boxShadow: isMine ? "0 2px 8px rgba(10,38,71,.15)" : "none",
                    }}>
                      {m.content}
                    </div>
                    <div style={{ fontSize: ".62rem", color: "#CBD5E1", marginTop: 3, textAlign: isMine ? "right" : "left" }}>
                      {formatMsgTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          {canMessage && (
            <div style={{
              padding: "14px 24px", background: "white", borderTop: "1px solid #E2E8F0",
              display: "flex", gap: 10, alignItems: "flex-end",
            }}>
              <textarea value={msgInput} onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Écrire un message…" rows={1}
                style={{
                  flex: 1, padding: "10px 14px", background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0", borderRadius: 12,
                  fontSize: ".85rem", color: "#0A2647", resize: "none",
                  fontFamily: "'DM Sans', sans-serif", outline: "none",
                  maxHeight: 100, lineHeight: 1.5,
                }}
                onFocus={e => e.target.style.borderColor = "#0A2647"}
                onBlur={e => e.target.style.borderColor = "#E2E8F0"}
              />
              <button onClick={sendMessage} disabled={!msgInput.trim() || sendingMsg} style={{
                width: 42, height: 42, borderRadius: 12,
                background: msgInput.trim() ? "linear-gradient(135deg, #0A2647, #1B3B6F)" : "#E2E8F0",
                border: "none", color: msgInput.trim() ? "white" : "#94A3B8",
                fontSize: "1.1rem", cursor: msgInput.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s", flexShrink: 0,
              }}>
                {sendingMsg ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> : "➤"}
              </button>
            </div>
          )}

          {!canMessage && (
            <div style={{
              padding: "14px 24px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0",
              textAlign: "center", fontSize: ".82rem", color: "#94A3B8",
            }}>
              💬 Les messages seront disponibles une fois la consultation acceptée.
            </div>
          )}
        </div>

        {/* ═══ RIGHT PANEL — Analyse IA ═══ */}
        <div style={{
          width: 360, flexShrink: 0, background: "white", borderLeft: "1px solid #E2E8F0",
          overflowY: "auto", padding: 20,
        }}>

          <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
            Analyse IA
          </div>

          {!a && !analysisLoading && (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0A2647", marginBottom: 4 }}>
                Analyse non disponible
              </div>
              <div style={{ fontSize: ".78rem", color: "#94A3B8", lineHeight: 1.6 }}>
                {c?.status === "pending"
                  ? "Un médecin doit d'abord accepter la demande."
                  : c?.status === "accepted" && isDoctor
                    ? "Cliquez sur « Lancer l'analyse IA » dans le panneau de gauche."
                    : "L'analyse sera lancée par le médecin après acceptation."}
              </div>
            </div>
          )}

          {analysisLoading && (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <div style={{ width: 48, height: 48, border: "3px solid #EDE9FE", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#0A2647", marginBottom: 4 }}>Analyse en cours…</div>
              <div style={{ fontSize: ".78rem", color: "#94A3B8" }}>Le modèle IA traite votre image.</div>
            </div>
          )}

          {a && !analysisLoading && (
            <div style={{ animation: "fadeUp .4s ease" }}>

              {/* Prediction principale */}
              <div style={{
                padding: "18px", borderRadius: 16, marginBottom: 16,
                background: a.out_of_domain ? "#FEF2F2" : "#F0FDF4",
                border: a.out_of_domain ? "1px solid #FECACA" : "1px solid #BBF7D0",
              }}>
                <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                  {a.out_of_domain ? "⚠️ Hors domaine" : "Prédiction"}
                </div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: a.out_of_domain ? "#DC2626" : "#059669", marginBottom: 6 }}>
                  {a.prediction}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      width: `${(a.confidence || 0) * 100}%`, height: "100%",
                      background: (a.confidence || 0) > 0.8 ? "#059669" : (a.confidence || 0) > 0.5 ? "#F59E0B" : "#DC2626",
                      borderRadius: 4, transition: "width .8s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: ".85rem", fontWeight: 800, color: "#0A2647" }}>
                    {(a.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Warning */}
              {a.warning && (
                <div style={{
                  padding: "10px 14px", background: "#FFFBEB", borderRadius: 10,
                  border: "1px solid #FDE68A", fontSize: ".78rem", color: "#92400E",
                  marginBottom: 16, lineHeight: 1.5,
                }}>
                  ⚠️ {a.warning}
                </div>
              )}

              {/* Probabilités */}
              {Object.keys(probs).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                    Probabilités détaillées
                  </div>
                  {Object.entries(probs)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([label, prob]) => (
                      <div key={label} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: ".78rem", color: "#475569", fontWeight: 500 }}>{label}</span>
                          <span style={{ fontSize: ".75rem", color: "#94A3B8", fontWeight: 700 }}>{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            width: `${prob * 100}%`, height: "100%",
                            background: label === a.prediction ? "#059669" : "#CBD5E1",
                            borderRadius: 3, transition: "width .6s ease",
                          }} />
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* GradCAM */}
              {a.gradcam_b64 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
                    Carte d'attention (GradCAM)
                  </div>
                  <img src={`data:image/png;base64,${a.gradcam_b64}`} alt="GradCAM" style={{ width: "100%", borderRadius: 12, border: "1px solid #E2E8F0" }} />
                </div>
              )}

              {/* Explication */}
              {a.explain_text && (
                <div style={{
                  padding: "14px", background: "#F8FAFC", borderRadius: 12,
                  border: "1px solid #E2E8F0", fontSize: ".82rem",
                  color: "#475569", lineHeight: 1.7,
                }}>
                  <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                    Explication
                  </div>
                  {a.explain_text}
                </div>
              )}

              <div style={{ fontSize: ".68rem", color: "#CBD5E1", marginTop: 12, textAlign: "center" }}>
                Analyse du {formatDate(a.created_at)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Error toast ── */}
      {error && data && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          padding: "12px 20px", background: "#FEF2F2", border: "1px solid #FECACA",
          borderRadius: 12, color: "#DC2626", fontSize: ".82rem", fontWeight: 600,
          zIndex: 300, display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,.1)", animation: "fadeUp .2s ease",
        }}>
          ⚠️ {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
         ═══════════════════════════════════════════════════════════════ */}

      {/* ── Close modal ── */}
      {showClose && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px", maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)", animation: "fadeUp .2s ease" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0A2647", marginBottom: 6 }}>🔒 Clôturer la consultation</h3>
            <p style={{ fontSize: ".82rem", color: "#64748B", marginBottom: 18 }}>Ajoutez des notes finales pour le patient (optionnel).</p>
            <textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} placeholder="Notes de clôture, recommandations…" rows={4} style={{
              width: "100%", padding: "12px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12,
              fontSize: ".85rem", color: "#0A2647", resize: "none", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 18,
            }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowClose(false); setCloseNotes(""); }} style={{ flex: 1, padding: "10px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: ".85rem", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleClose} disabled={actionLoading === "close"} style={{ flex: 1, padding: "10px", background: actionLoading ? "#E2E8F0" : "#6B7280", border: "none", borderRadius: 12, color: "white", fontSize: ".85rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                {actionLoading === "close" ? "…" : "Clôturer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer modal ── */}
      {showTransfer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px", maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)", animation: "fadeUp .2s ease" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0A2647", marginBottom: 6 }}>🔄 Transférer le dossier</h3>
            <p style={{ fontSize: ".82rem", color: "#64748B", marginBottom: 18 }}>Le dossier sera réassigné au médecin sélectionné.</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: ".72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>ID du médecin destinataire *</label>
              <input type="number" value={transferTo} onChange={e => setTransferTo(e.target.value)} placeholder="Ex: 5" style={{
                width: "100%", padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12,
                fontSize: ".85rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
              }} onFocus={e => e.target.style.borderColor = "#D97706"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: ".72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Motif</label>
              <textarea value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="Raison du transfert…" rows={3} style={{
                width: "100%", padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12,
                fontSize: ".85rem", color: "#0A2647", resize: "none", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
              }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowTransfer(false); setTransferTo(""); setTransferReason(""); }} style={{ flex: 1, padding: "10px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: ".85rem", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleTransfer} disabled={actionLoading === "transfer"} style={{ flex: 1, padding: "10px", background: actionLoading ? "#E2E8F0" : "#D97706", border: "none", borderRadius: 12, color: "white", fontSize: ".85rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                {actionLoading === "transfer" ? "…" : "Transférer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Appointment modal ── */}
      {showAppointment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)", animation: "fadeUp .2s ease" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0A2647", marginBottom: 6 }}>📅 Planifier un rendez-vous</h3>
            <p style={{ fontSize: ".82rem", color: "#64748B", marginBottom: 20 }}>Proposez un créneau au patient.</p>

            {/* Type */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: ".72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ key: "video", label: "📹 Vidéo" }, { key: "in_person", label: "🏥 Présentiel" }].map(t => (
                  <button key={t.key} onClick={() => setApptData(p => ({ ...p, type: t.key }))} style={{
                    flex: 1, padding: "10px", borderRadius: 10, fontSize: ".82rem", fontWeight: 700,
                    background: apptData.type === t.key ? "#0A2647" : "#F8FAFC",
                    color: apptData.type === t.key ? "white" : "#64748B",
                    border: apptData.type === t.key ? "none" : "1.5px solid #E2E8F0",
                    cursor: "pointer", transition: "all .2s",
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: ".72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Date et heure *</label>
              <input type="datetime-local" value={apptData.scheduled_at} onChange={e => setApptData(p => ({ ...p, scheduled_at: e.target.value }))} style={{
                width: "100%", padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12,
                fontSize: ".85rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
              }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
            </div>

            {/* Durée */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: ".72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Durée (minutes)</label>
              <input type="number" value={apptData.duration_minutes} onChange={e => setApptData(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))} min="15" step="15" style={{
                width: "100%", padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12,
                fontSize: ".85rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
              }} />
            </div>

            {/* Conditionnel : lien ou lieu */}
            {apptData.type === "video" ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: ".72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Lien vidéo</label>
                <input type="url" value={apptData.video_link} onChange={e => setApptData(p => ({ ...p, video_link: e.target.value }))} placeholder="https://meet.google.com/…" style={{
                  width: "100%", padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12,
                  fontSize: ".85rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                }} />
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: ".72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Lieu</label>
                <input type="text" value={apptData.location} onChange={e => setApptData(p => ({ ...p, location: e.target.value }))} placeholder="Cabinet, hôpital…" style={{
                  width: "100%", padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12,
                  fontSize: ".85rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                }} />
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: ".72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea value={apptData.notes} onChange={e => setApptData(p => ({ ...p, notes: e.target.value }))} placeholder="Instructions pour le patient…" rows={2} style={{
                width: "100%", padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12,
                fontSize: ".85rem", color: "#0A2647", resize: "none", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
              }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowAppointment(false); setApptData({ type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" }); }} style={{ flex: 1, padding: "10px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: ".85rem", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleCreateAppt} disabled={actionLoading === "appt"} style={{ flex: 1, padding: "10px", background: actionLoading ? "#E2E8F0" : "linear-gradient(135deg, #0369A1, #075985)", border: "none", borderRadius: 12, color: "white", fontSize: ".85rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                {actionLoading === "appt" ? "…" : "Créer le RDV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}