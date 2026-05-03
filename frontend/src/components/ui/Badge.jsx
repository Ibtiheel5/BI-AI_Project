// src/components/ui/Badge.jsx
import React from "react";
import { THEME } from "../../constants/theme";

export const Badge = ({ children, variant = "default", size = "md" }) => {
  const variants = {
    success: { bg: THEME.colors.successSoft, color: THEME.colors.success },
    warning: { bg: THEME.colors.warningSoft, color: THEME.colors.warning },
    danger: { bg: THEME.colors.dangerSoft, color: THEME.colors.danger },
    info: { bg: THEME.colors.infoSoft, color: THEME.colors.info },
    purple: { bg: THEME.colors.purpleSoft, color: THEME.colors.purple },
    default: { bg: THEME.colors.bgAlt, color: THEME.colors.textSecondary },
  };
  const v = variants[variant] || variants.default;
  
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: size === "sm" ? "4px 10px" : "6px 14px",
        borderRadius: THEME.radii.full,
        background: v.bg,
        color: v.color,
        fontSize: size === "sm" ? "0.72rem" : "0.78rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </span>
  );
};

export default Badge;