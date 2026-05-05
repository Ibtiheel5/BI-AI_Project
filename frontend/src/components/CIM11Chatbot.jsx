// frontend/src/components/CIM11Chatbot.jsx
"use client";

import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Codes pour le diabète de type 2",
  "Classification des tumeurs malignes",
  "Critères troubles dépressifs",
  "Maladies cardiovasculaires ischémiques",
];

function CodeBadge({ code }) {
  return (
    <span style={{
      display: "inline-block",
      fontFamily: "monospace",
      fontSize: "11px",
      fontWeight: 600,
      background: "#dff0f8",
      color: "#0077aa",
      padding: "1px 7px",
      borderRadius: "4px",
      margin: "0 2px",
      letterSpacing: "0.3px",
    }}>
      {code}
    </span>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  const renderContent = (text) => {
    // Si c'est un message d'erreur, ne pas parser les codes
    if (text.startsWith("❌") || text.startsWith("😞")) {
      return <span style={{ color: "#dc2626" }}>{text}</span>;
    }
    
    const parts = text.split(/(\[[A-Z0-9.]+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[([A-Z0-9.]+)\]$/);
      if (match) return <CodeBadge key={i} code={match[1]} />;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "12px",
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "#0099cc", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "10px", fontWeight: 700,
          flexShrink: 0, marginRight: "8px", marginTop: "2px",
        }}>
          CIM
        </div>
      )}
      <div style={{
        maxWidth: "78%",
        padding: "10px 14px",
        borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        background: isUser ? "#0099cc" : "#ffffff",
        color: isUser ? "#ffffff" : "#1a1a1a",
        border: isUser ? "none" : "1px solid #e8edf2",
        fontSize: "13px",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
        boxShadow: isUser ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        {isUser ? msg.content : renderContent(msg.content)}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "#0099cc", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "10px", fontWeight: 700, flexShrink: 0,
      }}>
        CIM
      </div>
      <div style={{
        display: "flex", gap: 5, padding: "12px 16px",
        background: "#fff", border: "1px solid #e8edf2",
        borderRadius: "4px 16px 16px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#0099cc",
            display: "inline-block",
            animation: "cim-bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function CIM11Chatbot({ doctor, height = "500px", style = {} }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Bonjour Docteur ${doctor?.name ?? ""} 👋\n\nJe suis votre assistant CIM-11. Posez-moi vos questions sur les codes diagnostiques, classifications nosologiques et critères de la CIM-11.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const token = localStorage.getItem("medai-token");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setShowSuggestions(false);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      console.log("📤 Envoi de la question:", userText);
      
      const res = await fetch("http://localhost:8000/api/v1/cim11", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          messages: newMessages,
          doctor_name: doctor?.name
        }),
      });

      console.log("📥 Réponse status:", res.status);

      if (res.status === 401) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      if (res.status === 403) {
        throw new Error("Accès non autorisé. Compte médecin requis.");
      }

      if (res.status === 429) {
        throw new Error("Trop de demandes. Attendez quelques secondes avant de réessayer.");
      }

      if (res.status === 503) {
        throw new Error("Service momentanément indisponible. Réessayez dans un instant.");
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erreur ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply ?? "Une erreur s'est produite.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      
    } catch (error) {
      console.error("❌ Chat error:", error);
      
      let errorMessage = error.message || "Erreur de connexion. Veuillez réessayer.";
      
      // Messages d'erreur plus conviviaux
      if (errorMessage.includes("Configuration API")) {
        errorMessage = "😞 L'assistant CIM-11 n'est pas encore configuré. Veuillez contacter l'administrateur.";
      } else if (errorMessage.includes("Service temporairement")) {
        errorMessage = "🔄 Le service est temporairement indisponible. Réessayez dans quelques instants.";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("temps")) {
        errorMessage = "⏱️ L'assistant met trop de temps à répondre. Réessayez.";
      } else if (errorMessage.includes("connexion")) {
        errorMessage = "🔌 Problème de connexion au serveur. Vérifiez que le backend est démarré.";
      }
      
      setMessages([
        ...newMessages,
        { role: "assistant", content: `❌ ${errorMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <>
      <style>{`
        @keyframes cim-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>

      <div style={{
        display: "flex",
        flexDirection: "column",
        height,
        border: "1px solid #e0e8ef",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#f4f7fa",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        ...style,
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px",
          background: "#fff",
          borderBottom: "1px solid #e8edf2",
          flexShrink: 0,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "#0099cc",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: "13px",
          }}>
            CIM
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0d1b2a" }}>
              Assistant CIM-11
            </div>
            <div style={{ fontSize: "11px", color: "#6b8299", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                display: "inline-block", width: 7, height: 7,
                borderRadius: "50%", background: "#22c55e",
              }} />
              Base de données OMS · 11e révision
            </div>
          </div>
          <div style={{
            marginLeft: "auto",
            fontSize: "11px", color: "#6b8299",
            background: "#f0f7ff", border: "1px solid #cce5f5",
            padding: "3px 10px", borderRadius: "20px",
          }}>
            Dr. {doctor?.name ?? doctor?.full_name ?? "Médecin"}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && messages.length <= 2 && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6,
            padding: "8px 16px",
            background: "#fff",
            borderTop: "1px solid #e8edf2",
          }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  fontSize: "11px", color: "#0077aa",
                  background: "#e8f5fb", border: "1px solid #b3ddf0",
                  padding: "4px 12px", borderRadius: "20px",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 8,
          padding: "10px 12px",
          background: "#fff",
          borderTop: "1px solid #e8edf2",
          flexShrink: 0,
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e); }}
            onKeyDown={handleKey}
            placeholder="Posez votre question CIM-11…"
            rows={1}
            style={{
              flex: 1, resize: "none",
              border: "1px solid #d0dce8",
              borderRadius: "20px",
              padding: "9px 14px",
              fontSize: "13px",
              fontFamily: "inherit",
              background: "#f4f7fa",
              color: "#0d1b2a",
              outline: "none",
              lineHeight: "1.5",
              minHeight: "38px",
              maxHeight: "120px",
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 38, height: 38,
              borderRadius: "50%",
              background: loading || !input.trim() ? "#b0cfe0" : "#0099cc",
              border: "none",
              cursor: loading || !input.trim() ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}