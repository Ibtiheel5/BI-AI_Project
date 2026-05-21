// frontend/src/components/SignatureCanvas.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SignatureCanvas = ({ 
  onSave, 
  onClose, 
  existingSignatureText = "", 
  existingSignatureUrl = "",
  width = 600,
  height = 200 
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState(existingSignatureUrl ? "draw" : "text"); // "text" | "draw" | "upload"
  const [signatureText, setSignatureText] = useState(existingSignatureText);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#0A2647");
  const [strokeWidth, setStrokeWidth] = useState(2.5);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    // Set white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines for guidance
    ctx.strokeStyle = "rgba(30, 60, 110, 0.06)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.7);
    ctx.lineTo(width, height * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);

    // Save initial blank state
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
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw grid
    ctx.strokeStyle = "rgba(30, 60, 110, 0.06)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.7);
    ctx.lineTo(width, height * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);

    setHasDrawing(false);
    saveHistory();
  };

  const handleSaveDrawing = () => {
    if (!hasDrawing) {
      alert("Veuillez signer avant d'enregistrer");
      return;
    }
    const canvas = canvasRef.current;
    // Convert to PNG blob
    canvas.toBlob((blob) => {
      const file = new File([blob], `signature_${Date.now()}.png`, { type: "image/png" });
      onSave({ type: "image", file, dataUrl: canvas.toDataURL("image/png") });
    }, "image/png");
  };

  const handleSaveText = () => {
    if (!signatureText.trim()) {
      alert("Veuillez saisir votre signature");
      return;
    }
    onSave({ type: "text", text: signatureText.trim() });
  };

  const colors = [
    { name: "Bleu marine", value: "#0A2647" },
    { name: "Noir", value: "#1E293B" },
    { name: "Bleu", value: "#2563EB" },
    { name: "Rouge", value: "#DC2626" },
    { name: "Vert", value: "#059669" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 27, 45, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          background: "#FFFFFF",
          borderRadius: 28,
          padding: 0,
          maxWidth: 720,
          width: "100%",
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid rgba(30, 60, 110, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #FFD700, #D4A500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0F1B2D"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F1B2D", margin: 0 }}>
                Ma signature médicale
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: "2px 0 0" }}>
                Signez à la main ou saisissez votre signature
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#F1F5F9",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748B",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#E2E8F0"; e.currentTarget.style.color = "#475569"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#64748B"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{
          padding: "16px 28px 0",
          display: "flex",
          gap: 8
        }}>
          {[
            { id: "draw", label: "✍️ Signer à la main", icon: "✍️" },
            { id: "text", label: "✏️ Texte manuscrit", icon: "✏️" },
            { id: "upload", label: "🖼️ Image", icon: "🖼️" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 12,
                background: mode === tab.id ? "linear-gradient(135deg, #FFD700, #D4A500)" : "#F1F5F9",
                border: "none",
                color: mode === tab.id ? "#0F1B2D" : "#64748B",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 28px 28px" }}>
          <AnimatePresence mode="wait">
            {mode === "draw" && (
              <motion.div
                key="draw"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Toolbar */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: 10
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94A3B8" }}>Couleur :</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {colors.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setStrokeColor(c.value)}
                          title={c.name}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: c.value,
                            border: strokeColor === c.value ? "3px solid #FFD700" : "2px solid transparent",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: strokeColor === c.value ? "0 0 0 2px white, 0 0 0 4px #FFD700" : "none"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94A3B8" }}>Épaisseur :</span>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      step="0.5"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                      style={{ width: 80 }}
                    />
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569", minWidth: 24 }}>
                      {strokeWidth}px
                    </span>
                  </div>
                </div>

                {/* Canvas Container */}
                <div style={{
                  border: "2px dashed #CBD5E1",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#F8FAFC",
                  position: "relative",
                  cursor: "crosshair"
                }}>
                  <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      touchAction: "none"
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasDrawing && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none"
                    }}>
                      <span style={{
                        fontSize: "0.9rem",
                        color: "#CBD5E1",
                        fontStyle: "italic"
                      }}>
                        Signez ici avec votre souris ou doigt
                      </span>
                    </div>
                  )}
                </div>

                {/* Canvas Actions */}
                <div style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 14,
                  justifyContent: "center"
                }}>
                  <button
                    onClick={undo}
                    disabled={historyStep <= 0}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      background: historyStep > 0 ? "#F1F5F9" : "#F8FAFC",
                      border: "1.5px solid #E2E8F0",
                      color: historyStep > 0 ? "#475569" : "#CBD5E1",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: historyStep > 0 ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7v6h6"/>
                      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                    </svg>
                    Annuler
                  </button>
                  <button
                    onClick={clearCanvas}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1.5px solid rgba(239, 68, 68, 0.2)",
                      color: "#EF4444",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Effacer
                  </button>
                </div>

                <button
                  onClick={handleSaveDrawing}
                  disabled={!hasDrawing}
                  style={{
                    width: "100%",
                    marginTop: 20,
                    padding: "14px",
                    borderRadius: 14,
                    background: hasDrawing ? "linear-gradient(135deg, #FFD700, #D4A500)" : "#E2E8F0",
                    border: "none",
                    color: hasDrawing ? "#0F1B2D" : "#94A3B8",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    cursor: hasDrawing ? "pointer" : "not-allowed",
                    transition: "all 0.3s ease",
                    boxShadow: hasDrawing ? "0 4px 18px rgba(255, 215, 0, 0.3)" : "none"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "middle", marginRight: 8 }}>
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Enregistrer la signature
                </button>
              </motion.div>
            )}

            {mode === "text" && (
              <motion.div
                key="text"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <label style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  display: "block",
                  marginBottom: 10
                }}>
                  Saisissez votre signature médicale
                </label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Ex: Dr. Jean Martin"
                  maxLength={100}
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(30, 60, 110, 0.12)",
                    fontSize: "1.1rem",
                    fontFamily: "'Brush Script MT', 'Dancing Script', 'Comic Sans MS', cursive",
                    fontStyle: "italic",
                    background: "#FAFBFC",
                    marginBottom: 16,
                    color: "#0A2647"
                  }}
                />

                {signatureText && (
                  <div style={{
                    padding: "24px",
                    background: "#F8FAFC",
                    borderRadius: 16,
                    border: "1.5px solid #E2E8F0",
                    marginBottom: 20,
                    textAlign: "center"
                  }}>
                    <p style={{
                      fontSize: "0.7rem",
                      color: "#94A3B8",
                      margin: "0 0 12px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 600
                    }}>
                      Aperçu sur le document
                    </p>
                    <p style={{
                      fontSize: "2rem",
                      fontFamily: "'Brush Script MT', 'Dancing Script', 'Comic Sans MS', cursive",
                      fontStyle: "italic",
                      color: "#0A2647",
                      margin: 0,
                      lineHeight: 1.4
                    }}>
                      {signatureText}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSaveText}
                  disabled={!signatureText.trim()}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: signatureText.trim() ? "linear-gradient(135deg, #FFD700, #D4A500)" : "#E2E8F0",
                    border: "none",
                    color: signatureText.trim() ? "#0F1B2D" : "#94A3B8",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    cursor: signatureText.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.3s ease",
                    boxShadow: signatureText.trim() ? "0 4px 18px rgba(255, 215, 0, 0.3)" : "none"
                  }}
                >
                  Enregistrer la signature texte
                </button>
              </motion.div>
            )}

            {mode === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div style={{
                  border: "2px dashed #CBD5E1",
                  borderRadius: 16,
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "#F8FAFC",
                  marginBottom: 20
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0 0 8px" }}>
                    Glissez-déposez une image de signature
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: 0 }}>
                    PNG transparent recommandé, max 2 Mo
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert("L'image ne doit pas dépasser 2 Mo");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          onSave({ type: "image", file, dataUrl: ev.target.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer"
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SignatureCanvas;