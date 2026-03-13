// components/ExplainableAI.jsx — Version chat-bulles avec hauteur ajustée
import { useState, useEffect, useRef } from "react";
import { MedicalIcons } from "./MedicalIcons";

// ── Severity avec codes couleur médicaux ─────────────────────────
const SEVERITY = {
  COVID: { color: "#D62828", label: "URGENCE VITALE", bg: "#fee2e2", icon: "🚨" },
  Pneumonia: { color: "#D62828", label: "URGENCE VITALE", bg: "#fee2e2", icon: "🚨" },
  Pneumothorax: { color: "#D62828", label: "URGENCE VITALE", bg: "#fee2e2", icon: "🚨" },
  Edema: { color: "#D62828", label: "URGENCE VITALE", bg: "#fee2e2", icon: "🚨" },
  Mass: { color: "#D62828", label: "URGENCE ONCOLOGIQUE", bg: "#fee2e2", icon: "⚠️" },
  Cardiomegaly: { color: "#FF9F1C", label: "SURVEILLANCE CARDIOLOGIQUE", bg: "#fff3e0", icon: "❤️" },
  Emphysema: { color: "#FF9F1C", label: "SURVEILLANCE PNEUMOLOGIQUE", bg: "#fff3e0", icon: "🫁" },
  Meningioma: { color: "#FF9F1C", label: "SURVEILLANCE NEUROLOGIQUE", bg: "#fff3e0", icon: "🧠" },
  "No Finding": { color: "#00A86B", label: "NORMAL", bg: "#e6f7e6", icon: "✅" },
  Normal: { color: "#00A86B", label: "NORMAL", bg: "#e6f7e6", icon: "✅" },
  Malignant: { color: "#D62828", label: "URGENCE ONCOLOGIQUE", bg: "#fee2e2", icon: "⚠️" },
  Glioma: { color: "#D62828", label: "URGENCE NEUROLOGIQUE", bg: "#fee2e2", icon: "🧠" },
  Benign: { color: "#2D5F9E", label: "BÉNIN", bg: "#e6f0fa", icon: "🔵" },
};

// ── Parse sections markdown ───────────────────────────────────
function parseSections(text) {
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      currentSection = line.replace('## ', '').trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n').trim()
    });
  }

  return sections;
}

// ── Composant pour le texte riche avec formatage ──────────────
function ChatBubbleText({ text, isUser = false, isLast = false, streaming = false }) {
  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0A2647; font-weight: 700;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: #2D5F9E; font-style: italic;">$1</em>')
    .replace(/`(.*?)`/g, '<code style="background: #F1F5F9; color: #D62828; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.8rem;">$1</code>')
    .split('\n').join('<br/>');

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
      width: '100%',
    }}>
      {!isUser && (
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#2D5F9E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
          marginRight: 8,
          flexShrink: 0,
        }}>
          🧠
        </div>
      )}
      
      <div style={{
        maxWidth: isUser ? '80%' : 'calc(100% - 44px)',
        padding: '14px 18px',
        background: isUser ? '#2D5F9E' : '#F8FAFC',
        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
        border: isUser ? 'none' : '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
      }}>
        <span 
          style={{ 
            lineHeight: 1.7, 
            fontSize: '0.9rem', 
            color: isUser ? 'white' : '#334155',
            fontFamily: 'Inter, sans-serif',
            display: 'block',
          }}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
        
        {streaming && isLast && !isUser && (
          <span style={{
            display: 'inline-block',
            width: 2,
            height: '1.2em',
            background: '#2D5F9E',
            marginLeft: 4,
            verticalAlign: 'middle',
            animation: 'cursorBlink 1s step-end infinite',
          }} />
        )}
        
        {/* Time stamp */}
        <div style={{
          fontSize: '0.6rem',
          color: isUser ? 'rgba(255,255,255,0.6)' : '#94A3B8',
          marginTop: 8,
          textAlign: 'right',
        }}>
          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {isUser && (
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#0A2647',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
          marginLeft: 8,
          flexShrink: 0,
        }}>
          👤
        </div>
      )}
    </div>
  );
}

// ── Section Card — clinical header style ─────────────────────
function ChatSectionCard({ section, index, isLast, streaming }) {
  const sectionIcons = {
    'Définition et présentation clinique': '🔬',
    'Analyse critique du résultat IA': '📊',
    'Sémiologie radiologique': '🫁',
    'Sémiologie radiologique — Signes détectés': '🫁',
    'Conduite à tenir et prise en charge': '⚕️',
    'Limites, biais et précautions': '⚠️',
    'Limites, biais et précautions d\'interprétation': '⚠️',
  };

  const icon = sectionIcons[section.title] || '📌';

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Clinical section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: 'linear-gradient(90deg, #EFF6FF, #F8FAFC)',
        borderLeft: '3px solid #2D5F9E',
        borderRadius: '0 8px 8px 0',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: '0.85rem' }}>{icon}</span>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#2D5F9E',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {section.title}
        </span>
      </div>

      {/* Section content as AI message */}
      <div style={{ marginLeft: 12 }}>
        <ChatBubbleText 
          text={section.content}
          isUser={false}
          isLast={isLast}
          streaming={streaming}
        />
      </div>
    </div>
  );
}

