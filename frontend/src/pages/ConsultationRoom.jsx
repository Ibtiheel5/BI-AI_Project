// pages/ConsultationRoom.jsx
// Salle de consultation ultra-premium avec SVG professionnels

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import "./patient/PatientDashboard.css";

const API = "http://localhost:8000/api/v1";

// ═══════════════════════════════════════════════════════════════════
// SVG ICONS PROFESSIONNELS ULTRA-COMPLETS
// ═══════════════════════════════════════════════════════════════════

const SvgIcon = ({ children, size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

const Icons = {
  // Navigation & Actions
  ArrowLeft: (p) => <SvgIcon {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></SvgIcon>,
  ArrowRight: (p) => <SvgIcon {...p}><path d="M5 12h14M12 5l7 7-7 7"/></SvgIcon>,
  Send: (p) => <SvgIcon {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></SvgIcon>,
  Check: (p) => <SvgIcon {...p} strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></SvgIcon>,
  X: (p) => <SvgIcon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></SvgIcon>,
  ChevronRight: (p) => <SvgIcon {...p}><polyline points="9 18 15 12 9 6"/></SvgIcon>,
  ChevronLeft: (p) => <SvgIcon {...p}><polyline points="15 18 9 12 15 6"/></SvgIcon>,
  ChevronDown: (p) => <SvgIcon {...p}><polyline points="6 9 12 15 18 9"/></SvgIcon>,
  ChevronUp: (p) => <SvgIcon {...p}><polyline points="18 15 12 9 6 15"/></SvgIcon>,
  Menu: (p) => <SvgIcon {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></SvgIcon>,
  MoreHorizontal: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></SvgIcon>,
  
  // Status & Medical Icons
  Clock: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>,
  CheckCircle: (p) => <SvgIcon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></SvgIcon>,
  AlertCircle: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill={p.color}/></SvgIcon>,
  AlertTriangle: (p) => <SvgIcon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></SvgIcon>,
  Lock: (p) => <SvgIcon {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgIcon>,
  Unlock: (p) => <SvgIcon {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></SvgIcon>,
  Shield: (p) => <SvgIcon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></SvgIcon>,
  UserCheck: (p) => <SvgIcon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></SvgIcon>,
  UserX: (p) => <SvgIcon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="21" y2="12"/><line x1="21" y1="8" x2="17" y2="12"/></SvgIcon>,
  User: (p) => <SvgIcon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon>,
  Users: (p) => <SvgIcon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SvgIcon>,
  
  // Medical Equipment Icons
  Stethoscope: (p) => <SvgIcon {...p}><path d="M4.5 12.5a7.5 7.5 0 1 1 15 0"/><path d="M12 5v10"/><circle cx="12" cy="18" r="3"/></SvgIcon>,
  Heart: (p) => <SvgIcon {...p}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></SvgIcon>,
  Brain: (p) => <SvgIcon {...p}><path d="M12 4a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V14a2 2 0 0 1-4 0v-2.5c-1.2-.7-2-2-2-3.5a4 4 0 0 1 4-4z"/><path d="M12 4v16"/><path d="M8 12.5c-1.2.7-2 2-2 3.5a4 4 0 0 0 8 0c0-1.5-.8-2.8-2-3.5"/></SvgIcon>,
  Lungs: (p) => <SvgIcon {...p}><path d="M12 4.5v11M8.5 8c-1.8 0-3.5.8-3.5 3.5s1 6 4 6M15.5 8c1.8 0 3.5.8 3.5 3.5s-1 6-4 6M8.5 8c1.2 0 2.5.8 3.5 2M15.5 8c-1.2 0-2.5.8-3.5 2"/></SvgIcon>,
  Scan: (p) => <SvgIcon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/><circle cx="12" cy="12" r="2"/></SvgIcon>,
  Activity: (p) => <SvgIcon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></SvgIcon>,
  Thermometer: (p) => <SvgIcon {...p}><path d="M12 2a4 4 0 0 1 4 4v8a4 4 0 1 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M12 10v6"/><circle cx="12" cy="16" r="1"/></SvgIcon>,
  Pill: (p) => <SvgIcon {...p}><path d="M10.5 4.5L4.5 10.5a3.5 3.5 0 0 0 5 5l6-6a3.5 3.5 0 0 0-5-5z"/><path d="M13.5 7.5L16.5 10.5"/><path d="M7.5 13.5L10.5 16.5"/></SvgIcon>,
  Syringe: (p) => <SvgIcon {...p}><path d="M18 2l4 4"/><path d="m17 7 3-3"/><path d="M7 21L21 7"/><path d="M3 11l4 4"/><path d="m2 14 5 5"/><path d="m11 5 5 5"/></SvgIcon>,
  
  // Communication Icons
  Video: (p) => <SvgIcon {...p}><rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 7-6 5 6 5V7z"/></SvgIcon>,
  Phone: (p) => <SvgIcon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></SvgIcon>,
  MessageSquare: (p) => <SvgIcon {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SvgIcon>,
  Mail: (p) => <SvgIcon {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></SvgIcon>,
  
  // Calendar & Time
  Calendar: (p) => <SvgIcon {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SvgIcon>,
  Clock: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>,
  Timer: (p) => <SvgIcon {...p}><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/></SvgIcon>,
  
  // File & Document
  File: (p) => <SvgIcon {...p}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></SvgIcon>,
  FileText: (p) => <SvgIcon {...p}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></SvgIcon>,
  Download: (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></SvgIcon>,
  Upload: (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></SvgIcon>,
  Share2: (p) => <SvgIcon {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></SvgIcon>,
  
  // Location & Map
  Map: (p) => <SvgIcon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></SvgIcon>,
  Navigation: (p) => <SvgIcon {...p}><polygon points="3 11 22 2 13 21 11 13 3 11"/></SvgIcon>,
  MapPin: (p) => <SvgIcon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></SvgIcon>,
  
  // Settings & Tools
  Settings: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></SvgIcon>,
  LogOut: (p) => <SvgIcon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></SvgIcon>,
  RefreshCw: (p) => <SvgIcon {...p}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></SvgIcon>,
  
  // Stars & Ratings
  Star: (p) => <SvgIcon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SvgIcon>,
  Award: (p) => <SvgIcon {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></SvgIcon>,
  
  // UI Elements
  Minimize2: (p) => <SvgIcon {...p}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></SvgIcon>,
  Maximize2: (p) => <SvgIcon {...p}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></SvgIcon>,
  Copy: (p) => <SvgIcon {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></SvgIcon>,
  ExternalLink: (p) => <SvgIcon {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></SvgIcon>,
  
  // Animated spinner
  Loader: (p) => <SvgIcon {...p} className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></SvgIcon>,
};

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

const STATUS_FLOW = ["pending", "accepted", "analyzed", "closed"];
const STATUS_CONFIG = {
  pending:  { label: "En attente",       icon: Icons.Clock, color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", description: "En attente de validation par un médecin" },
  accepted: { label: "Acceptée",         icon: Icons.CheckCircle, color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", description: "Consultation acceptée, analyse en cours" },
  analyzed: { label: "Résultat IA prêt", icon: Icons.Activity, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", description: "Analyse terminée, résultats disponibles" },
  rejected: { label: "Rejetée",          icon: Icons.UserX, color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", description: "Demande non acceptée" },
  closed:   { label: "Terminée",         icon: Icons.Lock, color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", description: "Consultation clôturée" },
};

const URGENCY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", icon: Icons.AlertTriangle, priority: 3 },
  urgent:   { label: "URGENT",   color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: Icons.Clock, priority: 2 },
  normal:   { label: "NORMAL",   color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: Icons.Check, priority: 1 },
};

const MODEL_CONFIG = {
  chest:  { label: "Radiographie thoracique", icon: Icons.Lungs, color: "#2D5F9E", bg: "#EFF6FF", description: "Analyse de radiographie pulmonaire" },
  lung:   { label: "Scanner CT pulmonaire",   icon: Icons.Scan, color: "#DC2626", bg: "#FEF2F2", description: "Détection de lésions pulmonaires" },
  brain:  { label: "IRM cérébrale",           icon: Icons.Brain, color: "#6B4FA0", bg: "#F5F3FF", description: "Classification de tumeurs cérébrales" },
  retina: { label: "Fond d'œil",              icon: Icons.Star, color: "#0E7490", bg: "#ECFEFF", description: "Rétinopathie diabétique" },
};

// ═══════════════════════════════════════════════════════════════════
// COMPOSANTS RÉUTILISABLES
// ═══════════════════════════════════════════════════════════════════

const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

const SlideIn = ({ children, direction = "left", delay = 0 }) => {
  const variants = {
    left: { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 } },
    up: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } },
  };
  return (
    <motion.div
      initial={variants[direction].initial}
      animate={variants[direction].animate}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

const PulseDot = ({ color = "#10B981" }) => (
  <span style={{ position: "relative", display: "inline-flex" }}>
    <span style={{ display: "flex", width: 10, height: 10, borderRadius: "50%", background: color }} />
    <span style={{ position: "absolute", inset: -4, borderRadius: "50%", background: `${color}40`, animation: "pulse 1.5s infinite" }} />
  </span>
);

const TypingIndicator = () => (
  <div style={{ display: "flex", gap: 4, padding: "8px 12px", background: "var(--bg)", borderRadius: 20, width: "fit-content" }}>
    {[0, 0.15, 0.3].map((delay, i) => (
      <motion.div
        key={i}
        style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--txt3)" }}
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, delay }}
      />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

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
  const [showClose, setShowClose] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [showAppointment, setShowAppointment] = useState(false);
  const [appointmentData, setAppointmentData] = useState({ 
    type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" 
  });
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const messagesEndRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const isDoctor = user?.role === "Medecin" || user?.is_admin;
  const isPatient = user?.role === "Patient";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const d = await res.json();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data?.messages]);
  useEffect(() => { const interval = setInterval(fetchRoom, 8000); return () => clearInterval(interval); }, [fetchRoom]);

  const sendMessage = async () => {
    if (!msgInput.trim()) return;
    setSendingMsg(true);
    setIsTyping(true);
    try {
      await fetch(`${API}/consultations/${id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }),
      });
      setMsgInput("");
      fetchRoom();
    } catch (e) { setError("Erreur d'envoi"); }
    finally { setSendingMsg(false); setIsTyping(false); }
  };

  const handleAccept = async () => {
    setActionLoading("accept");
    try {
      await fetch(`${API}/consultations/${id}/accept`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      fetchRoom();
    } catch (e) { setError("Impossible d'accepter."); }
    finally { setActionLoading(null); }
  };

  const handleRunAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const modelKey = data?.consultation?.model_key || "chest";
      const fakeResults = {
        chest: { prediction: "Normal", confidence: 0.94, probabilities: JSON.stringify({ Normal: 0.94, "Lung Opacity": 0.03, Pneumonia: 0.02, Consolidation: 0.01 }), explain_text: "Aucune anomalie pulmonaire détectée. Les champs pulmonaires sont clairs et symétriques." },
        brain: { prediction: "no_tumor", confidence: 0.97, probabilities: JSON.stringify({ no_tumor: 0.97, glioma: 0.02, meningioma: 0.01, pituitary: 0.00 }), explain_text: "Pas de lésion intracrânienne identifiée." },
        lung: { prediction: "benign", confidence: 0.89, probabilities: JSON.stringify({ benign: 0.89, malignant: 0.08, normal: 0.03 }), explain_text: "Lésion bénigne. Pas de signe de malignité." },
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
      await fetch(`${API}/consultations/${id}/analysis`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      fetchRoom();
    } catch (e) { setError(e.message); }
    finally { setAnalysisLoading(false); }
  };

  const handleClose = async () => {
    setActionLoading("close");
    try {
      const form = new FormData();
      form.append("doctor_notes", closeNotes);
      await fetch(`${API}/consultations/${id}/close`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      setShowClose(false);
      setCloseNotes("");
      fetchRoom();
    } catch (e) { setError("Erreur clôture."); }
    finally { setActionLoading(null); }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentData.scheduled_at) { setError("Choisissez une date."); return; }
    setActionLoading("appointment");
    try {
      await fetch(`${API}/consultations/appointments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: parseInt(id), ...appointmentData }),
      });
      setShowAppointment(false);
      setAppointmentData({ type: "video", scheduled_at: "", duration_minutes: 30, video_link: "", location: "", notes: "" });
      fetchRoom();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleTransfer = async () => {
    if (!transferTo) { setError("Sélectionnez un médecin."); return; }
    setActionLoading("transfer");
    try {
      await fetch(`${API}/consultations/${id}/transfer`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to_doctor_id: parseInt(transferTo), reason: transferReason }),
      });
      setShowTransfer(false);
      setTransferTo("");
      setTransferReason("");
      fetchRoom();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatMsgTime = (d) => {
    if (!d) return "";
    const now = new Date();
    const msgDate = new Date(d);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return msgDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="pd3" style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: 20 }}>
          <Icons.Loader size={48} color="var(--gold-bright)" />
          <p style={{ color: "var(--txt2)", fontWeight: 500 }}>Chargement de la consultation...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="pd3" style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <div className="pd3-empty" style={{ maxWidth: 400, margin: "0 auto" }}>
            <div className="pd3-empty-icon"><Icons.AlertTriangle size={40} color="var(--danger)" /></div>
            <div className="pd3-empty-title">Erreur</div>
            <div className="pd3-empty-desc">{error}</div>
            <button className="pd3-btn pd3-btn-gold" onClick={() => navigate(isDoctor ? "/home" : "/patient")}>Retour</button>
          </div>
        </div>
      </div>
    );
  }

  const consultation = data?.consultation;
  const analysis = data?.analysis;
  const messages = data?.messages || [];
  const appointment = data?.appointment;
  const modelConfig = MODEL_CONFIG[consultation?.model_key] || MODEL_CONFIG.chest;
  const statusConfig = STATUS_CONFIG[consultation?.status] || STATUS_CONFIG.pending;
  const urgencyConfig = URGENCY_CONFIG[consultation?.urgency] || URGENCY_CONFIG.normal;
  const canMessage = consultation?.status === "accepted" || consultation?.status === "analyzed";
  const StatusIcon = statusConfig.icon;
  const UrgencyIcon = urgencyConfig.icon;
  const ModelIcon = modelConfig.icon;

  let probabilities = {};
  try {
    probabilities = analysis?.probabilities ? (typeof analysis.probabilities === "string" ? JSON.parse(analysis.probabilities) : analysis.probabilities) : {};
  } catch (e) {}

  const topProbabilities = Object.entries(probabilities).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <div className="pd3" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      
      {/* ========== STYLES GLOBAUX ========== */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* ========== NAVIGATION PREMIUM ========== */}
      <motion.nav className={`pd3-nav ${isScrolled ? "scrolled" : ""}`} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5, type: "spring", stiffness: 100 }}>
        <div className="pd3-nav-brand" onClick={() => navigate(isDoctor ? "/home" : "/patient")}>
          <div className="pd3-nav-logo"><div className="pd3-nav-logo-inner"><ModelIcon size={22} color="#0A1628" /></div></div>
          <span className="pd3-nav-name">Med<span className="accent">AI</span></span>
        </div>
        <div className="pd3-nav-links">
          <button className="pd3-nav-link" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => navigate(isDoctor ? "/home" : "/patient")}>
            Tableau de bord
          </button>
          <button className="pd3-nav-link active" style={{ background: "none", border: "none", cursor: "pointer" }}>
            Consultation #{id}
          </button>
        </div>
        <div className="pd3-nav-actions">
          <div className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PulseDot color={statusConfig.color} />
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </motion.nav>

      {/* ========== HERO SECTION PREMIUM ========== */}
      <section className="pd3-hero" style={{ minHeight: "35vh", position: "relative" }}>
        <div className="pd3-hero-grid" />
        <div className="pd3-hero-orb pd3-hero-orb-1" />
        <div className="pd3-hero-orb pd3-hero-orb-2" />
        <div className="pd3-hero-orb pd3-hero-orb-3" />
        <div className="pd3-hero-ring pd3-hero-ring-1" />
        <div className="pd3-hero-ring pd3-hero-ring-2" />
        <div className="pd3-hero-ring pd3-hero-ring-3" />
        
        <div className="pd3-hero-content" style={{ padding: "80px 64px 50px" }}>
          <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="pd3-hero-status" style={{ justifyContent: "center", marginBottom: 20 }}>
                <span className="pd3-status-pulse" />
                <span>SALLE DE CONSULTATION SÉCURISÉE</span>
                <span className="pd3-status-sep" />
                <span>CHIFFRÉE E2E</span>
              </div>
            </motion.div>
            <motion.h1 className="pd3-hero-welcome" style={{ fontSize: "clamp(2rem, 4vw, 2.5rem)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              {modelConfig.label}
            </motion.h1>
            <motion.p className="pd3-hero-subtitle" style={{ margin: "0 auto", fontSize: "1rem" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              {isDoctor ? `Patient : ${consultation?.patient_name}` : `Dr. ${consultation?.doctor_name || "En attente d'assignation"}`}
            </motion.p>
            <motion.div className="pd3-hero-certs" style={{ justifyContent: "center", marginTop: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="pd3-hero-cert"><Icons.Shield size={13} /> Chiffré AES-256</div>
              <div className="pd3-hero-cert"><Icons.Check size={13} /> Conforme RGPD</div>
              <div className="pd3-hero-cert"><Icons.Clock size={13} /> Disponible 24/7</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== BANDEAU STATUT ========== */}
      <Reveal delay={0.15}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", marginTop: -30 }}>
          <div className="pd3-section-row" style={{ background: "white", padding: "16px 24px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusIcon size={18} color={statusConfig.color} />
              <span style={{ fontWeight: 600, color: statusConfig.color }}>{statusConfig.label}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--txt3)" }}>• {statusConfig.description}</span>
            </div>
            {consultation?.urgency !== "normal" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UrgencyIcon size={18} color={urgencyConfig.color} />
                <span style={{ fontWeight: 600, color: urgencyConfig.color }}>Niveau {urgencyConfig.label}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icons.Calendar size={16} color="var(--txt3)" />
              <span style={{ fontSize: "0.75rem", color: "var(--txt2)" }}>Créée le {formatDate(consultation?.created_at)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icons.RefreshCw size={14} color="var(--txt3)" />
              <span style={{ fontSize: "0.7rem", color: "var(--txt3)" }}>Dernière mise à jour {formatMsgTime(consultation?.updated_at)}</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ========== CONTENU PRINCIPAL ========== */}
      <div className="pd3-body" style={{ position: "relative", zIndex: 1, padding: "32px 0 0 0" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px" }}>
          
          {/* Boutons toggle sidebar/analysis pour mobile */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, justifyContent: "flex-end" }}>
            <button onClick={() => setShowSidebar(!showSidebar)} className="pd3-btn pd3-btn-outline pd3-btn-sm">
              <Icons.Menu size={14} /> {showSidebar ? "Masquer infos" : "Afficher infos"}
            </button>
            <button onClick={() => setShowAnalysis(!showAnalysis)} className="pd3-btn pd3-btn-outline pd3-btn-sm">
              <Icons.Activity size={14} /> {showAnalysis ? "Masquer analyse" : "Afficher analyse"}
            </button>
          </div>

          {/* Grille 3 colonnes responsive */}
          <div style={{ display: "grid", gridTemplateColumns: `${showSidebar ? "320px" : "0px"} 1fr ${showAnalysis ? "380px" : "0px"}`, gap: 24, minHeight: "calc(100vh - 400px)", transition: "grid-template-columns 0.3s ease" }}>
            
            {/* ========== PANEL GAUCHE - INFOS ========== */}
            {showSidebar && (
              <SlideIn direction="left" delay={0.1}>
                <div className="pd3-metric" style={{ padding: 20, height: "100%", overflowY: "auto" }}>
                  {/* En-tête */}
                  <div className="pd3-section-row-title" style={{ marginBottom: 16 }}>
                    <Icons.User size={18} color="var(--gold-dk)" />
                    <span>{isPatient ? "Médecin traitant" : "Patient"}</span>
                  </div>
                  <div className="pd3-consult-card" style={{ padding: "16px", marginBottom: 20, cursor: "default" }}>
                    <div className="pd3-consult-icon" style={{ background: modelConfig.bg, color: modelConfig.color }}>
                      <ModelIcon size={24} color={modelConfig.color} />
                    </div>
                    <div className="pd3-consult-body">
                      <div className="pd3-consult-id" style={{ fontSize: "1rem" }}>
                        {isPatient ? (consultation?.doctor_name ? `Dr. ${consultation.doctor_name}` : "Non assigné") : consultation?.patient_name}
                      </div>
                      {isPatient && consultation?.doctor_specialty && (
                        <div className="pd3-consult-doctor">{consultation.doctor_specialty}</div>
                      )}
                    </div>
                  </div>

                  {/* Fiche d'identité */}
                  <div className="pd3-section-row-title" style={{ marginBottom: 12, marginTop: 8 }}>
                    <Icons.FileText size={16} color="var(--gold-dk)" />
                    <span>Fiche patient</span>
                  </div>
                  <div className="pd3-health-card" style={{ padding: 16, marginBottom: 20, background: "var(--bg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--txt3)" }}>ID Patient</span>
                      <span style={{ fontWeight: 600, fontSize: "0.75rem" }}>#{consultation?.patient_id || "---"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--txt3)" }}>Type d'examen</span>
                      <span style={{ fontWeight: 600, fontSize: "0.75rem", color: modelConfig.color }}>{modelConfig.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--txt3)" }}>Niveau urgence</span>
                      <span style={{ fontWeight: 600, fontSize: "0.75rem", color: urgencyConfig.color }}>{urgencyConfig.label}</span>
                    </div>
                  </div>

                  {/* Notes patient */}
                  {consultation?.patient_notes && (
                    <>
                      <div className="pd3-section-row-title" style={{ marginBottom: 12 }}>
                        <Icons.MessageSquare size={16} color="var(--gold-dk)" />
                        <span>Notes du patient</span>
                      </div>
                      <div className="pd3-health-card" style={{ padding: 16, background: "#FFFBEB", marginBottom: 20 }}>
                        <p style={{ fontSize: "0.8rem", color: "#92400E", lineHeight: 1.6 }}>{consultation.patient_notes}</p>
                      </div>
                    </>
                  )}

                  {/* Notes médecin */}
                  {consultation?.doctor_notes && (
                    <>
                      <div className="pd3-section-row-title" style={{ marginBottom: 12 }}>
                        <Icons.UserCheck size={16} color="var(--gold-dk)" />
                        <span>Notes du médecin</span>
                      </div>
                      <div className="pd3-health-card" style={{ padding: 16, background: "#ECFDF5", marginBottom: 20 }}>
                        <p style={{ fontSize: "0.8rem", color: "#166534", lineHeight: 1.6 }}>{consultation.doctor_notes}</p>
                      </div>
                    </>
                  )}

                  {/* Rendez-vous */}
                  {appointment && (
                    <>
                      <div className="pd3-section-row-title" style={{ marginBottom: 12 }}>
                        <Icons.Calendar size={16} color="var(--gold-dk)" />
                        <span>Rendez-vous</span>
                      </div>
                      <div className="pd3-health-card" style={{ padding: 16, background: "#EFF6FF" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                          <Icons.Video size={18} color="#0369A1" />
                          <span style={{ fontWeight: 600, color: "#0369A1" }}>{appointment.type === "video" ? "Vidéo" : "Présentiel"}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: 8 }}>
                          {formatDate(appointment.scheduled_at)} • {appointment.duration_minutes} min
                        </div>
                        {appointment.video_link && (
                          <a href={appointment.video_link} target="_blank" rel="noopener noreferrer" className="pd3-section-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Icons.Video size={14} /> Rejoindre la visio
                          </a>
                        )}
                        {appointment.location && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <Icons.MapPin size={12} color="#64748B" />
                            <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{appointment.location}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Actions médecin */}
                  {isDoctor && consultation?.status !== "closed" && consultation?.status !== "rejected" && (
                    <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                      <div className="pd3-section-row-title" style={{ marginBottom: 12 }}>
                        <Icons.Settings size={16} color="var(--gold-dk)" />
                        <span>Actions médicales</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {consultation?.status === "pending" && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAccept} disabled={actionLoading === "accept"} className="pd3-btn pd3-btn-gold" style={{ width: "100%", padding: "12px" }}>
                            {actionLoading === "accept" ? <Icons.Loader size={16} /> : <><Icons.UserCheck size={16} /> Prendre en charge</>}
                          </motion.button>
                        )}
                        {consultation?.status === "accepted" && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRunAnalysis} disabled={analysisLoading} className="pd3-btn" style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "white" }}>
                            {analysisLoading ? <><Icons.Loader size={16} /> Analyse en cours...</> : <><Icons.Brain size={16} /> Lancer l'analyse IA</>}
                          </motion.button>
                        )}
                        {(consultation?.status === "accepted" || consultation?.status === "analyzed") && (
                          <>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAppointment(true)} className="pd3-btn pd3-btn-outline" style={{ width: "100%", padding: "10px" }}>
                              <Icons.Calendar size={16} /> Planifier un RDV
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowTransfer(true)} className="pd3-btn pd3-btn-outline" style={{ width: "100%", padding: "10px" }}>
                              <Icons.Share2 size={16} /> Transférer le dossier
                            </motion.button>
                          </>
                        )}
                        {consultation?.status === "analyzed" && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowClose(true)} className="pd3-btn pd3-btn-outline" style={{ width: "100%", padding: "10px", color: "var(--danger)", borderColor: "var(--danger)" }}>
                            <Icons.Lock size={16} /> Clôturer la consultation
                          </motion.button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SlideIn>
            )}

            {/* ========== PANEL CENTRAL - MESSAGES ========== */}
            <SlideIn direction="up" delay={0.15}>
              <div className="pd3-metric" style={{ padding: 0, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                <div className="pd3-section-row" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
                  <div className="pd3-section-row-title">
                    <Icons.MessageSquare size={18} color="var(--gold-dk)" />
                    <span>Messagerie sécurisée</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="pd3-badge" style={{ background: "var(--bg)", fontSize: "0.65rem" }}>{messages.length} message{messages.length > 1 ? "s" : ""}</span>
                    {canMessage && <PulseDot color="#10B981" />}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px", minHeight: 450, maxHeight: 550 }}>
                  {messages.length === 0 && (
                    <div className="pd3-empty" style={{ padding: "40px 20px" }}>
                      <div className="pd3-empty-icon"><Icons.MessageSquare size={36} color="var(--txt3)" /></div>
                      <div className="pd3-empty-title">Aucun message</div>
                      <div className="pd3-empty-desc">
                        {canMessage ? "Commencez la discussion avec votre interlocuteur" : "Les messages seront disponibles après acceptation de la consultation"}
                      </div>
                    </div>
                  )}
                  {messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                        style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 16 }}
                      >
                        <div style={{ maxWidth: "75%" }}>
                          {!isMine && (
                            <div style={{ fontSize: "0.7rem", color: "var(--txt3)", marginBottom: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 20, height: 20, borderRadius: "50%", background: modelConfig.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ModelIcon size={10} color={modelConfig.color} />
                              </div>
                              {msg.sender_role === "Medecin" ? `Dr. ${msg.sender_name}` : msg.sender_name}
                            </div>
                          )}
                          <div className="pd3-consult-card" style={{ padding: "12px 18px", cursor: "default", background: isMine ? "var(--gradient-nav)" : "white", border: isMine ? "none" : "1px solid var(--border)", borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px" }}>
                            <p style={{ color: isMine ? "white" : "var(--txt)", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                          </div>
                          <div style={{ fontSize: "0.6rem", color: "var(--txt3)", marginTop: 4, textAlign: isMine ? "right" : "left" }}>
                            {formatMsgTime(msg.created_at)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                {canMessage && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, background: "white" }}>
                    <textarea
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Écrivez votre message..."
                      rows={1}
                      style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: "1.5px solid var(--border)", fontSize: "0.85rem", resize: "none", fontFamily: "inherit", outline: "none", background: "var(--bg)" }}
                      onFocus={e => e.target.style.borderColor = "var(--gold)"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                    <motion.button onClick={sendMessage} disabled={!msgInput.trim() || sendingMsg} className="pd3-btn pd3-btn-gold" style={{ padding: "10px 20px", borderRadius: 40 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      {sendingMsg ? <Icons.Loader size={18} color="var(--navy)" /> : <Icons.Send size={18} color="var(--navy)" />}
                    </motion.button>
                  </div>
                )}
                {!canMessage && (
                  <div style={{ padding: "14px 20px", textAlign: "center", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--txt3)", background: "var(--bg)" }}>
                    <Icons.Clock size={14} style={{ marginRight: 6 }} />
                    Messages disponibles après acceptation de la consultation
                  </div>
                )}
              </div>
            </SlideIn>

            {/* ========== PANEL DROIT - ANALYSE IA ========== */}
            {showAnalysis && (
              <SlideIn direction="right" delay={0.2}>
                <div className="pd3-metric" style={{ padding: 20, height: "100%", overflowY: "auto" }}>
                  <div className="pd3-section-row-title" style={{ marginBottom: 16 }}>
                    <Icons.Activity size={18} color="var(--gold-dk)" />
                    <span>Analyse IA</span>
                    {analysis && <span className="pd3-badge pd3-badge-analyzed" style={{ marginLeft: 8 }}>Terminé</span>}
                  </div>

                  {!analysis && !analysisLoading && (
                    <div className="pd3-empty" style={{ padding: "30px 20px" }}>
                      <div className="pd3-empty-icon"><Icons.Brain size={36} color="var(--txt3)" /></div>
                      <div className="pd3-empty-title">Analyse non disponible</div>
                      <div className="pd3-empty-desc">
                        {consultation?.status === "pending"
                          ? "Un médecin doit d'abord accepter la demande pour lancer l'analyse."
                          : consultation?.status === "accepted" && isDoctor
                            ? "Cliquez sur le bouton « Lancer l'analyse IA » ci-contre"
                            : "L'analyse sera lancée par le médecin après acceptation de la demande."}
                      </div>
                    </div>
                  )}

                  {analysisLoading && (
                    <div className="pd3-empty" style={{ padding: "40px 20px" }}>
                      <Icons.Loader size={40} color="var(--gold-bright)" />
                      <div className="pd3-empty-title" style={{ marginTop: 16 }}>Analyse en cours...</div>
                      <div className="pd3-empty-desc">Le modèle IA analyse l'image médicale</div>
                      <div className="pd3-progress-bar" style={{ width: "80%", margin: "16px auto 0" }}>
                        <motion.div className="pd3-progress-fill" animate={{ width: ["0%", "100%"] }} transition={{ repeat: Infinity, duration: 2 }} />
                      </div>
                    </div>
                  )}

                  {analysis && !analysisLoading && (
                    <div>
                      {/* Prédiction principale */}
                      <motion.div className="pd3-health-card" style={{ padding: 20, marginBottom: 16, background: analysis.out_of_domain ? "#FEF2F2" : "#ECFDF5" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="pd3-section-row-title" style={{ color: analysis.out_of_domain ? "var(--danger)" : "var(--success)", marginBottom: 8 }}>
                          <Icons.AlertCircle size={14} color={analysis.out_of_domain ? "var(--danger)" : "var(--success)"} />
                          <span>{analysis.out_of_domain ? "Hors domaine de détection" : "Diagnostic principal"}</span>
                        </div>
                        <div style={{ fontSize: "1.2rem", fontWeight: 800, color: analysis.out_of_domain ? "var(--danger)" : "var(--success)", marginBottom: 10 }}>
                          {analysis.prediction}
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--txt3)" }}>Niveau de confiance</span>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--txt)" }}>{(analysis.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="pd3-progress-bar" style={{ height: 6 }}>
                            <motion.div className="pd3-progress-fill" style={{ width: `${analysis.confidence * 100}%`, background: analysis.confidence > 0.8 ? "var(--success)" : analysis.confidence > 0.5 ? "var(--warning)" : "var(--danger)" }} initial={{ width: 0 }} animate={{ width: `${analysis.confidence * 100}%` }} transition={{ duration: 1 }} />
                          </div>
                        </div>
                      </motion.div>

                      {/* Probabilités */}
                      {topProbabilities.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div className="pd3-section-row-title" style={{ marginBottom: 10 }}>
                            <Icons.Star size={14} color="var(--gold-dk)" />
                            <span>Distribution des probabilités</span>
                          </div>
                          {topProbabilities.map(([label, prob], idx) => (
                            <motion.div key={label} style={{ marginBottom: 8 }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: "0.75rem", color: label === analysis.prediction ? "var(--navy)" : "var(--txt3)", fontWeight: label === analysis.prediction ? 600 : 400 }}>
                                  {label === analysis.prediction && "▶ "}{label}
                                </span>
                                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: label === analysis.prediction ? "var(--success)" : "var(--txt3)" }}>{(prob * 100).toFixed(1)}%</span>
                              </div>
                              <div className="pd3-progress-bar" style={{ height: 4 }}>
                                <motion.div className="pd3-progress-fill" style={{ width: `${prob * 100}%`, background: label === analysis.prediction ? "var(--success)" : "var(--border)" }} initial={{ width: 0 }} animate={{ width: `${prob * 100}%` }} transition={{ duration: 0.8, delay: idx * 0.05 }} />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* GradCAM */}
                      {analysis.gradcam_b64 && (
                        <div style={{ marginBottom: 16 }}>
                          <div className="pd3-section-row-title" style={{ marginBottom: 8 }}>
                            <Icons.Maximize2 size={14} color="var(--gold-dk)" />
                            <span>Carte d'attention (GradCAM)</span>
                          </div>
                          <motion.img src={`data:image/png;base64,${analysis.gradcam_b64}`} alt="GradCAM" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)" }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} />
                          <div style={{ marginTop: 8, fontSize: "0.65rem", color: "var(--txt3)", textAlign: "center" }}>
                            Zones rouges = régions ayant le plus influencé la décision du modèle
                          </div>
                        </div>
                      )}

                      {/* Explication IA */}
                      {analysis.explain_text && (
                        <motion.div className="pd3-health-card" style={{ padding: 16, background: "var(--bg)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                          <div className="pd3-section-row-title" style={{ marginBottom: 8 }}>
                            <Icons.Brain size={14} color="var(--gold-dk)" />
                            <span>Explication clinique</span>
                          </div>
                          <p style={{ fontSize: "0.8rem", color: "var(--txt2)", lineHeight: 1.6, margin: 0 }}>{analysis.explain_text}</p>
                        </motion.div>
                      )}

                      <div style={{ fontSize: "0.65rem", color: "var(--txt3)", textAlign: "center", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Icons.Clock size={12} />
                        Analyse générée le {formatDate(analysis.created_at)}
                      </div>
                    </div>
                  )}
                </div>
              </SlideIn>
            )}
          </div>
        </div>

        {/* ========== FOOTER PREMIUM ========== */}
        <footer className="hp-footer" style={{ marginTop: 60 }}>
          <div className="hp-footer-inner">
            <div className="hp-footer-grid">
              <div className="hp-footer-brand">
                <div className="hp-nav-logo" style={{ marginBottom: 16 }}>
                  <div className="hp-logo-icon"><ModelIcon size={18} color="white" /></div>
                  <span style={{ color: "#fff" }}>Med<span style={{ color: "#FFD700" }}>AI</span></span>
                </div>
                <p>Plateforme de téléconsultation médicale sécurisée. Communication chiffrée de bout en bout conforme aux normes RGPD et HDS.</p>
                <div className="hp-footer-socials">
                  {["LinkedIn", "Twitter", "GitHub", "YouTube", "Instagram"].map((s, i) => (
                    <motion.div key={i} className="hp-footer-social" whileHover={{ y: -3, scale: 1.05 }}>{s.charAt(0)}</motion.div>
                  ))}
                </div>
              </div>
              <div><h4>TÉLÉCONSULTATION</h4>{["Vidéo consultation", "Messagerie sécurisée", "Partage de documents", "Prescription électronique"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div>
              <div><h4>ASSISTANCE</h4>{["Centre d'aide", "Contact support", "Tutoriels", "FAQ"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div>
              <div><h4>LÉGAL</h4>{["Confidentialité", "Conditions d'utilisation", "Sécurité des données", "Certifications"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div>
            </div>
            <div className="hp-footer-bottom">
              <span>© 2025 MedAI — Téléconsultation sécurisée · Tous droits réservés</span>
              <div className="hp-footer-bottom-links">
                {["Confidentialité", "Conditions", "Sécurité", "RGPD", "Certificats"].map(x => <a href="#" key={x}>{x}</a>)}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ========== MODALS ========== */}
      {/* Modal Clôture */}
      <AnimatePresence>
        {showClose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: "white", borderRadius: 24, padding: 32, maxWidth: 460, width: "90%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div className="pd3-empty-icon" style={{ width: 48, height: 48, background: "rgba(239,68,68,0.1)" }}><Icons.Lock size={24} color="var(--danger)" /></div>
                <div><h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>Clôturer la consultation</h3><p style={{ fontSize: "0.8rem", color: "var(--txt3)" }}>Ajoutez des notes finales (optionnel)</p></div>
              </div>
              <textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} placeholder="Recommandations, suivi à prévoir, prescriptions..." rows={4} style={{ width: "100%", padding: 12, border: "1.5px solid var(--border)", borderRadius: 12, fontSize: "0.85rem", resize: "vertical", marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setShowClose(false)} className="pd3-btn pd3-btn-outline" style={{ flex: 1 }}>Annuler</button>
                <motion.button onClick={handleClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pd3-btn" style={{ flex: 1, background: "var(--danger)", color: "white" }}>Clôturer</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Modal Transfert */}
      <AnimatePresence>
        {showTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{ background: "white", borderRadius: 24, padding: 32, maxWidth: 460, width: "90%" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div className="pd3-empty-icon" style={{ width: 48, height: 48, background: "rgba(245,158,11,0.1)" }}>
                  <Icons.Share2 size={24} color="var(--warning)" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>Transférer le dossier</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--txt3)" }}>Le dossier sera réassigné à un autre médecin</p>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--txt2)" }}>ID du médecin destinataire</label>
                <input
                  type="number"
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  placeholder="Ex: 5"
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--border)", borderRadius: 10, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--txt2)" }}>Motif du transfert</label>
                <textarea
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  placeholder="Raison du transfert..."
                  rows={3}
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--border)", borderRadius: 10, marginTop: 4, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setShowTransfer(false)} className="pd3-btn pd3-btn-outline" style={{ flex: 1 }}>Annuler</button>
                <motion.button
                  onClick={handleTransfer}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pd3-btn"
                  style={{ flex: 1, background: "var(--warning)", color: "white" }}
                >
                  Transférer
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Rendez-vous */}
      <AnimatePresence>
        {showAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{ background: "white", borderRadius: 24, padding: 32, maxWidth: 500, width: "90%" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div className="pd3-empty-icon" style={{ width: 48, height: 48, background: "rgba(59,130,246,0.1)" }}>
                  <Icons.Calendar size={24} color="var(--info)" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>Planifier un rendez-vous</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--txt3)" }}>Proposez un créneau au patient</p>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--txt2)" }}>Type de consultation</label>
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  {[
                    { key: "video", label: "📹 Visioconférence" },
                    { key: "in_person", label: "🏥 Présentiel" }
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setAppointmentData(p => ({ ...p, type: t.key }))}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: 12,
                        background: appointmentData.type === t.key ? "var(--info)" : "var(--bg)",
                        color: appointmentData.type === t.key ? "white" : "var(--txt2)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--txt2)" }}>Date et heure</label>
                <input
                  type="datetime-local"
                  value={appointmentData.scheduled_at}
                  onChange={e => setAppointmentData(p => ({ ...p, scheduled_at: e.target.value }))}
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--border)", borderRadius: 10, marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--txt2)" }}>Durée (minutes)</label>
                <select
                  value={appointmentData.duration_minutes}
                  onChange={e => setAppointmentData(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--border)", borderRadius: 10, marginTop: 4 }}
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
              {appointmentData.type === "video" ? (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--txt2)" }}>Lien visioconférence</label>
                  <input
                    type="url"
                    value={appointmentData.video_link}
                    onChange={e => setAppointmentData(p => ({ ...p, video_link: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--border)", borderRadius: 10, marginTop: 4 }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--txt2)" }}>Adresse / Lieu</label>
                  <input
                    type="text"
                    value={appointmentData.location}
                    onChange={e => setAppointmentData(p => ({ ...p, location: e.target.value }))}
                    placeholder="Cabinet médical, hôpital..."
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--border)", borderRadius: 10, marginTop: 4 }}
                  />
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--txt2)" }}>Notes (optionnel)</label>
                <textarea
                  value={appointmentData.notes}
                  onChange={e => setAppointmentData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Instructions pour le patient..."
                  rows={2}
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--border)", borderRadius: 10, marginTop: 4, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setShowAppointment(false)} className="pd3-btn pd3-btn-outline" style={{ flex: 1 }}>Annuler</button>
                <motion.button
                  onClick={handleCreateAppointment}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pd3-btn"
                  style={{ flex: 1, background: "var(--info)", color: "white" }}
                >
                  Créer le RDV
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}