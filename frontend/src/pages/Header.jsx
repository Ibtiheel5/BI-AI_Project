// Header.jsx — Navigation selon le rôle connecté
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getHealth } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

// ── SVG Icons ───────────────────────────────────────────────────────
const Icon = {
  Sun: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Activity: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

export default function Header() {
  const { theme, toggle }                    = useTheme();
  const { user, logout, currentDomain, isAdmin, isPatient, isDoctor } = useAuth();
  const navigate                             = useNavigate();
  const [status,       setStatus]            = useState(null);
  const [currentTime,  setCurrentTime]       = useState(new Date());
  const [showUserMenu, setShowUserMenu]       = useState(false);

  useEffect(() => {
    getHealth()
      .then(d  => setStatus(d))
      .catch(() => setStatus({ status: "offline" }));
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fermer le menu en cliquant ailleurs
  useEffect(() => {
    const handler = () => setShowUserMenu(false);
    if (showUserMenu) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showUserMenu]);

  const { color: statusColor, text: statusText } = (() => {
    if (!status)                    return { color:"#94A3B8", text:"Connexion…" };
    if (status.status === "ok")     return { color:"#10B981", text:"Système opérationnel" };
    if (status.status === "degraded") return { color:"#F59E0B", text:"Mode dégradé" };
    return { color:"#EF4444", text:"Hors ligne" };
  })();

  // ── Navigation selon le rôle ────────────────────────────────────
  const navLinks = (() => {
    if (!user) return [];

    // Administrateur
    if (isAdmin) return [
      { to:"/admin",       label:"Administration" },
      { to:"/pathologies", label:"Pathologies" },
    ];

    // Patient
    if (isPatient) return [
      { to:"/patient",     label:"Mon espace" },
      { to:"/pathologies", label:"Pathologies" },
    ];

    // Médecin (par défaut)
    return [
      { to:"/home",           label:"Accueil",       exact:true },
      { to:"/doctor/queue",   label:"Consultations" },
      { to:"/classification", label:"Analyse libre" },
      { to:"/pathologies",    label:"Pathologies" },
    ];
  })();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const domainColor = currentDomain?.color || "#2D5F9E";
  const initials    = (user?.full_name || user?.name || "?")
    .replace(/^Dr\.?\s*/i, "").trim().charAt(0).toUpperCase();

  return (
    <header style={{
      background: "rgba(255,255,255,0.98)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #E2E8F0",
      position: "sticky", top: 0, zIndex: 1000,
      boxShadow: "0 1px 0 rgba(10,38,71,.05)",
    }}>
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 24,
      }}>

        {/* ── Logo ── */}
        <div style={{ display:"flex", alignItems:"center", gap: isDoctor ? 40 : 24 }}>
          <div
            style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", textDecoration:"none" }}
            onClick={() => navigate(isAdmin ? "/admin" : isPatient ? "/patient" : "/home")}
          >
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#0A2647,#1B3B6F)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(10,38,71,.2)" }}>
              <Icon.Activity />
            </div>
            <div>
              <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#0A2647", letterSpacing:"-.03em", lineHeight:1 }}>
                Med<span style={{ color:"#2D5F9E" }}>AI</span>
              </div>
              <div style={{ fontSize:".58rem", color:"#94A3B8", letterSpacing:".06em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>
                Télémédecine
              </div>
            </div>
          </div>

          {/* Navigation */}
          {navLinks.length > 0 && (
            <nav style={{ display:"flex", gap:2 }}>
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  style={({ isActive }) => ({
                    padding: "7px 16px",
                    borderRadius: 8,
                    fontSize: ".85rem",
                    fontWeight: isActive ? 600 : 400,
                    textDecoration: "none",
                    color: isActive ? "#0A2647" : "#64748B",
                    background: isActive ? "rgba(10,38,71,.07)" : "transparent",
                    transition: "all .15s",
                    letterSpacing: "-.01em",
                  })}
                  onMouseEnter={e => { if (!e.currentTarget.classList.contains("active")) e.currentTarget.style.color = "#0A2647"; e.currentTarget.style.background = "rgba(10,38,71,.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = ""; }}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        {/* ── Droite ── */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>

          {/* Badge domaine */}
          {currentDomain && isDoctor && (
            <div style={{ padding:"5px 12px", background: currentDomain.bgColor, border:`1px solid ${domainColor}30`, borderRadius:20, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:".65rem", fontWeight:700, color: domainColor, textTransform:"uppercase", letterSpacing:".06em" }}>
                {currentDomain.short || currentDomain.label}
              </span>
            </div>
          )}

          {/* Status système */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:20 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background: statusColor, animation: status?.status === "ok" ? "statusPulse 2.5s ease-in-out infinite" : "none" }} />
            <span style={{ fontSize:".65rem", color:"#64748B", fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap" }}>{statusText}</span>
          </div>

          {/* Heure */}
          <div style={{ textAlign:"right", display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
            <span style={{ fontSize:".85rem", fontWeight:700, color:"#0A2647", fontFamily:"'DM Mono',monospace", lineHeight:1 }}>
              {currentTime.toLocaleTimeString("fr-FR",{ hour:"2-digit", minute:"2-digit" })}
            </span>
            <span style={{ fontSize:".6rem", color:"#94A3B8" }}>
              {currentTime.toLocaleDateString("fr-FR",{ day:"numeric", month:"short" })}
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{ width:34, height:34, borderRadius:8, border:"1px solid #E2E8F0", background:"#F8FAFC", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#475569", transition:"all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#2D5F9E"; e.currentTarget.style.color = "#2D5F9E"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#475569"; }}
          >
            {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
          </button>

          {/* User menu */}
          {user && (
            <div style={{ position:"relative" }}>
              <button
                onClick={e => { e.stopPropagation(); setShowUserMenu(v => !v); }}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"5px 10px 5px 5px", background: showUserMenu ? "rgba(10,38,71,.06)" : "#F8FAFC", border:"1px solid #E2E8F0", borderRadius:40, cursor:"pointer", transition:"all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(10,38,71,.06)"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
                onMouseLeave={e => { if (!showUserMenu) { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E2E8F0"; } }}
              >
                {/* Avatar initiales */}
                <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#0A2647,#2D5F9E)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:".78rem", fontWeight:800 }}>
                  {initials}
                </div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:".78rem", fontWeight:700, color:"#0A2647", lineHeight:1, letterSpacing:"-.01em" }}>
                    {(user.full_name || user.name || "").replace(/^Dr\.?\s*/i,"Dr. ")}
                  </div>
                  <div style={{ fontSize:".62rem", color:"#94A3B8", marginTop:1 }}>
                    {user.role || "Médecin"}
                  </div>
                </div>
                <span style={{ color:"#94A3B8", transition:"transform .15s", transform: showUserMenu ? "rotate(180deg)" : "" }}>
                  <Icon.ChevronDown />
                </span>
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"white", borderRadius:14, border:"1px solid #E2E8F0", boxShadow:"0 8px 32px rgba(10,38,71,.1)", minWidth:220, overflow:"hidden", zIndex:200, animation:"menuDown .15s ease" }}
                >
                  {/* Profil */}
                  <div style={{ padding:"14px 18px", background:"linear-gradient(135deg,#F8FAFC,white)", borderBottom:"1px solid #F1F5F9" }}>
                    <div style={{ fontSize:".88rem", fontWeight:800, color:"#0A2647", marginBottom:2 }}>
                      {(user.full_name || user.name || "").replace(/^Dr\.?\s*/i,"Dr. ")}
                    </div>
                    <div style={{ fontSize:".72rem", color:"#64748B" }}>{user.specialty || user.role}</div>
                    <div style={{ fontSize:".68rem", color:"#94A3B8", marginTop:4, fontFamily:"'DM Mono',monospace" }}>
                      @{user.username}
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    isDoctor && { label:"Mon tableau de bord", path:"/home" },
                    isPatient && { label:"Mon espace patient", path:"/patient" },
                    isAdmin   && { label:"Administration",     path:"/admin" },
                  ].filter(Boolean).map(item => item && (
                    <button key={item.path}
                      onClick={() => { navigate(item.path); setShowUserMenu(false); }}
                      style={{ width:"100%", padding:"10px 18px", background:"none", border:"none", cursor:"pointer", textAlign:"left", fontSize:".82rem", color:"#0A2647", display:"flex", alignItems:"center", gap:9, transition:"background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <Icon.User /> {item.label}
                    </button>
                  ))}

                  <div style={{ height:1, background:"#F1F5F9", margin:"4px 0" }} />

                  {/* Déconnexion */}
                  <button
                    onClick={handleLogout}
                    style={{ width:"100%", padding:"10px 18px", background:"none", border:"none", cursor:"pointer", textAlign:"left", fontSize:".82rem", color:"#DC2626", display:"flex", alignItems:"center", gap:9, transition:"background .12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <Icon.LogOut /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes menuDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </header>
  );
}