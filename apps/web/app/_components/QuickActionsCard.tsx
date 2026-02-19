"use client";

import Link from "next/link";
import React from "react";
import { Btn, Card, SectionTitle } from "../ui";

type Props = {
  showAdmin: boolean;
  onToggleAdmin: () => void;
  openStore: () => void;
};

function MSIcon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24`,
        fontSize: 22,
        lineHeight: 1,
        color: "#7b00ff",
      }}
    >
      {name}
    </span>
  );
}

function Item({
  label,
  icon,
  href,
  onClick,
  title,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  title?: string;
}) {
  const content = (
    <div
      title={title}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 8,
        padding: "14px 10px",
        borderRadius: 16,
        border: "1px solid rgba(123,0,255,0.10)",
        background: "#fff",
        boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* ✅ sin círculo contenedor: icono “libre” */}
      <div aria-hidden style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#0f172a",
          opacity: 0.9,
          lineHeight: 1.15,
          width: "100%",
          minWidth: 0,
        }}
      >
        {label}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block", width: "100%", minWidth: 0 }}>
        {content}
      </Link>
    );
  }
  return content;
}

export default function QuickActionsCard({ showAdmin, onToggleAdmin, openStore }: Props) {
  const gridStyle: React.CSSProperties = {
    marginTop: 12,
    display: "grid",
    // ✅ 2 cols mobile, 4 cols desktop
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    width: "100%",
    minWidth: 0,
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minWidth: 0 }}>
        <SectionTitle>Accesos rápidos</SectionTitle>
        <Btn onClick={onToggleAdmin} title="Panel técnico (demo)">
          {showAdmin ? "Ocultar admin" : "Mostrar admin"}
        </Btn>
      </div>

      <div style={gridStyle}>
        <Item label="Facturas" icon={<MSIcon name="receipt_long" filled />} href="/invoices" />
        <Item
          label="SSStore"
          icon={<MSIcon name="shopping_bag" />}
          onClick={openStore}
          title="Abre SSStore en una pestaña nueva"
        />
        <Item label="Soporte" icon={<MSIcon name="support_agent" />} href="/support" />
        <Item label="Perfil" icon={<MSIcon name="person" />} title="Próximo: perfil y datos" />
      </div>

      {/* ✅ media query simple inline: 4 cols si hay ancho suficiente */}
      <style jsx>{`
        @media (min-width: 640px) {
          div[style] > :global(div[style*="grid-template-columns"]) {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </Card>
  );
}
