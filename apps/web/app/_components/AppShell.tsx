"use client";

import Link from "next/link";
import React from "react";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const header: React.CSSProperties = {
    background: "#1677ff",
    color: "white",
    padding: "14px 16px",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
  };

  const headerRow: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  };

  return (
    <div>
      <header style={header}>
        <div style={headerRow}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900, color: "white", textDecoration: "none" }}>
            <span style={{ fontSize: 18 }}>SSServicios</span>
          </Link>
        </div>
      </header>

      {/* ✅ deja lugar al footer fijo */}
      <div style={{ paddingBottom: 92 }}>{children}</div>

      {/* ✅ navegación principal tipo app */}
      <BottomNav />
    </div>
  );
}
