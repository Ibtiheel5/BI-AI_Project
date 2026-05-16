// src/pages/AdminPage.jsx - Dashboard Administrateur complet avec API réelles
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import "./HomePage.css";

const API_BASE = "http://localhost:8000/api/v1";

// ========== SVG ICONS ==========
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MessagesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3"/>
    <path d="M12 2v8"/>
    <path d="m8 6 4-4 4 4"/>
    <path d="M2 18h20"/>
  </svg>
);

const ExportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const LogsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const WebhookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10a3 3 0 0 0-3-3h-2a3 3 0 0 0-3 3"/>
    <path d="M18 14a3 3 0 0 0-3 3h-2a3 3 0 0 0-3-3"/>
    <circle cx="12" cy="10" r="2"/>
    <circle cx="12" cy="14" r="2"/>
    <path d="M5 3a2 2 0 0 0-2 2"/>
    <path d="M19 3a2 2 0 0 1 2 2"/>
    <path d="M5 21a2 2 0 0 1-2-2"/>
    <path d="M19 21a2 2 0 0 0 2-2"/>
  </svg>
);

const BackupIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"/>
    <polyline points="7 11 7 7 12 2 17 7 17 11"/>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/>
  </svg>
);

const CheckboxCheckedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CheckboxUncheckedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  </svg>
);

const DoctorIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4"/>
    <path d="M5 20v-2a7 7 0 0 1 14 0v2"/>
    <rect x="9" y="12" width="6" height="6"/>
  </svg>
);

const PatientIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4"/>
    <path d="M5 20v-2a7 7 0 0 1 14 0v2"/>
    <path d="M12 12v6"/>
    <path d="M9 15h6"/>
  </svg>
);

const ConsultationIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <circle cx="12" cy="15" r="1"/>
    <circle cx="16" cy="15" r="1"/>
    <circle cx="8" cy="15" r="1"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const TimeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-8H7v8H5a2 2 0 0 1-2-2z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

