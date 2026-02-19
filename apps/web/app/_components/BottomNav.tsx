"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

type Item = {
  label: string;
  href: string;
  icon: string; // Material Symbols name
};

function MSIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden
      style={{
        fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24`,
        fontSize: 24,
        lineHeight: 1,
      }}
    >
      {name}
    </span>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  const items: Item[] = useMemo(
    () => [
      { label: "Inicio", href: "/", icon: "home" },
      { label: "Servicios", href: "/services", icon: "lan" },
      { label: "Beneficios", href: "/benefits", icon: "workspace_premium" },
      { label: "Soporte", href: "/support", icon: "contact_support" },
    ],
    []
  );

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  const bar: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(15,23,42,0.08)",
    padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
  };

  const row: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 6,
    alignItems: "center",
  };

  return (
    <nav style={bar} aria-label="Navegación principal">
      <div style={row}>
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              style={{
                textDecoration: "none",
                color: active ? "#7b00ff" : "rgba(15,23,42,0.55)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 6px",
                borderRadius: 14,
              }}
            >
              <MSIcon name={it.icon} active={active} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 900 : 700,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
