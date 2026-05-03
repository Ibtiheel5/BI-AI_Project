// src/components/layout/PatientFooter.jsx
import React from "react";
import { Icon } from "../ui/Icon";
import { Badge } from "../ui/Badge";
import { THEME } from "../../constants/theme";

export const PatientFooter = ({ onNavigate }) => (
  <footer
    style={{
      borderTop: `1px solid ${THEME.colors.border}`,
      padding: "32px 24px",
      background: THEME.colors.surface,
      marginTop: 40,
    }}
  >
    <div
      style={{
        maxWidth: 1440,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 32,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: THEME.radii.md,
              background: THEME.colors.gradient.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "1rem", fontFamily: THEME.fonts.display }}>MedAI</span>
        </div>
        <p style={{ fontSize: "0.85rem", color: THEME.colors.textSecondary, lineHeight: 1.6 }}>
          Plateforme médicale sécurisée utilisant l'intelligence artificielle pour assister les professionnels de santé dans le diagnostic.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Badge variant="success" size="sm">TLS 1.3</Badge>
          <Badge variant="info" size="sm">RGPD</Badge>
          <Badge variant="warning" size="sm">HDS</Badge>
          <Badge variant="purple" size="sm">ISO 27001</Badge>
        </div>
      </div>

      <div>
        <h4 style={{ fontWeight: 600, marginBottom: 14, fontSize: "0.9rem", color: THEME.colors.text }}>Accès rapide</h4>
        {[
          { label: "Dossiers médicaux", action: () => onNavigate("dossiers") },
          { label: "Rendez-vous", action: () => onNavigate("appointments") },
          { label: "Messages", action: () => onNavigate("messages") },
          { label: "Trouver un médecin", action: () => onNavigate("doctors") },
        ].map(link => (
          <div
            key={link.label}
            style={{
              padding: "6px 0",
              fontSize: "0.85rem",
              color: THEME.colors.textSecondary,
              cursor: "pointer",
              transition: THEME.transitions.fast,
            }}
            onMouseEnter={e => { e.target.style.color = THEME.colors.accent; e.target.style.paddingLeft = "4px"; }}
            onMouseLeave={e => { e.target.style.color = THEME.colors.textSecondary; e.target.style.paddingLeft = "0"; }}
            onClick={link.action}
          >
            {link.label}
          </div>
        ))}
      </div>

      <div>
        <h4 style={{ fontWeight: 600, marginBottom: 14, fontSize: "0.9rem", color: THEME.colors.text }}>Urgences</h4>
        <div
          style={{
            padding: "16px",
            borderRadius: THEME.radii.lg,
            background: THEME.colors.dangerSoft,
            border: `1px solid #FECACA`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="alertTriangle" size={18} color={THEME.colors.danger} />
            <span style={{ fontWeight: 700, color: THEME.colors.danger, fontSize: "0.9rem" }}>En cas d'urgence vitale</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#991B1B", lineHeight: 1.6 }}>
            Composez immédiatement le <strong>15 (SAMU)</strong> ou le <strong>112</strong>
          </p>
        </div>
        <div style={{ marginTop: 12, fontSize: "0.8rem", color: THEME.colors.textMuted, textAlign: "center" }}>
          © 2024 MedAI Platform • Tous droits réservés
        </div>
      </div>
    </div>
  </footer>
);

export default PatientFooter;