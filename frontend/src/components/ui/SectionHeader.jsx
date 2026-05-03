// src/components/ui/SectionHeader.jsx
import React from "react";
import { Badge } from "./Badge";
import { THEME } from "../../constants/theme";

export const SectionHeader = ({ title, subtitle, action, badge, size = "default" }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: size === "large" ? 32 : 24,
      flexWrap: "wrap",
      gap: 16,
    }}
  >
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <h2
          style={{
            fontSize: size === "large" ? "1.8rem" : "1.5rem",
            fontWeight: 700,
            color: THEME.colors.text,
            fontFamily: THEME.fonts.display,
            margin: 0,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h2>
        {badge && <Badge variant={badge.variant} size="sm">{badge.text}</Badge>}
      </div>
      {subtitle && (
        <p style={{ fontSize: "0.9rem", color: THEME.colors.textSecondary, margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default SectionHeader;