// PatientDashboard.jsx — Dashboard Patient Ultra-Complet
// Pages: Accueil (avec stats/graphes), Dossiers médicaux, Rendez-vous, Messagerie, 
// Médecins (carte géo interactive), Vidéo, Chatbot IA, Historique détaillé

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────

const MODEL_META = {
  brain:  { icon: "🧠", label: "IRM Cérébrale",        color: "#7C3AED", bg: "#F5F3FF" },
  lung:   { icon: "🔬", label: "Scanner CT Pulmonaire", color: "#DC2626", bg: "#FEF2F2" },
  chest:  { icon: "🫁", label: "Radio Thoracique",      color: "#0369A1", bg: "#F0F9FF" },
  retina: { icon: "👁️", label: "Fond d'œil",           color: "#0E7490", bg: "#ECFEFF" },
};

const STATUS_CFG = {
  pending:  { label: "En attente",      color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B", icon: "⏳" },
  accepted: { label: "Pris en charge",  color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6", icon: "🩺" },
  analyzed: { label: "Résultat prêt",   color: "#059669", bg: "#ECFDF5", dot: "#10B981", icon: "🧬" },
  closed:   { label: "Terminée",        color: "#4B5563", bg: "#F9FAFB", dot: "#6B7280", icon: "✅" },
  rejected: { label: "Rejetée",         color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444", icon: "✕"  },
};

const URGENCY_CFG = {
  critical: { label: "Critique", color: "#DC2626", bg: "#FEF2F2" },
  urgent:   { label: "Urgent",   color: "#EA580C", bg: "#FFF7ED" },
  normal:   { label: "Normal",   color: "#059669", bg: "#F0FDF4" },
};

const SPEC_ICONS = {
  "Neurologue": "🧠", "Neurochirurgien": "🧠",
  "Pneumologue": "🫁", "Oncologue": "🔬", "Radiologue": "⚡",
  "Cardiologue": "❤️", "Infectiologue": "🦠",
  "Ophtalmologue": "👁️",
};

const NOTIF_ICONS = {
  new_consultation: "📋", consultation_accepted: "🩺", consultation_rejected: "❌",
  analysis_ready: "🧬", appointment_scheduled: "📅", consultation_closed: "📋",
  new_message: "💬", doctor_changed: "🔄",
};

// ─────────────────────────────────────────────────────────────────
// GÉOLOCALISATION HAVERSINE
// ─────────────────────────────────────────────────────────────────

const CITY_COORDS = {
  "Tunis": [36.8065, 10.1815], "Sfax": [34.7398, 10.7600],
  "Sousse": [35.8254, 10.6369], "Ariana": [36.8625, 10.1956],
  "Bizerte": [37.2744, 9.8739], "Monastir": [35.7643, 10.8113],
  "Nabeul": [36.4561, 10.7376], "Ben Arous": [36.7533, 10.2282],
  "Manouba": [36.8101, 10.0956], "Kairouan": [35.6781, 10.0963],
  "Gabès": [33.8815, 10.0982], "Mahdia": [35.5047, 11.0622],
  "Gafsa": [34.4250, 8.7842], "Béja": [36.7256, 9.1817],
  "La Marsa": [36.8783, 10.3247], "Hammam Lif": [36.6661, 10.3145],
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

function fmtDist(km) {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// ─────────────────────────────────────────────────────────────────
// MINI COMPONENTS
// ─────────────────────────────────────────────────────────────────

function Spinner({ size = 28, color = "#0A2647" }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid #E2E8F0`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin .8s linear infinite",
      flexShrink: 0,
    }} />
  );
}

function Badge({ label, color, bg, icon }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6,
      background: bg, color, fontSize: ".65rem", fontWeight: 700,
    }}>
      {icon && <span>{icon}</span>}{label}
    </span>
  );
}

function EmptyState({ icon, title, desc, cta, onCta }) {
  return (
    <div style={{
      textAlign: "center", padding: "60px 20px",
      background: "white", borderRadius: 16, border: "1px dashed #E2E8F0",
    }}>
      <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: ".95rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: ".8rem", color: "#94A3B8", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>{desc}</div>
      {cta && onCta && (
        <button onClick={onCta} style={S.btn}>{cta}</button>
      )}
    </div>
  );
}

function QueryStatus({ loading, error, data, children, empty, isEmpty }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 4px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ ...S.card, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", opacity: 0.7 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "#F1F5F9", animation: "skeleton 1.5s ease-in-out infinite" }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, width: "60%", background: "#F1F5F9", borderRadius: 6, marginBottom: 8, animation: "skeleton 1.5s ease-in-out infinite" }} />
              <div style={{ height: 8, width: "80%", background: "#F1F5F9", borderRadius: 4, animation: "skeleton 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: "20px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, color: "#DC2626", textAlign: "center" }}>
        <div style={{fontSize:"1.5rem", marginBottom:8}}>⚠️</div>
        <div style={{fontWeight:700, marginBottom:4}}>Une erreur est survenue</div>
        <div style={{fontSize:".8rem"}}>{error}</div>
      </div>
    );
  }
  if (isEmpty && empty) {
    return empty;
  }
  return children;
}

// ─────────────────────────────────────────────────────────────────
// GRAPHIQUES SVG SIMPLES
// ─────────────────────────────────────────────────────────────────

