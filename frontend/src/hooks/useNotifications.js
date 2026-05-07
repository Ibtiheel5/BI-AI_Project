// hooks/useNotifications.js
import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { get, post } = useApi();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await get("/consultations/notifications/me?unread_only=false");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error("Erreur notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  const markAllAsRead = useCallback(async () => {
    try {
      await post("/consultations/notifications/read-all", {});
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Erreur marquage lu:", err);
    }
  }, [post]);

  // Optimistic local update — no per-notification endpoint exists in backend
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAllAsRead,
    markAsRead,
  };
};