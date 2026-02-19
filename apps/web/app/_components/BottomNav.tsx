"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Item = {
  href: string;
  label: string;
  icon: string; // material symbol name
};

const ITEMS: Item[] = [
  { href: "/", label: "INICIO", icon: "home" },
  { href: "/services", label: "SERVICIOS", icon: "lan" },
  { href: "/benefits", label: "BENEFICIOS", icon: "workspace_premium" },
  { href: "/support", label: "SOPORTE", icon: "contact_support" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function BottomNav() {
  const pathname = usePathname() || "/";

  const wrap: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderTop: "1px solid rgba(15, 23, 42, 0.08)",
    padding: "8px 10px calc(10px + env(safe-area-inset-bottom))",
  };

  const inner: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    gap: 6,
  };

  const itemBase: React.CSSProperties = {
    flex: "1 1 0",
    minWidth: 0,
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "6px 6px",
    borderRadius: 14,
  };

  const labelBase: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.1,
    lineHeight: 1,
  };

  return (
    <nav style={wrap} aria-label="Navegación principal">
      <div style={inner}>
        {ITEMS.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              style={{
                ...itemBase,
                color: active ? "#7b00ff" : "rgba(15,23,42,0.45)",
              }}
            >
              <span
                className="material-symbols-outlined"
                aria-hidden
                style={{
                  fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24`,
                  fontSize: 24,
                  lineHeight: 1,
                }}
              >
                {it.icon}
              </span>
              <span style={{ ...labelBase, color: active ? "#7b00ff" : "rgba(15,23,42,0.45)" }}>
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
