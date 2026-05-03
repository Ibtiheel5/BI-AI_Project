import React from "react";

const styles = {
  primary: {
    background: "#1a56db",
    color: "#ffffff",
    border: "none",
    boxShadow: "none",
  },
  ghost: {
    background: "transparent",
    color: "#374151",
    border: "1px solid #d1d5db",
  },
  outline: {
    background: "rgba(255,255,255,0.1)",
    color: "#ffffff",
    border: "1.5px solid rgba(255,255,255,0.3)",
    backdropFilter: "blur(4px)",
  },
  danger: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },
  success: {
    background: "#ecfdf5",
    color: "#059669",
    border: "1px solid #a7f3d0",
  },
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  fullWidth = false,
  style,
}) {
  const sizes = {
    sm: { padding: "6px 12px", fontSize: "12px" },
    md: { padding: "9px 18px", fontSize: "13.5px" },
    lg: { padding: "12px 24px", fontSize: "15px" },
  };

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    borderRadius: "10px",
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.2s ease",
    width: fullWidth ? "100%" : undefined,
    ...sizes[size],
    ...styles[variant],
    ...style,
  };

  return (
    <button
      style={base}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.background = "#1d4ed8";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(26,86,219,0.3)";
        } else if (variant === "ghost") {
          e.currentTarget.style.background = "#f3f4f6";
          e.currentTarget.style.borderColor = "#9ca3af";
        } else if (variant === "outline") {
          e.currentTarget.style.background = "rgba(255,255,255,0.18)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        Object.assign(e.currentTarget.style, base);
      }}
    >
      {children}
    </button>
  );
}