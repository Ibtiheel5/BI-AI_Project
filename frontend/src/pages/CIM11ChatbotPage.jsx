// frontend/src/pages/CIM11ChatbotPage.jsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

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
    if (text.startsWith("❌") || text.startsWith("😞") || text.startsWith("⚠️")) {
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
      marginBottom: "16px",
    }}>
      {!isUser && (
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #0099cc, #0077aa)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: 700,
          flexShrink: 0, marginRight: "12px", marginTop: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}>
          CIM
        </div>
      )}
      <div style={{
        maxWidth: "70%",
        padding: "12px 18px",
        borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
        background: isUser ? "#0099cc" : "#ffffff",
        color: isUser ? "#ffffff" : "#1a1a1a",
        border: isUser ? "none" : "1px solid #e2e8f0",
        fontSize: "14px",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}>
        {isUser ? msg.content : renderContent(msg.content)}
      </div>
      {isUser && (
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "#e2e8f0",
          color: "#475569",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 600,
          flexShrink: 0, marginLeft: "12px", marginTop: "4px",
        }}>
          👨‍⚕️
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "linear-gradient(135deg, #0099cc, #0077aa)",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 700, flexShrink: 0,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}>
        CIM
      </div>
      <div style={{
        display: "flex", gap: 6, padding: "14px 20px",
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: "4px 18px 18px 18px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: "50%", background: "#0099cc",
            display: "inline-block",
            animation: "cim-bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function CIM11ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Bonjour Docteur ${user?.full_name || user?.name || "Médecin"} 👋\n\nJe suis votre assistant médical spécialisé dans la **CIM-11** (Classification Internationale des Maladies, 11e révision).\n\nPosez-moi toutes vos questions sur :\n• Les codes diagnostiques CIM-11\n• Les catégories nosologiques\n• Les critères de classification\n• Les définitions cliniques\n• Les comparaisons avec la CIM-10\n\nComment puis-je vous aider aujourd'hui ?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const token = localStorage.getItem("medai-token");
  
  // État pour stocker l'heure du dernier message (anti-rate-limit)
  const [lastRequestTime, setLastRequestTime] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    // Délai minimum de 2 secondes entre les requêtes pour éviter rate limit
    const now = Date.now();
    if (lastRequestTime && now - lastRequestTime < 2000) {
      const waitTime = 2000 - (now - lastRequestTime);
      console.log(`⏳ Attente de ${waitTime}ms avant d'envoyer...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    setLastRequestTime(Date.now());

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
          doctor_name: user?.name
        }),
      });

      if (res.status === 401) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      if (res.status === 403) {
        throw new Error("Accès non autorisé. Compte médecin requis.");
      }

      if (res.status === 429) {
        throw new Error("rate_limit");
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erreur ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply ?? "Une erreur s'est produite.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      
    } catch (error) {
      console.error("Chat error:", error);
      let errorMessage = error.message || "Erreur de connexion. Veuillez réessayer.";
      
      // Messages d'erreur personnalisés
      if (errorMessage === "rate_limit" || errorMessage.includes("429")) {
        errorMessage = "⚠️ L'assistant est momentanément saturé. Veuillez patienter 10 secondes avant de réessayer.";
      } else if (errorMessage.includes("Configuration") || errorMessage.includes("clé")) {
        errorMessage = "⚙️ Service en configuration. Veuillez réessayer plus tard.";
      } else if (errorMessage.includes("Session expirée")) {
        errorMessage = "🔐 Session expirée. Veuillez vous reconnecter.";
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
    <div style={{ 
      minHeight: "calc(100vh - 64px)", 
      background: "linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: "32px 24px",
    }}>
      <style>{`
        @keyframes cim-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        
        {/* Header de la page */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: 32,
          animation: "fadeIn 0.5s ease"
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #0099cc, #0077aa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 20px rgba(0,153,204,0.3)"
          }}>
            <span style={{ fontSize: 36 }}>📚</span>
          </div>
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: 800, 
            color: "#0a2647",
            marginBottom: 8,
            letterSpacing: "-0.5px"
          }}>
            Assistant CIM-11
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px" }}>
            Classification Internationale des Maladies · 11e révision (OMS)
          </p>
          <div style={{
            display: "inline-flex",
            gap: 8,
            marginTop: 12,
            padding: "6px 12px",
            background: "#e2e8f0",
            borderRadius: 20,
            fontSize: "12px",
            color: "#475569"
          }}>
            <span>🔬 Médical</span>
            <span>•</span>
            <span>📖 Base OMS</span>
            <span>•</span>
            <span>🇫🇷 Français</span>
          </div>
        </div>

        {/* Zone de chat */}
        <div style={{
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}>
          
          {/* Messages */}
          <div style={{ 
            height: "500px", 
            overflowY: "auto", 
            padding: "24px",
            background: "#fafcff"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ animation: "fadeIn 0.3s ease" }}>
                <MessageBubble msg={msg} />
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
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
                fontSize: "12px", 
                color: "#64748b", 
                marginBottom: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Questions suggérées
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      fontSize: "13px",
                      color: "#0077aa",
                      background: "#f0f9ff",
                      border: "1px solid #b8e1f5",
                      padding: "8px 16px",
                      borderRadius: "24px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#e0f2fe";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#f0f9ff";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {s}
                  </button>
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
                borderRadius: "16px",
                padding: "12px 18px",
                fontSize: "14px",
                fontFamily: "inherit",
                background: "#fff",
                color: "#1a1a1a",
                outline: "none",
                lineHeight: "1.5",
                minHeight: "48px",
                maxHeight: "120px",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#0099cc"}
              onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                minWidth: 48, height: 48,
                borderRadius: "16px",
                background: loading || !input.trim() ? "#cbd5e1" : "#0099cc",
                border: "none",
                cursor: loading || !input.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.background = "#0077aa";
                }
              }}
              onMouseLeave={e => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.background = "#0099cc";
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: "12px",
          color: "#94a3b8"
        }}>
          <p>⚠️ L'assistant est basé sur la CIM-11 (OMS). Les réponses sont générées par IA et doivent être vérifiées par un professionnel.</p>
        </div>
      </div>
    </div>
  );
}