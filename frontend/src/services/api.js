// services/api.js - SSE streaming support
const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * predict() — consumes the SSE stream from /api/v1/predict
 *
 * Callbacks (all optional):
 *   onPrediction(data)   — called once with the prediction object
 *   onChunk(text)        — called for each Gemini explanation chunk
 *   onError(errorMsg)    — called if the server signals an explain_error
 *   onDone()             — called when the stream is complete
 *
 * Returns: the prediction data object (for backward-compat await usage)
 */
export async function predict(
  file,
  model = 'chest',
  gradcam = true,
  { onPrediction, onChunk, onError, onDone } = {}
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('gradcam', gradcam.toString());

  // Backend expects model & gradcam as query params (Query(...) in FastAPI)
  const url = `${API_BASE_URL}/predict?model=${encodeURIComponent(model)}&gradcam=${gradcam}&explain=true`;

  console.log('📤 Sending to:', url);
  console.log('📁 File:', file.name);
  console.log('🎯 Model:', model);

  let predictionData = null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server response:', response.status, errorText);
      throw new Error(`Erreur ${response.status}: ${errorText || 'Unknown error'}`);
    }

    // --- Read the SSE stream line-by-line ---
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines are separated by '\n'
      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.slice(5).trim(); // strip "data: "
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const event = JSON.parse(jsonStr);

          switch (event.type) {
            case 'prediction':
              predictionData = event;
              console.log('✅ Prediction received:', event);
              onPrediction?.(event);
              break;

            case 'explain_chunk':
              onChunk?.(event.text);
              break;

            case 'explain_error':
              console.warn('⚠️ Explain error:', event.error);
              onError?.(event.error);
              break;

            case 'done':
              console.log('🏁 Stream done');
              onDone?.();
              break;

            default:
              console.log('📨 Unknown event type:', event.type, event);
          }
        } catch (parseErr) {
          console.warn('⚠️ Could not parse SSE line:', jsonStr, parseErr);
        }
      }
    }

    // Flush any remaining buffer
    if (buffer.trim().startsWith('data:')) {
      const jsonStr = buffer.trim().slice(5).trim();
      if (jsonStr && jsonStr !== '[DONE]') {
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === 'done') onDone?.();
        } catch (_) {}
      }
    }

    if (!predictionData) {
      throw new Error('Aucune donnée de prédiction reçue du serveur.');
    }

    return predictionData;

  } catch (error) {
    console.error('❌ Prediction error:', error);
    throw error;
  }
}

export async function getHealth() {
  try {
    console.log('🏥 Checking health at:', `${API_BASE_URL}/health`);
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Health check:', data);
    return { status: 'ok', ...data };
  } catch (error) {
    console.error('❌ Health check error:', error);
    return { status: 'offline' };
  }
}

/**
 * downloadReport() — Génère et télécharge le rapport PDF
 */
export async function downloadReport({
  file, model, patientId,
  prediction, confidence, probabilities,
  explainText = "", gradcamImage = "", reportId = "",
}) {
  const formData = new FormData();
  formData.append('file', file);
  // Large text fields sent as form fields (not URL params — avoids length limits)
  formData.append('explain_text', explainText);
  formData.append('gradcam_image', gradcamImage || '');

  const params = new URLSearchParams({
    model,
    patient_id:    patientId || 'PATIENT-INCONNU',
    prediction,
    confidence:    String(confidence),
    probabilities: JSON.stringify(probabilities || {}),
    report_id:     reportId || '',
  });

  const response = await fetch(`${API_BASE_URL}/report?${params}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erreur PDF ${response.status}: ${err}`);
  }

  // Téléchargement automatique
  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  const rid  = response.headers.get('X-Report-ID') || 'rapport';
  a.download = `rapport_ia_${patientId || 'patient'}_${rid}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return rid;
}