import React from "react";

export default function Card({ children, className = "", style, hover = false, onClick }) {
  const base = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "1.25rem",
    transition: "all 0.25s ease",
  };

  const hoverStyle = hover
    ? { cursor: "pointer" }
    : {};

  return (
    <div
      className={`medivance-card ${className}`}
      style={{ ...base, ...hoverStyle, ...style }}
      onClick={onClick}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)";
        e.currentTarget.style.borderColor = "#1a56db";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e5e7eb";
      } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action, actionLabel, icon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
        paddingBottom: "0.75rem",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#111827",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {icon && <span style={{ fontSize: "16px" }}>{icon}</span>}
        {title}
      </div>
      {actionLabel && (
        <button
          onClick={action}
          style={{
            fontSize: "12px",
            color: "#1a56db",
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}