"use client";

import React from "react";
import Link from "next/link";
import { Btn, Card, SectionTitle } from "../ui";

const BRAND = "#7b00ff";

function MSIcon({ name }: { name: string }) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden
      style={{
        fontVariationSettings: `'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24`,
        fontSize: 22,
        lineHeight: 1,
        color: BRAND,
      }}
    >
      {name}
    </span>
  );
}

function Box({
  title,
  desc,
  children,
  icon,
}: {
  title: string;
  desc: string;
  children?: React.ReactNode;
  icon: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 16,
        border: "1px solid rgba(123,0,255,0.10)",
        background: "#fff",
        boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(123,0,255,0.10)",
            border: "1px solid rgba(123,0,255,0.18)",
            flex: "0 0 auto",
          }}
        >
          <MSIcon name={icon} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900 }}>{title}</div>
          <div style={{ marginTop: 4, opacity: 0.75, lineHeight: 1.35 }}>{desc}</div>
        </div>
      </div>

      {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 16px 92px" }}>
      <Card>
        <SectionTitle>Soporte</SectionTitle>

        <div style={{ marginTop: 10, opacity: 0.8, lineHeight: 1.45 }}>
          Este módulo queda activo en el roadmap. La idea es centralizar la atención y el seguimiento de incidencias
          desde la app.
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <Box
            icon="support_agent"
            title="Abrir ticket"
            desc="Próximamente: formulario + adjuntos + tracking."
          >
            <Btn disabled>Abrir ticket (próximamente)</Btn>
          </Box>

          <Box
            icon="forum"
            title="Canales alternativos"
            desc="Próximamente: WhatsApp / teléfono / sucursales."
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn disabled>WhatsApp</Btn>
              <Btn disabled>Llamar</Btn>
              <Btn disabled>Sucursales</Btn>
            </div>
          </Box>

          <Box
            icon="home"
            title="Volver al inicio"
            desc="Retomá el resumen de cuenta y accesos rápidos."
          >
            <Link href="/" style={{ textDecoration: "none" }}>
              <Btn>Ir a Inicio</Btn>
            </Link>
          </Box>
        </div>
      </Card>
    </div>
  );
}
