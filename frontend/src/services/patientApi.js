// services/patientApi.js
const API_BASE = "http://localhost:8000/api/v1";

export const patientApi = {
  // Consultations
  getMyConsultations: async (token, status = null) => {
    const url = status ? `${API_BASE}/consultations/my?status=${status}` : `${API_BASE}/consultations/my`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Erreur chargement consultations");
    return res.json();
  },

  // Créer une consultation
  createConsultation: async (token, file, modelKey, patientNotes) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model_key", modelKey);
    formData.append("patient_notes", patientNotes);
    const res = await fetch(`${API_BASE}/consultations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Erreur création consultation");
    return res.json();
  },

  // Messages
  getMessages: async (token, consultationId) => {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur chargement messages");
    return res.json();
  },

  sendMessage: async (token, consultationId, content) => {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, msg_type: "text" }),
    });
    if (!res.ok) throw new Error("Erreur envoi message");
    return res.json();
  },

  // Notifications
  getNotifications: async (token, unreadOnly = false) => {
    const res = await fetch(`${API_BASE}/consultations/notifications/me?unread_only=${unreadOnly}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur chargement notifications");
    return res.json();
  },

  markAllNotificationsRead: async (token) => {
    const res = await fetch(`${API_BASE}/consultations/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur marquage notifications");
    return res.json();
  },

  // Médecins
  getDoctors: async (model = null, ville = null, specialite = null) => {
    let url = `${API_BASE}/doctors`;
    const params = new URLSearchParams();
    if (model) params.append("model", model);
    if (ville) params.append("ville", ville);
    if (specialite) params.append("specialite", specialite);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erreur chargement médecins");
    return res.json();
  },

  getDoctorsForPrediction: async (prediction, ville = null, limit = 10) => {
    let url = `${API_BASE}/doctors/for-prediction?prediction=${encodeURIComponent(prediction)}&limit=${limit}`;
    if (ville) url += `&ville=${encodeURIComponent(ville)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erreur chargement médecins");
    return res.json();
  },
};