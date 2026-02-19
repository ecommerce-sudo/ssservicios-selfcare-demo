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
        fontSize: 26,
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

        // ✅ anti-overflow
        width: "100%",
        minWidth: 0,
      }}
    >
      <div
  aria-hidden
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  }}
>
  {icon}
</div>


      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: "#0f172a",
          opacity: 0.9,
          lineHeight: 1.15,

          // ✅ evita que una palabra rara empuje el grid
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
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,

    // ✅ anti-overflow
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
        <Item label="Servicios" icon={<MSIcon name="lan" />} href="/services" />
        <Item label="Beneficios" icon={<MSIcon name="workspace_premium" filled />} href="/benefits" />
        <Item
          label="SSStore"
          icon={<MSIcon name="shopping_bag" />}
          onClick={openStore}
          title="Abre SSStore en una pestaña nueva"
        />
        <Item label="Soporte" icon={<MSIcon name="support_agent" />} title="Próximo: soporte / tickets" />
        <Item label="Débito" icon={<MSIcon name="credit_card" />} title="Próximo: débito automático" />
        <Item label="Perfil" icon={<MSIcon name="person" />} title="Próximo: perfil y datos" />
        <Item label="Más" icon={<MSIcon name="add_circle" />} title="Más opciones (demo)" />
      </div>
    </Card>
  );
}
