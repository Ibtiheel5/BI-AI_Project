// pages/PatientDashboard.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ═══════════════════════════════════════════════════════════════
// COORDONNÉES VILLES TUNISIENNES (Haversine)
// ═══════════════════════════════════════════════════════════════
const CITY_COORDS = {
  "Tunis": [36.8065, 10.1815], "Sfax": [34.7398, 10.7600],
  "Sousse": [35.8254, 10.6369], "Ariana": [36.8625, 10.1956],
  "Bizerte": [37.2744, 9.8739], "Monastir": [35.7643, 10.8113],
  "Nabeul": [36.4561, 10.7376], "Ben Arous": [36.7533, 10.2282],
  "Manouba": [36.8101, 10.0956], "Kairouan": [35.6781, 10.0963],
  "Gabès": [33.8815, 10.0982], "Mahdia": [35.5047, 11.0622],
  "Gafsa": [34.4250, 8.7842], "Béja": [36.7256, 9.1817],
  "Jendouba": [36.5011, 8.7802], "Kasserine": [35.1676, 8.8365],
  "Médenine": [33.3540, 10.5055], "Tozeur": [33.9197, 8.1336],
  "Siliana": [36.0849, 9.3708], "Zaghouan": [36.4029, 10.1429],
  "Kef": [36.1747, 8.7049], "Hammam Lif": [36.6661, 10.3145],
  "La Marsa": [36.8783, 10.3247], "La Goulette": [36.8136, 10.3169],
  "Carthage": [36.8530, 10.3220], "El Menzah": [36.8425, 10.1547],
  "Le Kram": [36.8108, 10.3272], "El Mourouj": [36.7333, 10.2283],
  "Ezzahra": [36.7314, 10.1997], "Mornag": [36.6331, 10.2583],
  "Radès": [36.7033, 10.2333], "Ben Gardane": [33.3400, 11.1300],
  "Sidi Bouzid": [34.4311, 9.4838], "Tataouine": [32.9297, 10.4518],
  "Kébili": [33.7072, 8.9713], "Mahres": [34.5667, 10.5333],
  "Hammam Sousse": [35.8625, 10.6111], "Kalaa Kebira": [35.7167, 10.6333],
  "Enfidha": [36.1333, 10.4167], "Bouficha": [35.8833, 10.4500],
  "Moknine": [35.6333, 10.9000], "Ksar Hellal": [35.6333, 10.8833],
  "Msaken": [35.7167, 10.5833], "Sahline": [35.8000, 10.6500],
};

