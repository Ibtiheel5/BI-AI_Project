// src/pages/patient/MessagesPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// ===== THEME COLORS (Navy/Gold like UpcomingCallsPage) =====
const THEME_COLORS = {
  navy: "#0F1B2D",
  navyLight: "#1A2D4A",
  navyMid: "#243B5C",
  gold: "#FFD700",
  goldDk: "#D4A500",
  goldLt: "rgba(255, 215, 0, 0.08)",
  goldBorder: "rgba(255, 215, 0, 0.2)",
  bg: "#F0F4FA",
  card: "#FFFFFF",
  text: "#1E293B",
  text2: "#475569",
  textMuted: "#94A3B8",
  border: "rgba(30, 60, 110, 0.08)",
  borderLight: "rgba(30, 60, 110, 0.06)",
  success: "#10B981",
  successBg: "rgba(16, 185, 129, 0.1)",
  surface: "#FFFFFF",
  bgAlt: "#F8FAFC",
  accent: "#0F1B2D",
  accentSoft: "rgba(15, 27, 45, 0.06)",
  white: "#FFFFFF",
  danger: "#EF4444",
  dangerBg: "rgba(239, 68, 68, 0.1)"
};

// ===== SVG ICONS =====
const SvgIcon = ({ children, size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const MessageIcons = {
  Send: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </SvgIcon>
  ),
  User: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </SvgIcon>
  ),
  Doctor: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
    </SvgIcon>
  ),
  Search: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </SvgIcon>
  ),
  ArrowLeft: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <polyline points="15 18 9 12 15 6"/>
    </SvgIcon>
  ),
  Refresh: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M23 4v6h-6"/>
      <path d="M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
    </SvgIcon>
  ),
  Lock: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </SvgIcon>
  ),
  CheckDouble: ({ size = 14, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <polyline points="18 6 11 13 7 9"/>
      <polyline points="22 6 15 13 11 9"/>
    </SvgIcon>
  ),
  Paperclip: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </SvgIcon>
  ),
  File: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </SvgIcon>
  ),
  Image: ({ size = 18, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </SvgIcon>
  ),
  X: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </SvgIcon>
  ),
  Download: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </SvgIcon>
  )
};

// ===== FILE PREVIEW COMPONENT =====
const FilePreview = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const fileSize = (file.size / 1024).toFixed(1);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      background: THEME_COLORS.goldLt,
      border: `1px solid ${THEME_COLORS.goldBorder}`,
      borderRadius: 12,
      marginBottom: 8,
      position: "relative"
    }}>
      {isImage ? (
        <img 
          src={URL.createObjectURL(file)} 
          alt="preview" 
          style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
        />
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: `linear-gradient(135deg, ${THEME_COLORS.navy}, ${THEME_COLORS.navyLight})`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <MessageIcons.File size={20} color="white" />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: THEME_COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </div>
        <div style={{ fontSize: "0.7rem", color: THEME_COLORS.textMuted }}>
          {fileSize} KB
        </div>
      </div>
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          borderRadius: "50%",
          transition: "background 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <MessageIcons.X size={16} color={THEME_COLORS.danger} />
      </button>
    </div>
  );
};