function DonutChart({ data, size = 160, thickness = 24 }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
        <div style={{ textAlign: "center", color: "#CBD5E1" }}>
          <div style={{ fontSize: "1.5rem" }}>📊</div>
          <div style={{ fontSize: ".7rem" }}>Aucune donnée</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {data.map((item, i) => {
          const percentage = item.value / total;
          const dash = circumference * percentage;
          const style = {
            strokeDasharray: `${dash} ${circumference - dash}`,
            strokeDashoffset: -offset,
            transition: "stroke-dashoffset .5s ease",
          };
          offset += dash;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={thickness}
              style={style}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0A2647" }}>{total}</div>
        <div style={{ fontSize: ".6rem", color: "#94A3B8" }}>Total</div>
      </div>
    </div>
  );
}

function BarChart({ data, height = 120 }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height, paddingTop: 8 }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
          <div style={{
            width: "100%",
            height: `${(item.value / maxVal) * 100}%`,
            background: item.color || "#0A2647",
            borderRadius: "6px 6px 0 0",
            transition: "height .5s ease",
            minHeight: 4,
            position: "relative",
          }}>
            <span style={{
              position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
              fontSize: ".65rem", fontWeight: 700, color: "#0A2647",
            }}>{item.value}</span>
          </div>
          <div style={{ fontSize: ".58rem", color: "#94A3B8", marginTop: 6, fontWeight: 600, textAlign: "center" }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────────

const S = {
  btn: {
    padding: "10px 22px", background: "linear-gradient(135deg,#0A2647,#1B3B6F)",
    border: "none", borderRadius: 10, color: "white",
    fontSize: ".85rem", fontWeight: 700, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6, transition: "all .2s ease",
  },
  btnSm: {
    padding: "6px 14px", background: "linear-gradient(135deg,#0A2647,#1B3B6F)",
    border: "none", borderRadius: 8, color: "white",
    fontSize: ".75rem", fontWeight: 700, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 4, transition: "all .2s ease",
  },
  btnOutline: {
    padding: "8px 16px", background: "white",
    border: "1.5px solid #E2E8F0", borderRadius: 9, color: "#0A2647",
    fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 4, transition: "all .2s ease",
  },
  btnSuccess: {
    padding: "8px 16px", background: "linear-gradient(135deg,#059669,#047857)",
    border: "none", borderRadius: 9, color: "white",
    fontSize: ".8rem", fontWeight: 700, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 4, transition: "all .2s ease",
  },
  card: {
    background: "white", borderRadius: 16,
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(10,38,71,.05)",
    transition: "all .2s ease",
  },
  input: {
    width: "100%", padding: "10px 14px",
    background: "#F8FAFC", border: "1.5px solid #E2E8F0",
    borderRadius: 10, fontSize: ".85rem", color: "#0A2647",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "all .15s ease",
  },
  textarea: {
    width: "100%", padding: "10px 14px",
    background: "#F8FAFC", border: "1.5px solid #E2E8F0",
    borderRadius: 10, fontSize: ".85rem", color: "#0A2647",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    resize: "vertical", transition: "all .15s ease",
  },
};

// ─────────────────────────────────────────────────────────────────
// SIDEBAR NAVIGATION (Ajout du Chatbot)
// ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "home",         icon: "🏠", label: "Accueil" },
  { id: "dossiers",     icon: "📋", label: "Mes dossiers" },
  { id: "upload",       icon: "📤", label: "Nouveau dossier" },
  { id: "appointments", icon: "📅", label: "Rendez-vous" },
  { id: "messages",     icon: "💬", label: "Messagerie" },
  { id: "doctors",      icon: "🗺️", label: "Trouver un médecin" },
  { id: "video",        icon: "📹", label: "Consultation vidéo" },
  { id: "chatbot",      icon: "🤖", label: "Assistant IA" },
];

function Sidebar({ activePage, onNavigate, unreadCount, user }) {
  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: "linear-gradient(180deg,#0A2647 0%,#0D2E56 100%)",
      display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,.08)",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "rgba(255,255,255,.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.2rem",
          }}>⚕️</div>
          <div>
            <div style={{ fontSize: ".95rem", fontWeight: 800, color: "white", letterSpacing: "-.01em" }}>
              Med<span style={{ color: "#38BDF8" }}>AI</span>
            </div>
            <div style={{ fontSize: ".6rem", color: "rgba(255,255,255,.35)", letterSpacing: ".08em", textTransform: "uppercase" }}>
              Espace Patient
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "linear-gradient(135deg,#2D5F9E,#38BDF8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 800, fontSize: "1rem", marginBottom: 8,
        }}>
          {(user?.full_name || "P").charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: ".82rem", fontWeight: 700, color: "white" }}>
          {user?.full_name || "Patient"}
        </div>
        <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,.35)", marginTop: 2, fontFamily: "monospace" }}>
          PAT-{String(user?.id || 0).padStart(4, "0")}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "10px 10px" }}>
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 2,
                border: "none", cursor: "pointer", textAlign: "left",
                background: isActive ? "rgba(56,189,248,.15)" : "transparent",
                color: isActive ? "#38BDF8" : "rgba(255,255,255,.55)",
                fontWeight: isActive ? 700 : 500,
                fontSize: ".82rem", transition: "all .15s",
                position: "relative",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {isActive && (
                <div style={{
                  position: "absolute", left: 0, top: "20%", bottom: "20%",
                  width: 3, borderRadius: "0 3px 3px 0", background: "#38BDF8",
                }} />
              )}
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "messages" && unreadCount > 0 && (
                <span style={{
                  marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9,
                  background: "#EF4444", color: "white",
                  fontSize: ".6rem", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 5px",
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ fontSize: ".62rem", color: "rgba(255,255,255,.2)", textAlign: "center" }}>
          En cas d'urgence : <strong style={{ color: "#EF4444" }}>15 (SAMU)</strong>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE: ACCUEIL AVEC GRAPHIQUES
// ─────────────────────────────────────────────────────────────────

function PageHome({ consultations, notifications, unreadCount, onNavigate, user }) {
  const navigate = useNavigate();
  const pending = consultations.filter(c => c.status === "pending").length;
  const analyzed = consultations.filter(c => c.status === "analyzed").length;
  const critical = consultations.filter(c => c.urgency === "critical" && c.status === "analyzed");
  const closed = consultations.filter(c => c.status === "closed").length;
  const accepted = consultations.filter(c => c.status === "accepted").length;

  const formatDate = d => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—";
  const timeSince = d => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
    return `Il y a ${Math.floor(diff/86400)}j`;
  };

  // Données pour les graphiques
  const donutData = [
    { label: "En attente", value: pending, color: "#F59E0B" },
    { label: "En cours", value: accepted, color: "#3B82F6" },
    { label: "Résultats", value: analyzed, color: "#10B981" },
    { label: "Terminés", value: closed, color: "#6B7280" },
  ];

  // Données mensuelles simulées
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
    return months.map((m, i) => ({
      label: m,
      value: consultations.filter(c => {
        const d = new Date(c.created_at);
        return d.getMonth() === i;
      }).length,
      color: "#0A2647"
    }));
  }, [consultations]);

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", letterSpacing: "-.02em" }}>
          Bonjour, {(user?.full_name || "Patient").split(" ")[0]} 👋
        </div>
        <div style={{ fontSize: ".85rem", color: "#64748B", marginTop: 4 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Alert critique */}
      {critical.length > 0 && (
        <div style={{
          marginBottom: 24, padding: "16px 20px",
          background: "#FEF2F2", border: "1.5px solid #FECACA",
          borderRadius: 14, display: "flex", alignItems: "center", gap: 14,
          animation: "fadeUp .3s ease",
        }}>
          <div style={{ fontSize: "1.5rem", animation: "alertPulse 1.5s infinite" }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#991B1B" }}>
              {critical.length} résultat{critical.length > 1 ? "s" : ""} urgent{critical.length > 1 ? "s" : ""} — consultez un médecin
            </div>
            <div style={{ fontSize: ".75rem", color: "#B91C1C", marginTop: 2 }}>
              Dossier{critical.length > 1 ? "s" : ""} #{critical.map(c => c.id).join(", #")}
            </div>
          </div>
          <button onClick={() => onNavigate("dossiers")} style={S.btnSm}>
            Voir →
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { l: "Total dossiers", v: consultations.length, ic: "📋", color: "#0A2647", bg: "#F8FAFC" },
          { l: "En attente",     v: pending,               ic: "⏳", color: "#D97706", bg: "#FFFBEB" },
          { l: "Résultats",      v: analyzed,              ic: "🧬", color: "#059669", bg: "#ECFDF5" },
          { l: "Terminées",      v: closed,                ic: "✅", color: "#0369A1", bg: "#F0F9FF" },
        ].map(s => (
          <div key={s.l} style={{ ...S.card, padding: "18px 20px", overflow: "hidden", position: "relative", cursor: "pointer" }}
            onClick={() => onNavigate("dossiers")}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.v}</div>
                <div style={{ fontSize: ".72rem", color: "#64748B", fontWeight: 600, marginTop: 2 }}>{s.l}</div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>{s.ic}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Donut chart */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#0A2647", marginBottom: 16 }}>
            📊 Répartition des dossiers
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <DonutChart data={donutData} size={160} thickness={24} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {donutData.map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                  <span style={{ fontSize: ".7rem", color: "#64748B", flex: 1 }}>{d.label}</span>
                  <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#0A2647" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#0A2647", marginBottom: 16 }}>
            📈 Évolution mensuelle
          </div>
          <BarChart data={monthlyData} height={140} />
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Recent activity */}
        <div style={S.card}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0A2647" }}>Dossiers récents</div>
            <button onClick={() => onNavigate("dossiers")} style={{ background: "none", border: "none", color: "#2563EB", fontSize: ".75rem", fontWeight: 700, cursor: "pointer" }}>Voir tout →</button>
          </div>
          <div>
            {consultations.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: ".85rem" }}>Aucun dossier médical</div>
                <button onClick={() => onNavigate("upload")} style={{ ...S.btnSm, marginTop: 12 }}>
                  Soumettre un dossier
                </button>
              </div>
            ) : consultations.slice(0, 5).map((c, i) => {
              const st = STATUS_CFG[c.status] || STATUS_CFG.pending;
              const md = MODEL_META[c.model_key] || MODEL_META.chest;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/consultation/${c.id}`)}
                  style={{ padding: "14px 20px", borderBottom: i < 4 ? "1px solid #F8FAFC" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: md.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                    {md.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#0A2647" }}>
                      #{c.id} — {md.label}
                    </div>
                    <div style={{ fontSize: ".7rem", color: "#94A3B8", display: "flex", gap: 6, alignItems: "center" }}>
                      <span>{formatDate(c.created_at)}</span>
                      {c.doctor_name && <><span>·</span><span>Dr. {c.doctor_name}</span></>}
                    </div>
                  </div>
                  <Badge label={st.label} color={st.color} bg={st.bg} icon={st.icon} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions + notifications */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Quick actions */}
          <div style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#0A2647", marginBottom: 12 }}>Actions rapides</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { ic: "📤", l: "Soumettre une image médicale", page: "upload", color: "#0A2647" },
                { ic: "🤖", l: "Parler à l'Assistant IA",     page: "chatbot", color: "#7C3AED" },
                { ic: "💬", l: "Contacter mon médecin",         page: "messages", color: "#7C3AED" },
                { ic: "🗺️", l: "Trouver un spécialiste proche", page: "doctors", color: "#059669" },
              ].map(a => (
                <button
                  key={a.page}
                  onClick={() => onNavigate(a.page)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 9,
                    background: "#F8FAFC", border: "1px solid #E2E8F0",
                    cursor: "pointer", textAlign: "left", transition: "all .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#F8FAFC"; }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{a.ic}</span>
                  <span style={{ fontSize: ".78rem", fontWeight: 600, color: "#0A2647" }}>{a.l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent notifications */}
          <div style={{ ...S.card, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#0A2647" }}>Notifications</div>
              {unreadCount > 0 && <span style={{ padding: "1px 7px", borderRadius: 6, background: "#EF4444", color: "white", fontSize: ".62rem", fontWeight: 700 }}>{unreadCount}</span>}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#CBD5E1", fontSize: ".78rem" }}>Aucune notification</div>
            ) : notifications.slice(0, 4).map((n, i) => (
              <div key={n.id} style={{
                padding: "10px 18px", borderBottom: i < 3 ? "1px solid #F8FAFC" : "none",
                background: n.is_read ? "white" : "#F0F9FF",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: n.is_read ? "#F1F5F9" : "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", flexShrink: 0 }}>
                  {NOTIF_ICONS[n.type] || "📌"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".73rem", fontWeight: 700, color: "#0A2647", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</div>
                  <div style={{ fontSize: ".65rem", color: "#CBD5E1" }}>{timeSince(n.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE: DOSSIERS MÉDICAUX AVEC HISTORIQUE DÉTAILLÉ ET TÉLÉCHARGEMENT
// ─────────────────────────────────────────────────────────────────

function PageDossiers({ consultations, onNavigate }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const filtered = consultations.filter(c => filter === "all" || c.status === filter)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const formatDate = d => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // Simuler l'historique d'un dossier
  const getDossierHistory = useCallback((consultation) => {
    const history = [
      { date: consultation.created_at, action: "Dossier créé", icon: "📤", detail: "Image médicale soumise" },
    ];
    if (consultation.status !== "pending") {
      history.push({
        date: new Date(new Date(consultation.created_at).getTime() + 3600000).toISOString(),
        action: "Pris en charge",
        icon: "🩺",
        detail: consultation.doctor_name ? `Dr. ${consultation.doctor_name}` : "Médecin assigné"
      });
    }
    if (consultation.status === "analyzed" || consultation.status === "closed") {
      history.push({
        date: new Date(new Date(consultation.created_at).getTime() + 7200000).toISOString(),
        action: "Analyse IA terminée",
        icon: "🧬",
        detail: consultation.prediction || "Résultat disponible"
      });
    }
    if (consultation.status === "closed") {
      history.push({
        date: new Date(new Date(consultation.created_at).getTime() + 86400000).toISOString(),
        action: "Dossier clôturé",
        icon: "✅",
        detail: "Traitement terminé"
      });
    }
    return history;
  }, []);

  // Simuler le téléchargement du rapport PDF
  const handleDownloadReport = async (consultation) => {
    setDownloading(consultation.id);
    // Simulation d'un téléchargement
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Créer un rapport textuel simple
    const md = MODEL_META[consultation.model_key] || MODEL_META.chest;
    const st = STATUS_CFG[consultation.status] || STATUS_CFG.pending;
    const ur = URGENCY_CFG[consultation.urgency] || URGENCY_CFG.normal;
    
    const reportContent = `
╔══════════════════════════════════════════╗
║     RAPPORT MÉDICAL - MedAI              ║
╠══════════════════════════════════════════╣
║ Référence : REF-${String(consultation.id).padStart(4, '0')}
║ Date : ${formatDate(consultation.created_at)}
║ Type d'examen : ${md.label}
║ Statut : ${st.label}
║ Urgence : ${ur.label}
║ Médecin : ${consultation.doctor_name ? `Dr. ${consultation.doctor_name}` : 'Non assigné'}
╠══════════════════════════════════════════╣
${consultation.prediction ? `║ RÉSULTAT IA : ${consultation.prediction}
║ Confiance : ${consultation.confidence ? (consultation.confidence * 100).toFixed(1) + '%' : 'N/A'}
╠══════════════════════════════════════════╣` : ''}
${consultation.doctor_notes ? `║ CONSEILS DU MÉDECIN :
║ ${consultation.doctor_notes}
╠══════════════════════════════════════════╣` : ''}
║ Patient : ${consultation.patient_name || 'Patient'}
║ Symptômes : ${consultation.patient_notes || 'Non spécifiés'}
╚══════════════════════════════════════════╝
    `.trim();

    // Télécharger comme fichier texte
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-medical-${consultation.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setDownloading(null);
  };

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647" }}>Mes dossiers médicaux</div>
          <div style={{ fontSize: ".8rem", color: "#64748B", marginTop: 2 }}>{consultations.length} dossier{consultations.length !== 1 ? "s" : ""} au total</div>
        </div>
        <button onClick={() => onNavigate("upload")} style={S.btn}>
          + Nouveau dossier
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { k: "all", l: "Tous" },
          { k: "pending", l: "⏳ En attente" },
          { k: "accepted", l: "🩺 Pris en charge" },
          { k: "analyzed", l: "🧬 Résultats" },
          { k: "closed", l: "✅ Terminés" },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            padding: "7px 14px", borderRadius: 8, fontSize: ".75rem", fontWeight: 700,
            background: filter === f.k ? "#0A2647" : "white",
            color: filter === f.k ? "white" : "#64748B",
            border: filter === f.k ? "none" : "1px solid #E2E8F0",
            cursor: "pointer", transition: "all .15s ease",
          }}>{f.l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" title="Aucun dossier" desc="Soumettez votre première image médicale pour commencer." cta="Soumettre un dossier" onCta={() => onNavigate("upload")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((c, idx) => {
            const st = STATUS_CFG[c.status] || STATUS_CFG.pending;
            const md = MODEL_META[c.model_key] || MODEL_META.chest;
            const ur = URGENCY_CFG[c.urgency] || URGENCY_CFG.normal;
            const isExp = expanded === c.id;
            const history = getDossierHistory(c);
            const isDownloading = downloading === c.id;
            return (
              <div key={c.id} style={{ ...S.card, overflow: "hidden", animation: `fadeUp .3s ease ${idx * 40}ms both` }}>
                <div style={{ height: 3, background: st.dot }} />
                <div
                  onClick={() => setExpanded(isExp ? null : c.id)}
                  style={{ padding: "16px 20px", cursor: "pointer", display: "flex", gap: 14, alignItems: "center" }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: md.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                    {md.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: ".68rem", color: "#94A3B8", fontFamily: "monospace" }}>REF-{String(c.id).padStart(4,"0")}</span>
                      <Badge label={st.label} color={st.color} bg={st.bg} icon={st.icon} />
                      {c.urgency && c.urgency !== "normal" && c.status !== "pending" && (
                        <Badge label={ur.label} color={ur.color} bg={ur.bg} />
                      )}
                    </div>
                    <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0A2647" }}>{md.label}</div>
                    <div style={{ fontSize: ".72rem", color: "#94A3B8", marginTop: 2 }}>
                      {formatDate(c.created_at)}{c.doctor_name && ` · Dr. ${c.doctor_name}`}
                    </div>
                  </div>
                  <div style={{ color: "#CBD5E1", transform: isExp ? "rotate(180deg)" : "", transition: "transform .2s" }}>▼</div>
                </div>

                {isExp && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F1F5F9", animation: "fadeUp .2s ease" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, paddingTop: 16 }}>
                      {/* Info */}
                      <div>
                        {[
                          ["Modalité", md.label],
                          ["Médecin", c.doctor_name ? `Dr. ${c.doctor_name}` : "Non assigné"],
                          ["Date", formatDate(c.created_at)],
                          ["Statut", st.label],
                          ["Urgence", ur.label],
                        ].map(([l, v]) => (
                          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F8FAFC" }}>
                            <span style={{ fontSize: ".73rem", color: "#94A3B8" }}>{l}</span>
                            <span style={{ fontSize: ".75rem", color: "#0A2647", fontWeight: 600 }}>{v}</span>
                          </div>
                        ))}
                        {c.patient_notes && (
                          <div style={{ marginTop: 10, padding: "10px 12px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A" }}>
                            <div style={{ fontSize: ".62rem", fontWeight: 700, color: "#92400E", marginBottom: 3 }}>Vos notes</div>
                            <div style={{ fontSize: ".75rem", color: "#78350F", fontStyle: "italic" }}>« {c.patient_notes} »</div>
                          </div>
                        )}
                      </div>
                      {/* Result or status */}
                      <div>
                        {(c.status === "analyzed" || c.status === "closed") ? (
                          <div style={{ padding: "14px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                            <div style={{ fontSize: ".62rem", fontWeight: 700, color: "#059669", marginBottom: 6 }}>RÉSULTAT IA</div>
                            {c.prediction && (
                              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0A2647", marginBottom: 8 }}>{c.prediction}</div>
                            )}
                            {c.confidence && (
                              <div>
                                <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                                  <div style={{ width: `${c.confidence * 100}%`, height: "100%", background: "#059669", borderRadius: 3 }} />
                                </div>
                                <div style={{ fontSize: ".68rem", color: "#64748B", marginTop: 4 }}>{(c.confidence * 100).toFixed(1)}% de confiance</div>
                              </div>
                            )}
                            {/* Conseils du médecin */}
                            {c.doctor_notes && (
                              <div style={{
                                marginTop: 12, padding: "10px 12px",
                                background: "#F0F9FF", borderRadius: 8,
                                border: "1px solid #BAE6FD"
                              }}>
                                <div style={{ fontSize: ".62rem", fontWeight: 700, color: "#0369A1", marginBottom: 4 }}>
                                  💡 CONSEILS DU MÉDECIN
                                </div>
                                <div style={{ fontSize: ".73rem", color: "#0C4A6E", lineHeight: 1.5 }}>
                                  {c.doctor_notes}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ padding: "14px", borderRadius: 12, background: `${st.bg}`, border: `1px solid ${st.dot}33`, textAlign: "center" }}>
                            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{st.icon}</div>
                            <div style={{ fontSize: ".82rem", fontWeight: 700, color: st.color, marginBottom: 4 }}>{st.label}</div>
                            <div style={{ fontSize: ".72rem", color: "#94A3B8", lineHeight: 1.5 }}>
                              {c.status === "pending" ? "Un médecin va prendre en charge votre dossier." : "L'analyse IA va démarrer."}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Historique */}
                    <div style={{ marginTop: 16 }}>
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        style={{
                          ...S.btnOutline,
                          fontSize: ".72rem",
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        📜 {showHistory ? "Masquer" : "Afficher"} l'historique du dossier
                      </button>
                      
                      {showHistory && (
                        <div style={{ marginTop: 12, padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                          <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#0A2647", marginBottom: 10 }}>
                            Historique des événements
                          </div>
                          <div style={{ position: "relative", paddingLeft: 20 }}>
                            <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 2, background: "#E2E8F0" }} />
                            {history.map((h, i) => (
                              <div key={i} style={{ position: "relative", marginBottom: 16, paddingLeft: 16 }}>
                                <div style={{
                                  position: "absolute", left: -24, top: 2,
                                  width: 18, height: 18, borderRadius: "50%",
                                  background: "white", border: "2px solid #0EA5E9",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: ".55rem",
                                }}>
                                  {h.icon}
                                </div>
                                <div style={{ fontSize: ".73rem", fontWeight: 600, color: "#0A2647" }}>{h.action}</div>
                                <div style={{ fontSize: ".65rem", color: "#64748B", marginTop: 1 }}>{h.detail}</div>
                                <div style={{ fontSize: ".6rem", color: "#94A3B8", marginTop: 2 }}>{formatDate(h.date)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {(c.status === "analyzed" || c.status === "closed") && (
                        <button
                          onClick={() => handleDownloadReport(c)}
                          disabled={isDownloading}
                          style={{
                            ...S.btnSuccess,
                            opacity: isDownloading ? 0.7 : 1,
                          }}
                        >
                          {isDownloading ? (
                            <><Spinner size={14} color="white" /> Téléchargement…</>
                          ) : (
                            <>📥 Télécharger le rapport</>
                          )}
                        </button>
                      )}
                      <button onClick={() => navigate(`/consultation/${c.id}`)} style={S.btn}>
                        Ouvrir le dossier →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE: CHATBOT IA
// ─────────────────────────────────────────────────────────────────

function PageChatbot({ token, consultations, user }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      sender: "bot",
      content: `Bonjour ${user?.full_name?.split(" ")[0] || "Patient"} ! 👋 Je suis votre assistant médical IA. Je peux vous aider à comprendre vos résultats, vous expliquer des termes médicaux, ou vous guider dans l'utilisation de la plateforme. Comment puis-je vous aider ?`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = {
      id: Date.now(),
      sender: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Simuler une réponse IA
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const botResponse = generateBotResponse(input.trim(), consultations);
    const botMsg = {
      id: Date.now() + 1,
      sender: "bot",
      content: botResponse,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, botMsg]);
    setSending(false);
  };

  const formatTime = d => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647" }}>Assistant IA 🤖</div>
        <div style={{ fontSize: ".8rem", color: "#64748B", marginTop: 2 }}>Posez vos questions sur votre santé et vos dossiers</div>
      </div>

      <div style={{ ...S.card, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {messages.map((m, i) => (
            <div key={m.id} style={{
              display: "flex",
              justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: 16,
              animation: "fadeUp .3s ease",
            }}>
              {m.sender === "bot" && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg,#7C3AED,#A855F7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: ".9rem", marginRight: 10, flexShrink: 0,
                }}>🤖</div>
              )}
              <div>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: m.sender === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.sender === "user" ? "#0A2647" : "#F8FAFC",
                  border: m.sender === "user" ? "none" : "1px solid #E2E8F0",
                  color: m.sender === "user" ? "white" : "#0A2647",
                  fontSize: ".82rem", lineHeight: 1.6, maxWidth: 500,
                }}>
                  {m.content}
                </div>
                <div style={{
                  fontSize: ".6rem", color: "#CBD5E1", marginTop: 4,
                  textAlign: m.sender === "user" ? "right" : "left",
                }}>
                  {formatTime(m.timestamp)}
                </div>
              </div>
              {m.sender === "user" && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg,#2D5F9E,#38BDF8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: ".75rem", fontWeight: 700,
                  marginLeft: 10, flexShrink: 0,
                }}>
                  {(user?.full_name || "P").charAt(0)}
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "linear-gradient(135deg,#7C3AED,#A855F7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: ".9rem", marginRight: 10,
              }}>🤖</div>
              <div style={{
                padding: "12px 16px", borderRadius: "14px 14px 14px 4px",
                background: "#F8FAFC", border: "1px solid #E2E8F0",
              }}>
                <Spinner size={16} color="#7C3AED" />
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        {/* Input area */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSend()}
            placeholder="Posez votre question…"
            style={{ ...S.input, flex: 1 }}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 44, height: 44,
              background: input.trim() ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "#E2E8F0",
              border: "none", borderRadius: 12,
              color: input.trim() ? "white" : "#94A3B8",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", transition: "all .15s ease",
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

