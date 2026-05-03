// hooks/usePatientData.js
import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi";

export const usePatientData = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { get, loading: apiLoading, error: apiError } = useApi();

  const fetchConsultations = useCallback(async () => {
    try {
      const data = await get("/consultations/my");
      setConsultations(data.consultations || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // Statistiques calculées
  const stats = {
    total: consultations.length,
    pending: consultations.filter(c => c.status === "pending").length,
    analyzed: consultations.filter(c => c.status === "analyzed").length,
    inProgress: consultations.filter(c => c.status === "accepted").length,
    critical: consultations.filter(c => c.urgency === "critical").length,
  };

  const recentConsultations = consultations
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const filteredByStatus = (status) => consultations.filter(c => c.status === status);

  return {
    consultations,
    stats,
    recentConsultations,
    loading: loading || apiLoading,
    error: error || apiError,
    refetch: fetchConsultations,
    filteredByStatus,
  };
};