const SPEC_ICONS = {
  "Neurologue": "🧠", "Neurochirurgien": "🧠", "Pneumologue": "🫁",
  "Oncologue": "🔬", "Carcinologue": "🔬", "Chirurgie carcinologique": "🔬",
  "Cardiologue": "❤️", "Infectiologue": "🦠", "Radiologue": "⚡",
};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km == null || isNaN(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION MÉDICALE
// ═══════════════════════════════════════════════════════════════
const STATUS_MED = {
  pending:  { label: "En attente de médecin",   short: "En attente",  color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "⏳", dot: "#F59E0B", desc: "Votre demande est dans la file d'attente. Un médecin spécialisé sera notifié." },
  accepted: { label: "Prise en charge",         short: "Pris en charge", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🩺", dot: "#3B82F6", desc: "Un médecin a accepté votre dossier. L'analyse IA va démarrer." },
  analyzed: { label: "Résultats disponibles",   short: "Résultat prêt", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "🧬", dot: "#10B981", desc: "L'analyse est terminée. Consultez les résultats et le commentaire du médecin." },
  rejected: { label: "Demande non traitée",     short: "Rejetée",      color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "✕",  dot: "#EF4444", desc: "Cette demande n'a pas pu être traitée. Vous pouvez soumettre une nouvelle image." },
  closed:   { label: "Consultation terminée",   short: "Terminée",     color: "#4B5563", bg: "#F9FAFB", border: "#E5E7EB", icon: "📋", dot: "#6B7280", desc: "La consultation a été clôturée par le médecin. Les résultats restent accessibles." },
};

const URGENCY_MED = {
  critical: { label: "Critique", color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", icon: "🔴" },
  urgent:   { label: "Urgent",   color: "#EA580C", bg: "#FFF7ED", border: "#FDBA74", icon: "🟠" },
  normal:   { label: "Normal",   color: "#059669", bg: "#F0FDF4", border: "#86EFAC", icon: "🟢" },
};

const MODEL_MED = {
  brain: { icon: "🧠", label: "IRM Cérébrale",       full: "Imagerie par Résonance Magnétique — Encéphale", color: "#7C3AED", bg: "#F5F3FF", organ: "Cerveau", modality: "IRM" },
  lung:  { icon: "🔬", label: "Scanner Thoracique",   full: "Tomodensitométrie — Poumons",                   color: "#DC2626", bg: "#FEF2F2", organ: "Poumons", modality: "TDM" },
  chest: { icon: "🫁", label: "Radio Thoracique",     full: "Radiographie — Thorax",                        color: "#0369A1", bg: "#F0F9FF", organ: "Thorax", modality: "Rx" },
};

const PREDICTION_DISPLAY = {
  glioma: { fr: "Gliome", severity: "high", color: "#DC2626" },
  meningioma: { fr: "Méningiome", severity: "medium", color: "#EA580C" },
  pituitary: { fr: "Adénome hypophysaire", severity: "medium", color: "#EA580C" },
  no_tumor: { fr: "Pas de tumeur", severity: "none", color: "#059669" },
  malignant: { fr: "Tumeur maligne", severity: "high", color: "#DC2626" },
  benign: { fr: "Tumeur bénigne", severity: "medium", color: "#EA580C" },
  normal: { fr: "Normal", severity: "none", color: "#059669" },
  "Normal": { fr: "Normal", severity: "none", color: "#059669" },
  "No Finding": { fr: "Aucune anomalie", severity: "none", color: "#059669" },
  COVID: { fr: "COVID-19", severity: "high", color: "#DC2626" },
  Viral_Pneumonia: { fr: "Pneumonie virale", severity: "high", color: "#DC2626" },
  Bacterial_Pneumonia: { fr: "Pneumonie bactérienne", severity: "high", color: "#DC2626" },
  Pneumonia: { fr: "Pneumonie", severity: "high", color: "#DC2626" },
  Tuberculosis: { fr: "Tuberculose", severity: "high", color: "#DC2626" },
  Cardiomegaly: { fr: "Cardiomégalie", severity: "medium", color: "#EA580C" },
  Pleural_Effusion: { fr: "Épanchement pleural", severity: "medium", color: "#EA580C" },
  Pulmonary_Fibrosis: { fr: "Fibrose pulmonaire", severity: "medium", color: "#EA580C" },
  Edema: { fr: "Œdème pulmonaire", severity: "high", color: "#DC2626" },
  Emphysema: { fr: "Emphysème", severity: "medium", color: "#EA580C" },
  Lung_Opacity: { fr: "Opacité pulmonaire", severity: "medium", color: "#EA580C" },
  Pneumothorax: { fr: "Pneumothorax", severity: "high", color: "#DC2626" },
  Mass: { fr: "Masse pulmonaire", severity: "high", color: "#DC2626" },
  Nodule: { fr: "Nodule pulmonaire", severity: "medium", color: "#EA580C" },
  Atelectasis: { fr: "Atrélectasie", severity: "medium", color: "#EA580C" },
  Consolidation: { fr: "Condensation", severity: "medium", color: "#EA580C" },
  Hernia: { fr: "Hernie hiatale", severity: "low", color: "#D97706" },
};

const NOTIF_ICONS = {
  new_consultation: "📋", consultation_accepted: "🩺", consultation_rejected: "❌",
  analysis_ready: "🧬", appointment_scheduled: "📅", consultation_closed: "📋",
  new_message: "💬", doctor_changed: "🔄", consultation_transferred: "📤",
};

const MODEL_TO_SPECS = {
  brain: ["Neurologue", "Neurochirurgien", "Radiologue"],
  lung: ["Pneumologue", "Oncologue", "Carcinologue", "Chirurgie carcinologique", "Radiologue"],
  chest: ["Cardiologue", "Infectiologue", "Radiologue"],
};

// ═══════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════
function MedBadge({ label, color, bg, border, icon, size = "sm" }) {
  const s = size === "sm" ? { p: "2px 8px", f: ".65rem", r: 6 } : { p: "4px 12px", f: ".75rem", r: 8 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: s.p, borderRadius: s.r,
      background: bg, color, border: `1px solid ${border}`, fontSize: s.f, fontWeight: 700, whiteSpace: "nowrap",
    }}>{icon && <span style={{ fontSize: ".85em" }}>{icon}</span>}{label}</span>
  );
}

function EmptyState({ icon, title, desc, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", background: "linear-gradient(180deg,#FAFBFC,#F1F5F9)", borderRadius: 16, border: "1px dashed #E2E8F0" }}>
      <div style={{ fontSize: "3rem", marginBottom: 14, opacity: .7 }}>{icon}</div>
      <div style={{ fontSize: ".95rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: ".82rem", color: "#94A3B8", lineHeight: 1.6, marginBottom: 18, maxWidth: 300, margin: "0 auto 18px" }}>{desc}</div>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#0A2647,#1B3B6F)", border: "none", borderRadius: 10, color: "white", fontSize: ".82rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(10,38,71,.2)" }}>{actionLabel}</button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  // ── State ──
  const [consultations, setConsultations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const notifRef = useRef(null);

  // ── Doctors state ──
  const [doctors, setDoctors] = useState([]);
  const [allVilles, setAllVilles] = useState([]);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState("");
  const [selectedVille, setSelectedVille] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [locDetected, setLocDetected] = useState(false);
  const [locError, setLocError] = useState("");
  const [showDocDetail, setShowDocDetail] = useState(null);
  const [docTab, setDocTab] = useState("nearby");

  // ── Detect location ──
  useEffect(() => {
    if (!navigator.geolocation) { 
      setLocError("Géolocalisation non supportée"); 
      return; 
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { 
        setUserCoords([pos.coords.latitude, pos.coords.longitude]); 
        setLocDetected(true); 
      },
      () => { 
        setLocError("Localisation refusée — sélectionnez votre ville manuellement"); 
      },
      { timeout: 8000 }
    );
  }, []);

  // ── Fetch consultations ──
  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [cRes, nRes] = await Promise.all([
        fetch(`${API}/consultations/my`, { headers }),
        fetch(`${API}/consultations/notifications/me?unread_only=false`, { headers }),
      ]);
      if (!cRes.ok) throw new Error("Impossible de charger vos consultations.");
      const cData = await cRes.json();
      const nData = nRes.ok ? await nRes.json() : { notifications: [], unread: 0 };
      setConsultations(cData.consultations || []);
      setNotifications(nData.notifications || []);
      setUnreadCount(nData.unread || 0);
    } catch (e) { 
      setError(e.message); 
    } finally { 
      setLoading(false); 
    }
  }, [token]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // ── Fetch doctors ──
  const fetchDoctors = useCallback(async (ville, spec) => {
    setDocLoading(true); 
    setDocError("");
    try {
      const params = new URLSearchParams();
      if (ville) params.set("ville", ville);
      if (spec) params.set("specialite", spec);
      const [dRes, vRes] = await Promise.all([
        fetch(`${API}/doctors?${params.toString()}`),
        fetch(`${API}/doctors/villes`),
      ]);
      if (!dRes.ok) throw new Error("Service médecins indisponible");
      const dData = await dRes.json();
      const vData = vRes.ok ? await vRes.json() : { villes: [] };
      setDoctors(dData.doctors || []);
      setAllVilles(vData.villes || []);
    } catch (e) { 
      setDocError(e.message); 
    } finally { 
      setDocLoading(false); 
    }
  }, []);

  useEffect(() => { 
    fetchDoctors(selectedVille, selectedSpec); 
  }, [selectedVille, selectedSpec, fetchDoctors]);

  // Close notif
  useEffect(() => {
    const handleClickOutside = (e) => { 
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(`${API}/consultations/notifications/read-all`, { 
        method: "POST", 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setUnreadCount(0);
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    } catch (e) {
      console.error("Error marking notifications as read:", e);
    }
  };

  // ── Computed: patient's model_keys ──
  const patientModels = useMemo(() => [...new Set(consultations.map(c => c.model_key).filter(Boolean))], [consultations]);
  const patientSpecs = useMemo(() => {
    const s = new Set();
    patientModels.forEach(m => (MODEL_TO_SPECS[m] || []).forEach(sp => s.add(sp)));
    return [...s];
  }, [patientModels]);

  // ── Computed: platform doctors (from past consultations) ──
  const platformDoctors = useMemo(() => {
    const map = new Map();
    (consultations || []).forEach(c => {
      if (c.doctor_id && c.doctor_name) {
        if (!map.has(c.doctor_id)) {
          map.set(c.doctor_id, {
            id: c.doctor_id, 
            name: `Dr. ${c.doctor_name}`, 
            specialite: c.doctor_specialty || "",
            ville: "", 
            address: "", 
            phones: [], 
            models: [], 
            source: "plateforme",
            url: null, 
            consultations: 0, 
            lastStatus: c.status,
          });
        }
        const d = map.get(c.doctor_id);
        d.consultations++;
        if (c.updated_at > (d.lastDate || 0)) d.lastDate = c.updated_at;
      }
    });
    return [...map.values()];
  }, [consultations]);

  // ── Computed: scraped doctors with distance ──
  const scrapedWithDist = useMemo(() => {
    if (!userCoords) return doctors.map(d => ({ ...d, distance: null }));
    return doctors.map(d => {
      const cityCoords = CITY_COORDS[d.ville];
      if (!cityCoords) return { ...d, distance: null };
      return { ...d, distance: haversine(userCoords[0], userCoords[1], cityCoords[0], cityCoords[1]) };
    }).sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
  }, [doctors, userCoords]);

  // ── Filtered scraped ──
  const filteredScraped = useMemo(() => {
    let list = scrapedWithDist;
    if (docSearch.trim()) {
      const q = docSearch.toLowerCase();
      list = list.filter(d =>
        (d.name || "").toLowerCase().includes(q) ||
        (d.specialite || "").toLowerCase().includes(q) ||
        (d.ville || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [scrapedWithDist, docSearch]);

  // ── Critical results ──
  const criticalResults = consultations.filter(c => c.status === "analyzed" && (c.urgency === "critical" || c.urgency === "urgent"));
  const pendingCount = consultations.filter(c => c.status === "pending").length;
  const analyzedCount = consultations.filter(c => c.status === "analyzed").length;
  const closedCount = consultations.filter(c => c.status === "closed").length;

  // ── Formatters ──
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const formatDateShort = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const formatNotifTime = (d) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };
  const timeSince = (d) => {
    if (!d) return "";
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return `Il y a ${Math.floor(diff / 1440)}j`;
  };

  // Helper pour les styles hover
  const handleMouseEnter = (e, bgColor, textColor) => {
    e.currentTarget.style.background = bgColor;
    if (textColor) e.currentTarget.style.color = textColor;
  };
  
  const handleMouseLeave = (e, bgColor, textColor) => {
    e.currentTarget.style.background = bgColor;
    if (textColor) e.currentTarget.style.color = textColor;
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes alertPulse{0%,100%{opacity:1}50%{opacity:.7}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        *{scrollbar-width:thin;scrollbar-color:#CBD5E1 transparent}
        *::-webkit-scrollbar{width:6px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
      `}</style>

      {/* ═══════════════ HEADER ═══════════════ */}
      <div style={{ background: "linear-gradient(135deg,#0A2647 0%,#144272 50%,#205295 100%)", padding: "0 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .04, backgroundImage: "radial-gradient(circle at 20% 50%,white 1px,transparent 1px),radial-gradient(circle at 80% 20%,white 1px,transparent 1px)", backgroundSize: "60px 60px,40px 40px" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.1)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>⚕️</div>
              <div>
                <div style={{ fontSize: ".85rem", fontWeight: 800, color: "white", letterSpacing: ".04em" }}>MedAI</div>
                <div style={{ fontSize: ".58rem", color: "rgba(255,255,255,.45)", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Plateforme de diagnostic IA</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div ref={notifRef} style={{ position: "relative" }}>
                <button 
                  onClick={() => setShowNotifs(!showNotifs)} 
                  style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.05rem", cursor: "pointer", color: "white", transition: "all .2s" }}
                  onMouseEnter={(e) => handleMouseEnter(e, "rgba(255,255,255,.15)")}
                  onMouseLeave={(e) => handleMouseLeave(e, "rgba(255,255,255,.08)")}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={{ position: "absolute", top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, background: "#EF4444", color: "white", fontSize: ".6rem", fontWeight: 800, padding: "0 5px", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 2s infinite", border: "2px solid #0A2647" }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div style={{ position: "absolute", top: 48, right: 0, width: 380, background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 20px 60px rgba(0,0,0,.15)", zIndex: 200, overflow: "hidden", animation: "fadeUp .2s ease" }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFBFC" }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: ".88rem", color: "#0A2647" }}>Notifications</span>
                        {unreadCount > 0 && <span style={{ marginLeft: 8, fontSize: ".7rem", fontWeight: 700, color: "#DC2626" }}>{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</span>}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ background: "none", border: "1px solid #E2E8F0", color: "#475569", fontSize: ".7rem", fontWeight: 600, cursor: "pointer", borderRadius: 6, padding: "3px 10px" }}>
                          Tout lire
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "40px 20px", textAlign: "center", color: "#CBD5E1" }}>
                          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔔</div>
                          <div style={{ fontSize: ".82rem" }}>Aucune notification</div>
                        </div>
                      ) : (
                        notifications.slice(0, 12).map((n, i) => (
                          <div 
                            key={n.id} 
                            onClick={() => { 
                              try { 
                                const d = typeof n.data === "string" ? JSON.parse(n.data) : n.data; 
                                if (d.consultation_id) navigate(`/consultation/${d.consultation_id}`); 
                              } catch (e) {} 
                              setShowNotifs(false); 
                            }} 
                            style={{ padding: "13px 18px", borderBottom: "1px solid #F8FAFC", cursor: "pointer", background: n.is_read ? "white" : "#F0F9FF", transition: "background .1s", animation: `slideRight .2s ease ${i * 30}ms both` }}
                            onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                            onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "white" : "#F0F9FF"}
                          >
                            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: n.is_read ? "#F1F5F9" : "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem", flexShrink: 0 }}>
                                {NOTIF_ICONS[n.type] || "📌"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#0A2647", marginBottom: 2 }}>{n.title}</div>
                                <div style={{ fontSize: ".73rem", color: "#64748B", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                                <div style={{ fontSize: ".63rem", color: "#CBD5E1", marginTop: 4, fontWeight: 500 }}>{formatNotifTime(n.created_at)}</div>
                              </div>
                              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", flexShrink: 0, marginTop: 6, boxShadow: "0 0 0 2px rgba(37,99,235,.2)" }} />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate("/patient/consultation/new")} 
                style={{ padding: "9px 20px", background: "rgba(255,255,255,.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, color: "white", fontSize: ".82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all .2s" }}
                onMouseEnter={(e) => handleMouseEnter(e, "rgba(255,255,255,.2)")}
                onMouseLeave={(e) => handleMouseLeave(e, "rgba(255,255,255,.12)")}
              >
                <span style={{ fontSize: "1rem" }}>+</span> Nouvelle demande
              </button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0 22px", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: "linear-gradient(135deg,rgba(255,255,255,.15),rgba(255,255,255,.05))", border: "2px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "white", backdropFilter: "blur(10px)" }}>
                {user?.full_name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "white", letterSpacing: "-.01em", marginBottom: 2 }}>{user?.full_name || "Patient"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: ".6rem", fontWeight: 700, background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", letterSpacing: ".08em", fontFamily: "monospace" }}>
                    PAT-{String(user?.id || 0).padStart(6, "0")}
                  </span>
                  <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,.5)" }}>·</span>
                  <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,.6)", fontWeight: 500 }}>Dossier patient</span>
                  {locDetected && <span style={{ fontSize: ".68rem", color: "rgba(52,211,153,.8)", fontWeight: 600 }}>📍 Localisé</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              {[
                { l: "Consultations", v: consultations.length }, 
                { l: "En cours", v: pendingCount + consultations.filter(c => c.status === "accepted").length }
              ].map(s => (
                <div key={s.l} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "white" }}>{s.v}</div>
                  <div style={{ fontSize: ".6rem", color: "rgba(255,255,255,.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 32px 48px" }}>

        {/* ── Alertes urgentes ── */}
        {criticalResults.length > 0 && (
          <div style={{ marginBottom: 20, padding: "16px 20px", background: "linear-gradient(135deg,#FEF2F2,#FFF1F2)", border: "1.5px solid #FECACA", borderRadius: 14, display: "flex", alignItems: "center", gap: 14, animation: "fadeUp .3s ease" }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: "white", flexShrink: 0, animation: "alertPulse 2s infinite" }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#991B1B", marginBottom: 2 }}>
                Résultat{criticalResults.length > 1 ? "s" : ""} nécessitant votre attention
              </div>
              <div style={{ fontSize: ".76rem", color: "#B91C1C", lineHeight: 1.5 }}>
                {criticalResults.length === 1 
                  ? `La consultation #${criticalResults[0].id} présente un résultat ${URGENCY_MED[criticalResults[0].urgency]?.label?.toLowerCase()}. Consultez un médecin spécialisé.` 
                  : `${criticalResults.length} consultations présentent des résultats anormaux.`}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {criticalResults.slice(0, 3).map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => navigate(`/consultation/${c.id}`)} 
                    style={{ padding: "3px 10px", background: "white", border: "1px solid #FCA5A5", borderRadius: 6, fontSize: ".7rem", fontWeight: 700, color: "#DC2626", cursor: "pointer" }}
                  >
                    #{c.id} — {PREDICTION_DISPLAY[c.prediction]?.fr || c.prediction}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => navigate(`/consultation/${criticalResults[0].id}`)} 
              style={{ padding: "9px 16px", background: "#DC2626", border: "none", borderRadius: 10, color: "white", fontSize: ".76rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Voir →
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24, animation: "fadeUp .3s ease" }}>
          {[
            { l: "Total examens", v: consultations.length, ic: "📋", bg: "#F8FAFC", ac: "#0A2647", sub: `${Object.keys(MODEL_MED).length} modalités` },
            { l: "En attente", v: pendingCount, ic: "⏳", bg: "#FFFBEB", ac: "#D97706", sub: pendingCount ? "Dossier en attente" : "Aucune attente" },
            { l: "Résultats prêts", v: analyzedCount, ic: "🧬", bg: "#ECFDF5", ac: "#059669", sub: analyzedCount ? "Consultez vos résultats" : "Pas encore de résultat" },
            { l: "Terminées", v: closedCount, ic: "✅", bg: "#F0F9FF", ac: "#0284C7", sub: "Consultations clôturées" },
          ].map((s, i) => (
            <div key={s.l} style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", position: "relative", overflow: "hidden", animation: `fadeUp .3s ease ${i * 60}ms both` }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${s.ac},${s.ac}44)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.05rem" }}>{s.ic}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.ac }}>{s.v}</div>
              </div>
              <div style={{ fontSize: ".76rem", fontWeight: 700, color: "#0A2647", marginBottom: 1 }}>{s.l}</div>
              <div style={{ fontSize: ".66rem", color: "#94A3B8" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #E2E8F0", borderTopColor: "#0A2647", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: ".9rem", color: "#94A3B8" }}>Chargement de votre dossier…</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: "14px 18px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, color: "#DC2626", fontSize: ".85rem", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: "1rem" }}>✕</button>
          </div>
        )}

        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>

            {/* ═══════ LEFT ═══════ */}
            <div>

              {/* ═══════════════════════════════════════════════
                  MÉDECINS RECOMMANDÉS — SECTION COMPLÈTE
                 ═══════════════════════════════════════════════ */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(10,38,71,.04)" }}>

                  {/* Section header */}
                  <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F1F5F9", background: "linear-gradient(135deg,#FAFBFC,#F8FAFC)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0A2647,#1B3B6F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".95rem", color: "white" }}>🏥</div>
                        <div>
                          <div style={{ fontSize: ".95rem", fontWeight: 800, color: "#0A2647" }}>Médecins recommandés</div>
                          <div style={{ fontSize: ".7rem", color: "#94A3B8" }}>Spécialistes près de chez vous · {filteredScraped.length + platformDoctors.length} médecins trouvés</div>
                        </div>
                      </div>
                      {locDetected && <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: ".65rem", fontWeight: 700, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>📍 Géolocalisé</span>}
                    </div>

                    {/* Location status */}
                    {locError && (
                      <div style={{ padding: "8px 12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: ".72rem", color: "#92400E", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>⚠️</span>{locError}
                      </div>
                    )}

                    {/* Filters row */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <select 
                        value={selectedVille} 
                        onChange={e => setSelectedVille(e.target.value)} 
                        style={{
                          flex: 1, minWidth: 140, padding: "8px 12px", background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                          borderRadius: 8, fontSize: ".78rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans',sans-serif",
                          cursor: "pointer", appearance: "auto",
                        }}
                      >
                        <option value="">📍 Toutes les villes</option>
                        {allVilles.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <select 
                        value={selectedSpec} 
                        onChange={e => setSelectedSpec(e.target.value)} 
                        style={{
                          flex: 1, minWidth: 140, padding: "8px 12px", background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                          borderRadius: 8, fontSize: ".78rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans',sans-serif",
                          cursor: "pointer", appearance: "auto",
                        }}
                      >
                        <option value="">🩺 Toutes spécialités</option>
                        {patientSpecs.length > 0 && (
                          <optgroup label="── Spécialités recommandées ──">
                            {patientSpecs.map(s => <option key={s} value={s}>{SPEC_ICONS[s] || ""} {s}</option>)}
                          </optgroup>
                        )}
                        {Object.keys(SPEC_ICONS).map(s => !patientSpecs.includes(s) && (
                          <option key={s} value={s}>{SPEC_ICONS[s]} {s}</option>
                        ))}
                      </select>
                      <div style={{ flex: 1.5, minWidth: 180, position: "relative" }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: ".8rem", color: "#CBD5E1" }}>🔍</span>
                        <input 
                          type="text" 
                          value={docSearch} 
                          onChange={e => setDocSearch(e.target.value)} 
                          placeholder="Nom, spécialité…" 
                          style={{
                            width: "100%", padding: "8px 10px 8px 32px", background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                            borderRadius: 8, fontSize: ".78rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box",
                          }}
                          onFocus={e => e.target.style.borderColor = "#0A2647"} 
                          onBlur={e => e.target.style.borderColor = "#E2E8F0"} 
                        />
                      </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 4, marginTop: 10, background: "#F1F5F9", borderRadius: 8, padding: 3 }}>
                      {[
                        { k: "nearby", l: `Annuaire médical (${filteredScraped.length})`, ic: "📋" }, 
                        { k: "platform", l: `Mes médecins (${platformDoctors.length})`, ic: "🩺" }
                      ].map(t => (
                        <button 
                          key={t.k} 
                          onClick={() => setDocTab(t.k)} 
                          style={{
                            flex: 1, padding: "7px 10px", borderRadius: 6, fontSize: ".72rem", fontWeight: 700,
                            background: docTab === t.k ? "white" : "transparent", color: docTab === t.k ? "#0A2647" : "#94A3B8",
                            border: "none", cursor: "pointer", transition: "all .15s",
                            boxShadow: docTab === t.k ? "0 1px 4px rgba(0,0,0,.06)" : "none",
                          }}
                        >
                          {t.ic} {t.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Tab: Nearby / Scraped doctors ── */}
                  {docTab === "nearby" && (
                    <div style={{ maxHeight: 520, overflowY: "auto" }}>
                      {docLoading && (
                        <div style={{ padding: "40px 20px", textAlign: "center" }}>
                          <div style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTopColor: "#0A2647", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
                          <div style={{ fontSize: ".82rem", color: "#94A3B8" }}>Recherche de médecins…</div>
                        </div>
                      )}
                      {docError && !docLoading && (
                        <div style={{ padding: "30px 20px", textAlign: "center" }}>
                          <div style={{ fontSize: "2rem", marginBottom: 8 }}>⚠️</div>
                          <div style={{ fontSize: ".85rem", color: "#DC2626", fontWeight: 600, marginBottom: 4 }}>{docError}</div>
                          <div style={{ fontSize: ".75rem", color: "#94A3B8" }}>Le service est temporairement indisponible.</div>
                        </div>
                      )}
                      {!docLoading && !docError && filteredScraped.length === 0 && (
                        <div style={{ padding: "40px 20px", textAlign: "center" }}>
                          <div style={{ fontSize: "2.5rem", marginBottom: 10, opacity: .6 }}>🔍</div>
                          <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0A2647", marginBottom: 4 }}>Aucun médecin trouvé</div>
                          <div style={{ fontSize: ".78rem", color: "#94A3B8", maxWidth: 280, margin: "0 auto" }}>Essayez de modifier vos filtres de ville ou spécialité.</div>
                        </div>
                      )}
                      {!docLoading && filteredScraped.map((doc, idx) => {
                        const dist = formatDistance(doc.distance);
                        const isNearest = idx === 0 && dist != null && !selectedVille && !selectedSpec && !docSearch;
                        const specIcon = SPEC_ICONS[doc.specialite] || "🩺";
                        return (
                          <div 
                            key={doc.id || idx} 
                            style={{
                              padding: "14px 22px", borderBottom: "1px solid #F8FAFC",
                              cursor: "pointer", transition: "all .15s", position: "relative",
                              background: isNearest ? "#F0FDF4" : "white",
                            }}
                            onClick={() => setShowDocDetail(showDocDetail === (doc.id || idx) ? null : (doc.id || idx))}
                            onMouseEnter={e => e.currentTarget.style.background = isNearest ? "#ECFDF5" : "#F8FAFC"}
                            onMouseLeave={e => e.currentTarget.style.background = isNearest ? "#F0FDF4" : "white"}
                          >
                            {/* Nearest badge */}
                            {isNearest && (
                              <div style={{ position: "absolute", top: 10, right: 14 }}>
                                <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: ".6rem", fontWeight: 800, background: "#059669", color: "white", letterSpacing: ".04em" }}>★ PLUS PROCHE</span>
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                              <div style={{
                                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                                background: isNearest ? "linear-gradient(135deg,#059669,#047857)" : "#F1F5F9",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.15rem", color: isNearest ? "white" : "#64748B",
                              }}>{specIcon}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: ".85rem", fontWeight: 800, color: "#0A2647", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {doc.name}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: ".72rem", fontWeight: 600, color: "#475569" }}>{doc.specialite}</span>
                                  {doc.ville && (
                                    <>
                                      <span style={{ fontSize: ".65rem", color: "#CBD5E1" }}>·</span>
                                      <span style={{ fontSize: ".7rem", color: "#64748B" }}>📍 {doc.ville}</span>
                                    </>
                                  )}
                                  {dist && (
                                    <>
                                      <span style={{ fontSize: ".65rem", color: "#CBD5E1" }}>·</span>
                                      <span style={{ fontSize: ".7rem", fontWeight: 700, color: isNearest ? "#059669" : "#475569" }}>{dist}</span>
                                    </>
                                  )}
                                </div>
                                {doc.address && (
                                  <div style={{ fontSize: ".66rem", color: "#CBD5E1", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {doc.address}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                                {doc.phones && doc.phones.length > 0 && (
                                  <a 
                                    href={`tel:${doc.phones[0]}`} 
                                    onClick={e => e.stopPropagation()} 
                                    style={{
                                      padding: "5px 12px", background: "#ECFDF5", border: "1px solid #A7F3D0",
                                      borderRadius: 8, fontSize: ".68rem", fontWeight: 700, color: "#059669",
                                      textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                                      transition: "all .15s", whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = "#059669";
                                      e.currentTarget.style.color = "white";
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = "#ECFDF5";
                                      e.currentTarget.style.color = "#059669";
                                    }}
                                  >
                                    📞 Appeler
                                  </a>
                                )}
                                <span style={{ fontSize: ".6rem", color: "#CBD5E1" }}>
                                  {doc.source === "plateforme" ? "MedAI" : "tunisie-medicale"}
                                </span>
                              </div>
                            </div>

                            {/* Expanded detail */}
                            {showDocDetail === (doc.id || idx) && (
                              <div style={{ marginTop: 12, padding: "12px 14px", background: "#FAFBFC", borderRadius: 10, border: "1px solid #F1F5F9", animation: "fadeUp .2s ease" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                                  {[
                                    ["Spécialité", doc.specialite],
                                    ["Ville", doc.ville || "—"],
                                    ["Adresse", doc.address || "—"],
                                    ["Source", doc.source === "plateforme" ? "MedAI (votre médecin)" : "tunisie-medicale.com"],
                                  ].map(([l, v]) => (
                                    <div key={l}>
                                      <div style={{ fontSize: ".62rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
                                      <div style={{ fontSize: ".78rem", color: "#0A2647", fontWeight: 600 }}>{v}</div>
                                    </div>
                                  ))}
                                </div>
                                {doc.phones && doc.phones.length > 0 && (
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: ".62rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Téléphone(s)</div>
                                    {doc.phones.map((p, i) => (
                                      <a 
                                        key={i} 
                                        href={`tel:${p}`} 
                                        onClick={e => e.stopPropagation()} 
                                        style={{ display: "inline-block", padding: "4px 10px", marginRight: 6, marginBottom: 4, background: "white", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: ".78rem", color: "#0A2647", textDecoration: "none", fontWeight: 600 }}
                                      >
                                        {p}
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {doc.models && doc.models.length > 0 && (
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: ".62rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Compatible avec vos examens</div>
                                    <div style={{ display: "flex", gap: 4 }}>
                                      {doc.models.map(m => (
                                        <span key={m} style={{ padding: "3px 8px", background: (MODEL_MED[m] || {}).bg || "#F1F5F9", border: `1px solid ${(MODEL_MED[m] || {}).color || "#E2E8F0"}33`, borderRadius: 6, fontSize: ".68rem", fontWeight: 700, color: (MODEL_MED[m] || {}).color || "#64748B" }}>
                                          {(MODEL_MED[m] || {}).icon} {(MODEL_MED[m] || {}).label}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {doc.url && (
                                  <a 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={e => e.stopPropagation()} 
                                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "white", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: ".75rem", fontWeight: 700, color: "#475569", textDecoration: "none", transition: "all .15s" }}
                                    onMouseEnter={e => { 
                                      e.currentTarget.style.borderColor = "#0A2647"; 
                                      e.currentTarget.style.color = "#0A2647"; 
                                    }}
                                    onMouseLeave={e => { 
                                      e.currentTarget.style.borderColor = "#E2E8F0"; 
                                      e.currentTarget.style.color = "#475569"; 
                                    }}
                                  >
                                    🔗 Voir la fiche complète →
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Tab: Platform doctors ── */}
                  {docTab === "platform" && (
                    <div style={{ maxHeight: 520, overflowY: "auto" }}>
                      {platformDoctors.length === 0 ? (
                        <div style={{ padding: "40px 20px", textAlign: "center" }}>
                          <div style={{ fontSize: "2.5rem", marginBottom: 10, opacity: .6 }}>🩺</div>
                          <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0A2647", marginBottom: 4 }}>Aucun médecin de la plateforme</div>
                          <div style={{ fontSize: ".78rem", color: "#94A3B8", maxWidth: 280, margin: "0 auto" }}>Les médecins qui traitent vos consultations apparaîtront ici.</div>
                        </div>
                      ) : (
                        platformDoctors.map((doc, idx) => {
                          const specIcon = SPEC_ICONS[doc.specialite] || "🩺";
                          return (
                            <div 
                              key={doc.id} 
                              onClick={() => navigate("/patient")} 
                              style={{
                                padding: "14px 22px", borderBottom: "1px solid #F8FAFC",
                                cursor: "pointer", transition: "all .15s",
                              }} 
                              onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} 
                              onMouseLeave={e => e.currentTarget.style.background = "white"}
                            >
                              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                <div style={{
                                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                                  background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "1.15rem", color: "white",
                                }}>{specIcon}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: ".85rem", fontWeight: 800, color: "#0A2647", marginBottom: 2 }}>{doc.name}</div>
                                  <div style={{ fontSize: ".72rem", color: "#64748B" }}>
                                    {doc.specialite} · {doc.consultations} consultation{doc.consultations > 1 ? "s" : ""}
                                  </div>
                                </div>
                                <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: ".62rem", fontWeight: 800, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}>MEDAI</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ padding: "10px 22px", borderTop: "1px solid #F1F5F9", background: "#FAFBFC" }}>
                    <div style={{ fontSize: ".65rem", color: "#CBD5E1", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>ℹ️</span>
                      <span>Données issues de l'annuaire médical tunisien et de la plateforme MedAI. En cas d'urgence, appelez le <strong style={{ color: "#DC2626" }}>15 (SAMU)</strong> ou le <strong style={{ color: "#DC2626" }}>112</strong>.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════ CONSULTATIONS ═══════ */}
              <div>
                {/* Toolbar */}
                <div style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #E2E8F0", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: ".85rem", color: "#CBD5E1" }}>🔍</span>
                    <input 
                      type="text" 
                      value={search} 
                      onChange={e => setSearch(e.target.value)} 
                      placeholder="Réf., examen, médecin, résultat…" 
                      style={{ width: "100%", padding: "9px 12px 9px 36px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: ".82rem", color: "#0A2647", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }} 
                      onFocus={e => e.target.style.borderColor = "#0A2647"} 
                      onBlur={e => e.target.style.borderColor = "#E2E8F0"} 
                    />
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {[
                      { k: "all", l: "Toutes" }, 
                      { k: "pending", l: "⏳ Attente" }, 
                      { k: "accepted", l: "🩺 En cours" }, 
                      { k: "analyzed", l: "🧬 Résultats" }, 
                      { k: "closed", l: "✅ Terminées" }
                    ].map(f => (
                      <button 
                        key={f.k} 
                        onClick={() => setFilter(f.k)} 
                        style={{ 
                          padding: "6px 12px", 
                          borderRadius: 8, 
                          fontSize: ".72rem", 
                          fontWeight: 700, 
                          background: filter === f.k ? "#0A2647" : "white", 
                          color: filter === f.k ? "white" : "#64748B", 
                          border: filter === f.k ? "none" : "1px solid #E2E8F0", 
                          cursor: "pointer", 
                          transition: "all .15s", 
                          whiteSpace: "nowrap" 
                        }}
                      >
                        {f.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: ".7rem", color: "#94A3B8", marginBottom: 10, fontWeight: 600, paddingLeft: 4 }}>
                  {consultations.filter(c => filter === "all" || c.status === filter).filter(c => {
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    return String(c.id).includes(q) || 
                           (MODEL_MED[c.model_key]?.label || "").toLowerCase().includes(q) || 
                           (c.doctor_name || "").toLowerCase().includes(q) || 
                           (PREDICTION_DISPLAY[c.prediction]?.fr || "").toLowerCase().includes(q);
                  }).length} résultat{consultations.length !== 1 ? "s" : ""}{filter !== "all" && ` — ${STATUS_MED[filter]?.short}`}
                </div>

                {(() => {
                  const filtered = consultations.filter(c => filter === "all" || c.status === filter).filter(c => { 
                    if (!search.trim()) return true; 
                    const q = search.toLowerCase(); 
                    return String(c.id).includes(q) || 
                           (MODEL_MED[c.model_key]?.label || "").toLowerCase().includes(q) || 
                           (c.doctor_name || "").toLowerCase().includes(q) || 
                           (PREDICTION_DISPLAY[c.prediction]?.fr || "").toLowerCase().includes(q); 
                  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                  if (filtered.length === 0) {
                    return <EmptyState 
                      icon={filter === "all" && !search ? "🏥" : "🔍"} 
                      title={filter === "all" && !search ? "Aucune consultation" : "Aucun résultat"} 
                      desc={filter === "all" && !search ? "Soumettez votre première image médicale." : "Modifiez vos critères."} 
                      actionLabel={filter === "all" && !search ? "Soumettre un examen" : null} 
                      onAction={filter === "all" && !search ? () => navigate("/patient/consultation/new") : null} 
                    />;
                  }

                  return filtered.map((c, idx) => {
                    const st = STATUS_MED[c.status] || STATUS_MED.pending;
                    const ur = URGENCY_MED[c.urgency] || URGENCY_MED.normal;
                    const md = MODEL_MED[c.model_key] || MODEL_MED.chest;
                    const pd = PREDICTION_DISPLAY[c.prediction];
                    const isExp = expandedId === c.id;

                    return (
                      <div key={c.id} style={{ marginBottom: 8, animation: `fadeUp .3s ease ${idx * 35}ms both` }}>
                        <div 
                          onClick={() => setExpandedId(isExp ? null : c.id)} 
                          style={{ 
                            background: "white", 
                            borderRadius: 14, 
                            border: `1.5px solid ${isExp ? md.color + "44" : "#E2E8F0"}`, 
                            cursor: "pointer", 
                            transition: "all .2s", 
                            overflow: "hidden", 
                            boxShadow: isExp ? `0 4px 20px ${md.color}10` : "0 1px 3px rgba(0,0,0,.04)" 
                          }}
                          onMouseEnter={e => { if (!isExp) { e.currentTarget.style.borderColor = "#CBD5E1"; } }} 
                          onMouseLeave={e => { if (!isExp) { e.currentTarget.style.borderColor = "#E2E8F0"; } }}
                        >
                          <div style={{ height: 3, background: `linear-gradient(90deg,${st.dot},${st.dot}33)` }} />
                          <div style={{ padding: "14px 18px" }}>
                            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                              <div style={{ 
                                width: 48, height: 48, borderRadius: 13, flexShrink: 0, 
                                background: `linear-gradient(135deg,${md.color},${md.color}cc)`, 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                fontSize: "1.4rem", color: "white", boxShadow: `0 4px 12px ${md.color}30` 
                              }}>
                                {md.icon}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: ".66rem", fontWeight: 800, color: "#94A3B8", fontFamily: "monospace", letterSpacing: ".04em" }}>
                                    REF-{String(c.id).padStart(4, "0")}
                                  </span>
                                  <MedBadge label={st.short} color={st.color} bg={st.bg} border={st.border} icon={st.icon} />
                                  {c.urgency && c.urgency !== "normal" && c.status !== "pending" && (
                                    <MedBadge label={ur.label} color={ur.color} bg={ur.bg} border={ur.border} icon={ur.icon} />
                                  )}
                                </div>
                                <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#0A2647", marginBottom: 3 }}>
                                  {md.label}
                                  {pd && c.status !== "pending" && (
                                    <span style={{ fontWeight: 500, color: pd.color, marginLeft: 8 }}>— {pd.fr}</span>
                                  )}
                                </div>
                                <div style={{ fontSize: ".72rem", color: "#94A3B8", display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontWeight: 600, color: "#64748B" }}>{md.modality}</span>
                                  <span>·</span>
                                  <span>{md.organ}</span>
                                  {c.doctor_name && (
                                    <>
                                      <span>·</span>
                                      <span>Dr. {c.doctor_name}</span>
                                    </>
                                  )}
                                  <span>·</span>
                                  <span>{formatDateShort(c.created_at)}</span>
                                </div>
                                {isExp && (
                                  <div style={{ 
                                    marginTop: 8, padding: "8px 12px", background: `${st.color}08`, 
                                    borderRadius: 8, borderLeft: `3px solid ${st.color}`, 
                                    fontSize: ".76rem", color: "#475569", lineHeight: 1.5, animation: "fadeIn .2s ease" 
                                  }}>
                                    {st.desc}
                                  </div>
                                )}
                              </div>
                              <div style={{ 
                                width: 26, height: 26, borderRadius: 7, background: "#F8FAFC", 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                color: "#CBD5E1", fontSize: ".7rem", flexShrink: 0, transition: "all .2s", 
                                transform: isExp ? "rotate(180deg)" : "" 
                              }}>
                                ▼
                              </div>
                            </div>
                          </div>
                        </div>

                        {isExp && (
                          <div style={{ 
                            background: "#FAFBFC", borderRadius: "0 0 14px 14px", border: "1.5px solid #E2E8F0", 
                            borderTop: "none", padding: "0 18px 18px", animation: "fadeUp .25s ease" 
                          }}>
                            <div style={{ height: 1, background: "#F1F5F9", margin: "0 -18px 14px" }} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div>
                                <div style={{ fontSize: ".62rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>
                                  Détails de l'examen
                                </div>
                                {[
                                  ["Modalité", `${md.icon} ${md.full}`], 
                                  ["Organe", md.organ], 
                                  ["Date", formatDate(c.created_at)], 
                                  ...(c.doctor_name ? [["Médecin", `Dr. ${c.doctor_name}`]] : [])
                                ].map(([l, v]) => (
                                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F1F5F9" }}>
                                    <span style={{ fontSize: ".73rem", color: "#94A3B8" }}>{l}</span>
                                    <span style={{ fontSize: ".75rem", color: "#0A2647", fontWeight: 600, textAlign: "right" }}>{v}</span>
                                  </div>
                                ))}
                                {c.patient_notes && (
                                  <div style={{ marginTop: 10 }}>
                                    <div style={{ fontSize: ".62rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>
                                      Vos symptômes
                                    </div>
                                    <div style={{ padding: "8px 10px", background: "white", border: "1px solid #F1F5F9", borderRadius: 8, fontSize: ".78rem", color: "#475569", lineHeight: 1.6, fontStyle: "italic" }}>
                                      « {c.patient_notes}»
                                    </div>
                                  </div>
                                )}
                              </div>
                              {(c.status === "analyzed" || c.status === "closed") && pd ? (
                                <div>
                                  <div style={{ fontSize: ".62rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>
                                    Résultat IA
                                  </div>
                                  <div style={{ 
                                    padding: "12px", borderRadius: 10, 
                                    background: pd.severity === "none" ? "#F0FDF4" : pd.severity === "low" ? "#FFFBEB" : pd.severity === "medium" ? "#FFF7ED" : "#FEF2F2", 
                                    border: `1px solid ${pd.color}33`, marginBottom: 10 
                                  }}>
                                    <div style={{ fontSize: ".66rem", fontWeight: 700, color: "#94A3B8", marginBottom: 3 }}>Diagnostic principal</div>
                                    <div style={{ fontSize: "1rem", fontWeight: 800, color: pd.color, marginBottom: 5 }}>{pd.fr}</div>
                                    {c.confidence != null && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ flex: 1, height: 5, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                                          <div style={{ 
                                            width: `${c.confidence * 100}%`, height: "100%", 
                                            background: c.confidence > .8 ? "#059669" : c.confidence > .5 ? "#F59E0B" : "#DC2626", 
                                            borderRadius: 3, transition: "width .6s ease" 
                                          }} />
                                        </div>
                                        <span style={{ fontSize: ".76rem", fontWeight: 800, color: "#0A2647" }}>{(c.confidence * 100).toFixed(1)}%</span>
                                      </div>
                                    )}
                                  </div>
                                  {c.doctor_notes && (
                                    <div style={{ padding: "10px", background: "white", border: "1px solid #BBF7D0", borderRadius: 8, marginBottom: 10 }}>
                                      <div style={{ fontSize: ".62rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>
                                        🩺 Commentaire médecin
                                      </div>
                                      <div style={{ fontSize: ".78rem", color: "#166534", lineHeight: 1.6 }}>{c.doctor_notes}</div>
                                    </div>
                                  )}
                                  <div style={{ 
                                    padding: "7px 10px", borderRadius: 8, 
                                    background: pd.severity === "none" ? "#F0FDF4" : "#FEF2F2", 
                                    fontSize: ".7rem", fontWeight: 700, 
                                    color: pd.severity === "none" ? "#059669" : "#DC2626", 
                                    display: "flex", alignItems: "center", gap: 6 
                                  }}>
                                    {pd.severity === "none" ? "🟢" : pd.severity === "low" ? "🟡" : pd.severity === "medium" ? "🟠" : "🔴"}
                                    {pd.severity === "none" 
                                      ? "Aucune anomalie détectée" 
                                      : pd.severity === "low" 
                                        ? "Anomalie mineure — surveillance" 
                                        : pd.severity === "medium" 
                                          ? "Anomalie modérée — consultation conseillée" 
                                          : "Anomalie significative — consultation urgente"}
                                  </div>
                                </div>
                              ) : c.status === "pending" || c.status === "accepted" ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", textAlign: "center" }}>
                                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: `${st.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: 10 }}>
                                    {c.status === "pending" ? "⏳" : "🩺"}
                                  </div>
                                  <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#0A2647", marginBottom: 3 }}>
                                    {c.status === "pending" ? "En attente" : "Pris en charge"}
                                  </div>
                                  <div style={{ fontSize: ".73rem", color: "#94A3B8", lineHeight: 1.5 }}>
                                    {c.status === "pending" ? "Un médecin sera notifié." : "L'analyse IA va démarrer."}
                                  </div>
                                </div>
                              ) : c.status === "rejected" ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", textAlign: "center" }}>
                                  <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>❌</div>
                                  <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#DC2626", marginBottom: 8 }}>Demande non traitée</div>
                                  <button 
                                    onClick={e => { e.stopPropagation(); navigate("/patient/consultation/new"); }} 
                                    style={{ padding: "7px 14px", background: "#0A2647", border: "none", borderRadius: 8, color: "white", fontSize: ".76rem", fontWeight: 700, cursor: "pointer" }}
                                  >
                                    Nouvelle demande
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            {(c.status === "analyzed" || c.status === "accepted" || c.status === "closed") && (
                              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                                <button 
                                  onClick={e => { e.stopPropagation(); navigate(`/consultation/${c.id}`); }} 
                                  style={{ 
                                    padding: "9px 20px", 
                                    background: c.status === "analyzed" ? "linear-gradient(135deg,#059669,#047857)" : c.status === "accepted" ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : "#F8FAFC", 
                                    border: c.status === "closed" ? "1.5px solid #E2E8F0" : "none", 
                                    borderRadius: 10, 
                                    color: c.status === "closed" ? "#475569" : "white", 
                                    fontSize: ".8rem", 
                                    fontWeight: 700, 
                                    cursor: "pointer", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: 8, 
                                    boxShadow: c.status !== "closed" ? "0 4px 12px rgba(0,0,0,.1)" : "none", 
                                    transition: "all .15s" 
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"} 
                                  onMouseLeave={e => e.currentTarget.style.transform = ""}
                                >
                                  {c.status === "analyzed" ? "🧬 Voir le résultat complet" : c.status === "accepted" ? "💬 Ouvrir la consultation" : "📋 Voir le dossier"} →
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* ═══════ RIGHT SIDEBAR ═══════ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Quick submit */}
              <div style={{ background: "linear-gradient(135deg,#0A2647,#205295)", borderRadius: 16, padding: "20px", color: "white", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: ".62rem", fontWeight: 700, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Nouvel examen</div>
                  <div style={{ fontSize: ".95rem", fontWeight: 800, marginBottom: 5, lineHeight: 1.4 }}>Soumettre une image médicale</div>
                  <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.55)", lineHeight: 1.5, marginBottom: 14 }}>IRM, Scanner ou Radio — diagnostic assisté par IA.</div>
                  <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
                    {Object.values(MODEL_MED).map(m => (
                      <span key={m.label} style={{ padding: "2px 7px", borderRadius: 5, fontSize: ".68rem", background: "rgba(255,255,255,.1)", fontWeight: 600 }}>{m.icon}</span>
                    ))}
                  </div>
                  <button 
                    onClick={() => navigate("/patient/consultation/new")} 
                    style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, color: "white", fontSize: ".8rem", fontWeight: 700, cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.22)"} 
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
                  >
                    Commencer →
                  </button>
                </div>
              </div>

              {/* Modalités */}
              <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: ".62rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>
                  Modalités disponibles
                </div>
                {Object.entries(MODEL_MED).map(([k, m]) => {
                  const cnt = consultations.filter(c => c.model_key === k).length;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>{m.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#0A2647" }}>{m.label}</div>
                        <div style={{ fontSize: ".66rem", color: "#94A3B8" }}>{m.organ} · {m.modality}</div>
                      </div>
                      {cnt > 0 && (
                        <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: ".63rem", fontWeight: 700, background: "#F1F5F9", color: "#64748B" }}>{cnt}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Guide */}
              <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: ".62rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>
                  Comprendre vos résultats
                </div>
                {[
                  { ic: "🟢", l: "Normal", d: "Aucune anomalie détectée.", c: "#059669" },
                  { ic: "🟡", l: "Mineure", d: "Surveillance recommandée.", c: "#D97706" },
                  { ic: "🟠", l: "Modérée", d: "Consultation conseillée.", c: "#EA580C" },
                  { ic: "🔴", l: "Significative", d: "Consultation urgente.", c: "#DC2626" },
                ].map(i => (
                  <div key={i.l} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 0", borderBottom: "1px solid #F8FAFC" }}>
                    <span style={{ fontSize: ".8rem", flexShrink: 0 }}>{i.ic}</span>
                    <div>
                      <div style={{ fontSize: ".72rem", fontWeight: 700, color: i.c }}>{i.l}</div>
                      <div style={{ fontSize: ".66rem", color: "#94A3B8", lineHeight: 1.4 }}>{i.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              {consultations.length > 0 && (
                <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: ".62rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>
                    Activité récente
                  </div>
                  {consultations.slice(0, 4).map((c, i) => {
                    const st = STATUS_MED[c.status] || STATUS_MED.pending;
                    const md = MODEL_MED[c.model_key];
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => navigate(`/consultation/${c.id}`)} 
                        style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 0", cursor: "pointer", borderBottom: i < 3 ? "1px solid #F8FAFC" : "none" }}
                      >
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: ".73rem", fontWeight: 600, color: "#0A2647", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {md?.icon} #{c.id} — {md?.label}
                          </div>
                        </div>
                        <div style={{ fontSize: ".63rem", color: "#CBD5E1", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {timeSince(c.updated_at || c.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <div style={{ fontSize: ".68rem", fontWeight: 800, color: "#92400E", marginBottom: 3 }}>⚕️ Avertissement médical</div>
                <div style={{ fontSize: ".66rem", color: "#A16207", lineHeight: 1.6 }}>
                  Les résultats IA sont des <strong>aides au diagnostic</strong> et ne remplacent pas l'avis d'un professionnel de santé. Urgence : <strong>15 (SAMU)</strong> ou <strong>112</strong>.
                </div>
              </div>

              {/* Privacy */}
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                <div style={{ fontSize: ".66rem", color: "#0369A1", lineHeight: 1.5, display: "flex", gap: 5 }}>
                  <span>🔒</span>
                  <span>Données chiffrées. Accès réservé aux médecins assignés à votre dossier.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div style={{ marginTop: 28, padding: "16px 0", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: ".8rem" }}>⚕️</span>
              <span style={{ fontSize: ".68rem", color: "#94A3B8" }}>MedAI — Diagnostic assisté par intelligence artificielle</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {["Conditions", "Confidentialité", "Contact"].map(l => (
                <span key={l} style={{ fontSize: ".65rem", color: "#94A3B8", cursor: "pointer", fontWeight: 500 }}>{l}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}