// ========== COULEURS POUR GRAPHIQUES ==========
const COLORS = ["#0A2647", "#1B3B6F", "#2563EB", "#3B82F6", "#60A5FA", "#FFD700", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"];

// ========== COMPOSANT PRINCIPAL ==========
export default function AdminPage() {
  const { isAdmin, getAllUsers, getPendingUsers, approveUser, rejectUser, deleteUser, logout } = useAuth();
  const navigate = useNavigate();

  // États principaux
  const [activeTab, setActiveTab] = useState("dashboard");
  const [allUsers, setAllUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // États pour recherche avancée
  const [advancedFilters, setAdvancedFilters] = useState({
    role: "all",
    domain: "all",
    status: "all"
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // États pour bulk actions
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // États pour modals
  const [showSMTPModal, setShowSMTPModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  
  // États pour SMTP
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.gmail.com",
    port: "587",
    user: "",
    password: "",
    from: "",
    useTLS: true
  });
  const [testingSMTP, setTestingSMTP] = useState(false);
  
  // États pour Webhook
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", events: ["all"], active: true });
  const [webhookLoading, setWebhookLoading] = useState(false);
  
  // États pour backup
  const [backupHistory, setBackupHistory] = useState([]);
  const [backupInProgress, setBackupInProgress] = useState(false);

  const token = localStorage.getItem("medai-token");

  // Effet scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Vérification admin
  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  // ========== APPELS API RÉELS ==========

  // Récupérer les logs système
  const fetchSystemLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/logs?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminLogs(data.logs || []);
      } else {
        console.error("Erreur chargement logs:", response.status);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Récupérer les webhooks
  const fetchWebhooks = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/webhooks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error("Erreur chargement webhooks:", error);
    }
  };

  // Créer un webhook
  const createWebhook = async (webhookData) => {
    setWebhookLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/webhooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: webhookData.name,
          url: webhookData.url,
          events: webhookData.events,
          is_active: webhookData.active
        })
      });
      if (response.ok) {
        const data = await response.json();
        showToast(data.message || "Webhook créé avec succès", "success");
        fetchWebhooks();
        setNewWebhook({ name: "", url: "", events: ["all"], active: true });
      } else {
        const error = await response.json();
        showToast(error.detail || "Erreur lors de la création", "error");
      }
    } catch (error) {
      showToast("Erreur réseau", "error");
    } finally {
      setWebhookLoading(false);
    }
  };

  // Supprimer un webhook
  const deleteWebhook = async (id, name) => {
    if (!window.confirm(`Supprimer le webhook "${name}" ?`)) return;
    try {
      const response = await fetch(`${API_BASE}/admin/webhooks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        showToast("Webhook supprimé", "success");
        fetchWebhooks();
      }
    } catch (error) {
      showToast("Erreur", "error");
    }
  };

  // Activer/Désactiver un webhook
  const toggleWebhook = async (id, currentStatus, name) => {
    try {
      const response = await fetch(`${API_BASE}/admin/webhooks/${id}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        showToast(`Webhook ${data.is_active ? "activé" : "désactivé"}`, "success");
        fetchWebhooks();
      }
    } catch (error) {
      showToast("Erreur", "error");
    }
  };

  // Récupérer la configuration SMTP
  const fetchSMTPConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/smtp-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSmtpConfig({
          host: data.host || "smtp.gmail.com",
          port: data.port || 587,
          user: data.user || "",
          password: "",
          from: data.from_email || "",
          useTLS: data.use_tls !== false
        });
      }
    } catch (error) {
      console.error("Erreur chargement SMTP:", error);
    }
  };

  // Sauvegarder la configuration SMTP
  const saveSMTPConfig = async (config) => {
    try {
      const response = await fetch(`${API_BASE}/admin/smtp-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          host: config.host,
          port: parseInt(config.port),
          user: config.user,
          password: config.password,
          from_email: config.from,
          use_tls: config.useTLS
        })
      });
      if (response.ok) {
        showToast("Configuration SMTP sauvegardée", "success");
        setShowSMTPModal(false);
      } else {
        const error = await response.json();
        showToast(error.detail || "Erreur", "error");
      }
    } catch (error) {
      showToast("Erreur réseau", "error");
    }
  };

  // Tester la configuration SMTP
  const testSMTPConfig = async (config) => {
    setTestingSMTP(true);
    try {
      const response = await fetch(`${API_BASE}/admin/test-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          host: config.host,
          port: parseInt(config.port),
          user: config.user,
          password: config.password,
          from_email: config.from,
          use_tls: config.useTLS
        })
      });
      if (response.ok) {
        const data = await response.json();
        showToast(data.message || "Email de test envoyé !", "success");
      } else {
        const error = await response.json();
        showToast(error.detail || "Erreur d'envoi", "error");
      }
    } catch (error) {
      showToast("Erreur réseau", "error");
    } finally {
      setTestingSMTP(false);
    }
  };

  // Générer des logs système simulés (fallback)
  const generateSystemLogs = useCallback(() => {
    const logs = [];
    const actions = ["user.created", "user.approved", "user.rejected", "user.deleted", "consultation.created", "message.sent", "backup.created", "settings.updated"];
    for (let i = 0; i < 20; i++) {
      const date = subDays(new Date(), Math.floor(Math.random() * 30));
      logs.push({
        id: i,
        action: actions[Math.floor(Math.random() * actions.length)],
        user: "admin@medai.com",
        details: `Action effectuée sur la plateforme`,
        ip: "192.168.1." + Math.floor(Math.random() * 255),
        timestamp: date,
        status: Math.random() > 0.9 ? "error" : "success"
      });
    }
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, []);

  // Chargement des données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les utilisateurs
      const [users, pending] = await Promise.all([
        getAllUsers(),
        getPendingUsers()
      ]);
      setAllUsers(users || []);
      setPendingUsers(pending || []);

      // Charger les messages et consultations
      if (token && token !== "local-token") {
        const msgRes = await fetch(`${API_BASE}/contact/admin/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages || []);
        }

        const consultRes = await fetch(`${API_BASE}/consultations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (consultRes.ok) {
          const consultData = await consultRes.json();
          setConsultations(consultData.consultations || []);
        }
        
        // Charger les logs, webhooks et SMTP
        await fetchSystemLogs();
        await fetchWebhooks();
        await fetchSMTPConfig();
      }

      // Notifications
      setNotifications([
        { id: 1, title: "Système prêt", message: "Tous les services sont opérationnels", time: new Date(), read: false, type: "system" },
        { id: 2, title: "Base de données", message: "Connexion établie", time: new Date(), read: false, type: "db" }
      ]);

    } catch (err) {
      console.error("Erreur chargement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAllUsers, getPendingUsers, token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Helper notifications
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Actions utilisateurs
  const handleApprove = async (user) => {
    setActionLoadingId(user.id);
    try {
      await approveUser(user.id);
      showToast(`${user.full_name || user.username} a été approuvé`);
      await loadData();
    } catch (err) {
      showToast("Erreur: " + err.message, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (user) => {
    setActionLoadingId(user.id);
    try {
      await rejectUser(user.id);
      showToast(`${user.full_name || user.username} a été refusé`);
      await loadData();
    } catch (err) {
      showToast("Erreur: " + err.message, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Supprimer définitivement ${user.full_name || user.username} ?`)) return;
    setActionLoadingId(user.id);
    try {
      await deleteUser(user.id);
      showToast(`${user.full_name || user.username} a été supprimé`);
      await loadData();
    } catch (err) {
      showToast("Erreur: " + err.message, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayUsers.map(u => u.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkApprove = async () => {
    const usersToApprove = displayUsers.filter(u => selectedUsers.includes(u.id) && u.status === "pending");
    if (usersToApprove.length === 0) {
      showToast("Aucun utilisateur sélectionné en attente", "error");
      return;
    }
    if (!window.confirm(`Approuver ${usersToApprove.length} utilisateur(s) ?`)) return;
    
    setActionLoadingId("bulk");
    try {
      for (const user of usersToApprove) {
        await approveUser(user.id);
      }
      showToast(`${usersToApprove.length} utilisateur(s) approuvé(s)`);
      await loadData();
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (err) {
      showToast("Erreur: " + err.message, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const usersToDelete = displayUsers.filter(u => selectedUsers.includes(u.id) && !u.is_admin);
    if (usersToDelete.length === 0) {
      showToast("Aucun utilisateur sélectionné ou tentative de suppression d'admin", "error");
      return;
    }
    if (!window.confirm(`Supprimer définitivement ${usersToDelete.length} utilisateur(s) ?`)) return;
    
    setActionLoadingId("bulk");
    try {
      for (const user of usersToDelete) {
        await deleteUser(user.id);
      }
      showToast(`${usersToDelete.length} utilisateur(s) supprimé(s)`);
      await loadData();
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (err) {
      showToast("Erreur: " + err.message, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export CSV
  const exportUsersToCSV = () => {
    const users = displayUsers;
    const headers = ["Nom", "Email", "Username", "Rôle", "Statut", "Spécialité", "Domaines", "Date inscription"];
    const csvData = users.map(u => [
      `"${u.full_name || u.username}"`,
      u.email || "",
      u.username,
      u.role || "Médecin",
      u.status,
      u.specialty || "",
      (u.domains || []).join("; "),
      new Date(u.created_at).toLocaleDateString("fr-FR")
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `utilisateurs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Export CSV effectué");
  };

  // Export JSON
  const exportUsersToJSON = () => {
    const users = displayUsers;
    const data = JSON.stringify(users, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `utilisateurs_${format(new Date(), "yyyy-MM-dd")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Export JSON effectué");
  };

  // Backup DB
  const handleBackup = async (type = "full") => {
    setBackupInProgress(true);
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        type,
        data: {
          users: allUsers,
          consultations: consultations,
          messages: messages
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `medai_backup_${type}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      const newBackup = {
        id: Date.now(),
        date: new Date(),
        size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        type,
        status: "success"
      };
      setBackupHistory(prev => [newBackup, ...prev].slice(0, 20));
      showToast(`Backup ${type} créé avec succès`);
    } catch (err) {
      showToast("Erreur lors du backup", "error");
    } finally {
      setBackupInProgress(false);
    }
  };

  // Actions messages
  const markMessageAsRead = async (messageId) => {
    try {
      await fetch(`${API_BASE}/contact/admin/messages/${messageId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
      showToast("Message marqué comme lu");
    } catch (error) {
      showToast("Erreur", "error");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Supprimer ce message définitivement ?")) return;
    try {
      await fetch(`${API_BASE}/contact/admin/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
      if (selectedMessage?.id === messageId) setSelectedMessage(null);
      showToast("Message supprimé");
    } catch (error) {
      showToast("Erreur", "error");
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // ========== DISPLAY USERS ==========
  const displayUsers = useMemo(() => {
    let usersToShow = [];
    
    if (filter === "pending") usersToShow = pendingUsers;
    else if (filter === "all") usersToShow = allUsers;
    else usersToShow = allUsers.filter(u => u.status === filter);
    
    // Recherche textuelle
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      usersToShow = usersToShow.filter(u =>
        (u.full_name || "").toLowerCase().includes(term) ||
        (u.username || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.specialty || "").toLowerCase().includes(term)
      );
    }
    
    // Filtres avancés
    if (advancedFilters.role !== "all") {
      usersToShow = usersToShow.filter(u => u.role === advancedFilters.role);
    }
    if (advancedFilters.domain !== "all") {
      usersToShow = usersToShow.filter(u => u.domains?.includes(advancedFilters.domain));
    }
    if (advancedFilters.status !== "all") {
      usersToShow = usersToShow.filter(u => u.status === advancedFilters.status);
    }
    
    // Filtrage par date
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      usersToShow = usersToShow.filter(u => new Date(u.created_at) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      usersToShow = usersToShow.filter(u => new Date(u.created_at) <= endDate);
    }
    
    return usersToShow;
  }, [allUsers, pendingUsers, filter, searchTerm, advancedFilters, dateRange]);

  // Sélection automatique/déselection du "Select All"
  useEffect(() => {
    if (selectAll && selectedUsers.length !== displayUsers.length) {
      setSelectAll(false);
    }
  }, [selectedUsers, displayUsers, selectAll]);

  // ========== STATISTIQUES ==========
  const doctors = allUsers.filter(u => u.role === "Medecin" && u.status === "approved");
  const patients = allUsers.filter(u => u.role === "Patient" && u.status === "approved");
  const pendingCount = pendingUsers.length;
  const unreadMessages = messages.filter(m => !m.is_read).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Données pour graphiques
  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayUsers = allUsers.filter(u => new Date(u.created_at).toDateString() === date.toDateString()).length;
      const dayConsultations = consultations.filter(c => new Date(c.created_at).toDateString() === date.toDateString()).length;
      data.push({
        day: format(date, "EEE", { locale: fr }),
        date: format(date, "dd/MM"),
        users: dayUsers,
        consultations: dayConsultations
      });
    }
    return data;
  };

  // Distribution des rôles
  const roleDistribution = [
    { name: "Médecins", value: doctors.length, color: "#2563EB" },
    { name: "Patients", value: patients.length, color: "#10B981" },
    { name: "En attente", value: pendingCount, color: "#F59E0B" },
  ];

  // Distribution des domaines médicaux
  const domainDistribution = () => {
    const domains = { chest: 0, lung: 0, brain: 0, retina: 0 };
    doctors.forEach(doc => {
      if (doc.domains) {
        doc.domains.forEach(domain => { if (domains[domain] !== undefined) domains[domain]++; });
      }
    });
    return Object.entries(domains).map(([key, value]) => ({ 
      name: key === "chest" ? "Thorax" : key === "lung" ? "Poumon" : key === "brain" ? "Cerveau" : "Rétine", 
      value, 
      color: COLORS[Math.floor(Math.random() * COLORS.length)] 
    }));
  };

  // Activité récente combinée
  const recentActivity = useMemo(() => {
    const activities = [
      ...allUsers.slice(0, 10).map(u => ({ type: "user", user: u, date: u.created_at, action: "inscription" })),
      ...messages.slice(0, 5).map(m => ({ type: "message", message: m, date: m.created_at, action: "message" })),
      ...consultations.slice(0, 5).map(c => ({ type: "consult", consultation: c, date: c.created_at, action: "consultation" }))
    ];
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
  }, [allUsers, messages, consultations]);

  const counts = {
    all: allUsers.length,
    pending: pendingCount,
    approved: allUsers.filter(u => u.status === "approved").length,
    rejected: allUsers.filter(u => u.status === "rejected").length,
    doctors: doctors.length,
    patients: patients.length,
    consultations: consultations.length,
    messages: messages.length,
    unreadMessages: unreadMessages,
  };

  if (!isAdmin) return null;

  return (
    <div className="hp" style={{ minHeight: "100vh", background: "#F4F7FC" }}>
      
      {/* Navigation */}
      <motion.nav className={`hp-nav ${isScrolled ? "scrolled" : ""}`} initial={{ y: -80 }} animate={{ y: 0 }}>
        <div className="hp-nav-logo" onClick={() => navigate("/")}>
          <div className="hp-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 4.5v11M8.5 8c-1.8 0-3.5.8-3.5 3.5s1 6 4 6M15.5 8c1.8 0 3.5.8 3.5 3.5s-1 6-4 6M8.5 8c1.2 0 2.5.8 3.5 2M15.5 8c-1.2 0-2.5.8-3.5 2"/>
            </svg>
          </div>
          <span>Med<span className="accent">AI</span></span>
        </div>
        <div className="hp-nav-links">
          <span className={`hp-nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")} style={{ cursor: "pointer" }}><DashboardIcon /> Dashboard</span>
          <span className={`hp-nav-link ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")} style={{ cursor: "pointer" }}><UsersIcon /> Utilisateurs</span>
          <span className={`hp-nav-link ${activeTab === "messages" ? "active" : ""}`} onClick={() => setActiveTab("messages")} style={{ cursor: "pointer" }}><MessagesIcon /> Messages {unreadMessages > 0 && <span className="nav-badge">{unreadMessages}</span>}</span>
          <span className={`hp-nav-link ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")} style={{ cursor: "pointer" }}><LogsIcon /> Logs système</span>
          <span className={`hp-nav-link ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")} style={{ cursor: "pointer" }}><SettingsIcon /> Configuration</span>
          <span className="hp-nav-link" style={{ cursor: "pointer" }} onClick={() => navigate("/")}><HomeIcon /> Accueil</span>
        </div>
        <div className="hp-nav-actions">
          <button className="hp-btn hp-btn-outline hp-btn-sm" onClick={() => { logout(); navigate("/login"); }}>
            <LogoutIcon /> Déconnexion
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hp-hero" style={{ minHeight: "20vh" }}>
        <div className="hp-hero-grid-bg" />
        <div className="hp-hero-glow hp-hero-glow-1" />
        <div className="hp-hero-glow hp-hero-glow-2" />
        <div className="hp-hero-content" style={{ padding: "60px 64px 30px" }}>
          <div style={{ textAlign: "center" }}>
            <div className="hp-badge" style={{ justifyContent: "center" }}>
              <span className="hp-badge-dot" />
              <span>PANEL ADMINISTRATEUR</span>
            </div>
            <h1 style={{ fontSize: "2rem", color: "white" }}>
              Dashboard <span className="gd">MedAI</span>
            </h1>
            <p className="hp-hero-desc" style={{ margin: "0 auto", maxWidth: 600 }}>
              Gérez votre plateforme en temps réel
            </p>
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <div className="hp-body" style={{ maxWidth: 1400, margin: "0 auto", padding: "30px 32px" }}>
        
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {/* ========== DASHBOARD ========== */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="dashboard-stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><UsersIcon /></div>
                <div className="stat-value">{counts.all}</div>
                <div className="stat-label">Total utilisateurs</div>
                <div className="stat-trend up">+{counts.all - 6} ce mois</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><DoctorIcon /></div>
                <div className="stat-value">{counts.doctors}</div>
                <div className="stat-label">Médecins</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><PatientIcon /></div>
                <div className="stat-value">{counts.patients}</div>
                <div className="stat-label">Patients</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><ConsultationIcon /></div>
                <div className="stat-value">{counts.consultations}</div>
                <div className="stat-label">Consultations</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><MessagesIcon /></div>
                <div className="stat-value">{counts.messages}</div>
                <div className="stat-label">Messages</div>
                {unreadMessages > 0 && <div className="stat-trend warning">{unreadMessages} non lus</div>}
              </div>
              <div className="stat-card">
                <div className="stat-icon"><BellIcon /></div>
                <div className="stat-value">{unreadNotifications}</div>
                <div className="stat-label">Notifications</div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Évolution des inscriptions</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={getLast7DaysData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Area type="monotone" dataKey="users" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.2} name="Nouveaux utilisateurs" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Répartition des utilisateurs</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {roleDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Consultations par jour</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={getLast7DaysData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="consultations" fill="#FFD700" radius={[8, 8, 0, 0]} name="Consultations" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Spécialités des médecins</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={domainDistribution()} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {domainDistribution().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="two-columns">
              <div className="activity-card">
                <div className="card-header">
                  <h3>Activité récente</h3>
                  <button onClick={loadData} className="icon-btn"><RefreshIcon /></button>
                </div>
                <div className="activity-list">
                  {recentActivity.slice(0, 8).map((activity, idx) => (
                    <div key={idx} className="activity-item">
                      <div className={`activity-icon ${activity.type}`}>
                        {activity.type === "user" ? <UsersIcon /> : activity.type === "message" ? <MessagesIcon /> : <ConsultationIcon />}
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">
                          {activity.type === "user" ? `${activity.user?.full_name || activity.user?.username} s'est inscrit` :
                           activity.type === "message" ? `Nouveau message de ${activity.message?.name}` :
                           `Nouvelle consultation`}
                        </div>
                        <div className="activity-meta">
                          <CalendarIcon /> {format(new Date(activity.date), "dd/MM/yyyy")}
                          <TimeIcon /> {format(new Date(activity.date), "HH:mm")}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && <div className="empty-state">Aucune activité récente</div>}
                </div>
              </div>

              <div className="activity-card">
                <div className="card-header">
                  <h3>Notifications</h3>
                  <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} className="icon-btn"><CheckIcon /></button>
                </div>
                <div className="notification-list">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`notification-item ${!notif.read ? "unread" : ""}`} onClick={() => markNotificationAsRead(notif.id)}>
                      <div className="notification-dot" />
                      <div className="notification-content">
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">{format(notif.time, "dd/MM/yyyy HH:mm")}</div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && <div className="empty-state">Aucune notification</div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== UTILISATEURS ========== */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="filter-stats-grid">
              <div className="filter-stat" onClick={() => setFilter("all")}>
                <div className="filter-stat-value">{counts.all}</div>
                <div className="filter-stat-label">Total</div>
              </div>
              <div className={`filter-stat ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
                <div className="filter-stat-value" style={{ color: "#F59E0B" }}>{counts.pending}</div>
                <div className="filter-stat-label">En attente</div>
              </div>
              <div className="filter-stat" onClick={() => setFilter("approved")}>
                <div className="filter-stat-value" style={{ color: "#10B981" }}>{counts.approved}</div>
                <div className="filter-stat-label">Approuvés</div>
              </div>
              <div className="filter-stat" onClick={() => setFilter("rejected")}>
                <div className="filter-stat-value" style={{ color: "#EF4444" }}>{counts.rejected}</div>
                <div className="filter-stat-label">Refusés</div>
              </div>
            </div>

            <div className="toolbar">
              <div className="toolbar-left">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button className="btn-filter" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                  <FilterIcon /> Filtres avancés
                </button>
                {selectedUsers.length > 0 && (
                  <div className="bulk-actions">
                    <span>{selectedUsers.length} sélectionné(s)</span>
                    <button onClick={handleBulkApprove} className="btn-bulk-approve">Approuver</button>
                    <button onClick={handleBulkDelete} className="btn-bulk-delete">Supprimer</button>
                  </div>
                )}
              </div>
              <div className="toolbar-right">
                <div className="date-range">
                  <input type="date" placeholder="Début" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                  <span>à</span>
                  <input type="date" placeholder="Fin" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
                <div className="export-dropdown">
                  <button className="btn-export"><ExportIcon /> Exporter</button>
                  <div className="export-menu">
                    <button onClick={exportUsersToCSV}>CSV</button>
                    <button onClick={exportUsersToJSON}>JSON</button>
                  </div>
                </div>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="advanced-filters">
                <select value={advancedFilters.role} onChange={e => setAdvancedFilters(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="all">Tous les rôles</option>
                  <option value="Medecin">Médecins</option>
                  <option value="Patient">Patients</option>
                  <option value="Administrateur">Administrateurs</option>
                </select>
                <select value={advancedFilters.domain} onChange={e => setAdvancedFilters(prev => ({ ...prev, domain: e.target.value }))}>
                  <option value="all">Tous les domaines</option>
                  <option value="chest">Thorax</option>
                  <option value="lung">Poumon</option>
                  <option value="brain">Cerveau</option>
                  <option value="retina">Rétine</option>
                </select>
                <select value={advancedFilters.status} onChange={e => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvé</option>
                  <option value="rejected">Refusé</option>
                </select>
                <button onClick={() => { setAdvancedFilters({ role: "all", domain: "all", status: "all" }); setSearchTerm(""); setDateRange({ start: "", end: "" }); }} className="btn-reset">
                  Réinitialiser
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading-state"><div className="spinner" /><p>Chargement...</p></div>
            ) : displayUsers.length === 0 ? (
              <div className="empty-state-large"><UsersIcon /><div>Aucun utilisateur trouvé</div></div>
            ) : (
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <button onClick={handleSelectAll} className="checkbox-btn">
                          {selectAll ? <CheckboxCheckedIcon /> : <CheckboxUncheckedIcon />}
                        </button>
                      </th>
                      <th>Utilisateur</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Spécialité / Domaines</th>
                      <th>Date inscription</th>
                      <th style={{ width: 180 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayUsers.map((user) => {
                      const isPending = user.status === "pending";
                      const isApproved = user.status === "approved";
                      const isLoading = actionLoadingId === user.id;
                      const isSelected = selectedUsers.includes(user.id);
                      return (
                        <tr key={user.id} className={isPending ? "row-pending" : ""}>
                          <td>
                            {!user.is_admin && (
                              <button onClick={() => handleSelectUser(user.id)} className="checkbox-btn">
                                {isSelected ? <CheckboxCheckedIcon /> : <CheckboxUncheckedIcon />}
                              </button>
                            )}
                          </td>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${isPending ? "#F59E0B" : isApproved ? "#10B981" : "#6B7280"}, ${isPending ? "#D97706" : isApproved ? "#059669" : "#4B5563"})` }}>
                                {user.full_name?.charAt(0) || user.username?.charAt(0) || "U"}
                              </div>
                              <div>
                                <div className="user-name">{user.full_name || user.username}</div>
                                <div className="user-email">{user.email || "Email non renseigné"}</div>
                                <div className="user-username">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="role-badge">{user.role || "Médecin"}</span>
                            {user.is_admin && <span className="admin-badge">Admin</span>}
                          </td>
                          <td>
                            <span className={`status-badge ${user.status}`}>
                              {isPending ? "En attente" : isApproved ? "Approuvé" : "Refusé"}
                            </span>
                            {!user.email_verified && user.status === "pending" && <span className="email-warning">Email non vérifié</span>}
                          </td>
                          <td>
                            <div className="specialty-cell">{user.specialty || "-"}</div>
                            {user.domains?.length > 0 && (
                              <div className="domains-list">
                                {user.domains.map(domain => (
                                  <span key={domain} className="domain-badge">{domain === "chest" ? "Thorax" : domain === "lung" ? "Poumon" : domain === "brain" ? "Cerveau" : "Rétine"}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="date-cell">{user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "-"}</div>
                          </td>
                          <td>
                            {!user.is_admin && (
                              <div className="action-buttons">
                                {isPending && (
                                  <>
                                    <button onClick={() => handleApprove(user)} disabled={isLoading} className="btn-approve">
                                      <CheckIcon /> Approuver
                                    </button>
                                    <button onClick={() => handleReject(user)} disabled={isLoading} className="btn-reject">
                                      <CloseIcon /> Refuser
                                    </button>
                                  </>
                                )}
                                {isApproved && (
                                  <>
                                    <button onClick={() => handleReject(user)} disabled={isLoading} className="btn-revoke">
                                      Révoquer
                                    </button>
                                    <button onClick={() => handleDelete(user)} disabled={isLoading} className="btn-delete">
                                      <TrashIcon />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ========== MESSAGES ========== */}
        {activeTab === "messages" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="messages-header">
              <div><h2><MessagesIcon /> Messages de contact</h2><p>{unreadMessages} message(s) non lu(s)</p></div>
              <button onClick={loadData} className="btn-refresh"><RefreshIcon /> Actualiser</button>
            </div>
            {messages.length === 0 ? (
              <div className="empty-state-large"><MessagesIcon /><div>Aucun message</div></div>
            ) : (
              <div className="messages-list">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-card ${!msg.is_read ? "unread" : ""}`} onClick={() => setSelectedMessage(msg)}>
                    <div className="message-content">
                      <div className="message-header">
                        <div className="message-sender">
                          <span className="sender-name">{msg.name}</span>
                          <span className="sender-email">{msg.email}</span>
                          {!msg.is_read && <span className="unread-badge">Nouveau</span>}
                        </div>
                        <div className="message-actions">
                          {!msg.is_read && (
                            <button onClick={(e) => { e.stopPropagation(); markMessageAsRead(msg.id); }} className="btn-mark-read">
                              <CheckIcon /> Lu
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }} className="btn-delete-message">
                            <TrashIcon /> Supprimer
                          </button>
                        </div>
                      </div>
                      <div className="message-subject">{msg.subject}</div>
                      <div className="message-preview">{msg.message.length > 100 ? msg.message.substring(0, 100) + "..." : msg.message}</div>
                      <div className="message-date">
                        <CalendarIcon /> {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ========== LOGS SYSTÈME ========== */}
        {activeTab === "logs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="logs-header">
              <h2><LogsIcon /> Logs système</h2>
              <button onClick={fetchSystemLogs} className="btn-refresh"><RefreshIcon /> Rafraîchir</button>
            </div>
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Utilisateur</th>
                    <th>Détails</th>
                    <th>IP</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLogs.slice(0, 50).map((log) => (
                    <tr key={log.id} className={`log-row ${log.status}`}>
                      <td>{log.created_at ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss") : "-"}</td>
                      <td><span className="log-action">{log.action}</span></td>
                      <td>{log.user_email || log.user || "-"}</td>
                      <td>{log.details || "-"}</td>
                      <td>{log.ip_address || "-"}</td>
                      <td>
                        <span className={`log-status ${log.status}`}>
                          {log.status === "success" ? "Succès" : "Erreur"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {adminLogs.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: "center", padding: 40 }}>Aucun log système</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ========== CONFIGURATION ========== */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="settings-grid">
              {/* Configuration SMTP */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <MailIcon />
                  <h3>Configuration SMTP</h3>
                </div>
                <p>Configurez l'envoi d'emails pour les notifications</p>
                <button onClick={() => setShowSMTPModal(true)} className="btn-settings">
                  <SettingsIcon /> Configurer SMTP
                </button>
              </div>

              {/* Webhooks */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <WebhookIcon />
                  <h3>Webhooks</h3>
                </div>
                <p>Intégrations avec des services externes</p>
                <button onClick={() => setShowWebhookModal(true)} className="btn-settings">
                  <PlusIcon /> Gérer les webhooks ({webhooks.length})
                </button>
              </div>

              {/* Backup DB */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <BackupIcon />
                  <h3>Sauvegarde</h3>
                </div>
                <p>Exportez vos données</p>
                <button onClick={() => setShowBackupModal(true)} className="btn-settings">
                  <DownloadIcon /> Gérer les backups
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modal Message Detail */}
        {selectedMessage && (
          <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Détail du message</h3>
                <button onClick={() => setSelectedMessage(null)} className="modal-close"><CloseIcon /></button>
              </div>
              <div className="modal-body">
                <div className="info-row"><label>Expéditeur</label><div><strong>{selectedMessage.name}</strong><br />{selectedMessage.email}</div></div>
                <div className="info-row"><label>Sujet</label><div>{selectedMessage.subject}</div></div>
                <div className="info-row"><label>Message</label><div className="message-text">{selectedMessage.message}</div></div>
              </div>
              <div className="modal-footer">
                {!selectedMessage.is_read && <button onClick={() => { markMessageAsRead(selectedMessage.id); setSelectedMessage(null); }} className="btn-approve">Marquer comme lu</button>}
                <button onClick={() => { deleteMessage(selectedMessage.id); setSelectedMessage(null); }} className="btn-delete">Supprimer</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal SMTP */}
        {showSMTPModal && (
          <div className="modal-overlay" onClick={() => setShowSMTPModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Configuration SMTP</h3>
                <button onClick={() => setShowSMTPModal(false)} className="modal-close"><CloseIcon /></button>
              </div>
              <div className="modal-body">
                <div className="form-group"><label>Serveur SMTP</label><input type="text" value={smtpConfig.host} onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value })} /></div>
                <div className="form-group"><label>Port</label><input type="text" value={smtpConfig.port} onChange={e => setSmtpConfig({ ...smtpConfig, port: e.target.value })} /></div>
                <div className="form-group"><label>Utilisateur</label><input type="text" value={smtpConfig.user} onChange={e => setSmtpConfig({ ...smtpConfig, user: e.target.value })} /></div>
                <div className="form-group"><label>Mot de passe</label><input type="password" value={smtpConfig.password} onChange={e => setSmtpConfig({ ...smtpConfig, password: e.target.value })} /></div>
                <div className="form-group"><label>Email expéditeur</label><input type="email" value={smtpConfig.from} onChange={e => setSmtpConfig({ ...smtpConfig, from: e.target.value })} /></div>
                <label className="checkbox-label"><input type="checkbox" checked={smtpConfig.useTLS} onChange={e => setSmtpConfig({ ...smtpConfig, useTLS: e.target.checked })} /> Utiliser TLS</label>
              </div>
              <div className="modal-footer">
                <div style={{ display: "flex", gap: 12, flex: 1 }}>
                  <button onClick={() => testSMTPConfig(smtpConfig)} disabled={testingSMTP} className="btn-test">
                    {testingSMTP ? "Test en cours..." : "Tester"}
                  </button>
                  <button onClick={() => setShowSMTPModal(false)} className="btn-outline">Annuler</button>
                  <button onClick={() => saveSMTPConfig(smtpConfig)} className="btn-approve">Sauvegarder</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Webhook */}
        {showWebhookModal && (
          <div className="modal-overlay" onClick={() => setShowWebhookModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Gestion des webhooks</h3>
                <button onClick={() => setShowWebhookModal(false)} className="modal-close"><CloseIcon /></button>
              </div>
              <div className="modal-body">
                <div className="webhooks-list">
                  {webhooks.length === 0 ? (
                    <div className="empty-state">Aucun webhook configuré</div>
                  ) : (
                    webhooks.map(wh => (
                      <div key={wh.id} className="webhook-item">
                        <div className="webhook-info">
                          <strong>{wh.name}</strong>
                          <span className="webhook-url">{wh.url}</span>
                          <div className="webhook-events">{wh.events?.join(", ") || "all"}</div>
                        </div>
                        <div className="webhook-actions">
                          <button className={`webhook-toggle ${wh.is_active ? "active" : ""}`} onClick={() => toggleWebhook(wh.id, wh.is_active, wh.name)}>
                            {wh.is_active ? "Actif" : "Inactif"}
                          </button>
                          <button className="webhook-delete" onClick={() => deleteWebhook(wh.id, wh.name)}>
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="webhook-add">
                  <h4>Ajouter un webhook</h4>
                  <input type="text" placeholder="Nom" value={newWebhook.name} onChange={e => setNewWebhook({ ...newWebhook, name: e.target.value })} />
                  <input type="text" placeholder="URL" value={newWebhook.url} onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })} />
                  <select value={newWebhook.events[0]} onChange={e => setNewWebhook({ ...newWebhook, events: [e.target.value] })}>
                    <option value="all">Tous les événements</option>
                    <option value="user.created">Création utilisateur</option>
                    <option value="consultation.created">Nouvelle consultation</option>
                  </select>
                  <button onClick={() => createWebhook(newWebhook)} disabled={webhookLoading} className="btn-add">
                    {webhookLoading ? "Création..." : "Ajouter"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Backup */}
        {showBackupModal && (
          <div className="modal-overlay" onClick={() => setShowBackupModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Sauvegarde des données</h3>
                <button onClick={() => setShowBackupModal(false)} className="modal-close"><CloseIcon /></button>
              </div>
              <div className="modal-body">
                <div className="backup-actions">
                  <button onClick={() => handleBackup("full")} disabled={backupInProgress} className="btn-backup">
                    <BackupIcon /> Backup complet
                  </button>
                  <button onClick={() => handleBackup("users")} disabled={backupInProgress} className="btn-backup">
                    <UsersIcon /> Backup utilisateurs
                  </button>
                  <button onClick={() => handleBackup("consultations")} disabled={backupInProgress} className="btn-backup">
                    <ConsultationIcon /> Backup consultations
                  </button>
                </div>
                <div className="backup-history">
                  <h4>Historique des backups</h4>
                  {backupHistory.length === 0 ? (
                    <div className="empty-state">Aucun backup effectué</div>
                  ) : (
                    backupHistory.map(backup => (
                      <div key={backup.id} className="backup-item">
                        <span>{format(backup.date, "dd/MM/yyyy HH:mm")}</span>
                        <span>{backup.type}</span>
                        <span>{backup.size}</span>
                        <span className={`backup-status ${backup.status}`}>{backup.status === "success" ? "Succès" : "Erreur"}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className={`toast ${toast.type}`}>
            {toast.msg}
          </motion.div>
        )}
      </div>

      <style jsx="true">{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .nav-badge {
          background: #EF4444;
          color: white;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 10px;
          margin-left: 5px;
        }
        
        .alert-error {
          padding: 12px 20px;
          background: #FEE2E2;
          border: 1px solid #FECACA;
          border-radius: 12px;
          color: #DC2626;
          margin-bottom: 24px;
        }
        
        .dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          border: 1px solid #E2E8F0;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          color: #0A2647;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #0A2647;
        }
        
        .stat-label {
          font-size: 0.78rem;
          color: #64748B;
          margin-top: 4px;
        }
        
        .stat-trend {
          font-size: 0.68rem;
          font-weight: 600;
          margin-top: 6px;
        }
        
        .stat-trend.up { color: #10B981; }
        .stat-trend.warning { color: #F59E0B; }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        
        .chart-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid #E2E8F0;
        }
        
        .chart-card h3 {
          font-size: 1rem;
          margin-bottom: 20px;
          color: #0A2647;
        }
        
        .two-columns {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        
        .activity-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .card-header h3 {
          font-size: 0.9rem;
          color: #0A2647;
        }
        
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748B;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
        }
        
        .icon-btn:hover { background: #F1F5F9; }
        
        .activity-list { padding: 0 20px; }
        
        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #F1F5F9;
        }
        
        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .activity-icon.user { background: #E0E7FF; color: #2563EB; }
        .activity-icon.message { background: #FEF3C7; color: #F59E0B; }
        .activity-icon.consult { background: #D1FAE5; color: #10B981; }
        
        .activity-content { flex: 1; }
        
        .activity-title {
          font-weight: 500;
          font-size: 0.85rem;
          color: #0A2647;
        }
        
        .activity-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.65rem;
          color: #94A3B8;
          margin-top: 4px;
        }
        
        .notification-list { padding: 0 20px; }
        
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px solid #F1F5F9;
          cursor: pointer;
        }
        
        .notification-item.unread { background: #FEF3C7; margin: 0 -20px; padding: 12px 20px; }
        
        .notification-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #F59E0B;
          margin-top: 6px;
        }
        
        .notification-item.unread .notification-dot { background: #D97706; }
        
        .notification-content { flex: 1; }
        
        .notification-title {
          font-weight: 600;
          font-size: 0.85rem;
          color: #0A2647;
        }
        
        .notification-message {
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 2px;
        }
        
        .notification-time {
          font-size: 0.65rem;
          color: #94A3B8;
          margin-top: 4px;
        }
        
        .filter-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .filter-stat {
          background: white;
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          border: 1px solid #E2E8F0;
          transition: all 0.2s;
        }
        
        .filter-stat.active {
          background: linear-gradient(135deg, #0A2647, #1B3B6F);
          color: white;
        }
        
        .filter-stat.active .filter-stat-value,
        .filter-stat.active .filter-stat-label { color: white; }
        
        .filter-stat-value { font-size: 1.8rem; font-weight: 800; }
        .filter-stat-label { font-size: 0.8rem; margin-top: 4px; }
        
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .search-box {
          position: relative;
        }
        
        .search-box input {
          padding: 10px 16px 10px 36px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          width: 250px;
          font-size: 0.85rem;
          outline: none;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }
        
        .btn-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: white;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .bulk-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #E0E7FF;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #2563EB;
        }
        
        .bulk-actions button {
          padding: 4px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .btn-bulk-approve { background: #10B981; color: white; }
        .btn-bulk-delete { background: #EF4444; color: white; }
        
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .date-range {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .date-range input {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          font-size: 0.8rem;
        }
        
        .export-dropdown {
          position: relative;
        }
        
        .btn-export {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          background: #0A2647;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .export-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          display: none;
          z-index: 10;
        }
        
        .export-dropdown:hover .export-menu { display: block; }
        
        .export-menu button {
          display: block;
          width: 100%;
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
        }
        
        .export-menu button:hover { background: #F1F5F9; }
        
        .advanced-filters {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        
        .advanced-filters select {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          font-size: 0.8rem;
        }
        
        .btn-reset {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: white;
          cursor: pointer;
        }
        
        .users-table {
          background: white;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          overflow-x: auto;
        }
        
        .users-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .users-table th {
          text-align: left;
          padding: 16px 20px;
          background: #F8FAFC;
          font-weight: 600;
          font-size: 0.8rem;
          color: #64748B;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .users-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 0.85rem;
        }
        
        .row-pending { background: #FEF3C7; }
        
        .checkbox-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }
        
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        .user-name { font-weight: 700; color: #0A2647; }
        .user-email { font-size: 0.7rem; color: #64748B; }
        .user-username { font-size: 0.65rem; color: #94A3B8; }
        
        .role-badge {
          padding: 4px 10px;
          border-radius: 20px;
          background: #E0E7FF;
          color: #2563EB;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .admin-badge {
          padding: 2px 8px;
          border-radius: 12px;
          background: #EDE9FE;
          color: #6B4FA0;
          font-size: 0.6rem;
          margin-left: 6px;
        }
        
        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .status-badge.pending { background: #FEF3C7; color: #D97706; }
        .status-badge.approved { background: #D1FAE5; color: #059669; }
        .status-badge.rejected { background: #FEE2E2; color: #DC2626; }
        
        .email-warning {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 12px;
          background: #FEF3C7;
          color: #D97706;
          font-size: 0.6rem;
        }
        
        .specialty-cell { font-size: 0.8rem; color: #475569; margin-bottom: 4px; }
        
        .domains-list {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        
        .domain-badge {
          padding: 2px 8px;
          border-radius: 12px;
          background: #F1F5F9;
          color: #475569;
          font-size: 0.65rem;
        }
        
        .date-cell { font-size: 0.75rem; color: #64748B; }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .btn-approve, .btn-reject, .btn-revoke, .btn-delete {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 0.7rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .btn-approve { background: #10B981; color: white; }
        .btn-reject { background: #EF4444; color: white; }
        .btn-revoke { background: #FEF3C7; color: #D97706; }
        .btn-delete { background: #FEE2E2; color: #DC2626; }
        
        .messages-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .messages-header h2 {
          font-size: 1.3rem;
          color: #0A2647;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: white;
          cursor: pointer;
        }
        
        .messages-list {
          display: grid;
          gap: 16px;
        }
        
        .message-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #E2E8F0;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .message-card.unread { background: #FEF3C7; border-color: #FDE68A; }
        .message-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .message-sender {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .sender-name { font-weight: 700; color: #0A2647; }
        .sender-email { font-size: 0.7rem; color: #64748B; }
        .unread-badge {
          background: #F59E0B;
          color: white;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.65rem;
        }
        
        .message-subject { font-weight: 600; margin-bottom: 8px; color: #1B3B6F; }
        .message-preview { font-size: 0.85rem; color: #475569; margin-bottom: 12px; }
        .message-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          color: #94A3B8;
        }
        
        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .logs-header h2 {
          font-size: 1.3rem;
          color: #0A2647;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .logs-table-container {
          background: white;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          overflow-x: auto;
        }
        
        .logs-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .logs-table th {
          text-align: left;
          padding: 14px 16px;
          background: #F8FAFC;
          font-weight: 600;
          font-size: 0.75rem;
          color: #64748B;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .logs-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 0.8rem;
        }
        
        .log-row.error { background: #FEF2F2; }
        
        .log-action {
          font-family: monospace;
          font-size: 0.75rem;
          background: #F1F5F9;
          padding: 2px 8px;
          border-radius: 6px;
        }
        
        .log-status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .log-status.success { background: #D1FAE5; color: #059669; }
        .log-status.error { background: #FEE2E2; color: #DC2626; }
        
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        
        .settings-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #E2E8F0;
          text-align: center;
        }
        
        .settings-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        
        .settings-card-header svg { color: #FFD700; }
        .settings-card-header h3 { font-size: 1rem; color: #0A2647; margin: 0; }
        .settings-card p { font-size: 0.8rem; color: #64748B; margin-bottom: 20px; }
        
        .btn-settings {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          background: #F1F5F9;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 24px;
          max-width: 600px;
          width: 90%;
          max-height: 85vh;
          overflow: auto;
        }
        
        .modal-content.large { max-width: 700px; }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .modal-header h3 { font-size: 1.1rem; color: #0A2647; margin: 0; }
        
        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748B;
        }
        
        .modal-body { padding: 24px; }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #E2E8F0;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }
        
        .form-group input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          font-size: 0.9rem;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          margin-top: 12px;
        }
        
        .btn-outline {
          padding: 8px 20px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: white;
          cursor: pointer;
        }
        
        .btn-test {
          padding: 8px 20px;
          border-radius: 10px;
          background: #8B5CF6;
          color: white;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        
        .webhooks-list { margin-bottom: 24px; }
        
        .webhook-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #F8FAFC;
          border-radius: 12px;
          margin-bottom: 8px;
        }
        
        .webhook-url {
          font-size: 0.7rem;
          color: #64748B;
          display: block;
        }
        
        .webhook-events {
          font-size: 0.65rem;
          color: #94A3B8;
          margin-top: 4px;
        }
        
        .webhook-actions {
          display: flex;
          gap: 6px;
        }
        
        .webhook-toggle {
          padding: 4px 12px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .webhook-toggle.active { background: #D1FAE5; color: #059669; }
        .webhook-toggle:not(.active) { background: #FEE2E2; color: #DC2626; }
        
        .webhook-delete {
          padding: 4px 8px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          background: white;
        }
        
        .webhook-add {
          padding-top: 16px;
          border-top: 1px solid #E2E8F0;
        }
        
        .webhook-add input, .webhook-add select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          margin-bottom: 12px;
        }
        
        .btn-add {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          background: #10B981;
          color: white;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        
        .backup-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        
        .btn-backup {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          background: #0A2647;
          color: white;
          border: none;
          cursor: pointer;
        }
        
        .backup-history h4 {
          font-size: 0.9rem;
          margin-bottom: 12px;
          color: #0A2647;
        }
        
        .backup-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #F1F5F9;
          font-size: 0.8rem;
        }
        
        .backup-status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .backup-status.success { background: #D1FAE5; color: #059669; }
        
        .loading-state {
          text-align: center;
          padding: 60px;
        }
        
        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #E2E8F0;
          border-top-color: #FFD700;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #94A3B8;
        }
        
        .empty-state-large {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 24px;
          border: 1px solid #E2E8F0;
        }
        
        .empty-state-large svg {
          width: 64px;
          height: 64px;
          color: #94A3B8;
          margin-bottom: 16px;
        }
        
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 12px 24px;
          border-radius: 12px;
          color: white;
          font-size: 0.85rem;
          z-index: 1100;
        }
        
        .toast.success { background: #10B981; }
        .toast.error { background: #EF4444; }
        
        @media (max-width: 1200px) {
          .dashboard-stats-grid { grid-template-columns: repeat(3, 1fr); }
          .charts-grid { grid-template-columns: 1fr; }
          .two-columns { grid-template-columns: 1fr; }
          .settings-grid { grid-template-columns: 1fr; }
          .filter-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (max-width: 768px) {
          .dashboard-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .toolbar { flex-direction: column; align-items: stretch; }
          .toolbar-left, .toolbar-right { justify-content: center; }
          .users-table { font-size: 0.7rem; }
          .users-table th, .users-table td { padding: 12px 8px; }
          .action-buttons { flex-direction: column; gap: 4px; }
        }
        
        @media (max-width: 640px) {
          .dashboard-stats-grid { grid-template-columns: 1fr; }
          .filter-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}