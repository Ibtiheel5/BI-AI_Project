// components/CriticalNotificationOverlay.jsx
// Overlay de notification critique qui s'affiche automatiquement à l'ouverture
// 100% SVG - Pas d'images externes

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════
// SVG ICONS CRITIQUES - Tous en inline SVG
// ═══════════════════════════════════════

const CriticalBellIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    <motion.circle 
      cx="18" cy="4" r="3" 
      fill="#EF4444" 
      stroke="none"
      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

const AlertTriangleIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <motion.path 
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      animate={{ strokeDasharray: ["0 100", "100 0"], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <line x1="12" y1="9" x2="12" y2="13" strokeWidth="3"/>
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
  </svg>
);

const PulseRingIcon = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
    <motion.circle
      cx="60" cy="60" r="20"
      fill="none"
      stroke="#EF4444"
      strokeWidth="2"
      initial={{ r: 20, opacity: 1 }}
      animate={{ r: 55, opacity: 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
    <motion.circle
      cx="60" cy="60" r="20"
      fill="none"
      stroke="#EF4444"
      strokeWidth="2"
      initial={{ r: 20, opacity: 1 }}
      animate={{ r: 55, opacity: 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
    />
    <motion.circle
      cx="60" cy="60" r="20"
      fill="none"
      stroke="#EF4444"
      strokeWidth="2"
      initial={{ r: 20, opacity: 1 }}
      animate={{ r: 55, opacity: 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.4 }}
    />
  </svg>
);

const HeartbeatIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <motion.path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "center" }}
    />
  </svg>
);

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ChevronRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ShieldCheckIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <motion.polyline
      points="9 12 11 14 15 10"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <motion.polyline
      points="12 6 12 12 16 14"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8 }}
    />
  </svg>
);

const UrgentIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ═══════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════

