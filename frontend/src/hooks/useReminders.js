// hooks/useReminders.js
import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi";

export const useReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { get, post, put, del } = useApi();

  // IMPORTANT : Le backend FastAPI définit les routes avec trailing slash (/reminders/)
  // Il faut donc inclure le trailing slash dans les appels pour éviter les redirections 307
  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get("/patient/reminders/");  // ← trailing slash ajouté
      setReminders(data.reminders || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [get]);

  const addReminder = useCallback(async (reminderData) => {
    try {
      const data = await post("/patient/reminders/", reminderData);  // ← trailing slash ajouté
      setReminders(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [post]);

  const toggleReminder = useCallback(async (id, completed) => {
    try {
      const data = await put(`/patient/reminders/${id}/`, { completed: !completed });  // ← trailing slash ajouté
      setReminders(prev => prev.map(r => r.id === id ? data : r));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [put]);

  const deleteReminder = useCallback(async (id) => {
    try {
      await del(`/patient/reminders/${id}/`);  // ← trailing slash ajouté
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [del]);

  const checkUpcoming = useCallback(async () => {
    try {
      const data = await get("/patient/reminders/check/");  // ← trailing slash ajouté
      return data;
    } catch (err) {
      console.error("Erreur check upcoming:", err);
      return null;
    }
  }, [get]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Verifier les rappels a venir toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkUpcoming();
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [checkUpcoming]);

  return {
    reminders,
    loading,
    error,
    refetch: fetchReminders,
    addReminder,
    toggleReminder,
    deleteReminder,
    checkUpcoming,
    upcoming: reminders.filter(r => !r.completed),
    completed: reminders.filter(r => r.completed),
  };
};