// Fonction de réponse intelligente du chatbot
function generateBotResponse(question, consultations) {
  const q = question.toLowerCase();
  
  if (q.includes("résultat") || q.includes("analyse") || q.includes("dossier")) {
    const analyzed = consultations.filter(c => c.status === "analyzed");
    if (analyzed.length > 0) {
      return `Vous avez ${analyzed.length} dossier(s) avec des résultats disponibles. Voici un résumé :\n\n${analyzed.map(c => `• Dossier #${c.id} (${MODEL_META[c.model_key]?.label || "Examen"}) : ${c.prediction || "Résultat disponible"}`).join("\n")}\n\nVoulez-vous plus de détails sur un dossier en particulier ?`;
    } else {
      return "Vous n'avez pas encore de résultats d'analyse. Une fois qu'un médecin aura analysé votre dossier, les résultats apparaîtront dans la section « Mes dossiers ». Vous pouvez soumettre une nouvelle image depuis « Nouveau dossier ».";
    }
  }
  
  if (q.includes("rendez-vous") || q.includes("rdv") || q.includes("consultation")) {
    const active = consultations.filter(c => c.status === "accepted" || c.status === "analyzed");
    if (active.length > 0) {
      return `Vous avez ${active.length} consultation(s) active(s). Consultez la page « Rendez-vous » pour voir les créneaux proposés par vos médecins. Vous pouvez également rejoindre une consultation vidéo si votre médecin l'a activée.`;
    } else {
      return "Pour obtenir un rendez-vous, soumettez d'abord un dossier médical depuis « Nouveau dossier ». Un médecin le prendra en charge et vous proposera un créneau.";
    }
  }
  
  if (q.includes("médecin") || q.includes("docteur") || q.includes("spécialiste")) {
    return "Vous pouvez trouver des médecins spécialistes près de chez vous dans la section « Trouver un médecin ». La carte interactive vous montre les médecins disponibles par ville, triés par distance. Utilisez les filtres pour affiner votre recherche par spécialité.";
  }
  
  if (q.includes("urgence") || q.includes("samu") || q.includes("112")) {
    return "🚨 En cas d'urgence médicale, composez immédiatement le **15 (SAMU)** ou le **112**. Ne perdez pas de temps sur la plateforme. Si vous avez une douleur intense, des difficultés respiratoires, ou tout symptôme grave, rendez-vous aux urgences ou appelez les secours.";
  }
  
  if (q.includes("bonjour") || q.includes("salut") || q.includes("hello")) {
    return `Bonjour ! 😊 Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur vos dossiers médicaux, vos résultats, ou sur l'utilisation de la plateforme MedAI.`;
  }
  
  if (q.includes("merci") || q.includes("thanks")) {
    return "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider 24/7.";
  }
  
  return "Je comprends votre question. Voici ce que je peux vous aider à faire :\n\n• 📋 Consulter vos résultats d'analyse\n• 📅 Voir vos rendez-vous\n• 💬 Contacter votre médecin\n• 🗺️ Trouver un spécialiste\n• 📤 Soumettre un nouveau dossier\n\nDites-m'en plus sur ce dont vous avez besoin !";
}

