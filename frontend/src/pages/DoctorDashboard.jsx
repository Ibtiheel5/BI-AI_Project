// pages/DoctorDashboard.jsx
// DASHBOARD MÉDICAL CLINIQUE - VERSION FINALE UNIFIÉE
// Compatible avec le Header.jsx existant - Design DSE professionnel

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ═══════════════════════════════════════════════════════════════════════════
// ICÔNES MÉDICALES SVG PROFESSIONNELLES
// ═══════════════════════════════════════════════════════════════════════════

const MedicalIcons = {
  Activity: ({ size = 18, color = "#0EA5E9" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12H6L8 8L11 16L14 10L16 14L18 12H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  
  HeartRate: ({ size = 18, color = "#EF4444" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill={color} fillOpacity="0.9"/>
      <path d="M7 12H9L10 9L12 15L13 12H17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Brain: ({ size = 18, color = "#8B5CF6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4C8 4 5 7 5 11C5 15 8 18 12 18C16 18 19 15 19 11C19 7 16 4 12 4Z" stroke={color} strokeWidth="1.5"/>
      <path d="M9 10C9.5 9 10.5 9 11 10M13 10C13.5 9 14.5 9 15 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 14C11 15 13 15 14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="9" r="1" fill={color}/>
      <circle cx="15" cy="9" r="1" fill={color}/>
    </svg>
  ),
  
  Lungs: ({ size = 18, color = "#0EA5E9" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 5C4 6 2 9 3 13C4 17 7 20 12 20C17 20 20 17 21 13C22 9 20 6 17 5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 5V20M7 10L4 13M17 10L20 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  CTScan: ({ size = 18, color = "#EF4444" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.2"/>
      <path d="M12 7V17M7 12H17" stroke={color} strokeWidth="1" strokeDasharray="3 2"/>
    </svg>
  ),
  
  DNA: ({ size = 18, color = "#10B981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 6C10 9 14 9 17 6M7 18C10 15 14 15 17 18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 3L8 6M18 21L16 18M6 21L8 18M18 3L16 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Clock: ({ size = 14, color = "#64748B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
      <path d="M12 7V12L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Alert: ({ size = 14, color = "#EF4444" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 9V13M12 17V17.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 3L2 20H22L12 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  
  CheckCircle: ({ size = 14, color = "#10B981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
      <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  Patient: ({ size = 18, color = "#0F172A" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
      <path d="M5 20V19C5 15.1 8.1 12 12 12C15.9 12 19 15.1 19 19V20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Calendar: ({ size = 14, color = "#64748B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M8 2V6M16 2V6M3 10H21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Video: ({ size = 14, color = "#0F172A" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="15" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M22 8L17 11V13L22 16V8Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  
  Stethoscope: ({ size = 18, color = "#0F172A" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6V13C6 15 8 17 12 17C16 17 18 15 18 13V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="6" r="2.5" stroke={color} strokeWidth="1.5"/>
      <circle cx="18" cy="6" r="2.5" stroke={color} strokeWidth="1.5"/>
      <path d="M12 17V21M12 21H9M12 21H15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  TrendingUp: ({ size = 14, color = "#10B981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M23 6L13.5 15.5L8.5 10.5L3 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 6H23V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  
  ChevronRight: ({ size = 14, color = "#64748B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  
  Search: ({ size = 14, color = "#64748B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
      <path d="M16 16L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION MÉDICALE
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  pending:  { label: "En attente",  color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  accepted: { label: "Acceptée",    color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  analyzed: { label: "Analysée",    color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
  closed:   { label: "Terminée",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
  rejected: { label: "Rejetée",     color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
};

const URGENCY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", priority: 4 },
  urgent:   { label: "URGENT",   color: "#EA580C", bg: "#FFF7ED", border: "#FDBA74", priority: 3 },
  normal:   { label: "NORMAL",   color: "#10B981", bg: "#F0FDF4", border: "#86EFAC", priority: 1 },
};

const MODEL_CONFIG = {
  brain: { 
    label: "IRM Cérébrale", 
    fullLabel: "IRM - Encéphale",
    color: "#8B5CF6", 
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    icon: "brain",
  },
  lung: { 
    label: "Scanner Thoracique", 
    fullLabel: "TDM - Poumons",
    color: "#EF4444", 
    gradient: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
    icon: "lungs",
  },
  chest: { 
    label: "Radio Thoracique", 
    fullLabel: "RX - Thorax",
    color: "#0EA5E9", 
    gradient: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)",
    icon: "ctscan",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS CLINIQUES
// ═══════════════════════════════════════════════════════════════════════════

// Widget de signes vitaux
const VitalsMonitor = ({ patientName }) => {
  const [vitals] = useState({
    hr: 72, rr: 16, bp: "118/76", spo2: 98, temp: 37.1
  });
  
  return (
    <div style={{
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
      borderRadius: 16,
      padding: "16px 20px",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MedicalIcons.Activity size={16} color="#0EA5E9" />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Monitoring
          </span>
        </div>
        <span style={{ fontSize: "0.6rem", color: "#64748B" }}>
          Dernière mesure: {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        <VitalItem icon={<MedicalIcons.HeartRate size={16} color="#EF4444" />} label="FC" value={vitals.hr} unit="bpm" />
        <VitalItem icon={<MedicalIcons.Lungs size={16} color="#0EA5E9" />} label="FR" value={vitals.rr} unit="/min" />
        <VitalItem label="TA" value={vitals.bp} unit="mmHg" />
        <VitalItem label="SpO₂" value={vitals.spo2} unit="%" status="normal" />
        <VitalItem label="Temp" value={vitals.temp} unit="°C" />
      </div>
      
      {/* Mini ECG */}
      <div style={{ marginTop: 12, height: 30, display: "flex", alignItems: "flex-end" }}>
        <svg width="100%" height="30" viewBox="0 0 200 30" preserveAspectRatio="none">
          <path d="M0,15 L10,15 L15,5 L20,15 L25,15 L30,15 L35,25 L40,15 L50,15 L55,15 L60,15 L65,10 L70,15 L75,15 L80,15 L85,20 L90,15 L100,15 L105,15 L110,15 L115,8 L120,15 L125,15 L130,15 L135,22 L140,15 L150,15 L155,15 L160,15 L165,12 L170,15 L175,15 L180,15 L185,18 L190,15 L200,15" 
            stroke="#EF4444" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

const VitalItem = ({ icon, label, value, unit }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
      {icon || <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#94A3B8" }}>{label}</span>}
    </div>
    <div style={{ fontSize: "1rem", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
      {value}
    </div>
    <div style={{ fontSize: "0.55rem", color: "#64748B", fontWeight: 600 }}>
      {unit}
    </div>
  </div>
);

// Widget d'activité
const ActivityChart = ({ data }) => {
  const maxValue = Math.max(...data, 1);
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  
  return (
    <div style={{
      background: "white",
      borderRadius: 14,
      padding: "16px 18px",
      border: "1px solid #E2E8F0",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MedicalIcons.TrendingUp size={14} color="#10B981" />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Activité clinique (7j)
          </span>
        </div>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#10B981" }}>
          +12%
        </span>
      </div>
      
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 50 }}>
        {data.map((value, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{
              width: "100%",
              height: `${(value / maxValue) * 100}%`,
              minHeight: 3,
              background: i === data.length - 1 
                ? "linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)" 
                : "#CBD5E1",
              borderRadius: 3,
            }} />
            <span style={{ fontSize: "0.5rem", color: "#94A3B8", fontWeight: 600 }}>
              {days[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Carte patient dans la file
const QueueItemCard = ({ consultation, isSelected, onClick, onAccept, onReject, loading }) => {
  const model = MODEL_CONFIG[consultation.model_key] || MODEL_CONFIG.chest;
  const urgency = URGENCY_CONFIG[consultation.urgency] || URGENCY_CONFIG.normal;
  const IconComponent = MedicalIcons[model.icon === "brain" ? "Brain" : model.icon === "lungs" ? "Lungs" : "CTScan"];
  
  const waitTime = () => {
    if (!consultation.created_at) return "—";
    const diff = Math.floor((Date.now() - new Date(consultation.created_at).getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `${diff} min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}j`;
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected 
          ? `linear-gradient(135deg, ${model.color}08, white)` 
          : "white",
        borderRadius: 12,
        padding: "14px",
        marginBottom: 8,
        cursor: "pointer",
        transition: "all 0.2s",
        border: isSelected 
          ? `1.5px solid ${model.color}` 
          : "1px solid #F1F5F9",
        borderLeft: `3px solid ${urgency.color}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: model.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", flexShrink: 0,
        }}>
          <IconComponent size={18} color="white" />
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0F172A" }}>
              {consultation.patient_name || "Patient"}
            </span>
            <span style={{
              padding: "2px 6px", borderRadius: 4, fontSize: "0.55rem", fontWeight: 700,
              background: urgency.bg, color: urgency.color,
            }}>
              {urgency.label}
            </span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: "0.6rem", color: "#94A3B8", fontFamily: "monospace" }}>
              #{String(consultation.id).padStart(4, "0")}
            </span>
            <span style={{ fontSize: "0.6rem", color: model.color }}>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <MedicalIcons.Clock size={10} color="#94A3B8" />
              <span style={{ fontSize: "0.55rem", color: "#94A3B8" }}>{waitTime()}</span>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onAccept(consultation.id); }}
              disabled={loading}
              style={{
                flex: 1, padding: "5px 8px", background: loading ? "#E2E8F0" : model.gradient,
                border: "none", borderRadius: 6, color: "white", fontSize: "0.65rem", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Accepter
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReject(consultation.id); }}
              style={{
                padding: "5px 10px", background: "white", border: "1px solid #FCA5A5",
                borderRadius: 6, color: "#EF4444", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Message clinique
const MessageBubble = ({ message, isDoctor }) => {
  const isMine = (isDoctor && message.sender_role === "Medecin") || 
                 (!isDoctor && message.sender_role === "Patient");
  
  return (
    <div style={{
      display: "flex",
      justifyContent: isMine ? "flex-end" : "flex-start",
      marginBottom: 10,
    }}>
      {!isMine && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "#64748B", display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "0.65rem", fontWeight: 700,
          marginRight: 8, flexShrink: 0,
        }}>
          {message.sender_name?.charAt(0) || "P"}
        </div>
      )}
      <div style={{
        maxWidth: "75%",
        padding: "10px 14px",
        borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isMine ? "#0F172A" : "white",
        border: isMine ? "none" : "1px solid #E2E8F0",
        color: isMine ? "white" : "#0F172A",
        fontSize: "0.75rem",
        lineHeight: 1.5,
      }}>
        {!isMine && (
          <div style={{ fontSize: "0.55rem", color: "#94A3B8", marginBottom: 3, fontWeight: 600 }}>
            {message.sender_name}
          </div>
        )}
        {message.content}
        <div style={{
          fontSize: "0.5rem",
          color: isMine ? "rgba(255,255,255,0.5)" : "#CBD5E1",
          marginTop: 4,
          textAlign: "right",
        }}>
          {new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  const [queue, setQueue] = useState([]);
  const [assigned, setAssigned] = useState([]);
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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef(null);

  // Fetch functions
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.consultations || []).sort((a, b) => {
          const urgencyA = URGENCY_CONFIG[a.urgency]?.priority || 0;
          const urgencyB = URGENCY_CONFIG[b.urgency]?.priority || 0;
          if (urgencyA !== urgencyB) return urgencyB - urgencyA;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setQueue(sorted);
      }
    } catch (e) {}
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
    } catch (e) {}
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchQueue(), fetchAssigned()]);
    setLoading(false);
  }, [fetchQueue, fetchAssigned]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { fetchConsultationDetails(selectedConsultation); }, [selectedConsultation, fetchConsultationDetails]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue();
      fetchAssigned();
      if (selectedConsultation) fetchConsultationDetails(selectedConsultation);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedConsultation, fetchQueue, fetchAssigned, fetchConsultationDetails]);

  const handleAccept = async (id) => {
    setActionLoading(`accept-${id}`);
    try {
      await fetch(`${API}/consultations/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadAll();
      setSelectedConsultation(id);
    } catch (e) {} finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionLoading(`reject-${rejectId}`);
    try {
      const form = new FormData();
      form.append("reason", rejectReason);
      await fetch(`${API}/consultations/${rejectId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      setShowRejectModal(false);
      setRejectReason("");
      setRejectId(null);
      await loadAll();
      if (selectedConsultation === rejectId) setSelectedConsultation(null);
    } catch (e) {} finally { setActionLoading(null); }
  };

  const handleRunAnalysis = async () => {
    if (!selectedConsultation || !consultationData) return;
    setAnalysisLoading(true);
    setTimeout(async () => {
      try {
        const fakeResult = {
          prediction: "Normal",
          confidence: 0.94,
          probabilities: JSON.stringify({ Normal: 0.94, Pneumonia: 0.03, COVID: 0.02, Cardiomegaly: 0.01 }),
          explain_text: "Aucune anomalie détectée. Parenchyme pulmonaire normal.",
        };
        const form = new FormData();
        form.append("prediction", fakeResult.prediction);
        form.append("confidence", String(fakeResult.confidence));
        form.append("probabilities", fakeResult.probabilities);
        form.append("explain_text", fakeResult.explain_text);
        form.append("out_of_domain", "false");
        await fetch(`${API}/consultations/${selectedConsultation}/analysis`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        await fetchConsultationDetails(selectedConsultation);
        await fetchAssigned();
      } catch (e) {} finally { setAnalysisLoading(false); }
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedConsultation) return;
    setSendingMsg(true);
    try {
      await fetch(`${API}/consultations/${selectedConsultation}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }),
      });
      setMsgInput("");
      await fetchConsultationDetails(selectedConsultation);
    } catch (e) {} finally { setSendingMsg(false); }
  };

  const handleClose = async () => {
    if (!selectedConsultation) return;
    setActionLoading("close");
    try {
      const form = new FormData();
      form.append("doctor_notes", closeNotes);
      await fetch(`${API}/consultations/${selectedConsultation}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      setShowCloseModal(false);
      setCloseNotes("");
      await loadAll();
      await fetchConsultationDetails(selectedConsultation);
    } catch (e) {} finally { setActionLoading(null); }
  };

  const stats = {
    queue: queue.length,
    critical: queue.filter(c => c.urgency === "critical").length,
    urgent: queue.filter(c => c.urgency === "urgent").length,
    accepted: assigned.filter(c => c.status === "accepted").length,
    analyzed: assigned.filter(c => c.status === "analyzed").length,
  };

  const canMessage = consultationData && (consultationData.status === "accepted" || consultationData.status === "analyzed");
  const model = consultationData ? MODEL_CONFIG[consultationData.model_key] : null;
  const ModelIcon = model ? MedicalIcons[model.icon === "brain" ? "Brain" : model.icon === "lungs" ? "Lungs" : "CTScan"] : MedicalIcons.CTScan;

  const filteredQueue = queue.filter(c => {
    if (filterStatus === "critical") return c.urgency === "critical";
    if (searchQuery) {
      return c.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             String(c.id).includes(searchQuery);
    }
    return true;
  });

  const activityData = [4, 7, 5, 9, 6, 8, 12];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F1F5F9",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <div style={{ padding: "24px 32px" }}>
        
        {/* ═══════════════════════════════════════════════════════════
            STATS CARDS
            ═══════════════════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard 
            icon={<MedicalIcons.Patient size={18} color="#0F172A" />}
            label="Total patients"
            value={stats.queue + assigned.length}
            color="#0F172A"
          />
          <StatCard 
            icon={<MedicalIcons.Clock size={18} color="#F59E0B" />}
            label="En attente"
            value={stats.queue}
            color="#F59E0B"
            alert={stats.critical > 0}
          />
          <StatCard 
            icon={<MedicalIcons.Alert size={18} color="#EF4444" />}
            label="Urgents"
            value={stats.critical + stats.urgent}
            color="#EF4444"
          />
          <StatCard 
            icon={<MedicalIcons.CheckCircle size={18} color="#3B82F6" />}
            label="En cours"
            value={stats.accepted}
            color="#3B82F6"
          />
          <StatCard 
            icon={<MedicalIcons.DNA size={18} color="#10B981" />}
            label="Résultats"
            value={stats.analyzed}
            color="#10B981"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            MAIN GRID - 3 COLONNES
            ═══════════════════════════════════════════════════════ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr 380px",
          gap: 20,
        }}>

          {/* COLONNE GAUCHE - FILE D'ATTENTE */}
          <div>
            <div style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 18px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MedicalIcons.Patient size={18} color="#0F172A" />
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A" }}>
                    File d'attente
                  </span>
                  <span style={{
                    padding: "2px 8px", background: "#F1F5F9", borderRadius: 20,
                    fontSize: "0.65rem", fontWeight: 700, color: "#64748B",
                  }}>
                    {queue.length}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["all", "critical"].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: "0.6rem", fontWeight: 600,
                        background: filterStatus === f ? (f === "critical" ? "#EF4444" : "#0F172A") : "transparent",
                        color: filterStatus === f ? "white" : "#64748B",
                        border: filterStatus === f ? "none" : "1px solid #E2E8F0",
                        cursor: "pointer",
                      }}
                    >
                      {f === "all" ? "Tous" : "Critiques"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recherche */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ position: "relative" }}>
                  <MedicalIcons.Search size={14} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="Rechercher patient..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 8px 8px 28px", marginLeft: "-20px",
                      background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8,
                      fontSize: "0.7rem", outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ maxHeight: 420, overflowY: "auto", padding: "12px" }}>
                {loading ? (
                  <div style={{ textAlign: "center", padding: 30 }}>
                    <div style={{ width: 28, height: 28, border: "3px solid #E2E8F0", borderTopColor: "#0F172A", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }}/>
                  </div>
                ) : filteredQueue.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 30 }}>
                    <MedicalIcons.CheckCircle size={32} color="#10B981" />
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 8 }}>
                      File vide
                    </div>
                  </div>
                ) : (
                  filteredQueue.map(c => (
                    <QueueItemCard
                      key={c.id}
                      consultation={c}
                      isSelected={selectedConsultation === c.id}
                      onClick={() => setSelectedConsultation(c.id)}
                      onAccept={handleAccept}
                      onReject={(id) => { setRejectId(id); setShowRejectModal(true); }}
                      loading={actionLoading === `accept-${c.id}`}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Activité */}
            <div style={{ marginTop: 16 }}>
              <ActivityChart data={activityData} />
            </div>
          </div>

          {/* COLONNE CENTRALE - CONSULTATION */}
          <div>
            {!selectedConsultation ? (
              <div style={{
                background: "white", borderRadius: 16, border: "1px solid #E2E8F0",
                padding: 48, textAlign: "center", minHeight: 500,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <MedicalIcons.Stethoscope size={48} color="#CBD5E1" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", marginTop: 16, marginBottom: 6 }}>
                  Aucune consultation sélectionnée
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#94A3B8", maxWidth: 260, lineHeight: 1.5 }}>
                  Sélectionnez un patient dans la file d'attente
                </p>

                {assigned.length > 0 && (
                  <div style={{ marginTop: 32, width: "100%", maxWidth: 320 }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94A3B8", marginBottom: 10, textTransform: "uppercase" }}>
                      Consultations en cours
                    </div>
                    {assigned.slice(0, 3).map(c => {
                      const m = MODEL_CONFIG[c.model_key] || MODEL_CONFIG.chest;
                      const IconComp = MedicalIcons[m.icon === "brain" ? "Brain" : m.icon === "lungs" ? "Lungs" : "CTScan"];
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedConsultation(c.id)}
                          style={{
                            width: "100%", padding: "12px 14px", marginBottom: 6,
                            background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10,
                            cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                          }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: m.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <IconComp size={16} color="white" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>{c.patient_name}</div>
                            <div style={{ fontSize: "0.65rem", color: "#94A3B8" }}>#{c.id}</div>
                          </div>
                          <span style={{
                            padding: "2px 8px", borderRadius: 20, fontSize: "0.55rem", fontWeight: 700,
                            background: STATUS_CONFIG[c.status]?.bg, color: STATUS_CONFIG[c.status]?.color,
                          }}>
                            {STATUS_CONFIG[c.status]?.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : consultationData ? (
              <div style={{
                background: "white", borderRadius: 16, border: "1px solid #E2E8F0",
                display: "flex", flexDirection: "column",
              }}>
                {/* Header */}
                <div style={{
                  padding: "18px 20px", borderBottom: "1px solid #F1F5F9",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 12,
                      background: model?.gradient,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ModelIcon size={24} color="white" />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>
                          {consultationData.patient_name}
                        </h2>
                        <span style={{ fontSize: "0.65rem", color: "#94A3B8", fontFamily: "monospace" }}>
                          #{consultationData.id}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 20, fontSize: "0.6rem", fontWeight: 700,
                          background: STATUS_CONFIG[consultationData.status]?.bg,
                          color: STATUS_CONFIG[consultationData.status]?.color,
                        }}>
                          {STATUS_CONFIG[consultationData.status]?.label}
                        </span>
                        <span style={{ fontSize: "0.65rem", color: "#64748B" }}>
                          {model?.fullLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {consultationData.status === "accepted" && (
                      <button onClick={handleRunAnalysis} disabled={analysisLoading} style={{
                        padding: "8px 14px", background: analysisLoading ? "#E2E8F0" : "#8B5CF6",
                        border: "none", borderRadius: 8, color: "white", fontSize: "0.7rem", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <MedicalIcons.DNA size={14} color="white" />
                        Analyser
                      </button>
                    )}
                    {consultationData.status === "analyzed" && (
                      <button onClick={() => setShowCloseModal(true)} style={{
                        padding: "8px 14px", background: "#6B7280", border: "none", borderRadius: 8,
                        color: "white", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                      }}>
                        Clôturer
                      </button>
                    )}
                    <button onClick={() => navigate(`/video/${consultationData.id}`)} style={{
                      padding: "8px 14px", background: "#0F172A", border: "none", borderRadius: 8,
                      color: "white", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <MedicalIcons.Video size={14} color="white" />
                      Visio
                    </button>
                  </div>
                </div>

                {/* Monitoring */}
                <VitalsMonitor patientName={consultationData.patient_name} />

                {/* Notes */}
                {consultationData.patient_notes && (
                  <div style={{
                    margin: "0 18px 14px", padding: "12px 14px",
                    background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A",
                  }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#92400E", marginBottom: 4, textTransform: "uppercase" }}>
                      Notes cliniques
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#92400E", lineHeight: 1.5, fontStyle: "italic" }}>
                      "{consultationData.patient_notes}"
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0 18px", maxHeight: 220 }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                        {canMessage ? "Aucun message" : "Messages après acceptation"}
                      </div>
                    </div>
                  ) : (
                    messages.map(m => <MessageBubble key={m.id} message={m} isDoctor={true} />)
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {canMessage && (
                  <div style={{ padding: "14px 18px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      onKeyPress={e => e.key === "Enter" && handleSendMessage()}
                      placeholder="Message..."
                      style={{
                        flex: 1, padding: "10px 14px", background: "#F8FAFC",
                        border: "1px solid #E2E8F0", borderRadius: 8,
                        fontSize: "0.75rem", outline: "none",
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!msgInput.trim() || sendingMsg}
                      style={{
                        padding: "0 18px", background: "#0F172A", border: "none", borderRadius: 8,
                        color: "white", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Envoyer
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTopColor: "#0F172A", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }}/>
              </div>
            )}
          </div>

          {/* COLONNE DROITE - ANALYSE & PLANNING */}
          <div>
            {/* Analyse IA */}
            <div style={{
              background: "white", borderRadius: 16, border: "1px solid #E2E8F0",
              overflow: "hidden", marginBottom: 16,
            }}>
              <div style={{
                padding: "16px 18px", borderBottom: "1px solid #F1F5F9",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <MedicalIcons.DNA size={18} color="#8B5CF6" />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A" }}>
                  Analyse IA
                </span>
                {analysis && (
                  <span style={{
                    marginLeft: "auto", padding: "3px 8px", borderRadius: 20,
                    background: "#10B98115", color: "#10B981", fontSize: "0.6rem", fontWeight: 700,
                  }}>
                    Disponible
                  </span>
                )}
              </div>

              <div style={{ padding: "16px" }}>
                {!selectedConsultation ? (
                  <div style={{ textAlign: "center", padding: 30 }}>
                    <MedicalIcons.DNA size={32} color="#CBD5E1" />
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 8 }}>
                      Sélectionnez une consultation
                    </div>
                  </div>
                ) : analysis ? (
                  <>
                    <div style={{
                      padding: 14, borderRadius: 12, marginBottom: 14,
                      background: "#F0FDF4", border: "1px solid #A7F3D0",
                    }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#64748B", marginBottom: 4 }}>
                        Diagnostic
                      </div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#10B981", marginBottom: 6 }}>
                        {analysis.prediction}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: "#E2E8F0", borderRadius: 3 }}>
                          <div style={{
                            width: `${(analysis.confidence || 0) * 100}%`, height: "100%",
                            background: "#10B981", borderRadius: 3,
                          }}/>
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A" }}>
                          {((analysis.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {analysis.explain_text && (
                      <div style={{
                        padding: 12, background: "#F8FAFC", borderRadius: 10,
                        fontSize: "0.7rem", color: "#475569", lineHeight: 1.6,
                      }}>
                        {analysis.explain_text}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: 30 }}>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                      {consultationData?.status === "accepted" 
                        ? "En attente d'analyse" 
                        : "Non disponible"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Planning */}
            <div style={{
              background: "white", borderRadius: 16, border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 18px", borderBottom: "1px solid #F1F5F9",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MedicalIcons.Calendar size={16} color="#64748B" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A" }}>
                    Planning
                  </span>
                </div>
                <button style={{
                  padding: "4px 10px", background: "#0F172A", border: "none", borderRadius: 6,
                  color: "white", fontSize: "0.6rem", fontWeight: 600, cursor: "pointer",
                }}>
                  + RDV
                </button>
              </div>

              <div style={{ padding: "16px" }}>
                <div style={{ textAlign: "center", padding: 20 }}>
                  <MedicalIcons.Calendar size={28} color="#CBD5E1" />
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 6 }}>
                    Aucun rendez-vous
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 14 }}>Rejeter la consultation</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Raison du rejet..." rows={3} style={{ width: "100%", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10, marginBottom: 16, resize: "none", fontSize: "0.75rem" }}/>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowRejectModal(false); setRejectReason(""); }} style={{ flex: 1, padding: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontSize: "0.75rem" }}>Annuler</button>
              <button onClick={handleReject} style={{ flex: 1, padding: 10, background: "#EF4444", border: "none", borderRadius: 8, color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 14 }}>Clôturer la consultation</h3>
            <textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} placeholder="Notes de clôture..." rows={3} style={{ width: "100%", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10, marginBottom: 16, resize: "none", fontSize: "0.75rem" }}/>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowCloseModal(false)} style={{ flex: 1, padding: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontSize: "0.75rem" }}>Annuler</button>
              <button onClick={handleClose} style={{ flex: 1, padding: 10, background: "#0F172A", border: "none", borderRadius: 8, color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }}>Clôturer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant StatCard
const StatCard = ({ icon, label, value, color, alert }) => (
  <div style={{
    background: "white", borderRadius: 14, padding: "16px 18px",
    border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "relative",
  }}>
    <div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500, marginTop: 2 }}>
        {label}
      </div>
    </div>
    <div style={{
      width: 42, height: 42, borderRadius: 11,
      background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {icon}
    </div>
    {alert && (
      <div style={{
        position: "absolute", top: -4, right: -4,
        width: 10, height: 10, borderRadius: "50%",
        background: "#EF4444", border: "2px solid white",
        animation: "pulse 1.5s infinite",
      }}/>
    )}
  </div>
);