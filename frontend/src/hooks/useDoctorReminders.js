// hooks/useDoctorReminders.js
import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi";

export const useDoctorReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { get, post, put, del } = useApi();

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get("/doctor/reminders/");  // ← /doctor/ pas /patient/
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
      const data = await post("/doctor/reminders/", reminderData);  // ← /doctor/
      setReminders(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [post]);

  const toggleReminder = useCallback(async (id, completed) => {
    try {
      const data = await put(`/doctor/reminders/${id}/`, { completed: !completed });  // ← /doctor/
      setReminders(prev => prev.map(r => r.id === id ? data : r));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [put]);

  const deleteReminder = useCallback(async (id) => {
    try {
      await del(`/doctor/reminders/${id}/`);  // ← /doctor/
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [del]);

  const checkUpcoming = useCallback(async () => {
    try {
      const data = await get("/doctor/reminders/check/");  // ← /doctor/
      return data;
    } catch (err) {
      console.error("Erreur check upcoming:", err);
      return null;
    }
  }, [get]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkUpcoming();
    }, 300000);
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