// src/components/layout/PatientNavbar.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";
import { Badge } from "../ui/Badge";
import { THEME } from "../../constants/theme";
import { DOCTORS } from "../../constants/doctors";

export const PatientNavbar = ({ activePage, onPageChange, unreadCount }) => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "home", label: "Accueil", icon: "shield" },
    { id: "dossiers", label: "Dossiers", icon: "file" },
    { id: "upload", label: "Nouveau dossier", icon: "plus" },
    { id: "appointments", label: "Rendez-vous", icon: "calendar" },
    { id: "messages", label: "Messages", icon: "message" },
    { id: "doctors", label: "Médecins", icon: "map" },
  ];

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 2 && activePage !== "dossiers") {
      onPageChange("dossiers");
    }
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: scrolled ? THEME.colors.glass : THEME.colors.white,
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: `1px solid ${scrolled ? THEME.colors.border : "transparent"}`,
        padding: "0 24px",
        transition: THEME.transitions.slow,
        boxShadow: scrolled ? THEME.shadows.lg : THEME.shadows.sm,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => onPageChange("home")}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: THEME.radii.lg,
              background: THEME.colors.gradient.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: THEME.shadows.glow(THEME.colors.accent),
              animation: "breathe 2s ease-in-out infinite",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: THEME.colors.primary,
                fontFamily: THEME.fonts.display,
                letterSpacing: "-0.02em",
              }}
            >
              Med<span style={{ color: THEME.colors.accentLight }}>AI</span>
            </span>
            <span
              style={{
                display: "block",
                fontSize: "0.65rem",
                color: THEME.colors.textMuted,
                fontWeight: 500,
                letterSpacing: "0.05em",
                marginTop: -2,
              }}
            >
              PLATEFORME MÉDICALE
            </span>
          </div>
        </div>

        {/* Recherche */}
        <div style={{ flex: 1, maxWidth: 400, margin: "0 32px", position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon name="search" size={18} color={THEME.colors.textMuted} />
          </span>
          <input
            type="text"
            placeholder="Rechercher un dossier, un médecin..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              width: "100%",
              padding: "10px 16px 10px 42px",
              borderRadius: THEME.radii.full,
              border: `2px solid ${THEME.colors.border}`,
              fontSize: "0.88rem",
              outline: "none",
              background: THEME.colors.bgAlt,
              transition: THEME.transitions.normal,
            }}
            onFocus={e => {
              e.target.style.borderColor = THEME.colors.accent;
              e.target.style.boxShadow = THEME.shadows.glow(THEME.colors.accent);
            }}
            onBlur={e => {
              e.target.style.borderColor = THEME.colors.border;
              e.target.style.boxShadow = "none";
            }}
          />
          <kbd
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              padding: "2px 8px",
              borderRadius: THEME.radii.xs,
              background: THEME.colors.border,
              fontSize: "0.7rem",
              color: THEME.colors.textMuted,
              fontWeight: 600,
              border: `1px solid ${THEME.colors.border}`,
            }}
          >
            /
          </kbd>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              style={{
                padding: "10px 18px",
                borderRadius: THEME.radii.lg,
                border: "none",
                cursor: "pointer",
                background: activePage === item.id ? THEME.colors.accentSoft : "transparent",
                color: activePage === item.id ? THEME.colors.accent : THEME.colors.textSecondary,
                fontWeight: activePage === item.id ? 600 : 500,
                fontSize: "0.88rem",
                transition: THEME.transitions.fast,
                whiteSpace: "nowrap",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (activePage !== item.id) {
                  e.currentTarget.style.background = THEME.colors.bgAlt;
                  e.currentTarget.style.color = THEME.colors.text;
                }
              }}
              onMouseLeave={e => {
                if (activePage !== item.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = THEME.colors.textSecondary;
                }
              }}
            >
              {activePage === item.id && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 24,
                    height: 3,
                    borderRadius: THEME.radii.full,
                    background: THEME.colors.accent,
                  }}
                />
              )}
              {item.label}
            </button>
          ))}
        </div>

        {/* Actions utilisateur */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => onPageChange("messages")}
            style={{
              width: 44,
              height: 44,
              borderRadius: THEME.radii.lg,
              background: THEME.colors.bgAlt,
              border: `2px solid ${THEME.colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: THEME.transitions.normal,
            }}
          >
            <Icon name="mail" size={20} color={THEME.colors.textSecondary} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 20,
                  height: 20,
                  borderRadius: THEME.radii.full,
                  background: THEME.colors.danger,
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid white",
                  padding: "0 4px",
                  animation: "pulse 2s infinite",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 18px 6px 6px",
              borderRadius: THEME.radii.full,
              background: THEME.colors.bgAlt,
              border: `2px solid ${THEME.colors.border}`,
              cursor: "pointer",
              transition: THEME.transitions.normal,
            }}
          >
            <Avatar src={DOCTORS.team[3].photo} name={user?.full_name} size={36} available={true} />
            <div>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: THEME.colors.text }}>
                {user?.full_name?.split(" ")[0] || "Patient"}
              </span>
              <span style={{ display: "block", fontSize: "0.7rem", color: THEME.colors.success, fontWeight: 500 }}>En ligne</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </nav>
  );
};

export default PatientNavbar;