// ===== ATTACHMENT DISPLAY IN MESSAGE =====
const MessageAttachment = ({ attachment }) => {
  const isImage = attachment.file_type?.startsWith('image/') || 
                  attachment.content_type?.startsWith('image/') ||
                  attachment.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const fileUrl = attachment.file_url || 
                  attachment.url || 
                  (attachment.stored_path ? `/uploads/consultations/messages/${attachment.stored_path.split('/').pop()}` : null) ||
                  `${API}/consultations/files/messages/${attachment.filename}`;

  if (isImage && fileUrl) {
    return (
      <div style={{ marginTop: 8 }}>
        <img 
          src={fileUrl} 
          alt={attachment.filename || "Image"}
          style={{ 
            maxWidth: "100%", 
            maxHeight: 200, 
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
          onClick={() => window.open(fileUrl, '_blank')}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <a href="${fileUrl}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,0.1);border-radius:10px;text-decoration:none;color:inherit;">
                <span>📎</span>
                <span style="font-size:0.8rem;">${attachment.filename || "Fichier"}</span>
                <span>⬇️</span>
              </a>
            `;
          }}
        />
      </div>
    );
  }

  return (
    <a href={fileUrl || "#"} target="_blank" rel="noopener noreferrer"
       style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                background: "rgba(255,255,255,0.1)", borderRadius: 10, marginTop: 8,
                textDecoration: "none", color: "inherit" }}>
      <MessageIcons.File size={16} />
      <span style={{ fontSize: "0.8rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
        {attachment.filename || "Fichier"}
      </span>
      <MessageIcons.Download size={14} />
    </a>
  );
};

// ===== MESSAGE BUBBLE =====
const MessageBubble = ({ message, isCurrentUser }) => {
  const time = new Date(message.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const date = new Date(message.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short"
  });

  const hasAttachment = message.attachments && message.attachments.length > 0;

  return (
    <div style={{
      display: "flex",
      justifyContent: isCurrentUser ? "flex-end" : "flex-start",
      marginBottom: 20,
      animation: "msgSlideIn 0.3s ease forwards",
      opacity: 0,
      transform: isCurrentUser ? "translateX(20px)" : "translateX(-20px)"
    }}>
      <div style={{
        maxWidth: "70%",
        display: "flex",
        flexDirection: "column",
        alignItems: isCurrentUser ? "flex-end" : "flex-start"
      }}>
        {!isCurrentUser && (
          <div style={{
            fontSize: "0.7rem",
            color: THEME_COLORS.textMuted,
            marginBottom: 4,
            marginLeft: 12,
            fontWeight: 500
          }}>
            {message.sender_name}
          </div>
        )}
        <div style={{
          padding: hasAttachment ? "12px 12px 8px" : "14px 20px",
          borderRadius: 20,
          background: isCurrentUser 
            ? `linear-gradient(135deg, ${THEME_COLORS.navy}, ${THEME_COLORS.navyLight})` 
            : THEME_COLORS.card,
          color: isCurrentUser ? "white" : THEME_COLORS.text,
          fontSize: "0.9rem",
          lineHeight: 1.5,
          boxShadow: isCurrentUser 
            ? "0 4px 16px rgba(15, 27, 45, 0.2)" 
            : "0 2px 8px rgba(0, 0, 0, 0.04)",
          borderBottomRightRadius: isCurrentUser ? 4 : 20,
          borderBottomLeftRadius: isCurrentUser ? 20 : 4,
          wordBreak: "break-word",
          border: isCurrentUser ? "none" : `1px solid ${THEME_COLORS.border}`,
          position: "relative",
          transition: "all 0.2s ease"
        }}>
          {message.content && <div>{message.content}</div>}
          {hasAttachment && message.attachments.map((att, idx) => (
            <MessageAttachment key={idx} attachment={att} />
          ))}
        </div>
        <div style={{
          fontSize: "0.65rem",
          color: THEME_COLORS.textMuted,
          marginTop: 6,
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>{time}</span>
          <span style={{ color: THEME_COLORS.border }}>·</span>
          <span>{date}</span>
          {isCurrentUser && message.is_read && (
            <span style={{ 
              color: THEME_COLORS.success, 
              display: "flex", 
              alignItems: "center", 
              gap: 3,
              fontWeight: 500
            }}>
              <MessageIcons.CheckDouble size={12} color={THEME_COLORS.success} />
              Lu
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== CONVERSATION ITEM (Style carte UpcomingCallsPage) =====
const ConversationItem = ({ conversation, isActive, onClick, currentUserId }) => {
  const lastMessage = conversation.last_message;
  const otherUser = conversation.participants?.find(p => p.id !== currentUserId);
  const unreadCount = conversation.unread_count || 0;

  const getAvatarInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "D";
  };

  const formatLastMessageTime = (date) => {
    if (!date) return "";
    const msgDate = new Date(date);
    const today = new Date();
    if (msgDate.toDateString() === today.toDateString()) {
      return msgDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    return msgDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const lastMsgContent = lastMessage?.content || "";
  const hasAttachment = lastMessage?.attachments && lastMessage.attachments.length > 0;
  const displayContent = hasAttachment 
    ? (lastMsgContent ? lastMsgContent + " 📎" : "📎 Pièce jointe") 
    : (lastMsgContent || "Aucun message");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      style={{
        padding: "16px 20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        background: isActive 
          ? `linear-gradient(135deg, ${THEME_COLORS.navy}, ${THEME_COLORS.navyLight})` 
          : "transparent",
        borderBottom: `1px solid ${THEME_COLORS.borderLight}`,
        position: "relative",
        borderLeft: isActive ? `3px solid ${THEME_COLORS.gold}` : "3px solid transparent"
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = THEME_COLORS.bgAlt;
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 16,
        background: isActive 
          ? `linear-gradient(135deg, ${THEME_COLORS.gold}, ${THEME_COLORS.goldDk})`
          : `linear-gradient(135deg, ${THEME_COLORS.navy}, ${THEME_COLORS.navyLight})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isActive ? THEME_COLORS.navy : "white",
        fontWeight: 700,
        fontSize: "1rem",
        flexShrink: 0,
        boxShadow: isActive ? "0 0 0 3px rgba(255, 215, 0, 0.3)" : "none",
        transition: "all 0.3s ease"
      }}>
        {getAvatarInitial(otherUser?.full_name || otherUser?.name || "Médecin")}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4
        }}>
          <span style={{
            fontWeight: 600,
            fontSize: "0.9rem",
            color: isActive ? "white" : THEME_COLORS.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color 0.2s"
          }}>
            {otherUser?.full_name || otherUser?.name || "Médecin"}
          </span>
          {lastMessage && (
            <span style={{
              fontSize: "0.65rem",
              color: isActive ? "rgba(255,255,255,0.7)" : THEME_COLORS.textMuted,
              flexShrink: 0,
              marginLeft: 8,
              fontWeight: 500
            }}>
              {formatLastMessageTime(lastMessage.created_at || lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{
            fontSize: "0.78rem",
            color: unreadCount > 0 
              ? (isActive ? "white" : THEME_COLORS.text) 
              : (isActive ? "rgba(255,255,255,0.6)" : THEME_COLORS.textMuted),
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: unreadCount > 0 ? 600 : 400,
            transition: "color 0.2s"
          }}>
            {displayContent}
          </span>
          {unreadCount > 0 && (
            <span style={{
              flexShrink: 0,
              marginLeft: 8,
              background: isActive ? THEME_COLORS.gold : `linear-gradient(135deg, ${THEME_COLORS.navy}, ${THEME_COLORS.navyLight})`,
              color: isActive ? THEME_COLORS.navy : "white",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 12,
              minWidth: 20,
              textAlign: "center"
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        {conversation.consultation_id && (
          <div style={{
            fontSize: "0.6rem",
            color: isActive ? THEME_COLORS.gold : THEME_COLORS.goldDk,
            marginTop: 6,
            fontWeight: 500,
            letterSpacing: "0.5px"
          }}>
            Consultation #{conversation.consultation_id}
          </div>
        )}
      </div>
    </motion.div>
  );
};
// ===== MAIN COMPONENT =====
export const MessagesPage = ({ user, consultations, notifications, onNavigate }) => {
  const { user: authUser } = useAuth();
  const token = localStorage.getItem("medai-token");

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const shouldScrollToBottom = useRef(false);
  const userScrolledUp = useRef(false);
  const lastMessagesHash = useRef("");
  const isFirstLoad = useRef(true);

  const currentUserId = authUser?.id;
  const userRole = authUser?.role;

  // ===== SCROLL TO BOTTOM =====
  const scrollToBottom = useCallback((behavior = "auto", delay = 100) => {
    const attemptScroll = (ms) => {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
        }
      }, ms);
    };

    attemptScroll(delay);
    attemptScroll(delay + 50);
    attemptScroll(delay + 150);
  }, []);

  // ===== DETECT USER SCROLL POSITION =====
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 100;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      userScrolledUp.current = !isNearBottom;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeConversation]);

  // ===== SCROLL EFFECT =====
  useEffect(() => {
    if (shouldScrollToBottom.current) {
      scrollToBottom("auto", 100);
      shouldScrollToBottom.current = false;
    }
  }, [messages, scrollToBottom]);

  // ===== FETCH CONVERSATIONS =====
  const fetchConversations = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API}/consultations/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const convs = data.conversations || [];
        setConversations(convs);

        if (convs.length === 0) {
          await fetchConversationsFallback();
        }
      } else if (response.status === 404) {
        await fetchConversationsFallback();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur API conversations:", errorData);
        setError(errorData.detail || "Erreur lors du chargement des conversations");
        await fetchConversationsFallback();
      }
    } catch (err) {
      console.error("Erreur réseau conversations:", err);
      await fetchConversationsFallback();
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ===== FALLBACK =====
  const fetchConversationsFallback = useCallback(async () => {
    if (!token || !userRole) return;

    try {
      let endpoint;
      if (userRole === "Patient") {
        endpoint = `${API}/consultations/my`;
      } else if (userRole === "Medecin") {
        endpoint = `${API}/consultations/assigned`;
      } else {
        return;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const consults = data.consultations || [];

        const convs = consults
          .filter(c => c.status !== "pending" && c.status !== "rejected")
          .map(c => ({
            id: c.id,
            consultation_id: c.id,
            participants: [
              { 
                id: c.patient_id, 
                full_name: c.patient_name || c.patient_username || "Patient", 
                name: c.patient_name || c.patient_username || "Patient",
                role: "Patient" 
              },
              { 
                id: c.doctor_id, 
                full_name: c.doctor_name || "Médecin", 
                name: c.doctor_name || "Médecin",
                role: "Medecin",
                specialty: c.doctor_specialty || ""
              }
            ],
            last_message: { 
              content: "Cliquez pour voir les messages", 
              created_at: c.updated_at || c.created_at 
            },
            unread_count: 0,
            status: c.status,
            model_key: c.model_key
          }));

        setConversations(convs);
      }
    } catch (err) {
      console.error("Erreur fallback conversations:", err);
    }
  }, [token, userRole]);

  // ===== FETCH MESSAGES =====
  const fetchMessages = useCallback(async (consultationId, silent = false) => {
    if (!token || !consultationId) return;

    try {
      const response = await fetch(`${API}/consultations/${consultationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];

        const newHash = JSON.stringify(newMessages.map(m => `${m.id}-${m.content}-${m.is_read}`));

        if (newHash !== lastMessagesHash.current) {
          lastMessagesHash.current = newHash;
          setMessages(newMessages);

          if (!silent && !userScrolledUp.current && !isFirstLoad.current) {
            shouldScrollToBottom.current = true;
          }
          isFirstLoad.current = false;
        }
      } else if (response.status === 403) {
        setError("Vous n\'avez pas accès à cette conversation");
      } else if (response.status === 404) {
        setError("Conversation introuvable");
      }
    } catch (err) {
      console.error("Erreur chargement messages:", err);
    }
  }, [token]);

  // ===== FILE HANDLING =====
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        setError(`Le fichier ${f.name} dépasse 10MB`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setError("");

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async () => {
    if ((!messageInput.trim() && selectedFiles.length === 0) || !activeConversation || sending) return;

    const consultationId = activeConversation.consultation_id || activeConversation.id;
    if (!consultationId) return;

    const messageContent = messageInput.trim();
    const filesToUpload = [...selectedFiles];

    setSending(true);
    setError("");
    setMessageInput("");
    setSelectedFiles([]);

    const optimisticAttachments = filesToUpload.map((file, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      filename: file.name,
      file_type: file.type,
      file_url: URL.createObjectURL(file),
      size: file.size,
      is_temp: true
    }));

    shouldScrollToBottom.current = true;
    userScrolledUp.current = false;

    const tempMessage = {
      id: Date.now(),
      content: messageContent,
      sender_id: currentUserId,
      sender_name: authUser?.full_name || "Vous",
      sender_role: authUser?.role || "Patient",
      created_at: new Date().toISOString(),
      is_temp: true,
      attachments: optimisticAttachments
    };
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom("auto", 0);

    try {
      const formData = new FormData();
      formData.append("content", messageContent);
      formData.append("msg_type", "text");

      filesToUpload.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API}/consultations/${consultationId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
        mode: "cors",
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erreur ${response.status}`);
      }

      await fetchMessages(consultationId, false);
      fetchConversations();

    } catch (err) {
      console.error("Erreur envoi message:", err);
      setError(err.message || "Erreur lors de l\'envoi");
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  // ===== MARK AS READ =====
  const markAsRead = useCallback(async (consultationId) => {
    if (!token || !consultationId) return;

    try {
      await fetch(`${API}/consultations/${consultationId}/messages/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        mode: "cors",
        credentials: "include"
      });
    } catch (err) {
      console.error("Erreur marquage lu:", err);
    }
  }, [token]);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ===== LOAD MESSAGES WHEN ACTIVE CONVERSATION CHANGES =====
  useEffect(() => {
    if (activeConversation) {
      const consultationId = activeConversation.consultation_id || activeConversation.id;
      lastMessagesHash.current = "";
      userScrolledUp.current = false;
      isFirstLoad.current = true;
      shouldScrollToBottom.current = true;
      fetchMessages(consultationId, false);
      markAsRead(consultationId);
    }
  }, [activeConversation, fetchMessages, markAsRead]);

  // ===== POLLING =====
  useEffect(() => {
    if (activeConversation) {
      const consultationId = activeConversation.consultation_id || activeConversation.id;

      pollingRef.current = setInterval(() => {
        fetchMessages(consultationId, true);
      }, 5000);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [activeConversation, fetchMessages]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const otherUser = conv.participants?.find(p => p.id !== currentUserId);
    const name = otherUser?.full_name || otherUser?.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const otherParticipant = activeConversation?.participants?.find(p => p.id !== currentUserId);
  const otherName = otherParticipant?.full_name || otherParticipant?.name || "Médecin";
  const otherRole = otherParticipant?.role || "Medecin";

  const canSend = messageInput.trim().length > 0 || selectedFiles.length > 0;

  // Stats
  const totalConversations = conversations.length;
  const unreadConversations = conversations.filter(c => (c.unread_count || 0) > 0).length;
  const activeCount = conversations.filter(c => c.status === "accepted" || c.status === "in_progress").length;

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        background: "var(--bg, #F0F4FA)"
      }}>
        <div style={{
          width: 48,
          height: 48,
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
    <div style={{ background: "var(--bg, #F0F4FA)", minHeight: "100vh", paddingBottom: 40 }}>
      {/* ===== HEADER SECTION (Style blanc comme screenshot 2) ===== */}
      <div style={{
        background: "#F0F4FA",
        padding: "32px 40px 24px"
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          {/* Badge optionnel style pill */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 100,
            background: "rgba(255, 215, 0, 0.08)",
            border: "1px solid rgba(255, 215, 0, 0.2)",
            marginBottom: 16
          }}>
            <PatientIcons.Message size={14} color="#D4A500" />
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#D4A500",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Messagerie
            </span>
          </div>

          <h1 style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#0F1B2D",
            margin: 0,
            letterSpacing: "-0.02em",
            marginBottom: 8
          }}>
            Vos <span style={{ color: "#D4A500" }}>conversations</span>
          </h1>
          <p style={{
            fontSize: "0.9rem",
            color: "#94A3B8",
            margin: 0,
            lineHeight: 1.5
          }}>
            Communiquez avec votre équipe médicale en toute confidentialité
          </p>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        {/* Action Bar (Style UpcomingCallsPage) */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              Vos conversations
            </span>
          </div>
          <button
            onClick={fetchConversations}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 28px",
              borderRadius: 100,
              background: "linear-gradient(135deg, #FFD700, #D4A500)",
              color: "#0F1B2D",
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "inherit"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
            }}
          >
            <MessageIcons.Refresh size={18} />
            Actualiser
          </button>
        </div>

        {/* ===== ERROR BANNER ===== */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "14px 20px",
              background: THEME_COLORS.dangerBg,
              border: `1px solid rgba(239, 68, 68, 0.2)`,
              borderRadius: 16,
              marginBottom: 20,
              color: THEME_COLORS.danger,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backdropFilter: "blur(8px)"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem" }}>⚠️</span>
              {error}
            </span>
            <button 
              onClick={() => setError("")} 
              style={{ 
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                color: THEME_COLORS.danger,
                fontSize: "1.2rem",
                padding: "4px",
                borderRadius: "50%",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* ===== CHAT LAYOUT (Style carte UpcomingCallsPage) ===== */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "360px 1fr", 
          gap: 0, 
          borderRadius: 24, 
          overflow: "hidden", 
          border: `1px solid ${THEME_COLORS.border}`, 
          height: "calc(100vh - 340px)", 
          minHeight: 520,
          background: THEME_COLORS.card,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)"
        }}>
          {/* ===== SIDEBAR ===== */}
          <div style={{ 
            borderRight: `1px solid ${THEME_COLORS.borderLight}`, 
            background: THEME_COLORS.card, 
            overflow: "auto",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Search bar */}
            <div style={{ 
              padding: "20px", 
              borderBottom: `1px solid ${THEME_COLORS.borderLight}`,
              background: THEME_COLORS.bgAlt
            }}>
              <div style={{ position: "relative" }}>
                <span style={{ 
                  position: "absolute", 
                  left: 14, 
                  top: "50%", 
                  transform: "translateY(-50%)" 
                }}>
                  <MessageIcons.Search size={16} color={THEME_COLORS.textMuted} />
                </span>
                <input 
                  type="text" 
                  placeholder="Rechercher une conversation..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ 
                    width: "100%", 
                    padding: "12px 16px 12px 42px", 
                    borderRadius: 14, 
                    border: `1.5px solid ${THEME_COLORS.border}`, 
                    fontSize: "0.85rem", 
                    outline: "none", 
                    background: THEME_COLORS.card,
                    color: THEME_COLORS.text,
                    fontFamily: "inherit",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={e => e.target.style.borderColor = THEME_COLORS.goldDk}
                  onBlur={e => e.target.style.borderColor = THEME_COLORS.border}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              {filteredConversations.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "60px 20px", 
                  color: THEME_COLORS.textMuted 
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: THEME_COLORS.goldLt,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px"
                  }}>
                    <MessageIcons.User size={28} color={THEME_COLORS.goldDk} />
                  </div>
                  <p style={{ fontWeight: 600, color: THEME_COLORS.text, marginBottom: 8 }}>Aucune conversation</p>
                  <p style={{ fontSize: "0.75rem", maxWidth: 240, margin: "0 auto", lineHeight: 1.5 }}>
                    {userRole === "Patient" 
                      ? "Soumettez une consultation pour échanger avec un médecin" 
                      : "Acceptez une consultation pour commencer à discuter"}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv, idx) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversation?.id === conv.id}
                    onClick={() => setActiveConversation(conv)}
                    currentUserId={currentUserId}
                  />
                ))
              )}
            </div>
          </div>

          {/* ===== CHAT AREA ===== */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            background: THEME_COLORS.bgAlt, 
            position: "relative",
            height: "100%",
            overflow: "hidden"
          }}>
            {activeConversation ? (
              <>
                {/* Chat Header (Style carte UpcomingCallsPage) */}
                <div style={{ 
                  padding: "18px 24px", 
                  background: THEME_COLORS.card, 
                  borderBottom: `1px solid ${THEME_COLORS.borderLight}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  flexShrink: 0,
                  minHeight: 76
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 16,
                    background: `linear-gradient(135deg, ${THEME_COLORS.navy}, ${THEME_COLORS.navyLight})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: "0.9rem",
                    boxShadow: "0 4px 12px rgba(15, 27, 45, 0.2)"
                  }}>
                    {otherName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: THEME_COLORS.text, marginBottom: 2 }}>
                      {otherName}
                    </div>
                    <div style={{ 
                      fontSize: "0.75rem", color: THEME_COLORS.success, 
                      display: "flex", alignItems: "center", gap: 6, fontWeight: 500
                    }}>
                      <span style={{ 
                        width: 7, height: 7, borderRadius: "50%", 
                        background: THEME_COLORS.success,
                        boxShadow: `0 0 8px ${THEME_COLORS.success}` 
                      }} />
                      {otherRole === "Medecin" ? "Médecin en ligne" : "Patient"}
                    </div>
                  </div>
                  {activeConversation.consultation_id && (
                    <button
                      onClick={() => onNavigate?.(`/patient/consultation/${activeConversation.consultation_id}`)}
                      style={{
                        padding: "10px 20px", borderRadius: 100,
                        background: "linear-gradient(135deg, #FFD700, #D4A500)",
                        border: "none",
                        cursor: "pointer", fontSize: "0.8rem",
                        fontWeight: 700, color: "#0F1B2D",
                        transition: "all 0.3s ease", fontFamily: "inherit",
                        boxShadow: "0 4px 18px rgba(255, 215, 0, 0.3)"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 18px rgba(255, 215, 0, 0.3)";
                      }}
                    >
                      Voir la consultation →
                    </button>
                  )}
                </div>

                {/* Messages Area */}
                <div 
                  ref={messagesContainerRef}
                  style={{ 
                    flex: 1, 
                    overflow: "auto", 
                    padding: "24px",
                    minHeight: 0
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ 
                      display: "flex", flexDirection: "column", 
                      alignItems: "center", justifyContent: "center", 
                      height: "100%", color: THEME_COLORS.textMuted, textAlign: "center"
                    }}>
                      <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${THEME_COLORS.goldLt}, rgba(255,215,0,0.04))`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 20, border: `1px solid ${THEME_COLORS.goldBorder}`
                      }}>
                        <MessageIcons.User size={32} color={THEME_COLORS.goldDk} />
                      </div>
                      <p style={{ fontWeight: 700, color: THEME_COLORS.text, fontSize: "1.1rem", marginBottom: 8 }}>
                        Aucun message
                      </p>
                      <p style={{ fontSize: "0.85rem", maxWidth: 300, lineHeight: 1.5 }}>
                        Envoyez votre premier message ou une pièce jointe pour démarrer
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => (
                        <MessageBubble 
                          key={msg.id || index} 
                          message={msg} 
                          isCurrentUser={msg.sender_id === currentUserId} 
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Upload Progress */}
                {uploadProgress > 0 && (
                  <div style={{
                    padding: "8px 24px",
                    background: THEME_COLORS.card,
                    borderTop: `1px solid ${THEME_COLORS.borderLight}`,
                    flexShrink: 0
                  }}>
                    <div style={{
                      height: 4,
                      background: THEME_COLORS.border,
                      borderRadius: 2,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        background: `linear-gradient(90deg, ${THEME_COLORS.gold}, ${THEME_COLORS.goldDk})`,
                        borderRadius: 2,
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                    <div style={{ fontSize: "0.7rem", color: THEME_COLORS.textMuted, marginTop: 4, textAlign: "center" }}>
                      Envoi en cours... {uploadProgress}%
                    </div>
                  </div>
                )}

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div style={{
                    padding: "12px 24px",
                    background: THEME_COLORS.card,
                    borderTop: `1px solid ${THEME_COLORS.borderLight}`,
                    flexShrink: 0,
                    maxHeight: 200,
                    overflow: "auto"
                  }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: THEME_COLORS.text, marginBottom: 8 }}>
                      Fichiers sélectionnés ({selectedFiles.length})
                    </div>
                    {selectedFiles.map((file, idx) => (
                      <FilePreview 
                        key={idx} 
                        file={file} 
                        onRemove={() => removeFile(idx)} 
                      />
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div style={{ 
                  padding: "16px 24px", 
                  background: THEME_COLORS.card, 
                  borderTop: `1px solid ${THEME_COLORS.borderLight}`,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-end",
                  flexShrink: 0,
                  minHeight: 76
                }}>
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                    onChange={handleFileSelect}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: selectedFiles.length > 0 ? THEME_COLORS.goldLt : THEME_COLORS.bgAlt,
                      border: selectedFiles.length > 0 ? `1px solid ${THEME_COLORS.gold}` : `1px solid ${THEME_COLORS.border}`,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                      position: "relative"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = THEME_COLORS.gold;
                      e.currentTarget.style.background = THEME_COLORS.goldLt;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = selectedFiles.length > 0 ? THEME_COLORS.gold : THEME_COLORS.border;
                      e.currentTarget.style.background = selectedFiles.length > 0 ? THEME_COLORS.goldLt : THEME_COLORS.bgAlt;
                    }}
                  >
                    <MessageIcons.Paperclip size={18} color={selectedFiles.length > 0 ? THEME_COLORS.goldDk : THEME_COLORS.textMuted} />
                    {selectedFiles.length > 0 && (
                      <span style={{
                        position: "absolute",
                        top: -4, right: -4,
                        width: 18, height: 18,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${THEME_COLORS.navy}, ${THEME_COLORS.navyLight})`,
                        color: "white",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {selectedFiles.length}
                      </span>
                    )}
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={selectedFiles.length > 0 ? "Ajoutez un message (optionnel)..." : "Écrivez votre message..."}
                    rows={1}
                    style={{
                      flex: 1,
                      padding: "12px 18px",
                      borderRadius: 18,
                      border: `1.5px solid ${THEME_COLORS.border}`,
                      fontSize: "0.9rem",
                      fontFamily: "inherit",
                      resize: "none",
                      outline: "none",
                      background: THEME_COLORS.bgAlt,
                      color: THEME_COLORS.text,
                      transition: "all 0.2s ease",
                      minHeight: 44,
                      maxHeight: 120
                    }}
                    onFocus={e => e.target.style.borderColor = THEME_COLORS.goldDk}
                    onBlur={e => e.target.style.borderColor = THEME_COLORS.border}
                  />

                  {/* Send Button (Style gold comme UpcomingCallsPage) */}
                  <button
                    onClick={sendMessage}
                    disabled={!canSend || sending}
                    style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: canSend
                        ? "linear-gradient(135deg, #FFD700, #D4A500)"
                        : THEME_COLORS.border,
                      border: "none",
                      cursor: canSend ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      flexShrink: 0,
                      boxShadow: canSend ? "0 4px 18px rgba(255, 215, 0, 0.3)" : "none"
                    }}
                    onMouseEnter={e => {
                      if (canSend) {
                        e.currentTarget.style.transform = "scale(1.08)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 215, 0, 0.4)";
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = canSend ? "0 4px 18px rgba(255, 215, 0, 0.3)" : "none";
                    }}
                  >
                    <MessageIcons.Send size={18} color={canSend ? "#0F1B2D" : THEME_COLORS.textMuted} />
                  </button>
                </div>
              </>
            ) : (
              /* Empty State (Style UpcomingCallsPage exact) */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{ 
                  flex: 1, display: "flex", flexDirection: "column", 
                  alignItems: "center", justifyContent: "center", 
                  padding: "48px", textAlign: "center"
                }}
              >
                <div style={{ 
                  width: 100, height: 100, borderRadius: "50%", 
                  background: `linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(212, 165, 0, 0.08))`, 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  marginBottom: 28,
                  border: `1px solid rgba(255, 215, 0, 0.2)`
                }}>
                  <MessageIcons.Lock size={40} color={THEME_COLORS.goldDk} />
                </div>
                <h3 style={{ 
                  fontSize: "1.2rem", fontWeight: 700, 
                  color: "#0F1B2D", marginBottom: 8
                }}>
                  Messagerie sécurisée
                </h3>
                <p style={{ 
                  fontSize: "0.85rem", color: "#94A3B8", 
                  maxWidth: 300, lineHeight: 1.6, marginBottom: 24
                }}>
                  Sélectionnez une conversation pour commencer à échanger avec votre équipe médicale. 
                  Tous les messages sont chiffrés de bout en bout.
                </p>
                <div style={{
                  display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center"
                }}>
                  <span style={{
                    padding: "6px 14px", background: THEME_COLORS.successBg,
                    color: THEME_COLORS.success, borderRadius: 100,
                    fontSize: "0.75rem", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: THEME_COLORS.success }} />
                    Chiffrement AES-256
                  </span>
                  <span style={{
                    padding: "6px 14px", background: THEME_COLORS.goldLt,
                    color: THEME_COLORS.goldDk, borderRadius: 100,
                    fontSize: "0.75rem", fontWeight: 600
                  }}>
                    Conforme HIPAA
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ===== ANIMATIONS ===== */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes msgSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default MessagesPage;
