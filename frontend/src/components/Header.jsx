// Header.jsx — Professional medical header with real imagery
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { getHealth } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { MedicalIcons } from "./MedicalIcons";
import DoctorImage from "./DoctorImage";

export default function Header() {
  const { theme, toggle } = useTheme();
  const [status, setStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    getHealth()
      .then((data) => setStatus(data))
      .catch(() => setStatus({ status: "offline" }));
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusInfo = () => {
    if (status === null) {
      return { color: "#94A3B8", text: "Connexion..." };
    }
    switch (status.status) {
      case "ok":
        return { color: "#00A86B", text: "Système opérationnel" };
      case "degraded":
        return { color: "#FF9F1C", text: "Mode dégradé" };
      default:
        return { color: "#D62828", text: "Hors ligne" };
    }
  };

  const { color, text } = getStatusInfo();

  return (
    <header style={{
      background: 'rgba(255,255,255,0.98)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(43, 95, 158, 0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 20px -5px rgba(10, 38, 71, 0.08)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 32px',
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0A2647, #1B3B6F)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(10, 38, 71, 0.2)',
            }}>
              <MedicalIcons.Lungs size={24} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ 
                fontSize: '1.3rem', 
                fontWeight: 700, 
                letterSpacing: '-0.02em',
                color: '#0A2647'
              }}>
                Chest<span style={{ color: '#2D5F9E' }}>AI</span>
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: '#64748B',
                fontWeight: 500
              }}>
                Système d'aide au diagnostic
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: 8 }}>
            {[
              { to: '/', label: 'Accueil' },
              { to: '/classification', label: 'Analyse' },
              { to: '/pathologies', label: 'Pathologies' },
            ].map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                style={({ isActive }) => ({
                  padding: '8px 20px',
                  borderRadius: 40,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: isActive ? '#1B3B6F' : '#64748B',
                  background: isActive ? 'rgba(43, 95, 158, 0.08)' : 'transparent',
                  transition: 'all 0.2s',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Time display */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600,
              color: '#1E293B'
            }}>
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ 
              fontSize: '0.7rem', 
              color: '#64748B',
              fontWeight: 500
            }}>
              {currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Doctor team */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', marginRight: 8 }}>
              <div style={{ marginRight: -8 }}>
                <DoctorImage doctor="dr-sarah" size="sm" />
              </div>
              <div style={{ marginRight: -8 }}>
                <DoctorImage doctor="dr-james" size="sm" />
              </div>
              <div>
                <DoctorImage doctor="dr-emma" size="sm" />
              </div>
            </div>
            <div style={{
              padding: '4px 12px',
              background: 'rgba(0, 168, 107, 0.1)',
              borderRadius: 40,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#00A86B',
              border: '1px solid rgba(0, 168, 107, 0.2)',
            }}>
              3 en ligne
            </div>
          </div>

          {/* Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'rgba(43, 95, 158, 0.05)',
            borderRadius: 40,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              animation: status?.status === 'ok' ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{text}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(43, 95, 158, 0.15)',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
}