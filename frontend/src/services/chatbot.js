// src/services/chatbot.js
const API_BASE = "http://localhost:8000/api/v1";

/**
 * Analyse les symptômes du patient via l'API backend
 */
export async function analyzeSymptoms(text) {
  try {
    const response = await fetch(`${API_BASE}/chatbot/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Erreur d'analyse des symptômes");
    }

    return await response.json();
  } catch (error) {
    console.error("Chatbot error:", error);
    return {
      type: "error",
      message: "Désolé, une erreur est survenue. Veuillez réessayer.",
      recommendation: null,
    };
  }
}

/**
 * Récupère la liste des modèles disponibles
 */
export async function getAvailableModels() {
  try {
    const response = await fetch(`${API_BASE}/chatbot/models`);
    if (!response.ok) throw new Error("Erreur");
    return await response.json();
  } catch (error) {
    return { models: [] };
  }
}