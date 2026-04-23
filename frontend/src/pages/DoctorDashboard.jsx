// src/pages/DoctorDashboard.jsx
// Dashboard Médecin - Design Premium inspiré de Tobba.tn
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION MÉDICALE
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  pending: { label: "En attente", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "⏳" },
  accepted: { label: "Acceptée", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", icon: "✅" },
  analyzed: { label: "Analysée", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: "🧬" },
  closed: { label: "Terminée", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: "🔒" },
  rejected: { label: "Rejetée", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "❌" },
};

const URGENCY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", priority: 4 },
  urgent: { label: "URGENT", color: "#EA580C", bg: "#FFF7ED", border: "#FDBA74", priority: 3 },
  normal: { label: "NORMAL", color: "#10B981", bg: "#F0FDF4", border: "#86EFAC", priority: 1 },
};

const MODEL_CONFIG = {
  brain: { label: "IRM Cérébrale", color: "#7C3AED", gradient: "linear-gradient(135deg, #7C3AED, #6D28D9)", icon: "🧠", bg: "#F5F3FF" },
  lung: { label: "Scanner CT", color: "#DC2626", gradient: "linear-gradient(135deg, #DC2626, #B91C1C)", icon: "🔬", bg: "#FEF2F2" },
  chest: { label: "Radio Thoracique", color: "#0369A1", gradient: "linear-gradient(135deg, #0EA5E9, #0369A1)", icon: "🫁", bg: "#F0F9FF" },
  retina: { label: "Fond d'œil", color: "#0E7490", gradient: "linear-gradient(135deg, #0E7490, #0891B2)", icon: "👁️", bg: "#ECFEFF" },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS INTERNES
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, color, bg, onClick, trend, subtitle }) {
  return (
    <div onClick={onClick} style={{
      background: "white",
      borderRadius: 20,
      padding: "24px",
      border: "1px solid #F1F5F9",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: bg, opacity: 0.3 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: "2rem" }}>{icon}</span>
          {trend && (
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: trend > 0 ? "#10B981" : "#EF4444", background: trend > 0 ? "#ECFDF5" : "#FEF2F2", padding: "4px 8px", borderRadius: 20 }}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
        <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>{label}</div>
        {subtitle && <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 4 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, desc, color, bg, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      background: "white",
      borderRadius: 20,
      padding: "20px",
      border: "1px solid #F1F5F9",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: 16,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 24px ${color}15`;
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "#F1F5F9";
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: "0.8rem", color: "#94A3B8", lineHeight: 1.4 }}>{desc}</div>
      </div>
      {count > 0 && (
        <span style={{
          position: "absolute", top: 12, right: 12,
          padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem",
          fontWeight: 700, background: color, color: "white",
        }}>{count}</span>
      )}
    </button>
  );
}

function ConsultationCard({ consultation, onClick }) {
  const model = MODEL_CONFIG[consultation.model_key] || MODEL_CONFIG.chest;
  const status = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.pending;
  const urgency = URGENCY_CONFIG[consultation.urgency] || URGENCY_CONFIG.normal;
  
  const waitTime = () => {
    if (!consultation.created_at) return "—";
    const diff = Math.floor((Date.now() - new Date(consultation.created_at).getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `${diff} min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}j`;
  };

  return (
    <div onClick={onClick} style={{
      background: "white",
      borderRadius: 16,
      padding: "20px",
      border: "1px solid #F1F5F9",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      borderLeft: `4px solid ${urgency.color}`,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: model.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.5rem", flexShrink: 0,
        }}>{model.icon}</div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A" }}>
              {consultation.patient_name || "Patient"}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#94A3B8", fontFamily: "'DM Mono', monospace" }}>
              #{consultation.id}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
              {status.icon} {status.label}
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}` }}>
              {urgency.label}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>⏱ {waitTime()}</span>
          </div>
        </div>

        {consultation.status === "analyzed" && (
          <div style={{
            padding: "4px 12px",
            background: "#ECFDF5",
            borderRadius: 20,
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#059669",
          }}>
            Résultats prêts
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, isDoctor }) {
  const isMine = (isDoctor && message.sender_role === "Medecin") || (!isDoctor && message.sender_role === "Patient");
  
  return (
    <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isMine && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #64748B, #475569)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "0.7rem", fontWeight: 700,
          marginRight: 8, flexShrink: 0,
        }}>
          {message.sender_name?.charAt(0) || "P"}
        </div>
      )}
      <div style={{
        maxWidth: "70%",
        padding: "12px 16px",
        borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isMine ? "#0F172A" : "#F8FAFC",
        border: isMine ? "none" : "1px solid #E2E8F0",
        color: isMine ? "white" : "#0F172A",
        fontSize: "0.85rem",
        lineHeight: 1.5,
      }}>
        {!isMine && <div style={{ fontSize: "0.65rem", color: "#94A3B8", marginBottom: 3, fontWeight: 600 }}>{message.sender_name}</div>}
        {message.content}
        <div style={{ fontSize: "0.6rem", color: isMine ? "rgba(255,255,255,0.4)" : "#CBD5E1", marginTop: 4, textAlign: "right" }}>
          {new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
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

  // State
  const [activeView, setActiveView] = useState("dashboard"); // dashboard | consultations | messages | analytics
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
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  
  const messagesEndRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // ═══════════════ FETCH FUNCTIONS ═══════════════
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    } catch (e) { console.error("fetchQueue:", e); }
  }, [token]);

  const fetchAssigned = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssigned(data.consultations || []);
      }
    } catch (e) { console.error("fetchAssigned:", e); }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/notifications/me?unread_only=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const res = await fetch(`${API}/consultations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConsultationData(data.consultation);
        setMessages(data.messages || []);
        setAnalysis(data.analysis);
      }
    } catch (e) { console.error("fetchConsultationDetails:", e); }
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchQueue(), fetchAssigned(), fetchNotifications()]);
    setLoading(false);
  }, [fetchQueue, fetchAssigned, fetchNotifications]);

  // Effects
  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { fetchConsultationDetails(selectedConsultation); }, [selectedConsultation, fetchConsultationDetails]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  
  // Close popups
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue();
      fetchAssigned();
      fetchNotifications();
      if (selectedConsultation) fetchConsultationDetails(selectedConsultation);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedConsultation, fetchQueue, fetchAssigned, fetchNotifications, fetchConsultationDetails]);

  // ═══════════════ ACTIONS ═══════════════
  const handleAccept = async (id) => {
    setActionLoading(`accept-${id}`);
    try {
      await fetch(`${API}/consultations/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadAll();
      setSelectedConsultation(id);
      setActiveView("messages");
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id, reason = "") => {
    setActionLoading(`reject-${id}`);
    try {
      const form = new FormData();
      form.append("reason", reason);
      await fetch(`${API}/consultations/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      await loadAll();
      if (selectedConsultation === id) {
        setSelectedConsultation(null);
        setActiveView("dashboard");
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleRunAnalysis = async () => {
    if (!selectedConsultation || !consultationData) return;
    setAnalysisLoading(true);
    try {
      const imagePath = consultationData.image_path;
      if (!imagePath) throw new Error("Aucune image trouvée.");
      
      const imageRes = await fetch(`http://localhost:8000/${imagePath}`);
      if (!imageRes.ok) throw new Error("Impossible de charger l'image.");
      
      const imageBlob = await imageRes.blob();
      const file = new File([imageBlob], "image.jpg", { type: imageBlob.type || "image/jpeg" });
      
      const formData = new FormData();
      formData.append("file", file);
      
      const modelKey = consultationData.model_key || "chest";
      const predictRes = await fetch(`${API}/predict?model=${modelKey}&gradcam=true&explain=false`, {
        method: "POST",
        body: formData,
      });
      
      if (!predictRes.ok) throw new Error(`Erreur API: ${predictRes.status}`);
      
      const reader = predictRes.body.getReader();
      const decoder = new TextDecoder();
      let predictionData = null;
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "prediction") predictionData = event;
          } catch {}
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
      
      await fetch(`${API}/consultations/${selectedConsultation}/analysis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: saveForm,
      });
      
      await fetchConsultationDetails(selectedConsultation);
      await fetchAssigned();
    } catch (e) {
      console.error("❌ Erreur analyse:", e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedConsultation) return;
    try {
      await fetch(`${API}/consultations/${selectedConsultation}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }),
      });
      setMsgInput("");
      await fetchConsultationDetails(selectedConsultation);
    } catch (e) { console.error(e); }
  };

  // ═══════════════ COMPUTED ═══════════════
  const stats = useMemo(() => ({
    queue: queue.length,
    critical: queue.filter(c => c.urgency === "critical").length,
    urgent: queue.filter(c => c.urgency === "urgent").length,
    active: assigned.filter(c => c.status === "accepted" || c.status === "analyzed").length,
    analyzed: assigned.filter(c => c.status === "analyzed").length,
    closed: assigned.filter(c => c.status === "closed").length,
    totalPatients: assigned.length + queue.length,
  }), [queue, assigned]);

  const filteredQueue = useMemo(() => {
    return queue.filter(c => {
      const matchUrgency = filterUrgency === "all" || c.urgency === filterUrgency;
      const matchSearch = !searchQuery || 
        c.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.id).includes(searchQuery);
      return matchUrgency && matchSearch;
    });
  }, [queue, filterUrgency, searchQuery]);

  const filteredAssigned = useMemo(() => {
    return assigned.filter(c => {
      return !searchQuery || 
        c.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.id).includes(searchQuery);
    });
  }, [assigned, searchQuery]);

  const userDomains = user?.domains || [];
  const model = consultationData ? MODEL_CONFIG[consultationData.model_key] || MODEL_CONFIG.chest : null;
  const canMessage = consultationData && (consultationData.status === "accepted" || consultationData.status === "analyzed");

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)",
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.12); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
        *::-webkit-scrollbar { width: 6px; } *::-webkit-scrollbar-track { background: transparent; } *::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>

      {/* ═══════════════ HEADER ═══════════════ */}
      <header style={{
        background: "linear-gradient(135deg, #0A2647 0%, #144272 50%, #205295 100%)",
        padding: "20px 32px",
        color: "white",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 20px rgba(10,38,71,0.3)",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          {/* Logo + Doctor info */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(14,165,233,0.3))",
                border: "2px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", fontWeight: 800,
              }}>🏥</div>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Med<span style={{ color: "#38BDF8" }}>AI</span>
                </div>
                <div style={{ fontSize: "0.6rem", opacity: 0.6, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
                  PLATEFORME MÉDICALE
                </div>
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.2)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem", fontWeight: 700,
              }}>
                {user?.full_name?.charAt(0)?.toUpperCase() || "M"}
              </div>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                  Dr. {user?.full_name || "Médecin"}
                </div>
                <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>
                  {user?.specialty || "Médecin"} · {userDomains.map(d => MODEL_CONFIG[d]?.icon).filter(Boolean).join(" ")}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[
              { key: "dashboard", icon: "📊", label: "Vue d'ensemble" },
              { key: "consultations", icon: "👥", label: "Consultations", badge: stats.queue },
              { key: "messages", icon: "💬", label: "Messages" },
              { key: "analytics", icon: "📈", label: "Analyses" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveView(tab.key)} style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: "none",
                background: activeView === tab.key ? "rgba(255,255,255,0.2)" : "transparent",
                color: "white",
                fontSize: "0.85rem",
                fontWeight: activeView === tab.key ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                backdropFilter: activeView === tab.key ? "blur(10px)" : "none",
              }}>
                {tab.icon} {tab.label}
                {tab.badge > 0 && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 10, fontSize: "0.7rem",
                    fontWeight: 700, background: "#EF4444", color: "white",
                  }}>{tab.badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Notifications */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white", fontSize: "1.1rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: -6, right: -6,
                    minWidth: 20, height: 20, borderRadius: 10,
                    background: "#EF4444", color: "white",
                    fontSize: "0.65rem", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 5px", border: "2px solid #0A2647",
                    animation: "pulse 2s infinite",
                  }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div style={{
                  position: "absolute", top: 52, right: 0, width: 380,
                  maxHeight: 420, background: "white", borderRadius: 16,
                  border: "1px solid #E2E8F0", boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                  overflow: "hidden", animation: "fadeUp 0.2s ease",
                }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", background: "#FAFBFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: "#0F172A" }}>Notifications</span>
                    {unreadCount > 0 && <button style={{ background: "none", border: "none", color: "#3B82F6", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Tout lire</button>}
                  </div>
                  <div style={{ overflowY: "auto", maxHeight: 360 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Aucune notification</div>
                    ) : notifications.slice(0, 10).map(n => (
                      <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid #F8FAFC", cursor: "pointer", background: n.is_read ? "white" : "#F0F9FF" }}
                        onClick={() => {
                          try {
                            const d = typeof n.data === "string" ? JSON.parse(n.data) : n.data;
                            if (d.consultation_id) {
                              setSelectedConsultation(d.consultation_id);
                              setActiveView("messages");
                            }
                          } catch {}
                          setShowNotifications(false);
                        }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <span style={{ fontSize: "1.1rem" }}>📌</span>
                          <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A" }}>{n.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{n.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={profileRef} style={{ position: "relative" }}>
              <button onClick={() => setShowProfile(!showProfile)} style={{
                width: 42, height: 42, borderRadius: 12,
                background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
                border: "2px solid rgba(255,255,255,0.3)",
                color: "white", fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {user?.full_name?.charAt(0)?.toUpperCase() || "M"}
              </button>
              
              {showProfile && (
                <div style={{
                  position: "absolute", top: 52, right: 0, width: 280,
                  background: "white", borderRadius: 16,
                  border: "1px solid #E2E8F0", boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                  overflow: "hidden", animation: "fadeUp 0.2s ease",
                }}>
                  <div style={{ padding: "20px", borderBottom: "1px solid #F1F5F9", background: "linear-gradient(135deg, #0A2647, #205295)", color: "white" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700 }}>Dr. {user?.full_name}</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{user?.specialty}</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.6, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>@{user?.username}</div>
                  </div>
                  <div style={{ padding: "12px" }}>
                    {userDomains.map(d => {
                      const m = MODEL_CONFIG[d];
                      return m ? (
                        <div key={d} style={{ padding: "8px 12px", borderRadius: 8, background: m.bg, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{m.icon}</span>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: m.color }}>{m.label}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div style={{ padding: "8px 12px", borderTop: "1px solid #F1F5F9" }}>
                    <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} style={{
                      width: "100%", padding: "10px",
                      background: "#FEF2F2", border: "none", borderRadius: 10,
                      color: "#EF4444", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                    }}>
                      🚪 Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>
        
        {/* ── VUE: DASHBOARD ── */}
        {activeView === "dashboard" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Alertes urgentes */}
            {stats.critical > 0 && (
              <div style={{
                padding: "16px 20px", background: "linear-gradient(135deg, #FEF2F2, #FFF1F2)",
                border: "1.5px solid #FCA5A5", borderRadius: 16, marginBottom: 24,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: "1.5rem" }}>🚨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#991B1B" }}>
                    {stats.critical} cas critique{stats.critical > 1 ? "s" : ""} en attente !
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#B91C1C" }}>
                    Intervention immédiate requise pour ces consultations.
                  </div>
                </div>
                <button onClick={() => { setFilterUrgency("critical"); setActiveView("consultations"); }} style={{
                  padding: "8px 16px", background: "#DC2626", border: "none",
                  borderRadius: 10, color: "white", fontSize: "0.8rem",
                  fontWeight: 700, cursor: "pointer",
                }}>
                  Voir →
                </button>
              </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard icon="👥" label="Total Patients" value={stats.totalPatients} color="#0F172A" bg="#F1F5F9" trend={12} />
              <StatCard icon="⏳" label="En Attente" value={stats.queue} color="#F59E0B" bg="#FFFBEB" onClick={() => setActiveView("consultations")} />
              <StatCard icon="✅" label="En Cours" value={stats.active} color="#3B82F6" bg="#EFF6FF" subtitle={`${stats.analyzed} analysées`} />
              <StatCard icon="🔒" label="Terminées" value={stats.closed} color="#10B981" bg="#ECFDF5" />
            </div>

            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <QuickAction icon="🔬" label="Analyse Libre" desc="Classifier une image" color="#7C3AED" bg="#F5F3FF" onClick={() => navigate("/classification")} />
              <QuickAction icon="📋" label="File d'Attente" desc="Gérer les demandes" color="#F59E0B" bg="#FFFBEB" onClick={() => setActiveView("consultations")} count={stats.queue} />
              <QuickAction icon="💬" label="Messages" desc="Communiquer avec patients" color="#3B82F6" bg="#EFF6FF" onClick={() => setActiveView("messages")} />
              <QuickAction icon="📊" label="Rapports" desc="Statistiques détaillées" color="#10B981" bg="#ECFDF5" onClick={() => setActiveView("analytics")} />
            </div>

            {/* Dernières consultations */}
            <div style={{
              background: "white", borderRadius: 20, border: "1px solid #F1F5F9",
              overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                padding: "20px 24px", borderBottom: "1px solid #F1F5F9",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A" }}>
                  📋 Dernières Consultations
                </h2>
                <button onClick={() => setActiveView("consultations")} style={{
                  background: "none", border: "1px solid #E2E8F0",
                  borderRadius: 10, padding: "6px 14px", color: "#3B82F6",
                  fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                }}>
                  Voir tout →
                </button>
              </div>
              
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {loading ? (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ width: 36, height: 36, border: "3px solid #E2E8F0", borderTopColor: "#0F172A", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                    <div style={{ color: "#94A3B8" }}>Chargement...</div>
                  </div>
                ) : [...assigned.slice(0, 3), ...queue.slice(0, 2)].length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
                    <div>Aucune consultation</div>
                  </div>
                ) : (
                  [...assigned.slice(0, 3), ...queue.slice(0, 2)].slice(0, 5).map(c => (
                    <ConsultationCard
                      key={c.id}
                      consultation={c}
                      onClick={() => {
                        setSelectedConsultation(c.id);
                        setActiveView("messages");
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── VUE: CONSULTATIONS ── */}
        {activeView === "consultations" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
                👥 Consultations
              </h1>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {["all", "critical", "urgent"].map(f => (
                  <button key={f} onClick={() => setFilterUrgency(f)} style={{
                    padding: "8px 16px", borderRadius: 10, border: "1px solid",
                    borderColor: filterUrgency === f ? "transparent" : "#E2E8F0",
                    background: filterUrgency === f ? (f === "critical" ? "#DC2626" : f === "urgent" ? "#EA580C" : "#0F172A") : "white",
                    color: filterUrgency === f ? "white" : "#64748B",
                    fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                  }}>
                    {f === "all" ? "Tous" : f === "critical" ? "Critiques" : "Urgents"}
                    ({f === "all" ? queue.length : queue.filter(c => c.urgency === f).length})
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <input
                  placeholder="🔍 Rechercher..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: "8px 16px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                    fontSize: "0.85rem", width: 240, outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredQueue.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
                  <div style={{ color: "#64748B" }}>Aucune consultation en attente</div>
                </div>
              ) : filteredQueue.map(c => (
                <div key={c.id} style={{
                  background: "white", borderRadius: 16, padding: "20px",
                  border: "1px solid #F1F5F9", display: "flex", alignItems: "center",
                  gap: 16, cursor: "pointer",
                }}
                  onClick={() => {
                    setSelectedConsultation(c.id);
                    setActiveView("messages");
                  }}
                >
                  <ConsultationCard consultation={c} onClick={() => {
                    setSelectedConsultation(c.id);
                    setActiveView("messages");
                  }} />
                  
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); handleAccept(c.id); }} style={{
                      padding: "8px 16px", background: "linear-gradient(135deg, #10B981, #059669)",
                      border: "none", borderRadius: 10, color: "white",
                      fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                    }}>
                      ✅ Accepter
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleReject(c.id); }} style={{
                      padding: "8px 16px", border: "1.5px solid #FCA5A5",
                      borderRadius: 10, color: "#EF4444", fontSize: "0.8rem",
                      fontWeight: 600, cursor: "pointer", background: "white",
                    }}>
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VUE: MESSAGES ── */}
        {activeView === "messages" && (
          <div style={{ animation: "fadeUp 0.4s ease", display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
            {/* Messages Panel */}
            <div style={{
              background: "white", borderRadius: 20, border: "1px solid #F1F5F9",
              display: "flex", flexDirection: "column", height: "calc(100vh - 200px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              {!selectedConsultation ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94A3B8", padding: 40 }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Sélectionnez une consultation</div>
                  <div style={{ fontSize: "0.8rem", marginTop: 4 }}>dans la liste des consultations</div>
                </div>
              ) : consultationData ? (
                <>
                  {/* Header */}
                  <div style={{
                    padding: "16px 20px", borderBottom: "1px solid #F1F5F9",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: model?.gradient || "linear-gradient(135deg, #64748B, #475569)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.2rem",
                    }}>{model?.icon || "🏥"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0F172A" }}>
                        {consultationData.patient_name}
                        <span style={{ fontSize: "0.7rem", color: "#94A3B8", marginLeft: 8 }}>#{consultationData.id}</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {STATUS_CONFIG[consultationData.status]?.icon} {STATUS_CONFIG[consultationData.status]?.label}
                      </div>
                    </div>
                    
                    {consultationData.status === "accepted" && (
                      <button onClick={handleRunAnalysis} disabled={analysisLoading} style={{
                        padding: "8px 16px", background: "#7C3AED", border: "none",
                        borderRadius: 10, color: "white", fontSize: "0.8rem",
                        fontWeight: 600, cursor: "pointer",
                      }}>
                        {analysisLoading ? "🔄..." : "🤖 Analyser"}
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                        💬 Aucun message
                      </div>
                    ) : messages.map(m => (
                      <MessageBubble key={m.id} message={m} isDoctor={true} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  {canMessage && (
                    <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                        placeholder="Écrire un message..."
                        style={{
                          flex: 1, padding: "10px 16px", borderRadius: 12,
                          border: "1.5px solid #E2E8F0", fontSize: "0.85rem",
                          outline: "none", background: "#F8FAFC",
                        }}
                      />
                      <button onClick={handleSendMessage} disabled={!msgInput.trim()} style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "#0F172A", border: "none", color: "white",
                        fontSize: "1rem", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>➤</button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center", color: "#94A3B8" }}>
                    <div style={{ width: 36, height: 36, border: "3px solid #E2E8F0", borderTopColor: "#0F172A", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                    Chargement...
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Panel */}
            <div style={{
              background: "white", borderRadius: 20, border: "1px solid #F1F5F9",
              padding: 20, height: "calc(100vh - 200px)", overflowY: "auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>
                🧬 Analyse IA
              </h3>
              
              {!analysis ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>🤖</div>
                  <div>Analyse non disponible</div>
                </div>
              ) : (
                <div>
                  <div style={{
                    padding: 16, borderRadius: 12, marginBottom: 16,
                    background: "#F0FDF4", border: "1px solid #BBF7D0",
                  }}>
                    <div style={{ fontSize: "0.7rem", color: "#64748B", marginBottom: 4 }}>DIAGNOSTIC</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#059669" }}>
                      {analysis.prediction}
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A", marginTop: 8 }}>
                      {(analysis.confidence * 100).toFixed(1)}% de confiance
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}