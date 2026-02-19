"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

type Item = {
  label: string;
  href: string;
  icon: string; // Material Symbols name
};

const BRAND = "#7b00ff";

function MSIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden
      style={{
        fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24`,
        fontSize: 24,
        lineHeight: 1,
        color: active ? BRAND : "rgba(15,23,42,0.55)",
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
    WebkitBackdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(15,23,42,0.08)",
    padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
  };

  const wrapper: React.CSSProperties = {
    maxWidth: 520, // look “mobile app” incluso en desktop
    margin: "0 auto",
  };

  const row: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 6,
    alignItems: "center",
  };

  const linkBase: React.CSSProperties = {
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "6px 4px",
    borderRadius: 12,
    minWidth: 0,
  };

  const iconWrap = (active: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: active ? "rgba(123,0,255,0.10)" : "transparent",
    border: active ? "1px solid rgba(123,0,255,0.18)" : "1px solid transparent",
  });

  return (
    <nav style={bar} aria-label="Navegación principal">
      <div style={wrapper}>
        <div style={row}>
          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                style={{
                  ...linkBase,
                  color: active ? BRAND : "rgba(15,23,42,0.55)",
                }}
              >
                <div style={iconWrap(active)}>
                  <MSIcon name={it.icon} active={active} />
                </div>

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 900 : 700,
                    letterSpacing: 0.4,
                    textTransform: "none", // más parecido a la captura
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
