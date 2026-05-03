// src/components/ui/Tooltip.jsx
import React, { useState } from "react";
import { THEME } from "../../constants/theme";

export const Tooltip = ({ children, content, position = "top" }) => {
  const [show, setShow] = useState(false);
  
  const positions = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: "absolute",
            ...positions[position],
            background: THEME.colors.text,
            color: THEME.colors.white,
            padding: "6px 12px",
            borderRadius: THEME.radii.md,
            fontSize: "0.75rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            zIndex: 1000,
            boxShadow: THEME.shadows.lg,
            pointerEvents: "none",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;