export const CriticalNotificationOverlay = ({ 
  notifications = [], 
  userRole = "patient", // "patient" | "doctor"
  onDismiss,
  onAction,
  autoShowDelay = 1500, // Délai avant affichage auto (ms)
  dismissAfter = null, // null = pas d'auto-dismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Filtrer uniquement les notifications critiques/non lues
  const criticalNotifications = notifications.filter(n => 
    !n.is_read && 
    !dismissedIds.has(n.id) &&
    (n.priority === "critical" || n.priority === "high" || n.urgency === "critical" || n.type?.includes("critical") || n.type?.includes("urgent"))
  );

  const currentNotification = criticalNotifications[currentIndex];

  // Affichage automatique à l'ouverture
  useEffect(() => {
    if (criticalNotifications.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, autoShowDelay);
      return () => clearTimeout(timer);
    }
  }, [criticalNotifications.length, autoShowDelay]);

  // Auto-dismiss optionnel
  useEffect(() => {
    if (isVisible && dismissAfter) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, dismissAfter);
      return () => clearTimeout(timer);
    }
  }, [isVisible, dismissAfter, currentIndex]);

  const handleDismiss = useCallback(() => {
    if (currentNotification) {
      setDismissedIds(prev => new Set([...prev, currentNotification.id]));
    }

    if (currentIndex < criticalNotifications.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsVisible(false);
      setCurrentIndex(0);
      onDismiss?.();
    }
  }, [currentNotification, currentIndex, criticalNotifications.length, onDismiss]);

  const handleAction = useCallback(() => {
    if (currentNotification) {
      onAction?.(currentNotification);
      handleDismiss();
    }
  }, [currentNotification, onAction, handleDismiss]);

  const handleMarkAllRead = useCallback(() => {
    setDismissedIds(new Set(criticalNotifications.map(n => n.id)));
    setIsVisible(false);
    setCurrentIndex(0);
    onDismiss?.();
  }, [criticalNotifications, onDismiss]);

  if (!currentNotification) return null;

  const isDoctor = userRole === "doctor";
  const accentColor = isDoctor ? "#D4A500" : "#3B82F6";
  const bgGradient = isDoctor 
    ? "linear-gradient(135deg, #0A1628 0%, #1a2d4d 50%, #0d1f3c 100%)"
    : "linear-gradient(135deg, #0A1628 0%, #1B3B6F 50%, #0F1B2D 100%)";

  const getActionText = () => {
    if (isDoctor) {
      if (currentNotification.type?.includes("consultation")) return "Voir la consultation";
      if (currentNotification.type?.includes("message")) return "Ouvrir le message";
      if (currentNotification.type?.includes("appointment")) return "Voir le rendez-vous";
      return "Prendre action";
    } else {
      if (currentNotification.type?.includes("result")) return "Voir les résultats";
      if (currentNotification.type?.includes("message")) return "Lire le message";
      if (currentNotification.type?.includes("appointment")) return "Confirmer le rendez-vous";
      if (currentNotification.type?.includes("prescription")) return "Voir l'ordonnance";
      return "Consulter";
    }
  };

  const getNotificationIcon = () => {
    const type = currentNotification.type || "";
    if (type.includes("consultation") || type.includes("urgent")) return <AlertTriangleIcon size={40} />;
    if (type.includes("message")) return <CriticalBellIcon size={40} />;
    if (type.includes("result")) return <HeartbeatIcon size={32} />;
    if (type.includes("appointment")) return <ClockIcon size={32} />;
    return <AlertTriangleIcon size={40} />;
  };

  const getNotificationColor = () => {
    const type = currentNotification.type || "";
    if (type.includes("critical") || type.includes("urgent")) return "#EF4444";
    if (type.includes("warning")) return "#F59E0B";
    if (type.includes("info")) return "#3B82F6";
    return "#EF4444";
  };

  const iconColor = getNotificationColor();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleDismiss();
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              background: bgGradient,
              borderRadius: 28,
              padding: "40px 36px 32px",
              maxWidth: 480,
              width: "100%",
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px ${iconColor}30, 0 0 60px ${iconColor}20`,
              border: `1px solid ${iconColor}40`,
            }}
          >
            {/* Effets de fond animés SVG */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 28, pointerEvents: "none" }}>
              {/* Grille SVG */}
              <svg width="100%" height="100%" style={{ opacity: 0.03 }}>
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)"/>
              </svg>

              {/* Cercles pulsants */}
              <PulseRingIcon size={200} />

              {/* Glow */}
              <div style={{
                position: "absolute",
                top: "-30%",
                right: "-20%",
                width: "70%",
                height: "160%",
                background: `radial-gradient(ellipse, ${iconColor}15 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />
            </div>

            {/* Bouton fermer */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDismiss}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <CloseIcon size={16} />
            </motion.button>

            {/* Contenu */}
            <div style={{ position: "relative", zIndex: 2 }}>
              {/* Badge priorité */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  borderRadius: 50,
                  background: `${iconColor}20`,
                  border: `1px solid ${iconColor}50`,
                  marginBottom: 24,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: iconColor,
                    boxShadow: `0 0 10px ${iconColor}`,
                  }}
                />
                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: iconColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}>
                  {currentNotification.priority === "critical" ? "CRITIQUE" : "URGENT"}
                </span>
              </motion.div>

              {/* Icône centrale animée */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${iconColor}30, ${iconColor}10)`,
                  border: `2px solid ${iconColor}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  color: iconColor,
                  boxShadow: `0 0 40px ${iconColor}30`,
                }}
              >
                {getNotificationIcon()}
              </motion.div>

              {/* Titre */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: "#fff",
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                {currentNotification.title || "Nouvelle alerte"}
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                {currentNotification.message || "Vous avez une notification importante nécessitant votre attention immédiate."}
              </motion.p>

              {/* Métadonnées */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 28,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  <ClockIcon size={14} />
                  {currentNotification.created_at 
                    ? new Date(currentNotification.created_at).toLocaleString("fr-FR", { 
                        day: "numeric", 
                        month: "short", 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })
                    : "À l'instant"
                  }
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  <ShieldCheckIcon size={14} />
                  {isDoctor ? "Espace Médecin" : "Espace Patient"}
                </div>
                {criticalNotifications.length > 1 && (
                  <div style={{ 
                    fontSize: "0.7rem", 
                    color: iconColor, 
                    fontWeight: 600,
                    padding: "2px 10px",
                    borderRadius: 20,
                    background: `${iconColor}15`,
                  }}>
                    {currentIndex + 1} / {criticalNotifications.length}
                  </div>
                )}
              </motion.div>

              {/* Boutons d'action */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: `0 8px 30px ${iconColor}40` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAction}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)`,
                    color: "#fff",
                    border: "none",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    fontFamily: "inherit",
                    boxShadow: `0 4px 20px ${iconColor}30`,
                  }}
                >
                  {getActionText()}
                  <ChevronRightIcon size={16} />
                </motion.button>

                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Ignorer
                  </motion.button>

                  {criticalNotifications.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleMarkAllRead}
                      style={{
                        flex: 1,
                        padding: "12px 20px",
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.5)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Tout marquer lu
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Barre de progression auto-dismiss */}
            {dismissAfter && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: dismissAfter / 1000, ease: "linear" }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${iconColor}, ${iconColor}80)`,
                  borderRadius: "0 0 0 28px",
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CriticalNotificationOverlay;