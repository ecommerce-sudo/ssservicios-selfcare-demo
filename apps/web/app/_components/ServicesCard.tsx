"use client";

import Link from "next/link";
import React from "react";
import { Btn, Card, Pill, SectionTitle } from "../ui";

type ServiceRow = {
  id: string;
  type: "INTERNET" | "MOBILE" | string;
  name: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELED" | string;
  extra?: string | null;
};

type Props = {
  servicesTop3: ServiceRow[];
  loadingServices: boolean;
  onRefresh: () => void;

  serviceLabel: (type: string) => string;
  statusLabel: (status: string) => string;
  statusTone: (status: string) => "ok" | "warn" | "bad" | "neutral";

  rowCardStyle: React.CSSProperties;
};

export default function ServicesCard({
  servicesTop3,
  loadingServices,
  onRefresh,
  serviceLabel,
  statusLabel,
  statusTone,
  rowCardStyle,
}: Props) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minWidth: 0 }}>
        <SectionTitle>Mis servicios</SectionTitle>

        <Btn onClick={onRefresh} disabled={loadingServices} title="Refresca /v1/me/services">
          {loadingServices ? "Actualizando..." : "Refresh"}
        </Btn>
      </div>

      <div style={{ marginTop: 8, opacity: 0.75 }}>
        Resumen rápido (top 3). El detalle completo está en “Servicios”.
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
        {servicesTop3.length === 0 ? (
          <div style={{ padding: 12, opacity: 0.75 }}>— No hay servicios para mostrar —</div>
        ) : (
          servicesTop3.map((s) => (
            <div
              key={s.id}
              style={{
                ...rowCardStyle,
                width: "100%",
                minWidth: 0, // ✅ evita overflow en flex
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0, flex: "1 1 auto" }}>
                <div
                  aria-hidden
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: "rgba(123, 0, 255, 0.12)",
                    border: "1px solid rgba(123, 0, 255, 0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    flex: "0 0 auto",
                  }}
                >
                  {s.type === "INTERNET" ? "🌐" : s.type === "MOBILE" ? "📱" : "🔧"}
                </div>

                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                    }}
                    title={s.name}
                  >
                    {s.name}
                  </div>

                  {/* ✅ importantísimo: extra puede empujar el layout si no cortás */}
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      opacity: 0.75,
                      fontWeight: 800,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                    }}
                    title={`${serviceLabel(s.type)}${s.extra ? ` · ${s.extra}` : ""}`}
                  >
                    {serviceLabel(s.type)}
                    {s.extra ? ` · ${s.extra}` : ""}
                  </div>
                </div>
              </div>

              <div style={{ flex: "0 0 auto" }}>
                <Pill tone={statusTone(s.status)}>{statusLabel(s.status)}</Pill>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
        <Link href="/services" style={{ textDecoration: "none", display: "block" }}>
          <Btn>Ver servicios</Btn>
        </Link>
        <Link href="/invoices" style={{ textDecoration: "none", display: "block" }}>
          <Btn>Ver facturas</Btn>
        </Link>
      </div>
    </Card>
  );
}
