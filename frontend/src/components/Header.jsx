// Header.jsx — Header avec info utilisateur connecté + logout
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getHealth } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { MedicalIcons } from "./MedicalIcons";
import DoctorImage from "./DoctorImage";

export default function Header() {
  const { theme, toggle } = useTheme();
  const { user, logout, currentDomain, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    getHealth()
      .then((data) => setStatus(data))
      .catch(() => setStatus({ status: "offline" }));

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusInfo = () => {
    if (status === null) return { color: "#94A3B8", text: "Connexion..." };
    switch (status.status) {
      case "ok":      return { color: "#00A86B", text: "Système opérationnel" };
      case "degraded":return { color: "#FF9F1C", text: "Mode dégradé" };
      default:        return { color: "#D62828", text: "Hors ligne" };
    }
  };

  const { color, text } = getStatusInfo();

  const handleLogout = () => {
    logout();
    navigate("/login");
    setShowUserMenu(false);
  };

  // Couleur du domaine actif
  const domainColor = currentDomain?.color || "#2D5F9E";

  return (
    <header style={{
      background: "rgba(255,255,255,0.98)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(43, 95, 158, 0.15)",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      boxShadow: "0 4px 20px -5px rgba(10, 38, 71, 0.08)",
    }}>
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "0 32px",
        height: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(10, 38, 71, 0.2)",
            }}>
              <MedicalIcons.Lungs size={24} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0A2647" }}>
                Med<span style={{ color: "#2D5F9E" }}>AI</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>
                Système d'aide au diagnostic
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: "flex", gap: 8 }}>
            {[
              { to: "/",              label: "Accueil" },
              { to: "/classification",label: "Analyse" },
              { to: "/pathologies",   label: "Pathologies" },
            ].map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                style={({ isActive }) => ({
                  padding: "8px 20px",
                  borderRadius: 40,
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: isActive ? "#1B3B6F" : "#64748B",
                  background: isActive ? "rgba(43, 95, 158, 0.08)" : "transparent",
                  transition: "all 0.2s",
                })}
              >
                {link.label}
                {isAdmin && <NavLink to="/admin">Administration</NavLink>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Domain badge */}
          {currentDomain && (
            <div style={{
              padding: "6px 14px",
              background: currentDomain.bgColor,
              border: `1px solid ${domainColor}30`,
              borderRadius: 40,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{ fontSize: "0.9rem" }}>{currentDomain.icon}</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: domainColor }}>
                {currentDomain.label}
              </span>
            </div>
          )}

          {/* Time */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1E293B" }}>
              {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
              {currentTime.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </div>
          </div>

          {/* Status */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            background: "rgba(43, 95, 158, 0.05)",
            borderRadius: 40,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              animation: status?.status === "ok" ? "pulse 2s infinite" : "none",
            }} />
            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{text}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(43, 95, 158, 0.15)",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* User menu */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 12px 6px 6px",
                  background: "rgba(43, 95, 158, 0.06)",
                  border: "1px solid rgba(43, 95, 158, 0.15)",
                  borderRadius: 40,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(43, 95, 158, 0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(43, 95, 158, 0.06)"}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0A2647, #2D5F9E)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}>
                  {user.name.charAt(0)}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0A2647" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#64748B" }}>
                    {user.role}
                  </div>
                </div>
                <span style={{ fontSize: "0.6rem", color: "#94A3B8" }}>▼</span>
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid rgba(43,95,158,0.1)",
                  boxShadow: "0 12px 32px rgba(10,38,71,0.12)",
                  minWidth: 220,
                  overflow: "hidden",
                  zIndex: 100,
                  animation: "fadeDown 0.15s ease both",
                }}>
                  {/* User info */}
                  <div style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #F1F5F9",
                    background: "linear-gradient(135deg, #F8FAFC, white)",
                  }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0A2647" }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>
                      {user.specialty}
                    </div>
                    {currentDomain && (
                      <div style={{
                        marginTop: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 10px",
                        background: currentDomain.bgColor,
                        borderRadius: 20,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: domainColor,
                      }}>
                        {currentDomain.icon} {currentDomain.label}
                      </div>
                    )}
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.85rem",
                      color: "#D62828",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF5F5"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    🚪 Se déconnecter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </header>
  );
}