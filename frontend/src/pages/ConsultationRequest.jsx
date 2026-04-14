// pages/ConsultationRequest.jsx
// Patient soumet une demande de consultation avec image médicale
// Version professionnelle avec validation médicale avancée

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// Configuration médicale détaillée par spécialité
const MODEL_OPTIONS = [
  {
    key: "brain",
    icon: "🧠",
    label: "IRM cérébrale",
    fullName: "Imagerie par Résonance Magnétique Cérébrale",
    desc: "Tumeurs cérébrales — gliome, méningiome, tumeur hypophysaire",
    detailedDesc: "Analyse des structures cérébrales pour la détection de lésions, tumeurs, anomalies vasculaires et pathologies neurologiques.",
    color: "#7C3AED",
    bg: "#EDE9FE",
    border: "#C4B5FD",
    accept: "image/jpeg,image/png",
    specialties: ["Neurologie", "Neurochirurgie", "Neuroradiologie", "Neuro-oncologie"],
    pathologies: [
      "Gliome de bas grade",
      "Glioblastome",
      "Méningiome",
      "Tumeur hypophysaire",
      "Métastases cérébrales",
      "Schwannome vestibulaire",
      "Craniopharyngiome"
    ],
    urgencyCriteria: ["Glioblastome", "Métastases cérébrales", "Hémorragie"],
    preparation: "Pas de préparation particulière. Retirez tout objet métallique (bijoux, piercing).",
    contraindications: "Implants métalliques, pacemaker, clips anévrismaux, prothèses cochléaires."
  },
  {
    key: "lung",
    icon: "🔬",
    label: "Scanner CT pulmonaire",
    fullName: "Tomodensitométrie Thoracique",
    desc: "Cancer pulmonaire — bénin, malin, normal",
    detailedDesc: "Examen tomodensitométrique haute résolution pour l'analyse des nodules pulmonaires, masses tumorales et pathologies interstitielles.",
    color: "#DC2626",
    bg: "#FEE2E2",
    border: "#FCA5A5",
    accept: "image/jpeg,image/png",
    specialties: ["Pneumologie", "Oncologie thoracique", "Radiologie", "Chirurgie thoracique"],
    pathologies: [
      "Carcinome épidermoïde",
      "Adénocarcinome pulmonaire",
      "Carcinome à petites cellules",
      "Nodule pulmonaire bénin",
      "Métastases pulmonaires",
      "Mésothéliome",
      "Tumeur carcinoïde"
    ],
    urgencyCriteria: ["Carcinome à petites cellules", "Métastases", "Masse > 3cm"],
    preparation: "Jeûne de 4 heures recommandé. Injection de produit de contraste possible.",
    contraindications: "Insuffisance rénale sévère, allergie à l'iode, grossesse."
  },
  {
    key: "chest",
    icon: "🫁",
    label: "Radiographie thoracique",
    fullName: "Radiographie Pulmonaire Standard",
    desc: "10 pathologies — COVID, pneumonie, cardiomégalie, atélectasie…",
    detailedDesc: "Examen radiologique standard pour le diagnostic des pathologies pulmonaires, cardiaques et médiastinales.",
    color: "#0369A1",
    bg: "#E0F2FE",
    border: "#7DD3FC",
    accept: "image/jpeg,image/png",
    specialties: ["Pneumologie", "Cardiologie", "Médecine interne", "Médecine d'urgence", "Radiologie"],
    pathologies: [
      "Pneumonie bactérienne",
      "Pneumonie virale / COVID-19",
      "Œdème pulmonaire",
      "Cardiomégalie",
      "Pneumothorax",
      "Épanchement pleural",
      "Atélectasie",
      "Fibrose pulmonaire",
      "Masse médiastinale",
      "Tuberculose"
    ],
    urgencyCriteria: ["Pneumothorax", "Œdème pulmonaire aigu", "Pneumonie sévère"],
    preparation: "Aucune préparation nécessaire. Retirez les bijoux et vêtements métalliques.",
    contraindications: "Grossesse (protection plomb requise)."
  },
];

