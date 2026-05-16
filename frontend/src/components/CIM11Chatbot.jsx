// frontend/src/components/CIM11Chatbot.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  "Codes pour le diabète de type 2",
  "Classification des tumeurs malignes",
  "Critères troubles dépressifs",
  "Maladies cardiovasculaires ischémiques",
  "Différence CIM-10 vs CIM-11",
  "Codes pour l'hypertension artérielle",
  "Classification des cancers du poumon",
  "Critères du trouble anxieux généralisé",
];

// SVG Icons (pas d'emojis)
const Icons = {
  Book: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Bot: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  ),
  Lock: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Database: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  France: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20M2 12h20" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7z" />
    </svg>
  ),
  Clock: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

function CodeBadge({ code, category = "code" }) {
  const colors = {
    diagnostic: { bg: "#E0F2FE", color: "#0284C7" },
    code: { bg: "#dff0f8", color: "#0077aa" },
    warning: { bg: "#FEF3C7", color: "#D97706" },
    info: { bg: "#EDE9FE", color: "#6D28D9" },
    success: { bg: "#D1FAE5", color: "#059669" }
  };
  const style = colors[category] || colors.code;
  
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      style={{
        display: "inline-block",
        fontFamily: "monospace",
        fontSize: "11px",
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        padding: "3px 10px",
        borderRadius: "6px",
        margin: "0 3px",
        letterSpacing: "0.3px",
        border: `1px solid ${style.color}30`,
        cursor: "pointer",
      }}
    >
      {code}
    </motion.span>
  );
}

