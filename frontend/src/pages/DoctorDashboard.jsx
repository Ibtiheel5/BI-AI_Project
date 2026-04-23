// src/pages/DoctorDashboard.jsx
// DASHBOARD MÉDECIN PREMIUM — Multi-onglets avec Analyse IA Réelle
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION MÉDICALE
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  pending:  { label: "En attente",  color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "⏳" },
  accepted: { label: "Acceptée",    color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", icon: "✅" },
  analyzed: { label: "Analysée",    color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: "🧬" },
  closed:   { label: "Terminée",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: "🔒" },
  rejected: { label: "Rejetée",     color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "❌" },
};

const URGENCY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", priority: 4 },
  urgent:   { label: "URGENT",   color: "#EA580C", bg: "#FFF7ED", border: "#FDBA74", priority: 3 },
  normal:   { label: "NORMAL",   color: "#10B981", bg: "#F0FDF4", border: "#86EFAC", priority: 1 },
};

const MODEL_CONFIG = {
  brain:  { label: "IRM Cérébrale", fullLabel: "IRM — Encéphale", color: "#7C3AED", gradient: "linear-gradient(135deg, #7C3AED, #6D28D9)", icon: "🧠", bg: "#F5F3FF" },
  lung:   { label: "Scanner CT", fullLabel: "TDM — Poumons", color: "#DC2626", gradient: "linear-gradient(135deg, #DC2626, #B91C1C)", icon: "🔬", bg: "#FEF2F2" },
  chest:  { label: "Radio Thoracique", fullLabel: "RX — Thorax", color: "#0369A1", gradient: "linear-gradient(135deg, #0EA5E9, #0369A1)", icon: "🫁", bg: "#F0F9FF" },
  retina: { label: "Fond d'œil", fullLabel: "Rétinographie", color: "#0E7490", gradient: "linear-gradient(135deg, #0E7490, #0891B2)", icon: "👁️", bg: "#ECFEFF" },
};

