// src/components/ui/EmptyState.jsx
import React from "react";
import { Icon } from "./Icon";
import { THEME } from "../../constants/theme";

export const EmptyState = ({ icon, title, description, action }) => (
  <div
    style={{
      textAlign: "center",
      padding: "60px 24px",
      animation: "fadeInUp 0.5s ease",
    }}
  >
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: THEME.colors.bgAlt,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px",
      }}
    >
      <Icon name={icon} size={36} color={THEME.colors.textMuted} />
    </div>
    <h3
      style={{
        fontSize: "1.2rem",
        fontWeight: 600,
        color: THEME.colors.text,
        marginBottom: 8,
        fontFamily: THEME.fonts.display,
      }}
    >
      {title}
    </h3>
    <p
      style={{
        fontSize: "0.9rem",
        color: THEME.colors.textSecondary,
        marginBottom: 28,
        maxWidth: 400,
        margin: "0 auto 28px",
      }}
    >
      {description}
    </p>
    {action}
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
);

export default EmptyState;