function MessageBubble({ msg, index }) {
  const isUser = msg.role === "user";

  const renderContent = (text) => {
    if (text.startsWith("❌") || text.startsWith("😞") || text.startsWith("⚠️")) {
      return <span style={{ color: "#dc2626", fontWeight: 500 }}>{text}</span>;
    }
    
    const codePattern = /\[([A-Z0-9.]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codePattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      let category = "code";
      const codeValue = match[1];
      if (codeValue.match(/^[ABCE]/)) category = "diagnostic";
      if (codeValue.match(/^[56]/)) category = "warning";
      if (codeValue.match(/^[XYZ]/)) category = "info";
      parts.push({ type: "code", content: match[1], category });
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.slice(lastIndex) });
    }
    
    return parts.map((part, i) => {
      if (part.type === "code") {
        return <CodeBadge key={i} code={part.content} category={part.category} />;
      }
      let formatted = part.content;
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0A2647;">$1</strong>');
      formatted = formatted.replace(/^• /gm, '<span style="color:#0099cc; font-weight:700;">•</span> ');
      formatted = formatted.replace(/\n/g, '<br/>');
      return <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "24px",
      }}
    >
      {!isUser && (
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, #0099cc, #0077aa)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginRight: "14px", marginTop: "4px",
          boxShadow: "0 4px 12px rgba(0,153,204,0.3)",
        }}>
          <Icons.Bot />
        </div>
      )}
      
      <div style={{
        maxWidth: isUser ? "70%" : "80%",
        padding: "12px 18px",
        borderRadius: isUser ? "20px 4px 20px 20px" : "4px 20px 20px 20px",
        background: isUser ? "linear-gradient(135deg, #0099cc, #0077aa)" : "#ffffff",
        color: isUser ? "#ffffff" : "#1a1a1a",
        border: isUser ? "none" : "1px solid #e2e8f0",
        fontSize: "14px",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
        boxShadow: isUser ? "0 2px 10px rgba(0,153,204,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        {isUser ? msg.content : renderContent(msg.content)}
        
        <div style={{
          fontSize: "0.55rem",
          color: isUser ? "rgba(255,255,255,0.5)" : "#94A3B8",
          marginTop: "6px",
          textAlign: isUser ? "right" : "left",
          display: "flex",
          alignItems: "center",
          gap: 4,
          justifyContent: isUser ? "flex-end" : "flex-start"
        }}>
          <Icons.Clock />
          {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      
      {isUser && (
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
          color: "#475569",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginLeft: "14px", marginTop: "4px",
        }}>
          <Icons.User />
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "linear-gradient(135deg, #0099cc, #0077aa)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,153,204,0.3)",
      }}>
        <Icons.Bot />
      </div>
      <div style={{
        display: "flex", gap: 8, padding: "12px 20px",
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: "4px 20px 20px 20px",
      }}>
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay }}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#0099cc",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CIM11Chatbot({ doctor, height = "600px", style = {} }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Bonjour Docteur ${doctor?.name ?? doctor?.full_name ?? "Médecin"} 👋\n\nJe suis votre **assistant médical CIM-11**, spécialisé dans la **Classification Internationale des Maladies (11e révision)** publiée par l'OMS.\n\n**Je peux vous aider avec :**\n• Codes diagnostiques CIM-11\n• Catégories nosologiques\n• Critères de classification\n• Définitions cliniques\n• Comparaisons CIM-10 vs CIM-11\n\n**Comment puis-je vous aider aujourd'hui ?**`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const token = localStorage.getItem("medai-token");

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
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

      if (res.status === 401) throw new Error("Session expirée");
      if (res.status === 403) throw new Error("Accès non autorisé");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erreur ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply ?? "Une erreur s'est produite.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      
    } catch (error) {
      let errorMessage = error.message || "Erreur de connexion";
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
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={{
        display: "flex",
        flexDirection: "column",
        height: height,
        minHeight: "550px",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        overflow: "hidden",
        background: "#f8fafc",
        fontFamily: "'Inter', system-ui, sans-serif",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        ...style,
      }}>
        
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "18px 24px",
          background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "14px",
            background: "linear-gradient(135deg, #FFD700, #D4A500)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0A2647",
            boxShadow: "0 4px 15px rgba(255,215,0,0.3)",
          }}>
            <Icons.Book />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              Assistant CIM-11
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{
                display: "inline-block", width: 8, height: 8,
                borderRadius: "50%", background: "#22c55e",
                animation: "pulse 2s infinite",
              }} />
              Base de données OMS · 11e révision
            </div>
          </div>
          <div style={{
            padding: "6px 16px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "20px",
            fontSize: "12px",
            color: "#FFD700",
            fontWeight: 600,
            border: "1px solid rgba(255,215,0,0.3)",
          }}>
            Dr. {doctor?.name?.split(" ")[0] ?? doctor?.full_name?.split(" ")[0] ?? "Méd"}
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "24px 28px",
          background: "#f8fafc",
          minHeight: 0,
          height: 0,
        }}>
          {messages.map((msg, i) => (
            <MessageBubble 
              key={i} 
              msg={msg} 
              index={i}
            />
          ))}
          {loading && <TypingIndicator />}
        </div>

        {/* Suggestions */}
        {showSuggestions && messages.length === 1 && (
          <div style={{
            padding: "16px 24px",
            background: "#fff",
            borderTop: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
          }}>
            <div style={{ 
              fontSize: "11px", 
              color: "#64748b", 
              marginBottom: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <Icons.Sparkles />
              QUESTIONS SUGGÉRÉES
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {SUGGESTIONS.map((s, idx) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => send(s)}
                  style={{
                    fontSize: "12px",
                    color: "#0077aa",
                    background: "#f0f9ff",
                    border: "1px solid #b8e1f5",
                    padding: "8px 18px",
                    borderRadius: "30px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    background: "#e0f2fe",
                    borderColor: "#0099cc",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 12,
          padding: "20px 24px",
          background: "#fff",
          borderTop: "1px solid #e2e8f0",
          flexShrink: 0,
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e); }}
            onKeyDown={handleKey}
            placeholder="Posez votre question sur la CIM-11..."
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "2px solid #e2e8f0",
              borderRadius: "24px",
              padding: "14px 20px",
              fontSize: "14px",
              fontFamily: "inherit",
              background: "#f8fafc",
              color: "#1a1a1a",
              outline: "none",
              lineHeight: "1.5",
              minHeight: "52px",
              maxHeight: "120px",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "#0099cc";
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,153,204,0.1)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          
          <motion.button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            whileHover={!loading && input.trim() ? { scale: 1.05 } : {}}
            whileTap={!loading && input.trim() ? { scale: 0.95 } : {}}
            style={{
              width: 52, height: 52,
              borderRadius: "26px",
              background: loading || !input.trim() ? "#cbd5e1" : "linear-gradient(135deg, #0099cc, #0077aa)",
              border: "none",
              cursor: loading || !input.trim() ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: !loading && input.trim() ? "0 4px 15px rgba(0,153,204,0.3)" : "none",
            }}
          >
            <Icons.Send />
          </motion.button>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: "10px 24px",
          background: "#f1f5f9",
          borderTop: "1px solid #e2e8f0",
          fontSize: "11px",
          color: "#94a3b8",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          flexShrink: 0,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icons.Lock /> Discussion confidentielle</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icons.Database /> Base OMS CIM-11</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icons.France /> Support français</span>
        </div>
      </div>
    </>
  );
}