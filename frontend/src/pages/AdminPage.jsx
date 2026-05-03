// src/pages/AdminPage.jsx - Version Ultra-Complete avec Dashboard Analytics
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import "./HomePage.css";
import chestXrayImage from '../assets/chest-xray.jpg';

// ═══════════════════════════════════════════════════════════════════
// SVG ICONS PROFESSIONNELS
// ═══════════════════════════════════════════════════════════════════

const SvgIcon = ({ children, size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const Icons = {
  // Navigation
  ArrowLeft: (p) => <SvgIcon {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></SvgIcon>,
  ArrowRight: (p) => <SvgIcon {...p}><path d="M5 12h14M12 5l7 7-7 7"/></SvgIcon>,
  ChevronRight: (p) => <SvgIcon {...p}><polyline points="9 18 15 12 9 6"/></SvgIcon>,
  ChevronLeft: (p) => <SvgIcon {...p}><polyline points="15 18 9 12 15 6"/></SvgIcon>,
  ChevronDown: (p) => <SvgIcon {...p}><polyline points="6 9 12 15 18 9"/></SvgIcon>,
  ChevronUp: (p) => <SvgIcon {...p}><polyline points="18 15 12 9 6 15"/></SvgIcon>,
  Menu: (p) => <SvgIcon {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></SvgIcon>,
  Folder: (p) => <SvgIcon {...p}><path d="M21.5 18.5a1.8 1.8 0 0 1-1.8 1.8H4.3a1.8 1.8 0 0 1-1.8-1.8V5.5a1.8 1.8 0 0 1 1.8-1.8h5l2 2.8h7.2a1.8 1.8 0 0 1 1.8 1.8z"/></SvgIcon>,
  // Status
  CheckCircle: (p) => <SvgIcon {...p} strokeWidth={2.5}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></SvgIcon>,
  AlertCircle: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill={p.color}/></SvgIcon>,
  AlertTriangle: (p) => <SvgIcon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></SvgIcon>,
  Clock: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>,
  UserCheck: (p) => <SvgIcon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></SvgIcon>,
  UserX: (p) => <SvgIcon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="21" y2="12"/><line x1="21" y1="8" x2="17" y2="12"/></SvgIcon>,
  User: (p) => <SvgIcon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon>,
  Users: (p) => <SvgIcon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SvgIcon>,
  Shield: (p) => <SvgIcon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></SvgIcon>,
  Activity: (p) => <SvgIcon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></SvgIcon>,
  TrendingUp: (p) => <SvgIcon {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></SvgIcon>,
  TrendingDown: (p) => <SvgIcon {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></SvgIcon>,
  
  // Actions
  Trash2: (p) => <SvgIcon {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></SvgIcon>,
  RefreshCw: (p) => <SvgIcon {...p}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></SvgIcon>,
  Search: (p) => <SvgIcon {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></SvgIcon>,
  Filter: (p) => <SvgIcon {...p}><polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/></SvgIcon>,
  Download: (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></SvgIcon>,
  Upload: (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></SvgIcon>,
  
  // Medical Equipment
  Lungs: (p) => <SvgIcon {...p}><path d="M12 4.5v11M8.5 8c-1.8 0-3.5.8-3.5 3.5s1 6 4 6M15.5 8c1.8 0 3.5.8 3.5 3.5s-1 6-4 6M8.5 8c1.2 0 2.5.8 3.5 2M15.5 8c-1.2 0-2.5.8-3.5 2"/></SvgIcon>,
  Brain: (p) => <SvgIcon {...p}><path d="M12 4a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V14a2 2 0 0 1-4 0v-2.5c-1.2-.7-2-2-2-3.5a4 4 0 0 1 4-4z"/><path d="M12 4v16"/><path d="M8 12.5c-1.2.7-2 2-2 3.5a4 4 0 0 0 8 0c0-1.5-.8-2.8-2-3.5"/></SvgIcon>,
  Scan: (p) => <SvgIcon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/><circle cx="12" cy="12" r="2"/></SvgIcon>,
  Stethoscope: (p) => <SvgIcon {...p}><path d="M4.5 12.5a7.5 7.5 0 1 1 15 0"/><path d="M12 5v10"/><circle cx="12" cy="18" r="3"/></SvgIcon>,
  Heart: (p) => <SvgIcon {...p}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></SvgIcon>,
  Activity: (p) => <SvgIcon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></SvgIcon>,
  
  // UI Elements
  LogOut: (p) => <SvgIcon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></SvgIcon>,
  Settings: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></SvgIcon>,
  
  // Animated spinner
  Loader: (p) => <SvgIcon {...p} className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></SvgIcon>,
};

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

const DOMAIN_CONFIG = {
  chest: { label: "Radiologie Thoracique", icon: <Icons.Lungs size={14} />, color: "#2D5F9E", bg: "rgba(45,95,158,0.1)" },
  brain: { label: "Neurologie", icon: <Icons.Brain size={14} />, color: "#6B4FA0", bg: "rgba(107,79,160,0.1)" },
  lung:  { label: "Cancer Pulmonaire", icon: <Icons.Scan size={14} />, color: "#D62828", bg: "rgba(214,40,40,0.1)" },
  retina: { label: "Ophtalmologie", icon: <Icons.Activity size={14} />, color: "#0E7490", bg: "rgba(14,116,144,0.1)" },
};

const STATUS_CONFIG = {
  pending:  { label: "En attente", icon: Icons.Clock, color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", priority: 1 },
  approved: { label: "Approuvé",   icon: Icons.CheckCircle, color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", priority: 2 },
  rejected: { label: "Refusé",     icon: Icons.AlertCircle, color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", priority: 3 },
};

// ═══════════════════════════════════════════════════════════════════
// COMPOSANTS RÉUTILISABLES
// ═══════════════════════════════════════════════════════════════════

const Reveal = ({ children, delay = 0, direction = "up" }) => {
  const variants = {
    up: { initial: { opacity: 0, y: 35 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -35 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 35 }, animate: { opacity: 1, x: 0 } },
    scale: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
  };
  return (
    <motion.div
      initial={variants[direction].initial}
      whileInView={variants[direction].animate}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const Particles = () => {
  const particles = useMemo(() => Array.from({ length: 45 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`,
    height: `${Math.random() * 3 + 1}px`, duration: `${Math.random() * 14 + 8}s`,
    delay: `${Math.random() * 8}s`, bottom: `-${Math.random() * 40}px`,
    glow: i % 4 === 0
  })), []);
  return (
    <div className="pd3-hero-particles" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="pd3-particle"
          style={{
            left: p.left, width: p.width, height: p.height,
            animationDuration: p.duration, animationDelay: p.delay,
            bottom: p.bottom, boxShadow: p.glow ? '0 0 12px rgba(255,215,0,0.7)' : 'none'
          }}
          animate={{ opacity: [0, 0.6, 0.3, 0] }}
          transition={{ repeat: Infinity, duration: p.duration, delay: p.delay }}
        />
      ))}
    </div>
  );
};

const PulseDot = ({ color = "#10B981" }) => (
  <span style={{ position: "relative", display: "inline-flex" }}>
    <span style={{ display: "flex", width: 8, height: 8, borderRadius: "50%", background: color }} />
    <span style={{ position: "absolute", inset: -4, borderRadius: "50%", background: `${color}40`, animation: "pulse 1.5s infinite" }} />
  </span>
);

const MiniChart = () => {
  const bars = [35, 55, 40, 70, 45, 65, 80, 50, 75, 60, 85, 55, 70, 90, 65, 50, 75, 60, 80, 55];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, marginBottom: 16 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="pd3-chart-bar"
          style={{ height: `${h * 0.6}%`, flex: 1, background: i >= 14 ? "linear-gradient(180deg, var(--gold-bright), rgba(232,184,48,0.4))" : "linear-gradient(180deg, rgba(232,184,48,0.5), rgba(232,184,48,0.1))", borderRadius: "4px 4px 0 0" }}
          initial={{ height: 0 }}
          animate={{ height: `${h * 0.6}%` }}
          transition={{ delay: 0.6 + i * 0.02, duration: 0.5 }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export default function AdminPage() {
  const { isAdmin, getAllUsers, approveUser, rejectUser, deleteUser, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [activeDashboardTab, setActiveDashboardTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -50]);
  const sY = useSpring(heroY, { stiffness: 80, damping: 25 });

  // Statistiques simulées (à remplacer par données réelles de l'API)
  const analyticsData = {
    criticalAlerts: 3,
    urgentCases: 7,
    totalConsultations: 124,
    monthlyGrowth: 18,
    averageResponseTime: 2.4,
    satisfactionRate: 98.5,
    pendingReviews: 12,
    completedAnalyses: 89,
    activeDoctors: 8,
    activePatients: 156,
  };

  const recentActivities = [
    { id: 1, type: "new_user", user: "Dr. Karim Benali", action: "a demandé un accès", time: "Il y a 5 min", status: "pending", icon: Icons.User, color: "#3B82F6" },
    { id: 2, type: "analysis", user: "Patient Ahmed", action: "a soumis une radiographie", time: "Il y a 12 min", status: "completed", icon: Icons.Scan, color: "#10B981" },
    { id: 3, type: "urgent", user: "Patient Fatima", action: "Nouveau cas critique", time: "Il y a 23 min", urgency: "critical", icon: Icons.AlertTriangle, color: "#EF4444" },
    { id: 4, type: "approval", user: "Dr. Nadia Seddik", action: "a été approuvé", time: "Il y a 1 heure", status: "approved", icon: Icons.UserCheck, color: "#059669" },
    { id: 5, type: "analysis", user: "Patient Mohamed", action: "analyse terminée", time: "Il y a 2 heures", status: "completed", icon: Icons.Activity, color: "#8B5CF6" },
  ];

  const urgentCasesList = [
    { id: 1, patient: "Fatima Ben Ali", condition: "Pneumothorax suspect", doctor: "Dr. Sophie Martin", time: "23 min", severity: "critical", consultationId: 42 },
    { id: 2, patient: "Mohamed Kallel", condition: "Masse pulmonaire", doctor: "Dr. Karim Benali", time: "1 heure", severity: "urgent", consultationId: 38 },
    { id: 3, patient: "Leila Trabelsi", condition: "Cardiomégalie sévère", doctor: "Dr. Samir Ben Salah", time: "2 heures", severity: "urgent", consultationId: 35 },
  ];

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (e) {
      showToast("Erreur : " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [getAllUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = async (fn, label, user) => {
    setLoadingId(user.id);
    try {
      await fn(user.id);
      showToast(label.replace("{name}", user.full_name || user.username));
      await loadUsers();
    } catch (e) {
      showToast("Erreur : " + e.message, "error");
    } finally {
      setLoadingId(null);
    }
  };

  const onApprove = (user) => handleAction(approveUser, "✅ {name} a été approuvé", user);
  const onReject = (user) => handleAction(rejectUser, "❌ {name} a été refusé", user);
  const onDelete = (user) => {
    if (window.confirm(`Supprimer définitivement ${user.full_name || user.username} ? Cette action est irréversible.`)) {
      handleAction(deleteUser, "🗑️ {name} a été supprimé", user);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter !== "all" && u.status !== filter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return u.full_name?.toLowerCase().includes(term) ||
             u.username?.toLowerCase().includes(term) ||
             u.specialty?.toLowerCase().includes(term);
    }
    return true;
  });

  const counts = {
    all: users.length,
    pending: users.filter(u => u.status === "pending").length,
    approved: users.filter(u => u.status === "approved").length,
    rejected: users.filter(u => u.status === "rejected").length,
  };

  const dashboardTabs = [
    { id: "overview", label: "Vue d'ensemble", icon: <Icons.Activity size={16} /> },
    { id: "urgent", label: "Cas urgents", icon: <Icons.AlertTriangle size={16} />, badge: analyticsData.criticalAlerts + analyticsData.urgentCases },
    { id: "history", label: "Historique", icon: <Icons.Clock size={16} /> },
    { id: "users", label: "Utilisateurs", icon: <Icons.Users size={16} />, badge: counts.pending },
  ];

  if (!isAdmin) return null;

  return (
    <div className="hp" style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflowX: "hidden" }}>
      
      {/* ========== STYLES GLOBAUX ========== */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .pd3-chart-bar {
          transition: height 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .pd3-chart-bar:hover {
          background: linear-gradient(180deg, var(--gold-bright), rgba(232,184,48,0.6)) !important;
          transform: scaleX(1.05);
          box-shadow: 0 0 8px rgba(232,184,48,0.5);
        }
      `}</style>

      {/* ========== NAVIGATION PREMIUM ========== */}
      <motion.nav className={`hp-nav ${isScrolled ? "scrolled" : ""}`} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5, type: "spring", stiffness: 100 }}>
        <div className="hp-nav-logo" onClick={() => navigate("/")}>
          <div className="hp-logo-icon">
            <Icons.Lungs size={20} color="white" />
          </div>
          <span>Med<span className="accent">AI</span></span>
        </div>
        <div className="hp-nav-links">
          <button className="hp-nav-link active" style={{ background: "none", border: "none", cursor: "pointer" }}>Administration</button>
          <button className="hp-nav-link" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => navigate("/")}>Accueil</button>
        </div>
        <div className="hp-nav-actions">
          <div ref={profileMenuRef} style={{ position: "relative" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="hp-btn hp-btn-outline hp-btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #2D5F9E, #6B4FA0)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                A
              </div>
              <span>Administrateur</span>
              <Icons.ChevronDown size={14} />
            </motion.button>
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "white", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: "1px solid #E2E8F0", minWidth: 200, overflow: "hidden", zIndex: 100 }}
                >
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ fontWeight: 700, color: "#0A2647" }}>Administrateur</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>Accès complet à la plateforme</div>
                  </div>
                  <button onClick={() => { logout(); navigate("/"); }} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#DC2626", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <Icons.LogOut size={14} /> Se déconnecter
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {/* ========== HERO SECTION PREMIUM ========== */}
      <motion.section className="pd3-hero" style={{ y: sY, minHeight: "40vh", position: "relative" }}>
        <div className="pd3-hero-grid" />
        <div className="pd3-hero-orb pd3-hero-orb-1" />
        <div className="pd3-hero-orb pd3-hero-orb-2" />
        <div className="pd3-hero-orb pd3-hero-orb-3" />
        <div className="pd3-hero-ring pd3-hero-ring-1" />
        <div className="pd3-hero-ring pd3-hero-ring-2" />
        <div className="pd3-hero-ring pd3-hero-ring-3" />
        <Particles />

        <div className="pd3-hero-content" style={{ padding: "80px 64px 60px" }}>
          <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="pd3-hero-status" style={{ justifyContent: "center" }}>
                <PulseDot color="var(--gold-bright)" />
                <span>PANEL ADMINISTRATEUR</span>
                <span className="pd3-status-sep" />
                <span>ANALYSE EN TEMPS RÉEL</span>
              </div>
            </motion.div>
            <motion.h1 className="pd3-hero-welcome" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              Administration <span className="highlight">MedAI</span>
            </motion.h1>
            <motion.p className="pd3-hero-subtitle" style={{ margin: "0 auto", fontSize: "1rem" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              Gérez les comptes, suivez les analyses et supervisez les cas critiques en temps réel
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* ========== CONTENU PRINCIPAL ========== */}
      <div className="pd3-body" style={{ padding: "32px 0 0 0" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px" }}>
          
          {/* ========== STATS CARDS PREMIUM ========== */}
          <Reveal delay={0.1}>
            <div className="pd3-metrics-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
              <motion.div className="pd3-metric" whileHover={{ y: -6 }}>
                <div className="pd3-metric-icon" style={{ background: "rgba(212,165,0,0.08)", color: "#D4A500" }}><Icons.Folder size={24} /></div>
                <div className="pd3-metric-value" style={{ color: "#D4A500" }}>{analyticsData.totalConsultations}</div>
                <div className="pd3-metric-label">Dossiers totaux</div>
                <div className="pd3-metric-trend up">↑ {analyticsData.monthlyGrowth}% ce mois</div>
              </motion.div>
              <motion.div className="pd3-metric" whileHover={{ y: -6 }}>
                <div className="pd3-metric-icon" style={{ background: "rgba(16,185,129,0.08)", color: "#10B981" }}><Icons.Scan size={24} /></div>
                <div className="pd3-metric-value" style={{ color: "#10B981" }}>{analyticsData.completedAnalyses}</div>
                <div className="pd3-metric-label">Analysés</div>
                <div className="pd3-metric-trend up">↑ 8%</div>
              </motion.div>
              <motion.div className="pd3-metric" whileHover={{ y: -6 }}>
                <div className="pd3-metric-icon" style={{ background: "rgba(59,130,246,0.08)", color: "#3B82F6" }}><Icons.Clock size={24} /></div>
                <div className="pd3-metric-value" style={{ color: "#3B82F6" }}>{analyticsData.pendingReviews}</div>
                <div className="pd3-metric-label">En cours / Attente</div>
                <div className="pd3-metric-trend neutral">→ Stable</div>
              </motion.div>
              <motion.div className="pd3-metric" whileHover={{ y: -6 }} onClick={() => setActiveDashboardTab("urgent")} style={{ cursor: "pointer" }}>
                <div className="pd3-metric-icon" style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}><Icons.AlertTriangle size={24} /></div>
                <div className="pd3-metric-value" style={{ color: "#EF4444" }}>{analyticsData.criticalAlerts + analyticsData.urgentCases}</div>
                <div className="pd3-metric-label">Cas critiques / urgents</div>
                <div className="pd3-metric-trend down">↓ 2%</div>
              </motion.div>
            </div>
          </Reveal>

          {/* ========== ANALYSE EN TEMPS RÉEL - CARD PREMIUM ========== */}
          <Reveal delay={0.15}>
            <div className="pd3-hero-card" style={{ marginBottom: 32, background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
              <div className="pd3-hero-card-header">
                <span className="pd3-card-title">ANALYSE EN TEMPS RÉEL</span>
                <span className="pd3-card-badge"><span className="pd3-status-pulse" /> IA Active</span>
              </div>
              <MiniChart />
              <div className="pd3-mini-stats">
                <motion.div className="pd3-mini-stat" whileHover={{ y: -2 }}>
                  <div className="pd3-mini-stat-value">{analyticsData.totalConsultations}</div>
                  <div className="pd3-mini-stat-label">Dossiers</div>
                </motion.div>
                <motion.div className="pd3-mini-stat" whileHover={{ y: -2 }}>
                  <div className="pd3-mini-stat-value">{analyticsData.completedAnalyses}</div>
                  <div className="pd3-mini-stat-label">Analysés</div>
                </motion.div>
                <motion.div className="pd3-mini-stat" whileHover={{ y: -2 }}>
                  <div className="pd3-mini-stat-value">{analyticsData.pendingReviews}</div>
                  <div className="pd3-mini-stat-label">En cours</div>
                </motion.div>
              </div>
              <div className="pd3-progress-section">
                <div className="pd3-progress-header"><span className="pd3-progress-label">Complétude du profil</span><span className="pd3-progress-value">85%</span></div>
                <div className="pd3-progress-bar"><motion.div className="pd3-progress-fill" initial={{ width: 0 }} animate={{ width: "85%" }} transition={{ delay: 1.2, duration: 1 }} /></div>
              </div>
              <div className="pd3-live-indicator">
                <div className="pd3-live-dot" />
                <span className="pd3-live-text">SYSTÈME OPÉRATIONNEL</span>
                <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>98.5% uptime</span>
              </div>
            </div>
          </Reveal>

          {/* ========== CARTES FLOTTANTES STATS ========== */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
            <motion.div className="pd3-float-card" style={{ position: "relative", background: "white", borderRadius: 20, padding: 20, boxShadow: "var(--shadow-md)" }} whileHover={{ y: -4 }}>
              <div className="pd3-float-card-icon" style={{ background: "rgba(232,184,48,0.12)", width: 50, height: 50, borderRadius: 14 }}><Icons.Brain size={24} color="#FFD700" /></div>
              <div><div className="pd3-float-card-value" style={{ fontSize: "1.3rem", fontWeight: 800 }}>98.5%</div><div className="pd3-float-card-label">Précision</div></div>
            </motion.div>
            <motion.div className="pd3-float-card" style={{ position: "relative", background: "white", borderRadius: 20, padding: 20, boxShadow: "var(--shadow-md)" }} whileHover={{ y: -4 }}>
              <div className="pd3-float-card-icon" style={{ background: "rgba(16,185,129,0.12)", width: 50, height: 50, borderRadius: 14 }}><Icons.Clock size={24} color="#10B981" /></div>
              <div><div className="pd3-float-card-value" style={{ fontSize: "1.3rem", fontWeight: 800 }}>&lt; 24s</div><div className="pd3-float-card-label">Analyse</div></div>
            </motion.div>
            <motion.div className="pd3-float-card" style={{ position: "relative", background: "white", borderRadius: 20, padding: 20, boxShadow: "var(--shadow-md)" }} whileHover={{ y: -4 }}>
              <div className="pd3-float-card-icon" style={{ background: "rgba(139,92,246,0.12)", width: 50, height: 50, borderRadius: 14 }}><Icons.Activity size={24} color="#8B5CF6" /></div>
              <div><div className="pd3-float-card-value" style={{ fontSize: "1.3rem", fontWeight: 800 }}>28+</div><div className="pd3-float-card-label">Pathologies</div></div>
            </motion.div>
          </div>

          {/* ========== TABS DASHBOARD ========== */}
          <Reveal delay={0.2}>
            <div className="pd3-tabs" style={{ marginBottom: 24 }}>
              {dashboardTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDashboardTab(tab.id)}
                  className={`pd3-tab ${activeDashboardTab === tab.id ? "active" : ""}`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge > 0 && (
                    <span style={{
                      marginLeft: 6,
                      padding: "1px 7px",
                      borderRadius: 20,
                      background: activeDashboardTab === tab.id ? "rgba(255,255,255,0.2)" : "#FEE2E2",
                      color: activeDashboardTab === tab.id ? "white" : "#DC2626",
                      fontSize: "0.7rem",
                      fontWeight: 700
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Reveal>

          <AnimatePresence mode="wait">
            {/* ========== TAB: VUE D'ENSEMBLE ========== */}
            {activeDashboardTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <div className="pd3-bottom-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {/* Activités récentes */}
                  <div>
                    <div className="pd3-section-row"><span className="pd3-section-row-title"><Icons.Clock size={16} color="#D4A500" /> Activités récentes</span></div>
                    <div className="pd3-consult-list">
                      {recentActivities.map(act => (
                        <motion.div key={act.id} className="pd3-consult-card" whileHover={{ x: 4 }}>
                          <div className="pd3-consult-icon" style={{ background: `${act.color}15`, color: act.color, width: 44, height: 44 }}>
                            <act.icon size={20} />
                          </div>
                          <div className="pd3-consult-body">
                            <div className="pd3-consult-header">
                              <span className="pd3-consult-id">{act.user}</span>
                              {act.status === "pending" && <span className="pd3-badge pd3-badge-pending">En attente</span>}
                              {act.status === "completed" && <span className="pd3-badge" style={{ background: "#D1FAE5", color: "#059669" }}>Terminé</span>}
                              {act.status === "approved" && <span className="pd3-badge" style={{ background: "#D1FAE5", color: "#059669" }}>Approuvé</span>}
                              {act.urgency === "critical" && <span className="pd3-badge" style={{ background: "#FEE2E2", color: "#DC2626" }}>Critique</span>}
                            </div>
                            <div className="pd3-consult-date">{act.action}</div>
                            <div className="pd3-consult-doctor">{act.time}</div>
                          </div>
                          <Icons.ChevronRight size={18} />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Statistiques avancées */}
                  <div>
                    <div className="pd3-section-row"><span className="pd3-section-row-title"><Icons.Activity size={16} color="#D4A500" /> Métriques clés</span></div>
                    <div className="pd3-health-card" style={{ background: "var(--gradient-nav)", padding: 24 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {[
                          { label: "Temps réponse moyen", value: `${analyticsData.averageResponseTime}s`, trend: "down", change: "-12%" },
                          { label: "Taux satisfaction", value: `${analyticsData.satisfactionRate}%`, trend: "up", change: "+2.3%" },
                          { label: "Médecins actifs", value: analyticsData.activeDoctors, trend: "up", change: "+2" },
                          { label: "Patients actifs", value: analyticsData.activePatients, trend: "up", change: "+18" },
                        ].map((stat, i) => (
                          <motion.div key={i} style={{ padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: 12, textAlign: "center" }} whileHover={{ scale: 1.02 }}>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>{stat.label}</div>
                            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "white" }}>{stat.value}</div>
                            <div style={{ fontSize: "0.7rem", color: stat.trend === "up" ? "#4ADE80" : "#F87171", marginTop: 4 }}>{stat.change}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========== TAB: CAS URGENTS ========== */}
            {activeDashboardTab === "urgent" && (
              <motion.div key="urgent" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><Icons.AlertTriangle size={12} color="#EF4444" /> URGENCES</div>
                  <h2 className="pd3-section-title">Cas <span className="accent">critiques</span> en attente</h2>
                  <p className="pd3-section-sub">{urgentCasesList.length} patient{urgentCasesList.length > 1 ? "s" : ""} nécessitant une attention immédiate</p>
                </div>
                <div className="pd3-consult-list">
                  {urgentCasesList.map((case_, idx) => (
                    <motion.div
                      key={case_.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="pd3-consult-card"
                      style={{ borderLeft: `4px solid ${case_.severity === "critical" ? "#DC2626" : "#F59E0B"}` }}
                      onClick={() => navigate(`/consultation/${case_.consultationId}`)}
                    >
                      <div className="pd3-consult-icon" style={{ background: case_.severity === "critical" ? "#FEE2E2" : "#FFFBEB", color: case_.severity === "critical" ? "#DC2626" : "#F59E0B" }}>
                        <Icons.AlertTriangle size={22} />
                      </div>
                      <div className="pd3-consult-body">
                        <div className="pd3-consult-header">
                          <span className="pd3-consult-id">{case_.patient}</span>
                          <span className="pd3-badge" style={{ background: case_.severity === "critical" ? "#FEE2E2" : "#FFFBEB", color: case_.severity === "critical" ? "#DC2626" : "#F59E0B" }}>
                            {case_.severity === "critical" ? "URGENCE VITALE" : "URGENT"}
                          </span>
                        </div>
                        <div className="pd3-consult-date">{case_.condition}</div>
                        <div className="pd3-consult-doctor">Médecin assigné : {case_.doctor} • {case_.time}</div>
                      </div>
                      <button className="pd3-appt-action" onClick={(e) => { e.stopPropagation(); navigate(`/consultation/${case_.consultationId}`); }}>Intervenir →</button>
                    </motion.div>
                  ))}
                </div>
                {urgentCasesList.length === 0 && (
                  <div className="pd3-empty">
                    <div className="pd3-empty-icon"><Icons.CheckCircle size={36} color="#10B981" /></div>
                    <div className="pd3-empty-title">Aucun cas urgent</div>
                    <div className="pd3-empty-desc">Tous les dossiers ont été traités</div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========== TAB: HISTORIQUE ========== */}
            {activeDashboardTab === "history" && (
              <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><Icons.Clock size={12} /> HISTORIQUE</div>
                  <h2 className="pd3-section-title">Dernières <span className="accent">activités</span></h2>
                  <p className="pd3-section-sub">Suivi des actions récentes sur la plateforme</p>
                </div>
                <div className="pd3-consult-list">
                  {recentActivities.map((act, idx) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="pd3-consult-card"
                      style={{ cursor: "default" }}
                    >
                      <div className="pd3-consult-icon" style={{ background: `${act.color}15`, color: act.color, width: 48, height: 48 }}>
                        <act.icon size={22} />
                      </div>
                      <div className="pd3-consult-body">
                        <div className="pd3-consult-header">
                          <span className="pd3-consult-id">{act.user}</span>
                          <span className="pd3-consult-date">{act.time}</span>
                        </div>
                        <div className="pd3-consult-doctor">{act.action}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ========== TAB: UTILISATEURS ========== */}
            {activeDashboardTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["all", "pending", "approved", "rejected"].map((key) => {
                      const config = STATUS_CONFIG[key];
                      const isActive = filter === key;
                      return (
                        <motion.button
                          key={key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFilter(key)}
                          className="pd3-tab"
                          style={{
                            background: isActive ? "var(--gradient-nav)" : "transparent",
                            color: isActive ? "white" : "var(--txt2)",
                            padding: "8px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          {key === "all" ? "Tous" : (config?.label || key)}
                          {counts[key] > 0 && key !== "all" && (
                            <span style={{ marginLeft: 6, padding: "1px 7px", borderRadius: 20, background: "rgba(255,255,255,0.2)", fontSize: "0.7rem", fontWeight: 600 }}>{counts[key]}</span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div style={{ position: "relative", width: 260 }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--txt3)" }}><Icons.Search size={14} /></span>
                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 38px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: "0.85rem", outline: "none", background: "var(--bg)" }} onFocus={e => e.target.style.borderColor = "var(--gold)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </div>
                </div>

                {loading ? (
                  <div className="pd3-empty" style={{ padding: "60px 20px" }}>
                    <Icons.Loader size={40} color="var(--gold-bright)" />
                    <div className="pd3-empty-title" style={{ marginTop: 16 }}>Chargement des utilisateurs...</div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="pd3-empty">
                    <div className="pd3-empty-icon"><Icons.Users size={36} color="var(--txt3)" /></div>
                    <div className="pd3-empty-title">Aucun utilisateur trouvé</div>
                    <div className="pd3-empty-desc">Aucun utilisateur ne correspond aux critères sélectionnés</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredUsers.map((user, idx) => {
                      const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConfig.icon;
                      const isLoading = loadingId === user.id;
                      const domains = user.domains || [];
                      
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                          className="pd3-consult-card"
                          style={{ cursor: "default", padding: "20px 24px" }}
                        >
                          <div className="pd3-consult-card-accent" style={{ background: statusConfig.color, height: "70%", width: 4 }} />
                          <div className="pd3-consult-icon" style={{ background: `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}cc)`, width: 52, height: 52 }}>
                            <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "white" }}>
                              {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div className="pd3-consult-body">
                            <div className="pd3-consult-header" style={{ flexWrap: "wrap", gap: 8 }}>
                              <span className="pd3-consult-id" style={{ fontSize: "1rem" }}>{user.full_name || user.username}</span>
                              <span className="pd3-badge" style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <StatusIcon size={12} /> {statusConfig.label}
                              </span>
                              {user.is_admin && (
                                <span className="pd3-badge" style={{ background: "#EDE9FE", color: "#6B4FA0", border: "1px solid #DDD6FE" }}><Icons.Shield size={12} /> Administrateur</span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--txt2)", marginBottom: 8 }}>
                              @{user.username} · {user.role || "Médecin"} {user.specialty && `· ${user.specialty}`}
                            </div>
                            {domains.length > 0 && (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {domains.map(domain => {
                                  const cfg = DOMAIN_CONFIG[domain];
                                  return cfg ? (
                                    <span key={domain} className="pd3-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, fontSize: "0.65rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                      {cfg.icon} {cfg.label}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--txt3)", flexShrink: 0 }}>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "—"}
                          </div>
                          {!user.is_admin && (
                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                              {user.status === "pending" && (
                                <>
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onApprove(user)} disabled={isLoading} className="pd3-btn pd3-btn-gold" style={{ padding: "8px 16px", fontSize: "0.75rem" }}>
                                    {isLoading ? <Icons.Loader size={14} /> : <><Icons.UserCheck size={14} /> Approuver</>}
                                  </motion.button>
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onReject(user)} disabled={isLoading} className="pd3-btn pd3-btn-outline" style={{ padding: "8px 16px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "var(--danger)" }}>
                                    {isLoading ? <Icons.Loader size={14} /> : <><Icons.UserX size={14} /> Refuser</>}
                                  </motion.button>
                                </>
                              )}
                              {user.status === "approved" && (
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onReject(user)} disabled={isLoading} className="pd3-btn pd3-btn-outline" style={{ padding: "8px 16px", fontSize: "0.75rem" }}>
                                  {isLoading ? <Icons.Loader size={14} /> : "Révoquer"}
                                </motion.button>
                              )}
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onDelete(user)} disabled={isLoading} className="pd3-btn pd3-btn-outline" style={{ padding: "8px 12px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "var(--danger)" }}>
                                {isLoading ? <Icons.Loader size={14} /> : <Icons.Trash2 size={14} />}
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========== FOOTER PREMIUM ========== */}
        <footer className="hp-footer" style={{ marginTop: 60 }}>
          <div className="hp-footer-inner">
            <div className="hp-footer-grid">
              <div className="hp-footer-brand">
                <div className="hp-nav-logo" style={{ marginBottom: 16 }}><div className="hp-logo-icon"><Icons.Lungs size={18} color="white" /></div><span style={{ color: "#fff" }}>Med<span style={{ color: "#FFD700" }}>AI</span></span></div>
                <p>Plateforme médicale de diagnostic assisté par IA. Administration sécurisée des accès et gestion des professionnels de santé.</p>
                <div className="hp-footer-socials">{["LI", "TW", "GH", "YT", "IN"].map((s, i) => (<div className="hp-footer-social" key={i}>{s}</div>))}</div>
              </div>
              <div><h4>GESTION</h4>{["Utilisateurs", "Médecins", "Patients", "Logs d'accès", "Audit"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div>
              <div><h4>SÉCURITÉ</h4>{["Audit de sécurité", "Certifications", "Conformité RGPD", "Chiffrement", "Sauvegardes"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div>
              <div><h4>RESSOURCES</h4>{["Documentation admin", "Support technique", "Contact", "Statut du service", "API"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div>
            </div>
            <div className="hp-footer-bottom">
              <span>© 2025 MedAI — Administration sécurisée · Tous droits réservés</span>
              <div className="hp-footer-bottom-links">{["Confidentialité", "Conditions d'utilisation", "Sécurité", "RGPD", "Contact"].map(x => <a href="#" key={x}>{x}</a>)}</div>
            </div>
          </div>
        </footer>
      </div>

      {/* ========== TOAST NOTIFICATION ========== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, padding: "12px 20px", borderRadius: 12, fontWeight: 500, background: toast.type === "error" ? "#FEF2F2" : "#DCFCE7", color: toast.type === "error" ? "#DC2626" : "#166534", border: `1px solid ${toast.type === "error" ? "#FECACA" : "#A7F3D0"}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8 }}
          >
            {toast.type === "error" ? <Icons.AlertCircle size={16} /> : <Icons.CheckCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}