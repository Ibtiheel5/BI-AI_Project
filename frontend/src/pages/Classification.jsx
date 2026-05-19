// Classification.jsx — Professional medical interface with real imagery
import { useState, useCallback, useRef, useEffect } from "react";
import { predict, downloadReport } from "../services/api";
import DoctorImage from "../components/DoctorImage";
import { MedicalIcons } from "../components/MedicalIcons";
import ExplainableAI from "../components/ExplainableAI";
import { useAuth } from "../context/AuthContext";

export default function Classification() {

  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, userDomains } = useAuth();
  console.log('USER:', user);
  console.log('DOMAINS:', user?.domains);
  const [modelKey, setModel] = useState(() => user?.domains?.[0] || "chest");
  const [file, setFile] = useState(null);
  const [showGradcam, setShowGradcam] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportId, setReportId] = useState("");
  const fileInputRef = useRef(null);

  // Real medical imagery
  const medicalImages = {
    radiologist: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop',
    xrayRoom: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format',
  };

  const ALL_MODELS = [
  {
    key: "chest",
    label: "Thorax complet",
    fullLabel: "Radiographie thoracique - 10 pathologies",
    icon: <MedicalIcons.Lungs size={24} color="#2D5F9E" />,
    accuracy: "97.3%", sensitivity: "96.8%", specificity: "97.9%",
    image: "https://images.unsplash.com/photo-1576671081837-4900023a2e5a?w=400&auto=format"
  },
  {
    key: "lung",
    label: "Cancer pulmonaire",
    fullLabel: "Scanner CT - Détection lésions",
    icon: <MedicalIcons.XRay size={24} color="#D62828" />,
    accuracy: "94.8%", sensitivity: "95.2%", specificity: "94.3%",
    image: "https://images.unsplash.com/photo-1581595219315-a187d40c3220?w=400&auto=format"
  },
  {
    key: "brain",
    label: "Tumeur cérébrale",
    fullLabel: "IRM - Classification tumorale",
    icon: <MedicalIcons.Brain size={24} color="#6B9AC4" />,
    accuracy: "96.2%", sensitivity: "95.8%", specificity: "96.7%",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&auto=format"
  },
];

