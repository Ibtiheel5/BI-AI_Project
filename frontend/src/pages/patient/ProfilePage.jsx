// frontend/src/pages/patient/ProfilePage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PatientPageLayout } from "../../components/patient/PatientPageLayout";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// SVG Icons supplémentaires
const SvgIcon = ({ children, size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const ProfileIcons = {
  Upload: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </SvgIcon>
  ),
  Camera: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </SvgIcon>
  ),
  Edit: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M17 3l4 4-7 7H10v-4l7-7z" />
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
    </SvgIcon>
  ),
  Trash: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </SvgIcon>
  ),
  Check: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </SvgIcon>
  ),
  ArrowLeft: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </SvgIcon>
  ),
  Mail: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </SvgIcon>
  ),
  Phone: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </SvgIcon>
  ),
  MapPin: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </SvgIcon>
  ),
  Lock: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </SvgIcon>
  ),
  Eye: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </SvgIcon>
  ),
  EyeOff: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </SvgIcon>
  ),
  Info: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
    </SvgIcon>
  ),
  Folder: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </SvgIcon>
  ),
  LogOut: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.6}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </SvgIcon>
  ),
};

// Couleurs prédéfinies pour l'avatar
const AVATAR_COLORS = [
  { bg: "#2D5F9E", gradient: "linear-gradient(135deg, #2D5F9E, #1B3B6F)" },
  { bg: "#6B4FA0", gradient: "linear-gradient(135deg, #6B4FA0, #4A2F7A)" },
  { bg: "#D62828", gradient: "linear-gradient(135deg, #D62828, #A41E1E)" },
  { bg: "#0E7490", gradient: "linear-gradient(135deg, #0E7490, #0A5A6E)" },
  { bg: "#D4A500", gradient: "linear-gradient(135deg, #D4A500, #B8941E)" },
  { bg: "#10B981", gradient: "linear-gradient(135deg, #10B981, #059669)" },
  { bg: "#8B5CF6", gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)" },
  { bg: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #BE185D)" },
];

const getAvatarColor = (userId) => {
  if (!userId) return AVATAR_COLORS[0];
  const index = userId % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const token = localStorage.getItem("medai-token");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    username: "",
    phone: "",
    address: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        username: user.username || "",
        phone: user.phone || "",
        address: user.address || ""
      });
      
      // Charger l'avatar si existant
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
    }
  }, [user]);

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

 
const uploadAvatar = async (file) => {
    if (!file || !token) return null;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
        console.log("📤 Upload avatar:", file.name, file.type, file.size);
        
        const response = await fetch(`${API}/auth/avatar`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
                // NE PAS mettre Content-Type, le navigateur le définit automatiquement avec le boundary
            },
            body: formData
        });
        
        console.log("📥 Response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erreur réponse:", response.status, errorText);
            let errorMessage = "Erreur lors de l'upload";
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.detail || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log("✅ Avatar uploadé:", data);
        return data.avatar_url;
        
    } catch (err) {
        console.error("❌ Erreur upload avatar:", err);
        showToast("error", err.message || "Erreur lors de l'upload de l'avatar");
        return null;
    }
};
  // Supprimer l'avatar
  const deleteAvatar = async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API}/auth/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setAvatarPreview(null);
        setAvatarFile(null);
        if (updateUser) updateUser({ ...user, avatar_url: null });
        showToast("success", "Avatar supprimé avec succès");
      }
    } catch (err) {
      console.error("Erreur suppression avatar:", err);
      showToast("error", "Erreur lors de la suppression");
    }
  };

  // Gérer la sélection du fichier avatar
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      showToast("error", "Veuillez sélectionner une image (JPG, PNG, GIF)");
      return;
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "L'image ne doit pas dépasser 5 Mo");
      return;
    }
    
    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
    
    // Upload automatique
    handleAvatarUpload(file);
  };
  
  // Upload automatique de l'avatar
  const handleAvatarUpload = async (file) => {
    setUploadingAvatar(true);
    
    try {
      const avatarUrl = await uploadAvatar(file);
      if (avatarUrl) {
        if (updateUser) updateUser({ ...user, avatar_url: avatarUrl });
        showToast("success", "Photo de profil mise à jour");
      } else {
        showToast("error", "Erreur lors de l'upload");
        // Revenir à l'ancien avatar
        if (user?.avatar_url) {
          setAvatarPreview(user.avatar_url);
        } else {
          setAvatarPreview(null);
          setAvatarFile(null);
        }
      }
    } catch (err) {
      showToast("error", "Erreur lors de l'upload");
      if (user?.avatar_url) {
        setAvatarPreview(user.avatar_url);
      } else {
        setAvatarPreview(null);
        setAvatarFile(null);
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        if (updateUser) updateUser({ ...user, ...updatedUser });
        showToast("success", "Profil mis à jour avec succès");
      } else {
        const err = await res.json();
        showToast("error", err.detail || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      showToast("error", "Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast("error", "Les mots de passe ne correspondent pas");
      return;
    }
    if (passwordData.new_password.length < 6) {
      showToast("error", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    setSaving(true);
    
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });
      
      if (res.ok) {
        showToast("success", "Mot de passe modifié avec succès");
        setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      } else {
        const err = await res.json();
        showToast("error", err.detail || "Erreur lors du changement");
      }
    } catch (err) {
      showToast("error", "Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
        navigate("/");
      } else {
        showToast("error", "Erreur lors de la suppression");
      }
    } catch (err) {
      showToast("error", "Erreur de connexion");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const avatarColor = getAvatarColor(user?.id);
  const avatarInitial = (formData.full_name || user?.full_name || "U").charAt(0).toUpperCase();

  const menuItems = [
    { 
      icon: <ProfileIcons.Folder size={18} />, 
      label: "Dossier médical", 
      path: "/patient/profil/medical", 
      description: "Antécédents, allergies, traitements" 
    },
    { 
      icon: <PatientIcons.Document size={18} />, 
      label: "Mes documents", 
      path: "/patient/profil/documents", 
      description: "Rapports et images partagés" 
    },
    { 
      icon: <PatientIcons.Preferences size={18} />, 
      label: "Préférences", 
      path: "/patient/profil/preferences", 
      description: "Thème, langue, notifications" 
    }
  ];

  return (
    <div style={{ background: "var(--bg, #F0F4FA)", minHeight: "100vh", paddingBottom: 40 }}>
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
              <PatientIcons.Profile size={20} />
            </div>
            <div>
              <h1 style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                letterSpacing: "-0.02em"
              }}>
                Mon <span style={{ color: "#FFD700" }}>profil</span>
              </h1>
              <p style={{
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.6)",
                margin: "4px 0 0"
              }}>
                Gérez vos informations personnelles
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
            onClick={() => navigate("/patient")}
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
            <ProfileIcons.ArrowLeft size={16} />
            Retour
          </button>
        </div>

        {/* Toast Message */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                padding: "14px 20px",
                borderRadius: 14,
                marginBottom: 24,
                background: message.type === "success" 
                  ? "rgba(16, 185, 129, 0.1)" 
                  : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${message.type === "success" 
                  ? "rgba(16, 185, 129, 0.3)" 
                  : "rgba(239, 68, 68, 0.3)"}`,
                color: message.type === "success" ? "#10B981" : "#EF4444",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {message.type === "success" ? (
                  <ProfileIcons.Check size={18} color="#10B981" />
                ) : (
                  <ProfileIcons.Info size={18} color="#EF4444" />
                )}
                {message.text}
              </span>
              <button 
                onClick={() => setMessage({ type: "", text: "" })}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
              >
                <ProfileIcons.Trash size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left column - Profile form */}
          <div>
            {/* Avatar Card */}
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
                <PatientIcons.Profile size={18} />
                Photo de profil
              </h3>
              
              <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: 28,
                    background: avatarPreview 
                      ? `url(${avatarPreview}) center/cover no-repeat`
                      : avatarColor.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    border: "3px solid #fff",
                    position: "relative",
                    overflow: "hidden"
                  }}>
                    {!avatarPreview && (
                      <span style={{
                        fontSize: "2.5rem",
                        fontWeight: 800,
                        color: "#fff",
                        textTransform: "uppercase"
                      }}>
                        {avatarInitial}
                      </span>
                    )}
                    
                    {/* Upload overlay */}
                    {uploadingAvatar && (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          border: "2px solid rgba(255,255,255,0.2)",
                          borderTopColor: "#FFD700",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite"
                        }} />
                      </div>
                    )}
                  </div>
                  
                  {/* Edit button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #FFD700, #D4A500)",
                      border: "none",
                      cursor: uploadingAvatar ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!uploadingAvatar) {
                        e.currentTarget.style.transform = "scale(1.08)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <ProfileIcons.Camera size={18} color="#0F1B2D" />
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarSelect}
                    style={{ display: "none" }}
                  />
                </div>
                
                <div>
                  <div style={{ fontWeight: 600, color: "#0F1B2D", marginBottom: 4 }}>
                    {formData.full_name || user?.full_name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: 12 }}>
                    @{formData.username || user?.username}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        background: "rgba(255, 215, 0, 0.1)",
                        border: "1px solid rgba(255, 215, 0, 0.2)",
                        color: "#D4A500",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: uploadingAvatar ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <ProfileIcons.Upload size={14} style={{ marginRight: 6 }} />
                      Changer
                    </button>
                    {(avatarPreview || user?.avatar_url) && (
                      <button
                        onClick={deleteAvatar}
                        disabled={uploadingAvatar}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.15)",
                          color: "#EF4444",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: uploadingAvatar ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <ProfileIcons.Trash size={14} style={{ marginRight: 6 }} />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Card */}
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
                <PatientIcons.Profile size={18} />
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
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
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
                  <ProfileIcons.Mail size={14} style={{ display: "inline", marginRight: 6 }} />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={formData.username}
                  disabled
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem",
                    background: "#F1F5F9",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "#94A3B8",
                    cursor: "not-allowed"
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
                  <ProfileIcons.Phone size={14} style={{ display: "inline", marginRight: 6 }} />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 700, 
                  color: "#475569", 
                  display: "block", 
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  <ProfileIcons.MapPin size={14} style={{ display: "inline", marginRight: 6 }} />
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Votre adresse complète"
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
              
              <button
                onClick={updateProfile}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #FFD700, #D4A500)",
                  border: "none",
                  color: "#0F1B2D",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)"
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
            
            {/* Change Password Card */}
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
                <ProfileIcons.Lock size={18} />
                Changer le mot de passe
              </h3>
              
              <div style={{ marginBottom: 16 }}>
                <input
                  type={showPassword.current ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  placeholder="Mot de passe actuel"
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
                    paddingRight: "48px",
                    transition: "all 0.2s ease"
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 16, position: "relative" }}>
                <input
                  type={showPassword.new ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
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
                    paddingRight: "48px",
                    transition: "all 0.2s ease"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94A3B8"
                  }}
                >
                  {showPassword.new ? <ProfileIcons.EyeOff size={18} /> : <ProfileIcons.Eye size={18} />}
                </button>
              </div>
              
              <div style={{ marginBottom: 24, position: "relative" }}>
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Confirmer le nouveau mot de passe"
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
                    paddingRight: "48px",
                    transition: "all 0.2s ease"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94A3B8"
                  }}
                >
                  {showPassword.confirm ? <ProfileIcons.EyeOff size={18} /> : <ProfileIcons.Eye size={18} />}
                </button>
              </div>
              
              <button
                onClick={changePassword}
                disabled={saving || !passwordData.current_password || !passwordData.new_password}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #FFD700, #D4A500)",
                  border: "none",
                  color: "#0F1B2D",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: (!passwordData.current_password || !passwordData.new_password) ? "not-allowed" : "pointer",
                  opacity: (!passwordData.current_password || !passwordData.new_password) ? 0.5 : 1,
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)"
                }}
              >
                Changer le mot de passe
              </button>
            </div>
          </div>

          {/* Right column - Menu & Danger zone */}
          <div>
            {/* Quick Menu Card */}
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
                <ProfileIcons.Folder size={18} />
                Accès rapide
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {menuItems.map((item, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ x: 6 }}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 18px",
                      background: "#FAFBFC",
                      borderRadius: 16,
                      border: "1px solid rgba(30, 60, 110, 0.06)",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 215, 0, 0.04)";
                      e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#FAFBFC";
                      e.currentTarget.style.borderColor = "rgba(30, 60, 110, 0.06)";
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "rgba(255, 215, 0, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#D4A500"
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#0F1B2D" }}>{item.label}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748B" }}>{item.description}</div>
                    </div>
                    <ProfileIcons.ArrowLeft size={16} color="#94A3B8" style={{ transform: "rotate(180deg)" }} />
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Danger Zone Card */}
            <div style={{
              background: "rgba(239, 68, 68, 0.04)",
              borderRadius: 24,
              padding: 28,
              border: "1px solid rgba(239, 68, 68, 0.15)",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
            }}>
              <h3 style={{ 
                fontWeight: 700, 
                color: "#EF4444", 
                marginBottom: 12, 
                display: "flex", 
                alignItems: "center", 
                gap: 8 
              }}>
                <ProfileIcons.Trash size={18} color="#EF4444" />
                Zone sensible
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: 20, lineHeight: 1.6 }}>
                La suppression de votre compte est irréversible. Toutes vos données seront effacées définitivement.
              </p>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                style={{
                  padding: "12px 24px",
                  borderRadius: 14,
                  background: "transparent",
                  border: "1.5px solid #EF4444",
                  color: "#EF4444",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  width: "100%",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(239, 68, 68, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                }}
              >
                {loading ? "Suppression en cours..." : "Supprimer mon compte"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
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
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: "#FFFFFF",
                borderRadius: 28,
                padding: 32,
                maxWidth: 460,
                width: "100%",
                boxShadow: "0 24px 56px rgba(0, 0, 0, 0.15)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20
              }}>
                <ProfileIcons.Trash size={28} color="#EF4444" />
              </div>
              
              <h2 style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: "#0F1B2D",
                marginBottom: 12
              }}>
                Supprimer votre compte ?
              </h2>
              
              <p style={{
                fontSize: "0.85rem",
                color: "#64748B",
                lineHeight: 1.6,
                marginBottom: 24
              }}>
                Cette action est <strong>irréversible</strong>. Toutes vos données personnelles, 
                consultations et documents seront définitivement supprimés.
              </p>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
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
                  onClick={deleteAccount}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 14,
                    background: "#EF4444",
                    border: "none",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 18px rgba(239, 68, 68, 0.3)"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 8px 24px rgba(239, 68, 68, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 18px rgba(239, 68, 68, 0.3)";
                  }}
                >
                  Oui, supprimer définitivement
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;