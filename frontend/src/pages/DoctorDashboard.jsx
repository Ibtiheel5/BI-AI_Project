// src/pages/DoctorDashboard.jsx — VERSION COMPLÈTE
// ✅ Explainable AI (Gemini streaming)
// ✅ Téléchargement rapport PDF
// ✅ Clôture de dossier avec notes
// ✅ GradCAM viewer
// ✅ Distribution probabilités
// ✅ Panel analyse complet
// ✅ Toutes les actions médecin

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: "En attente",  color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "⏳" },
  accepted: { label: "Acceptée",    color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", icon: "✅" },
  analyzed: { label: "Analysée",    color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: "🧬" },
  closed:   { label: "Terminée",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: "🔒" },
  rejected: { label: "Rejetée",     color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "❌" },
};

const URGENCY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", priority: 4 },
  urgent:   { label: "URGENT",   color: "#EA580C", bg: "#FFF7ED", border: "#FDBA74", priority: 3 },
  normal:   { label: "NORMAL",   color: "#10B981", bg: "#F0FDF4", border: "#86EFAC", priority: 1 },
};

const MODEL_CONFIG = {
  brain:  { label: "IRM Cérébrale",      color: "#7C3AED", gradient: "linear-gradient(135deg,#7C3AED,#6D28D9)", icon: "🧠", bg: "#F5F3FF" },
  lung:   { label: "Scanner CT",         color: "#DC2626", gradient: "linear-gradient(135deg,#DC2626,#B91C1C)", icon: "🔬", bg: "#FEF2F2" },
  chest:  { label: "Radio Thoracique",   color: "#0369A1", gradient: "linear-gradient(135deg,#0EA5E9,#0369A1)", icon: "🫁", bg: "#F0F9FF" },
  retina: { label: "Fond d'œil",         color: "#0E7490", gradient: "linear-gradient(135deg,#0E7490,#0891B2)", icon: "👁️", bg: "#ECFEFF" },
};

// ─────────────────────────────────────────────────────────────────
// MINI COMPOSANTS
// ─────────────────────────────────────────────────────────────────