// ─────────────────────────────────────────────────────────────────
// PAGE: UPLOAD DOSSIER MÉDICAL
// ─────────────────────────────────────────────────────────────────

function PageUpload({ token, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const MODELS = [
    { key: "chest",  icon: "🫁", label: "Radiographie thoracique", desc: "Poumons, cœur, COVID, pneumonie…", color: "#0369A1", bg: "#F0F9FF" },
    { key: "brain",  icon: "🧠", label: "IRM cérébrale",           desc: "Tumeurs cérébrales, gliome…",     color: "#7C3AED", bg: "#F5F3FF" },
    { key: "lung",   icon: "🔬", label: "Scanner CT pulmonaire",   desc: "Cancer pulmonaire, nodules…",    color: "#DC2626", bg: "#FEF2F2" },
    { key: "retina", icon: "👁️", label: "Fond d'œil (Rétine)",    desc: "Rétinopathie diabétique…",       color: "#0E7490", bg: "#ECFEFF" },
  ];

  const handleFile = f => {
    if (!f) return;
    if (!["image/jpeg","image/png","image/jpg"].includes(f.type)) { setError("Format non supporté. Utilisez JPEG ou PNG."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("Fichier trop volumineux (max 10 Mo)."); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const handleSubmit = async () => {
    if (!file || !selectedModel) return;
    setLoading(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("model_key", selectedModel.key);
      form.append("patient_notes", [symptoms && `Symptômes: ${symptoms}`, notes && `Notes: ${notes}`].filter(Boolean).join("\n\n"));
      const res = await fetch(`${API_BASE}/consultations`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Erreur"); }
      const data = await res.json();
      setResult(data); setStep(3);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setStep(1); setSelectedModel(null); setFile(null);
    if (preview) URL.revokeObjectURL(preview); setPreview(null);
    setNotes(""); setSymptoms(""); setResult(null); setError("");
  };

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647" }}>Soumettre un dossier médical</div>
        <div style={{ fontSize: ".8rem", color: "#64748B", marginTop: 2 }}>Votre image sera analysée par un médecin spécialiste</div>
      </div>

      {/* Progress steps */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 32, background: "white", borderRadius: 60, padding: "12px 24px", border: "1px solid #E2E8F0", width: "fit-content" }}>
        {[
          { n: 1, l: "Type d'examen" },
          { n: 2, l: "Image & infos" },
          { n: 3, l: "Confirmé" },
        ].map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step > s.n ? "#059669" : step === s.n ? "#0A2647" : "#E2E8F0",
                color: step >= s.n ? "white" : "#94A3B8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: ".7rem", fontWeight: 700,
              }}>
                {step > s.n ? "✓" : s.n}
              </div>
              <span style={{ fontSize: ".78rem", fontWeight: step === s.n ? 700 : 400, color: step === s.n ? "#0A2647" : "#94A3B8" }}>{s.l}</span>
            </div>
            {i < 2 && <div style={{ width: 40, height: 1, background: step > s.n ? "#059669" : "#E2E8F0", margin: "0 10px" }} />}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: ".82rem", display: "flex", gap: 8 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Model selection */}
      {step === 1 && (
        <div style={S.card}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: ".95rem", fontWeight: 700, color: "#0A2647" }}>Choisissez le type d'examen</div>
            <div style={{ fontSize: ".78rem", color: "#64748B", marginTop: 2 }}>Sélectionnez la modalité correspondant à votre image médicale</div>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {MODELS.map(m => (
              <button key={m.key} onClick={() => { setSelectedModel(m); setStep(2); }} style={{
                display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                border: "2px solid #E2E8F0", borderRadius: 14, background: "white",
                cursor: "pointer", textAlign: "left", transition: "all .2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.background = m.bg; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "white"; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".92rem", fontWeight: 700, color: "#0A2647" }}>{m.label}</div>
                  <div style={{ fontSize: ".75rem", color: "#64748B", marginTop: 2 }}>{m.desc}</div>
                </div>
                <span style={{ color: m.color, fontSize: "1.2rem" }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: File + info */}
      {step === 2 && selectedModel && (
        <div style={S.card}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: selectedModel.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              {selectedModel.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#0A2647" }}>{selectedModel.label}</div>
            </div>
            <button onClick={() => { setStep(1); setFile(null); setPreview(null); }} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: ".75rem", cursor: "pointer" }}>
              Changer
            </button>
          </div>
          <div style={{ padding: "24px" }}>
            {/* Upload zone */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#0A2647", marginBottom: 8 }}>Image médicale *</div>
              {!preview ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                  style={{
                    border: `2px dashed ${selectedModel.color}66`, borderRadius: 14, padding: "48px 24px",
                    textAlign: "center", cursor: "pointer", background: selectedModel.bg + "44", transition: "all .2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = selectedModel.bg}
                  onMouseLeave={e => e.currentTarget.style.background = selectedModel.bg + "44"}
                >
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={e => handleFile(e.target.files[0])} style={{ display: "none" }} />
                  <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>{selectedModel.icon}</div>
                  <div style={{ fontSize: ".9rem", fontWeight: 600, color: "#0A2647", marginBottom: 4 }}>Glissez votre image ici</div>
                  <div style={{ fontSize: ".75rem", color: "#94A3B8" }}>JPEG · PNG · max 10 Mo</div>
                </div>
              ) : (
                <div style={{ borderRadius: 14, overflow: "hidden", background: "#0A2647", position: "relative" }}>
                  <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: 260, objectFit: "contain", display: "block" }} />
                  <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ padding: "3px 10px", background: "#059669", borderRadius: 20, fontSize: ".68rem", color: "white", fontWeight: 700 }}>✓ Image chargée</span>
                    <button onClick={() => { setFile(null); setPreview(null); }} style={{ padding: "3px 10px", background: "#DC2626", border: "none", borderRadius: 20, fontSize: ".68rem", color: "white", cursor: "pointer" }}>
                      Remplacer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Symptoms + notes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>Symptômes *</div>
                <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="Décrivez vos symptômes (toux, douleur, fièvre…)" rows={4} style={S.textarea} />
              </div>
              <div>
                <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>Informations complémentaires</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Antécédents, traitements en cours, allergies…" rows={4} style={S.textarea} />
              </div>
            </div>

            {/* Avertissement */}
            <div style={{ padding: "10px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, fontSize: ".72rem", color: "#92400E", marginBottom: 20 }}>
              ⚠️ En soumettant ce dossier, vous consentez au traitement de vos données médicales conformément au RGPD.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={S.btnOutline}>← Retour</button>
              <button
                onClick={handleSubmit}
                disabled={!file || !symptoms || loading}
                style={{ ...S.btn, flex: 1, opacity: (!file || !symptoms) ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {loading ? <><Spinner size={16} color="white" /> Envoi en cours…</> : "Soumettre le dossier →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && result && (
        <div style={{ ...S.card, padding: "48px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ECFDF5", border: "3px solid #6EE7B7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "2rem" }}>
            ✅
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647", marginBottom: 8 }}>Dossier soumis avec succès !</div>
          <div style={{ fontSize: ".85rem", color: "#64748B", lineHeight: 1.7, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            Votre dossier <strong>#{result.consultation_id}</strong> a été enregistré. Un médecin spécialiste va prendre en charge votre demande sous 24-48h.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 400, margin: "0 auto 24px", padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
            {[["Référence", `#${result.consultation_id}`], ["Statut", "En attente"], ["Type", selectedModel?.label], ["Date", new Date().toLocaleDateString("fr-FR")]].map(([l,v]) => (
              <div key={l} style={{ textAlign: "left" }}>
                <div style={{ fontSize: ".62rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#0A2647" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={reset} style={S.btnOutline}>Nouveau dossier</button>
            <button onClick={onSuccess} style={S.btn}>Voir mes dossiers →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE: RENDEZ-VOUS (Inchangée)
// ─────────────────────────────────────────────────────────────────

function PageAppointments({ consultations }) {
  const navigate = useNavigate();

  const withAppt = consultations.filter(c =>
    c.status === "accepted" || c.status === "analyzed"
  );

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647" }}>Mes rendez-vous</div>
        <div style={{ fontSize: ".8rem", color: "#64748B", marginTop: 2 }}>Consultations planifiées et historique</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: ".75rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
          Consultations actives
        </div>
        {withAppt.length === 0 ? (
          <div style={{ ...S.card, padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0A2647", marginBottom: 4 }}>Aucun rendez-vous planifié</div>
            <div style={{ fontSize: ".78rem", color: "#94A3B8" }}>Les rendez-vous seront créés par votre médecin.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {withAppt.map(c => {
              const md = MODEL_META[c.model_key] || MODEL_META.chest;
              const st = STATUS_CFG[c.status] || STATUS_CFG.pending;
              return (
                <div key={c.id} style={{ ...S.card, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: md.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                    {md.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: ".88rem", fontWeight: 700, color: "#0A2647" }}>Consultation #{c.id}</span>
                      <Badge label={st.label} color={st.color} bg={st.bg} icon={st.icon} />
                    </div>
                    <div style={{ fontSize: ".75rem", color: "#64748B" }}>
                      {md.label}{c.doctor_name && ` · Dr. ${c.doctor_name}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => navigate(`/consultation/${c.id}`)} style={S.btnSm}>Voir le dossier</button>
                    <button onClick={() => navigate(`/video/${c.id}`)} style={{ ...S.btnSm, background: "linear-gradient(135deg,#0369A1,#0284C7)" }}>📹 Vidéo</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 12 }}>
        <div style={{ fontSize: ".78rem", color: "#0369A1", fontWeight: 700, marginBottom: 4 }}>ℹ️ Comment fonctionne la prise de rendez-vous ?</div>
        <div style={{ fontSize: ".73rem", color: "#0284C7", lineHeight: 1.7 }}>
          Une fois votre dossier accepté par un médecin, celui-ci vous proposera un rendez-vous (vidéo ou présentiel) depuis son tableau de bord. Vous recevrez une notification et le créneau apparaîtra ici.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE: MESSAGERIE (Inchangée)
// ─────────────────────────────────────────────────────────────────

function PageMessages({ consultations, token, user }) {
  const [selectedConsult, setSelectedConsult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef(null);

  const active = consultations.filter(c => c.status === "accepted" || c.status === "analyzed");

  const fetchMessages = useCallback(async (cid) => {
    if (!cid) return;
    try {
      const res = await fetch(`${API_BASE}/consultations/${cid}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
    } catch (e) {}
  }, [token]);

  useEffect(() => { fetchMessages(selectedConsult?.id); }, [selectedConsult, fetchMessages]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !selectedConsult) return;
    setSending(true);
    try {
      await fetch(`${API_BASE}/consultations/${selectedConsult.id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }),
      });
      setMsgInput("");
      fetchMessages(selectedConsult.id);
    } catch (e) {}
    finally { setSending(false); }
  };

  const formatTime = d => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647" }}>Messagerie</div>
        <div style={{ fontSize: ".8rem", color: "#64748B", marginTop: 2 }}>Échangez avec vos médecins</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, height: 600 }}>
        <div style={{ ...S.card, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #F1F5F9", fontSize: ".78rem", fontWeight: 700, color: "#0A2647" }}>
            Consultations ({active.length})
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {active.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "#CBD5E1", fontSize: ".78rem" }}>
                Aucune consultation active
              </div>
            ) : active.map(c => {
              const md = MODEL_META[c.model_key] || MODEL_META.chest;
              const isSelected = selectedConsult?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConsult(c)}
                  style={{
                    padding: "12px 16px", cursor: "pointer",
                    background: isSelected ? "#EFF6FF" : "white",
                    borderLeft: isSelected ? "3px solid #2563EB" : "3px solid transparent",
                    transition: "all .15s", borderBottom: "1px solid #F8FAFC",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "white"; }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: md.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".95rem", flexShrink: 0 }}>
                      {md.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".78rem", fontWeight: 700, color: isSelected ? "#2563EB" : "#0A2647" }}>
                        #{c.id} — {c.doctor_name ? `Dr. ${c.doctor_name}` : "Médecin"}
                      </div>
                      <div style={{ fontSize: ".65rem", color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {md.label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...S.card, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {!selectedConsult ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#CBD5E1" }}>
              <div style={{ fontSize: "2.5rem" }}>💬</div>
              <div style={{ fontSize: ".88rem" }}>Sélectionnez une consultation</div>
            </div>
          ) : (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                  {MODEL_META[selectedConsult.model_key]?.icon || "🏥"}
                </div>
                <div>
                  <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#0A2647" }}>
                    {selectedConsult.doctor_name ? `Dr. ${selectedConsult.doctor_name}` : "Médecin assigné"}
                  </div>
                  <div style={{ fontSize: ".68rem", color: "#94A3B8" }}>
                    Consultation #{selectedConsult.id} · {MODEL_META[selectedConsult.model_key]?.label}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#CBD5E1" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: ".82rem" }}>Commencez la discussion avec votre médecin</div>
                  </div>
                ) : messages.map((m, i) => {
                  const isMine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 12, animation: "fadeUp .2s ease" }}>
                      {!isMine && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0A2647", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: ".7rem", fontWeight: 700, marginRight: 8, flexShrink: 0 }}>
                          {(m.sender_name || "M").charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          background: isMine ? "#0A2647" : "#F8FAFC",
                          border: isMine ? "none" : "1px solid #E2E8F0",
                          color: isMine ? "white" : "#0A2647",
                          fontSize: ".82rem", lineHeight: 1.5, maxWidth: 340,
                        }}>
                          {!isMine && <div style={{ fontSize: ".62rem", color: isMine ? "rgba(255,255,255,.6)" : "#94A3B8", marginBottom: 3, fontWeight: 700 }}>Dr. {m.sender_name}</div>}
                          {m.content}
                        </div>
                        <div style={{ fontSize: ".6rem", color: "#CBD5E1", marginTop: 3, textAlign: isMine ? "right" : "left" }}>{formatTime(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>

              <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && sendMessage()}
                  placeholder="Écrire un message…"
                  style={{ ...S.input, flex: 1 }}
                />
                <button onClick={sendMessage} disabled={!msgInput.trim() || sending} style={{
                  width: 40, height: 40, background: msgInput.trim() ? "#0A2647" : "#E2E8F0",
                  border: "none", borderRadius: 10, color: msgInput.trim() ? "white" : "#94A3B8",
                  cursor: msgInput.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .15s ease",
                }}>
                  {sending ? <Spinner size={16} color="white" /> : "➤"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE: TROUVER UN MÉDECIN (CARTE GÉO INTERACTIVE)
// ─────────────────────────────────────────────────────────────────

function PageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [locStatus, setLocStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [selectedVille, setSelectedVille] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);
  
  const listRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) { setLocStatus("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserCoords([pos.coords.latitude, pos.coords.longitude]); setLocStatus("ok"); },
      () => setLocStatus("denied"),
      { timeout: 8000 }
    );
  }, []);

  const fetchDoctors = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (selectedVille) params.set("ville", selectedVille);
      if (selectedSpec) params.set("specialite", selectedSpec);
      const [dRes, vRes] = await Promise.all([
        fetch(`${API_BASE}/doctors?${params}`),
        fetch(`${API_BASE}/doctors/villes`),
      ]);
      if (!dRes.ok) throw new Error("Service médecins indisponible");
      const dData = await dRes.json();
      const vData = vRes.ok ? await vRes.json() : { villes: [] };
      setDoctors(dData.doctors || []);
      setVilles(vData.villes || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [selectedVille, selectedSpec]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const doctorsWithDist = useMemo(() => {
    return doctors.map(d => {
      if (!userCoords) return { ...d, distance: null };
      const coords = CITY_COORDS[d.ville];
      if (!coords) return { ...d, distance: null };
      return { ...d, distance: haversine(userCoords[0], userCoords[1], coords[0], coords[1]) };
    }).sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
  }, [doctors, userCoords]);

  const filteredDoctors = useMemo(() => {
    if (!search.trim()) return doctorsWithDist;
    const q = search.toLowerCase();
    return doctorsWithDist.filter(d =>
      (d.name || "").toLowerCase().includes(q) ||
      (d.specialite || "").toLowerCase().includes(q) ||
      (d.ville || "").toLowerCase().includes(q)
    );
  }, [doctorsWithDist, search]);

  const handleCityClick = useCallback((cityName) => {
    const firstDocIndex = filteredDoctors.findIndex(d => d.ville === cityName);
    if (firstDocIndex !== -1 && listRef.current) {
      const listItem = listRef.current.children[firstDocIndex];
      if (listItem) {
        listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      setSelectedDocId(filteredDoctors[firstDocIndex].id);
      setHoveredCity(null);
    }
  }, [filteredDoctors]);

  const handleDocHover = useCallback((doc) => {
    setHoveredCity(doc?.ville || null);
  }, []);

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647" }}>Trouver un médecin</div>
        <div style={{ fontSize: ".8rem", color: "#64748B", marginTop: 2 }}>
          {locStatus === "ok" ? "📍 Médecins triés par distance depuis votre position" : "Médecins disponibles en Tunisie"}
        </div>
      </div>

      {locStatus === "denied" && (
        <div style={{ marginBottom: 16, padding: "10px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, fontSize: ".75rem", color: "#92400E" }}>
          ℹ️ Activez la géolocalisation dans votre navigateur pour voir les médecins les plus proches de vous.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...S.card, padding: "14px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: ".8rem", color: "#CBD5E1" }}>🔍</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, spécialité…"
                style={{ ...S.input, paddingLeft: 32 }}
                onFocus={e => { e.target.style.borderColor = "#0A2647"; e.target.style.background = "white";}}
                onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.background = "#F8FAFC";}} />
            </div>
            <select value={selectedVille} onChange={e => setSelectedVille(e.target.value)} style={{ ...S.input, width: "auto", flex: 1, minWidth: 130 }}>
              <option value="">📍 Toutes les villes</option>
              {villes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={selectedSpec} onChange={e => setSelectedSpec(e.target.value)} style={{ ...S.input, width: "auto", flex: 1, minWidth: 150 }}>
              <option value="">🩺 Toutes spécialités</option>
              {Object.keys(SPEC_ICONS).map(s => <option key={s} value={s}>{SPEC_ICONS[s]} {s}</option>)}
            </select>
          </div>

          <div style={{ fontSize: ".7rem", color: "#94A3B8", margin: "0 0 -8px 0", fontWeight: 600 }}>
            {filteredDoctors.length} médecin{filteredDoctors.length !== 1 ? "s" : ""} trouvé{filteredDoctors.length !== 1 ? "s" : ""}
            {userCoords && <span style={{ color: "#059669", marginLeft: 8 }}>· triés par distance</span>}
          </div>

          <QueryStatus
            loading={loading}
            error={error}
            data={filteredDoctors}
            isEmpty={filteredDoctors.length === 0}
            empty={<EmptyState icon="🔍" title="Aucun médecin trouvé" desc="Modifiez vos filtres de recherche." />}
          >
            <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
              {filteredDoctors.map((doc, idx) => {
                const isNearest = idx === 0 && doc.distance != null && !selectedVille && !search;
                const isSelected = selectedDocId === doc.id;
                const isHovered = hoveredCity === doc.ville;
                const specIcon = SPEC_ICONS[doc.specialite] || "🩺";
                const dist = fmtDist(doc.distance);
                return (
                  <div
                    key={doc.id || idx}
                    onMouseEnter={() => handleDocHover(doc)}
                    onMouseLeave={() => handleDocHover(null)}
                    onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
                    style={{
                      ...S.card, padding: "14px 18px", cursor: "pointer", transition: "all .15s",
                      borderLeft: `4px solid ${isNearest ? "#059669" : isSelected || isHovered ? "#0EA5E9" : "transparent"}`,
                      background: isSelected ? "#F0F9FF" : isNearest ? "#F0FDF4" : isHovered ? "#F8FAFC" : "white",
                      transform: isSelected || isHovered ? 'scale(1.01)' : 'scale(1)',
                      boxShadow: isSelected || isHovered ? '0 4px 12px rgba(0,0,0,.05)' : '0 2px 8px rgba(10,38,71,.05)',
                      zIndex: isSelected || isHovered ? 1 : 0,
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: isNearest ? "linear-gradient(135deg,#059669,#047857)" : "#F1F5F9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.2rem", color: isNearest ? "white" : "#64748B",
                        transition: 'all .2s'
                      }}>{specIcon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                          <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#0A2647" }}>{doc.name}</span>
                          {isNearest && <span style={{ padding: "1px 6px", borderRadius: 4, background: "#059669", color: "white", fontSize: ".58rem", fontWeight: 800 }}>★ PLUS PROCHE</span>}
                        </div>
                        <div style={{ fontSize: ".72rem", color: "#64748B" }}>
                          {doc.specialite}{doc.ville && ` · 📍 ${doc.ville}`}
                          {dist && <span style={{ color: isNearest ? "#059669" : "#475569", fontWeight: 700 }}> · {dist}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {doc.phones && doc.phones.length > 0 && (
                          <a href={`tel:${doc.phones[0]}`} onClick={e => e.stopPropagation()} style={{
                            padding: "5px 12px", background: "#ECFDF5", border: "1px solid #A7F3D0",
                            borderRadius: 8, fontSize: ".68rem", fontWeight: 700, color: "#059669",
                            textDecoration: "none", transition: "all .15s",
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#059669"; e.currentTarget.style.color = "white"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#ECFDF5"; e.currentTarget.style.color = "#059669"; }}
                          >
                            📞 Appeler
                          </a>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ marginTop: 12, padding: "12px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9", animation: "fadeUp .2s ease" }}>
                        {doc.address && <div style={{ fontSize: ".72rem", color: "#64748B", marginBottom: 8 }}>📍 {doc.address}{doc.ville ? `, ${doc.ville}` : ''}</div>}
                        {doc.phones && <div style={{display: "flex", gap: 6, flexWrap:"wrap", marginBottom:8}}>{doc.phones.map((p,i)=><span key={i} style={{background:"white", border:"1px solid #E2E8F0", borderRadius:6, padding:"2px 8px", fontSize:".7rem"}}>{p}</span>)}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </QueryStatus>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...S.card, overflow: "hidden", height: 440 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", fontSize: ".78rem", fontWeight: 700, color: "#0A2647" }}>
              🗺️ Carte interactive des médecins
            </div>
            <div style={{ height: "calc(100% - 44px)", padding: 0 }}>
              <DotMap
                doctors={filteredDoctors.slice(0, 30)}
                userCoords={userCoords}
                onCityClick={handleCityClick}
                hoveredCity={hoveredCity}
                selectedDocId={selectedDocId}
                locStatus={locStatus}
              />
            </div>
          </div>

          <div style={{
            fontSize: ".65rem", color: "#94A3B8", textAlign: "center", marginTop: -4,
          }}>
            Cliquez sur une ville pour voir ses médecins. Utilisez la molette pour zoomer.
          </div>

          <div style={{ padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10 }}>
            <div style={{ fontSize: ".72rem", fontWeight: 800, color: "#991B1B", marginBottom: 3 }}>🚨 Urgence médicale ?</div>
            <div style={{ fontSize: ".7rem", color: "#B91C1C", lineHeight: 1.6 }}>
              Composez le <strong>15 (SAMU)</strong> ou le <strong>112</strong> immédiatement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// COMPOSANT CARTE INTERACTIVE
// ─────────────────────────────────────────────────────────────────

function DotMap({ doctors, userCoords, onCityClick, hoveredCity, selectedDocId, locStatus }) {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const toX = (lon) => ((lon - 7) / 5) * 100;
  const toY = (lat) => ((38 - lat) / 8) * 100;
  const userX = userCoords ? toX(userCoords[1]) : null;
  const userY = userCoords ? toY(userCoords[0]) : null;

  const docsWithCoords = useMemo(() => doctors.filter(d => CITY_COORDS[d.ville]).map(d => ({
    ...d, cx: toX(CITY_COORDS[d.ville][1]), cy: toY(CITY_COORDS[d.ville][0]),
  })), [doctors]);

  const cityMap = useMemo(() => {
    const map = new Map();
    docsWithCoords.forEach(d => {
      if (!map.has(d.ville)) map.set(d.ville, { ...d, count: 0, doctors: [] });
      const cityData = map.get(d.ville);
      cityData.count++;
      cityData.doctors.push(d.name);
    });
    return new Map([...map.entries()].map(([ville, data]) => [ville, { ...data, name: data.doctors[0] }]));
  }, [docsWithCoords]);

  const cities = useMemo(() => [...cityMap.values()], [cityMap]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - svgRect.left) / svgRect.width) * viewBox.width;
    const mouseY = ((e.clientY - svgRect.top) / svgRect.height) * viewBox.height;
    
    const scaleFactor = e.deltaY < 0 ? 0.9 : 1.1;
    const newWidth = Math.max(30, Math.min(200, viewBox.width * scaleFactor));
    const newHeight = Math.max(30, Math.min(200, viewBox.height * scaleFactor));
    
    const newX = mouseX - (mouseX - viewBox.x) * (newWidth / viewBox.width);
    const newY = mouseY - (mouseY - viewBox.y) * (newHeight / viewBox.height);

    setViewBox({
      x: Math.max(0, Math.min(newX, 100 - newWidth)),
      y: Math.max(0, Math.min(newY, 100 - newHeight)),
      width: newWidth,
      height: newHeight
    });
  }, [viewBox]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'text') return;
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning || !svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const dx = (lastMousePos.x - e.clientX) * (viewBox.width / svgRect.width);
    const dy = (lastMousePos.y - e.clientY) * (viewBox.height / svgRect.height);
    
    setViewBox(prev => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x + dx, 100 - prev.width)),
      y: Math.max(0, Math.min(prev.y + dy, 100 - prev.height))
    }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastMousePos, viewBox]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = () => {
    setViewBox({ x: 0, y: 0, width: 100, height: 100 });
  };

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative",
      background: "linear-gradient(135deg,#EEF7FF,#E0F2FE)",
      borderRadius: 14, overflow: "hidden", cursor: isPanning ? 'grabbing' : 'grab',
    }}>
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(14,116,144,0.05)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        <path d="M35,15 L45,12 L55,14 L60,20 L58,30 L62,40 L60,55 L55,65 L50,75 L45,80 L38,72 L35,60 L32,50 L30,40 L32,28 Z"
          fill="rgba(14,116,144,.04)" stroke="rgba(14,116,144,.2)" strokeWidth="1" />
        
        <text x="38" y="22" fontSize="2" fill="#94A3B8" fontWeight="500">Nord</text>
        <text x="36" y="60" fontSize="2" fill="#94A3B8" fontWeight="500">Centre</text>
        <text x="38" y="85" fontSize="2" fill="#94A3B8" fontWeight="500">Sud</text>

        {cities.map(city => {
          const isHovered = hoveredCity === city.ville;
          const hasSelectedDoc = city.doctors.some(name => {
            const doc = doctors.find(d => d.name === name);
            return doc && doc.id === selectedDocId;
          });
          const isActive = isHovered || hasSelectedDoc;
          const radius = 1.8 + Math.min(city.count, 6) * 0.6;
          
          return (
            <g
              key={city.ville}
              onClick={(e) => { e.stopPropagation(); onCityClick(city.ville); }}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={city.cx} cy={city.cy} r={isActive ? radius + 3 : radius + 1}
                fill="transparent" stroke={isActive ? "#0EA5E9" : "transparent"}
                strokeWidth={isActive ? 0.8 : 0.5} opacity={isActive ? 0.4 : 0} />
              
              <circle cx={city.cx} cy={city.cy} r={radius}
                fill={isActive ? "#0284C7" : "#0EA5E9"}
                fillOpacity={isActive ? 1 : 0.7}
                stroke="white" strokeWidth={isActive ? 1.2 : 0.8}
                style={{ transition: 'all .2s ease' }} />
              
              <text x={city.cx + (isActive ? 2.5 : 2)} y={city.cy + (isActive ? 1.8 : 1.2)}
                fontSize={isActive ? 3.5 : 2.8} fill={isActive ? "#0A2647" : "#0369A1"}
                fontWeight={isActive ? "800" : "600"}
                style={{ transition: 'all .2s ease', textShadow: isActive ? '0 0 6px white' : 'none' }}>
                {city.ville}
              </text>

              {city.count > 1 && (
                <g transform={`translate(${city.cx + 1.5}, ${city.cy - 2})`}>
                  <rect x="0" y="0" width={3 + String(city.count).length * 0.8} height="2.5" rx="1.25"
                    fill={isActive ? "#0A2647" : "#475569"} opacity={isActive ? 1 : 0.8} />
                  <text x={(3 + String(city.count).length * 0.8) / 2} y="1.8" fontSize="1.8" fill="white" textAnchor="middle" fontWeight="bold">
                    {city.count}
                  </text>
                </g>
              )}

              {isActive && (
                <text x={city.cx} y={city.cy - radius - 2.5} fontSize="2.5" fill="#0284C7" fontWeight="700"
                  textAnchor="middle" style={{ textShadow: '0 0 4px rgba(255,255,255,0.8)' }}>
                  {city.name} {city.count > 1 ? `+${city.count-1}` : ''}
                </text>
              )}
            </g>
          );
        })}

        {userX != null && userY != null && (
          <g>
            <circle cx={userX} cy={userY} r={3.5} fill="#EF4444" stroke="white" strokeWidth="1.5">
              <animate attributeName="r" values="3.5;4.5;3.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x={userX + 4.5} y={userY + 1.8} fontSize="3.5" fill="#DC2626" fontWeight="800" style={{textShadow: '0 0 4px white'}}>
              Vous
            </text>
          </g>
        )}
      </svg>

      <div style={{
        position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 4,
      }}>
        <button onClick={resetView} style={{
          width: 28, height: 28, background: "rgba(255,255,255,.9)", border: "1px solid #E2E8F0",
          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: ".9rem", backdropFilter: "blur(4px)", color: "#0A2647"
        }} title="Réinitialiser la vue">🔄</button>
      </div>
      
      <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ background: "rgba(255,255,255,.9)", borderRadius: 8, padding: "6px 10px", fontSize: ".65rem", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.8)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
            <span style={{ color: "#DC2626", fontWeight: 700 }}>Vous</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0EA5E9" }} />
            <span style={{ color: "#0369A1" }}>Médecins</span>
          </div>
        </div>

        <div style={{
          padding: "4px 10px", borderRadius: 20,
          background: locStatus === "ok" ? "#ECFDF5" : locStatus === "denied" ? "#FEF2F2" : "#FFFBEB",
          border: `1px solid ${locStatus === "ok" ? "#A7F3D0" : locStatus === "denied" ? "#FECACA" : "#FDE68A"}`,
          fontSize: ".65rem", fontWeight: 700,
          color: locStatus === "ok" ? "#059669" : locStatus === "denied" ? "#DC2626" : "#D97706",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {locStatus === "ok" ? "📍 Localisé" : locStatus === "denied" ? "📍 Manuelle" : "⏳ Détection…"}
        </div>
      </div>
      
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        color: "rgba(100,116,139,.3)", fontSize: ".7rem", fontWeight: 600, pointerEvents: "none",
        textAlign: "center", opacity: isPanning ? 0 : 1, transition: 'opacity .3s'
      }}>
        Molette pour zoomer
        <br/>Glissez pour déplacer
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE: CONSULTATION VIDÉO (Inchangée)
// ─────────────────────────────────────────────────────────────────

function PageVideo({ consultations }) {
  const navigate = useNavigate();
  const active = consultations.filter(c => c.status === "accepted" || c.status === "analyzed");

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647" }}>Consultation vidéo</div>
        <div style={{ fontSize: ".8rem", color: "#64748B", marginTop: 2 }}>Rejoignez votre médecin en visioconférence</div>
      </div>

      <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,#0A2647,#1B3B6F)", borderRadius: 14, marginBottom: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: ".95rem", fontWeight: 800, color: "white", marginBottom: 4 }}>Consultation sécurisée via Jitsi Meet</div>
          <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
            Chiffrement bout-en-bout · Aucun enregistrement · Compatible avec tous les appareils
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[{ ic: "🔒", l: "E2E" }, { ic: "📹", l: "HD" }, { ic: "🖥️", l: "Partage écran" }].map(f => (
            <div key={f.l} style={{ padding: "6px 12px", background: "rgba(255,255,255,.1)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: "1.1rem" }}>{f.ic}</div>
              <div style={{ fontSize: ".62rem", color: "rgba(255,255,255,.6)", fontWeight: 600 }}>{f.l}</div>
            </div>
          ))}
        </div>
      </div>

      {active.length === 0 ? (
        <EmptyState icon="📹" title="Aucune consultation active" desc="La consultation vidéo sera disponible une fois qu'un médecin aura accepté votre dossier." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {active.map(c => {
            const md = MODEL_META[c.model_key] || MODEL_META.chest;
            const st = STATUS_CFG[c.status] || STATUS_CFG.pending;
            return (
              <div key={c.id} style={{ ...S.card, padding: "18px 22px", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: md.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                  {md.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#0A2647" }}>Consultation #{c.id}</span>
                    <Badge label={st.label} color={st.color} bg={st.bg} icon={st.icon} />
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#64748B" }}>
                    {md.label}{c.doctor_name && ` · Dr. ${c.doctor_name}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => navigate(`/consultation/${c.id}`)} style={S.btnOutline}>
                    Dossier
                  </button>
                  <button onClick={() => navigate(`/video/${c.id}`)} style={{
                    ...S.btn, background: "linear-gradient(135deg,#059669,#047857)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    📹 Rejoindre
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TOP BAR (Inchangée)
// ─────────────────────────────────────────────────────────────────

function TopBar({ activePage, user, notifications, unreadCount, onMarkRead }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const PAGE_LABELS = {
    home: "Accueil", dossiers: "Mes dossiers", upload: "Nouveau dossier",
    appointments: "Rendez-vous", messages: "Messagerie",
    doctors: "Trouver un médecin", video: "Consultation vidéo",
    chatbot: "Assistant IA",
  };

  const timeSince = d => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `${Math.floor(diff/60)} min`;
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div style={{
      height: 56, background: "white", borderBottom: "1px solid #E2E8F0",
      display: "flex", alignItems: "center", padding: "0 28px",
      justifyContent: "space-between", flexShrink: 0,
    }}>
      <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#0A2647" }}>
        {PAGE_LABELS[activePage] || "Dashboard Patient"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }} ref={ref}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowNotifs(!showNotifs)} style={{
            width: 36, height: 36, borderRadius: 10, background: "#F8FAFC",
            border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "1rem", position: "relative",
          }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4, minWidth: 18, height: 18,
                background: "#EF4444", color: "white", borderRadius: 9, fontSize: ".58rem",
                fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px", border: "2px solid white",
              }}>{unreadCount}</span>
            )}
          </button>
          {showNotifs && (
            <div style={{
              position: "absolute", top: 44, right: 0, width: 340,
              background: "white", borderRadius: 14, border: "1px solid #E2E8F0",
              boxShadow: "0 20px 60px rgba(0,0,0,.12)", zIndex: 200, overflow: "hidden",
              animation: "fadeUp .2s ease",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#0A2647" }}>Notifications</span>
                {unreadCount > 0 && <button onClick={onMarkRead} style={{ background: "none", border: "none", color: "#2563EB", fontSize: ".72rem", fontWeight: 600, cursor: "pointer" }}>Tout lire</button>}
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#CBD5E1", fontSize: ".78rem" }}>Aucune notification</div>
                ) : notifications.slice(0, 8).map((n, i) => (
                  <div key={n.id} style={{ padding: "10px 16px", borderBottom: "1px solid #F8FAFC", background: n.is_read ? "white" : "#F0F9FF", display: "flex", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: n.is_read ? "#F1F5F9" : "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", flexShrink: 0 }}>
                      {NOTIF_ICONS[n.type] || "📌"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#0A2647", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</div>
                      <div style={{ fontSize: ".65rem", color: "#CBD5E1" }}>{timeSince(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563EB", flexShrink: 0, marginTop: 6 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 4px 4px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 40 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#0A2647,#2D5F9E)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: ".75rem", fontWeight: 700 }}>
            {(user?.full_name || "P").charAt(0)}
          </div>
          <span style={{ fontSize: ".78rem", fontWeight: 600, color: "#0A2647" }}>{user?.full_name || "Patient"}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  const [activePage, setActivePage] = useState("home");
  const [consultations, setConsultations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [cRes, nRes] = await Promise.all([
        fetch(`${API_BASE}/consultations/my`, { headers }),
        fetch(`${API_BASE}/consultations/notifications/me`, { headers }),
      ]);
      if (cRes.ok) { const d = await cRes.json(); setConsultations(d.consultations || []); }
      if (nRes.ok) { const d = await nRes.json(); setNotifications(d.notifications || []); setUnreadCount(d.unread || 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!user || user.role !== "Patient") { navigate("/login"); return; }
    fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/consultations/notifications/read-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(0);
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    } catch (e) {}
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
        <div style={{ textAlign: "center" }}>
          <Spinner size={40} />
          <div style={{ marginTop: 12, fontSize: ".9rem", color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>Chargement…</div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    const props = { consultations, notifications, unreadCount, onNavigate: setActivePage, token, user };
    switch (activePage) {
      case "home":         return <PageHome {...props} />;
      case "dossiers":     return <PageDossiers {...props} />;
      case "upload":       return <PageUpload token={token} onSuccess={() => { fetchData(); setActivePage("dossiers"); }} />;
      case "appointments": return <PageAppointments {...props} />;
      case "messages":     return <PageMessages consultations={consultations} token={token} user={user} />;
      case "doctors":      return <PageDoctors />;
      case "video":        return <PageVideo consultations={consultations} />;
      case "chatbot":      return <PageChatbot token={token} consultations={consultations} user={user} />;
      default:             return <PageHome {...props} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#F8FAFC", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes alertPulse{0%,100%{opacity:1}50%{opacity:.6}}
        @keyframes skeleton{0%,100%{opacity:.7}50%{opacity:.4}}
        *{scrollbar-width:thin;scrollbar-color:#CBD5E1 transparent}
        *::-webkit-scrollbar{width:5px}
        *::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
      `}</style>

      <Sidebar activePage={activePage} onNavigate={setActivePage} unreadCount={unreadCount} user={user} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar activePage={activePage} user={user} notifications={notifications} unreadCount={unreadCount} onMarkRead={markAllRead} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}