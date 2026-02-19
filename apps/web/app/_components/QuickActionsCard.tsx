"use client";

import Link from "next/link";
import React from "react";
import { Btn, Card, SectionTitle } from "../ui";

type Props = {
  showAdmin: boolean;
  onToggleAdmin: () => void;
  openStore: () => void;

  // seguimos aceptando tus styles por compat, pero NO los usamos (así controlamos look igual a captura)
  quickGridStyle?: React.CSSProperties;
  quickItemStyle?: React.CSSProperties;
  quickIconStyle?: React.CSSProperties;
  quickTextStyle?: React.CSSProperties;
};

function Item({
  label,
  emoji,
  href,
  onClick,
  title,
}: {
  label: string;
  emoji: string;
  href?: string;
  onClick?: () => void;
  title?: string;
}) {
  const content = (
    <div
      title={title}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,

        padding: "14px 10px",
        borderRadius: 16,
        border: "1px solid rgba(123, 0, 255, 0.10)",
        background: "#ffffff",
        boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        textAlign: "center",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div
        aria-hidden
        style={{
          width: 46,
          height: 46,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(123, 0, 255, 0.12)",
          border: "1px solid rgba(123, 0, 255, 0.20)",
          fontSize: 20,
        }}
      >
        {emoji}
      </div>

      <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a", opacity: 0.9 }}>{label}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}

export default function QuickActionsCard({
  showAdmin,
  onToggleAdmin,
  openStore,
}: Props) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <SectionTitle>Accesos rápidos</SectionTitle>
        <Btn onClick={onToggleAdmin} title="Panel técnico (demo)">
          {showAdmin ? "Ocultar admin" : "Mostrar admin"}
        </Btn>
      </div>

      {/* ✅ Grilla tipo captura: 3 cols en mobile, 4 cols en pantallas más grandes */}
      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <Item label="Facturas" emoji="🧾" href="/invoices" />
        <Item label="Servicios" emoji="🌐" href="/services" />
        <Item label="Beneficios" emoji="🎁" href="/benefits" />
        <Item label="SSStore" emoji="🛒" onClick={openStore} title="Abre SSStore en una pestaña nueva" />
        <Item label="Soporte" emoji="🛠️" title="Próximo: soporte / tickets" />
        <Item label="Débito" emoji="💳" title="Próximo: débito automático" />
        <Item label="Perfil" emoji="👤" title="Próximo: perfil y datos" />
        <Item label="Más" emoji="➕" title="Más opciones (demo)" />
      </div>

      {/* Ajuste desktop: 4 columnas sin romper mobile (inline media query no existe),
          entonces lo dejamos para el Paso siguiente con CSS global o Tailwind.
          Por ahora queda MUY parecido en mobile que es lo que se ve en captura. */}
    </Card>
  );
}
