// PredictionResult.jsx — Affichage des résultats de diagnostic
export default function PredictionResult({ result }) {
  if (!result) return null;

  const { prediction, confidence, probabilities, out_of_domain, warning } = result;

  const sorted  = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const top5    = sorted.slice(0, 5);
  const maxProb = top5[0][1];

  const confidencePct = (confidence * 100).toFixed(1);
  const isHighConf  = confidence >= 0.6;
  const isMidConf   = confidence >= 0.35;
  const confClass   = isHighConf ? "conf--high" : isMidConf ? "conf--mid" : "conf--low";
  const confLabel   = isHighConf ? "✓ Confiance élevée" : isMidConf ? "∼ Confiance modérée" : "⚠ Confiance faible";

  // ── Image hors-domaine : bannière d'erreur + stop ──────────────────────────
  if (out_of_domain) {
    return (
      <div className="result-card animate-fade-up" style={{ borderColor: "#f87171" }}>
        {/* Bannière rouge */}
        <div style={{
          background: "#fef2f2",
          border: "1.5px solid #fca5a5",
          borderRadius: "12px",
          padding: "18px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          marginBottom: "16px",
        }}>
          <span style={{ fontSize: "26px", lineHeight: 1, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{
              fontWeight: 700,
              color: "#b91c1c",
              fontSize: "15px",
              marginBottom: "6px",
            }}>
              Image non reconnue
            </div>
            <div style={{
              color: "#7f1d1d",
              fontSize: "13px",
              lineHeight: "1.6",
            }}>
              {warning || "L'image uploadée ne correspond pas au modèle sélectionné. Veuillez uploader une image médicale adaptée."}
            </div>
          </div>
        </div>

        {/* Détails confidence */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          fontSize: "13px",
          color: "#9ca3af",
        }}>
          <span>Confidence : <strong style={{ color: "#ef4444" }}>{confidencePct}%</strong></span>
          <span>Seuil requis : <strong>40%</strong></span>
        </div>

        {/* Distribution quand même (informative) */}
        <div className="result-probs" style={{ marginTop: "16px", opacity: 0.5 }}>
          <div className="probs-title" style={{ fontSize: "12px" }}>
            Distribution brute (non fiable)
          </div>
          <div className="probs-list">
            {top5.map(([cls, prob], i) => {
              const pct  = (prob * 100).toFixed(1);
              const barW = (prob / maxProb) * 100;
              return (
                <div key={cls} className="prob-row" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="prob-rank">{i + 1}</span>
                  <span className="prob-cls" title={cls}>{cls}</span>
                  <div className="prob-bar-track">
                    <div className="prob-bar-fill" style={{ width: `${barW}%` }} />
                  </div>
                  <span className="prob-pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Résultat normal ────────────────────────────────────────────────────────
  return (
    <div className="result-card animate-fade-up">
      {/* ── Verdict ── */}
      <div className="result-verdict">
        <div className="verdict-label">Diagnostic suggéré</div>
        <div className="verdict-name">{prediction}</div>

        <div className={`verdict-confidence ${confClass}`}>
          <div
            className="conf-bar-fill"
            style={{ width: `${confidencePct}%` }}
          />
          <span className="conf-value">{confidencePct}%</span>
        </div>

        <div className={`verdict-tag ${confClass}`}>
          {confLabel}
        </div>
      </div>

      {/* ── Probabilités ── */}
      <div className="result-probs">
        <div className="probs-title">Distribution · Top 5</div>
        <div className="probs-list">
          {top5.map(([cls, prob], i) => {
            const pct  = (prob * 100).toFixed(1);
            const barW = (prob / maxProb) * 100;
            const top  = i === 0;
            return (
              <div
                key={cls}
                className={`prob-row${top ? " prob-row--top" : ""}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="prob-rank">{i + 1}</span>
                <span className="prob-cls" title={cls}>{cls}</span>
                <div className="prob-bar-track">
                  <div
                    className="prob-bar-fill"
                    style={{ width: `${barW}%`, animationDelay: `${i * 80}ms` }}
                  />
                </div>
                <span className="prob-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="result-disclaimer">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Ce résultat est fourni à titre indicatif uniquement et ne remplace pas un avis médical qualifié.
      </div>
    </div>
  );
}