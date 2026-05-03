import React from "react";

export function SkeletonBox({ width = "100%", height = 16, radius = 4, style }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <SkeletonBox width={40} height={40} radius={20} />
        <div style={{ flex: 1 }}>
          <SkeletonBox height={14} style={{ marginBottom: 8 }} />
          <SkeletonBox width="60%" height={12} />
        </div>
      </div>
      <SkeletonBox height={12} style={{ marginBottom: 8 }} />
      <SkeletonBox width="80%" height={12} style={{ marginBottom: 8 }} />
      <SkeletonBox width="60%" height={12} />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div style={{ padding: "2rem" }}>
      {/* patient card skeleton */}
      <div
        style={{
          background: "#e5e7eb",
          borderRadius: 20,
          padding: "1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <SkeletonBox width={68} height={68} radius={34} />
        <div style={{ flex: 1 }}>
          <SkeletonBox width={200} height={18} style={{ marginBottom: 10 }} />
          <SkeletonBox width="60%" height={12} style={{ marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <SkeletonBox width={90} height={24} radius={12} />
            <SkeletonBox width={110} height={24} radius={12} />
            <SkeletonBox width={120} height={24} radius={12} />
          </div>
        </div>
      </div>

      {/* metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "1.2rem",
              display: "flex",
              gap: 12,
            }}
          >
            <SkeletonBox width={44} height={44} radius={10} />
            <div style={{ flex: 1 }}>
              <SkeletonBox height={22} style={{ marginBottom: 8 }} />
              <SkeletonBox width="70%" height={12} />
            </div>
          </div>
        ))}
      </div>

      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}