// ── Floating Chat Button ──────────────────────────────────────
function ChatButton({ isOpen, onClick, hasNotification }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0A2647, #2D5F9E)',
        border: 'none',
        boxShadow: '0 4px 20px rgba(10, 38, 71, 0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'transform 0.2s ease',
        animation: hasNotification ? 'pulse 2s infinite' : 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {isOpen ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
        </svg>
      ) : (
        <>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {hasNotification && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#D62828',
              border: '2px solid white',
            }} />
          )}
        </>
      )}
    </button>
  );
}

// ── Chat Window ───────────────────────────────────────────────
function ChatWindow({ result, explainText, explaining, onClose }) {
  const [sections, setSections] = useState([]);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!explainText) return;
    const parsed = parseSections(explainText);
    if (parsed.length > 0) {
      setSections(parsed);
    }
  }, [explainText]);

  useEffect(() => {
    // Scroll to bottom when new content arrives
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [explainText, sections]);

  if (!result || result.out_of_domain) return null;

  const severity = SEVERITY[result.prediction] || { 
    color: "#2D5F9E", 
    label: "ANALYSE", 
    bg: "#e6f0fa",
    icon: "🔍"
  };

  const confidence = result.confidence * 100;

  return (
    <div style={{
      position: 'fixed',
      bottom: 100,
      right: 24,
      width: 450,
      height: '70vh',
      maxHeight: 700,
      background: 'white',
      borderRadius: 20,
      boxShadow: '0 20px 40px -10px rgba(10, 38, 71, 0.2)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 999,
      animation: 'slideUp 0.3s ease',
    }}>
      {/* Chat Header */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #F8FAFC, white)',
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: severity.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
          }}>
            {severity.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: severity.color, fontWeight: 700 }}>
              AIDE AU DIAGNOSTIC — IA MÉDICALE
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0A2647' }}>
              Rapport IA · {result.prediction}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '4px 10px',
            background: `${severity.color}10`,
            borderRadius: 20,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: severity.color,
          }}>
            {confidence.toFixed(0)}%
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 4,
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Messages - Scrollable area */}
      <div ref={chatContainerRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        background: '#FFFFFF',
      }}>
        {/* Welcome message */}
        <ChatBubbleText 
          text="Système d'aide au diagnostic — rapport d'analyse IA. Les données ci-dessous sont destinées à votre usage clinique."
          isUser={false}
        />

        {/* Diagnosis summary */}
        <div style={{ marginBottom: 16 }}>
          <ChatBubbleText 
            text={`**Diagnostic principal :** ${result.prediction}`}
            isUser={true}
          />
          <div style={{ marginLeft: 44 }}>
            <ChatBubbleText 
              text={`Score de confiance du modèle : **${confidence.toFixed(1)}%** — ${severity.label}. Corrélation clinico-radiologique recommandée.`}
              isUser={false}
            />
          </div>
        </div>

        {/* Sections */}
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <ChatSectionCard
              key={index}
              section={section}
              index={index}
              isLast={index === sections.length - 1}
              streaming={explaining}
            />
          ))
        ) : (
          explaining && (
            <div style={{ marginLeft: 44 }}>
              <ChatBubbleText 
                text="Génération du rapport clinique IA en cours..."
                isUser={false}
                streaming={true}
                isLast={true}
              />
            </div>
          )
        )}

        {/* Typing indicator */}
        {explaining && sections.length === 0 && (
          <div style={{ marginLeft: 44, display: 'flex', gap: 4, marginBottom: 16 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#2D5F9E',
              animation: 'typing 1s infinite',
            }} />
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#2D5F9E',
              animation: 'typing 1s infinite 0.2s',
            }} />
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#2D5F9E',
              animation: 'typing 1s infinite 0.4s',
            }} />
          </div>
        )}

        {/* Done message */}
        {!explaining && sections.length > 0 && (
          <ChatBubbleText 
            text="⚠️ **Avis du système :** Ce rapport constitue une aide à la décision médicale. La responsabilité diagnostique et thérapeutique reste celle du clinicien. Résultats à confronter au tableau clinique et au contexte patient."
            isUser={false}
          />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Footer */}
      <div style={{
        padding: 12,
        borderTop: '1px solid #e2e8f0',
        background: '#F8FAFC',
        borderRadius: '0 0 20px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img 
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop"
            alt="Doctor"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '2px solid white',
            }}
          />
          <div style={{ fontSize: '0.7rem' }}>
            <div style={{ fontWeight: 600, color: '#0A2647' }}>Modèle certifié CE IIa</div>
            <div style={{ color: '#00A86B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00A86B' }} />
              Analyse temps réel
            </div>
          </div>
        </div>
        <button style={{
          padding: '6px 12px',
          background: '#2D5F9E',
          border: 'none',
          borderRadius: 20,
          color: 'white',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          Exporter le rapport
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes typing {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-5px); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// ── Main Component with Toggle ────────────────────────────────
export default function ExplainableAI({ result, explainText = "", explaining = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewContent, setHasNewContent] = useState(false);

  // Show notification when new content arrives while chat is closed
  useEffect(() => {
    if (explainText && !isOpen) {
      setHasNewContent(true);
    }
  }, [explainText, isOpen]);

  // Reset notification when opening
  useEffect(() => {
    if (isOpen) {
      setHasNewContent(false);
    }
  }, [isOpen]);

  if (!result || result.out_of_domain) return null;

  return (
    <>
      {/* Chat Button */}
      <ChatButton 
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        hasNotification={hasNewContent}
      />

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          result={result}
          explainText={explainText}
          explaining={explaining}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}