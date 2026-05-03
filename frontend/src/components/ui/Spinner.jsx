// src/components/ui/Spinner.jsx
import React from "react";
import { THEME } from "../../constants/theme";

export const Spinner = ({ size = 28, color = THEME.colors.accent }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `3px solid ${THEME.colors.borderLight}`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      flexShrink: 0,
    }}
  >
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default Spinner;