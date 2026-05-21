// frontend/src/pages/patient/MedicalHistoryPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

// ===== SVG ICONS CUSTOM =====
const SvgIcon = ({ children, size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const MedicalIcons = {
  Profile: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </SvgIcon>
  ),
  MedicalHistory: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </SvgIcon>
  ),
  Alert: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
    </SvgIcon>
  ),
  Prescription: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </SvgIcon>
  ),
  Notification: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </SvgIcon>
  ),
  Add: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </SvgIcon>
  ),
  Close: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </SvgIcon>
  ),
  Calendar: ({ size = 14, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </SvgIcon>
  ),
  Download: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </SvgIcon>
  ),
  Eye: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </SvgIcon>
  ),
  Trash: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </SvgIcon>
  ),
  Upload: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </SvgIcon>
  ),
  File: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </SvgIcon>
  ),
  Check: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </SvgIcon>
  ),
  ArrowLeft: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </SvgIcon>
  ),
};

// ===== CONSTANTES =====
const API = "http://localhost:8000/api/v1";

const MedicalHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("medai-token");

  // États pour le dossier médical
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicalData, setMedicalData] = useState({
    antecedents: [],
    allergies: [],
    traitements: [],
    blood_group: "",
    birth_date: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    taille: "",
    poids: "",
    imc: ""
  });

  const [newAntecedent, setNewAntecedent] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newTreatment, setNewTreatment] = useState({ name: "", dosage: "", duration: "" });

  // États pour les analyses
  const [analysesList, setAnalysesList] = useState([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [showAnalysisUpload, setShowAnalysisUpload] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [toast, setToast] = useState(null);
  
  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Chargement du dossier médical
  useEffect(() => {
    const fetchMedicalData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${API}/consultations/dossiers/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMedicalData({
            antecedents: data.antecedents || [],
            allergies: data.allergies || [],
            traitements: data.traitements || [],
            blood_group: data.blood_group || "",
            birth_date: data.birth_date || "",
            emergency_contact_name: data.emergency_contact_name || "",
            emergency_contact_phone: data.emergency_contact_phone || "",
            taille: data.taille || "",
            poids: data.poids || "",
            imc: data.imc || ""
          });
        }
      } catch (err) {
        console.error("Erreur chargement dossier médical:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedicalData();
  }, [token]);

  // Chargement des analyses
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!token) {
        setAnalysesLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${API}/consultations/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const consultations = data.consultations || [];
          
          const analysesFromConsultations = consultations
            .filter(c => c.status === "analyzed" && c.prediction)
            .map(c => ({
              id: `consult_${c.id}`,
              title: `Rapport #${c.id} - ${c.prediction || "Résultat"}`,
              date: c.created_at,
              type: "consultation",
              source: "consultation",
              prediction: c.prediction,
              confidence: c.confidence,
              consultationId: c.id,
              hasPdf: true,
              extractedText: c.explain_text || ""
            }));
          
          setAnalysesList(analysesFromConsultations.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          ));
        }
      } catch (err) {
        console.error("Erreur chargement analyses:", err);
      } finally {
        setAnalysesLoading(false);
      }
    };
    
    fetchAnalyses();
  }, [token]);

  // Gestion des antécédents
  const addAntecedent = () => {
    if (newAntecedent.trim()) {
      setMedicalData(prev => ({
        ...prev,
        antecedents: [...prev.antecedents, newAntecedent.trim()]
      }));
      setNewAntecedent("");
    }
  };

  const removeAntecedent = (index) => {
    setMedicalData(prev => ({
      ...prev,
      antecedents: prev.antecedents.filter((_, i) => i !== index)
    }));
  };

  // Gestion des allergies
  const addAllergy = () => {
    if (newAllergy.trim()) {
      setMedicalData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy("");
    }
  };

  const removeAllergy = (index) => {
    setMedicalData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  // Gestion des traitements
  const addTreatment = () => {
    if (newTreatment.name.trim()) {
      setMedicalData(prev => ({
        ...prev,
        traitements: [...prev.traitements, { ...newTreatment }]
      }));
      setNewTreatment({ name: "", dosage: "", duration: "" });
    }
  };

  const removeTreatment = (index) => {
    setMedicalData(prev => ({
      ...prev,
      traitements: prev.traitements.filter((_, i) => i !== index)
    }));
  };

  // Calcul IMC
  const calculateIMC = (taille, poids) => {
    if (taille && poids) {
      const tailleM = taille / 100;
      const imc = (poids / (tailleM * tailleM)).toFixed(1);
      setMedicalData(prev => ({ ...prev, imc }));
    }
  };

  // Sauvegarde du dossier médical
  const saveMedicalData = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/consultations/dossiers/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          antecedents: medicalData.antecedents,
          allergies: medicalData.allergies,
          traitements: medicalData.traitements,
          blood_group: medicalData.blood_group,
          birth_date: medicalData.birth_date,
          emergency_contact_name: medicalData.emergency_contact_name,
          emergency_contact_phone: medicalData.emergency_contact_phone,
          taille: medicalData.taille,
          poids: medicalData.poids,
          imc: medicalData.imc
        })
      });
      if (res.ok) {
        showToast("Dossier médical mis à jour avec succès");
      } else {
        showToast("Erreur lors de la sauvegarde", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur de connexion", "error");
    } finally {
      setSaving(false);
    }
  };

  // Extraction de texte par OCR (simulée sans Tesseract pour éviter les dépendances lourdes)
  const extractTextFromFile = async (file) => {
    setExtracting(true);
    setExtractedText("");
    
    // Simuler une extraction (pour éviter d'installer tesseract.js)
    setTimeout(() => {
      const simulatedText = `Document médical analysé le ${new Date().toLocaleDateString("fr-FR")}
      
Résultats de l'analyse :

Pathologie détectée : À analyser par un médecin.

Recommandation : Consulter votre médecin traitant pour interprétation complète de ces résultats.

Date de l'examen : ${uploadDate || new Date().toLocaleDateString("fr-FR")}
Type d'examen : Analyse médicale

Notes : Document téléchargé via MedAI.`;
      setExtractedText(simulatedText);
      setExtracting(false);
    }, 1500);
  };

  // Sauvegarde de l'analyse uploadée
  const saveUploadedAnalysis = async () => {
    if (!uploadFile || !uploadTitle) {
      showToast("Veuillez remplir le titre et sélectionner un fichier", "error");
      return;
    }
    
    setUploading(true);
    
    try {
      // Simuler un upload réussi (backend à implémenter)
      const newAnalysis = {
        id: Date.now(),
        title: uploadTitle,
        date: uploadDate || new Date().toISOString(),
        type: "upload",
        source: "upload",
        hasPdf: true,
        extractedText: extractedText || "Document téléchargé. Aucun texte extrait."
      };
      
      setAnalysesList(prev => [newAnalysis, ...prev]);
      showToast("Analyse ajoutée avec succès");
      setShowAnalysisUpload(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadDate("");
      setExtractedText("");
      
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'ajout", "error");
    } finally {
      setUploading(false);
    }
  };

  // Suppression d'une analyse
  const deleteAnalysis = async (analysis) => {
    if (!window.confirm(`Supprimer "${analysis.title}" définitivement ?`)) return;
    
    setAnalysesList(prev => prev.filter(a => a.id !== analysis.id));
    setSelectedAnalysis(null);
    showToast("Analyse supprimée");
  };

  // Télécharger le PDF
  const downloadAnalysis = (analysis) => {
    if (analysis.consultationId) {
      window.open(`/patient/resultats/${analysis.consultationId}`, "_blank");
    } else {
      showToast("Téléchargement du PDF non disponible", "error");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (loading || analysesLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        background: "#F0F4FA"
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
    <div style={{ background: "#F0F4FA", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header Section */}
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
              <MedicalIcons.MedicalHistory size={20} />
            </div>
            <div>
              <h1 style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                letterSpacing: "-0.02em"
              }}>
                Dossier <span style={{ color: "#FFD700" }}>médical</span>
              </h1>
              <p style={{
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.6)",
                margin: "4px 0 0"
              }}>
                Gérez vos informations personnelles et antécédents médicaux
              </p>
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
          <button
            onClick={() => navigate("/patient/profil")}
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
            <MedicalIcons.ArrowLeft size={16} />
            Retour
          </button>
          
          <button
            onClick={saveMedicalData}
            disabled={saving}
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
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "inherit"
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
            }}
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: "fixed",
                top: 90,
                right: 24,
                padding: "12px 24px",
                borderRadius: 12,
                background: toast.type === "error" ? "#EF4444" : "#10B981",
                color: "white",
                fontSize: "0.85rem",
                fontWeight: 500,
                zIndex: 1100,
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              {toast.type === "error" ? (
                <MedicalIcons.Alert size={16} color="white" />
              ) : (
                <MedicalIcons.Check size={16} color="white" />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
          {/* Left column - Personal info */}
          <div>
            {/* Informations personnelles */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 28,
              border: "1px solid rgba(30, 60, 110, 0.08)",
              marginBottom: 24,
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
            }}>
              <h3 style={{ 
                fontWeight: 700, 
                color: "#0F1B2D", 
                marginBottom: 20, 
                display: "flex", 
                alignItems: "center", 
                gap: 8 
              }}>
                <MedicalIcons.Profile size={18} />
                Informations personnelles
              </h3>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 700, 
                  color: "#475569", 
                  display: "block", 
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  <MedicalIcons.Calendar size={13} style={{ display: "inline", marginRight: 6 }} />
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={medicalData.birth_date?.split('T')[0] || ""}
                  onChange={(e) => setMedicalData(prev => ({ ...prev, birth_date: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 700, 
                  color: "#475569", 
                  display: "block", 
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Groupe sanguin
                </label>
                <select
                  value={medicalData.blood_group}
                  onChange={(e) => setMedicalData(prev => ({ ...prev, blood_group: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D",
                    cursor: "pointer"
                  }}
                >
                  <option value="">Sélectionner</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 700, 
                    color: "#475569", 
                    display: "block", 
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Taille (cm)
                  </label>
                  <input
                    type="number"
                    value={medicalData.taille}
                    onChange={(e) => {
                      setMedicalData(prev => ({ ...prev, taille: e.target.value }));
                      calculateIMC(e.target.value, medicalData.poids);
                    }}
                    placeholder="ex: 170"
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      borderRadius: 14,
                      border: "1.5px solid rgba(30, 60, 110, 0.12)",
                      fontSize: "0.9rem",
                      background: "#FAFBFC",
                      outline: "none",
                      fontFamily: "inherit",
                      color: "#0F1B2D"
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 700, 
                    color: "#475569", 
                    display: "block", 
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    value={medicalData.poids}
                    onChange={(e) => {
                      setMedicalData(prev => ({ ...prev, poids: e.target.value }));
                      calculateIMC(medicalData.taille, e.target.value);
                    }}
                    placeholder="ex: 70"
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      borderRadius: 14,
                      border: "1.5px solid rgba(30, 60, 110, 0.12)",
                      fontSize: "0.9rem",
                      background: "#FAFBFC",
                      outline: "none",
                      fontFamily: "inherit",
                      color: "#0F1B2D"
                    }}
                  />
                </div>
              </div>

              {medicalData.imc && (
                <div style={{
                  padding: "14px 18px",
                  background: "rgba(255, 215, 0, 0.08)",
                  borderRadius: 14,
                  border: "1px solid rgba(255, 215, 0, 0.15)"
                }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>IMC calculé : </span>
                  <span style={{ fontWeight: 700, color: "#D4A500" }}>{medicalData.imc}</span>
                </div>
              )}
            </div>

            {/* Contact d'urgence */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 28,
              border: "1px solid rgba(30, 60, 110, 0.08)",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
            }}>
              <h3 style={{ 
                fontWeight: 700, 
                color: "#0F1B2D", 
                marginBottom: 20, 
                display: "flex", 
                alignItems: "center", 
                gap: 8 
              }}>
                <MedicalIcons.Notification size={18} />
                Contact d'urgence
              </h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 700, 
                  color: "#475569", 
                  display: "block", 
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={medicalData.emergency_contact_name}
                  onChange={(e) => setMedicalData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  placeholder="Personne à contacter en cas d'urgence"
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 700, 
                  color: "#475569", 
                  display: "block", 
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={medicalData.emergency_contact_phone}
                  onChange={(e) => setMedicalData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  placeholder="+216 XX XXX XXX"
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right column - Medical history */}
          <div>
            {/* Antécédents */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 28,
              border: "1px solid rgba(30, 60, 110, 0.08)",
              marginBottom: 24,
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
            }}>
              <h3 style={{ 
                fontWeight: 700, 
                color: "#0F1B2D", 
                marginBottom: 20, 
                display: "flex", 
                alignItems: "center", 
                gap: 8 
              }}>
                <MedicalIcons.MedicalHistory size={18} />
                Antécédents médicaux
              </h3>
              
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <input
                  type="text"
                  value={newAntecedent}
                  onChange={(e) => setNewAntecedent(e.target.value)}
                  placeholder="ex: Diabète de type 2, Hypertension..."
                  style={{
                    flex: 1,
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D"
                  }}
                  onKeyPress={(e) => e.key === "Enter" && addAntecedent()}
                />
                <button
                  onClick={addAntecedent}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 12,
                    background: "rgba(255, 215, 0, 0.1)",
                    border: "1px solid rgba(255, 215, 0, 0.2)",
                    color: "#D4A500",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255, 215, 0, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 215, 0, 0.1)";
                  }}
                >
                  <MedicalIcons.Add size={20} />
                </button>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {medicalData.antecedents.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      padding: "10px 18px",
                      background: "#FAFBFC",
                      borderRadius: 30,
                      border: "1px solid rgba(30, 60, 110, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", color: "#0F1B2D" }}>{item}</span>
                    <button
                      onClick={() => removeAntecedent(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#EF4444",
                        padding: 2,
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <MedicalIcons.Close size={14} />
                    </button>
                  </motion.div>
                ))}
                {medicalData.antecedents.length === 0 && (
                  <p style={{ fontSize: "0.8rem", color: "#94A3B8", textAlign: "center", width: "100%", padding: 20 }}>
                    Aucun antécédent enregistré
                  </p>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 28,
              border: "1px solid rgba(30, 60, 110, 0.08)",
              marginBottom: 24,
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
            }}>
              <h3 style={{ 
                fontWeight: 700, 
                color: "#0F1B2D", 
                marginBottom: 20, 
                display: "flex", 
                alignItems: "center", 
                gap: 8 
              }}>
                <MedicalIcons.Alert size={18} />
                Allergies
              </h3>
              
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="ex: Pénicilline, Arachides..."
                  style={{
                    flex: 1,
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D"
                  }}
                  onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                />
                <button
                  onClick={addAllergy}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 12,
                    background: "rgba(255, 215, 0, 0.1)",
                    border: "1px solid rgba(255, 215, 0, 0.2)",
                    color: "#D4A500",
                    cursor: "pointer"
                  }}
                >
                  <MedicalIcons.Add size={20} />
                </button>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {medicalData.allergies.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      padding: "10px 18px",
                      background: "rgba(239, 68, 68, 0.08)",
                      borderRadius: 30,
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", color: "#EF4444" }}>{item}</span>
                    <button
                      onClick={() => removeAllergy(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#EF4444"
                      }}
                    >
                      <MedicalIcons.Close size={14} />
                    </button>
                  </motion.div>
                ))}
                {medicalData.allergies.length === 0 && (
                  <p style={{ fontSize: "0.8rem", color: "#94A3B8", textAlign: "center", width: "100%", padding: 20 }}>
                    Aucune allergie enregistrée
                  </p>
                )}
              </div>
            </div>

            {/* Traitements */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 28,
              border: "1px solid rgba(30, 60, 110, 0.08)",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
            }}>
              <h3 style={{ 
                fontWeight: 700, 
                color: "#0F1B2D", 
                marginBottom: 20, 
                display: "flex", 
                alignItems: "center", 
                gap: 8 
              }}>
                <MedicalIcons.Prescription size={18} />
                Traitements en cours
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, marginBottom: 20 }}>
                <input
                  type="text"
                  value={newTreatment.name}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Médicament"
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D"
                  }}
                />
                <input
                  type="text"
                  value={newTreatment.dosage}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="Dosage"
                  style={{
                    width: 100,
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D"
                  }}
                />
                <input
                  type="text"
                  value={newTreatment.duration}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Durée"
                  style={{
                    width: 100,
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D"
                  }}
                />
                <button
                  onClick={addTreatment}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 12,
                    background: "rgba(255, 215, 0, 0.1)",
                    border: "1px solid rgba(255, 215, 0, 0.2)",
                    color: "#D4A500",
                    cursor: "pointer"
                  }}
                >
                  <MedicalIcons.Add size={20} />
                </button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {medicalData.traitements.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      padding: "14px 18px",
                      background: "#FAFBFC",
                      borderRadius: 14,
                      border: "1px solid rgba(30, 60, 110, 0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: "#0F1B2D" }}>{item.name}</span>
                      {item.dosage && <span style={{ fontSize: "0.75rem", color: "#64748B", marginLeft: 8 }}>{item.dosage}</span>}
                      {item.duration && <span style={{ fontSize: "0.7rem", color: "#94A3B8", marginLeft: 8 }}>• {item.duration}</span>}
                    </div>
                    <button
                      onClick={() => removeTreatment(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#EF4444",
                        padding: 6,
                        borderRadius: 8
                      }}
                    >
                      <MedicalIcons.Trash size={16} />
                    </button>
                  </motion.div>
                ))}
                {medicalData.traitements.length === 0 && (
                  <p style={{ fontSize: "0.8rem", color: "#94A3B8", textAlign: "center", padding: 20 }}>
                    Aucun traitement en cours
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mes analyses médicales */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: 24,
          padding: 28,
          border: "1px solid rgba(30, 60, 110, 0.08)",
          marginTop: 24,
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, color: "#0F1B2D", display: "flex", alignItems: "center", gap: 8 }}>
              <MedicalIcons.File size={20} />
              Mes analyses médicales
            </h3>
            <button
              onClick={() => setShowAnalysisUpload(true)}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                background: "rgba(255, 215, 0, 0.1)",
                border: "1px solid rgba(255, 215, 0, 0.2)",
                color: "#D4A500",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255, 215, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 215, 0, 0.1)";
              }}
            >
              <MedicalIcons.Upload size={16} />
              Ajouter une analyse
            </button>
          </div>

          {analysesList.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 60,
              background: "#FAFBFC",
              borderRadius: 20,
              color: "#94A3B8"
            }}>
              <MedicalIcons.File size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
              <p style={{ fontSize: "0.9rem" }}>Aucune analyse médicale enregistrée</p>
              <p style={{ fontSize: "0.75rem", marginTop: 4 }}>Téléchargez vos comptes-rendus d'analyses pour les centraliser ici</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {analysesList.map((analysis, idx) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: "#FAFBFC",
                    borderRadius: 20,
                    padding: "20px 24px",
                    border: "1px solid rgba(30, 60, 110, 0.08)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => setSelectedAnalysis(analysis)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)";
                    e.currentTarget.style.background = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(30, 60, 110, 0.08)";
                    e.currentTarget.style.background = "#FAFBFC";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "rgba(255, 215, 0, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#D4A500"
                    }}>
                      <MedicalIcons.File size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#0F1B2D", marginBottom: 4 }}>
                        {analysis.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MedicalIcons.Calendar size={12} />
                          {formatDate(analysis.date)}
                        </span>
                        {analysis.source === "consultation" && (
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            background: "rgba(59, 130, 246, 0.1)",
                            color: "#3B82F6",
                            fontSize: "0.65rem",
                            fontWeight: 600
                          }}>
                            Résultat d'analyse
                          </span>
                        )}
                        {analysis.prediction && (
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#10B981",
                            fontSize: "0.65rem",
                            fontWeight: 600
                          }}>
                            {analysis.prediction}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {analysis.hasPdf && (
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadAnalysis(analysis); }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            background: "transparent",
                            border: "1px solid rgba(30, 60, 110, 0.1)",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "rgba(255, 215, 0, 0.1)";
                            e.target.style.borderColor = "rgba(255, 215, 0, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "transparent";
                            e.target.style.borderColor = "rgba(30, 60, 110, 0.1)";
                          }}
                        >
                          <MedicalIcons.Download size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAnalysis(analysis); }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: "transparent",
                          border: "1px solid rgba(30, 60, 110, 0.1)",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <MedicalIcons.Eye size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showAnalysisUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 27, 45, 0.7)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20
            }}
            onClick={() => setShowAnalysisUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: "#FFFFFF",
                borderRadius: 28,
                padding: 32,
                maxWidth: 550,
                width: "100%",
                maxHeight: "85vh",
                overflow: "auto",
                boxShadow: "0 24px 56px rgba(0, 0, 0, 0.15)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #FFD700, #D4A500)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0F1B2D"
                  }}>
                    <MedicalIcons.Upload size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F1B2D", margin: 0 }}>
                      Ajouter une analyse
                    </h2>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: "4px 0 0" }}>
                      Téléchargez votre compte-rendu médical
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalysisUpload(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94A3B8"
                  }}
                >
                  <MedicalIcons.Close size={20} />
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: 8,
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Titre de l'analyse *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="ex: Bilan sanguin Mars 2024, IRM cérébrale..."
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
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

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: 8,
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Date de l'analyse
                </label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#FAFBFC",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#0F1B2D"
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: 8,
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Fichier (PDF ou Image) *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${uploadFile ? "#D4A500" : "rgba(30, 60, 110, 0.15)"}`,
                    borderRadius: 16,
                    padding: uploadFile ? "24px" : "48px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: uploadFile ? "rgba(255, 215, 0, 0.05)" : "#FAFBFC",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#D4A500";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = uploadFile ? "#D4A500" : "rgba(30, 60, 110, 0.15)";
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setUploadFile(file);
                        extractTextFromFile(file);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  {uploadFile ? (
                    <div>
                      <MedicalIcons.File size={40} color="#D4A500" />
                      <p style={{ marginTop: 12, fontWeight: 500, color: "#0F1B2D" }}>{uploadFile.name}</p>
                      <p style={{ fontSize: "0.7rem", color: "#64748B" }}>
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                  ) : (
                    <div>
                      <MedicalIcons.Upload size={40} color="#D4A500" />
                      <p style={{ marginTop: 12, fontWeight: 500, color: "#0F1B2D" }}>Cliquez pour sélectionner un fichier</p>
                      <p style={{ fontSize: "0.7rem", color: "#64748B" }}>PDF, JPG, PNG (max 10 Mo)</p>
                    </div>
                  )}
                </div>
              </div>

              {extracting && (
                <div style={{
                  padding: "16px",
                  background: "rgba(255, 215, 0, 0.08)",
                  borderRadius: 14,
                  marginBottom: 20,
                  textAlign: "center"
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    border: "2px solid #D4A500",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto 8px"
                  }} />
                  <p style={{ fontSize: "0.8rem", color: "#D4A500" }}>Extraction du texte en cours...</p>
                </div>
              )}

              {extractedText && !extracting && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 8,
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Texte extrait (modifiable)
                  </label>
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      borderRadius: 14,
                      border: "1.5px solid rgba(30, 60, 110, 0.12)",
                      fontSize: "0.85rem",
                      fontFamily: "monospace",
                      resize: "vertical",
                      outline: "none",
                      background: "#FAFBFC",
                      color: "#0F1B2D"
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => {
                    setShowAnalysisUpload(false);
                    resetUpload();
                  }}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 14,
                    background: "transparent",
                    border: "1.5px solid rgba(30, 60, 110, 0.15)",
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(30, 60, 110, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={saveUploadedAnalysis}
                  disabled={!uploadFile || !uploadTitle || uploading}
                  style={{
                    flex: 2,
                    padding: "14px",
                    borderRadius: 14,
                    background: (!uploadFile || !uploadTitle || uploading)
                      ? "rgba(30, 60, 110, 0.1)"
                      : "linear-gradient(135deg, #FFD700, #D4A500)",
                    border: "none",
                    color: (!uploadFile || !uploadTitle || uploading) ? "#94A3B8" : "#0F1B2D",
                    fontWeight: 700,
                    cursor: (!uploadFile || !uploadTitle || uploading) ? "not-allowed" : "pointer",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: (!uploadFile || !uploadTitle || uploading)
                      ? "none"
                      : "0 4px 18px rgba(255, 215, 0, 0.3)"
                  }}
                >
                  {uploading ? "Ajout en cours..." : "Ajouter l'analyse"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Detail Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 27, 45, 0.7)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20
            }}
            onClick={() => setSelectedAnalysis(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: "#FFFFFF",
                borderRadius: 28,
                padding: 32,
                maxWidth: 650,
                width: "100%",
                maxHeight: "85vh",
                overflow: "auto",
                boxShadow: "0 24px 56px rgba(0, 0, 0, 0.15)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F1B2D" }}>{selectedAnalysis.title}</h2>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94A3B8"
                  }}
                >
                  <MedicalIcons.Close size={20} />
                </button>
              </div>

              <div style={{
                padding: "12px 0",
                borderBottom: "1px solid rgba(30, 60, 110, 0.1)",
                marginBottom: 20
              }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Date : </span>
                <span style={{ fontWeight: 500 }}>{new Date(selectedAnalysis.date).toLocaleDateString("fr-FR")}</span>
                {selectedAnalysis.prediction && (
                  <>
                    <span style={{ marginLeft: 16, fontSize: "0.75rem", color: "#64748B" }}>Diagnostic : </span>
                    <span style={{ fontWeight: 600, color: "#D4A500" }}>{selectedAnalysis.prediction}</span>
                    {selectedAnalysis.confidence && (
                      <span style={{ marginLeft: 8, fontSize: "0.7rem", color: "#94A3B8" }}>
                        ({(selectedAnalysis.confidence * 100).toFixed(1)}% confiance)
                      </span>
                    )}
                  </>
                )}
              </div>

              <div style={{
                background: "#FAFBFC",
                borderRadius: 20,
                padding: 20,
                marginBottom: 20
              }}>
                <h4 style={{ fontWeight: 700, color: "#0F1B2D", marginBottom: 12 }}>Texte de l'analyse</h4>
                <div style={{
                  fontSize: "0.85rem",
                  color: "#475569",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  maxHeight: 400,
                  overflow: "auto"
                }}>
                  {selectedAnalysis.extractedText || "Aucun texte extrait disponible."}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                {selectedAnalysis.hasPdf && (
                  <button
                    onClick={() => downloadAnalysis(selectedAnalysis)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 14,
                      background: "rgba(255, 215, 0, 0.1)",
                      border: "1px solid rgba(255, 215, 0, 0.2)",
                      color: "#D4A500",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s ease"
                    }}
                  >
                    <MedicalIcons.Download size={16} />
                    Télécharger le document
                  </button>
                )}
                {selectedAnalysis.source !== "consultation" && (
                  <button
                    onClick={() => deleteAnalysis(selectedAnalysis)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 14,
                      background: "transparent",
                      border: "1.5px solid #EF4444",
                      color: "#EF4444",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s ease"
                    }}
                  >
                    <MedicalIcons.Trash size={16} />
                    Supprimer
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MedicalHistoryPage;