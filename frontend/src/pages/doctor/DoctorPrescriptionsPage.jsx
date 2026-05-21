// frontend/src/pages/doctor/DoctorPrescriptionsPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:8000/api/v1";

// ICÔNES SVG INLINE
const Icons = {
  Prescription: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Calendar: ({ size = 12, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  FileMedical: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M8.5 6a.5.5 0 0 0-1 0v1.5H6a.5.5 0 0 0 0 1h1.5V10a.5.5 0 0 0 1 0V8.5H10a.5.5 0 0 0 0-1H8.5V6z"/>
      <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
    </svg>
  ),
  User: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Add: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Download: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Trash: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
      <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
  ),
  Send: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
    </svg>
  ),
  Close: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Check: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Signature: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Undo: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6"/>
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
    </svg>
  ),
  Eraser: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Pen: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
  ),
  Type: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
};

// SIGNATURE CANVAS (SANS MODE UPLOAD)
const SignatureCanvas = ({ onSave, onClose, existingSignatureText = "", existingSignatureUrl = "" }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState(existingSignatureUrl ? "draw" : "text");
  const [signatureText, setSignatureText] = useState(existingSignatureText);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#0A2647");
  const [strokeWidth, setStrokeWidth] = useState(2.5);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const CANVAS_W = 600;
  const CANVAS_H = 200;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = "rgba(30, 60, 110, 0.06)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H * 0.7);
    ctx.lineTo(CANVAS_W, CANVAS_H * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);
    saveHistory();
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
      if (newStep === 0) setHasDrawing(false);
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawing(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.closePath();
      saveHistory();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = "rgba(30, 60, 110, 0.06)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H * 0.7);
    ctx.lineTo(CANVAS_W, CANVAS_H * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);
    setHasDrawing(false);
    saveHistory();
  };

  const handleSaveDrawing = () => {
    if (!hasDrawing) { alert("Veuillez signer avant d'enregistrer"); return; }
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const file = new File([blob], `signature_${Date.now()}.png`, { type: "image/png" });
      onSave({ type: "image", file, dataUrl: canvas.toDataURL("image/png") });
    }, "image/png");
  };

  const handleSaveText = () => {
    if (!signatureText.trim()) { alert("Veuillez saisir votre signature"); return; }
    onSave({ type: "text", text: signatureText.trim() });
  };

  const colors = [
    { name: "Bleu marine", value: "#0A2647" },
    { name: "Noir", value: "#1E293B" },
    { name: "Bleu", value: "#2563EB" },
    { name: "Rouge", value: "#DC2626" },
    { name: "Vert", value: "#059669" },
  ];

  const tabs = [
    { id: "draw", label: "Signer a la main", icon: <Icons.Pen size={14} /> },
    { id: "text", label: "Texte manuscrit", icon: <Icons.Type size={14} /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 27, 45, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          background: "#FFFFFF", borderRadius: 28, padding: 0,
          maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid rgba(30, 60, 110, 0.08)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, #FFD700, #D4A500)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#0F1B2D"
            }}>
              <Icons.Signature size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F1B2D", margin: 0 }}>
                Ma signature medicale
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: "2px 0 0" }}>
                Signez a la main ou saisissez votre signature
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 10, background: "#F1F5F9",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#64748B"
          }}>
            <Icons.Close size={18} />
          </button>
        </div>

        <div style={{ padding: "16px 28px 0", display: "flex", gap: 8 }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setMode(tab.id)} style={{
              flex: 1, padding: "10px 16px", borderRadius: 12,
              background: mode === tab.id ? "linear-gradient(135deg, #FFD700, #D4A500)" : "#F1F5F9",
              border: "none", color: mode === tab.id ? "#0F1B2D" : "#64748B",
              fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "20px 28px 28px" }}>
          <AnimatePresence mode="wait">
            {mode === "draw" && (
              <motion.div key="draw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94A3B8" }}>Couleur :</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {colors.map((c) => (
                        <button key={c.value} onClick={() => setStrokeColor(c.value)} title={c.name} style={{
                          width: 28, height: 28, borderRadius: "50%", background: c.value,
                          border: strokeColor === c.value ? "3px solid #FFD700" : "2px solid transparent",
                          cursor: "pointer", boxShadow: strokeColor === c.value ? "0 0 0 2px white, 0 0 0 4px #FFD700" : "none"
                        }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94A3B8" }}>Epaisseur :</span>
                    <input type="range" min="1" max="6" step="0.5" value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} style={{ width: 80 }} />
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569", minWidth: 24 }}>
                      {strokeWidth}px
                    </span>
                  </div>
                </div>

                <div style={{ border: "2px dashed #CBD5E1", borderRadius: 16, overflow: "hidden", background: "#F8FAFC", position: "relative", cursor: "crosshair" }}>
                  <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
                    style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                  />
                  {!hasDrawing && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ fontSize: "0.9rem", color: "#CBD5E1", fontStyle: "italic" }}>
                        Signez ici avec votre souris ou doigt
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "center" }}>
                  <button onClick={undo} disabled={historyStep <= 0} style={{
                    padding: "8px 16px", borderRadius: 10,
                    background: historyStep > 0 ? "#F1F5F9" : "#F8FAFC",
                    border: "1.5px solid #E2E8F0", color: historyStep > 0 ? "#475569" : "#CBD5E1",
                    fontSize: "0.75rem", fontWeight: 600, cursor: historyStep > 0 ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", gap: 6
                  }}>
                    <Icons.Undo size={14} /> Annuler
                  </button>
                  <button onClick={clearCanvas} style={{
                    padding: "8px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.08)",
                    border: "1.5px solid rgba(239, 68, 68, 0.2)", color: "#EF4444",
                    fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6
                  }}>
                    <Icons.Eraser size={14} /> Effacer
                  </button>
                </div>

                <button onClick={handleSaveDrawing} disabled={!hasDrawing} style={{
                  width: "100%", marginTop: 20, padding: "14px", borderRadius: 14,
                  background: hasDrawing ? "linear-gradient(135deg, #FFD700, #D4A500)" : "#E2E8F0",
                  border: "none", color: hasDrawing ? "#0F1B2D" : "#94A3B8",
                  fontWeight: 800, fontSize: "0.9rem", cursor: hasDrawing ? "pointer" : "not-allowed",
                  boxShadow: hasDrawing ? "0 4px 18px rgba(255, 215, 0, 0.3)" : "none"
                }}>
                  <Icons.Check size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
                  Enregistrer la signature
                </button>
              </motion.div>
            )}

            {mode === "text" && (
              <motion.div key="text" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: 10 }}>
                  Saisissez votre signature medicale
                </label>
                <input type="text" value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Ex: Dr. Jean Martin" maxLength={100}
                  style={{
                    width: "100%", padding: "14px 18px", borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)", fontSize: "1.1rem",
                    fontFamily: "'Brush Script MT', 'Dancing Script', 'Comic Sans MS', cursive",
                    fontStyle: "italic", background: "#FAFBFC", marginBottom: 16, color: "#0A2647"
                  }}
                />
                {signatureText && (
                  <div style={{ padding: "24px", background: "#F8FAFC", borderRadius: 16, border: "1.5px solid #E2E8F0", marginBottom: 20, textAlign: "center" }}>
                    <p style={{ fontSize: "0.7rem", color: "#94A3B8", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                      Apercu sur le document
                    </p>
                    <p style={{
                      fontSize: "2rem",
                      fontFamily: "'Brush Script MT', 'Dancing Script', 'Comic Sans MS', cursive",
                      fontStyle: "italic", color: "#0A2647", margin: 0, lineHeight: 1.4
                    }}>
                      {signatureText}
                    </p>
                  </div>
                )}
                <button onClick={handleSaveText} disabled={!signatureText.trim()} style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  background: signatureText.trim() ? "linear-gradient(135deg, #FFD700, #D4A500)" : "#E2E8F0",
                  border: "none", color: signatureText.trim() ? "#0F1B2D" : "#94A3B8",
                  fontWeight: 800, fontSize: "0.9rem", cursor: signatureText.trim() ? "pointer" : "not-allowed",
                  boxShadow: signatureText.trim() ? "0 4px 18px rgba(255, 215, 0, 0.3)" : "none"
                }}>
                  <Icons.Check size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
                  Enregistrer la signature texte
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