const PREDICTION_COLORS = {
  "Normal": "#10B981", "No Finding": "#10B981", "No_DR": "#10B981", "notumor": "#10B981",
  "COVID": "#DC2626", "Pneumonia": "#DC2626", "Pneumothorax": "#DC2626",
  "Edema": "#DC2626", "Mass": "#DC2626", "Malignant": "#DC2626",
  "Glioma": "#DC2626", "Proliferate_DR": "#DC2626",
  "Cardiomegaly": "#EA580C", "Meningioma": "#EA580C", "Emphysema": "#EA580C",
  "Benign": "#D97706", "Nodule": "#D97706", "Mild": "#D97706", "Moderate": "#EA580C", "Severe": "#DC2626",
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS INTERNES
// ═══════════════════════════════════════════════════════════════════════════

function ParticlesBg() {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 3 + 1, duration: 10 + Math.random() * 15,
    delay: Math.random() * 8, opacity: 0.03 + Math.random() * 0.05,
  })), []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "#7C3AED", opacity: p.opacity,
          animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, color, bg, alert, onClick, subtitle }) {
  return (
    <div onClick={onClick} style={{
      background: "white", borderRadius: 16, padding: "16px 18px",
      border: "1px solid #E2E8F0", cursor: onClick ? "pointer" : "default",
      position: "relative", overflow: "hidden", transition: "all 0.2s",
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 16px ${color}15`; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; } }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: bg, opacity: 0.4 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: "1.5rem" }}>{icon}</span>
          {alert && <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#DC2626", animation: "pulse 1.5s infinite" }} />}
        </div>
        <div style={{ fontSize: "1.7rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, marginTop: 4 }}>{label}</div>
        {subtitle && <div style={{ fontSize: "0.65rem", color: "#94A3B8", marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function LoadingSpinner({ text = "Chargement..." }) {
  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #E2E8F0", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
      <div style={{ color: "#94A3B8", fontSize: "0.85rem" }}>{text}</div>
    </div>
  );
}

function EmptyState({ icon, title, desc, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px", background: "linear-gradient(180deg, #FAFBFC, #F1F5F9)", borderRadius: 20, border: "1px dashed #E2E8F0" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: 16, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: "0.85rem", color: "#94A3B8", lineHeight: 1.6, maxWidth: 350, margin: "0 auto 20px" }}>{desc}</div>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ padding: "12px 28px", background: "linear-gradient(135deg, #0A2647, #1B3B6F)", border: "none", borderRadius: 12, color: "white", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(10,38,71,0.25)" }}>{actionLabel}</button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  // ═══════════════ STATE ═══════════════
  const [activeTab, setActiveTab] = useState("dashboard");
  const [queue, setQueue] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultationData, setConsultationData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [apptForm, setApptForm] = useState({ type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" });

  const messagesEndRef = useRef(null);
  const notifRef = useRef(null);

  // ═══════════════ FETCH ═══════════════
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/queue`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.consultations || []).sort((a, b) => {
          const uA = URGENCY_CONFIG[a.urgency]?.priority || 0;
          const uB = URGENCY_CONFIG[b.urgency]?.priority || 0;
          if (uA !== uB) return uB - uA;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setQueue(sorted);
      }
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchAssigned = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/assigned`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setAssigned((await res.json()).consultations || []); }
    } catch (e) {}
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/notifications/me?unread_only=false`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread || 0);
      }
    } catch (e) {}
  }, [token]);

  const fetchConsultationDetails = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API}/consultations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setConsultationData(data.consultation);
        setMessages(data.messages || []);
        setAnalysis(data.analysis);
        if (data.appointment) setAppointments(prev => prev.find(a => a.id === data.appointment.id) ? prev : [...prev, data.appointment]);
      }
    } catch (e) {}
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchQueue(), fetchAssigned(), fetchNotifications()]);
    setLoading(false);
  }, [fetchQueue, fetchAssigned, fetchNotifications]);

  // ═══════════════ EFFECTS ═══════════════
  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { fetchConsultationDetails(selectedConsultation); }, [selectedConsultation, fetchConsultationDetails]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    if (showNotifications) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifications]);
  useEffect(() => {
    const interval = setInterval(() => { fetchQueue(); fetchAssigned(); fetchNotifications(); if (selectedConsultation) fetchConsultationDetails(selectedConsultation); }, 8000);
    return () => clearInterval(interval);
  }, [selectedConsultation]);

  // ═══════════════ ACTIONS ═══════════════
  const handleAccept = async (id) => {
    setActionLoading(`accept-${id}`);
    try {
      await fetch(`${API}/consultations/${id}/accept`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      await loadAll(); setSelectedConsultation(id); setActiveTab("consultation");
    } catch (e) {} finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionLoading(`reject-${rejectId}`);
    try {
      const form = new FormData(); form.append("reason", rejectReason);
      await fetch(`${API}/consultations/${rejectId}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      setShowRejectModal(false); setRejectReason(""); setRejectId(null);
      await loadAll();
      if (selectedConsultation === rejectId) setSelectedConsultation(null);
    } catch (e) {} finally { setActionLoading(null); }
  };

  const handleRunAnalysis = async () => {
    if (!selectedConsultation || !consultationData) return;
    setAnalysisLoading(true); setAnalysisError("");
    try {
      const imagePath = consultationData.image_path;
      if (!imagePath) throw new Error("Aucune image trouvée.");
      const imageRes = await fetch(`http://localhost:8000/${imagePath}`);
      if (!imageRes.ok) throw new Error("Impossible de charger l'image médicale.");
      const imageBlob = await imageRes.blob();
      const file = new File([imageBlob], "image.jpg", { type: imageBlob.type || "image/jpeg" });
      const formData = new FormData(); formData.append("file", file);
      const modelKey = consultationData.model_key || "chest";
      const predictRes = await fetch(`${API}/predict?model=${modelKey}&gradcam=true&explain=false`, { method: "POST", body: formData });
      if (!predictRes.ok) throw new Error(`Erreur API: ${predictRes.status}`);
      const reader = predictRes.body.getReader(); const decoder = new TextDecoder(); let predictionData = null, buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim(); if (!jsonStr || jsonStr === "[DONE]") continue;
          try { const event = JSON.parse(jsonStr); if (event.type === "prediction") predictionData = event; } catch {}
        }
      }
      if (!predictionData) throw new Error("Aucune prédiction reçue.");
      const saveForm = new FormData();
      saveForm.append("prediction", predictionData.prediction);
      saveForm.append("confidence", String(predictionData.confidence));
      saveForm.append("probabilities", JSON.stringify(predictionData.probabilities || {}));
      saveForm.append("explain_text", predictionData.warning || "");
      saveForm.append("gradcam_b64", predictionData.gradcam_image || "");
      saveForm.append("out_of_domain", String(predictionData.out_of_domain || false));
      saveForm.append("warning", predictionData.warning || "");
      await fetch(`${API}/consultations/${selectedConsultation}/analysis`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: saveForm });
      await fetchConsultationDetails(selectedConsultation); await fetchAssigned();
    } catch (e) { setAnalysisError(e.message); } finally { setAnalysisLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedConsultation) return;
    setSendingMsg(true);
    try {
      await fetch(`${API}/consultations/${selectedConsultation}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }) });
      setMsgInput(""); await fetchConsultationDetails(selectedConsultation);
    } catch (e) {} finally { setSendingMsg(false); }
  };

  const handleClose = async () => {
    if (!selectedConsultation) return;
    setActionLoading("close");
    try {
      const form = new FormData(); form.append("doctor_notes", closeNotes);
      await fetch(`${API}/consultations/${selectedConsultation}/close`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      setShowCloseModal(false); setCloseNotes(""); await loadAll(); await fetchConsultationDetails(selectedConsultation);
    } catch (e) {} finally { setActionLoading(null); }
  };

  const handleCreateAppointment = async () => {
    if (!apptForm.scheduled_at || !selectedConsultation) return;
    setActionLoading("appt");
    try {
      await fetch(`${API}/consultations/appointments`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: selectedConsultation, ...apptForm }),
      });
      setShowAppointmentModal(false);
      setApptForm({ type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" });
      await fetchConsultationDetails(selectedConsultation);
    } catch (e) {} finally { setActionLoading(null); }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/consultations/notifications/read-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(0); setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    } catch (e) {}
  };

  const selectConsultation = (id) => { setSelectedConsultation(id); setActiveTab("consultation"); };

  // ═══════════════ COMPUTED ═══════════════
  const stats = useMemo(() => ({
    queue: queue.length, critical: queue.filter(c => c.urgency === "critical").length,
    urgent: queue.filter(c => c.urgency === "urgent").length,
    accepted: assigned.filter(c => c.status === "accepted").length,
    analyzed: assigned.filter(c => c.status === "analyzed").length,
    closed: assigned.filter(c => c.status === "closed").length,
  }), [queue, assigned]);

  const canMessage = consultationData && (consultationData.status === "accepted" || consultationData.status === "analyzed");
  const model = consultationData ? MODEL_CONFIG[consultationData.model_key] || MODEL_CONFIG.chest : null;

  const filteredQueue = useMemo(() => queue.filter(c => {
    if (filterStatus === "critical") return c.urgency === "critical";
    if (searchQuery) return c.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) || String(c.id).includes(searchQuery);
    return true;
  }), [queue, filterStatus, searchQuery]);

  const formatTime = (d) => { if (!d) return ""; const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (diff < 1) return "À l'instant"; if (diff < 60) return `Il y a ${diff} min`; if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`; return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const tabs = [
    { key: "dashboard", icon: "📊", label: "Vue d'ensemble" },
    { key: "queue", icon: "👥", label: "File d'attente", badge: queue.length },
    { key: "consultation", icon: "💬", label: "Consultation" },
    { key: "appointments", icon: "📅", label: "Rendez-vous" },
    { key: "profile", icon: "👤", label: "Mon profil" },
  ];

  const NOTIF_ICONS = { new_consultation: "📋", consultation_accepted: "✅", consultation_rejected: "❌", analysis_ready: "🤖", appointment_scheduled: "📅", consultation_closed: "🔒", new_message: "💬", doctor_changed: "🔄" };
  const userDomains = user?.domains || [];

  // ═══════════════ RENDER ═══════════════
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F8FAFC, #F1F5F9)", fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <ParticlesBg />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.12); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes floatParticle { 0% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-18px) translateX(8px); } 100% { transform: translateY(12px) translateX(-10px); } }
        @keyframes alertPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
        *::-webkit-scrollbar { width: 5px; } *::-webkit-scrollbar-track { background: transparent; } *::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>

      {/* ═══════════════ HEADER ═══════════════ */}
      <div style={{ background: "linear-gradient(135deg, #030C1A, #0A2647, #144272)", padding: "20px 32px", color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ maxWidth: 1500, margin: "0 auto", position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>Dr. {user?.full_name || "Médecin"}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {user?.specialty && <span>{user.specialty}</span>}
                {userDomains.map(d => { const m = MODEL_CONFIG[d]; return m ? <span key={d} style={{ background: "rgba(255,255,255,0.12)", padding: "2px 8px", borderRadius: 6, fontSize: "0.65rem" }}>{m.icon} {m.label}</span> : null; })}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", cursor: "pointer", color: "white", position: "relative" }}>
                🔔{unreadCount > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, background: "#DC2626", color: "white", fontSize: "0.6rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", animation: "pulse 2s infinite" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>
              {showNotifications && (
                <div style={{ position: "absolute", top: 52, right: 0, width: 380, maxHeight: 400, background: "white", borderRadius: 18, border: "1px solid #E2E8F0", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", zIndex: 200, overflow: "hidden", animation: "fadeUp 0.2s ease" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", background: "#FAFBFC" }}>
                    <span style={{ fontWeight: 800, color: "#0A2647" }}>Notifications</span>
                    {unreadCount > 0 && <button onClick={markAllRead} style={{ background: "none", border: "1px solid #E2E8F0", color: "#475569", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", borderRadius: 6, padding: "3px 10px" }}>Tout lire</button>}
                  </div>
                  <div style={{ overflowY: "auto", maxHeight: 340 }}>
                    {notifications.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#CBD5E1" }}>Aucune notification</div> :
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} onClick={() => { try { const d = JSON.parse(n.data); if (d.consultation_id) { selectConsultation(d.consultation_id); setShowNotifications(false); } } catch {} }} style={{ padding: "12px 18px", borderBottom: "1px solid #F8FAFC", background: n.is_read ? "white" : "#F0F9FF", cursor: "pointer", animation: "slideIn 0.2s ease" }}>
                          <div style={{ display: "flex", gap: 10 }}>
                            <span>{NOTIF_ICONS[n.type] || "📌"}</span>
                            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, color: "#0A2647", fontSize: "0.8rem" }}>{n.title}</div><div style={{ fontSize: "0.7rem", color: "#64748B" }}>{n.message}</div><div style={{ fontSize: "0.6rem", color: "#CBD5E1", marginTop: 4 }}>{formatTime(n.created_at)}</div></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate("/classification")} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, color: "white", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>🔬 Analyse libre</button>
          </div>
        </div>
      </div>

      {/* ═══════════════ TABS ═══════════════ */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 1500, margin: "0 auto", display: "flex", gap: 2, padding: "0 32px", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "14px 22px", border: "none", background: "none",
              borderBottom: activeTab === tab.key ? "3px solid #7C3AED" : "3px solid transparent",
              color: activeTab === tab.key ? "#7C3AED" : "#64748B",
              fontWeight: activeTab === tab.key ? 700 : 400, fontSize: "0.85rem",
              cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8,
            }}>
              {tab.icon} {tab.label}
              {tab.badge > 0 && <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: "0.65rem", fontWeight: 700, background: activeTab === tab.key ? "#EDE9FE" : "#F1F5F9", color: activeTab === tab.key ? "#7C3AED" : "#94A3B8" }}>{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "24px 32px", position: "relative", zIndex: 1 }}>

        {/* ── TAB: DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Alertes */}
            {stats.critical > 0 && (
              <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #FEF2F2, #FFF1F2)", border: "1.5px solid #FCA5A5", borderRadius: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 12, animation: "alertPulse 2s infinite" }}>
                <span style={{ fontSize: "1.4rem" }}>🚨</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 800, color: "#991B1B" }}>{stats.critical} cas critique{stats.critical > 1 ? "s" : ""} en attente !</div><div style={{ fontSize: "0.78rem", color: "#B91C1C" }}>Intervention immédiate requise.</div></div>
                <button onClick={() => { setFilterStatus("critical"); setActiveTab("queue"); }} style={{ padding: "8px 16px", background: "#DC2626", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer" }}>Voir →</button>
              </div>
            )}
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 24 }}>
              <StatCard icon="👥" label="Total patients" value={stats.queue + assigned.length} color="#0F172A" bg="#F1F5F9" />
              <StatCard icon="⏳" label="En attente" value={stats.queue} color="#F59E0B" bg="#FFFBEB" alert={stats.critical > 0} onClick={() => setActiveTab("queue")} />
              <StatCard icon="🚨" label="Urgents/Critiques" value={stats.critical + stats.urgent} color="#DC2626" bg="#FEF2F2" onClick={() => { setFilterStatus("critical"); setActiveTab("queue"); }} subtitle="Action requise" />
              <StatCard icon="✅" label="En cours" value={stats.accepted} color="#3B82F6" bg="#EFF6FF" subtitle="Consultations actives" />
              <StatCard icon="🧬" label="Résultats IA" value={stats.analyzed} color="#10B981" bg="#ECFDF5" subtitle="Analyses terminées" />
              <StatCard icon="🔒" label="Terminés" value={stats.closed} color="#6B7280" bg="#F9FAFB" />
            </div>
            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { icon: "👥", label: "File d'attente", desc: "Gérer les demandes", color: "#F59E0B", bg: "#FFFBEB", action: () => setActiveTab("queue"), badge: stats.queue },
                { icon: "🤖", label: "Analyse IA", desc: "Lancer une analyse", color: "#7C3AED", bg: "#EDE9FE", action: () => navigate("/classification") },
                { icon: "📅", label: "Rendez-vous", desc: "Planning & visio", color: "#3B82F6", bg: "#EFF6FF", action: () => setActiveTab("appointments") },
                { icon: "📋", label: "Pathologies", desc: "Catalogue médical", color: "#10B981", bg: "#ECFDF5", action: () => navigate("/pathologies") },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{ padding: "18px", background: "white", borderRadius: 16, border: "1px solid #E2E8F0", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14, position: "relative", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = ""; }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{a.icon}</div>
                  <div><div style={{ fontWeight: 700, color: "#0A2647" }}>{a.label}</div><div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{a.desc}</div></div>
                  {a.badge > 0 && <span style={{ position: "absolute", top: 10, right: 14, padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: a.color, color: "white" }}>{a.badge}</span>}
                </button>
              ))}
            </div>
            {/* Cas récents */}
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, color: "#0A2647" }}>📋 Dernières consultations</span>
                <button onClick={() => setActiveTab("queue")} style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, color: "#7C3AED", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", padding: "5px 12px" }}>Voir tout →</button>
              </div>
              {loading ? <LoadingSpinner /> : assigned.length === 0 && queue.length === 0 ? <EmptyState icon="📋" title="Aucune consultation" desc="Aucun dossier en cours." /> : (
                <div style={{ padding: "10px 16px" }}>
                  {[...assigned.slice(0, 3), ...queue.slice(0, 2)].slice(0, 5).map(c => {
                    const m = MODEL_CONFIG[c.model_key] || MODEL_CONFIG.chest;
                    const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={c.id} onClick={() => selectConsultation(c.id)} style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 6, background: "#F8FAFC", border: "1px solid #F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: m.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>{m.icon}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, color: "#0A2647", fontSize: "0.85rem" }}>{c.patient_name}</div><div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>#{c.id} · {m.label} · {formatTime(c.created_at)}</div></div>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700, background: st.bg, color: st.color }}>{st.icon} {st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: FILE D'ATTENTE ── */}
        {activeTab === "queue" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647" }}>👥 File d'attente</h2><p style={{ color: "#64748B" }}>Gérez les demandes de consultation entrantes</p></div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {["all", "critical", "urgent"].map(f => (
                <button key={f} onClick={() => setFilterStatus(f)} style={{ padding: "8px 16px", borderRadius: 10, border: filterStatus === f ? "none" : "1px solid #E2E8F0", background: filterStatus === f ? (f === "critical" ? "#DC2626" : f === "urgent" ? "#EA580C" : "#0F172A") : "white", color: filterStatus === f ? "white" : "#64748B", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                  {f === "all" ? "Tous" : f === "critical" ? "Critiques" : "Urgents"} ({f === "all" ? queue.length : queue.filter(c => c.urgency === f).length})
                </button>
              ))}
              <div style={{ marginLeft: "auto", position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                <input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: "8px 14px 8px 34px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: "0.8rem", width: 200 }} />
              </div>
            </div>
            {loading ? <LoadingSpinner /> : filteredQueue.length === 0 ? <EmptyState icon="✅" title="File vide" desc="Aucune demande en attente." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredQueue.map(c => {
                  const m = MODEL_CONFIG[c.model_key] || MODEL_CONFIG.chest;
                  const ur = URGENCY_CONFIG[c.urgency] || URGENCY_CONFIG.normal;
                  return (
                    <div key={c.id} style={{ background: "white", borderRadius: 16, padding: "18px 20px", border: `1.5px solid ${ur.color}30`, borderLeft: `4px solid ${ur.color}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
                      onClick={() => selectConsultation(c.id)}>
                      <div style={{ width: 50, height: 50, borderRadius: 14, background: m.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{m.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "#0A2647", fontSize: "0.9rem" }}>{c.patient_name || "Patient"}</span>
                          <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: ur.bg, color: ur.color }}>{ur.label}</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>#{c.id} · {m.label} · Attente: {formatTime(c.created_at)}</div>
                        {c.patient_notes && <div style={{ marginTop: 6, padding: "6px 10px", background: "#FFFBEB", borderRadius: 8, fontSize: "0.72rem", color: "#92400E", fontStyle: "italic" }}>"{c.patient_notes.substring(0, 100)}{c.patient_notes.length > 100 ? '...' : ''}"</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={e => { e.stopPropagation(); handleAccept(c.id); }} disabled={actionLoading === `accept-${c.id}`} style={{ padding: "8px 16px", background: "linear-gradient(135deg, #059669, #047857)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }}>✅ Accepter</button>
                        <button onClick={e => { e.stopPropagation(); setRejectId(c.id); setShowRejectModal(true); }} style={{ padding: "8px 16px", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem", background: "white" }}>❌ Refuser</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CONSULTATION ── */}
        {activeTab === "consultation" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {!selectedConsultation ? (
              <EmptyState icon="💬" title="Aucune consultation sélectionnée" desc="Choisissez un patient dans la file d'attente." actionLabel="Voir la file d'attente" onAction={() => setActiveTab("queue")} />
            ) : consultationData ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
                {/* Messages + Détails */}
                <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: model?.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>{model?.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0A2647" }}>{consultationData.patient_name} <span style={{ fontWeight: 400, fontSize: "0.7rem", color: "#94A3B8" }}>#{consultationData.id}</span></div>
                        <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{model?.fullLabel} · {STATUS_CONFIG[consultationData.status]?.icon} {STATUS_CONFIG[consultationData.status]?.label}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {consultationData.status === "accepted" && <button onClick={handleRunAnalysis} disabled={analysisLoading} style={{ padding: "7px 14px", background: analysisLoading ? "#E2E8F0" : "#7C3AED", border: "none", borderRadius: 8, color: "white", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>{analysisLoading ? "🔄..." : "🤖 Analyser"}</button>}
                      {consultationData.status === "analyzed" && <button onClick={() => setShowCloseModal(true)} style={{ padding: "7px 14px", background: "#6B7280", border: "none", borderRadius: 8, color: "white", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>🔒 Clôturer</button>}
                      <button onClick={() => setShowAppointmentModal(true)} style={{ padding: "7px 14px", background: "#3B82F6", border: "none", borderRadius: 8, color: "white", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>📅 RDV</button>
                      <button onClick={() => navigate(`/video/consultation/${consultationData.id}`)} style={{ padding: "7px 14px", background: "#0F172A", border: "none", borderRadius: 8, color: "white", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>📹 Visio</button>
                    </div>
                  </div>
                  {analysisError && <div style={{ margin: "8px 16px", padding: "10px", background: "#FEF2F2", borderRadius: 8, color: "#DC2626", fontSize: "0.75rem" }}>⚠️ {analysisError} <button onClick={() => setAnalysisError("")} style={{ marginLeft: 8, background: "none", border: "none", color: "#DC2626", cursor: "pointer" }}>✕</button></div>}
                  {consultationData.patient_notes && <div style={{ margin: "8px 16px", padding: "10px", background: "#FFFBEB", borderRadius: 8, fontSize: "0.75rem", color: "#92400E", fontStyle: "italic" }}>📋 "{consultationData.patient_notes}"</div>}
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px", maxHeight: 400, minHeight: 200 }}>
                    {messages.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>💬 {canMessage ? "Commencez la discussion" : "Messages après acceptation"}</div> :
                      messages.map(m => {
                        const isMine = m.sender_role === "Medecin";
                        return (
                          <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 10 }}>
                            <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMine ? "#0F172A" : "white", color: isMine ? "white" : "#0A2647", border: isMine ? "none" : "1px solid #E2E8F0", fontSize: "0.8rem" }}>
                              {!isMine && <div style={{ fontSize: "0.6rem", color: "#94A3B8", marginBottom: 2 }}>{m.sender_name}</div>}
                              {m.content}
                              <div style={{ fontSize: "0.55rem", color: isMine ? "rgba(255,255,255,0.4)" : "#CBD5E1", marginTop: 4, textAlign: "right" }}>{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={messagesEndRef} />
                  </div>
                  {canMessage && (
                    <div style={{ padding: "12px 18px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 8 }}>
                      <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMessage()} placeholder="Écrire un message..." style={{ flex: 1, padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: "0.8rem", outline: "none" }} />
                      <button onClick={handleSendMessage} disabled={!msgInput.trim()} style={{ padding: "10px 18px", background: "#0F172A", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer" }}>Envoyer</button>
                    </div>
                  )}
                  {!canMessage && <div style={{ padding: "12px", textAlign: "center", color: "#94A3B8", fontSize: "0.8rem", borderTop: "1px solid #E2E8F0" }}>💬 Acceptez la consultation pour discuter</div>}
                </div>
                {/* Analyse IA */}
                <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", fontWeight: 800, color: "#0A2647" }}>🧬 Analyse IA</div>
                  <div style={{ padding: "16px" }}>
                    {analysisLoading ? <LoadingSpinner text="Analyse en cours..." /> : analysis ? (
                      <div>
                        <div style={{ padding: 14, borderRadius: 14, marginBottom: 14, background: analysis.out_of_domain ? "#FEF2F2" : "#F0FDF4", border: analysis.out_of_domain ? "1px solid #FECACA" : "1px solid #A7F3D0" }}>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 4 }}>{analysis.out_of_domain ? "⚠️ Hors domaine" : "Diagnostic"}</div>
                          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: PREDICTION_COLORS[analysis.prediction] || "#10B981", marginBottom: 6 }}>{analysis.prediction}</div>
                          {analysis.confidence != null && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${(analysis.confidence || 0) * 100}%`, height: "100%", background: (analysis.confidence || 0) > 0.8 ? "#10B981" : (analysis.confidence || 0) > 0.5 ? "#F59E0B" : "#DC2626", borderRadius: 3 }} />
                              </div>
                              <span style={{ fontWeight: 700, color: "#0A2647" }}>{((analysis.confidence || 0) * 100).toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                        {analysis.gradcam_b64 && <img src={`data:image/jpeg;base64,${analysis.gradcam_b64}`} alt="GradCAM" style={{ width: "100%", borderRadius: 12, marginBottom: 14 }} />}
                        {analysis.explain_text && <div style={{ padding: 10, background: "#F8FAFC", borderRadius: 8, fontSize: "0.75rem", color: "#475569", lineHeight: 1.6 }}>{analysis.explain_text}</div>}
                      </div>
                    ) : <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>{consultationData?.status === "accepted" ? "Cliquez « Analyser »" : "Non disponible"}</div>}
                  </div>
                </div>
              </div>
            ) : <LoadingSpinner />}
          </div>
        )}

        {/* ── TAB: RENDEZ-VOUS ── */}
        {activeTab === "appointments" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647" }}>📅 Rendez-vous</h2><p style={{ color: "#64748B" }}>Gérez vos rendez-vous patients</p></div>
              {selectedConsultation && consultationData && <button onClick={() => setShowAppointmentModal(true)} style={{ padding: "10px 20px", background: "#3B82F6", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: "pointer" }}>+ Nouveau RDV</button>}
            </div>
            <EmptyState icon="📅" title="Aucun rendez-vous" desc="Planifiez des rendez-vous depuis la consultation." />
          </div>
        )}

        {/* ── TAB: PROFIL ── */}
        {activeTab === "profile" && (
          <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 600 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", marginBottom: 20 }}>👤 Mon Profil</h2>
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid #E2E8F0", background: "linear-gradient(135deg, #FAFBFC, white)", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #7C3AED, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem", fontWeight: 700 }}>{user?.full_name?.charAt(0) || "M"}</div>
                <div><div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0A2647" }}>Dr. {user?.full_name}</div><div style={{ color: "#64748B", fontSize: "0.85rem" }}>@{user?.username} · {user?.role}</div></div>
              </div>
              <div style={{ padding: "20px 24px" }}>
                {[["Spécialité", user?.specialty],["Domaines", userDomains.map(d => MODEL_CONFIG[d]?.label || d).join(", ")],["Email", user?.email || "—"],["Statut", "Actif"]].map(([l, v], i) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 3 ? "1px solid #F8FAFC" : "none" }}><span style={{ color: "#94A3B8", fontSize: "0.85rem" }}>{l}</span><span style={{ fontWeight: 600, color: "#0A2647" }}>{v || "—"}</span></div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 20, padding: "14px 18px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, fontSize: "0.8rem", color: "#92400E" }}>⚠️ Rappel : Les diagnostics IA sont des aides à la décision. La responsabilité finale incombe au clinicien.</div>
          </div>
        )}

      </div>

      {/* ═══════════════ MODALS ═══════════════ */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>❌ Rejeter #{rejectId}</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Raison..." rows={3} style={{ width: "100%", padding: 12, border: "1px solid #E2E8F0", borderRadius: 12, marginBottom: 16, resize: "none" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowRejectModal(false); setRejectReason(""); }} style={{ flex: 1, padding: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleReject} style={{ flex: 1, padding: 10, background: "#DC2626", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer" }}>Rejeter</button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>🔒 Clôturer #{selectedConsultation}</h3>
            <textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} placeholder="Notes..." rows={3} style={{ width: "100%", padding: 12, border: "1px solid #E2E8F0", borderRadius: 12, marginBottom: 16, resize: "none" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCloseModal(false)} style={{ flex: 1, padding: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleClose} style={{ flex: 1, padding: 10, background: "#0F172A", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer" }}>Clôturer</button>
            </div>
          </div>
        </div>
      )}

      {showAppointmentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>📅 Planifier un RDV</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
              <select value={apptForm.type} onChange={e => setApptForm(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }}>
                <option value="video">📹 Vidéo</option><option value="in_person">🏥 Présentiel</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Date/Heure *</label>
              <input type="datetime-local" value={apptForm.scheduled_at} onChange={e => setApptForm(p => ({ ...p, scheduled_at: e.target.value }))} style={{ width: "100%", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Durée (min)</label>
              <input type="number" value={apptForm.duration_minutes} onChange={e => setApptForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))} min="15" step="15" style={{ width: "100%", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            </div>
            {apptForm.type === "video" ? (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Lien visio</label>
                <input value={apptForm.video_link} onChange={e => setApptForm(p => ({ ...p, video_link: e.target.value }))} placeholder="https://meet.google.com/..." style={{ width: "100%", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Lieu</label>
                <input value={apptForm.location} onChange={e => setApptForm(p => ({ ...p, location: e.target.value }))} placeholder="Cabinet, hôpital..." style={{ width: "100%", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAppointmentModal(false)} style={{ flex: 1, padding: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleCreateAppointment} disabled={!apptForm.scheduled_at} style={{ flex: 1, padding: 10, background: "#3B82F6", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer" }}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}