function Spinner({ size = 28, color = "#0F172A" }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid rgba(0,0,0,0.08)`,
      borderTopColor: color, borderRadius: "50%",
      animation: "spin .7s linear infinite", flexShrink: 0,
    }} />
  );
}

function StatCard({ icon, label, value, color, bg, onClick, trend, subtitle }) {
  return (
    <div onClick={onClick} style={{
      background: "white", borderRadius: 20, padding: "24px",
      border: "1px solid #F1F5F9", cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => onClick && Object.assign(e.currentTarget.style, { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(0,0,0,0.08)" })}
      onMouseLeave={e => onClick && Object.assign(e.currentTarget.style, { transform: "translateY(0)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" })}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: bg, opacity: 0.3 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: "2rem" }}>{icon}</span>
          {trend && (
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: trend > 0 ? "#10B981" : "#EF4444", background: trend > 0 ? "#ECFDF5" : "#FEF2F2", padding: "4px 8px", borderRadius: 20 }}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
        <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>{label}</div>
        {subtitle && <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 4 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function ConsultationCard({ consultation, onClick }) {
  const model = MODEL_CONFIG[consultation.model_key] || MODEL_CONFIG.chest;
  const status = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.pending;
  const urgency = URGENCY_CONFIG[consultation.urgency] || URGENCY_CONFIG.normal;
  const waitTime = () => {
    if (!consultation.created_at) return "—";
    const diff = Math.floor((Date.now() - new Date(consultation.created_at)) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `${diff} min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}j`;
  };
  return (
    <div onClick={onClick} style={{
      background: "white", borderRadius: 16, padding: "20px",
      border: "1px solid #F1F5F9", cursor: "pointer",
      transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      borderLeft: `4px solid ${urgency.color}`,
    }}
      onMouseEnter={e => Object.assign(e.currentTarget.style, { transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(0,0,0,0.07)" })}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { transform: "translateY(0)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" })}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: model.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
          {model.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A" }}>{consultation.patient_name || "Patient"}</span>
            <span style={{ fontSize: "0.7rem", color: "#94A3B8", fontFamily: "monospace" }}>#{consultation.id}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
              {status.icon} {status.label}
            </span>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, background: urgency.bg, color: urgency.color }}>
              {urgency.label}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>⏱ {waitTime()}</span>
          </div>
        </div>
        {consultation.status === "analyzed" && (
          <div style={{ padding: "4px 12px", background: "#ECFDF5", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, color: "#059669", flexShrink: 0 }}>
            Résultats prêts
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, isDoctor }) {
  const isMine = (isDoctor && message.sender_role === "Medecin") || (!isDoctor && message.sender_role === "Patient");
  return (
    <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isMine && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#64748B,#475569)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.7rem", fontWeight: 700, marginRight: 8, flexShrink: 0 }}>
          {message.sender_name?.charAt(0) || "P"}
        </div>
      )}
      <div style={{
        maxWidth: "72%", padding: "11px 15px",
        borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isMine ? "#0F172A" : "#F8FAFC",
        border: isMine ? "none" : "1px solid #E2E8F0",
        color: isMine ? "white" : "#0F172A",
        fontSize: "0.85rem", lineHeight: 1.5,
      }}>
        {!isMine && <div style={{ fontSize: "0.65rem", color: "#94A3B8", marginBottom: 3, fontWeight: 600 }}>{message.sender_name}</div>}
        {message.content}
        <div style={{ fontSize: "0.6rem", color: isMine ? "rgba(255,255,255,0.4)" : "#CBD5E1", marginTop: 4, textAlign: "right" }}>
          {new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// EXPLAINABLE AI — PANEL COMPLET
// ─────────────────────────────────────────────────────────────────

function AnalysisPanel({
  analysis, consultationData, model,
  analysisLoading, onRunAnalysis,
  onCloseConsultation, onDownloadPDF,
  pdfLoading, closeLoading,
  explainText, explaining, explainError,
  showGradcam, onToggleGradcam,
}) {
  const [showExplain, setShowExplain] = useState(true);
  const explainEndRef = useRef(null);

  useEffect(() => {
    if (explainEndRef.current && explaining) {
      explainEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [explainText, explaining]);

  const probs = useMemo(() => {
    if (!analysis?.probabilities) return [];
    let p = analysis.probabilities;
    if (typeof p === "string") { try { p = JSON.parse(p); } catch { return []; } }
    return Object.entries(p).sort(([, a], [, b]) => b - a);
  }, [analysis]);

  const maxProb = probs[0]?.[1] || 1;

  // Parse sections markdown de l'explication
  const parsedSections = useMemo(() => {
    if (!explainText) return [];
    const sections = [];
    let current = null;
    let lines = [];
    for (const line of explainText.split("\n")) {
      if (line.startsWith("## ")) {
        if (current) sections.push({ title: current, content: lines.join("\n").trim() });
        current = line.replace(/^## /, "").trim();
        lines = [];
      } else if (current) {
        lines.push(line);
      }
    }
    if (current) sections.push({ title: current, content: lines.join("\n").trim() });
    return sections;
  }, [explainText]);

  if (!consultationData) {
    return (
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #F1F5F9", padding: "40px 20px", textAlign: "center", color: "#94A3B8" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🤖</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Sélectionnez une consultation</div>
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #F1F5F9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", background: "linear-gradient(135deg,#F8FAFC,white)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0F172A" }}>🧬 Analyse IA</div>
          <div style={{ display: "flex", gap: 6 }}>
            {analysis?.gradcam_b64 && (
              <button onClick={onToggleGradcam} style={{
                padding: "5px 12px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                background: showGradcam ? "#FEF2F2" : "#EFF6FF",
                border: showGradcam ? "1px solid #FECACA" : "1px solid #BFDBFE",
                color: showGradcam ? "#DC2626" : "#2563EB",
              }}>
                {showGradcam ? "🖼 Image orig." : "🔥 Grad-CAM"}
              </button>
            )}
            {analysis && (
              <button onClick={() => setShowExplain(!showExplain)} style={{
                padding: "5px 12px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                background: "#F5F3FF", border: "1px solid #DDD6FE", color: "#7C3AED",
              }}>
                {showExplain ? "📊 Stats" : "🔍 Explication"}
              </button>
            )}
          </div>
        </div>
        {/* Patient info */}
        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
          <span style={{ fontWeight: 700, color: "#0F172A" }}>{consultationData.patient_name}</span>
          {" · "}#{consultationData.id}
          {" · "}{model?.label}
          {" · "}<span style={{ color: STATUS_CONFIG[consultationData.status]?.color, fontWeight: 600 }}>
            {STATUS_CONFIG[consultationData.status]?.label}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

        {/* GradCAM image */}
        {analysis?.gradcam_b64 && showGradcam && (
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", background: "#0F172A" }}>
            <div style={{ padding: "8px 12px", background: "rgba(220,38,38,0.9)", fontSize: "0.68rem", fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
              🔥 GRAD-CAM — Zones d'attention du modèle IA
            </div>
            <img src={`data:image/jpeg;base64,${analysis.gradcam_b64}`} alt="GradCAM" style={{ width: "100%", display: "block" }} />
            {/* Heatmap scale */}
            <div style={{ padding: "8px 12px", background: "#0F172A" }}>
              <div style={{ height: 8, borderRadius: 4, background: "linear-gradient(90deg,#0000FF,#00FFFF,#00FF00,#FFFF00,#FF0000)", marginBottom: 4 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>
                <span>Faible attention</span><span>Forte attention</span>
              </div>
            </div>
          </div>
        )}

        {/* Image originale du dossier */}
        {consultationData.image_path && !showGradcam && (
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", background: "#0F172A" }}>
            <div style={{ padding: "8px 12px", background: "#1E293B", fontSize: "0.68rem", fontWeight: 600, color: "rgba(255,255,255,.6)" }}>
              🖼 Image médicale soumise
            </div>
            <img
              src={`http://localhost:8000/${consultationData.image_path}`}
              alt="Image médicale"
              style={{ width: "100%", maxHeight: 200, objectFit: "contain", display: "block" }}
              onError={e => e.target.style.display = "none"}
            />
          </div>
        )}

        {/* Pas encore d'analyse */}
        {!analysis && !analysisLoading && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🤖</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Analyse non disponible</div>
            <div style={{ fontSize: "0.78rem", color: "#94A3B8", lineHeight: 1.6, marginBottom: 16, maxWidth: 220, margin: "0 auto 16px" }}>
              {consultationData.status === "accepted"
                ? "Lancez l'analyse IA pour obtenir le diagnostic."
                : "La consultation doit être acceptée avant l'analyse."}
            </div>
            {consultationData.status === "accepted" && (
              <button onClick={onRunAnalysis} disabled={analysisLoading} style={{
                padding: "10px 24px", background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
                border: "none", borderRadius: 12, color: "white",
                fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                <span>🤖</span> Lancer l'analyse IA
              </button>
            )}
          </div>
        )}

        {/* Loading analyse */}
        {analysisLoading && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <Spinner size={42} color="#7C3AED" />
            <div style={{ marginTop: 14, fontSize: "0.85rem", fontWeight: 700, color: "#7C3AED" }}>Analyse en cours…</div>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 4 }}>Traitement par modèle IA · {model?.label}</div>
          </div>
        )}

        {/* Résultat analyse */}
        {analysis && !analysisLoading && (
          <>
            {/* Warning */}
            {analysis.warning && (
              <div style={{ padding: "10px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, marginBottom: 12, fontSize: "0.78rem", color: "#92400E" }}>
                ⚠️ {analysis.warning}
              </div>
            )}

            {/* Main result card */}
            <div style={{ padding: "16px", borderRadius: 14, background: analysis.out_of_domain ? "#FEF2F2" : "#F0FDF4", border: `1px solid ${analysis.out_of_domain ? "#FECACA" : "#BBF7D0"}`, marginBottom: 14 }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                {analysis.out_of_domain ? "⚠️ HORS DOMAINE" : "DIAGNOSTIC PRINCIPAL"}
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: analysis.out_of_domain ? "#DC2626" : "#059669", marginBottom: 10 }}>
                {analysis.prediction}
              </div>
              {/* Confidence bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Confiance</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0F172A" }}>
                    {(analysis.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 7, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: `${analysis.confidence * 100}%`, height: "100%",
                    background: analysis.confidence > 0.8 ? "#059669" : analysis.confidence > 0.5 ? "#F59E0B" : "#DC2626",
                    borderRadius: 4, transition: "width .8s ease",
                  }} />
                </div>
              </div>
            </div>

            {/* Switch: Stats vs Explication */}
            {showExplain ? (
              /* EXPLAINABLE AI — Sections Gemini */
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🔍</span> Explication clinique IA
                  {explaining && <span style={{ fontWeight: 500, color: "#94A3B8", animation: "pulse 1.5s infinite" }}>• génération…</span>}
                </div>

                {explainError && (
                  <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: "0.75rem", color: "#DC2626", marginBottom: 10 }}>
                    ⚠️ {explainError}
                  </div>
                )}

                {!explainText && !explaining && !explainError && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#CBD5E1", fontSize: "0.8rem" }}>
                    L'explication clinique sera générée lors de l'analyse.
                  </div>
                )}

                {/* Sections parsées */}
                {parsedSections.length > 0 && parsedSections.map((section, idx) => (
                  <div key={idx} style={{ marginBottom: 14 }}>
                    <div style={{
                      padding: "6px 12px", background: "linear-gradient(90deg,#EFF6FF,#F8FAFC)",
                      borderLeft: "3px solid #2563EB", borderRadius: "0 8px 8px 0",
                      marginBottom: 8, fontSize: "0.72rem", fontWeight: 700, color: "#2563EB",
                    }}>
                      {section.title}
                    </div>
                    <div style={{
                      fontSize: "0.8rem", color: "#475569", lineHeight: 1.7,
                      padding: "8px 12px", background: "#F8FAFC", borderRadius: 8,
                    }}
                      dangerouslySetInnerHTML={{
                        __html: section.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0F172A;font-weight:700">$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .split("\n").join("<br/>")
                      }}
                    />
                  </div>
                ))}

                {/* Streaming text (pas encore parsé) */}
                {explaining && parsedSections.length === 0 && explainText && (
                  <div style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.7, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8 }}>
                    {explainText}
                    <span style={{ display: "inline-block", width: 2, height: "1.1em", background: "#7C3AED", marginLeft: 3, verticalAlign: "middle", animation: "cursorBlink 1s step-end infinite" }} />
                  </div>
                )}

                {/* Typing indicator */}
                {explaining && !explainText && (
                  <div style={{ display: "flex", gap: 5, padding: "8px 12px" }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED", animation: `typing 1s ease-in-out ${d}s infinite` }} />
                    ))}
                  </div>
                )}

                <div ref={explainEndRef} />
              </div>
            ) : (
              /* STATS — Distribution probabilités */
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
                  Distribution des probabilités
                </div>
                {probs.slice(0, 8).map(([cls, prob]) => (
                  <div key={cls} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: "0.78rem", color: cls === analysis.prediction ? "#0F172A" : "#64748B", fontWeight: cls === analysis.prediction ? 700 : 400 }}>
                        {cls === analysis.prediction && "► "}{cls}
                      </span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: cls === analysis.prediction ? "#059669" : "#94A3B8" }}>
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${(prob / maxProb) * 100}%`, height: "100%",
                        background: cls === analysis.prediction ? "linear-gradient(90deg,#059669,#10B981)" : "#CBD5E1",
                        borderRadius: 3, transition: "width .6s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions footer */}
      {consultationData.status !== "closed" && consultationData.status !== "rejected" && (
        <div style={{ padding: "14px 16px", borderTop: "1px solid #F1F5F9", background: "#FAFBFC", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Lancer analyse */}
          {consultationData.status === "accepted" && !analysis && (
            <button onClick={onRunAnalysis} disabled={analysisLoading} style={{
              width: "100%", padding: "11px", background: analysisLoading ? "#E2E8F0" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
              border: "none", borderRadius: 11, color: "white", fontSize: "0.85rem",
              fontWeight: 700, cursor: analysisLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {analysisLoading ? <><Spinner size={16} color="white" /> Analyse en cours…</> : "🤖 Lancer l'analyse IA"}
            </button>
          )}

          {/* Relancer analyse */}
          {consultationData.status === "analyzed" && (
            <button onClick={onRunAnalysis} disabled={analysisLoading} style={{
              width: "100%", padding: "9px", background: "white",
              border: "1.5px solid #7C3AED", borderRadius: 11, color: "#7C3AED",
              fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
            }}>
              🔄 Relancer l'analyse
            </button>
          )}

          {/* Télécharger rapport PDF */}
          {analysis && (
            <button onClick={onDownloadPDF} disabled={pdfLoading || explaining} style={{
              width: "100%", padding: "11px",
              background: pdfLoading ? "#E2E8F0" : "linear-gradient(135deg,#0369A1,#0284C7)",
              border: "none", borderRadius: 11, color: pdfLoading ? "#94A3B8" : "white",
              fontSize: "0.85rem", fontWeight: 700, cursor: pdfLoading || explaining ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {pdfLoading
                ? <><Spinner size={16} color="#94A3B8" /> Génération PDF…</>
                : "📄 Télécharger le rapport PDF"}
            </button>
          )}
          {explaining && (
            <div style={{ fontSize: "0.68rem", color: "#94A3B8", textAlign: "center" }}>
              ⏳ Attendez la fin de l'explication Gemini pour un rapport complet…
            </div>
          )}

          {/* Clôturer la consultation */}
          {(consultationData.status === "analyzed" || consultationData.status === "accepted") && (
            <button onClick={onCloseConsultation} disabled={closeLoading} style={{
              width: "100%", padding: "9px", background: "white",
              border: "1.5px solid #E2E8F0", borderRadius: 11, color: "#6B7280",
              fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              {closeLoading ? <><Spinner size={14} color="#6B7280" /> Clôture…</> : "🔒 Clôturer la consultation"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MODAL CLÔTURE
// ─────────────────────────────────────────────────────────────────

function CloseModal({ onConfirm, onCancel, loading }) {
  const [notes, setNotes] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)", animation: "fadeUp .2s ease" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>🔒 Clôturer la consultation</div>
        <div style={{ fontSize: "0.82rem", color: "#64748B", marginBottom: 18, lineHeight: 1.6 }}>
          Ajoutez des notes finales pour le patient (recommandations, suivi…). La consultation sera marquée comme terminée.
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes de clôture, recommandations, prescriptions…"
          rows={4}
          style={{ width: "100%", padding: "12px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, fontSize: "0.85rem", color: "#0F172A", resize: "none", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 18 }}
          onFocus={e => e.target.style.borderColor = "#0F172A"}
          onBlur={e => e.target.style.borderColor = "#E2E8F0"}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#64748B", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={() => onConfirm(notes)} disabled={loading} style={{
            flex: 1, padding: "11px", background: loading ? "#E2E8F0" : "#0F172A",
            border: "none", borderRadius: 12, color: "white", fontSize: "0.85rem", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {loading ? <><Spinner size={14} color="white" /> Clôture…</> : "🔒 Confirmer la clôture"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  // Views & UI
  const [activeView, setActiveView] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGradcam, setShowGradcam] = useState(false);

  // Data
  const [queue, setQueue] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Consultation courante
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultationData, setConsultationData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [msgInput, setMsgInput] = useState("");

  // Actions loading
  const [actionLoading, setActionLoading] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Explainable AI
  const [explainText, setExplainText] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState("");

  const messagesEndRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // ── FETCH ──────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/queue`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setQueue((data.consultations || []).sort((a, b) => {
          const uA = URGENCY_CONFIG[a.urgency]?.priority || 0;
          const uB = URGENCY_CONFIG[b.urgency]?.priority || 0;
          return uA !== uB ? uB - uA : new Date(b.created_at) - new Date(a.created_at);
        }));
      }
    } catch (e) {}
  }, [token]);

  const fetchAssigned = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/assigned`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setAssigned(data.consultations || []); }
    } catch (e) {}
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/consultations/notifications/me?unread_only=false`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setNotifications(data.notifications || []); setUnreadCount(data.unread || 0); }
    } catch (e) {}
  }, [token]);

  const fetchConsultationDetails = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API}/consultations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setConsultationData(data.consultation);
        setMessages(data.messages || []);
        setAnalysis(data.analysis);
        // Si une analyse existe déjà, reconstruire l'explication depuis explain_text
        if (data.analysis?.explain_text && !explainText) {
          setExplainText(data.analysis.explain_text);
        }
      }
    } catch (e) {}
  }, [token, explainText]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchQueue(), fetchAssigned(), fetchNotifications()]);
    setLoading(false);
  }, [fetchQueue, fetchAssigned, fetchNotifications]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (selectedConsultation) { setExplainText(""); setExplainError(""); fetchConsultationDetails(selectedConsultation); } }, [selectedConsultation]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue(); fetchAssigned(); fetchNotifications();
      if (selectedConsultation) fetchConsultationDetails(selectedConsultation);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedConsultation, fetchQueue, fetchAssigned, fetchNotifications, fetchConsultationDetails]);

  // ── ACTIONS ────────────────────────────────────────────────────

  const handleAccept = async (id) => {
    setActionLoading(`accept-${id}`);
    try {
      await fetch(`${API}/consultations/${id}/accept`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      await loadAll();
      setSelectedConsultation(id);
      setActiveView("messages");
    } catch (e) {}
    finally { setActionLoading(null); }
  };

  const handleReject = async (id, reason = "") => {
    setActionLoading(`reject-${id}`);
    try {
      const form = new FormData();
      form.append("reason", reason);
      await fetch(`${API}/consultations/${id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      await loadAll();
      if (selectedConsultation === id) { setSelectedConsultation(null); setActiveView("dashboard"); }
    } catch (e) {}
    finally { setActionLoading(null); }
  };

  // ── ANALYSE IA + GEMINI STREAMING ──────────────────────────────
  const handleRunAnalysis = async () => {
    if (!selectedConsultation || !consultationData) return;
    setAnalysisLoading(true);
    setExplainText("");
    setExplainError("");

    try {
      const imagePath = consultationData.image_path;
      if (!imagePath) throw new Error("Aucune image trouvée.");

      const imageRes = await fetch(`http://localhost:8000/${imagePath}`);
      if (!imageRes.ok) throw new Error("Impossible de charger l'image.");
      const imageBlob = await imageRes.blob();
      const file = new File([imageBlob], "image.jpg", { type: imageBlob.type || "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);

      const modelKey = consultationData.model_key || "chest";
      const predictRes = await fetch(`${API}/predict?model=${modelKey}&gradcam=true&explain=true`, {
        method: "POST", body: formData,
      });
      if (!predictRes.ok) throw new Error(`Erreur API: ${predictRes.status}`);

      const reader = predictRes.body.getReader();
      const decoder = new TextDecoder();
      let predictionData = null;
      let buffer = "";
      let fullExplain = "";
      let hasStartedExplain = false;

      setAnalysisLoading(false); // Prediction will come first

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "prediction") {
              predictionData = event;
              // Save prediction to backend
              const saveForm = new FormData();
              saveForm.append("prediction", event.prediction);
              saveForm.append("confidence", String(event.confidence));
              saveForm.append("probabilities", JSON.stringify(event.probabilities || {}));
              saveForm.append("explain_text", "");
              saveForm.append("gradcam_b64", event.gradcam_image || "");
              saveForm.append("out_of_domain", String(event.out_of_domain || false));
              saveForm.append("warning", event.warning || "");
              await fetch(`${API}/consultations/${selectedConsultation}/analysis`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` }, body: saveForm,
              });
              await fetchConsultationDetails(selectedConsultation);
              await fetchAssigned();
            }

            if (event.type === "explain_chunk") {
              if (!hasStartedExplain) { setExplaining(true); hasStartedExplain = true; }
              fullExplain += event.text;
              setExplainText(fullExplain);
            }

            if (event.type === "invalid_image") {
              setExplainError("⛔ " + event.warning);
              setExplaining(false);
            }

            if (event.type === "explain_error") {
              setExplainError(event.error);
              setExplaining(false);
            }

            if (event.type === "done") {
              setExplaining(false);
              // Save explain_text to backend
              if (fullExplain && predictionData) {
                const updateForm = new FormData();
                updateForm.append("prediction", predictionData.prediction);
                updateForm.append("confidence", String(predictionData.confidence));
                updateForm.append("probabilities", JSON.stringify(predictionData.probabilities || {}));
                updateForm.append("explain_text", fullExplain);
                updateForm.append("gradcam_b64", predictionData.gradcam_image || "");
                updateForm.append("out_of_domain", String(predictionData.out_of_domain || false));
                updateForm.append("warning", predictionData.warning || "");
                await fetch(`${API}/consultations/${selectedConsultation}/analysis`, {
                  method: "POST", headers: { Authorization: `Bearer ${token}` }, body: updateForm,
                });
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("❌ Erreur analyse:", e);
      setExplainError(e.message);
    } finally {
      setAnalysisLoading(false);
      setExplaining(false);
    }
  };

  // ── CLÔTURE ────────────────────────────────────────────────────
  const handleCloseConsultation = async (notes) => {
    setCloseLoading(true);
    try {
      const form = new FormData();
      form.append("doctor_notes", notes);
      await fetch(`${API}/consultations/${selectedConsultation}/close`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      setShowCloseModal(false);
      await loadAll();
      await fetchConsultationDetails(selectedConsultation);
    } catch (e) {}
    finally { setCloseLoading(false); }
  };

  // ── TÉLÉCHARGEMENT PDF ─────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!analysis || !consultationData) return;
    setPdfLoading(true);
    try {
      const imagePath = consultationData.image_path;
      let imageFile = null;
      if (imagePath) {
        const imgRes = await fetch(`http://localhost:8000/${imagePath}`);
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          imageFile = new File([blob], consultationData.image_path?.split("/").pop() || "image.jpg", { type: blob.type || "image/jpeg" });
        }
      }
      if (!imageFile) throw new Error("Image non disponible.");

      const probs = (() => {
        if (!analysis.probabilities) return {};
        if (typeof analysis.probabilities === "string") { try { return JSON.parse(analysis.probabilities); } catch { return {}; } }
        return analysis.probabilities;
      })();

      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("explain_text", explainText || analysis.explain_text || "");
      formData.append("gradcam_image", analysis.gradcam_b64 || "");

      const params = new URLSearchParams({
        model: consultationData.model_key || "chest",
        patient_id: consultationData.patient_name || `PAT-${consultationData.patient_id}`,
        prediction: analysis.prediction,
        confidence: String(analysis.confidence),
        probabilities: JSON.stringify(probs),
        report_id: `MED-${consultationData.id}-${Date.now().toString(36).toUpperCase()}`,
      });

      const res = await fetch(`${API}/report?${params}`, { method: "POST", body: formData });
      if (!res.ok) { const err = await res.text(); throw new Error(`Erreur PDF: ${err}`); }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport_${consultationData.patient_name?.replace(/\s+/g, "_") || "patient"}_${consultationData.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erreur lors de la génération du PDF : " + e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── MESSAGE ────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedConsultation) return;
    try {
      await fetch(`${API}/consultations/${selectedConsultation}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim(), msg_type: "text" }),
      });
      setMsgInput("");
      await fetchConsultationDetails(selectedConsultation);
    } catch (e) {}
  };

  // ── COMPUTED ───────────────────────────────────────────────────
  const stats = useMemo(() => ({
    queue: queue.length,
    critical: queue.filter(c => c.urgency === "critical").length,
    active: assigned.filter(c => c.status === "accepted" || c.status === "analyzed").length,
    analyzed: assigned.filter(c => c.status === "analyzed").length,
    closed: assigned.filter(c => c.status === "closed").length,
    totalPatients: assigned.length + queue.length,
  }), [queue, assigned]);

  const filteredQueue = useMemo(() => queue.filter(c => {
    const mU = filterUrgency === "all" || c.urgency === filterUrgency;
    const mS = !searchQuery || c.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) || String(c.id).includes(searchQuery);
    return mU && mS;
  }), [queue, filterUrgency, searchQuery]);

  const userDomains = user?.domains || [];
  const model = consultationData ? MODEL_CONFIG[consultationData.model_key] || MODEL_CONFIG.chest : null;
  const canMessage = consultationData && (consultationData.status === "accepted" || consultationData.status === "analyzed");

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F8FAFC 0%,#F1F5F9 50%,#E2E8F0 100%)", fontFamily: "'DM Sans','Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.12)} }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes typing { 0%,100%{opacity:.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-4px)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        *{scrollbar-width:thin;scrollbar-color:#CBD5E1 transparent}
        *::-webkit-scrollbar{width:6px} *::-webkit-scrollbar-track{background:transparent} *::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
      `}</style>

      {/* ══════ HEADER ══════ */}
      <header style={{
        background: "linear-gradient(135deg,#0A2647 0%,#144272 50%,#205295 100%)",
        padding: "16px 32px", color: "white", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 20px rgba(10,38,71,0.3)",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          {/* Logo + Doctor */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,.15)", border: "2px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🏥</div>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-.02em" }}>Med<span style={{ color: "#38BDF8" }}>AI</span></div>
                <div style={{ fontSize: "0.58rem", opacity: .5, letterSpacing: ".1em", fontFamily: "monospace" }}>MÉDECIN</div>
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.2)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#38BDF8,#0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700 }}>
                {user?.full_name?.charAt(0)?.toUpperCase() || "M"}
              </div>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>Dr. {user?.full_name || "Médecin"}</div>
                <div style={{ fontSize: "0.68rem", opacity: .65 }}>{user?.specialty || "Médecin"} · {userDomains.map(d => MODEL_CONFIG[d]?.icon).filter(Boolean).join(" ")}</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[
              { key: "dashboard",     icon: "📊", label: "Vue d'ensemble" },
              { key: "consultations", icon: "👥", label: "Consultations",  badge: stats.queue },
              { key: "messages",      icon: "💬", label: "Messages" },
              { key: "analytics",     icon: "📈", label: "Statistiques" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveView(tab.key)} style={{
                padding: "8px 16px", borderRadius: 10, border: "none",
                background: activeView === tab.key ? "rgba(255,255,255,.2)" : "transparent",
                color: "white", fontSize: "0.82rem", fontWeight: activeView === tab.key ? 700 : 500,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .2s",
              }}>
                {tab.icon} {tab.label}
                {tab.badge > 0 && <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: "0.68rem", fontWeight: 800, background: "#EF4444", color: "white" }}>{tab.badge}</span>}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Notifs */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "white", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                🔔
                {unreadCount > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, background: "#EF4444", color: "white", fontSize: "0.62rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid #0A2647", animation: "pulse 2s infinite" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>
              {showNotifications && (
                <div style={{ position: "absolute", top: 50, right: 0, width: 360, maxHeight: 400, background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 20px 40px rgba(0,0,0,.15)", overflow: "hidden", animation: "fadeUp .2s ease", zIndex: 200 }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", background: "#FAFBFC", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 800, color: "#0F172A", fontSize: ".88rem" }}>Notifications</span>
                    {unreadCount > 0 && <button style={{ background: "none", border: "none", color: "#3B82F6", fontSize: ".75rem", fontWeight: 600, cursor: "pointer" }}>Tout lire</button>}
                  </div>
                  <div style={{ overflowY: "auto", maxHeight: 340 }}>
                    {notifications.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Aucune notification</div> : notifications.slice(0, 10).map(n => (
                      <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid #F8FAFC", cursor: "pointer", background: n.is_read ? "white" : "#F0F9FF" }}
                        onClick={() => { try { const d = typeof n.data === "string" ? JSON.parse(n.data) : n.data; if (d.consultation_id) { setSelectedConsultation(d.consultation_id); setActiveView("messages"); } } catch {} setShowNotifications(false); }}>
                        <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#0F172A" }}>{n.title}</div>
                        <div style={{ fontSize: ".73rem", color: "#64748B" }}>{n.message?.slice(0, 60)}…</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={profileRef} style={{ position: "relative" }}>
              <button onClick={() => setShowProfile(!showProfile)} style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#38BDF8,#0EA5E9)", border: "2px solid rgba(255,255,255,.3)", color: "white", fontSize: ".9rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {user?.full_name?.charAt(0)?.toUpperCase() || "M"}
              </button>
              {showProfile && (
                <div style={{ position: "absolute", top: 50, right: 0, width: 260, background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 20px 40px rgba(0,0,0,.15)", overflow: "hidden", animation: "fadeUp .2s ease", zIndex: 200 }}>
                  <div style={{ padding: "18px", background: "linear-gradient(135deg,#0A2647,#205295)", color: "white" }}>
                    <div style={{ fontSize: ".95rem", fontWeight: 700 }}>Dr. {user?.full_name}</div>
                    <div style={{ fontSize: ".78rem", opacity: .7, marginTop: 2 }}>{user?.specialty}</div>
                    <div style={{ fontSize: ".65rem", opacity: .5, fontFamily: "monospace", marginTop: 4 }}>@{user?.username}</div>
                  </div>
                  <div style={{ padding: "10px" }}>
                    {userDomains.map(d => { const m = MODEL_CONFIG[d]; return m ? <div key={d} style={{ padding: "7px 10px", borderRadius: 8, background: m.bg, marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}><span>{m.icon}</span><span style={{ fontSize: ".78rem", fontWeight: 600, color: m.color }}>{m.label}</span></div> : null; })}
                    <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} style={{ width: "100%", padding: "9px", background: "#FEF2F2", border: "none", borderRadius: 10, color: "#EF4444", fontSize: ".82rem", fontWeight: 600, cursor: "pointer", marginTop: 4 }}>🚪 Se déconnecter</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════ CONTENT ══════ */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>

        {/* ── VUE: DASHBOARD ── */}
        {activeView === "dashboard" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            {stats.critical > 0 && (
              <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,#FEF2F2,#FFF1F2)", border: "1.5px solid #FCA5A5", borderRadius: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "1.4rem" }}>🚨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".9rem", fontWeight: 800, color: "#991B1B" }}>{stats.critical} cas critique{stats.critical > 1 ? "s" : ""} en attente !</div>
                  <div style={{ fontSize: ".78rem", color: "#B91C1C" }}>Intervention immédiate requise.</div>
                </div>
                <button onClick={() => { setFilterUrgency("critical"); setActiveView("consultations"); }} style={{ padding: "8px 16px", background: "#DC2626", border: "none", borderRadius: 10, color: "white", fontSize: ".8rem", fontWeight: 700, cursor: "pointer" }}>Voir →</button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard icon="👥" label="Total Patients"  value={stats.totalPatients} color="#0F172A" bg="#F1F5F9" trend={12} />
              <StatCard icon="⏳" label="En Attente"      value={stats.queue}          color="#F59E0B" bg="#FFFBEB" onClick={() => setActiveView("consultations")} />
              <StatCard icon="✅" label="En Cours"        value={stats.active}         color="#3B82F6" bg="#EFF6FF" subtitle={`${stats.analyzed} analysées`} />
              <StatCard icon="🔒" label="Terminées"       value={stats.closed}         color="#10B981" bg="#ECFDF5" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "🔬", label: "Analyse Libre", desc: "Classifier une image", color: "#7C3AED", bg: "#F5F3FF", action: () => navigate("/classification") },
                { icon: "📋", label: "File d'Attente", desc: "Gérer les demandes", color: "#F59E0B", bg: "#FFFBEB", action: () => setActiveView("consultations"), count: stats.queue },
                { icon: "💬", label: "Messages", desc: "Communiquer", color: "#3B82F6", bg: "#EFF6FF", action: () => setActiveView("messages") },
                { icon: "📈", label: "Statistiques", desc: "Vue globale", color: "#10B981", bg: "#ECFDF5", action: () => setActiveView("analytics") },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{ background: "white", borderRadius: 18, padding: "18px", border: "1px solid #F1F5F9", cursor: "pointer", textAlign: "left", transition: "all .3s", display: "flex", alignItems: "center", gap: 14, position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}
                  onMouseEnter={e => Object.assign(e.currentTarget.style, { transform: "translateY(-4px)", boxShadow: `0 12px 24px ${a.color}15`, borderColor: a.color })}
                  onMouseLeave={e => Object.assign(e.currentTarget.style, { transform: "translateY(0)", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderColor: "#F1F5F9" })}
                >
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>{a.label}</div>
                    <div style={{ fontSize: ".75rem", color: "#94A3B8" }}>{a.desc}</div>
                  </div>
                  {a.count > 0 && <span style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 20, fontSize: ".7rem", fontWeight: 700, background: a.color, color: "white" }}>{a.count}</span>}
                </button>
              ))}
            </div>

            {/* Recent consultations */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #F1F5F9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A" }}>📋 Consultations récentes</h2>
                <button onClick={() => setActiveView("consultations")} style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 10, padding: "6px 14px", color: "#3B82F6", fontSize: ".8rem", fontWeight: 600, cursor: "pointer" }}>
                  Voir tout →
                </button>
              </div>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {loading ? (
                  <div style={{ textAlign: "center", padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <Spinner size={32} />
                    <div style={{ color: "#94A3B8" }}>Chargement…</div>
                  </div>
                ) : [...assigned.slice(0, 3), ...queue.slice(0, 2)].slice(0, 5).length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
                    <div>Aucune consultation</div>
                  </div>
                ) : (
                  [...assigned.slice(0, 3), ...queue.slice(0, 2)].slice(0, 5).map(c => (
                    <ConsultationCard key={c.id} consultation={c} onClick={() => { setSelectedConsultation(c.id); setActiveView("messages"); }} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── VUE: CONSULTATIONS ── */}
        {activeView === "consultations" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>👥 File d'attente</h1>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {["all", "critical", "urgent"].map(f => (
                  <button key={f} onClick={() => setFilterUrgency(f)} style={{
                    padding: "8px 16px", borderRadius: 10, border: "1px solid",
                    borderColor: filterUrgency === f ? "transparent" : "#E2E8F0",
                    background: filterUrgency === f ? (f === "critical" ? "#DC2626" : f === "urgent" ? "#EA580C" : "#0F172A") : "white",
                    color: filterUrgency === f ? "white" : "#64748B",
                    fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
                  }}>
                    {f === "all" ? "Tous" : f === "critical" ? "Critiques" : "Urgents"}
                    ({f === "all" ? queue.length : queue.filter(c => c.urgency === f).length})
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <input placeholder="🔍 Rechercher…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: ".85rem", width: 240, outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredQueue.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
                  <div style={{ color: "#64748B" }}>Aucune consultation en attente</div>
                </div>
              ) : filteredQueue.map(c => (
                <div key={c.id} style={{ background: "white", borderRadius: 16, padding: "18px 20px", border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ConsultationCard consultation={c} onClick={() => { setSelectedConsultation(c.id); setActiveView("messages"); }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); handleAccept(c.id); }} disabled={actionLoading === `accept-${c.id}`} style={{ padding: "8px 16px", background: actionLoading === `accept-${c.id}` ? "#E2E8F0" : "linear-gradient(135deg,#10B981,#059669)", border: "none", borderRadius: 10, color: "white", fontSize: ".8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      {actionLoading === `accept-${c.id}` ? <Spinner size={14} color="white" /> : "✅ Accepter"}
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleReject(c.id); }} disabled={actionLoading === `reject-${c.id}`} style={{ padding: "8px 16px", border: "1.5px solid #FCA5A5", borderRadius: 10, color: "#EF4444", fontSize: ".8rem", fontWeight: 600, cursor: "pointer", background: "white" }}>
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Assigned */}
            {assigned.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>📂 Mes dossiers actifs</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {assigned.filter(c => c.status !== "closed").map(c => (
                    <ConsultationCard key={c.id} consultation={c} onClick={() => { setSelectedConsultation(c.id); setActiveView("messages"); }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VUE: MESSAGES + ANALYSE ── */}
        {activeView === "messages" && (
          <div style={{ animation: "fadeUp .4s ease", display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
            {/* Messages Panel */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              {!selectedConsultation ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94A3B8", padding: 40 }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: ".9rem", fontWeight: 600 }}>Sélectionnez une consultation</div>
                  <div style={{ fontSize: ".8rem", marginTop: 4, textAlign: "center" }}>depuis la liste des consultations ou depuis le tableau de bord</div>
                  <button onClick={() => setActiveView("consultations")} style={{ marginTop: 16, padding: "8px 20px", background: "#0F172A", border: "none", borderRadius: 10, color: "white", fontSize: ".82rem", fontWeight: 600, cursor: "pointer" }}>
                    Voir les consultations
                  </button>
                </div>
              ) : consultationData ? (
                <>
                  {/* Header */}
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: model?.gradient || "linear-gradient(135deg,#64748B,#475569)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      {model?.icon || "🏥"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: ".95rem", fontWeight: 700, color: "#0F172A" }}>
                        {consultationData.patient_name}
                        <span style={{ fontSize: ".7rem", color: "#94A3B8", marginLeft: 8 }}>#{consultationData.id}</span>
                      </div>
                      <div style={{ fontSize: ".73rem", color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: STATUS_CONFIG[consultationData.status]?.color, fontWeight: 700 }}>{STATUS_CONFIG[consultationData.status]?.icon} {STATUS_CONFIG[consultationData.status]?.label}</span>
                        <span>·</span><span>{model?.label}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => navigate(`/video/${consultationData.id}`)} style={{ padding: "7px 14px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 9, color: "#0369A1", fontSize: ".75rem", fontWeight: 700, cursor: "pointer" }}>
                        📹 Vidéo
                      </button>
                      {(consultationData.status === "analyzed" || consultationData.status === "accepted") && (
                        <button onClick={() => setShowCloseModal(true)} style={{ padding: "7px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9, color: "#6B7280", fontSize: ".75rem", fontWeight: 700, cursor: "pointer" }}>
                          🔒 Clôturer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes patient */}
                  {consultationData.patient_notes && (
                    <div style={{ padding: "10px 20px", background: "#FFFBEB", borderBottom: "1px solid #FDE68A", fontSize: ".78rem", color: "#92400E", flexShrink: 0 }}>
                      📋 <strong>Notes patient :</strong> {consultationData.patient_notes}
                    </div>
                  )}

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>💬</div>
                        <div style={{ fontSize: ".85rem" }}>Aucun message</div>
                        <div style={{ fontSize: ".75rem", marginTop: 4 }}>Commencez la discussion avec le patient</div>
                      </div>
                    ) : messages.map(m => <MessageBubble key={m.id} message={m} isDoctor={true} />)}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  {canMessage ? (
                    <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 8, flexShrink: 0 }}>
                      <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                        placeholder="Écrire un message au patient…"
                        style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: ".85rem", outline: "none", background: "#F8FAFC" }}
                        onFocus={e => e.target.style.borderColor = "#0F172A"} onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                      />
                      <button onClick={handleSendMessage} disabled={!msgInput.trim()} style={{ width: 42, height: 42, borderRadius: 12, background: msgInput.trim() ? "#0F172A" : "#E2E8F0", border: "none", color: msgInput.trim() ? "white" : "#94A3B8", fontSize: "1rem", cursor: msgInput.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ➤
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: "10px 20px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", fontSize: ".78rem", color: "#94A3B8", textAlign: "center", flexShrink: 0 }}>
                      💬 Messages disponibles après acceptation de la consultation
                    </div>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center", color: "#94A3B8", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <Spinner />
                    <span>Chargement…</span>
                  </div>
                </div>
              )}
            </div>

            {/* ══ ANALYSIS PANEL ══ */}
            <AnalysisPanel
              analysis={analysis}
              consultationData={consultationData}
              model={model}
              analysisLoading={analysisLoading}
              onRunAnalysis={handleRunAnalysis}
              onCloseConsultation={() => setShowCloseModal(true)}
              onDownloadPDF={handleDownloadPDF}
              pdfLoading={pdfLoading}
              closeLoading={closeLoading}
              explainText={explainText}
              explaining={explaining}
              explainError={explainError}
              showGradcam={showGradcam}
              onToggleGradcam={() => setShowGradcam(!showGradcam)}
            />
          </div>
        )}

        {/* ── VUE: ANALYTICS ── */}
        {activeView === "analytics" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", marginBottom: 24 }}>📈 Statistiques</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { l: "Total consultations",    v: assigned.length + queue.length, ic: "📋", color: "#0F172A" },
                { l: "Taux d'analyse",          v: assigned.length ? `${Math.round((stats.analyzed / assigned.length) * 100)}%` : "0%", ic: "🧬", color: "#059669" },
                { l: "En cours",                v: stats.active,                    ic: "⚡", color: "#3B82F6" },
                { l: "Cas critiques traités",   v: assigned.filter(c => c.urgency === "critical").length, ic: "🚨", color: "#DC2626" },
                { l: "Consultations terminées", v: stats.closed,                    ic: "🔒", color: "#6B7280" },
                { l: "Domaines couverts",        v: userDomains.length,              ic: "🏥", color: "#7C3AED" },
              ].map(s => (
                <div key={s.l} style={{ background: "white", borderRadius: 16, padding: "20px", border: "1px solid #F1F5F9", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: "1.4rem" }}>{s.ic}</span>
                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.v}</span>
                  </div>
                  <div style={{ fontSize: ".8rem", color: "#64748B", fontWeight: 500 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Domaines */}
            <div style={{ background: "white", borderRadius: 20, padding: "24px", border: "1px solid #F1F5F9", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize: ".95rem", fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>🏥 Mes domaines de spécialité</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                {userDomains.map(d => {
                  const m = MODEL_CONFIG[d];
                  if (!m) return null;
                  const count = assigned.filter(c => c.model_key === d).length;
                  return (
                    <div key={d} style={{ padding: "16px", borderRadius: 14, background: m.bg, border: `1px solid ${m.color}30`, display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: m.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>{m.icon}</div>
                      <div>
                        <div style={{ fontSize: ".88rem", fontWeight: 700, color: m.color }}>{m.label}</div>
                        <div style={{ fontSize: ".75rem", color: "#64748B", marginTop: 2 }}>{count} consultation{count !== 1 ? "s" : ""} traitée{count !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL CLÔTURE ══ */}
      {showCloseModal && (
        <CloseModal
          onConfirm={handleCloseConsultation}
          onCancel={() => setShowCloseModal(false)}
          loading={closeLoading}
        />
      )}
    </div>
  );
}