// SELECTEUR DE SIGNATURE POUR LA PRESCRIPTION
const SignatureSelector = ({ signatureUrl, signatureText, selectedType, onSelect }) => {
  const hasDraw = !!signatureUrl;
  const hasText = !!signatureText;

  const options = [
    {
      id: "text",
      label: "Signature texte",
      desc: signatureText || "Aucune signature texte enregistree",
      available: hasText,
      icon: <Icons.Type size={18} />,
      preview: signatureText
    },
    {
      id: "draw",
      label: "Signature manuscrite",
      desc: hasDraw ? "Signature dessinee enregistree" : "Aucune signature manuscrite enregistree",
      available: hasDraw,
      icon: <Icons.Pen size={18} />,
      preview: signatureUrl
    }
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: 12 }}>
        Signature sur l'ordonnance *
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => opt.available && onSelect(opt.id)}
            disabled={!opt.available}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", borderRadius: 16,
              background: selectedType === opt.id ? "rgba(255, 215, 0, 0.08)" : "#FAFBFC",
              border: selectedType === opt.id ? "2px solid #FFD700" : "1.5px solid rgba(30, 60, 110, 0.1)",
              cursor: opt.available ? "pointer" : "not-allowed",
              opacity: opt.available ? 1 : 0.5,
              transition: "all 0.2s ease",
              textAlign: "left", width: "100%"
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: selectedType === opt.id ? "linear-gradient(135deg, #FFD700, #D4A500)" : "#F1F5F9",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: selectedType === opt.id ? "#0F1B2D" : "#64748B",
              flexShrink: 0
            }}>
              {opt.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: opt.available ? "#0F1B2D" : "#94A3B8", marginBottom: 2 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                {opt.desc}
              </div>
            </div>
            {opt.available && selectedType === opt.id && (
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "linear-gradient(135deg, #FFD700, #D4A500)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Icons.Check size={14} color="#0F1B2D" />
              </div>
            )}
            {!opt.available && (
              <span style={{ fontSize: "0.65rem", color: "#EF4444", fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.08)" }}>
                Non configure
              </span>
            )}
          </button>
        ))}
      </div>
      {!hasDraw && !hasText && (
        <div style={{
          marginTop: 10, padding: "10px 14px", borderRadius: 10,
          background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <span style={{ fontSize: "0.75rem", color: "#EF4444", fontWeight: 600 }}>
            Vous devez d'abord configurer une signature dans votre profil avant de creer une prescription.
          </span>
        </div>
      )}
    </div>
  );
};

