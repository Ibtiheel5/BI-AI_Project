// frontend/src/pages/patient/DocumentsPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ===== SVG ICONS CUSTOM =====
const SvgIcon = ({ children, size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const CustomIcons = {
  Document: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </SvgIcon>
  ),
  Pdf: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h6M8 17h4" />
      <path d="M10 9H8" />
      <rect x="15" y="13" width="3" height="4" rx="1" />
    </SvgIcon>
  ),
  Upload: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </SvgIcon>
  ),
  Close: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </SvgIcon>
  ),
  Check: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </SvgIcon>
  ),
  AlertCircle: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
    </SvgIcon>
  ),
  FileText: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </SvgIcon>
  ),
  Image: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </SvgIcon>
  ),
  Download: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </SvgIcon>
  ),
  Share: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </SvgIcon>
  ),
  Trash: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </SvgIcon>
  ),
  Eye: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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
  Filter: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />
    </SvgIcon>
  ),
  Refresh: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </SvgIcon>
  ),
};

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("medai-token");

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [uploadType, setUploadType] = useState("report");
  const [toast, setToast] = useState(null);
  
  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // 1. Récupérer les consultations analysées
      const consultationsRes = await fetch(`${API}/consultations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (consultationsRes.ok) {
        const data = await consultationsRes.json();
        const consultationDocs = (data.consultations || [])
          .filter(c => c.status === "analyzed")
          .map(c => ({
            id: `consult_${c.id}`,
            title: `Rapport #${c.id} - ${c.prediction || "Analyse médicale"}`,
            type: "report",
            date: c.created_at,
            size: "PDF",
            source: "consultation",
            consultationId: c.id,
            prediction: c.prediction,
            confidence: c.confidence
          }));
        
        setDocuments(consultationDocs);
      }
      
      // 2. Récupérer les documents uploadés manuellement (si l'API existe)
      try {
        const uploadsRes = await fetch(`${API}/patient/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (uploadsRes.ok) {
          const uploadsData = await uploadsRes.json();
          const uploadedDocs = (uploadsData.documents || []).map(doc => ({
            ...doc,
            source: "upload"
          }));
          setDocuments(prev => [...prev, ...uploadedDocs]);
        }
      } catch (err) {
        console.log("API documents upload non disponible");
      }
      
    } catch (err) {
      console.error("Erreur chargement documents:", err);
      // Données mockées pour la démonstration
      setDocuments([
        { id: 1, title: "Rapport radiologique - Mars 2024", type: "report", date: "2024-03-15", size: "2.4 MB", source: "mock" },
        { id: 2, title: "Ordonnance - Traitement antibiotique", type: "prescription", date: "2024-02-20", size: "1.1 MB", source: "mock" },
        { id: 3, title: "Résultat IRM cérébrale", type: "report", date: "2024-01-10", size: "3.2 MB", source: "mock" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle) {
      showToast("Veuillez remplir le titre et sélectionner un fichier", "error");
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);
      formData.append("date", uploadDate || new Date().toISOString().split('T')[0]);
      formData.append("type", uploadType);

      const res = await fetch(`${API}/patient/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => [newDoc, ...prev]);
        showToast("Document ajouté avec succès");
        setShowUploadModal(false);
        resetUploadForm();
      } else {
        // Simulation locale
        const newDoc = {
          id: Date.now(),
          title: uploadTitle,
          type: uploadType,
          date: uploadDate || new Date().toISOString(),
          size: `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB`,
          source: "upload"
        };
        setDocuments(prev => [newDoc, ...prev]);
        showToast("Document ajouté (mode local)");
        setShowUploadModal(false);
        resetUploadForm();
      }
    } catch (err) {
      console.error("Erreur upload:", err);
      showToast("Erreur lors de l'upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadDate("");
    setUploadType("report");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadDocument = async (doc) => {
    if (doc.source === "consultation" && doc.consultationId) {
      // Rediriger vers le détail du résultat
      navigate(`/patient/resultats/${doc.consultationId}`);
    } else if (doc.file_url) {
      // Télécharger le fichier
      window.open(doc.file_url, "_blank");
    } else {
      showToast("Téléchargement non disponible pour ce document", "error");
    }
  };

  const shareDocument = (doc) => {
    // Copier le lien dans le presse-papier
    const url = `${window.location.origin}/patient/resultats/${doc.consultationId || doc.id}`;
    navigator.clipboard.writeText(url);
    showToast("Lien copié dans le presse-papier");
  };

  const deleteDocument = async (doc) => {
    if (!window.confirm(`Supprimer "${doc.title}" définitivement ?`)) return;
    
    try {
      if (doc.source === "upload") {
        const res = await fetch(`${API}/patient/documents/${doc.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setDocuments(prev => prev.filter(d => d.id !== doc.id));
          showToast("Document supprimé");
        }
      } else {
        // Pour les consultations, on ne supprime pas, on cache
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
        showToast("Document retiré de la liste");
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      report: <CustomIcons.Pdf size={22} />,
      prescription: <CustomIcons.FileText size={22} />,
      image: <CustomIcons.Image size={22} />
    };
    return icons[type] || <CustomIcons.Document size={22} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      report: "#3B82F6",
      prescription: "#8B5CF6",
      image: "#10B981"
    };
    return colors[type] || "#D4A500";
  };

  const getTypeLabel = (type) => {
    const labels = { report: "Rapport médical", prescription: "Ordonnance", image: "Image médicale" };
    return labels[type] || "Document";
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

  const filteredDocs = documents.filter(doc => filter === "all" || doc.type === filter);
  const reportCount = documents.filter(d => d.type === "report").length;
  const prescriptionCount = documents.filter(d => d.type === "prescription").length;

  if (loading) {
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
              <CustomIcons.Document size={20} />
            </div>
            <div>
              <h1 style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                letterSpacing: "-0.02em"
              }}>
                Mes <span style={{ color: "#FFD700" }}>documents</span>
              </h1>
              <p style={{
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.6)",
                margin: "4px 0 0"
              }}>
                Tous vos rapports et documents médicaux
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
                {documents.length} document{documents.length > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
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
                background: "#3B82F6",
                boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)"
              }} />
              <span style={{ color: "#3B82F6", fontSize: "0.75rem", fontWeight: 600 }}>
                {reportCount} rapport{reportCount > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
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
                background: "#8B5CF6",
                boxShadow: "0 0 8px rgba(139, 92, 246, 0.5)"
              }} />
              <span style={{ color: "#8B5CF6", fontSize: "0.75rem", fontWeight: 600 }}>
                {prescriptionCount} ordonnance{prescriptionCount > 1 ? "s" : ""}
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
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              padding: "8px 16px",
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid rgba(30, 60, 110, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <CustomIcons.Filter size={14} color="#94A3B8" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#475569",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="all">Tous les documents</option>
                <option value="report">Rapports médicaux</option>
                <option value="prescription">Ordonnances</option>
                <option value="image">Images médicales</option>
              </select>
            </div>
            <button
              onClick={fetchDocuments}
              style={{
                padding: "8px 16px",
                background: "#FFFFFF",
                borderRadius: 12,
                border: "1.5px solid rgba(30, 60, 110, 0.1)",
                color: "#475569",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFFFF";
              }}
            >
              <CustomIcons.Refresh size={14} />
              Actualiser
            </button>
          </div>
          
          <button
            onClick={() => setShowUploadModal(true)}
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
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "inherit"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
            }}
          >
            <CustomIcons.Upload size={18} />
            Ajouter un document
          </button>
        </div>

        {/* Documents List */}
        {filteredDocs.length === 0 ? (
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
              <CustomIcons.Document size={36} color="#D4A500" />
            </div>
            <h3 style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#0F1B2D",
              marginBottom: 8
            }}>
              Aucun document
            </h3>
            <p style={{
              fontSize: "0.85rem",
              color: "#94A3B8",
              maxWidth: 300,
              margin: "0 auto 24px",
              lineHeight: 1.6
            }}>
              Vos rapports apparaîtront ici après vos analyses médicales.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
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
                cursor: "pointer"
              }}
            >
              <CustomIcons.Upload size={18} />
              Ajouter un document
            </button>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredDocs.map((doc, idx) => {
              const typeColor = getTypeColor(doc.type);
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    border: "1px solid rgba(30, 60, 110, 0.08)",
                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
                    overflow: "hidden",
                    position: "relative",
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
                    background: typeColor
                  }} />

                  <div style={{ padding: "24px 28px 24px 36px", display: "flex", alignItems: "flex-start", gap: 20 }}>
                    {/* Type Icon */}
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: `${typeColor}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: typeColor,
                      flexShrink: 0
                    }}>
                      {getTypeIcon(doc.type)}
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
                        <h3 style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#0F1B2D",
                          margin: 0
                        }}>
                          {doc.title}
                        </h3>
                        <span style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: `${typeColor}10`,
                          color: typeColor,
                          border: `1px solid ${typeColor}25`
                        }}>
                          {getTypeLabel(doc.type)}
                        </span>
                      </div>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        flexWrap: "wrap"
                      }}>
                        <span style={{
                          fontSize: "0.75rem",
                          color: "#64748B",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          <CustomIcons.Calendar size={13} />
                          {formatDate(doc.date)}
                        </span>
                        {doc.size && (
                          <span style={{
                            fontSize: "0.75rem",
                            color: "#64748B",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            <CustomIcons.Document size={13} />
                            {doc.size}
                          </span>
                        )}
                        {doc.prediction && (
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 12,
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#10B981"
                          }}>
                            {doc.prediction}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: "flex",
                      gap: 8,
                      flexShrink: 0
                    }}>
                      <button
                        onClick={() => downloadDocument(doc)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: "rgba(255, 215, 0, 0.08)",
                          border: "1.5px solid rgba(255, 215, 0, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#D4A500",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 215, 0, 0.15)";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 215, 0, 0.08)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title="Télécharger"
                      >
                        <CustomIcons.Download size={18} />
                      </button>
                      <button
                        onClick={() => shareDocument(doc)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: "rgba(30, 60, 110, 0.04)",
                          border: "1.5px solid rgba(30, 60, 110, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#475569",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(30, 60, 110, 0.08)";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(30, 60, 110, 0.04)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title="Partager"
                      >
                        <CustomIcons.Share size={18} />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: "rgba(239, 68, 68, 0.06)",
                          border: "1.5px solid rgba(239, 68, 68, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#EF4444",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.06)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title="Supprimer"
                      >
                        <CustomIcons.Trash size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
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
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: "#FFFFFF",
                borderRadius: 28,
                padding: 32,
                maxWidth: 520,
                width: "100%",
                boxShadow: "0 24px 56px rgba(0, 0, 0, 0.15)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24
              }}>
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
                    <CustomIcons.Upload size={22} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: "#0F1B2D",
                      margin: 0
                    }}>
                      Ajouter un document
                    </h2>
                    <p style={{
                      fontSize: "0.75rem",
                      color: "#94A3B8",
                      margin: "4px 0 0"
                    }}>
                      PDF, JPG, PNG - Max 10 Mo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
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
                    color: "#94A3B8",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.color = "#EF4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#94A3B8";
                  }}
                >
                  <CustomIcons.Close size={20} />
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
                  Titre du document *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="ex: Bilan sanguin Mars 2024"
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
                  Type de document
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { value: "report", label: "Rapport médical", icon: <CustomIcons.Pdf size={16} />, color: "#3B82F6" },
                    { value: "prescription", label: "Ordonnance", icon: <CustomIcons.FileText size={16} />, color: "#8B5CF6" },
                    { value: "image", label: "Image médicale", icon: <CustomIcons.Image size={16} />, color: "#10B981" }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setUploadType(type.value)}
                      style={{
                        flex: 1,
                        padding: "12px 8px",
                        borderRadius: 12,
                        background: uploadType === type.value ? `${type.color}10` : "#FAFBFC",
                        border: uploadType === type.value ? `2px solid ${type.color}40` : "1.5px solid rgba(30, 60, 110, 0.1)",
                        color: uploadType === type.value ? type.color : "#94A3B8",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s ease"
                      }}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
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
                  Fichier *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${uploadFile ? "#D4A500" : "rgba(30, 60, 110, 0.15)"}`,
                    borderRadius: 16,
                    padding: uploadFile ? "20px" : "40px",
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
                      if (file) setUploadFile(file);
                    }}
                    style={{ display: "none" }}
                  />
                  {uploadFile ? (
                    <div>
                      <CustomIcons.Check size={32} color="#D4A500" />
                      <p style={{ marginTop: 12, fontWeight: 500, color: "#0F1B2D" }}>{uploadFile.name}</p>
                      <p style={{ fontSize: "0.7rem", color: "#64748B" }}>
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                  ) : (
                    <div>
                      <CustomIcons.Upload size={32} color="#D4A500" />
                      <p style={{ marginTop: 12, fontWeight: 500, color: "#0F1B2D" }}>Cliquez pour sélectionner un fichier</p>
                      <p style={{ fontSize: "0.7rem", color: "#64748B" }}>PDF, JPG, PNG (max 10 Mo)</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: 8,
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Date du document
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
                    color: "#0F1B2D",
                    transition: "all 0.2s ease"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
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
                  onClick={handleUpload}
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
                  {uploading ? "Upload en cours..." : "Ajouter le document"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            style={{
              position: "fixed",
              bottom: 24,
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
              <CustomIcons.AlertCircle size={16} color="white" />
            ) : (
              <CustomIcons.Check size={16} color="white" />
            )}
            {toast.message}
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

export default DocumentsPage;