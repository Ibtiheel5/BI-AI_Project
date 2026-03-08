import { useState } from "react";

/**
 * GradCAMViewer — affiche la heatmap Grad-CAM avec options de comparaison
 * Props :
 *   gradcamBase64 : string base64 de l'image
 *   prediction    : string classe prédite
 *   confidence    : float [0,1]
 *   label         : string titre affiché (ex: "Grad-CAM", "Grad-CAM++")
 */
export default function GradCAMViewer({ gradcamBase64, prediction, confidence, label = "Grad-CAM" }) {
  const [mode, setMode] = useState("overlay"); // "overlay" | "side"

  if (!gradcamBase64) return null;

  const confidencePct = (confidence * 100).toFixed(1);

  return (
    <div className="gradcam-card">
      {/* ── Header ── */}
      <div className="gradcam-header">
        <div className="gradcam-title-row">
          <div className="gradcam-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="var(--cyan)" opacity="0.8"/>
              <circle cx="8" cy="8" r="6" stroke="var(--cyan)" strokeWidth="1.2" strokeDasharray="2 2"/>
            </svg>
          </div>
          <span className="gradcam-title">{label} — Zones d'attention</span>
        </div>

        {/* Mode toggle */}
        <div className="gradcam-mode-toggle">
          <button
            className={`mode-btn ${mode === "overlay" ? "mode-btn--active" : ""}`}
            onClick={() => setMode("overlay")}
          >
            Superposé
          </button>
          <button
            className={`mode-btn ${mode === "side" ? "mode-btn--active" : ""}`}
            onClick={() => setMode("side")}
          >
            Plein écran
          </button>
        </div>
      </div>

      {/* ── Verdict compact ── */}
      <div className="gradcam-verdict">
        <span className="gradcam-pred">{prediction}</span>
        <span className="gradcam-conf">{confidencePct}% de confiance</span>
      </div>

      {/* ── Image ── */}
      <div className={`gradcam-image-wrap ${mode === "side" ? "gradcam-image-wrap--full" : ""}`}>
        <img
          src={`data:image/jpeg;base64,${gradcamBase64}`}
          alt={`${label} heatmap`}
          className="gradcam-image"
        />
        <div className="gradcam-legend">
          <div className="legend-gradient" />
          <div className="legend-labels">
            <span>Faible attention</span>
            <span>Forte attention</span>
          </div>
        </div>
      </div>

      {/* ── Explication ── */}
      <div className="gradcam-explanation">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="6" stroke="var(--text-dim)" strokeWidth="1"/>
          <path d="M6.5 4v3.5M6.5 9v.5" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        Les zones <span style={{color:"#ff4444"}}>rouges</span> indiquent les régions qui ont le plus influencé
        la décision du modèle pour <strong>{prediction}</strong>.
        Les zones <span style={{color:"#4444ff"}}>bleues</span> ont peu contribué.
      </div>
    </div>
  );
}