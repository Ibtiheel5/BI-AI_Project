// hooks/useApi.js
import { useState, useCallback } from "react";

const API_BASE = "http://localhost:8000/api/v1";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem("medai-token");

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erreur ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint) => request(endpoint, { method: "GET" }), [request]);
  const post = useCallback((endpoint, body) => request(endpoint, { method: "POST", body: JSON.stringify(body) }), [request]);
  const put = useCallback((endpoint, body) => request(endpoint, { method: "PUT", body: JSON.stringify(body) }), [request]);
  const del = useCallback((endpoint) => request(endpoint, { method: "DELETE" }), [request]);

  return { loading, error, get, post, put, delete: del, request };
};