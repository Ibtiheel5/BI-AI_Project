// pages/ConsultationRoom.jsx
// Salle de consultation partagée : résultat IA + chat + RDV + transfert
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { predict } from "../services/api";

const API = "http://localhost:8000/api/v1";

const MODEL_META = {
  brain: { label: "IRM cérébrale",          icon: "🧠", color: "#7C3AED", bg: "#EDE9FE", border: "#C4B5FD" },
  lung:  { label: "Scanner CT pulmonaire",  icon: "🔬", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" },
  chest: { label: "Radiographie thoracique",icon: "🫁", color: "#0369A1", bg: "#E0F2FE", border: "#7DD3FC" },
};

const PRED_SEVERITY = {
  glioma:           { label: "URGENCE NEURO",  color: "#DC2626", bg: "#FEE2E2" },
  malignant:        { label: "URGENCE ONCO",   color: "#DC2626", bg: "#FEE2E2" },
  COVID:            { label: "URGENCE VITALE", color: "#DC2626", bg: "#FEE2E2" },
  Pneumonia:        { label: "URGENCE VITALE", color: "#DC2626", bg: "#FEE2E2" },
  Pneumothorax:     { label: "URGENCE VITALE", color: "#DC2626", bg: "#FEE2E2" },
  Edema:            { label: "URGENCE VITALE", color: "#DC2626", bg: "#FEE2E2" },
  Mass:             { label: "URGENCE ONCO",   color: "#DC2626", bg: "#FEE2E2" },
  "Viral Pneumonia":{ label: "URGENCE VITALE", color: "#DC2626", bg: "#FEE2E2" },
  meningioma:       { label: "SURVEILLANCE",   color: "#D97706", bg: "#FEF3C7" },
  Cardiomegaly:     { label: "SURVEILLANCE",   color: "#D97706", bg: "#FEF3C7" },
  Emphysema:        { label: "SURVEILLANCE",   color: "#D97706", bg: "#FEF3C7" },
  Nodule:           { label: "BILAN COMPL.",   color: "#D97706", bg: "#FEF3C7" },
  pituitary:        { label: "SURVEILLANCE",   color: "#D97706", bg: "#FEF3C7" },
  Lung_Opacity:     { label: "SURVEILLANCE",   color: "#D97706", bg: "#FEF3C7" },
  notumor:          { label: "NORMAL",         color: "#059669", bg: "#D1FAE5" },
  normal:           { label: "NORMAL",         color: "#059669", bg: "#D1FAE5" },
  benign:           { label: "BÉNIN",          color: "#0369A1", bg: "#E0F2FE" },
};

function authHeaders() {
  const token = localStorage.getItem("medai-token");
  return { Authorization: `Bearer ${token}` };
}

// ── Chat Message ────────────────────────────────────────────────────
function ChatMessage({ msg, isMe }) {
  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 12, gap: 8 }}>
      {!isMe && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0A2647,#2D5F9E)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: ".75rem", fontWeight: 700, flexShrink: 0 }}>
          {msg.sender_role === "Patient" ? "👤" : "👨‍⚕️"}
        </div>
      )}
      <div style={{ maxWidth: "72%" }}>
        {!isMe && <div style={{ fontSize: ".65rem", color: "#94A3B8", marginBottom: 3 }}>{msg.sender_name}</div>}
        <div style={{
          padding: "10px 14px",
          background: isMe ? "linear-gradient(135deg,#0A2647,#1B3B6F)" : "white",
          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          border: isMe ? "none" : "1px solid #E2E8F0",
          boxShadow: "0 2px 8px rgba(10,38,71,.05)",
        }}>
          <p style={{ margin: 0, fontSize: ".85rem", color: isMe ? "white" : "#0A2647", lineHeight: 1.6 }}>{msg.content}</p>
        </div>
        <div style={{ fontSize: ".6rem", color: "#94A3B8", marginTop: 3, textAlign: isMe ? "right" : "left" }}>
          {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ── Analysis Result Panel ───────────────────────────────────────────
function AnalysisPanel({ analysis, modelKey, showGradcam, onToggleGradcam }) {
  const [showExplain, setShowExplain] = useState(false);
  if (!analysis) return null;

  const m   = MODEL_META[modelKey] || MODEL_META.chest;
  const sev = PRED_SEVERITY[analysis.prediction] || { label: "ANALYSE", color: "#0369A1", bg: "#E0F2FE" };
  const probs = JSON.parse(analysis.probabilities || "{}");
  const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxProb = sorted[0]?.[1] || 1;

  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(10,38,71,.06)" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${sev.color},${sev.color}80)` }} />
      <div style={{ padding: "18px 20px" }}>

        {/* Diagnostic principal */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: ".65rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>RÉSULTAT IA</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647", textTransform: "capitalize" }}>{analysis.prediction}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: sev.color, lineHeight: 1 }}>{(analysis.confidence * 100).toFixed(1)}%</div>
            <div style={{ fontSize: ".65rem", color: "#94A3B8" }}>confiance</div>
          </div>
        </div>

        {/* Badge sévérité */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: sev.bg, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: sev.color }} />
          <span style={{ fontSize: ".68rem", fontWeight: 700, color: sev.color }}>{sev.label}</span>
        </div>

        {/* Barre confiance */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 7, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${analysis.confidence * 100}%`, background: `linear-gradient(90deg,${sev.color},${sev.color}cc)`, borderRadius: 4, transition: "width 1s ease" }} />
          </div>
        </div>

        {/* Distribution probabilités */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Distribution</div>
          {sorted.map(([cls, prob], i) => (
            <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: ".7rem", color: "#94A3B8", width: 16 }}>{i+1}</span>
              <span style={{ fontSize: ".78rem", color: "#475569", flex: 1, textTransform: "capitalize" }}>{cls}</span>
              <div style={{ width: 80, height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(prob/maxProb)*100}%`, background: i === 0 ? sev.color : "#CBD5E1", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: ".72rem", fontWeight: 700, color: i === 0 ? sev.color : "#94A3B8", width: 40, textAlign: "right" }}>
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {/* Grad-CAM toggle */}
        {analysis.gradcam_b64 && (
          <button onClick={onToggleGradcam} style={{
            width: "100%", padding: "8px 14px", marginBottom: 10,
            background: showGradcam ? "linear-gradient(135deg,rgba(220,38,38,.12),rgba(220,38,38,.06))" : "#F8FAFC",
            border: `1px solid ${showGradcam ? "#FCA5A5" : "#E2E8F0"}`,
            borderRadius: 10, color: showGradcam ? "#DC2626" : "#475569",
            fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}>
            {showGradcam ? "🖼️ Image originale" : "🔥 Voir Grad-CAM"}
          </button>
        )}

        {/* Explication IA */}
        {analysis.explain_text && (
          <>
            <button onClick={() => setShowExplain(!showExplain)} style={{
              width: "100%", padding: "8px 14px",
              background: showExplain ? "linear-gradient(135deg,rgba(107,79,160,.1),rgba(107,79,160,.05))" : "#F8FAFC",
              border: `1px solid ${showExplain ? "#C4B5FD" : "#E2E8F0"}`,
              borderRadius: 10, color: showExplain ? "#7C3AED" : "#475569",
              fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              🧠 {showExplain ? "Masquer" : "Voir"} l'explication clinique
            </button>

            {showExplain && (
              <div style={{ marginTop: 12, padding: "14px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: ".78rem", color: "#475569", lineHeight: 1.7, maxHeight: 280, overflowY: "auto" }}>
                {analysis.explain_text.split("\n").map((line, i) => (
                  line.startsWith("## ") ? (
                    <div key={i} style={{ fontWeight: 700, color: "#0A2647", marginTop: 12, marginBottom: 4, fontSize: ".82rem" }}>
                      {line.replace("## ", "")}
                    </div>
                  ) : (
                    <p key={i} style={{ margin: "0 0 4px" }}>{line}</p>
                  )
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══ MAIN COMPONENT ══════════════════════════════════════════════════
export default function ConsultationRoom() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("analysis");
  const [messages,     setMessages]     = useState([]);
  const [msgInput,     setMsgInput]     = useState("");
  const [sendingMsg,   setSendingMsg]   = useState(false);
  const [showGradcam,  setShowGradcam]  = useState(false);
  const [explainText,  setExplainText]  = useState("");
  const [explaining,   setExplaining]   = useState(false);
  const [running,      setRunning]      = useState(false);
  const [toast,        setToast]        = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRdv,      setShowRdv]      = useState(false);
  const [doctors,      setDoctors]      = useState([]);
  const [rdvForm,      setRdvForm]      = useState({ type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" });
  const [transferForm, setTransferForm] = useState({ to_doctor_id: "", reason: "" });
  const chatEndRef = useRef(null);
  const pollRef    = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/consultations/${id}`, { headers: authHeaders() });
      if (!res.ok) { if (res.status === 404) navigate("/"); return; }
      const json = await res.json();
      setData(json);
      setMessages(json.messages || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 8000); // poll messages toutes les 8s
    return () => clearInterval(pollRef.current);
  }, [fetchData]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Lancer l'analyse IA (médecin seulement) ─────────────────────
  const runAnalysis = async () => {
    if (!data?.consultation) return;
    const c = data.consultation;
    if (c.status !== "accepted") { showToast("La consultation doit être acceptée d'abord.", "error"); return; }

    setRunning(true); setExplainText(""); setExplaining(true);

    try {
      // Récupérer l'image depuis le serveur
      const imgRes = await fetch(`http://localhost:8000/${c.image_path.replace(/\\/g, "/")}`, { headers: authHeaders() });
      if (!imgRes.ok) throw new Error("Image introuvable sur le serveur.");
      const blob = await imgRes.blob();
      const file = new File([blob], "image.jpg", { type: blob.type });

      let predResult = null;
      let fullExplain = "";

      await predict(file, c.model_key, true, {
        onPrediction: (p) => { predResult = p; setRunning(false); },
        onChunk:  (t) => { fullExplain += t; setExplainText(prev => prev + t); },
        onError:  (e) => { console.error(e); setExplaining(false); },
        onDone:   () => { setExplaining(false); },
      });

      if (!predResult) throw new Error("Aucun résultat reçu.");

      // Sauvegarder en DB
      const form = new FormData();
      form.append("prediction",    predResult.prediction);
      form.append("confidence",    predResult.confidence);
      form.append("probabilities", JSON.stringify(predResult.probabilities || {}));
      form.append("explain_text",  fullExplain);
      form.append("gradcam_b64",   predResult.gradcam_image || "");
      form.append("out_of_domain", predResult.out_of_domain ? "true" : "false");
      form.append("warning",       predResult.warning || "");

      const saveRes = await fetch(`${API}/consultations/${id}/analysis`, {
        method: "POST", headers: authHeaders(), body: form,
      });
      if (!saveRes.ok) throw new Error((await saveRes.json()).detail);

      showToast("✅ Analyse enregistrée et visible par le patient.");
      await fetchData();

    } catch (e) {
      showToast("❌ " + e.message, "error");
      setRunning(false); setExplaining(false);
    }
  };

  // ── Envoyer un message ──────────────────────────────────────────
  const sendMessage = async () => {
    if (!msgInput.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}/consultations/${id}/messages`, {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setMsgInput("");
      await fetchData();
    } catch (e) { showToast("❌ " + e.message, "error"); }
    finally { setSendingMsg(false); }
  };

  // ── Créer un RDV ────────────────────────────────────────────────
  const createRdv = async () => {
    try {
      const res = await fetch(`${API}/consultations/appointments`, {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: parseInt(id), ...rdvForm, duration_minutes: parseInt(rdvForm.duration_minutes) }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      showToast(`✅ Rendez-vous ${rdvForm.type === "video" ? "vidéo" : "présentiel"} créé !`);
      setShowRdv(false);
      await fetchData();
    } catch (e) { showToast("❌ " + e.message, "error"); }
  };

  // ── Transfert ───────────────────────────────────────────────────
  const doTransfer = async () => {
    if (!transferForm.to_doctor_id) { showToast("Sélectionnez un médecin.", "error"); return; }
    try {
      const res = await fetch(`${API}/consultations/${id}/transfer`, {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ to_doctor_id: parseInt(transferForm.to_doctor_id), reason: transferForm.reason }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      showToast("✅ Dossier transféré avec succès.");
      setShowTransfer(false);
      navigate("/doctor/queue");
    } catch (e) { showToast("❌ " + e.message, "error"); }
  };

  // ── Charger médecins pour transfert ────────────────────────────
  useEffect(() => {
    if (!showTransfer) return;
    fetch(`${API}/doctors?model=${data?.consultation?.model_key || "chest"}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setDoctors(d.doctors || []))
      .catch(() => {});
  }, [showTransfer]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #E2E8F0", borderTopColor: "#0A2647", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>Chargement de la consultation…</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { consultation: c, analysis, appointment } = data;
  const m = MODEL_META[c.model_key] || MODEL_META.chest;
  const isDoctor  = user?.role === "Medecin" || user?.is_admin;
  const isPatient = user?.role === "Patient";
  const canChat   = ["accepted", "analyzed"].includes(c.status);
  const sev       = analysis ? (PRED_SEVERITY[analysis.prediction] || { label: "ANALYSE", color: "#0369A1", bg: "#E0F2FE" }) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}
      </style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0A2647,#1B3B6F)", padding: "20px 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button onClick={() => navigate(isDoctor ? "/doctor/queue" : "/patient")} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, color: "white", padding: "6px 12px", cursor: "pointer", fontSize: ".8rem" }}>
            ← Retour
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>{m.icon}</div>
            <div>
              <div style={{ fontSize: ".85rem", fontWeight: 700, color: "white" }}>
                Consultation #{c.id} · {m.label}
              </div>
              <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.55)" }}>
                {isDoctor ? `Patient: ${c.patient_name}` : `Médecin: ${c.doctor_name || "En attente"}`}
              </div>
            </div>
          </div>

          {/* Statut */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {sev && c.status === "analyzed" && (
              <span style={{ padding: "4px 12px", borderRadius: 20, background: sev.bg, color: sev.color, fontSize: ".72rem", fontWeight: 700 }}>{sev.label}</span>
            )}
            <span style={{
              padding: "4px 12px", borderRadius: 20, fontSize: ".72rem", fontWeight: 700,
              background: c.status === "analyzed" ? "#EDE9FE" : c.status === "accepted" ? "#D1FAE5" : c.status === "closed" ? "#F1F5F9" : "#FEF3C7",
              color: c.status === "analyzed" ? "#7C3AED" : c.status === "accepted" ? "#059669" : c.status === "closed" ? "#64748B" : "#D97706",
            }}>
              {c.status === "pending" ? "⏳ En attente" : c.status === "accepted" ? "✅ Acceptée" : c.status === "analyzed" ? "🤖 Analysée" : c.status === "closed" ? "🔒 Clôturée" : c.status}
            </span>
          </div>

          {/* Actions médecin */}
          {isDoctor && (
            <div style={{ display: "flex", gap: 8 }}>
              {c.status === "accepted" && (
                <button onClick={runAnalysis} disabled={running} style={{
                  padding: "7px 16px", background: running ? "rgba(255,255,255,.1)" : "rgba(124,58,237,.9)",
                  border: "none", borderRadius: 10, color: "white", fontSize: ".8rem", fontWeight: 700,
                  cursor: running ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7,
                }}>
                  {running ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Analyse…</> : "🤖 Lancer l'analyse IA"}
                </button>
              )}
              {c.status === "analyzed" && (
                <>
                  <button onClick={() => setShowRdv(true)} style={{ padding: "7px 14px", background: "rgba(5,150,105,.9)", border: "none", borderRadius: 10, color: "white", fontSize: ".8rem", fontWeight: 700, cursor: "pointer" }}>
                    📅 Planifier RDV
                  </button>
                  <button onClick={() => setShowTransfer(true)} style={{ padding: "7px 14px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, color: "white", fontSize: ".8rem", fontWeight: 600, cursor: "pointer" }}>
                    ↗ Transférer
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px 60px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

        {/* ── Colonne gauche ── */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 3, marginBottom: 18, background: "white", borderRadius: 12, padding: 4, border: "1px solid #E2E8F0", width: "fit-content" }}>
            {[
              { key: "analysis", label: "Résultat IA", show: true },
              { key: "image",    label: "Image",        show: true },
              { key: "chat",     label: `Chat (${messages.length})`, show: canChat },
              { key: "rdv",      label: "Rendez-vous",  show: !!appointment },
            ].filter(t => t.show).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: "8px 18px", background: activeTab === t.key ? "#0A2647" : "transparent",
                color: activeTab === t.key ? "white" : "#64748B", border: "none", borderRadius: 9,
                fontSize: ".82rem", fontWeight: activeTab === t.key ? 700 : 500, cursor: "pointer", transition: "all .2s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* ── Analyse ── */}
          {activeTab === "analysis" && (
            <div style={{ animation: "fadeUp .3s ease" }}>
              {!analysis ? (
                <div style={{ background: "white", borderRadius: 16, padding: "48px", textAlign: "center", border: "1px solid #E2E8F0" }}>
                  {c.status === "pending" && (
                    <>
                      <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⏳</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>En attente d'un médecin</div>
                      <div style={{ fontSize: ".82rem", color: "#94A3B8" }}>L'analyse démarrera après acceptation d'un médecin.</div>
                    </>
                  )}
                  {c.status === "accepted" && isDoctor && (
                    <>
                      <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🤖</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>Prêt pour l'analyse</div>
                      <div style={{ fontSize: ".82rem", color: "#64748B", marginBottom: 20 }}>Cliquez sur "Lancer l'analyse IA" pour démarrer.</div>
                      <button onClick={runAnalysis} disabled={running} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#0A2647,#1B3B6F)", border: "none", borderRadius: 12, color: "white", fontSize: ".9rem", fontWeight: 700, cursor: "pointer" }}>
                        🤖 Lancer l'analyse IA
                      </button>
                    </>
                  )}
                  {c.status === "accepted" && isPatient && (
                    <>
                      <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⏳</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>Votre médecin prépare l'analyse</div>
                      <div style={{ fontSize: ".82rem", color: "#94A3B8" }}>Vous serez notifié dès que les résultats seront disponibles.</div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Résultat IA avec streaming */}
                  <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ height: 3, background: `linear-gradient(90deg,${sev?.color||"#2D5F9E"},${sev?.color||"#2D5F9E"}80)` }} />
                    <div style={{ padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: ".65rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>RÉSULTAT IA — visible patient + médecin</div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", textTransform: "capitalize" }}>{analysis.prediction}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: sev?.color, lineHeight: 1 }}>{(analysis.confidence * 100).toFixed(1)}%</div>
                          <span style={{ padding: "3px 10px", borderRadius: 20, background: sev?.bg, color: sev?.color, fontSize: ".65rem", fontWeight: 700 }}>{sev?.label}</span>
                        </div>
                      </div>

                      {/* Image + Grad-CAM */}
                      {c.image_path && (
                        <div style={{ borderRadius: 12, overflow: "hidden", background: "#0A2647", marginBottom: 14, maxHeight: 280 }}>
                          <img
                            src={showGradcam && analysis.gradcam_b64
                              ? `data:image/jpeg;base64,${analysis.gradcam_b64}`
                              : `http://localhost:8000/${c.image_path.replace(/\\/g, "/")}`}
                            alt="Image médicale"
                            style={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block" }}
                            onError={e => e.target.style.display = "none"}
                          />
                        </div>
                      )}

                      {analysis.gradcam_b64 && (
                        <button onClick={() => setShowGradcam(!showGradcam)} style={{
                          padding: "7px 14px", background: showGradcam ? "rgba(220,38,38,.1)" : "#F8FAFC",
                          border: `1px solid ${showGradcam ? "#FCA5A5" : "#E2E8F0"}`,
                          borderRadius: 9, color: showGradcam ? "#DC2626" : "#475569",
                          fontSize: ".78rem", fontWeight: 600, cursor: "pointer", marginBottom: 14,
                        }}>
                          {showGradcam ? "🖼️ Image originale" : "🔥 Voir Grad-CAM"}
                        </button>
                      )}

                      {/* Explication IA en streaming ou sauvegardée */}
                      {(explainText || analysis.explain_text) && (
                        <div style={{ padding: "14px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", maxHeight: 300, overflowY: "auto" }}>
                          <div style={{ fontSize: ".65rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                            Explication clinique {explaining && <span style={{ animation: "pulse 1.5s infinite" }}>●</span>}
                          </div>
                          {(explainText || analysis.explain_text).split("\n").map((line, i) => (
                            line.startsWith("## ") ? (
                              <div key={i} style={{ fontWeight: 700, color: "#0A2647", marginTop: 10, marginBottom: 3, fontSize: ".82rem" }}>{line.replace("## ", "")}</div>
                            ) : (
                              <p key={i} style={{ margin: "0 0 3px", fontSize: ".78rem", color: "#475569", lineHeight: 1.65 }}>{line}</p>
                            )
                          ))}
                          {explaining && <span style={{ color: "#2D5F9E", animation: "pulse 1s infinite" }}>▌</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Image ── */}
          {activeTab === "image" && c.image_path && (
            <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", animation: "fadeUp .3s ease" }}>
              <div style={{ borderRadius: 12, overflow: "hidden", background: "#0A2647" }}>
                <img src={`http://localhost:8000/${c.image_path.replace(/\\/g, "/")}`} alt="Image médicale" style={{ width: "100%", maxHeight: 500, objectFit: "contain", display: "block" }} onError={e => e.target.style.display = "none"} />
              </div>
              <div style={{ marginTop: 12, fontSize: ".75rem", color: "#94A3B8", textAlign: "center" }}>
                {m.icon} {m.label} · {new Date(c.created_at).toLocaleDateString("fr-FR")}
              </div>
            </div>
          )}

          {/* ── Chat ── */}
          {activeTab === "chat" && (
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", animation: "fadeUp .3s ease" }}>
              <div style={{ padding: "12px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: ".8rem", fontWeight: 600, color: "#0A2647" }}>
                💬 Discussion · {messages.length} message{messages.length !== 1 ? "s" : ""}
              </div>
              <div style={{ padding: "16px", minHeight: 350, maxHeight: 420, overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: ".85rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>💬</div>
                    Aucun message pour l'instant. Commencez la discussion.
                  </div>
                ) : (
                  messages.map(msg => (
                    <ChatMessage key={msg.id} msg={msg} isMe={msg.sender_id === user?.id} />
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10 }}>
                <input
                  value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Écrivez votre message… (Entrée pour envoyer)"
                  style={{ flex: 1, padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, fontSize: ".85rem", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                  onFocus={e => e.target.style.borderColor = "#2D5F9E"}
                  onBlur={e  => e.target.style.borderColor = "#E2E8F0"}
                />
                <button onClick={sendMessage} disabled={!msgInput.trim() || sendingMsg} style={{ padding: "10px 18px", background: !msgInput.trim() ? "#E2E8F0" : "linear-gradient(135deg,#0A2647,#1B3B6F)", border: "none", borderRadius: 12, color: !msgInput.trim() ? "#94A3B8" : "white", fontSize: ".85rem", fontWeight: 700, cursor: !msgInput.trim() ? "not-allowed" : "pointer" }}>
                  {sendingMsg ? "…" : "→"}
                </button>
              </div>
            </div>
          )}

          {/* ── RDV ── */}
          {activeTab === "rdv" && appointment && (
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", animation: "fadeUp .3s ease" }}>
              <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>RENDEZ-VOUS PLANIFIÉ</div>
              {[
                ["Type", appointment.type === "video" ? "🎥 Vidéo consultation" : "🏥 Présentiel"],
                ["Date", new Date(appointment.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })],
                ["Heure", new Date(appointment.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })],
                ["Durée", `${appointment.duration_minutes} minutes`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F8FAFC" }}>
                  <span style={{ fontSize: ".78rem", color: "#64748B" }}>{l}</span>
                  <span style={{ fontSize: ".85rem", fontWeight: 600, color: "#0A2647" }}>{v}</span>
                </div>
              ))}
              {appointment.video_link && (
                <a href={appointment.video_link} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 16, padding: "12px", background: "linear-gradient(135deg,#059669,#047857)", borderRadius: 12, color: "white", textAlign: "center", fontSize: ".9rem", fontWeight: 700, textDecoration: "none" }}>
                  🎥 Rejoindre la consultation vidéo →
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Colonne droite : résumé + notes ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Résumé consultation */}
          <div style={{ background: "white", borderRadius: 16, padding: "18px 20px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(10,38,71,.05)" }}>
            <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>RÉSUMÉ</div>
            {[
              ["Réf.", `#${c.id}`],
              ["Type", m.label],
              [isDoctor ? "Patient" : "Médecin", isDoctor ? c.patient_name : (c.doctor_name || "En attente")],
              ["Urgence", c.urgency === "critical" ? "🔴 Critique" : c.urgency === "urgent" ? "🟡 Urgent" : "🟢 Normal"],
              ["Date", new Date(c.created_at).toLocaleDateString("fr-FR")],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F8FAFC" }}>
                <span style={{ fontSize: ".73rem", color: "#94A3B8" }}>{l}</span>
                <span style={{ fontSize: ".82rem", fontWeight: 600, color: "#0A2647" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Notes patient */}
          {c.patient_notes && (
            <div style={{ background: "white", borderRadius: 16, padding: "16px 18px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>NOTE DU PATIENT</div>
              <p style={{ fontSize: ".82rem", color: "#475569", lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>"{c.patient_notes}"</p>
            </div>
          )}

          {/* Notes médecin */}
          {c.doctor_notes && (
            <div style={{ background: "#EFF6FF", borderRadius: 16, padding: "16px 18px", border: "1px solid #BFDBFE" }}>
              <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#0369A1", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>NOTE DU MÉDECIN</div>
              <p style={{ fontSize: ".82rem", color: "#0A2647", lineHeight: 1.65, margin: 0 }}>{c.doctor_notes}</p>
            </div>
          )}

          {/* Résultat rapide si analysé */}
          {analysis && (
            <AnalysisPanel analysis={analysis} modelKey={c.model_key} showGradcam={showGradcam} onToggleGradcam={() => setShowGradcam(!showGradcam)} />
          )}

          {/* Actions rapides médecin */}
          {isDoctor && c.status === "analyzed" && !showRdv && !showTransfer && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowRdv(true)} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#059669,#047857)", border: "none", borderRadius: 12, color: "white", fontSize: ".82rem", fontWeight: 700, cursor: "pointer" }}>
                📅 RDV
              </button>
              <button onClick={() => setShowTransfer(true)} style={{ flex: 1, padding: "10px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: ".82rem", fontWeight: 600, cursor: "pointer" }}>
                ↗ Transférer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal RDV ── */}
      {showRdv && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,38,71,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(10,38,71,.3)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0A2647", marginBottom: 20 }}>📅 Planifier un rendez-vous</h3>

            {/* Type */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {[{ key: "video", label: "🎥 Vidéo", desc: "Consultation en ligne" }, { key: "presentiel", label: "🏥 Présentiel", desc: "Rendez-vous en cabinet" }].map(t => (
                <button key={t.key} onClick={() => setRdvForm(f => ({ ...f, type: t.key }))} style={{
                  flex: 1, padding: "12px", background: rdvForm.type === t.key ? (t.key === "video" ? "#EDE9FE" : "#E0F2FE") : "#F8FAFC",
                  border: `1.5px solid ${rdvForm.type === t.key ? (t.key === "video" ? "#7C3AED" : "#0369A1") : "#E2E8F0"}`,
                  borderRadius: 12, cursor: "pointer", textAlign: "center",
                }}>
                  <div style={{ fontSize: ".9rem", marginBottom: 2 }}>{t.label}</div>
                  <div style={{ fontSize: ".7rem", color: "#64748B" }}>{t.desc}</div>
                </button>
              ))}
            </div>

            {/* Date/Heure */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: ".7rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Date et heure *</label>
              <input type="datetime-local" value={rdvForm.scheduled_at} onChange={e => setRdvForm(f => ({ ...f, scheduled_at: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: ".88rem", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif" }} />
            </div>

            {/* Lien vidéo si video */}
            {rdvForm.type === "video" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: ".7rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Lien vidéo (Jitsi / Zoom)</label>
                <input value={rdvForm.video_link} onChange={e => setRdvForm(f => ({ ...f, video_link: e.target.value }))}
                  placeholder="https://meet.jit.si/consultation-..."
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: ".88rem", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif" }} />
              </div>
            )}

            {/* Lieu si présentiel */}
            {rdvForm.type === "presentiel" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: ".7rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Adresse du cabinet</label>
                <input value={rdvForm.location} onChange={e => setRdvForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Adresse complète du cabinet"
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: ".88rem", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif" }} />
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowRdv(false)} style={{ flex: 1, padding: "11px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: ".88rem", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={createRdv} disabled={!rdvForm.scheduled_at} style={{ flex: 2, padding: "11px", background: !rdvForm.scheduled_at ? "#E2E8F0" : "linear-gradient(135deg,#059669,#047857)", border: "none", borderRadius: 12, color: !rdvForm.scheduled_at ? "#94A3B8" : "white", fontSize: ".9rem", fontWeight: 700, cursor: !rdvForm.scheduled_at ? "not-allowed" : "pointer" }}>
                Confirmer le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Transfert ── */}
      {showTransfer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,38,71,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(10,38,71,.3)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0A2647", marginBottom: 8 }}>↗ Transférer le dossier</h3>
            <p style={{ fontSize: ".82rem", color: "#64748B", marginBottom: 20 }}>Sélectionnez un spécialiste. Le patient sera notifié du transfert.</p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: ".7rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Médecin destinataire *</label>
              <select value={transferForm.to_doctor_id} onChange={e => setTransferForm(f => ({ ...f, to_doctor_id: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: ".88rem", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }}>
                <option value="">Sélectionner un médecin…</option>
                {doctors.filter(d => d.id !== user?.id).map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialite}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: ".7rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Motif du transfert</label>
              <textarea value={transferForm.reason} onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Ex: Nécessite une expertise en neurochirurgie…"
                rows={3}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: ".85rem", resize: "none", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowTransfer(false)} style={{ flex: 1, padding: "11px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: ".88rem", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={doTransfer} style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg,#0A2647,#1B3B6F)", border: "none", borderRadius: 12, color: "white", fontSize: ".9rem", fontWeight: 700, cursor: "pointer" }}>
                Confirmer le transfert →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? "#DC2626" : "#0A2647", borderRadius: 12, padding: "12px 24px", color: "white", fontSize: ".85rem", fontWeight: 500, zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(10,38,71,.3)", animation: "fadeUp .3s ease" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}