// frontend/src/components/AdminMessages.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000/api/v1";

// SVG Icons
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M22 7L12 13 2 7"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function AdminMessages({ token }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [toast, setToast] = useState(null);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/contact/admin/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (messageId) => {
    try {
      await fetch(`${API_BASE}/contact/admin/messages/${messageId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadMessages();
      showToast("Message marqué comme lu", "success");
    } catch (error) {
      showToast("Erreur", "error");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Supprimer ce message définitivement ?")) return;
    try {
      await fetch(`${API_BASE}/contact/admin/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadMessages();
      if (selectedMessage?.id === messageId) setSelectedMessage(null);
      showToast("Message supprimé", "success");
    } catch (error) {
      showToast("Erreur", "error");
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{
          width: 48,
          height: 48,
          border: "3px solid #E2E8F0",
          borderTopColor: "#FFD700",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p style={{ color: "#64748B" }}>Chargement des messages...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", color: "#0A2647", display: "flex", alignItems: "center", gap: 10 }}>
            <MessageIcon />
            Messages de contact
          </h2>
          <p style={{ color: "#64748B", fontSize: "0.85rem" }}>
            {unreadCount} message{unreadCount > 1 ? "s" : ""} non lu{unreadCount > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={loadMessages}
          style={{
            padding: "8px 16px",
            background: "#F1F5F9",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.8rem"
          }}
        >
          <RefreshIcon /> Actualiser
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="pd3-empty">
          <div className="pd3-empty-icon"><MessageIcon /></div>
          <div className="pd3-empty-title">Aucun message</div>
          <div className="pd3-empty-desc">Aucun message de contact pour le moment.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: msg.is_read ? "white" : "#FEF3C7",
                borderRadius: 16,
                padding: 20,
                border: `1px solid ${msg.is_read ? "#E2E8F0" : "#FDE68A"}`,
                cursor: "pointer"
              }}
              onClick={() => setSelectedMessage(msg)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: "#0A2647" }}>{msg.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{msg.email}</span>
                    {!msg.is_read && (
                      <span style={{
                        background: "#F59E0B",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: "0.65rem"
                      }}>
                        Nouveau
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, color: "#1B3B6F", marginBottom: 8 }}>{msg.subject}</div>
                  <p style={{ color: "#475569", fontSize: "0.85rem", marginBottom: 12 }}>
                    {msg.message.length > 100 ? msg.message.substring(0, 100) + "..." : msg.message}
                  </p>
                  <div style={{ fontSize: "0.65rem", color: "#94A3B8" }}>
                    {new Date(msg.created_at).toLocaleDateString("fr-FR")} à {new Date(msg.created_at).toLocaleTimeString("fr-FR")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!msg.is_read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(msg.id); }}
                      style={{
                        padding: "6px 12px",
                        background: "#10B981",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.7rem"
                      }}
                    >
                      <CheckIcon /> Lu
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                    style={{
                      padding: "6px 12px",
                      background: "#FEE2E2",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      color: "#DC2626",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.7rem"
                    }}
                  >
                    <TrashIcon /> Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Message Detail */}
      {selectedMessage && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setSelectedMessage(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: "white",
              borderRadius: 24,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              padding: 32
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: "#0A2647" }}>Détail du message</h3>
              <button onClick={() => setSelectedMessage(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <CloseIcon />
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: "#64748B", fontSize: "0.7rem", marginBottom: 4 }}>Expéditeur</div>
              <div style={{ fontWeight: 600 }}>{selectedMessage.name}</div>
              <div style={{ color: "#3B82F6", fontSize: "0.85rem" }}>{selectedMessage.email}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: "#64748B", fontSize: "0.7rem", marginBottom: 4 }}>Sujet</div>
              <div>{selectedMessage.subject}</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, color: "#64748B", fontSize: "0.7rem", marginBottom: 4 }}>Message</div>
              <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, lineHeight: 1.6 }}>{selectedMessage.message}</div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {!selectedMessage.is_read && (
                <button
                  onClick={() => { markAsRead(selectedMessage.id); setSelectedMessage(null); }}
                  style={{ padding: "10px 20px", background: "#10B981", border: "none", borderRadius: 10, color: "white", cursor: "pointer" }}
                >
                  Marquer comme lu
                </button>
              )}
              <button
                onClick={() => { deleteMessage(selectedMessage.id); setSelectedMessage(null); }}
                style={{ padding: "10px 20px", background: "#FEE2E2", border: "none", borderRadius: 10, color: "#DC2626", cursor: "pointer" }}
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "12px 24px",
            borderRadius: 12,
            background: toast.type === "error" ? "#EF4444" : "#10B981",
            color: "white",
            fontSize: "0.85rem",
            zIndex: 1100
          }}
        >
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
}