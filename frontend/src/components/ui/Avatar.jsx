import React from "react";

export default function Avatar({
  initials,
  color = "#2563eb",
  size = 40,
  status,
  fontSize,
}) {
  const statusColors = {
    available: "#059669",
    busy: "#d97706",
    offline: "#9ca3af",
  };

  return (
    <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: fontSize || Math.floor(size * 0.32),
          fontWeight: 700,
          color: "#ffffff",
          userSelect: "none",
        }}
      >
        {initials}
      </div>

      {status && (
        <div
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: Math.floor(size * 0.28),
            height: Math.floor(size * 0.28),
            borderRadius: "50%",
            background: statusColors[status] ?? "#9ca3af",
            border: "2px solid #ffffff",
          }}
        />
      )}
    </div>
  );
}