// PAGE PRINCIPALE
export default function DoctorPrescriptionsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [signatureText, setSignatureText] = useState("");

  const [newPrescription, setNewPrescription] = useState({
    consultation_id: "",
    patient_id: "",
    patient_name: "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
    notes: "",
    valid_until: "",
    signature_type: "text"
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [consultsRes, prescRes, meRes] = await Promise.all([
        fetch(`${API}/consultations/assigned`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/prescriptions/doctor`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (consultsRes.ok) {
        const data = await consultsRes.json();
        setConsultations(data.consultations || []);
      }
      if (prescRes.ok) {
        const data = await prescRes.json();
        setPrescriptions(data.prescriptions || []);
      }
      if (meRes.ok) {
        const data = await meRes.json();
        setSignatureUrl(data.signature_url || "");
        setSignatureText(data.signature_text || "");
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSave = async (signatureData) => {
    try {
      if (signatureData.type === "text") {
        const res = await fetch(`${API}/auth/signature-text`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ signature_text: signatureData.text })
        });
        if (res.ok) {
          setSignatureText(signatureData.text);
          setSignatureUrl("");
          alert("Signature texte enregistree !");
        }
      } else if (signatureData.type === "image") {
        const formData = new FormData();
        formData.append("file", signatureData.file);
        const res = await fetch(`${API}/auth/signature`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setSignatureUrl(data.signature_url);
          setSignatureText("");
          alert("Signature manuscrite enregistree !");
        }
      }
      setShowSignatureCanvas(false);
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const addMedicationField = () => {
    setNewPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { name: "", dosage: "", frequency: "", duration: "" }]
    }));
  };

  const removeMedicationField = (index) => {
    setNewPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedication = (index, field, value) => {
    setNewPrescription(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const handleConsultationSelect = (consultationId) => {
    const selected = consultations.find(c => c.id === parseInt(consultationId));
    if (selected) {
      setNewPrescription(prev => ({
        ...prev,
        consultation_id: selected.id,
        patient_id: selected.patient_id,
        patient_name: selected.patient_name
      }));
    }
  };

  const createPrescription = async () => {
    if (!newPrescription.consultation_id || !newPrescription.patient_id) {
      alert("Veuillez selectionner une consultation");
      return;
    }
    if (newPrescription.medications.length === 0 || !newPrescription.medications[0].name) {
      alert("Veuillez ajouter au moins un medicament");
      return;
    }
    if (newPrescription.signature_type === "text" && !signatureText) {
      alert("Veuillez selectionner une signature texte ou en configurer une dans votre profil");
      return;
    }
    if (newPrescription.signature_type === "draw" && !signatureUrl) {
      alert("Veuillez selectionner une signature manuscrite ou en configurer une dans votre profil");
      return;
    }

    try {
      const res = await fetch(`${API}/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          consultation_id: newPrescription.consultation_id,
          patient_id: newPrescription.patient_id,
          medications: newPrescription.medications.filter(m => m.name.trim()),
          notes: newPrescription.notes,
          valid_until: newPrescription.valid_until || null,
          signature_type: newPrescription.signature_type,
          signature_text: newPrescription.signature_type === "text" ? signatureText : ""
        })
      });

      if (res.ok) {
        await fetchData();
        setShowCreateModal(false);
        resetForm();
      } else {
        const err = await res.json();
        alert(err.detail || "Erreur lors de la creation");
      }
    } catch (err) {
      alert("Erreur reseau");
    }
  };

  const deletePrescription = async (id) => {
    if (!window.confirm("Annuler cette prescription ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/prescriptions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await fetchData();
    } catch (err) {
      alert("Erreur");
    } finally {
      setDeletingId(null);
    }
  };

  const sendToPatient = async (id) => {
    setSendingId(id);
    try {
      const res = await fetch(`${API}/prescriptions/${id}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) alert("Prescription envoyee au patient");
    } catch (err) {
      alert("Erreur lors de l'envoi");
    } finally {
      setSendingId(null);
    }
  };

  const resetForm = () => {
    setNewPrescription({
      consultation_id: "",
      patient_id: "",
      patient_name: "",
      medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
      notes: "",
      valid_until: "",
      signature_type: "text"
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const getModelIcon = (modelKey) => {
    const iconSvgs = {
      chest: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.5 1.5a.5.5 0 1 0-1 0v5.243L7 7.1V4.72C7 3.77 6.23 3 5.28 3c-.524 0-1.023.27-1.443.592-.431.332-.847.773-1.216 1.229-.736.908-1.347 1.946-1.58 2.48-.176.405-.393 1.16-.556 2.011-.165.857-.283 1.857-.241 2.759.04.867.233 1.79.838 2.33.67.6 1.622.556 2.741-.004l1.795-.897A2.5 2.5 0 0 0 7 11.264V10.5a.5.5 0 0 0-1 0v.764a1.5 1.5 0 0 1-.83 1.342l-1.794.897c-.978.489-1.415.343-1.628.152-.28-.25-.467-.801-.505-1.63-.037-.795.068-1.71.224-2.525.157-.82.357-1.491.491-1.8.19-.438.75-1.4 1.44-2.25.342-.422.703-.799 1.049-1.065.358-.276.639-.385.833-.385a.72.72 0 0 1 .72.72v3.094l-1.79 1.28a.5.5 0 0 0 .58.813L8 7.614l3.21 2.293a.5.5 0 1 0 .58-.814L10 7.814V4.72a.72.72 0 0 1 .72-.72c.194 0 .475.11.833.385.346.266.706.643 1.05 1.066.688.85 1.248 1.811 1.439 2.249.134.309.334.98.491 1.8.156.814.26 1.73.224 2.525-.038.829-.224 1.38-.505 1.63-.213.19-.65.337-1.628-.152l-1.795-.897A1.5 1.5 0 0 1 10 11.264V10.5a.5.5 0 0 0-1 0v.764a2.5 2.5 0 0 0 1.382 2.236l1.795.897c1.12.56 2.07.603 2.741.004.605-.54.798-1.463.838-2.33.042-.902-.076-1.902-.24-2.759-.164-.852-.38-1.606-.558-2.012-.232-.533-.843-1.571-1.579-2.479-.37-.456-.785-.897-1.216-1.229C11.743 3.27 11.244 3 10.72 3 9.77 3 9 3.77 9 4.72V7.1l-.5-.357z"/>
        </svg>
      ),
      brain: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M4.5 7.5a.5.5 0 0 1 0-1h2a.5.5 0 0 1 0 1zm5 0a.5.5 0 0 1 0-1h2a.5.5 0 0 1 0 1zM8 4a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 4zm0 5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 9z"/>
        </svg>
      ),
      lung: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.5 1.5a.5.5 0 1 0-1 0v5.243L7 7.1V4.72C7 3.77 6.23 3 5.28 3c-.524 0-1.023.27-1.443.592-.431.332-.847.773-1.216 1.229-.736.908-1.347 1.946-1.58 2.48-.176.405-.393 1.16-.556 2.011-.165.857-.283 1.857-.241 2.759.04.867.233 1.79.838 2.33.67.6 1.622.556 2.741-.004l1.795-.897A2.5 2.5 0 0 0 7 11.264V10.5a.5.5 0 0 0-1 0v.764a1.5 1.5 0 0 1-.83 1.342l-1.794.897c-.978.489-1.415.343-1.628.152-.28-.25-.467-.801-.505-1.63-.037-.795.068-1.71.224-2.525.157-.82.357-1.491.491-1.8.19-.438.75-1.4 1.44-2.25.342-.422.703-.799 1.049-1.065.358-.276.639-.385.833-.385a.72.72 0 0 1 .72.72v3.094l-1.79 1.28a.5.5 0 0 0 .58.813L8 7.614l3.21 2.293a.5.5 0 1 0 .58-.814L10 7.814V4.72a.72.72 0 0 1 .72-.72c.194 0 .475.11.833.385.346.266.706.643 1.05 1.066.688.85 1.248 1.811 1.439 2.249.134.309.334.98.491 1.8.156.814.26 1.73.224 2.525-.038.829-.224 1.38-.505 1.63-.213.19-.65.337-1.628-.152l-1.795-.897A1.5 1.5 0 0 1 10 11.264V10.5a.5.5 0 0 0-1 0v.764a2.5 2.5 0 0 0 1.382 2.236l1.795.897c1.12.56 2.07.603 2.741.004.605-.54.798-1.463.838-2.33.042-.902-.076-1.902-.24-2.759-.164-.852-.38-1.606-.558-2.012-.232-.533-.843-1.571-1.579-2.479-.37-.456-.785-.897-1.216-1.229C11.743 3.27 11.244 3 10.72 3 9.77 3 9 3.77 9 4.72V7.1l-.5-.357z"/>
        </svg>
      ),
      retina: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
        </svg>
      ),
      default: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.5 4.5a.5.5 0 0 0-1 0v.634l-.549-.317a.5.5 0 1 0-.5.866L7 6l-.549.317a.5.5 0 1 0 .5.866l.549-.317V7.5a.5.5 0 1 0 1 0v-.634l.549.317a.5.5 0 1 0 .5-.866L9 6l.549-.317a.5.5 0 1 0-.5-.866l-.549.317zM5.5 9a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1z"/>
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1"/>
        </svg>
      )
    };
    return iconSvgs[modelKey] || iconSvgs.default;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{
          width: 48, height: 48,
          border: "3px solid rgba(212, 165, 0, 0.2)",
          borderTopColor: "#D4A500",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    {/* Title removed - shown in page header above */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowSignatureCanvas(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 12,
                background: (signatureUrl || signatureText) ? "rgba(16, 185, 129, 0.1)" : "rgba(30, 60, 110, 0.04)",
                border: (signatureUrl || signatureText) ? "1.5px solid rgba(16, 185, 129, 0.3)" : "1.5px solid rgba(30, 60, 110, 0.15)",
                color: (signatureUrl || signatureText) ? "#059669" : "#475569",
                fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s ease"
              }}
              title={(signatureUrl || signatureText) ? "Signature enregistree - cliquez pour modifier" : "Ajouter votre signature"}
            >
              <Icons.Signature size={18} />
              {(signatureUrl || signatureText) ? "Signature OK" : "Signature"}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: 12,
                background: "linear-gradient(135deg, #FFD700, #D4A500)",
                border: "none", color: "#0F1B2D",
                fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)"
              }}
            >
              <Icons.Add size={18} />
              Nouvelle prescription
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#3B82F6" }}>
              {prescriptions.length} prescriptions
            </span>
          </div>
          <div style={{ background: "#ECFDF5", borderRadius: 12, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#10B981" }}>
              {prescriptions.filter(p => p.status === "active").length} actives
            </span>
          </div>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 40px",
          background: "white", borderRadius: 24,
          border: "1px solid rgba(30, 60, 110, 0.08)"
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(212, 165, 0, 0.08))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px"
          }}>
            <Icons.Prescription size={36} color="#D4A500" />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F1B2D", marginBottom: 8 }}>
            Aucune prescription
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#94A3B8", maxWidth: 300, margin: "0 auto" }}>
            Cliquez sur "Nouvelle prescription" pour en creer une.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {prescriptions.map((pres, idx) => (
            <motion.div
              key={pres.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: "white", borderRadius: 20,
                border: "1px solid rgba(30, 60, 110, 0.08)",
                overflow: "hidden", transition: "all 0.3s ease"
              }}
              whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(30, 60, 110, 0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A500" }}>
                      #{pres.id}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                      <Icons.Calendar size={12} />
                      {formatDate(pres.created_at)}
                    </span>
                    <span style={{
                      padding: "3px 10px", borderRadius: 12, fontSize: "0.65rem", fontWeight: 600,
                      background: pres.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: pres.status === "active" ? "#10B981" : "#EF4444"
                    }}>
                      {pres.status === "active" ? "Active" : "Annulee"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {pres.status === "active" && (
                      <button
                        onClick={() => sendToPatient(pres.id)}
                        disabled={sendingId === pres.id}
                        style={{
                          padding: "6px 14px", borderRadius: 8,
                          background: "rgba(16,185,129,0.1)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          color: "#10B981", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6
                        }}
                      >
                        {sendingId === pres.id ? "..." : <><Icons.Send size={14} /> Envoyer</>}
                      </button>
                    )}
                    <button
                      onClick={() => deletePrescription(pres.id)}
                      disabled={deletingId === pres.id}
                      style={{
                        padding: "6px 14px", borderRadius: 8,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        color: "#EF4444", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6
                      }}
                    >
                      {deletingId === pres.id ? "..." : <><Icons.Trash size={14} /> Annuler</>}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "rgba(45,95,158,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#2D5F9E"
                  }}>
                    {getModelIcon(pres.model_key)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0F1B2D", fontSize: "0.95rem" }}>
                      {pres.patient_name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      Consultation #{pres.consultation_id}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "linear-gradient(135deg, #0F1B2D, #1A2D4A)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#0F1B2D"
                  }}>
                    <Icons.FileMedical size={14} color="#FFD700" />
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0F1B2D" }}>
                    Medicaments prescrits
                  </span>
                </div>

                {pres.medications?.map((med, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12,
                    padding: "12px 16px", background: "#F8FAFC", borderRadius: 12,
                    marginBottom: 8, alignItems: "center"
                  }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0F1B2D" }}>{med.name}</span>
                    <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 12, background: "#EFF6FF", color: "#3B82F6", width: "fit-content" }}>{med.dosage}</span>
                    <span style={{ fontSize: "0.75rem", color: "#475569" }}>{med.frequency}</span>
                    <span style={{ fontSize: "0.7rem", color: "#D4A500", fontWeight: 600 }}>{med.duration}</span>
                  </div>
                ))}

                {pres.notes && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px",
                    background: "rgba(255,215,0,0.04)", borderRadius: 10,
                    border: "1px solid rgba(255,215,0,0.1)"
                  }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#D4A500", marginBottom: 4 }}>
                      Note du medecin
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{pres.notes}</div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(15, 27, 45, 0.7)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, padding: 20, overflow: "auto"
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: "#FFFFFF", borderRadius: 28, padding: 32,
                maxWidth: 700, width: "100%", maxHeight: "85vh", overflow: "auto"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: "linear-gradient(135deg, #FFD700, #D4A500)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#0F1B2D"
                  }}>
                    <Icons.Prescription size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F1B2D", margin: 0 }}>
                      Nouvelle prescription
                    </h2>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: "4px 0 0" }}>
                      Redigez une ordonnance pour votre patient
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8"
                }}>
                  <Icons.Close size={20} />
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                  Consultation *
                </label>
                <select
                  value={newPrescription.consultation_id}
                  onChange={(e) => handleConsultationSelect(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "0.9rem", background: "#FAFBFC", cursor: "pointer"
                  }}
                >
                  <option value="">Selectionner une consultation...</option>
                  {consultations.filter(c => c.status === "analyzed").map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.id} - {c.patient_name} ({c.model_key})
                    </option>
                  ))}
                </select>
              </div>

              {newPrescription.patient_name && (
                <div style={{
                  marginBottom: 20, padding: "12px 16px",
                  background: "#F0FDF4", borderRadius: 14,
                  border: "1px solid rgba(16,185,129,0.2)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icons.User size={16} color="#10B981" />
                    <span style={{ fontWeight: 600, color: "#059669" }}>
                      Patient : {newPrescription.patient_name}
                    </span>
                  </div>
                </div>
              )}

              <SignatureSelector
                signatureUrl={signatureUrl}
                signatureText={signatureText}
                selectedType={newPrescription.signature_type}
                onSelect={(type) => setNewPrescription(prev => ({ ...prev, signature_type: type }))}
              />

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                    Medicaments *
                  </label>
                  <button type="button" onClick={addMedicationField} style={{
                    padding: "6px 12px", borderRadius: 8,
                    background: "rgba(255,215,0,0.1)",
                    border: "1px solid rgba(255,215,0,0.2)",
                    color: "#D4A500", fontSize: "0.7rem", cursor: "pointer"
                  }}>
                    + Ajouter un medicament
                  </button>
                </div>

                {newPrescription.medications.map((med, idx) => (
                  <div key={idx} style={{
                    padding: "16px", background: "#FAFBFC", borderRadius: 16,
                    marginBottom: 12, border: "1px solid rgba(30,60,110,0.06)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#D4A500" }}>
                        Medicament {idx + 1}
                      </span>
                      {idx > 0 && (
                        <button onClick={() => removeMedicationField(idx)} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>
                          Supprimer
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <input type="text" placeholder="Nom du medicament *"
                        value={med.name}
                        onChange={(e) => updateMedication(idx, "name", e.target.value)}
                        style={{
                          padding: "10px 14px", borderRadius: 12,
                          border: "1.5px solid rgba(30,60,110,0.12)",
                          fontSize: "0.85rem", background: "white"
                        }}
                      />
                      <input type="text" placeholder="Dosage (ex: 500mg)"
                        value={med.dosage}
                        onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                        style={{
                          padding: "10px 14px", borderRadius: 12,
                          border: "1.5px solid rgba(30,60,110,0.12)",
                          fontSize: "0.85rem", background: "white"
                        }}
                      />
                      <input type="text" placeholder="Frequence (ex: 2x/jour)"
                        value={med.frequency}
                        onChange={(e) => updateMedication(idx, "frequency", e.target.value)}
                        style={{
                          padding: "10px 14px", borderRadius: 12,
                          border: "1.5px solid rgba(30,60,110,0.12)",
                          fontSize: "0.85rem", background: "white"
                        }}
                      />
                      <input type="text" placeholder="Duree (ex: 7 jours)"
                        value={med.duration}
                        onChange={(e) => updateMedication(idx, "duration", e.target.value)}
                        style={{
                          padding: "10px 14px", borderRadius: 12,
                          border: "1.5px solid rgba(30,60,110,0.12)",
                          fontSize: "0.85rem", background: "white"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                  Notes / Instructions
                </label>
                <textarea
                  value={newPrescription.notes}
                  onChange={(e) => setNewPrescription(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Informations complementaires pour le patient..."
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 14,
                    border: "1.5px solid rgba(30,60,110,0.12)",
                    fontSize: "0.85rem", resize: "vertical"
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                  Valable jusqu'au (optionnel)
                </label>
                <input
                  type="date"
                  value={newPrescription.valid_until}
                  onChange={(e) => setNewPrescription(prev => ({ ...prev, valid_until: e.target.value }))}
                  style={{
                    padding: "12px 16px", borderRadius: 14,
                    border: "1.5px solid rgba(30,60,110,0.12)",
                    fontSize: "0.9rem", width: "100%"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setShowCreateModal(false)} style={{
                  flex: 1, padding: "12px", borderRadius: 14,
                  background: "transparent",
                  border: "1.5px solid rgba(30,60,110,0.15)",
                  color: "#475569", fontWeight: 600, cursor: "pointer"
                }}>
                  Annuler
                </button>
                <button onClick={createPrescription} style={{
                  flex: 2, padding: "12px", borderRadius: 14,
                  background: "linear-gradient(135deg, #FFD700, #D4A500)",
                  border: "none", color: "#0F1B2D",
                  fontWeight: 700, cursor: "pointer"
                }}>
                  Creer la prescription
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignatureCanvas && (
          <SignatureCanvas
            onSave={handleSignatureSave}
            onClose={() => setShowSignatureCanvas(false)}
            existingSignatureText={signatureText}
            existingSignatureUrl={signatureUrl}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
