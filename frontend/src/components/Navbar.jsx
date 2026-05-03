import React, { useState, useEffect } from "react";
import Button from "./ui/Button";

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
  </svg>
);

export default function Navbar({ activePage, onNavigate }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: "#1a56db",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeartIcon />
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "#111827",
            letterSpacing: "-0.3px",
          }}
        >
          Medi<span style={{ color: "#1a56db" }}>Vance</span>
        </span>
      </div>

      {/* Page Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#f3f4f6",
          borderRadius: 10,
          padding: 4,
        }}
      >
        {["home", "dashboard"].map((page) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            style={{
              padding: "7px 18px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              background: activePage === page ? "#ffffff" : "transparent",
              color: activePage === page ? "#1a56db" : "#6b7280",
              border: "none",
              cursor: "pointer",
              boxShadow: activePage === page ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {page === "home" ? "Homepage" : "Patient Dashboard"}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Button variant="ghost" size="sm">Sign In</Button>
        <Button variant="primary" size="sm">Get Started</Button>
      </div>
    </nav>
  );
}