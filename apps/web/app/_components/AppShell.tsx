"use client";

import React from "react";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* ✅ deja lugar al footer fijo */}
      <div style={{ paddingBottom: 92 }}>{children}</div>

      {/* ✅ navegación principal tipo app */}
      <BottomNav />
    </div>
  );
}