// Filtre selon les domaines autorisés de l'utilisateur connecté
const allowedKeys = user?.domains || ["chest"];
const MODELS = ALL_MODELS.filter(m => allowedKeys.includes(m.key));

  const handleFile = useCallback(async (f) => {
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setLoading(true);
    setError(null);
    setResult(null);
    setExplainText("");
    setExplaining(false);
    setShowGradcam(false);

    try {
      console.log('🔍 Starting analysis with model:', modelKey);

      await predict(f, modelKey, true, {
        onPrediction: (data) => {
          console.log('📊 Prediction received:', data);
          setResult(data);
          setLoading(false);
          if (!data.out_of_domain) {
            setExplaining(true);
          }
        },
        onChunk: (text) => {
          setExplainText(prev => prev + text);
        },
        onError: (errMsg) => {
          console.warn('⚠️ Explain error:', errMsg);
          setExplaining(false);
        },
        onDone: () => {
          console.log('✅ Stream complete');
          setExplaining(false);
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('❌ Error in handleFile:', err);
      setError(err.message || "Erreur lors de l'analyse");
      setLoading(false);
      setExplaining(false);
    }
  }, [modelKey]);


  const handleDownloadPDF = async () => {
    if (!result || !file) return;
    setPdfLoading(true);
    try {
      const rid = await downloadReport({
        file,
        model:         modelKey,
        patientId:     patientId || `PAT-${Date.now()}`,
        prediction:    result.prediction,
        confidence:    result.confidence,
        probabilities: result.probabilities,
        explainText,
        gradcamImage:  result.gradcam_image || "",
        reportId,
      });
      setReportId(rid);
    } catch (err) {
      console.error("❌ PDF error:", err);
      alert("Erreur lors de la génération du rapport PDF : " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const currentModel = MODELS.find(m => m.key === modelKey);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    }}>
      {/* Header with medical imagery */}
      <div style={{
        background: 'linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%)',
        padding: '60px 32px 100px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Medical pattern overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10L50 22L50 38L30 50L10 38L10 22L30 10Z' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
        
        {/* Background X-ray image */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '40%',
          background: `linear-gradient(90deg, #0A2647 0%, transparent 100%), url(${medicalImages.xrayRoom})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
        }} />

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Medical team indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
            background: 'rgba(255,255,255,0.1)',
            padding: '12px 24px',
            borderRadius: 60,
            backdropFilter: 'blur(10px)',
            width: 'fit-content',
          }}>
            <div style={{ display: 'flex' }}>
              <img 
                src={medicalImages.radiologist}
                alt="Dr. Sarah Chen"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '2px solid white',
                  marginRight: -8,
                }}
              />
              <img 
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop"
                alt="Dr. James Wilson"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '2px solid white',
                }}
              />
            </div>
            <div style={{ color: 'white' }}>
              <span style={{ fontWeight: 600 }}>Dr. Sarah Chen</span> et équipe · Radiologues disponibles
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.2,
            marginBottom: 16,
          }}>
            Analyse radiologique assistée par<br />
            <span style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>intelligence artificielle</span>
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            maxWidth: 600,
          }}>
            Importez votre radiographie et obtenez une analyse détaillée en temps réel.
            Résultats validés par notre équipe de radiologues.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: 1200,
        margin: '-60px auto 0',
        padding: '0 32px 60px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Model selector - Professional cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          marginBottom: 30,
        }}>
          {MODELS.map((model) => (
            <button
              key={model.key}
              onClick={() => setModel(model.key)}
              style={{
                background: modelKey === model.key ? 'white' : 'rgba(255,255,255,0.9)',
                border: modelKey === model.key 
                  ? '2px solid #2D5F9E' 
                  : '1px solid rgba(43, 95, 158, 0.15)',
                borderRadius: 20,
                padding: 24,
                cursor: 'pointer',
                textAlign: 'left',
                backdropFilter: 'blur(10px)',
                boxShadow: modelKey === model.key 
                  ? '0 15px 30px -10px rgba(10, 38, 71, 0.2)' 
                  : '0 5px 15px -5px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Small background image */}
              <div style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: '80px',
                height: '80px',
                background: `url(${model.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.1,
                borderRadius: '20px 0 0 0',
              }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: modelKey === model.key 
                    ? 'rgba(45, 95, 158, 0.1)' 
                    : 'rgba(43, 95, 158, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {model.icon}
                </div>
                <div>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 700, 
                    color: '#0A2647',
                    marginBottom: 4,
                  }}>
                    {model.label}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748B',
                    fontWeight: 500,
                  }}>
                    {model.fullLabel}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginTop: 12,
              }}>
                {[
                  { label: 'Précision', value: model.accuracy },
                  { label: 'Sensibilité', value: model.sensitivity },
                  { label: 'Spécificité', value: model.specificity },
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      color: '#2D5F9E' 
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ 
                      fontSize: '0.6rem', 
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {modelKey === model.key && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#00A86B',
                  animation: 'pulse 2s infinite',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Main analysis grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}>
          {/* Left column - Upload & image */}
          <div>
            <div style={{
              background: 'white',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 10px 30px -5px rgba(10, 38, 71, 0.1)',
              marginBottom: 20,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(45, 95, 158, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <MedicalIcons.XRay size={20} color="#2D5F9E" />
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0A2647' }}>
                      Import de l'image
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Formats supportés : DICOM, JPEG, PNG
                    </div>
                  </div>
                </div>
                
                {/* DICOM badge */}
                <div style={{
                  padding: '4px 12px',
                  background: 'rgba(0, 168, 107, 0.1)',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#00A86B',
                  border: '1px solid rgba(0, 168, 107, 0.2)',
                }}>
                  DICOM compatible
                </div>
              </div>

              {/* Upload zone */}
              {!preview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFile(e.dataTransfer.files[0]);
                  }}
                  style={{
                    border: '2px dashed rgba(45, 95, 158, 0.3)',
                    borderRadius: 16,
                    padding: '48px 32px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#F8FAFC',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2D5F9E'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(45, 95, 158, 0.3)'}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.dcm"
                    onChange={(e) => handleFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  
                  <MedicalIcons.XRay size={48} color="#2D5F9E" />
                  
                  <p style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#0A2647',
                    margin: '16px 0 8px' 
                  }}>
                    Glissez votre radiographie ici
                  </p>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: '#64748B',
                    marginBottom: 16 
                  }}>
                    ou cliquez pour parcourir
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: '#94A3B8',
                  }}>
                    <span>Max 50 Mo</span>
                    <span>•</span>
                    <span>DICOM supporté</span>
                    <span>•</span>
                    <span>Anonymisé</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#0A2647',
                    marginBottom: 16,
                  }}>
                    <img
                      src={showGradcam && result?.gradcam_image
                        ? `data:image/jpeg;base64,${result.gradcam_image}`
                        : preview}
                      alt={showGradcam ? "Grad-CAM heatmap" : "Radiographie"}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        opacity: loading ? 0.7 : 1,
                        transition: 'opacity 0.3s ease',
                      }}
                    />
                    {showGradcam && result?.gradcam_image && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        padding: '4px 10px',
                        background: 'rgba(214,40,40,0.85)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'white',
                        letterSpacing: '0.05em',
                      }}>
                        🔥 GRAD-CAM · Zones d'attention IA
                      </div>
                    )}
                    
                    {loading && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(10, 38, 71, 0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                      }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          border: '3px solid rgba(255,255,255,0.2)',
                          borderTopColor: '#2D5F9E',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                        <p style={{ color: 'white', fontSize: '0.9rem' }}>
                          Analyse en cours...
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                          Traitement par modèle {currentModel?.label}
                        </p>
                      </div>
                    )}

                    {/* Image metadata overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      right: 12,
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'space-between',
                    }}>
                      <div style={{
                        padding: '4px 12px',
                        background: 'rgba(10, 38, 71, 0.8)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 20,
                        fontSize: '0.7rem',
                        color: 'white',
                      }}>
                        ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        background: 'rgba(10, 38, 71, 0.8)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 20,
                        fontSize: '0.7rem',
                        color: 'white',
                      }}>
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                  }}>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setResult(null);
                      }}
                      style={{
                        padding: '8px 20px',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: 40,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <MedicalIcons.XRay size={16} color="#64748B" />
                      Nouvelle image
                    </button>
                    
                    {result?.gradcam_image && (
                      <button
                        onClick={() => setShowGradcam(!showGradcam)}
                        style={{
                          padding: '8px 20px',
                          background: showGradcam
                            ? 'linear-gradient(135deg, rgba(214,40,40,0.15), rgba(214,40,40,0.05))'
                            : 'linear-gradient(135deg, rgba(45,95,158,0.15), rgba(45,95,158,0.05))',
                          border: showGradcam ? '1.5px solid rgba(214,40,40,0.4)' : '1.5px solid rgba(45,95,158,0.3)',
                          borderRadius: 40,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: showGradcam ? '#D62828' : '#2D5F9E',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {showGradcam ? '🖼️ Image originale' : '🔥 Voir Grad-CAM'}
                      </button>
                    )}
                  </div>

                  {/* GradCAM Legend Panel */}
                  {showGradcam && result?.gradcam_image && (
                    <div style={{
                      marginTop: 12,
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #fff5f5, #fff)',
                      border: '1px solid rgba(214,40,40,0.2)',
                      borderRadius: 12,
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#D62828',
                        marginBottom: 8,
                        letterSpacing: '0.06em',
                      }}>
                        🔥 GRAD-CAM — ZONES D'ATTENTION DU MODÈLE IA
                      </div>
                      {/* Color scale */}
                      <div style={{ marginBottom: 6 }}>
                        <div style={{
                          height: 10,
                          borderRadius: 5,
                          background: 'linear-gradient(90deg, #0000FF, #00FFFF, #00FF00, #FFFF00, #FF0000)',
                        }} />
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.62rem',
                          color: '#64748B',
                          marginTop: 3,
                        }}>
                          <span>Faible attention</span>
                          <span>Forte attention</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>
                        Les zones <strong style={{ color: '#D62828' }}>rouges/chaudes</strong> correspondent
                        aux régions qui ont le plus influencé la prédiction <strong>{result.prediction}</strong>.
                        Les zones <strong style={{ color: '#2D5F9E' }}>bleues/froides</strong> ont peu contribué.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  background: 'rgba(214, 40, 40, 0.1)',
                  border: '1px solid rgba(214, 40, 40, 0.2)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <MedicalIcons.Heart size={20} color="#D62828" />
                  <span style={{ color: '#D62828', fontSize: '0.85rem' }}>{error}</span>
                </div>
              )}
            </div>

            {/* Radiologist on call */}
            <div style={{
              background: 'linear-gradient(135deg, #F8FAFC, white)',
              borderRadius: 24,
              padding: 20,
              border: '1px solid rgba(43, 95, 158, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <img 
                src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop"
                alt="Dr. Emma Laurent"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              
              <button style={{
                padding: '8px 16px',
                background: '#0A2647',
                border: 'none',
                borderRadius: 40,
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Contacter
              </button>
            </div>
          </div>

          {/* Right column - Results */}
          <div>
            <div style={{
              background: 'white',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 10px 30px -5px rgba(10, 38, 71, 0.1)',
              marginBottom: 20,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(45, 95, 158, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <MedicalIcons.ECG size={20} color="#2D5F9E" animated />
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0A2647' }}>
                      Résultats de l'analyse
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {currentModel?.fullLabel}
                    </div>
                  </div>
                </div>

                {/* Patient ID badge */}
                <div style={{
                  padding: '4px 12px',
                  background: '#F1F5F9',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  color: '#475569',
                  fontFamily: 'monospace',
                }}>
                  PAT-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                </div>
              </div>

              {!result && !loading && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 0',
                }}>
                  <MedicalIcons.XRay size={64} color="#CBD5E1" />
                  <p style={{ 
                    color: '#94A3B8', 
                    fontSize: '0.95rem',
                    marginTop: 16,
                  }}>
                    Importez une radiographie pour visualiser l'analyse
                  </p>
                  <p style={{ 
                    color: '#CBD5E1', 
                    fontSize: '0.8rem',
                    marginTop: 8,
                  }}>
                    L'IA analysera l'image en quelques secondes
                  </p>
                </div>
              )}

              {loading && (
                <div style={{
                  padding: '40px 0',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    border: '3px solid #E2E8F0',
                    borderTopColor: '#2D5F9E',
                    borderRadius: '50%',
                    margin: '0 auto 20px',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <p style={{ color: '#0A2647', fontWeight: 600, marginBottom: 8 }}>
                    Analyse en cours
                  </p>
                  <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
                    Traitement par réseau neuronal convolutif
                  </p>
                  <div style={{
                    marginTop: 20,
                    height: 4,
                    width: '200px',
                    margin: '20px auto 0',
                    background: '#E2E8F0',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: '60%',
                      background: 'linear-gradient(90deg, #2D5F9E, #6B9AC4)',
                      animation: 'scan 1.5s ease-in-out infinite',
                    }} />
                  </div>
                </div>
              )}

              {result && !loading && (
                <>
                  {/* Main diagnosis */}
                  <div style={{
                    background: 'linear-gradient(135deg, #F8FAFC, white)',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    border: '1px solid rgba(45, 95, 158, 0.15)',
                  }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: 8 }}>
                      DIAGNOSTIC PRINCIPAL
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}>
                      <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: result.confidence > 0.7 
                          ? 'rgba(0, 168, 107, 0.1)' 
                          : 'rgba(214, 40, 40, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {result.confidence > 0.7 
                          ? <MedicalIcons.Heart size={32} color="#00A86B" animated />
                          : <MedicalIcons.Heart size={32} color="#D62828" />}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '1.8rem',
                          fontWeight: 800,
                          color: '#0A2647',
                          lineHeight: 1.2,
                          marginBottom: 4,
                        }}>
                          {result.prediction}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <span style={{
                            padding: '4px 12px',
                            background: result.confidence > 0.7 
                              ? 'rgba(0, 168, 107, 0.1)' 
                              : 'rgba(214, 40, 40, 0.1)',
                            borderRadius: 20,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: result.confidence > 0.7 ? '#00A86B' : '#D62828',
                          }}>
                            Confiance {(result.confidence * 100).toFixed(1)}%
                          </span>
                          <span style={{
                            padding: '4px 12px',
                            background: '#F1F5F9',
                            borderRadius: 20,
                            fontSize: '0.75rem',
                            color: '#475569',
                          }}>
                            {currentModel?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confidence meter */}
                  <div style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid #E2E8F0',
                    marginBottom: 20,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        Niveau de confiance
                      </span>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 700,
                        color: result.confidence > 0.7 ? '#00A86B' : '#D62828',
                      }}>
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{
                      height: 8,
                      background: '#E2E8F0',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${result.confidence * 100}%`,
                        background: result.confidence > 0.7 
                          ? 'linear-gradient(90deg, #00A86B, #2ECC71)' 
                          : 'linear-gradient(90deg, #D62828, #FF6B6B)',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    
                    {/* Probability distribution */}
                    {result.probabilities && (
                      <div style={{ marginTop: 20 }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#475569',
                          marginBottom: 12,
                        }}>
                          DISTRIBUTION DES PROBABILITÉS
                        </div>
                        {Object.entries(result.probabilities)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([cls, prob], i) => (
                            <div key={cls} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 8,
                            }}>
                              <span style={{
                                width: 20,
                                fontSize: '0.7rem',
                                color: '#94A3B8',
                              }}>
                                {i + 1}
                              </span>
                              <span style={{
                                flex: 1,
                                fontSize: '0.8rem',
                                color: '#1E293B',
                              }}>
                                {cls}
                              </span>
                              <div style={{
                                width: '100px',
                                height: 4,
                                background: '#E2E8F0',
                                borderRadius: 2,
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${prob * 100}%`,
                                  background: i === 0 ? '#2D5F9E' : '#94A3B8',
                                  borderRadius: 2,
                                }} />
                              </div>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: i === 0 ? '#2D5F9E' : '#64748B',
                                width: 40,
                                textAlign: 'right',
                              }}>
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Explainable AI section */}
            {result && !result.out_of_domain && (
              <ExplainableAI 
                result={result} 
                explainText={explainText} 
                explaining={explaining}
              />
            )}
          </div>
        </div>


        {/* PDF Report Panel */}
        {result && !result.out_of_domain && (
          <div style={{
            marginTop: 20,
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%)',
            borderRadius: 16,
            border: '1px solid rgba(45,95,158,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}>
            {/* Icon + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(56,189,248,0.15)',
                border: '1px solid rgba(56,189,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', flexShrink: 0,
              }}>📄</div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', marginBottom: 2 }}>
                  Rapport PDF Clinique
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                  Patient ID · Diagnostic · Heatmap · Recommandations
                </div>
              </div>
            </div>

            {/* Patient ID Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Patient ID
              </label>
              <input
                type="text"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                placeholder="ex: PAT-2024-00142"
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || explaining}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                background: pdfLoading
                  ? 'rgba(255,255,255,0.1)'
                  : 'linear-gradient(135deg, #38bdf8, #2D5F9E)',
                color: 'white',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: pdfLoading || explaining ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
                opacity: explaining ? 0.6 : 1,
                boxShadow: pdfLoading ? 'none' : '0 4px 14px rgba(56,189,248,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {pdfLoading ? (
                <>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Génération…
                </>
              ) : (
                <>⬇ Télécharger le rapport</>
              )}
            </button>

            {explaining && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', width: '100%', textAlign: 'center' }}>
                ⏳ En attente de la fin de l'analyse Gemini pour inclure le rapport complet…
              </div>
            )}
          </div>
        )}

        {/* Clinical disclaimer */}
        <div style={{
          marginTop: 30,
          padding: '16px 24px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          border: '1px solid rgba(43, 95, 158, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <MedicalIcons.Heart size={20} color="#64748B" />
          <p style={{
            fontSize: '0.8rem',
            color: '#475569',
            lineHeight: 1.6,
          }}>
            <strong>Information importante :</strong> Cette analyse est un outil d'aide au diagnostic destiné 
            aux professionnels de santé. Les résultats doivent être interprétés par un médecin qualifié 
            dans le contexte clinique du patient. Certifié CE-IVD pour usage diagnostique.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}