// frontend/src/pages/patient/ResultDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PatientPageLayout } from "../../components/patient/PatientPageLayout";
import { useAuth } from "../../context/AuthContext";
import { PatientIcons } from "../../constants/patientIcons";

const API = "http://localhost:8000/api/v1";

const MODEL_CONFIG = {
  chest: { label: "Radiographie thoracique", icon: "🫁", color: "#2D5F9E", bg: "#EFF6FF" },
  brain: { label: "IRM cérébrale", icon: "🧠", color: "#6B4FA0", bg: "#F5F3FF" },
  lung: { label: "Scanner CT pulmonaire", icon: "🔬", color: "#D62828", bg: "#FEF2F2" },
  retina: { label: "Fond d'œil", icon: "👁️", color: "#0E7490", bg: "#ECFEFF" }
};

const SEVERITY_CONFIG = {
  critical: { label: "CRITIQUE - Consultation urgente recommandée", color: "#EF4444", bg: "#FEE2E2" },
  urgent: { label: "URGENT - Consultation rapide recommandée", color: "#F59E0B", bg: "#FEF3C7" },
  normal: { label: "NORMAL - Suivi standard", color: "#10B981", bg: "#D1FAE5" }
};

const ResultDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("medai-token");

  const [consultation, setConsultation] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGradcam, setShowGradcam] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/consultations/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConsultation(data.consultation);
          setAnalysis(data.analysis);

          if (data.consultation?.image_path) {
            fetchImage(data.consultation.image_path);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const fetchImage = async (imagePath) => {
    try {
      // Extraire SEULEMENT le nom du fichier (handle both / and \
      const filename = imagePath.replace(/\\/g, '/').split('/').pop();
      console.log("[fetchImage] path:", imagePath, "| filename:", filename);

      const res = await fetch(`${API}/consultations/files/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const blob = await res.blob();

      if (!blob.type.startsWith('image/')) {
        throw new Error(`Type invalide: ${blob.type}`);
      }

      const url = URL.createObjectURL(blob);
      setImageDataUrl(url);
    } catch (err) {
      console.error("Erreur chargement image:", err);
      setImageDataUrl(null);
    }
  };

  const downloadReport = async () => {
    if (!consultation || !analysis) return;
    setDownloading(true);

    try {
      let imageBlob;

      // Priorité 1: utiliser le blob URL déjà chargé
      if (imageDataUrl && imageDataUrl.startsWith('blob:')) {
        const response = await fetch(imageDataUrl);
        imageBlob = await response.blob();
      } else {
        // Priorité 2: re-télécharger depuis le backend
        const filename = consultation.image_path.replace(/\\/g, '/').split('/').pop();
        console.log("[downloadReport] filename:", filename);

        const imageRes = await fetch(`${API}/consultations/files/${filename}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!imageRes.ok) {
          throw new Error(`Impossible de récupérer l'image: ${imageRes.status}`);
        }

        imageBlob = await imageRes.blob();
      }

      // Vérification cruciale
      if (!imageBlob || imageBlob.size === 0) {
        throw new Error("Image vide");
      }
      if (!imageBlob.type.startsWith('image/')) {
        throw new Error(`Type de fichier invalide: ${imageBlob.type}`);
      }

      const formData = new FormData();
      formData.append("file", new File([imageBlob], "image.jpg", { type: "image/jpeg" }));
      formData.append("explain_text", analysis.explain_text || "");
      formData.append("gradcam_image", analysis.gradcam_b64 || "");

      const params = new URLSearchParams({
        model: consultation.model_key,
        patient_id: user?.full_name || "Patient",
        prediction: analysis.prediction,
        confidence: analysis.confidence,
        probabilities: typeof analysis.probabilities === 'string' 
          ? analysis.probabilities 
          : JSON.stringify(analysis.probabilities || {}),
        report_id: `MEDAI-${consultation.id}-${Date.now()}`
      });

      const res = await fetch(`${API}/report?${params}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur serveur ${res.status}: ${errorText}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport_medical_${consultation.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur téléchargement rapport:", err);
      alert(`Erreur lors du téléchargement: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

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

  if (!consultation || !analysis) {
    return (
      <div style={{ background: "var(--bg, #F0F4FA)", minHeight: "100vh" }}>
        {/* Header Section - Style RemindersPage */}
        <div style={{
          background: "linear-gradient(160deg, #0F1B2D 0%, #1A2D4A 40%, #243B5C 100%)",
          padding: "32px 40px 24px",
          position: "relative",
          overflow: "hidden"
        }}>
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
                <PatientIcons.Info size={20} />
              </div>
              <div>
                <h1 style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "-0.02em"
                }}>
                  Résultat <span style={{ color: "#FFD700" }}>non trouvé</span>
                </h1>
                <p style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.6)",
                  margin: "4px 0 0"
                }}>
                  Cette analyse n'existe pas ou n'est pas accessible
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
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
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              border: "1px solid rgba(239, 68, 68, 0.2)"
            }}>
              <PatientIcons.Info size={36} color="#EF4444" />
            </div>
            <h3 style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#0F1B2D",
              marginBottom: 8
            }}>
              Aucun résultat trouvé
            </h3>
            <p style={{
              fontSize: "0.85rem",
              color: "#94A3B8",
              maxWidth: 300,
              margin: "0 auto 24px",
              lineHeight: 1.6
            }}>
              Cette analyse n'existe pas ou vous n'y avez pas accès.
            </p>
            <button
              onClick={() => navigate("/patient/resultats")}
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
                boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)"
              }}
            >
              <PatientIcons.ArrowLeft size={18} />
              Retour aux résultats
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const model = MODEL_CONFIG[consultation.model_key] || MODEL_CONFIG.chest;
  const severity = SEVERITY_CONFIG[consultation.urgency] || SEVERITY_CONFIG.normal;
  const confidence = (analysis.confidence * 100).toFixed(1);
  const date = new Date(consultation.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  let probabilities = {};
  try {
    probabilities = typeof analysis.probabilities === "string"
      ? JSON.parse(analysis.probabilities)
      : analysis.probabilities || {};
  } catch { probabilities = {}; }

  const sortedProbs = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const maxProb = sortedProbs[0]?.[1] || 1;

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
                Détail du <span style={{ color: "#FFD700" }}>résultat</span>
              </h1>
              <p style={{
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.6)",
                margin: "4px 0 0"
              }}>
                Consultation #{consultation.id} — {model.label}
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
                {model.label}
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
                background: severity.color
              }} />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 600 }}>
                {severity.label}
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
                Confiance: {confidence}%
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
            <button
              onClick={() => navigate("/patient/resultats")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 100,
                background: "transparent",
                border: "1.5px solid rgba(30, 60, 110, 0.15)",
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
                e.target.style.background = "transparent";
              }}
            >
              <PatientIcons.ArrowRight size={16} style={{ transform: "rotate(180deg)" }} />
              Retour
            </button>
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Résultat d'analyse
            </span>
          </div>
          <button
            onClick={downloadReport}
            disabled={downloading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 28px",
              borderRadius: 100,
              background: "linear-gradient(135deg, #FFD700, #D4A500)",
              color: "#0F1B2D",
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              cursor: downloading ? "not-allowed" : "pointer",
              opacity: downloading ? 0.7 : 1,
              boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "inherit"
            }}
            onMouseEnter={(e) => {
              if (!downloading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
            }}
          >
            {downloading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(15, 27, 45, 0.2)",
                  borderTopColor: "#0F1B2D",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }} />
                Téléchargement...
              </>
            ) : (
              <>
                <PatientIcons.Download size={18} />
                Télécharger le rapport
              </>
            )}
          </button>
        </div>

        {/* Content Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start"
        }}>
          {/* Left Column - Image */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Image Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                border: "1px solid rgba(30, 60, 110, 0.08)",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
                overflow: "hidden"
              }}
            >
              {/* Card Header */}
              <div style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(30, 60, 110, 0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #0F1B2D, #1A2D4A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFD700"
                  }}>
                    <PatientIcons.Eye size={16} />
                  </div>
                  <span style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#0F1B2D"
                  }}>
                    {showGradcam ? "Carte de chaleur Grad-CAM" : "Image médicale"}
                  </span>
                </div>
                {analysis.gradcam_b64 && (
                  <button
                    onClick={() => setShowGradcam(!showGradcam)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 12,
                      background: showGradcam ? "rgba(255, 215, 0, 0.12)" : "rgba(30, 60, 110, 0.06)",
                      border: showGradcam ? "1.5px solid rgba(255, 215, 0, 0.3)" : "1.5px solid rgba(30, 60, 110, 0.1)",
                      color: showGradcam ? "#D4A500" : "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {showGradcam ? "← Image originale" : "Voir Grad-CAM →"}
                  </button>
                )}
              </div>

              {/* Image Body */}
              <div style={{
                padding: 24,
                background: "#0F1B2D",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <img
                  src={showGradcam && analysis.gradcam_b64
                    ? `data:image/jpeg;base64,${analysis.gradcam_b64}`
                    : imageDataUrl
                  }
                  alt="Medical image"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 400,
                    borderRadius: 16,
                    objectFit: "contain"
                  }}
                  onError={(e) => { 
                    e.target.src = "https://placehold.co/800x600/e2e8f0/475569?text=Image+non+disponible"; 
                    e.target.onerror = null;
                  }}
                />
              </div>

              {/* Legend */}
              {showGradcam && (
                <div style={{
                  padding: "16px 24px",
                  borderTop: "1px solid rgba(30, 60, 110, 0.06)",
                  background: "#FAFBFC"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8
                  }}>
                    <div style={{
                      height: 8,
                      flex: 1,
                      borderRadius: 4,
                      background: "linear-gradient(90deg, #0000FF, #00FF00, #FFFF00, #FF0000)"
                    }} />
                    <span style={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 500 }}>Faible</span>
                    <span style={{ fontSize: "0.7rem", color: "#EF4444", fontWeight: 600 }}>Forte attention</span>
                  </div>
                  <p style={{
                    fontSize: "0.75rem",
                    color: "#64748B",
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    Les zones <span style={{ color: "#EF4444", fontWeight: 600 }}>rouges</span> indiquent les régions qui ont le plus influencé la décision du modèle IA.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Doctor Card */}
            {consultation.doctor_name && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  padding: "24px 28px",
                  border: "1px solid rgba(30, 60, 110, 0.08)",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #0F1B2D, #1A2D4A)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFD700",
                  fontWeight: 700,
                  fontSize: "1.1rem"
                }}>
                  {consultation.doctor_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    color: "#0F1B2D",
                    fontSize: "0.95rem"
                  }}>
                    Dr. {consultation.doctor_name}
                  </div>
                  <div style={{
                    fontSize: "0.8rem",
                    color: "#94A3B8",
                    marginTop: 2
                  }}>
                    {consultation.doctor_specialty || "Médecin traitant"}
                  </div>
                </div>
                <button
                  onClick={() => navigate("/patient/messages")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    background: "rgba(30, 60, 110, 0.06)",
                    border: "1.5px solid rgba(30, 60, 110, 0.1)",
                    color: "#475569",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255, 215, 0, 0.1)";
                    e.target.style.borderColor = "rgba(255, 215, 0, 0.25)";
                    e.target.style.color = "#D4A500";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(30, 60, 110, 0.06)";
                    e.target.style.borderColor = "rgba(30, 60, 110, 0.1)";
                    e.target.style.color = "#475569";
                  }}
                >
                  Contacter
                </button>
              </motion.div>
            )}
          </div>

          {/* Right Column - Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Diagnosis Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                border: `1.5px solid ${severity.color}30`,
                boxShadow: `0 4px 20px ${severity.color}10`,
                overflow: "hidden",
                position: "relative"
              }}
            >
              {/* Top accent bar */}
              <div style={{
                height: 4,
                background: `linear-gradient(90deg, ${model.color}, ${severity.color})`
              }} />

              <div style={{ padding: "28px" }}>
                {/* Diagnosis Header */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20
                }}>
                  <div>
                    <div style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: 8
                    }}>
                      Diagnostic principal
                    </div>
                    <div style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: "#0F1B2D",
                      letterSpacing: "-0.02em"
                    }}>
                      {analysis.prediction}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: severity.color,
                      lineHeight: 1
                    }}>
                      {confidence}%
                    </div>
                    <div style={{
                      fontSize: "0.7rem",
                      color: "#94A3B8",
                      fontWeight: 600,
                      marginTop: 4
                    }}>
                      confiance IA
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div style={{
                  height: 6,
                  borderRadius: 3,
                  background: "#E2E8F0",
                  overflow: "hidden",
                  marginBottom: 16
                }}>
                  <div style={{
                    height: "100%",
                    width: `${confidence}%`,
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${model.color}, ${severity.color})`,
                    transition: "width 1s ease"
                  }} />
                </div>

                {/* Severity Badge */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: severity.bg,
                  border: `1.5px solid ${severity.color}30`
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: severity.color
                  }} />
                  <span style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: severity.color
                  }}>
                    {severity.label}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Probabilities Card */}
            {sortedProbs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  border: "1px solid rgba(30, 60, 110, 0.08)",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
                  overflow: "hidden"
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid rgba(30, 60, 110, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #0F1B2D, #1A2D4A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFD700"
                  }}>
                    <PatientIcons.Evolution size={16} />
                  </div>
                  <span style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#0F1B2D"
                  }}>
                    Distribution des probabilités
                  </span>
                </div>

                {/* Probabilities List */}
                <div style={{ padding: "20px 24px" }}>
                  {sortedProbs.slice(0, 5).map(([cls, prob], i) => {
                    const isTop = i === 0;
                    const barWidth = (prob / maxProb) * 100;
                    return (
                      <div key={cls} style={{
                        marginBottom: i < 4 ? 16 : 0
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6
                        }}>
                          <span style={{
                            fontSize: "0.85rem",
                            fontWeight: isTop ? 700 : 500,
                            color: isTop ? severity.color : "#475569",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            {isTop && <span style={{ fontSize: "0.9rem" }}>🏆</span>}
                            {cls}
                          </span>
                          <span style={{
                            fontSize: "0.85rem",
                            fontWeight: isTop ? 700 : 500,
                            color: isTop ? severity.color : "#64748B"
                          }}>
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div style={{
                          height: 6,
                          borderRadius: 3,
                          background: "#E2E8F0",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${barWidth}%`,
                            borderRadius: 3,
                            background: isTop
                              ? `linear-gradient(90deg, ${model.color}, ${severity.color})`
                              : "#CBD5E1",
                            transition: "width 0.8s ease"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Explanation Card */}
            {analysis.explain_text && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  border: "1px solid rgba(30, 60, 110, 0.08)",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
                  overflow: "hidden"
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid rgba(30, 60, 110, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #0F1B2D, #1A2D4A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFD700"
                  }}>
                    <PatientIcons.MedicalHistory size={16} />
                  </div>
                  <span style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#0F1B2D"
                  }}>
                    Explication clinique
                  </span>
                </div>

                {/* Explanation Content */}
                <div style={{ padding: "24px" }}>
                  {analysis.explain_text.split('\n').map((line, i) => {
                    if (line.startsWith('##')) {
                      return (
                        <div key={i} style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#2563EB",
                          marginTop: i > 0 ? 16 : 0,
                          marginBottom: 8
                        }}>
                          {line.replace('## ', '')}
                        </div>
                      );
                    }
                    return line.trim() ? (
                      <p key={i} style={{
                        fontSize: "0.8rem",
                        color: "#475569",
                        lineHeight: 1.6,
                        margin: "0 0 8px"
                      }}>
                        {line}
                      </p>
                    ) : null;
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{
          display: "flex",
          gap: 16,
          marginTop: 32,
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => navigate("/patient/messages")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              borderRadius: 100,
              background: "transparent",
              border: "1.5px solid rgba(30, 60, 110, 0.15)",
              color: "#475569",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(30, 60, 110, 0.04)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            <PatientIcons.Message size={18} />
            Contacter mon médecin
          </button>
          <button
            onClick={() => navigate("/patient/consultation/new")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              borderRadius: 100,
              background: "linear-gradient(135deg, #FFD700, #D4A500)",
              color: "#0F1B2D",
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "inherit"
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
        </div>
      </div>
    </div>
  );
};

export default ResultDetailPage;
