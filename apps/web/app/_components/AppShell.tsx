"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

type ComingSoonItem = {
  label: string;
  note?: string;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Inicio", href: "/" },
      { label: "Servicios", href: "/services" },
      { label: "Beneficios", href: "/benefits" },
    ],
    []
  );

  const comingSoon: ComingSoonItem[] = useMemo(
    () => [
      { label: "Facturas", note: "Próximamente" },
      { label: "Pagos", note: "Próximamente" },
    ],
    []
  );

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
    justifyContent: "space-between",
    gap: 12,
  };

  const burgerBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)",
    cursor: "pointer",
    fontWeight: 900,
    color: "white",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <div>
      <header style={header}>
        <div style={headerRow}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900 }}>
            <span style={{ fontSize: 18 }}>SSServicios</span>
          </Link>

          <button style={burgerBtn} onClick={() => setMenuOpen(true)} aria-label="Menu">
            ☰
          </button>
        </div>
      </header>

      {/* Drawer */}
      {menuOpen ? (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 290,
              height: "100%",
              background: "#1677ff",
              color: "white",
              padding: 16,
              boxShadow: "10px 0 30px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>SSServicios</div>
              <button
                style={{ ...burgerBtn, width: 38, height: 38, borderRadius: 10 }}
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
              {navItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "10px 10px",
                    borderRadius: 12,
                    background: active(it.href) ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
                    border: active(it.href) ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.18)",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span>{it.label}</span>
                  {active(it.href) ? <span style={{ fontSize: 12, opacity: 0.9 }}>•</span> : null}
                </Link>
              ))}

              <div style={{ height: 8 }} />

              {comingSoon.map((it) => (
                <div
                  key={it.label}
                  title="Próximamente"
                  style={{
                    padding: "10px 10px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px dashed rgba(255,255,255,0.22)",
                    opacity: 0.65,
                    cursor: "not-allowed",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span>{it.label}</span>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>{it.note ?? "Próximamente"}</span>
                </div>
              ))}

              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                Demo: lo que no existe aún queda en “Próximamente”.
              </div>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ fontSize: 12, opacity: 0.85, borderTop: "1px solid rgba(255,255,255,0.18)", paddingTop: 12 }}>
              v1 · Selfcare Demo
            </div>
          </div>
        </div>
      ) : null}

      {children}
    </div>
  );
}
