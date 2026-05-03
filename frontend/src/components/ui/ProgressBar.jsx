// src/components/ui/ProgressBar.jsx
import React from "react";
import { THEME } from "../../constants/theme";

export const ProgressBar = ({ value, max = 100, color = THEME.colors.accent, height = 6, showLabel = false }) => (
  <div style={{ width: "100%" }}>
    {showLabel && (
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.8rem", color: THEME.colors.textSecondary }}>Progression</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color }}>{Math.round((value / max) * 100)}%</span>
      </div>
    )}
    <div
      style={{
        width: "100%",
        height,
        borderRadius: THEME.radii.full,
        background: THEME.colors.bgAlt,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${(value / max) * 100}%`,
          height: "100%",
          background: color,
          borderRadius: THEME.radii.full,
          transition: THEME.transitions.slow,
          boxShadow: `0 0 10px ${color}40`,
        }}
      />
    </div>
  </div>
);

export default ProgressBar;