// Informations légales et consentement
const LEGAL_INFO = {
  dataRetention: "Vos images médicales sont conservées conformément à la réglementation RGPD pendant 10 ans.",
  aiAnalysis: "L'analyse par intelligence artificielle est supervisée par un médecin radiologue.",
  consentRequired: "En soumettant cette demande, vous consentez au traitement de vos données médicales.",
  emergencyDisclaimer: "En cas d'urgence médicale, composez le 15 (SAMU) immédiatement."
};

export default function ConsultationRequest() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // États du formulaire
  const [step, setStep] = useState(1);
  const [selectedModel, setModel] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageQuality, setImageQuality] = useState(null);
  const [showLegalModal, setShowLegalModal] = useState(false);

  const fileRef = useRef(null);

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "Patient")) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Nettoyage des URLs
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Analyse de la qualité de l'image
  const analyzeImageQuality = useCallback((imgElement) => {
    const quality = {
      isBlurry: false,
      resolution: `${imgElement.width}x${imgElement.height}`,
      isAdequate: imgElement.width >= 300 && imgElement.height >= 300,
      suggestions: []
    };

    if (imgElement.width < 300 || imgElement.height < 300) {
      quality.suggestions.push("Résolution faible, privilégiez une image plus grande (min 300x300px)");
      quality.isAdequate = false;
    }

    // Détection simple de flou (variance des pixels)
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i] + data[i+1] + data[i+2];
    }
    const avg = sum / (data.length / 4);
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const pixelAvg = (data[i] + data[i+1] + data[i+2]) / 3;
      variance += Math.pow(pixelAvg - avg, 2);
    }
    variance /= (data.length / 4);
    
    if (variance < 500) {
      quality.isBlurry = true;
      quality.suggestions.push("L'image semble floue, vérifiez la netteté");
    }

    setImageQuality(quality);
    return quality;
  }, []);

  // Validation médicale de l'image
  const handleFile = useCallback((f) => {
    if (!f) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type)) {
      setError("Format non supporté. Utilisez JPEG ou PNG uniquement.");
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setError("Fichier trop volumineux. Taille maximale : 10 Mo.");
      return;
    }

    const objectUrl = URL.createObjectURL(f);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      if (img.width < 100 || img.height < 100) {
        setError("L'image est trop petite. Dimensions minimales : 100x100 pixels.");
        return;
      }
      
      analyzeImageQuality(img);
      setFile(f);
      setPreview(objectUrl);
      setError("");
      setUploadProgress(0);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Fichier image invalide ou corrompu.");
    };
    
    img.src = objectUrl;
  }, [analyzeImageQuality]);

  // Validation des champs médicaux
  const validateMedicalForm = () => {
    if (!symptoms.trim()) {
      setError("Veuillez décrire vos symptômes principaux");
      return false;
    }
    if (symptoms.length < 10) {
      setError("La description des symptômes est trop courte (minimum 10 caractères)");
      return false;
    }
    if (duration && !duration.match(/^\d+\s*(jours?|semaines?|mois?|ans?)/i)) {
      setError("Format de durée invalide. Exemple: '5 jours', '2 semaines', '3 mois'");
      return false;
    }
    if (!consentAccepted) {
      setError("Vous devez accepter les conditions de traitement des données médicales");
      return false;
    }
    return true;
  };

  // Construction du message médical complet
  const buildMedicalNotes = () => {
    const sections = [];
    
    if (symptoms) sections.push(`SYMPTÔMES PRINCIPAUX: ${symptoms}`);
    if (duration) sections.push(`DURÉE D'ÉVOLUTION: ${duration}`);
    if (medicalHistory) sections.push(`ANTÉCÉDENTS MÉDICAUX: ${medicalHistory}`);
    if (currentMedications) sections.push(`TRAITEMENTS EN COURS: ${currentMedications}`);
    if (allergies) sections.push(`ALLERGIES CONNUES: ${allergies}`);
    if (notes) sections.push(`INFORMATIONS COMPLÉMENTAIRES: ${notes}`);
    
    return sections.join("\n\n");
  };

  // Soumission de la demande
  const handleSubmit = async () => {
    if (!file || !selectedModel) {
      setError("Veuillez sélectionner un type d'examen et une image.");
      return;
    }

    if (!validateMedicalForm()) return;

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("medai-token");
      if (!token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      const form = new FormData();
      form.append("file", file);
      form.append("model_key", selectedModel.key);
      form.append("patient_notes", buildMedicalNotes());

      // Simuler progression
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const res = await fetch(`${API}/consultations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        let errorMessage = `Erreur ${res.status}`;
        try {
          const err = await res.json();
          errorMessage = err.detail || err.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setResult({
        ...data,
        consultation_id: data.consultation_id,
        created_at: new Date().toISOString(),
        model: selectedModel,
      });
      setStep(3);
    } catch (e) {
      console.error("Erreur:", e);
      setError(e.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Réinitialisation
  const resetForm = () => {
    setStep(1);
    setModel(null);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setNotes("");
    setSymptoms("");
    setDuration("");
    setMedicalHistory("");
    setCurrentMedications("");
    setAllergies("");
    setConsentAccepted(false);
    setResult(null);
    setError("");
    setImageQuality(null);
  };

  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Chargement de l'interface médicale...</p>
      </div>
    );
  }

  if (!user || user.role !== "Patient") return null;

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={styles.contentWrapper}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate("/patient")} style={styles.backButton}>
            ← Retour au tableau de bord
          </button>
          <div style={styles.patientInfo}>
            <span style={styles.patientName}>{user?.full_name || "Patient"}</span>
            <span style={styles.patientId}>ID: {user?.id || "---"}</span>
          </div>
        </div>

        <div style={styles.mainContent}>
          {/* Titre */}
          <div style={styles.titleSection}>
            <h1 style={styles.title}>📋 Demande de consultation médicale</h1>
            <p style={styles.subtitle}>
              Formulaire sécurisé de demande d'analyse radiologique
            </p>
          </div>

          {/* Progression */}
          <div style={styles.progressContainer}>
            {[
              { n: 1, label: "Type d'examen", icon: "🔬" },
              { n: 2, label: "Données cliniques", icon: "📋" },
              { n: 3, label: "Confirmation", icon: "✅" },
            ].map((s, i) => (
              <div key={s.n} style={styles.progressStep}>
                <div style={{
                  ...styles.progressDot,
                  background: step > s.n ? "#059669" : step === s.n ? "#0A2647" : "#E2E8F0",
                }}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <span style={{ ...styles.progressLabel, color: step === s.n ? "#0A2647" : "#94A3B8" }}>
                  {s.label}
                </span>
                {i < 2 && <div style={{ ...styles.progressLine, background: step > s.n ? "#059669" : "#E2E8F0" }} />}
              </div>
            ))}
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError("")}>✕</button>
            </div>
          )}

          {/* ÉTAPE 1 - Sélection examen */}
          {step === 1 && (
            <div style={styles.stepCard}>
              <div style={styles.cardHeader}>
                <h2>1. Sélection de l'examen radiologique</h2>
                <p>Choisissez la modalité d'imagerie correspondant à votre examen</p>
              </div>

              <div style={styles.modelsGrid}>
                {MODEL_OPTIONS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => { setModel(m); setStep(2); }}
                    style={styles.modelCard}
                  >
                    <div style={{ ...styles.modelIcon, background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)` }}>
                      {m.icon}
                    </div>
                    <div style={styles.modelContent}>
                      <div style={styles.modelLabel}>{m.label}</div>
                      <div style={styles.modelFullName}>{m.fullName}</div>
                      <div style={styles.modelDesc}>{m.desc}</div>
                      <div style={styles.specialtiesList}>
                        {m.specialties.slice(0, 3).map(spec => (
                          <span key={spec} style={styles.specialtyTag}>{spec}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ ...styles.modelArrow, color: m.color }}>→</div>
                  </button>
                ))}
              </div>

              <div style={styles.legalNotice}>
                <small>{LEGAL_INFO.emergencyDisclaimer}</small>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 - Données cliniques détaillées */}
          {step === 2 && selectedModel && (
            <div style={styles.stepCard}>
              <div style={styles.selectedModelBadge}>
                <span>{selectedModel.icon}</span>
                <span style={{ fontWeight: 600 }}>{selectedModel.label}</span>
                <button onClick={() => { setStep(1); setFile(null); setPreview(null); }} style={styles.changeButton}>
                  Changer
                </button>
              </div>

              <div style={styles.formSection}>
                <h3>🖼️ Image médicale</h3>
                
                {!preview ? (
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                    style={{ ...styles.dropzone, borderColor: dragOver ? selectedModel.color : "#E2E8F0" }}
                  >
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={e => handleFile(e.target.files[0])} style={{ display: "none" }} />
                    <div style={styles.dropzoneIcon}>{selectedModel.icon}</div>
                    <div style={styles.dropzoneTitle}>Déposez votre image radiologique</div>
                    <div style={styles.dropzoneHint}>JPEG, PNG · Max 10 Mo · Min 300x300 px</div>
                  </div>
                ) : (
                  <div style={styles.previewArea}>
                    <img src={preview} alt="Aperçu" style={styles.previewImage} />
                    <div style={styles.previewActions}>
                      <div style={styles.previewBadge}>✓ Image chargée</div>
                      {imageQuality && !imageQuality.isAdequate && (
                        <div style={styles.qualityWarning}>⚠️ {imageQuality.suggestions[0]}</div>
                      )}
                      <button onClick={() => { setFile(null); setPreview(null); setImageQuality(null); }} style={styles.removeButton}>
                        Remplacer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.formSection}>
                <h3>📝 Données cliniques</h3>
                
                <div style={styles.formGrid}>
                  <div style={styles.formGroupFull}>
                    <label>Symptômes principaux *</label>
                    <textarea
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                      placeholder="Décrivez précisément vos symptômes (ex: toux persistante, douleur thoracique, essoufflement...)"
                      rows={3}
                      style={styles.textarea}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label>Durée d'évolution</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="Ex: 5 jours, 2 semaines, 3 mois"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label>Antécédents médicaux</label>
                    <input
                      type="text"
                      value={medicalHistory}
                      onChange={e => setMedicalHistory(e.target.value)}
                      placeholder="HTA, diabète, antécédent cancéreux..."
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label>Traitements en cours</label>
                    <input
                      type="text"
                      value={currentMedications}
                      onChange={e => setCurrentMedications(e.target.value)}
                      placeholder="Médicaments, posologie..."
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label>Allergies connues</label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={e => setAllergies(e.target.value)}
                      placeholder="Médicaments, produits de contraste..."
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroupFull}>
                    <label>Informations complémentaires</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Autres informations utiles pour le médecin..."
                      rows={2}
                      style={styles.textarea}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.formSection}>
                <h3>⚕️ Informations médicales spécifiques</h3>
                <div style={styles.medicalInfo}>
                  <div><strong>📋 Pathologies détectables :</strong> {selectedModel.pathologies.slice(0, 5).join(", ")}</div>
                  <div><strong>⚠️ Critères d'urgence :</strong> {selectedModel.urgencyCriteria.join(", ")}</div>
                  <div><strong>🔧 Préparation :</strong> {selectedModel.preparation}</div>
                  <div><strong>🚫 Contre-indications :</strong> {selectedModel.contraindications}</div>
                </div>
              </div>

              <div style={styles.consentSection}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={e => setConsentAccepted(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>J'accepte le traitement de mes données médicales conformément au RGPD et certifie l'exactitude des informations fournies.</span>
                </label>
                <small style={styles.consentText}>{LEGAL_INFO.dataRetention}</small>
              </div>

              <div style={styles.actionButtons}>
                <button onClick={() => setStep(1)} style={styles.secondaryButton}>← Retour</button>
                <button
                  onClick={handleSubmit}
                  disabled={!file || loading || !consentAccepted}
                  style={{ ...styles.primaryButton, opacity: (!file || !consentAccepted) ? 0.6 : 1 }}
                >
                  {loading ? (
                    <>
                      <div style={styles.buttonSpinner} />
                      Envoi en cours... {uploadProgress}%
                    </>
                  ) : "Soumettre la demande →"}
                </button>
              </div>

              {loading && uploadProgress > 0 && (
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${uploadProgress}%`, background: selectedModel.color }} />
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 3 - Confirmation */}
          {step === 3 && result && (
            <div style={styles.confirmationCard}>
              <div style={styles.successIcon}>✅</div>
              <h2 style={styles.successTitle}>Demande transmise avec succès</h2>
              <p style={styles.successMessage}>
                Votre dossier médical a été enregistré. Un médecin spécialiste va analyser votre demande.
              </p>

              <div style={styles.confirmationDetails}>
                <div style={styles.detailRow}>
                  <span>Référence dossier :</span>
                  <strong>#MED-{result.consultation_id}-{new Date().getFullYear()}</strong>
                </div>
                <div style={styles.detailRow}>
                  <span>Examen :</span>
                  <strong>{result.model?.label}</strong>
                </div>
                <div style={styles.detailRow}>
                  <span>Date d'envoi :</span>
                  <strong>{new Date().toLocaleString("fr-FR")}</strong>
                </div>
                <div style={styles.detailRow}>
                  <span>Statut :</span>
                  <span style={styles.statusPending}>En attente d'assignation médicale</span>
                </div>
              </div>

              <div style={styles.nextSteps}>
                <h4>📌 Prochaines étapes</h4>
                <ul>
                  <li>Un médecin radiologue examinera votre dossier sous 24-48h</li>
                  <li>L'analyse IA sera déclenchée après acceptation médicale</li>
                  <li>Vous recevrez une notification par email et sur votre espace patient</li>
                  <li>Un rendez-vous de consultation sera programmé selon l'urgence détectée</li>
                </ul>
              </div>

              <div style={styles.finalButtons}>
                <button onClick={resetForm} style={styles.secondaryButton}>📋 Nouvelle demande</button>
                <button onClick={() => navigate("/patient")} style={styles.primaryButton}>🏠 Tableau de bord</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles complets
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)",
    fontFamily: "'Inter', sans-serif",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  spinner: {
    width: 48,
    height: 48,
    border: "4px solid #E2E8F0",
    borderTopColor: "#0A2647",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  contentWrapper: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    flexWrap: "wrap",
    gap: 16,
  },
  backButton: {
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    padding: "10px 20px",
    color: "#475569",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  patientInfo: {
    background: "white",
    padding: "8px 16px",
    borderRadius: 40,
    border: "1px solid #E2E8F0",
    display: "flex",
    gap: 12,
  },
  patientName: {
    fontWeight: 600,
    color: "#0A2647",
  },
  patientId: {
    color: "#94A3B8",
    fontSize: "0.75rem",
  },
  mainContent: {},
  titleSection: {
    textAlign: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#0A2647",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748B",
    fontSize: "0.9rem",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    background: "white",
    padding: "20px 30px",
    borderRadius: 60,
    marginBottom: 32,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  progressStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 700,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: "0.7rem",
    fontWeight: 500,
  },
  progressLine: {
    position: "absolute",
    left: "calc(50% + 25px)",
    top: 20,
    width: "calc(100% - 50px)",
    height: 2,
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#FEE2E2",
    border: "1px solid #FCA5A5",
    borderRadius: 12,
    padding: "12px 20px",
    color: "#DC2626",
    marginBottom: 24,
  },
  stepCard: {
    background: "white",
    borderRadius: 24,
    padding: "32px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    animation: "fadeUp 0.4s ease",
  },
  cardHeader: {
    marginBottom: 28,
  },
  modelsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  modelCard: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "20px 24px",
    background: "white",
    border: "2px solid #E2E8F0",
    borderRadius: 20,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s",
    width: "100%",
  },
  modelIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.8rem",
    flexShrink: 0,
  },
  modelContent: {
    flex: 1,
  },
  modelLabel: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0A2647",
  },
  modelFullName: {
    fontSize: "0.7rem",
    color: "#64748B",
    marginBottom: 4,
  },
  modelDesc: {
    fontSize: "0.8rem",
    color: "#475569",
    marginBottom: 8,
  },
  specialtiesList: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  specialtyTag: {
    background: "#F1F5F9",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: "0.65rem",
    color: "#475569",
  },
  modelArrow: {
    fontSize: "1.2rem",
  },
  legalNotice: {
    marginTop: 24,
    padding: "12px",
    background: "#FEF2F2",
    borderRadius: 12,
    textAlign: "center",
  },
  selectedModelBadge: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#F8FAFC",
    padding: "12px 20px",
    borderRadius: 16,
    marginBottom: 28,
  },
  changeButton: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  formSection: {
    marginBottom: 32,
  },
  dropzone: {
    border: "2px dashed",
    borderRadius: 20,
    padding: "48px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  dropzoneIcon: {
    fontSize: "3rem",
    marginBottom: 12,
  },
  dropzoneTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#0A2647",
    marginBottom: 6,
  },
  dropzoneHint: {
    fontSize: "0.7rem",
    color: "#94A3B8",
  },
  previewArea: {
    borderRadius: 16,
    overflow: "hidden",
    background: "#0A2647",
  },
  previewImage: {
    width: "100%",
    maxHeight: 300,
    objectFit: "contain",
  },
  previewActions: {
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  previewBadge: {
    background: "#059669",
    padding: "4px 12px",
    borderRadius: 20,
    color: "white",
    fontSize: "0.7rem",
  },
  qualityWarning: {
    background: "#FEF3C7",
    padding: "4px 12px",
    borderRadius: 20,
    color: "#D97706",
    fontSize: "0.7rem",
  },
  removeButton: {
    background: "#DC2626",
    border: "none",
    borderRadius: 20,
    padding: "4px 12px",
    color: "white",
    fontSize: "0.7rem",
    cursor: "pointer",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  formGroupFull: {
    gridColumn: "span 2",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  input: {
    padding: "12px 14px",
    border: "1.5px solid #E2E8F0",
    borderRadius: 12,
    fontSize: "0.85rem",
    outline: "none",
  },
  textarea: {
    padding: "12px 14px",
    border: "1.5px solid #E2E8F0",
    borderRadius: 12,
    fontSize: "0.85rem",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
  },
  medicalInfo: {
    background: "#F8FAFC",
    padding: "16px",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: "0.8rem",
  },
  consentSection: {
    marginTop: 24,
    padding: "16px",
    background: "#F1F5F9",
    borderRadius: 16,
  },
  checkboxLabel: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    cursor: "pointer",
  },
  checkbox: {
    marginTop: 2,
  },
  consentText: {
    display: "block",
    marginTop: 8,
    fontSize: "0.7rem",
    color: "#64748B",
  },
  actionButtons: {
    display: "flex",
    gap: 16,
    marginTop: 24,
  },
  primaryButton: {
    flex: 2,
    padding: "14px",
    background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
    border: "none",
    borderRadius: 14,
    color: "white",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    padding: "14px",
    background: "#F8FAFC",
    border: "1.5px solid #E2E8F0",
    borderRadius: 14,
    color: "#475569",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonSpinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  progressBar: {
    marginTop: 16,
    height: 4,
    background: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  confirmationCard: {
    background: "white",
    borderRadius: 24,
    padding: "40px",
    textAlign: "center",
    animation: "fadeUp 0.4s ease",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "#D1FAE5",
    border: "3px solid #6EE7B7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "2.5rem",
  },
  successTitle: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#0A2647",
    marginBottom: 12,
  },
  successMessage: {
    color: "#64748B",
    marginBottom: 28,
  },
  confirmationDetails: {
    background: "#F8FAFC",
    borderRadius: 16,
    padding: "20px",
    marginBottom: 28,
    textAlign: "left",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #E2E8F0",
  },
  statusPending: {
    background: "#FEF3C7",
    color: "#D97706",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: "0.75rem",
  },
  nextSteps: {
    textAlign: "left",
    marginBottom: 32,
  },
  finalButtons: {
    display: "flex",
    gap: 12,
  },
};