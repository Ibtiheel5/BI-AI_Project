// hooks/useCriticalNotifications.js
// Hook pour gérer les notifications critiques avec détection automatique à l'ouverture

import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:8000/api/v1";

/**
 * Hook qui détecte automatiquement les notifications critiques au chargement
 * et les maintient à jour en temps réel
 */
export const useCriticalNotifications = (userRole = "patient") => {
  const [notifications, setNotifications] = useState([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasShownInitial, setHasShownInitial] = useState(false);
  const intervalRef = useRef(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("medai-token") : null;

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Essayer d'abord l'endpoint spécifique aux notifications
      const res = await fetch(`${API}/consultations/notifications/me?unread_only=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setNotifications(notifs);

        // Compter les critiques
        const criticals = notifs.filter(n => 
          n.priority === "critical" || 
          n.priority === "high" || 
          n.urgency === "critical" ||
          n.type?.includes("critical") || 
          n.type?.includes("urgent") ||
          n.type === "new_consultation" ||
          n.type === "consultation_accepted" ||
          n.type === "analysis_ready"
        );
        setCriticalCount(criticals.length);
      } else {
        // Fallback: récupérer depuis les consultations
        await fetchFromConsultations();
      }
    } catch (err) {
      console.error("Erreur fetch notifications:", err);
      // Fallback en cas d'erreur réseau
      await fetchFromConsultations();
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fallback: créer des notifications depuis les consultations
  const fetchFromConsultations = useCallback(async () => {
    try {
      const endpoint = userRole === "doctor" 
        ? `${API}/consultations/queue`
        : `${API}/consultations/my`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const consultations = data.consultations || [];

        // Créer des notifications depuis les consultations critiques
        const criticalConsultations = consultations.filter(c => 
          c.urgency === "critical" || 
          c.status === "pending" ||
          (c.prediction && c.status === "analyzed")
        );

        const derivedNotifications = criticalConsultations.map(c => ({
          id: `derived_${c.id}`,
          title: c.urgency === "critical" 
            ? `🚨 Urgence critique - ${c.patient_name || "Patient"}`
            : c.status === "analyzed"
            ? `✅ Résultats disponibles - Dossier #${c.id}`
            : `📋 Nouvelle consultation - Dossier #${c.id}`,
          message: c.urgency === "critical"
            ? `Consultation marquée comme CRITIQUE nécessitant une attention immédiate.`
            : c.status === "analyzed"
            ? `L'analyse IA est terminée. Diagnostic: ${c.prediction}`
            : `Nouvelle consultation en attente de traitement.`,
          type: c.urgency === "critical" ? "critical_urgent" : c.status,
          priority: c.urgency === "critical" ? "critical" : "high",
          is_read: false,
          created_at: c.created_at || new Date().toISOString(),
          data: JSON.stringify({ consultation_id: c.id }),
          consultation_id: c.id,
        }));

        setNotifications(derivedNotifications);
        setCriticalCount(derivedNotifications.length);
      }
    } catch (err) {
      console.error("Erreur fallback consultations:", err);
    }
  }, [token, userRole]);

  // Marquer comme lu
  const markAsRead = useCallback(async (notificationId) => {
    // Mise à jour optimiste locale
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setCriticalCount(prev => Math.max(0, prev - 1));

    // Appel API si c'est une vraie notification (pas derived)
    if (!String(notificationId).startsWith("derived_") && token) {
      try {
        await fetch(`${API}/consultations/notifications/${notificationId}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Erreur marquage lu:", err);
      }
    }
  }, [token]);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setCriticalCount(0);

    if (token) {
      try {
        await fetch(`${API}/consultations/notifications/read-all`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Erreur marquage tout lu:", err);
      }
    }
  }, [token]);

  // Charger au montage
  useEffect(() => {
    fetchNotifications();

    // Polling toutes les 30 secondes
    intervalRef.current = setInterval(fetchNotifications, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  // Détecter les nouvelles notifications critiques
  useEffect(() => {
    if (!loading && criticalCount > 0 && !hasShownInitial) {
      setHasShownInitial(true);
    }
  }, [loading, criticalCount, hasShownInitial]);

  // Réinitialiser hasShownInitial quand les notifications changent significativement
  const resetShown = useCallback(() => {
    setHasShownInitial(false);
  }, []);

  // Filtrer uniquement les non lues et critiques
  const unreadCritical = notifications.filter(n => 
    !n.is_read && (
      n.priority === "critical" || 
      n.priority === "high" || 
      n.urgency === "critical" ||
      n.type?.includes("critical") || 
      n.type?.includes("urgent")
    )
  );

  return {
    notifications,
    criticalNotifications: unreadCritical,
    criticalCount,
    unreadCount: notifications.filter(n => !n.is_read).length,
    loading,
    hasShownInitial,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    resetShown,
  };
};

export default useCriticalNotifications;