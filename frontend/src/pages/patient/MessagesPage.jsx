// src/pages/patient/MessagesPage.jsx
import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { THEME } from "../../constants/theme";
import { DOCTORS } from "../../constants/doctors";

export const MessagesPage = ({ user, consultations, notifications, onNavigate }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "Dr. Sophie Laurent", text: "Bonjour, j'ai bien reçu votre dossier. Pouvez-vous me préciser depuis quand ressentez-vous ces symptômes ?", time: "2024-01-15T10:30:00", read: true },
    { id: 2, sender: "Vous", text: "Bonjour Docteur, cela fait environ 2 semaines. La douleur est plus intense le matin.", time: "2024-01-15T10:32:00", read: true },
    { id: 3, sender: "Dr. Sophie Laurent", text: "Merci pour ces précisions. Je vais analyser votre dossier plus en détail et je reviens vers vous.", time: "2024-01-15T10:35:00", read: false },
  ]);

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const newMsg = { id: Date.now(), sender: "Vous", text: messageInput, time: new Date().toISOString(), read: false };
    setMessages([...messages, newMsg]);
    setMessageInput("");
  };

  const formatMessageTime = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    if (msgDate.toDateString() === today.toDateString()) return msgDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return msgDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const unreadCount = messages.filter(m => !m.read && m.sender !== "Vous").length;

  return (
    <div>
      <SectionHeader title="Messagerie sécurisée" subtitle="Communiquez avec votre équipe médicale en toute confidentialité" badge={{ text: "Chiffré E2E", variant: "success" }} />
      
      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 0, borderRadius: THEME.radii.xl, overflow: "hidden", border: `1px solid ${THEME.colors.border}`, height: "calc(100vh - 280px)", minHeight: 500 }}>
        {/* Liste des conversations */}
        <div style={{ borderRight: `1px solid ${THEME.colors.border}`, background: THEME.colors.surface, overflow: "auto" }}>
          <div style={{ padding: "20px", borderBottom: `1px solid ${THEME.colors.border}` }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={16} color={THEME.colors.textMuted} /></span>
              <input type="text" placeholder="Rechercher une conversation..." style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: THEME.radii.lg, border: `1.5px solid ${THEME.colors.border}`, fontSize: "0.85rem", outline: "none", background: THEME.colors.bgAlt }} />
            </div>
          </div>
          {DOCTORS.team.slice(0, 4).map((doctor, i) => (
            <div key={i} onClick={() => setActiveChat(doctor)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: THEME.transitions.fast, background: activeChat?.id === doctor.id ? THEME.colors.accentSoft : "transparent", borderBottom: `1px solid ${THEME.colors.borderLight}` }} onMouseEnter={e => { if (activeChat?.id !== doctor.id) e.currentTarget.style.background = THEME.colors.bgAlt; }} onMouseLeave={e => { if (activeChat?.id !== doctor.id) e.currentTarget.style.background = "transparent"; }}>
              <Avatar src={doctor.photo} name={doctor.name} size={48} available={doctor.available} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: THEME.colors.text }}>{doctor.name}</div>
                <div style={{ fontSize: "0.78rem", color: THEME.colors.textSecondary, marginTop: 2 }}>{doctor.specialty}</div>
                <div style={{ fontSize: "0.75rem", color: THEME.colors.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i === 0 ? "Merci pour ces précisions..." : "Dernier message il y a 2 jours"}</div>
              </div>
              {i === 0 && <Badge variant="info" size="sm">3</Badge>}
            </div>
          ))}
        </div>

        {/* Zone de messages */}
        <div style={{ display: "flex", flexDirection: "column", background: THEME.colors.bgAlt }}>
          {activeChat ? (
            <>
              <div style={{ padding: "16px 20px", background: THEME.colors.surface, borderBottom: `1px solid ${THEME.colors.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar src={activeChat.photo} name={activeChat.name} size={44} available={activeChat.available} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: THEME.colors.text }}>{activeChat.name}</div>
                  <div style={{ fontSize: "0.78rem", color: THEME.colors.success }}>{activeChat.available ? "En ligne" : "Hors ligne"}</div>
                </div>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender === "Vous" ? "flex-end" : "flex-start", marginBottom: 20 }}>
                    <div style={{ maxWidth: "70%" }}>
                      <div style={{ padding: "12px 18px", borderRadius: THEME.radii.lg, background: msg.sender === "Vous" ? THEME.colors.accent : THEME.colors.surface, color: msg.sender === "Vous" ? "white" : THEME.colors.text, fontSize: "0.9rem", lineHeight: 1.6, boxShadow: THEME.shadows.sm, borderBottomRightRadius: msg.sender === "Vous" ? "4px" : THEME.radii.lg, borderBottomLeftRadius: msg.sender === "Vous" ? THEME.radii.lg : "4px" }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: THEME.colors.textMuted, marginTop: 4, padding: "0 4px", textAlign: msg.sender === "Vous" ? "right" : "left" }}>
                        {msg.sender} • {formatMessageTime(msg.time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "16px 20px", background: THEME.colors.surface, borderTop: `1px solid ${THEME.colors.border}`, display: "flex", gap: 12 }}>
                <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Écrivez votre message..." style={{ flex: 1, padding: "12px 18px", borderRadius: THEME.radii.full, border: `1.5px solid ${THEME.colors.border}`, fontSize: "0.9rem", fontFamily: "inherit", outline: "none", background: THEME.colors.bgAlt }} />
                <button onClick={sendMessage} disabled={!messageInput.trim()} style={{ width: 48, height: 48, borderRadius: "50%", background: messageInput.trim() ? THEME.colors.accent : THEME.colors.border, border: "none", cursor: messageInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: THEME.transitions.normal }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: THEME.colors.bgAlt, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Icon name="message" size={36} color={THEME.colors.textMuted} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: THEME.colors.text, marginBottom: 8 }}>Messagerie sécurisée</h3>
              <p style={{ fontSize: "0.9rem", color: THEME.colors.textSecondary, textAlign: "center", maxWidth: 400 }}>Sélectionnez une conversation pour commencer à échanger avec votre équipe médicale. Tous les messages sont chiffrés de bout en bout.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};