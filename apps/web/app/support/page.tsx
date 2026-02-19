"use client";

import React from "react";
import Link from "next/link";
import { Btn, Card, SectionTitle } from "../ui";

export default function SupportPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 16px 0" }}>
      <Card>
        <SectionTitle>Soporte</SectionTitle>

        <div style={{ marginTop: 10, opacity: 0.8, lineHeight: 1.45 }}>
          Este módulo queda activo en el roadmap. La idea es centralizar la atención y el seguimiento
          de incidencias desde la app.
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", background: "#fff" }}>
            <div style={{ fontWeight: 900 }}>Abrir ticket</div>
            <div style={{ marginTop: 6, opacity: 0.75 }}>Próximamente: formulario + adjuntos + tracking.</div>
            <div style={{ marginTop: 10 }}>
              <Btn disabled>Abrir ticket (próximamente)</Btn>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", background: "#fff" }}>
            <div style={{ fontWeight: 900 }}>Canales alternativos</div>
            <div style={{ marginTop: 6, opacity: 0.75 }}>
              Próximamente: WhatsApp / teléfono / sucursales.
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn disabled>WhatsApp</Btn>
              <Btn disabled>Llamar</Btn>
              <Btn disabled>Sucursales</Btn>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", background: "#fff" }}>
            <div style={{ fontWeight: 900 }}>Volver al inicio</div>
            <div style={{ marginTop: 10 }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <Btn>Ir a Inicio</Btn>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ height: 10 }} />
    </div>
  );
}
