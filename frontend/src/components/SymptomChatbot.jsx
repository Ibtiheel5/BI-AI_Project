// src/components/SymptomChatbot.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeSymptoms } from "../services/chatbot";

const MODEL_ICONS = { chest: "🫁", lung: "🔬", brain: "🧠", retina: "👁️" };

const SPEC_ICONS = {
  "Neurologue": "🧠", "Neurochirurgien": "🧠", "Pneumologue": "🫁",
  "Oncologue": "🔬", "Carcinologue": "🔬", "Cardiologue": "❤️",
  "Infectiologue": "🦠", "Radiologue": "⚡", "Ophtalmologue": "👁️",
};

export default function SymptomChatbot({ isOpen, onClose, userLocation }) {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Bonjour ! 👋 Je suis votre **assistant santé IA**.\n\nDécrivez-moi vos symptômes et je vous orienterai vers l'examen le plus adapté **avec les médecins disponibles près de chez vous**.\n\nJe peux vous aider pour :\n• 🫁 Symptômes respiratoires/cardiaques → Radio thoracique\n• 🔬 Lésions pulmonaires → Scanner CT\n• 🧠 Symptômes neurologiques → IRM cérébrale\n• 👁️ Problèmes de vision → Fond d'œil",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput("");
    setMessages(prev => [...prev, { type: "user", text }]);
    setIsTyping(true);
    setDoctors([]);

    try {
      const body = { text };
      if (userLocation) {
        body.user_lat = userLocation[0];
        body.user_lon = userLocation[1];
      }

      const res = await fetch("http://localhost:8000/api/v1/chatbot/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      setMessages(prev => [...prev, { type: "bot", text: data.message }]);
      
      if (data.recommendation) {
        setRecommendation(data.recommendation);
      }
      if (data.doctors?.length > 0) {
        setDoctors(data.doctors);
      }
    } catch {
      setMessages(prev => [...prev, { type: "bot", text: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickExamples = [
    { text: "Je tousse depuis 2 semaines avec fièvre", icon: "🫁", model: "chest" },
    { text: "J'ai des maux de tête intenses et des vertiges", icon: "🧠", model: "brain" },
    { text: "Je vois flou et je suis diabétique", icon: "👁️", model: "retina" },
    { text: "J'ai perdu du poids et je fume beaucoup", icon: "🔬", model: "lung" },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={onClose ? onClose : () => {}}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 1001,
          width: 64,
          height: 64,
          borderRadius: 20,
          background: isOpen ? "#DC2626" : "linear-gradient(135deg, #0EA5E9, #2563EB)",
          border: "none",
          boxShadow: "0 10px 30px rgba(37,99,235,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
          transition: "all 0.3s",
          color: "white",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {isOpen ? "✕" : "🤖"}
        {!isOpen && (
          <div
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#10B981",
              border: "2px solid white",
              animation: "pulse 2s infinite",
            }}
          />
        )}
      </button>

      {/* Chat Window */}
      <div
        style={{
          position: "fixed",
          bottom: isOpen ? 108 : -700,
          right: 28,
          zIndex: 1000,
          width: 440,
          height: 620,
          background: "white",
          borderRadius: 24,
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          border: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          transition: "bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            background: "linear-gradient(135deg, #0EA5E9, #2563EB)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
            }}
          >
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Assistant Santé IA</div>
            <div style={{ fontSize: "0.65rem", opacity: 0.8 }}>
              Analyse de symptômes · Recommandation médecins
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#4ADE80",
                animation: "pulse 1.5s infinite",
              }}
            />
            <span style={{ fontSize: "0.62rem", opacity: 0.8 }}>En ligne</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#F8FAFC" }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                marginBottom: 14,
                animation: "fadeUp 0.3s ease",
              }}
            >
              {msg.type === "bot" && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #0EA5E9, #2563EB)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "0.8rem",
                    marginRight: 8,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                >
                  🤖
                </div>
              )}
              <div
                style={{
                  maxWidth: msg.type === "user" ? "78%" : "88%",
                  padding: "12px 16px",
                  borderRadius: msg.type === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.type === "user" ? "linear-gradient(135deg, #0A2647, #1B3B6F)" : "white",
                  color: msg.type === "user" ? "white" : "#0A2647",
                  fontSize: "0.82rem",
                  lineHeight: 1.65,
                  border: msg.type === "bot" ? "1px solid #E2E8F0" : "none",
                  boxShadow: msg.type === "user" ? "0 4px 12px rgba(10,38,71,0.2)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                {msg.text.split("\n").map((line, j) => (
                  <div key={j} style={{ marginBottom: line ? 2 : 6 }}>
                    {line.split(/(\*\*.*?\*\*)/).map((part, k) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <strong
                            key={k}
                            style={{ color: msg.type === "user" ? "#93C5FD" : "#2563EB" }}
                          >
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return part;
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Médecins Cards */}
          {doctors.length > 0 && (
            <div style={{ marginLeft: 40, marginBottom: 14, animation: "fadeUp 0.3s ease" }}>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#059669",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>👨‍⚕️</span> Médecins disponibles — Appelez directement
              </div>
              {doctors.map((doc, i) => {
                const specIcon = SPEC_ICONS[doc.specialite] || "⚕";
                return (
                  <div
                    key={doc.id}
                    style={{
                      background: "white",
                      borderRadius: 14,
                      padding: "12px 14px",
                      marginBottom: 8,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #059669, #047857)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "1rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {specIcon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0A2647", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{doc.specialite}</div>
                      </div>
                      {doc.distance_km && (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 10,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            background: "#ECFDF5",
                            color: "#059669",
                          }}
                        >
                          {doc.distance_km} km
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: 6 }}>
                      📍 {doc.ville}
                      {doc.address ? ` — ${doc.address.substring(0, 50)}` : ""}
                    </div>
                    {doc.phones?.length > 0 && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {doc.phones.map((p, j) => (
                          <a
                            key={j}
                            href={`tel:${p}`}
                            style={{
                              padding: "5px 12px",
                              background: "linear-gradient(135deg, #059669, #047857)",
                              color: "white",
                              borderRadius: 8,
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            📞 {p}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: "flex", gap: 5, marginLeft: 40, marginBottom: 14 }}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#CBD5E1",
                    animation: `typingBounce 1.2s ease-in-out ${delay}s infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Bouton Commencer l'examen */}
          {recommendation && (
            <div style={{ textAlign: "center", marginTop: 8, marginBottom: 8, animation: "fadeUp 0.3s ease" }}>
              <button
                onClick={() => {
                  navigate(`/patient/consultation/new?model=${recommendation.model_key}`);
                }}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #059669, #047857)",
                  border: "none",
                  borderRadius: 14,
                  color: "white",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(5,150,105,0.3)",
                }}
              >
                {MODEL_ICONS[recommendation.model_key] || "📋"} Commencer l'examen →
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick examples */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 16px 10px", background: "#F8FAFC" }}>
            <div style={{ fontSize: "0.65rem", color: "#94A3B8", marginBottom: 8, fontWeight: 600 }}>
              💡 Exemples de symptômes :
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {quickExamples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(ex.text);
                    setTimeout(() => handleSend(), 100);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "white",
                    border: "1px solid #E2E8F0",
                    borderRadius: 20,
                    fontSize: "0.68rem",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#2563EB";
                    e.currentTarget.style.color = "#2563EB";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#E2E8F0";
                    e.currentTarget.style.color = "#475569";
                  }}
                >
                  {ex.icon} {ex.text.substring(0, 35)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            background: "white",
          }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Décrivez vos symptômes..."
            rows={2}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#F8FAFC",
              border: "1.5px solid #E2E8F0",
              borderRadius: 12,
              fontSize: "0.82rem",
              color: "#0A2647",
              resize: "none",
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
              maxHeight: 80,
            }}
            onFocus={e => (e.target.style.borderColor = "#2563EB")}
            onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: input.trim() ? "linear-gradient(135deg, #2563EB, #0EA5E9)" : "#E2E8F0",
              border: "none",
              color: "white",
              fontSize: "1.1rem",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s",
              boxShadow: input.trim() ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}