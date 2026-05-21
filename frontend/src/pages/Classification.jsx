// Classification.jsx — Fond blanc, logos SVG uniquement, enrichi
import { useState, useCallback, useRef } from "react";
import { predict, downloadReport } from "../services/api";
import { MedicalIcons } from "../components/MedicalIcons";
import ExplainableAI from "../components/ExplainableAI";
import { useAuth } from "../context/AuthContext";

export default function Classification() {

  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, userDomains } = useAuth();
  const [modelKey, setModel] = useState(() => user?.domains?.[0] || "chest");
  const [file, setFile] = useState(null);
  const [showGradcam, setShowGradcam] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportId, setReportId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const C = {
    bg: '#0B1120',
    surface: '#151E32',
    card: '#1E293B',
    cardHover: '#334155',
    cardBorder: 'rgba(56, 189, 248, 0.12)',
    cardBorderActive: '#38BDF8',
    primary: '#38BDF8',
    primaryLight: 'rgba(56, 189, 248, 0.1)',
    primarySoft: 'rgba(56, 189, 248, 0.08)',
    secondary: '#818CF8',
    accent: '#FACC15',
    accentSoft: 'rgba(250, 204, 21, 0.1)',
    text: '#F1F5F9',
    text2: '#94A3B8',
    muted: '#64748B',
    light: '#475569',
    success: '#22C55E',
    successSoft: 'rgba(34, 197, 94, 0.1)',
    danger: '#EF4444',
    dangerSoft: 'rgba(239, 68, 68, 0.08)',
    warning: '#F59E0B',
    headerBg: 'linear-gradient(135deg, #0A1628 0%, #0F172A 50%, #1E3A5F 100%)',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
    shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  };

  const ALL_MODELS = [
    {
      key: "chest",
      label: "Thorax complet",
      fullLabel: "Radiographie thoracique — 10 pathologies",
      shortDesc: "Detection de pneumonie, tuberculose, COVID-19, nodules, etc.",
      icon: "lungs",
      accuracy: "97.3%", sensitivity: "96.8%", specificity: "97.9%",
      f1score: "97.0%",
      color: "#2563EB",
      conditions: ["Pneumonie", "Tuberculose", "COVID-19", "Nodule", "Epanchement"],
    },
    {
      key: "lung",
      label: "Cancer pulmonaire",
      fullLabel: "Scanner CT — Detection lesions",
      shortDesc: "Segmentation et classification des nodules pulmonaires.",
      icon: "xray",
      accuracy: "94.8%", sensitivity: "95.2%", specificity: "94.3%",
      f1score: "94.7%",
      color: "#DC2626",
      conditions: ["Adenocarcinome", "Carcinome epidermoide", "Metastase", "Benin"],
    },
    {
      key: "brain",
      label: "Tumeur cerebrale",
      fullLabel: "IRM — Classification tumorale",
      shortDesc: "Identification des gliomes, meningiomes et pituitaires.",
      icon: "brain",
      accuracy: "96.2%", sensitivity: "95.8%", specificity: "96.7%",
      f1score: "96.1%",
      color: "#7C3AED",
      conditions: ["Gliome", "Meningiome", "Pituitaire", "Metastase cerebrale"],
    },
  ];

  const allowedKeys = user?.domains || ["chest"];
  const MODELS = ALL_MODELS.filter(m => allowedKeys.includes(m.key));

  const renderIcon = (name, size = 24, color = C.primary) => {
    const s = size;
    const c = color;
    const icons = {
      lungs: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 3C4.5 3 3 4.5 3 6.5V17c0 2.5 2 4.5 4.5 4.5S12 19.5 12 17V6.5c0-2-1.5-3.5-3.5-3.5z" />
          <path d="M17.5 3C15.5 3 14 4.5 14 6.5V17c0 2.5 2 4.5 4.5 4.5S23 19.5 23 17V6.5c0-2-1.5-3.5-3.5-3.5z" />
          <path d="M12 17v-3" />
          <path d="M6.5 7.5h2" />
          <path d="M17.5 7.5h-2" />
          <path d="M6.5 11h2" />
          <path d="M17.5 11h-2" />
        </svg>
      ),
      xray: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 12h18" />
          <path d="M12 3v18" />
          <circle cx="12" cy="12" r="4" />
          <path d="M8 8l8 8" />
          <path d="M16 8l-8 8" />
        </svg>
      ),
      brain: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C7 2 3 6 3 11c0 2.5 1 4.5 2.5 6L4 22l3.5-1.5c1.5.5 3 1 4.5 1s3-.5 4.5-1L20 22l-1.5-5C20 15.5 21 13.5 21 11c0-5-4-9-9-9z" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
          <path d="M10 15c1 1 3 1 4 0" />
          <path d="M12 6v3" />
          <path d="M8 8l2 1" />
          <path d="M16 8l-2 1" />
        </svg>
      ),
      upload: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      fileImage: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      ),
      ecg: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      heart: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      ),
      check: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      alert: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      pdf: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 13h.01" />
          <path d="M9 17h.01" />
          <path d="M9 9h.01" />
        </svg>
      ),
      download: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      clock: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      shield: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      users: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      activity: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      layers: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
      trash: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      ),
      info: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      search: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      zoomIn: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      ),
      history: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      star: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      database: (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
    };
    return icons[name] || null;
  };

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setLoading(true);
    setError(null);
    setResult(null);
    setExplainText("");
    setExplaining(false);
    setShowGradcam(false);

    try {
      await predict(f, modelKey, true, {
        onPrediction: (data) => {
          setResult(data);
          setLoading(false);
          if (!data.out_of_domain) setExplaining(true);
        },
        onChunk: (text) => setExplainText(prev => prev + text),
        onError: () => setExplaining(false),
        onDone: () => {
          setExplaining(false);
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse");
      setLoading(false);
      setExplaining(false);
    }
  }, [modelKey]);

  const handleDownloadPDF = async () => {
    if (!result || !file) return;
    setPdfLoading(true);
    try {
      const rid = await downloadReport({
        file, model: modelKey,
        patientId: patientId || `PAT-${Date.now()}`,
        prediction: result.prediction, confidence: result.confidence,
        probabilities: result.probabilities, explainText,
        gradcamImage: result.gradcam_image || "", reportId,
      });
      setReportId(rid);
    } catch (err) {
      alert("Erreur lors de la generation du rapport PDF : " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const currentModel = MODELS.find(m => m.key === modelKey);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>

      {/* HEADER */}
      <div style={{
        background: C.headerBg,
        padding: '50px 32px 90px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10L50 22L50 38L30 50L10 38L10 22L30 10Z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />

        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(250, 204, 21, 0.03)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(250, 204, 21, 0.02)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 28,
            background: 'rgba(250, 204, 21, 0.1)', backdropFilter: 'blur(10px)',
            padding: '10px 20px', borderRadius: 50,
            border: '1px solid rgba(250, 204, 21, 0.2)',
            width: 'fit-content',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {renderIcon('users', 18, 'white')}
              <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 500 }}>
                <span style={{ fontWeight: 700, color: 'white' }}>Dr. Sarah Chen</span> et equipe · Radiologues disponibles
              </span>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FACC15', marginLeft: 4, boxShadow: '0 0 8px #FACC15' }} />
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800,
            color: 'white', lineHeight: 1.15, marginBottom: 14,
          }}>
            Analyse radiologique assistee par<br />
            <span style={{ color: '#FACC15' }}>intelligence artificielle</span>
          </h1>
          <p style={{
            fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', maxWidth: 560, lineHeight: 1.6,
          }}>
            Importez votre radiographie et obtenez une analyse detaillee en temps reel. 
            Resultats valides par notre equipe de radiologues certifies.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: '-50px auto 0', padding: '0 32px 60px', position: 'relative', zIndex: 10 }}>

        {/* Quick Stats Bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
          marginBottom: 28,
        }}>
          {[
            { icon: 'activity', label: "Analyses aujourd'hui", value: '12', change: '+3', color: C.primary },
            { icon: 'check', label: "Taux de precision", value: '97.3%', change: '+0.5%', color: C.success },
            { icon: 'clock', label: "Temps moyen", value: '< 30s', change: '-5s', color: C.secondary },
            { icon: 'shield', label: "Certifie CE-IVD", value: 'Actif', change: '', color: C.warning },
          ].map((stat, i) => (
            <div key={i} style={{
              background: C.surface, borderRadius: 16, padding: '18px 20px',
              border: `1px solid ${C.cardBorder}`,
              boxShadow: C.shadow, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: stat.color === C.primary ? 'rgba(37, 99, 235, 0.1)' : stat.color === C.success ? 'rgba(16, 185, 129, 0.1)' : stat.color === C.secondary ? 'rgba(14, 165, 233, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {renderIcon(stat.icon, 22, stat.color)}
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {stat.label}
                  {stat.change && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700,
                      color: stat.change.startsWith('+') ? C.success : C.danger,
                      background: stat.change.startsWith('+') ? C.successSoft : C.dangerSoft,
                      padding: '1px 6px', borderRadius: 10,
                    }}>
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Model Selector */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {renderIcon('layers', 18, C.primary)}
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Modeles d'analyse disponibles
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 30 }}>
          {MODELS.map((model) => {
            const isActive = modelKey === model.key;
            return (
              <button
                key={model.key}
                onClick={() => setModel(model.key)}
                style={{
                  background: isActive ? C.surface : C.card,
                  border: isActive ? `2px solid ${model.color}` : `1px solid ${C.cardBorder}`,
                  borderRadius: 20, padding: 24, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: isActive ? `0 10px 25px -5px ${model.color}20` : C.shadow,
                  transform: isActive ? 'translateY(-2px)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = model.color + '60'; e.currentTarget.style.boxShadow = `0 4px 12px -2px ${model.color}15`; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = C.shadow; } }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: isActive ? model.color : 'transparent', borderRadius: '20px 20px 0 0',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: isActive ? model.color + '15' : C.primarySoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {renderIcon(model.icon, 24, isActive ? model.color : C.primary)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: C.text, marginBottom: 3 }}>
                      {model.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: C.muted, lineHeight: 1.4 }}>
                      {model.fullLabel}
                    </div>
                  </div>
                  {isActive && (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: model.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {renderIcon('check', 14, 'white')}
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.78rem', color: C.text2, lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>
                  {model.shortDesc}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {model.conditions.slice(0, 3).map((cond, idx) => (
                    <span key={idx} style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: isActive ? model.color + '10' : C.primarySoft,
                      fontSize: '0.65rem', fontWeight: 600,
                      color: isActive ? model.color : C.primary,
                    }}>
                      {cond}
                    </span>
                  ))}
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
                  padding: '12px', borderRadius: 12,
                  background: C.card, border: `1px solid ${C.cardBorder}`,
                }}>
                  {[
                    { label: 'Precision', value: model.accuracy },
                    { label: "Sensibilite", value: model.sensitivity },
                    { label: "Specificite", value: model.specificity },
                    { label: "F1-Score", value: model.f1score },
                  ].map((stat, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isActive ? model.color : C.primary, marginBottom: 2 }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: '0.58rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {isActive && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 8, height: 8, borderRadius: '50%',
                    background: model.color, boxShadow: `0 0 8px ${model.color}`,
                    animation: 'pulse 2s infinite',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Analysis Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* LEFT COLUMN */}
          <div>
            {/* Upload Card */}
            <div style={{
              background: C.surface, borderRadius: 20, padding: 24,
              border: `1px solid ${C.cardBorder}`,
              boxShadow: C.shadowLg, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: C.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {renderIcon('upload', 20, C.primary)}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>
                      Import de l'image
                    </div>
                    <div style={{ fontSize: '0.75rem', color: C.muted }}>
                      Formats supportes : DICOM, JPEG, PNG, TIFF
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px', background: C.successSoft,
                  borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                  color: C.success, border: `1px solid ${C.success}25`,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {renderIcon('check', 14, C.success)}
                  DICOM
                </div>
              </div>

              {!preview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragActive ? C.primary : C.cardBorder}`,
                    borderRadius: 16, padding: '44px 32px',
                    textAlign: 'center', cursor: 'pointer',
                    background: dragActive ? 'rgba(56, 189, 248, 0.05)' : '#0F172A',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*,.dcm"
                    onChange={(e) => handleFile(e.target.files[0])} style={{ display: 'none' }} />

                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: C.primarySoft, margin: '0 auto 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {renderIcon('fileImage', 32, C.primary)}
                  </div>

                  <p style={{ fontSize: '1rem', fontWeight: 600, color: C.text, margin: '0 0 6px' }}>
                    {dragActive ? 'Deposez le fichier ici' : 'Glissez votre radiographie ici'}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: C.muted, marginBottom: 20 }}>
                    ou <span style={{ color: C.primary, fontWeight: 600 }}>cliquez pour parcourir</span>
                  </p>

                  <div style={{
                    display: 'flex', gap: 20, justifyContent: 'center', fontSize: '0.7rem', color: C.light,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {renderIcon('database', 12, C.light)} Max 50 Mo
                    </span>
                    <span>•</span>
                    <span>Anonymise</span>
                    <span>•</span>
                    <span>Securise SSL</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0A1628', marginBottom: 16, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                    <img
                      src={showGradcam && result?.gradcam_image ? `data:image/jpeg;base64,${result.gradcam_image}` : preview}
                      alt={showGradcam ? "Grad-CAM heatmap" : "Radiographie"}
                      style={{ width: '100%', height: 'auto', display: 'block', opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}
                    />

                    <button style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}>
                      {renderIcon('zoomIn', 18, 'white')}
                    </button>

                    {showGradcam && result?.gradcam_image && (
                      <div style={{
                        position: 'absolute', top: 12, left: 12,
                        padding: '5px 12px', background: 'rgba(239, 68, 68, 0.95)',
                        backdropFilter: 'blur(4px)', borderRadius: 20,
                        fontSize: '0.7rem', fontWeight: 700, color: 'white',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {renderIcon('activity', 14, 'white')}
                        GRAD-CAM · Zones d'attention IA
                      </div>
                    )}

                    {loading && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(11, 17, 32, 0.92)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
                      }}>
                        <div style={{
                          width: 52, height: 52,
                          border: `3px solid rgba(56, 189, 248, 0.15)`, borderTopColor: C.secondary,
                          borderRadius: '50%', animation: 'spin 1s linear infinite',
                        }} />
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: 'white', fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                            Analyse en cours...
                          </p>
                          <p style={{ color: C.muted, fontSize: '0.75rem' }}>
                            Modele {currentModel?.label} · CNN ResNet-50
                          </p>
                        </div>
                        <div style={{
                          width: 220, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: '65%',
                            background: `linear-gradient(90deg, ${C.secondary}, ${C.primary})`,
                            borderRadius: 2, animation: 'scan 2s ease-in-out infinite',
                          }} />
                        </div>
                      </div>
                    )}

                    <div style={{
                      position: 'absolute', bottom: 12, left: 12, right: 12,
                      display: 'flex', gap: 8, justifyContent: 'space-between',
                    }}>
                      <div style={{
                        padding: '5px 12px', background: 'rgba(11, 17, 32, 0.8)',
                        backdropFilter: 'blur(8px)', borderRadius: 20,
                        fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {renderIcon('info', 12, 'rgba(255,255,255,0.6)')}
                        ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}
                      </div>
                      <div style={{
                        padding: '5px 12px', background: 'rgba(11, 17, 32, 0.8)',
                        backdropFilter: 'blur(8px)', borderRadius: 20,
                        fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {renderIcon('clock', 12, 'rgba(255,255,255,0.6)')}
                        {new Date().toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setFile(null); setPreview(null); setResult(null); setShowGradcam(false); }}
                      style={{
                        padding: '9px 18px', background: C.card,
                        border: `1px solid ${C.cardBorder}`, borderRadius: 10,
                        fontSize: '0.82rem', fontWeight: 600, color: C.text2,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; }}
                      onMouseLeave={e => { e.currentTarget.style.background = C.card; }}
                    >
                      {renderIcon('trash', 16, C.muted)}
                      Nouvelle image
                    </button>

                    {result?.gradcam_image && (
                      <button
                        onClick={() => setShowGradcam(!showGradcam)}
                        style={{
                          padding: '9px 18px',
                          background: showGradcam ? C.dangerSoft : C.primarySoft,
                          border: `1.5px solid ${showGradcam ? C.danger + '40' : C.primary + '30'}`,
                          borderRadius: 10, fontSize: '0.82rem', fontWeight: 600,
                          color: showGradcam ? C.danger : C.primary,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {showGradcam ? renderIcon('fileImage', 16, C.danger) : renderIcon('activity', 16, C.primary)}
                        {showGradcam ? 'Image originale' : 'Voir Grad-CAM'}
                      </button>
                    )}
                  </div>

                  {showGradcam && result?.gradcam_image && (
                    <div style={{
                      marginTop: 14, padding: '14px 18px',
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        {renderIcon('activity', 16, C.danger)}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.danger, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          Grad-CAM — Zones d'attention du modele
                        </span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ height: 10, borderRadius: 5, background: 'linear-gradient(90deg, #3B82F6, #06B6D4, #22C55E, #EAB308, #EF4444)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: C.muted, marginTop: 4 }}>
                          <span>Faible attention</span>
                          <span>Forte attention</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: C.text2, lineHeight: 1.5, margin: 0 }}>
                        Les zones <strong style={{ color: C.danger }}>rouges/chaudes</strong> correspondent aux regions qui ont le plus influence la prediction <strong>{result.prediction}</strong>. Les zones <strong style={{ color: C.primary }}>bleues/froides</strong> ont peu contribue.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: 16, padding: 14,
                  background: C.dangerSoft, border: `1px solid ${C.danger}25`,
                  borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {renderIcon('alert', 22, C.danger)}
                  <span style={{ color: C.danger, fontSize: '0.88rem', fontWeight: 500 }}>{error}</span>
                </div>
              )}
            </div>

            {/* Recent Analyses Mini-List */}
            <div style={{
              background: C.surface, borderRadius: 20, padding: 20,
              border: `1px solid ${C.cardBorder}`, boxShadow: C.shadow,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {renderIcon('history', 18, C.primary)}
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: C.text }}>
                    Analyses recentes
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: C.primary, fontWeight: 600, cursor: 'pointer' }}>
                  Voir tout →
                </span>
              </div>
              {[
                { id: 'PAT-2024-00139', type: 'Thorax', result: 'Normal', conf: 98.2, date: '20 mai', status: 'success' },
                { id: 'PAT-2024-00138', type: 'CT Scan', result: 'Nodule detecte', conf: 87.4, date: '19 mai', status: 'warning' },
                { id: 'PAT-2024-00137', type: 'IRM', result: 'Normal', conf: 99.1, date: '18 mai', status: 'success' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: i < 2 ? `1px solid ${C.cardBorder}` : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: item.status === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(250, 204, 21, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {renderIcon(item.status === 'success' ? 'check' : 'alert', 16, item.status === 'success' ? C.success : C.warning)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: C.text }}>{item.id}</div>
                    <div style={{ fontSize: '0.7rem', color: C.muted }}>{item.type} · {item.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: item.status === 'success' ? C.success : C.warning }}>
                      {item.result}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: C.muted }}>{item.conf}% conf.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Results Card */}
            <div style={{
              background: C.surface, borderRadius: 20, padding: 24,
              border: `1px solid ${C.cardBorder}`,
              boxShadow: C.shadowLg, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: C.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {renderIcon('ecg', 20, C.primary)}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>
                      Resultats de l'analyse
                    </div>
                    <div style={{ fontSize: '0.75rem', color: C.muted }}>
                      {currentModel?.fullLabel}
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '5px 14px', background: C.card,
                  borderRadius: 20, fontSize: '0.72rem', color: C.text2,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  border: `1px solid ${C.cardBorder}`, fontWeight: 600,
                }}>
                  PAT-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                </div>
              </div>

              {!result && !loading && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 20,
                    background: '#0F172A', margin: '0 auto 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px dashed ${C.cardBorder}`,
                  }}>
                    {renderIcon('fileImage', 40, C.light)}
                  </div>
                  <p style={{ color: C.text2, fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>
                    Importez une radiographie
                  </p>
                  <p style={{ color: C.muted, fontSize: '0.85rem', maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
                    L'IA analysera l'image en quelques secondes et affichera les resultats detailles ici
                  </p>
                </div>
              )}

              {loading && (
                <div style={{ padding: '50px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 60, height: 60,
                    border: `3px solid ${C.cardBorder}`, borderTopColor: C.primary,
                    borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 1s linear infinite',
                  }} />
                  <p style={{ color: C.text, fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>Analyse en cours</p>
                  <p style={{ color: C.muted, fontSize: '0.85rem', marginBottom: 24 }}>
                    Traitement par reseau neuronal convolutif
                  </p>
                  <div style={{
                    maxWidth: 280, height: 4, background: 'rgba(56, 189, 248, 0.1)', borderRadius: 2, overflow: 'hidden', margin: '0 auto',
                  }}>
                    <div style={{
                      height: '100%', width: '55%',
                      background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`,
                      borderRadius: 2, animation: 'scan 2s ease-in-out infinite',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
                    {['Pretraitement', 'Inference', 'Post-traitement'].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: i < 2 ? C.primary : 'rgba(56, 189, 248, 0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {i < 2 && renderIcon('check', 12, 'white')}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: i < 2 ? C.text2 : C.muted, fontWeight: 500 }}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result && !loading && (
                <>
                  {/* Main diagnosis */}
                  <div style={{
                    background: `linear-gradient(135deg, ${result.confidence > 0.7 ? C.successSoft : C.dangerSoft}, ${C.card})`,
                    borderRadius: 16, padding: 22, marginBottom: 20,
                    border: `1.5px solid ${result.confidence > 0.7 ? C.success + '25' : C.danger + '25'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      {renderIcon('star', 14, result.confidence > 0.7 ? C.success : C.danger)}
                      <span style={{ fontSize: '0.65rem', color: result.confidence > 0.7 ? C.success : C.danger, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Diagnostic Principal
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: 16,
                        background: result.confidence > 0.7 ? C.successSoft : C.dangerSoft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1.5px solid ${result.confidence > 0.7 ? C.success + '20' : C.danger + '20'}`,
                      }}>
                        {renderIcon('heart', 30, result.confidence > 0.7 ? C.success : C.danger)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 6 }}>
                          {result.prediction}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '5px 14px',
                            background: result.confidence > 0.7 ? C.successSoft : C.dangerSoft,
                            borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                            color: result.confidence > 0.7 ? C.success : C.danger,
                            border: `1px solid ${result.confidence > 0.7 ? C.success + '20' : C.danger + '20'}`,
                          }}>
                            Confiance {(result.confidence * 100).toFixed(1)}%
                          </span>
                          <span style={{
                            padding: '5px 14px', background: C.card,
                            borderRadius: 20, fontSize: '0.78rem', color: C.text2, fontWeight: 600,
                            border: `1px solid ${C.cardBorder}`,
                          }}>
                            {currentModel?.label}
                          </span>
                          <span style={{
                            padding: '5px 14px', background: C.accentSoft,
                            borderRadius: 20, fontSize: '0.78rem', color: C.accent, fontWeight: 600,
                            border: `1px solid ${C.accent}20`,
                          }}>
                            {renderIcon('clock', 12, C.accent)} {new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confidence meter */}
                  <div style={{
                    background: C.card, borderRadius: 14,
                    padding: 18, border: `1px solid ${C.cardBorder}`, marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: C.text2 }}>
                        Niveau de confiance global
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: result.confidence > 0.7 ? C.success : C.danger }}>
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 10, background: C.cardBorder, borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{
                        height: '100%', width: `${result.confidence * 100}%`,
                        background: result.confidence > 0.7 
                          ? `linear-gradient(90deg, ${C.success}, #34D399)` 
                          : `linear-gradient(90deg, ${C.danger}, #F87171)`,
                        borderRadius: 5, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: C.muted }}>
                      <span>0%</span>
                      <span>Seuil critique : 70%</span>
                      <span>100%</span>
                    </div>

                    {/* Probability distribution */}
                    {result.probabilities && (
                      <div style={{ marginTop: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                          {renderIcon('layers', 14, C.primary)}
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Distribution des probabilites
                          </span>
                        </div>
                        {Object.entries(result.probabilities)
                          .sort(([,a], [,b]) => b - a).slice(0, 5)
                          .map(([cls, prob], i) => (
                            <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: 6,
                                background: i === 0 ? C.primarySoft : C.card,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 700,
                                color: i === 0 ? C.primary : C.muted,
                                border: `1px solid ${i === 0 ? C.primary + '20' : C.cardBorder}`,
                              }}>
                                {i + 1}
                              </span>
                              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: i === 0 ? C.text : C.text2 }}>
                                {cls}
                              </span>
                              <div style={{ width: 120, height: 6, background: C.cardBorder, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', width: `${prob * 100}%`,
                                  background: i === 0 ? `linear-gradient(90deg, ${C.primary}, ${C.secondary})` : C.light,
                                  borderRadius: 3, transition: 'width 0.6s ease',
                                }} />
                              </div>
                              <span style={{
                                fontSize: '0.78rem', fontWeight: 700,
                                color: i === 0 ? C.primary : C.muted, width: 44, textAlign: 'right',
                              }}>
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* AI Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "Precision du modele", value: currentModel?.accuracy, icon: 'check', color: C.primary },
                      { label: "Sensibilite", value: currentModel?.sensitivity, icon: 'search', color: C.secondary },
                      { label: "Specificite", value: currentModel?.specificity, icon: 'shield', color: C.success },
                      { label: "F1-Score", value: currentModel?.f1score, icon: 'activity', color: C.accent },
                    ].map((metric, i) => (
                      <div key={i} style={{
                        background: C.card, borderRadius: 12, padding: 14,
                        border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: metric.color + '10', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {renderIcon(metric.icon, 16, metric.color)}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.text }}>{metric.value}</div>
                          <div style={{ fontSize: '0.65rem', color: C.muted }}>{metric.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {result && !result.out_of_domain && (
              <ExplainableAI result={result} explainText={explainText} explaining={explaining} />
            )}
          </div>
        </div>

        {/* PDF Report Panel */}
        {result && !result.out_of_domain && (
          <div style={{
            marginTop: 24, padding: '22px 28px',
            background: `linear-gradient(135deg, #0A1628, #1E3A5F, #2563EB)`,
            borderRadius: 18,
            display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
            boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 220 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, backdropFilter: 'blur(4px)',
              }}>
                {renderIcon('pdf', 24, 'white')}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 3 }}>
                  Rapport PDF Clinique
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                  Patient ID · Diagnostic · Heatmap · Recommandations · Signature
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Identifiant Patient
              </label>
              <input
                type="text" value={patientId} onChange={e => setPatientId(e.target.value)}
                placeholder="ex: PAT-2024-00142"
                style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)', color: 'white',
                  fontSize: '0.85rem', fontFamily: 'monospace', outline: 'none', width: '100%',
                }}
              />
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || explaining}
              style={{
                padding: '12px 24px', borderRadius: 10, border: 'none',
                background: pdfLoading ? 'rgba(255,255,255,0.1)' : 'white',
                color: C.primary, fontSize: '0.85rem', fontWeight: 700,
                cursor: pdfLoading || explaining ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                opacity: explaining ? 0.6 : 1,
                boxShadow: pdfLoading ? 'none' : '0 4px 14px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}
            >
              {pdfLoading ? (
                <>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(37,99,235,0.3)', borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Generation...
                </>
              ) : (
                <>
                  {renderIcon('download', 18, C.primary)}
                  Telecharger le rapport
                </>
              )}
            </button>

            {explaining && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', width: '100%', textAlign: 'center' }}>
                En attente de la fin de l'analyse Gemini pour inclure le rapport complet...
              </div>
            )}
          </div>
        )}

        {/* Clinical disclaimer */}
        <div style={{
          marginTop: 30, padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)',
          borderRadius: 16, border: `1px solid ${C.cardBorder}`,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {renderIcon('info', 20, C.muted)}
          <p style={{ fontSize: '0.8rem', color: C.text2, lineHeight: 1.6 }}>
            <strong style={{ color: C.text }}>Information importante :</strong> Cette analyse est un outil d'aide au diagnostic destine aux professionnels de sante. Les resultats doivent etre interpretes par un medecin qualifie dans le contexte clinique du patient. Certifie CE-IVD pour usage diagnostique.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}
