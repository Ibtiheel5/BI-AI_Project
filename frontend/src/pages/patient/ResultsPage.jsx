// frontend/src/pages/patient/ResultsPage.jsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:8000/api/v1";

const MODEL_CONFIG = {
  chest: { label: "Radiographie thoracique", icon: "🫁", color: "#2D5F9E", bg: "#EFF6FF" },
  brain: { label: "IRM cerebrale", icon: "🧠", color: "#6B4FA0", bg: "#F5F3FF" },
  lung: { label: "Scanner CT pulmonaire", icon: "🔬", color: "#D62828", bg: "#FEF2F2" },
  retina: { label: "Fond d'oeil", icon: "👁️", color: "#0E7490", bg: "#ECFEFF" }
};

const SEVERITY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#EF4444", bg: "#FEE2E2" },
  urgent: { label: "URGENT", color: "#F59E0B", bg: "#FEF3C7" },
  normal: { label: "NORMAL", color: "#10B981", bg: "#D1FAE5" }
};

const ResultCard = ({ result, onClick, index }) => {
  const model = MODEL_CONFIG[result.model_key] || MODEL_CONFIG.chest;
  const severity = SEVERITY_CONFIG[result.urgency] || SEVERITY_CONFIG.normal;
  const confidence = result.confidence ? (result.confidence * 100).toFixed(1) : null;
  const date = new Date(result.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      style={{
        background: "#FFFFFF",
        borderRadius: 24,
        padding: "24px 28px",
        border: "1px solid rgba(30, 60, 110, 0.08)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 20,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.02)";
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 20,
        bottom: 20,
        width: 4,
        borderRadius: "0 4px 4px 0",
        background: severity.color
      }} />

      {/* Model Icon */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: model.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.8rem",
        flexShrink: 0,
        marginLeft: 8
      }}>
        {model.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
          flexWrap: "wrap"
        }}>
          <span style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#0F1B2D"
          }}>
            #{result.id}
          </span>
          <span style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            background: severity.bg,
            color: severity.color,
            border: `1px solid ${severity.color}30`
          }}>
            {severity.label}
          </span>
          <span style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            background: model.bg,
            color: model.color,
            border: `1px solid ${model.color}30`
          }}>
            {model.label}
          </span>
        </div>

        <div style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "#0F1B2D",
          marginBottom: 8,
          textTransform: "capitalize"
        }}>
          {result.prediction || "En attente d'analyse"}
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap"
        }}>
          <span style={{
            fontSize: "0.75rem",
            color: "#94A3B8",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <PatientIcons.Calendar size={13} />
            {date}
          </span>
          {confidence && (
            <span style={{
              fontSize: "0.75rem",
              color: severity.color,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <PatientIcons.Evolution size={13} />
              Confiance: {confidence}%
            </span>
          )}
          <span style={{
            fontSize: "0.75rem",
            color: "#94A3B8",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <PatientIcons.Profile size={13} />
            {result.doctor_name || "En attente"}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: "rgba(30, 60, 110, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94A3B8",
        flexShrink: 0,
        transition: "all 0.2s ease"
      }}>
        <PatientIcons.ArrowRight size={18} />
      </div>
    </motion.div>
  );
};

const ResultsPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  useEffect(() => {
   const fetchConsultations = async () => {
  if (!token) {
    console.log("❌ Pas de token");
    setLoading(false);
    return;
  }

  try {
    console.log("🔍 Appel API:", `${API}/consultations/my`);
    const response = await fetch(`${API}/consultations/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("📦 Données reçues:", data);
      console.log("📋 Consultations:", data.consultations);
      console.log("🔢 Nombre:", data.consultations?.length);
      
      setConsultations(data.consultations || []);
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur API:", response.status, errorText);
    }
  } catch (err) {
    console.error("❌ Exception:", err);
  } finally {
    setLoading(false);
  }
};

    fetchConsultations();
  }, [token]);

  const analyzedResults = useMemo(() => {
    let results = (consultations || []).filter(c =>
      c.status === "analyzed" && c.prediction
    );

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(c =>
        c.prediction?.toLowerCase().includes(term) ||
        c.id?.toString().includes(term) ||
        (c.doctor_name?.toLowerCase().includes(term))
      );
    }

    if (filterModel !== "all") {
      results = results.filter(c => c.model_key === filterModel);
    }

    if (filterPeriod !== "all") {
      const now = new Date();
      const periods = {
        week: 7,
        month: 30,
        year: 365
      };
      const days = periods[filterPeriod];
      if (days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        results = results.filter(c => new Date(c.created_at) > cutoff);
      }
    }

    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [consultations, searchTerm, filterModel, filterPeriod]);

  const models = [
    { key: "all", label: "Tous les examens" },
    { key: "chest", label: "Radiographie thoracique" },
    { key: "brain", label: "IRM cerebrale" },
    { key: "lung", label: "Scanner CT" },
    { key: "retina", label: "Fond d'oeil" }
  ];

  const periodOptions = [
    { value: "all", label: "Toute la periode" },
    { value: "week", label: "7 derniers jours" },
    { value: "month", label: "30 derniers jours" },
    { value: "year", label: "12 derniers mois" }
  ];

  const stats = useMemo(() => {
    const results = analyzedResults;
    const uniqueModels = new Set(results.map(r => r.model_key));
    const uniquePredictions = new Set(results.map(r => r.prediction));
    const totalConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0);

    return {
      total: results.length,
      models: uniqueModels.size,
      pathologies: uniquePredictions.size,
      avgConfidence: results.length ? (totalConfidence / results.length * 100).toFixed(1) : 0
    };
  }, [analyzedResults]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        background: "var(--bg, #F0F4FA)"
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: "3px solid rgba(212, 165, 0, 0.2)",
          borderTopColor: "#D4A500",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg, #F0F4FA)", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header Section - Style RemindersPage */}
      <div style={{
        background: "linear-gradient(160deg, #0F1B2D 0%, #1A2D4A 40%, #243B5C 100%)",
        padding: "32px 40px 24px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle grid background */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage: `linear-gradient(rgba(255, 215, 0, 0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 215, 0, 0.15) 1px, transparent 1px)`,
          backgroundSize: "50px 50px"
        }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255, 215, 0, 0.12)",
              border: "1px solid rgba(255, 215, 0, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFD700"
            }}>
              <PatientIcons.Results size={20} />
            </div>
            <div>
              <h1 style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                letterSpacing: "-0.02em"
              }}>
                Mes <span style={{ color: "#FFD700" }}>resultats</span>
              </h1>
              <p style={{
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.6)",
                margin: "4px 0 0"
              }}>
                Tous vos diagnostics et analyses medicales
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{
            display: "flex",
            gap: 16,
            marginTop: 20,
            flexWrap: "wrap"
          }}>
            <div style={{
              background: "rgba(255, 215, 0, 0.08)",
              border: "1px solid rgba(255, 215, 0, 0.2)",
              borderRadius: 16,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#FFD700",
                boxShadow: "0 0 8px rgba(255, 215, 0, 0.5)"
              }} />
              <span style={{ color: "#FFD700", fontSize: "0.75rem", fontWeight: 600 }}>
                {stats.total} resultats
              </span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#3B82F6"
              }} />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 600 }}>
                {stats.models} types d'examens
              </span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10B981"
              }} />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 600 }}>
                {stats.pathologies} pathologies
              </span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#8B5CF6"
              }} />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 600 }}>
                Confiance moy: {stats.avgConfidence}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        {/* Action Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              {analyzedResults.length} resultat{analyzedResults.length > 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => navigate("/patient/resultats/evolution")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 12,
                background: "#FFFFFF",
                border: "1.5px solid rgba(30, 60, 110, 0.1)",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255, 215, 0, 0.08)";
                e.target.style.borderColor = "rgba(255, 215, 0, 0.2)";
                e.target.style.color = "#D4A500";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#FFFFFF";
                e.target.style.borderColor = "rgba(30, 60, 110, 0.1)";
                e.target.style.color = "#475569";
              }}
            >
              <PatientIcons.Evolution size={16} />
              Evolution
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 12,
                background: "#FFFFFF",
                border: "1.5px solid rgba(30, 60, 110, 0.1)",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(30, 60, 110, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#FFFFFF";
              }}
            >
              <PatientIcons.Refresh size={16} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "24px 28px",
            border: "1px solid rgba(30, 60, 110, 0.08)",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
            marginBottom: 28,
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center"
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 300px" }}>
            <span style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
              display: "flex",
              alignItems: "center"
            }}>
              <PatientIcons.Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Rechercher par diagnostic, ID ou medecin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                borderRadius: 14,
                border: "1.5px solid rgba(30, 60, 110, 0.12)",
                fontSize: "0.85rem",
                background: "#FAFBFC",
                outline: "none",
                fontFamily: "inherit",
                color: "#0F1B2D",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#D4A500";
                e.target.style.boxShadow = "0 0 0 3px rgba(255, 215, 0, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(30, 60, 110, 0.12)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Model filter */}
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "1.5px solid rgba(30, 60, 110, 0.12)",
              fontSize: "0.85rem",
              background: "#FAFBFC",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "#0F1B2D",
              outline: "none",
              minWidth: 180
            }}
          >
            {models.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>

          {/* Period filter */}
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "1.5px solid rgba(30, 60, 110, 0.12)",
              fontSize: "0.85rem",
              background: "#FAFBFC",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "#0F1B2D",
              outline: "none",
              minWidth: 160
            }}
          >
            {periodOptions.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </motion.div>

        {/* Results List */}
        {analyzedResults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              textAlign: "center",
              padding: "80px 40px",
              background: "#FFFFFF",
              borderRadius: 28,
              border: "1px solid rgba(30, 60, 110, 0.08)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)"
            }}
          >
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(212, 165, 0, 0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              border: "1px solid rgba(255, 215, 0, 0.2)"
            }}>
              <PatientIcons.Results size={36} color="#D4A500" />
            </div>
            <h3 style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#0F1B2D",
              marginBottom: 8
            }}>
              Aucun resultat
            </h3>
            <p style={{
              fontSize: "0.85rem",
              color: "#94A3B8",
              maxWidth: 400,
              margin: "0 auto 24px",
              lineHeight: 1.6
            }}>
              {consultations.length === 0
                ? "Vous n'avez pas encore de consultation."
                : "Aucune de vos consultations n'a encore ete analysee."}
            </p>
            <button
              onClick={() => navigate("/patient/consultation/new")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                borderRadius: 100,
                background: "linear-gradient(135deg, #FFD700, #D4A500)",
                color: "#0F1B2D",
                fontWeight: 700,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)",
                fontFamily: "inherit",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
              }}
            >
              <PatientIcons.Add size={18} />
              Nouvelle consultation
            </button>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {analyzedResults.map((result, idx) => (
              <ResultCard
                key={result.id}
                result={result}
                onClick={() => navigate(`/patient/resultats/${result.id}`)}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;