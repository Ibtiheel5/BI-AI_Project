// src/components/Header.jsx
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { THEME } from "../constants/theme";

export default function Header() {
  const { user, logout, isAdmin, isPatient, isDoctor } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = (() => {
    if (!user) return [];
    if (isAdmin) return [{ to: "/admin", label: "Administration" }];
    if (isPatient) return [
      { to: "/patient", label: "Accueil" },
      { to: "/patient/consultation/new", label: "Nouvelle consultation" },
    ];
    return [
      { to: "/doctor", label: "Dashboard" },
      { to: "/classification", label: "Analyse" },
      { to: "/pathologies", label: "Pathologies" },
    ];
  })();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: THEME.zIndex.sticky,
        background: scrolled ? THEME.colors.glass : THEME.colors.surface,
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: `1px solid ${scrolled ? THEME.colors.border : "transparent"}`,
        transition: THEME.transitions.DEFAULT,
      }}
    >
      <div
        style={{
          maxWidth: THEME.breakpoints.xl,
          margin: "0 auto",
          padding: `0 ${THEME.spacing[6]}`,
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div
          onClick={() => navigate(isAdmin ? "/admin" : isPatient ? "/patient" : "/doctor")}
          style={{ display: "flex", alignItems: "center", gap: THEME.spacing[3], cursor: "pointer" }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: THEME.gradients.primary,
              borderRadius: THEME.radii.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: THEME.shadows.accent,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: THEME.colors.primary }}>
              Med<span style={{ color: THEME.colors.accent }}>AI</span>
            </span>
            <span
              style={{
                display: "block",
                fontSize: "0.6rem",
                color: THEME.colors.textMuted,
                letterSpacing: "0.05em",
                marginTop: -2,
              }}
            >
              TÉLÉMÉDECINE
            </span>
          </div>
        </div>

        {/* Navigation Desktop */}
        <nav style={{ display: "flex", gap: THEME.spacing[1], background: THEME.colors.surfaceAlt, padding: "4px", borderRadius: THEME.radii.full }}>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/patient" || link.to === "/doctor"}
              style={({ isActive }) => ({
                padding: `${THEME.spacing[2]} ${THEME.spacing[5]}`,
                borderRadius: THEME.radii.full,
                fontSize: THEME.fontSizes.sm,
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? THEME.colors.accent : THEME.colors.textSecondary,
                background: isActive ? THEME.colors.surface : "transparent",
                boxShadow: isActive ? THEME.shadows.sm : "none",
                transition: THEME.transitions.fast,
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User Menu */}
        {user && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: THEME.spacing[2],
                padding: `${THEME.spacing[1.5]} ${THEME.spacing[3]} ${THEME.spacing[1.5]} ${THEME.spacing[1.5]}`,
                background: THEME.colors.surfaceAlt,
                border: `1px solid ${THEME.colors.border}`,
                borderRadius: THEME.radii.full,
                cursor: "pointer",
                transition: THEME.transitions.fast,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: THEME.radii.full,
                  background: THEME.gradients.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: THEME.colors.white,
                  fontSize: THEME.fontSizes.sm,
                  fontWeight: 700,
                }}
              >
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: THEME.fontSizes.sm, fontWeight: 600, color: THEME.colors.text }}>
                  {user.full_name?.split(" ")[0] || "Utilisateur"}
                </div>
                <div style={{ fontSize: "0.65rem", color: THEME.colors.textMuted }}>
                  {user.role === "Patient" ? "Patient" : user.specialty || "Médecin"}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 240,
                  background: THEME.colors.surface,
                  borderRadius: THEME.radii.xl,
                  border: `1px solid ${THEME.colors.border}`,
                  boxShadow: THEME.shadows.xl,
                  overflow: "hidden",
                  zIndex: THEME.zIndex.dropdown,
                }}
              >
                <div
                  style={{
                    padding: THEME.spacing[4],
                    borderBottom: `1px solid ${THEME.colors.borderLight}`,
                    background: THEME.colors.surfaceAlt,
                  }}
                >
                  <div style={{ fontWeight: 700, color: THEME.colors.text }}>{user.full_name}</div>
                  <div style={{ fontSize: THEME.fontSizes.xs, color: THEME.colors.textMuted }}>
                    @{user.username}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                    setShowMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: THEME.spacing[3],
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: THEME.colors.danger,
                    fontSize: THEME.fontSizes.sm,
                    fontWeight: 500,
                    transition: THEME.transitions.fast,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = THEME.colors.dangerSoft)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}