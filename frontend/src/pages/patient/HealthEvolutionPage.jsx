// frontend/src/pages/patient/HealthEvolutionPage.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PatientPageLayout } from "../../components/patient/PatientPageLayout";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";
import { usePatientData } from "../../hooks/usePatientData";

const API = "http://localhost:8000/api/v1";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION DES COULEURS - Thème premium médical
// ═══════════════════════════════════════════════════════════════════════════════
const THEME = {
  // Gradients principaux
  gradientGold: "linear-gradient(135deg, #FFD700 0%, #D4A500 50%, #B8860B 100%)",
  gradientNavy: "linear-gradient(135deg, #0A2647 0%, #1B3B6F 50%, #2563EB 100%)",
  gradientDanger: "linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)",
  gradientSuccess: "linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)",
  gradientWarning: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
  gradientPurple: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)",
  gradientCyan: "linear-gradient(135deg, #06B6D4 0%, #0891B2 50%, #0E7490 100%)",

  // Couleurs solides
  gold: "#FFD700",
  goldDark: "#D4A500",
  goldLight: "#FFF3B0",
  navy: "#0A2647",
  navyLight: "#1B3B6F",
  white: "#FFFFFF",

  // Couleurs de statut
  critical: "#EF4444",
  urgent: "#F59E0B",
  normal: "#10B981",

  // Fonds
  cardBg: "#FFFFFF",
  pageBg: "#F0F4FA",
  darkBg: "#0F1B2D",
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT GRAPHIQUE CIRCULAIRE (Gauge de confiance)
// ═══════════════════════════════════════════════════════════════════════════════
const ConfidenceGauge = ({ value, size = 180, strokeWidth = 14 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (v) => {
    if (v >= 80) return "#10B981";
    if (v >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Cercle de progression */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${getColor(value)}40)` }}
        />
      </svg>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ fontSize: "2rem", fontWeight: 800, color: getColor(value) }}
        >
          {value.toFixed(1)}%
        </motion.span>
        <span style={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 600 }}>Confiance</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT GRAPHIQUE À BARRES ANIMÉ (SVG natif)
// ═══════════════════════════════════════════════════════════════════════════════
const AnimatedBarChart = ({ data, maxValue, color = THEME.gold }) => {
  const barWidth = 40;
  const gap = 16;
  const chartHeight = 200;
  const totalWidth = data.length * (barWidth + gap) + gap;

  return (
    <svg width="100%" height={chartHeight + 60} viewBox={`0 0 ${totalWidth} ${chartHeight + 60}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color + "60"} />
        </linearGradient>
        <filter id="barGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Lignes de grille horizontales */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line
          key={i}
          x1={gap}
          y1={chartHeight * (1 - ratio)}
          x2={totalWidth - gap}
          y2={chartHeight * (1 - ratio)}
          stroke="#E2E8F0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {data.map((item, idx) => {
        const x = gap + idx * (barWidth + gap);
        const barHeight = (item.count / maxValue) * chartHeight * 0.9;
        const y = chartHeight - barHeight;

        return (
          <g key={idx}>
            {/* Barre */}
            <motion.rect
              x={x}
              initial={{ y: chartHeight, height: 0 }}
              animate={{ y, height: barHeight }}
              transition={{ delay: idx * 0.1, duration: 0.8, ease: "easeOut" }}
              width={barWidth}
              rx={8}
              fill="url(#barGradient)"
              filter="url(#barGlow)"
              style={{ cursor: "pointer" }}
            />

            {/* Valeur au-dessus */}
            <motion.text
              x={x + barWidth / 2}
              initial={{ y: chartHeight, opacity: 0 }}
              animate={{ y: y - 10, opacity: 1 }}
              transition={{ delay: idx * 0.1 + 0.3, duration: 0.5 }}
              textAnchor="middle"
              fill={THEME.navy}
              fontSize="12"
              fontWeight="700"
            >
              {item.count}
            </motion.text>

            {/* Label en bas */}
            <motion.text
              x={x + barWidth / 2}
              y={chartHeight + 20}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 + 0.5, duration: 0.5 }}
              textAnchor="middle"
              fill="#64748B"
              fontSize="10"
              fontWeight="600"
            >
              {item.month}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT GRAPHIQUE LINÉAIRE ANIMÉ (Sparkline)
// ═══════════════════════════════════════════════════════════════════════════════
const SparklineChart = ({ data, width = 300, height = 80, color = THEME.gold }) => {
  if (!data || data.length < 2) return null;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - minVal) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`sparklineGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Zone remplie */}
      <motion.polygon
        points={areaPoints}
        fill={`url(#sparklineGrad-${color.replace("#", "")})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Ligne */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 2px 4px ${color}40)` }}
      />

      {/* Points */}
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - minVal) / range) * height * 0.8 - height * 0.1;
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill={color}
            stroke={THEME.white}
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 + i * 0.1, duration: 0.3 }}
          />
        );
      })}
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT CARTE THERMIQUE (Heatmap des diagnostics)
// ═══════════════════════════════════════════════════════════════════════════════
const DiagnosisHeatmap = ({ data }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getIntensity = (count) => {
    const ratio = count / maxValue;
    if (ratio > 0.7) return { bg: "#EF4444", color: "#fff", label: "Élevé" };
    if (ratio > 0.4) return { bg: "#F59E0B", color: "#fff", label: "Moyen" };
    return { bg: "#10B981", color: "#fff", label: "Faible" };
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
      {data.map((item, idx) => {
        const intensity = getIntensity(item.count);
        return (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
            style={{
              background: intensity.bg,
              borderRadius: 16,
              padding: "16px",
              color: intensity.color,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden"
            }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)"
            }} />
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>
              {item.count}
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.9, textTransform: "capitalize" }}>
              {item.name}
            </div>
            <div style={{
              marginTop: 8,
              padding: "2px 8px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.2)",
              fontSize: "0.65rem",
              fontWeight: 700,
              display: "inline-block"
            }}>
              {intensity.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT CARTE STATISTIQUE ANIMÉE
// ═══════════════════════════════════════════════════════════════════════════════
const StatCard = ({ label, value, icon, color, subtitle, sparklineData, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
    const duration = 1500;
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(numValue);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      style={{
        background: THEME.cardBg,
        borderRadius: 24,
        padding: "24px",
        border: "1px solid rgba(30, 60, 110, 0.08)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer"
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: `${color}08`,
        pointerEvents: "none"
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          border: `1.5px solid ${color}30`
        }}>
          {icon}
        </div>
        {sparklineData && (
          <div style={{ opacity: 0.6 }}>
            <SparklineChart data={sparklineData} width={100} height={40} color={color} />
          </div>
        )}
      </div>

      <div style={{ fontSize: "2rem", fontWeight: 800, color: THEME.navy, marginBottom: 4, lineHeight: 1 }}>
        {typeof value === "string" && value.includes("%") 
          ? `${displayValue.toFixed(1)}%`
          : Math.round(displayValue).toLocaleString()
        }
      </div>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748B", marginBottom: 2 }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT TIMELINE VERTICALE
// ═══════════════════════════════════════════════════════════════════════════════
const Timeline = ({ consultations }) => {
  const analyzed = consultations.filter(c => c.status === "analyzed" && c.prediction);

  if (analyzed.length === 0) return null;

  const getSeverityColor = (urgency) => {
    switch (urgency) {
      case "critical": return "#EF4444";
      case "urgent": return "#F59E0B";
      default: return "#10B981";
    }
  };

  return (
    <div style={{ position: "relative", paddingLeft: 32 }}>
      {/* Ligne verticale */}
      <div style={{
        position: "absolute",
        left: 15,
        top: 0,
        bottom: 0,
        width: 2,
        background: "linear-gradient(180deg, #FFD700, #D4A500, #0A2647)",
        borderRadius: 2
      }} />

      {analyzed.slice(0, 6).map((c, idx) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.5 }}
          style={{ position: "relative", marginBottom: 20, cursor: "pointer" }}
          onClick={() => navigate(`/patient/resultats/${c.id}`)}
        >
          {/* Point sur la timeline */}
          <div style={{
            position: "absolute",
            left: -26,
            top: 4,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: getSeverityColor(c.urgency),
            border: `3px solid ${THEME.white}`,
            boxShadow: `0 0 0 3px ${getSeverityColor(c.urgency)}30`,
            zIndex: 2
          }} />

          <div style={{
            background: THEME.cardBg,
            borderRadius: 16,
            padding: "16px 20px",
            border: "1px solid rgba(30, 60, 110, 0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateX(8px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateX(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
          }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: THEME.navy, textTransform: "capitalize" }}>
                {c.prediction}
              </span>
              <span style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
                background: `${getSeverityColor(c.urgency)}15`,
                color: getSeverityColor(c.urgency)
              }}>
                {c.urgency || "normal"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#D4A500", fontWeight: 600 }}>
                Conf: {((c.confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const HealthEvolutionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { consultations, loading } = usePatientData();

  const [period, setPeriod] = useState("6months");
  const [activeTab, setActiveTab] = useState("overview"); // overview | timeline | distribution
  const [selectedModel, setSelectedModel] = useState("all");

  // Données filtrées par période
  const filteredConsultations = useMemo(() => {
    if (!consultations) return [];

    const periods = {
      "3months": 90,
      "6months": 180,
      "1year": 365,
      "all": Infinity
    };
    const days = periods[period];
    const cutoff = days === Infinity ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return consultations.filter(c => {
      if (cutoff && new Date(c.created_at) < cutoff) return false;
      if (selectedModel !== "all" && c.model_key !== selectedModel) return false;
      return true;
    });
  }, [consultations, period, selectedModel]);

  // Données analysées uniquement
  const analyzedData = useMemo(() => {
    return filteredConsultations.filter(c => c.status === "analyzed" && c.prediction);
  }, [filteredConsultations]);

  // Statistiques
  const stats = useMemo(() => {
    const analyzed = analyzedData;
    const total = filteredConsultations.length;

    // Grouper par mois pour le graphique
    const monthlyMap = new Map();
    analyzed.forEach(c => {
      const date = new Date(c.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { month: label, count: 0, confidenceSum: 0 });
      }
      const item = monthlyMap.get(key);
      item.count++;
      item.confidenceSum += c.confidence || 0;
    });

    const monthly = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => ({
        ...val,
        avgConfidence: val.count > 0 ? (val.confidenceSum / val.count) * 100 : 0
      }));

    // Distribution des diagnostics
    const diagnosisCounts = {};
    analyzed.forEach(c => {
      diagnosisCounts[c.prediction] = (diagnosisCounts[c.prediction] || 0) + 1;
    });
    const diagnosisDistribution = Object.entries(diagnosisCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Distribution par modèle
    const modelCounts = {};
    analyzed.forEach(c => {
      modelCounts[c.model_key] = (modelCounts[c.model_key] || 0) + 1;
    });

    // Sparkline data (confiance au fil du temps)
    const sparklineData = analyzed
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(c => ({ value: (c.confidence || 0) * 100 }));

    return {
      totalConsultations: total,
      analyzedCount: analyzed.length,
      uniqueDiagnostics: new Set(analyzed.map(c => c.prediction)).size,
      avgConfidence: analyzed.length > 0 
        ? (analyzed.reduce((sum, c) => sum + (c.confidence || 0), 0) / analyzed.length) * 100 
        : 0,
      mostCommonDiagnosis: diagnosisDistribution[0] || null,
      monthly,
      diagnosisDistribution,
      modelCounts,
      sparklineData,
      pendingCount: total - analyzed.length
    };
  }, [analyzedData, filteredConsultations]);

  const modelOptions = [
    { key: "all", label: "Tous", icon: "🔬" },
    { key: "chest", label: "Thorax", icon: "🫁" },
    { key: "brain", label: "Cerveau", icon: "🧠" },
    { key: "lung", label: "Poumon", icon: "🔬" },
    { key: "retina", label: "Rétine", icon: "👁️" }
  ];

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: THEME.pageBg
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: 60,
            height: 60,
            border: "4px solid rgba(212, 165, 0, 0.15)",
            borderTopColor: "#D4A500",
            borderRadius: "50%"
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ background: THEME.pageBg, minHeight: "100vh", paddingBottom: 60 }}>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER HERO */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: THEME.gradientNavy,
        padding: "40px 40px 32px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Pattern de fond */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,215,0,0.3) 1px, transparent 0)`,
          backgroundSize: "32px 32px"
        }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1400, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "rgba(255, 215, 0, 0.15)",
                border: "2px solid rgba(255, 215, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)"
              }}>
                <PatientIcons.Evolution size={26} color="#FFD700" />
              </div>
              <div>
                <h1 style={{
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "-0.02em"
                }}>
                  Évolution de ma <span style={{ color: "#FFD700" }}>santé</span>
                </h1>
                <p style={{
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.6)",
                  margin: "6px 0 0"
                }}>
                  Suivi intelligent de vos analyses médicales dans le temps
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filtres rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", alignItems: "center" }}
          >
            {/* Sélecteur de période */}
            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 4,
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              {[
                { key: "3months", label: "3 mois" },
                { key: "6months", label: "6 mois" },
                { key: "1year", label: "1 an" },
                { key: "all", label: "Tout" }
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 10,
                    background: period === p.key ? "rgba(255, 215, 0, 0.2)" : "transparent",
                    border: "none",
                    color: period === p.key ? "#FFD700" : "rgba(255,255,255,0.6)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit"
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Sélecteur de modèle */}
            <div style={{
              display: "flex",
              gap: 8,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 4,
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              {modelOptions.map(m => (
                <button
                  key={m.key}
                  onClick={() => setSelectedModel(m.key)}
                  title={m.label}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    background: selectedModel === m.key ? "rgba(255, 215, 0, 0.2)" : "transparent",
                    border: "none",
                    color: selectedModel === m.key ? "#FFD700" : "rgba(255,255,255,0.6)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit"
                  }}
                >
                  {m.icon}
                </button>
              ))}
            </div>

            {/* Bouton retour */}
            <button
              onClick={() => navigate("/patient/resultats")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
                marginLeft: "auto"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.06)";
              }}
            >
              <PatientIcons.ArrowRight size={16} style={{ transform: "rotate(180deg)" }} />
              Retour aux résultats
            </button>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CONTENU PRINCIPAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>

        {/* ── Cartes de statistiques ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: 32
        }}>
          <StatCard
            label="Consultations analysées"
            value={stats.analyzedCount}
            icon={<PatientIcons.Results size={22} />}
            color="#D4A500"
            subtitle={`Sur ${stats.totalConsultations} total`}
            sparklineData={stats.sparklineData}
            delay={0}
          />
          <StatCard
            label="Confiance moyenne"
            value={stats.avgConfidence}
            icon={<PatientIcons.Check size={22} />}
            color="#10B981"
            subtitle="Score IA global"
            sparklineData={stats.sparklineData.map((d, i) => ({ value: d.value }))}
            delay={0.1}
          />
          <StatCard
            label="Pathologies détectées"
            value={stats.uniqueDiagnostics}
            icon={<PatientIcons.Evolution size={22} />}
            color="#3B82F6"
            subtitle="Diagnostics uniques"
            delay={0.2}
          />
          <StatCard
            label="Diagnostic fréquent"
            value={stats.mostCommonDiagnosis?.count || 0}
            icon={<PatientIcons.MedicalHistory size={22} />}
            color="#8B5CF6"
            subtitle={stats.mostCommonDiagnosis?.name || "Aucun"}
            delay={0.3}
          />
        </div>

        {/* ── Onglets de navigation ── */}
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          background: THEME.cardBg,
          borderRadius: 16,
          padding: 6,
          border: "1px solid rgba(30, 60, 110, 0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          width: "fit-content"
        }}>
          {[
            { key: "overview", label: "Vue d'ensemble", icon: "📊" },
            { key: "timeline", label: "Timeline", icon: "📅" },
            { key: "distribution", label: "Distribution", icon: "🎯" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 12,
                background: activeTab === tab.key ? THEME.gradientGold : "transparent",
                border: "none",
                color: activeTab === tab.key ? "#0F1B2D" : "#64748B",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit"
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CONTENU DES ONGLETS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">

          {/* ── ONGLET: VUE D'ENSEMBLE ── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                {/* Graphique principal */}
                <div style={{
                  background: THEME.cardBg,
                  borderRadius: 24,
                  padding: 28,
                  border: "1px solid rgba(30, 60, 110, 0.08)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: THEME.navy, margin: 0 }}>
                        Évolution mensuelle
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: "4px 0 0" }}>
                        Nombre d'analyses par mois
                      </p>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 14px",
                      borderRadius: 10,
                      background: "rgba(212, 165, 0, 0.08)",
                      border: "1px solid rgba(212, 165, 0, 0.2)"
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4A500" }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#D4A500" }}>
                        {stats.monthly.length} mois
                      </span>
                    </div>
                  </div>

                  {stats.monthly.length > 0 ? (
                    <AnimatedBarChart 
                      data={stats.monthly} 
                      maxValue={Math.max(...stats.monthly.map(m => m.count), 1)}
                      color="#D4A500"
                    />
                  ) : (
                    <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
                      <PatientIcons.Info size={40} />
                      <p style={{ marginTop: 12, fontSize: "0.9rem" }}>Aucune donnée pour cette période</p>
                    </div>
                  )}
                </div>

                {/* Gauge de confiance + Résumé */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Gauge */}
                  <div style={{
                    background: THEME.cardBg,
                    borderRadius: 24,
                    padding: 28,
                    border: "1px solid rgba(30, 60, 110, 0.08)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: THEME.navy, margin: "0 0 16px" }}>
                      Confiance moyenne
                    </h3>
                    <ConfidenceGauge value={stats.avgConfidence} size={180} />
                    <div style={{
                      marginTop: 16,
                      padding: "8px 16px",
                      borderRadius: 12,
                      background: stats.avgConfidence >= 80 ? "#D1FAE5" : stats.avgConfidence >= 60 ? "#FEF3C7" : "#FEE2E2",
                      color: stats.avgConfidence >= 80 ? "#059669" : stats.avgConfidence >= 60 ? "#D97706" : "#DC2626",
                      fontSize: "0.8rem",
                      fontWeight: 700
                    }}>
                      {stats.avgConfidence >= 80 ? "✅ Excellente fiabilité" : stats.avgConfidence >= 60 ? "⚠️ Fiabilité moyenne" : "❌ Fiabilité faible"}
                    </div>
                  </div>

                  {/* Résumé rapide */}
                  <div style={{
                    background: THEME.cardBg,
                    borderRadius: 24,
                    padding: 24,
                    border: "1px solid rgba(30, 60, 110, 0.08)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    flex: 1
                  }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: THEME.navy, margin: "0 0 16px" }}>
                      Résumé
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { label: "En attente d'analyse", value: stats.pendingCount, color: "#F59E0B" },
                        { label: "Analyses complétées", value: stats.analyzedCount, color: "#10B981" },
                        { label: "Types d'examens", value: Object.keys(stats.modelCounts).length, color: "#3B82F6" },
                        { label: "Diagnostics uniques", value: stats.uniqueDiagnostics, color: "#8B5CF6" }
                      ].map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            borderRadius: 12,
                            background: `${item.color}08`,
                            border: `1px solid ${item.color}20`
                          }}
                        >
                          <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 500 }}>{item.label}</span>
                          <span style={{ fontSize: "1rem", fontWeight: 700, color: item.color }}>{item.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ONGLET: TIMELINE ── */}
          {activeTab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{
                background: THEME.cardBg,
                borderRadius: 24,
                padding: 32,
                border: "1px solid rgba(30, 60, 110, 0.08)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
              }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: THEME.navy, margin: "0 0 24px" }}>
                  Historique chronologique
                </h3>

                {analyzedData.length > 0 ? (
                  <Timeline consultations={analyzedData} />
                ) : (
                  <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
                    <PatientIcons.Calendar size={48} />
                    <p style={{ marginTop: 16, fontSize: "1rem" }}>Aucune analyse dans cette période</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ONGLET: DISTRIBUTION ── */}
          {activeTab === "distribution" && (
            <motion.div
              key="distribution"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Distribution des diagnostics */}
                <div style={{
                  background: THEME.cardBg,
                  borderRadius: 24,
                  padding: 28,
                  border: "1px solid rgba(30, 60, 110, 0.08)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
                }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: THEME.navy, margin: "0 0 20px" }}>
                    Fréquence des diagnostics
                  </h3>

                  {stats.diagnosisDistribution.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {stats.diagnosisDistribution.map((diag, idx) => {
                        const total = stats.analyzedCount;
                        const percentage = (diag.count / total) * 100;
                        const colors = ["#D4A500", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#06B6D4", "#F59E0B"];
                        const color = colors[idx % colors.length];

                        return (
                          <motion.div
                            key={diag.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08, duration: 0.4 }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  background: color
                                }} />
                                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: THEME.navy, textTransform: "capitalize" }}>
                                  {diag.name}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: 700, color }}>{diag.count}</span>
                                <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>({percentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <div style={{
                              height: 8,
                              background: "#E2E8F0",
                              borderRadius: 4,
                              overflow: "hidden"
                            }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: idx * 0.08 + 0.2, duration: 0.8, ease: "easeOut" }}
                                style={{
                                  height: "100%",
                                  background: `linear-gradient(90deg, ${color}, ${color}80)`,
                                  borderRadius: 4
                                }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                      Aucun diagnostic enregistré
                    </div>
                  )}
                </div>

                {/* Heatmap des diagnostics */}
                <div style={{
                  background: THEME.cardBg,
                  borderRadius: 24,
                  padding: 28,
                  border: "1px solid rgba(30, 60, 110, 0.08)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
                }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: THEME.navy, margin: "0 0 20px" }}>
                    Carte thermique
                  </h3>

                  {stats.diagnosisDistribution.length > 0 ? (
                    <DiagnosisHeatmap data={stats.diagnosisDistribution} />
                  ) : (
                    <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                      Aucune donnée à afficher
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HealthEvolutionPage;
