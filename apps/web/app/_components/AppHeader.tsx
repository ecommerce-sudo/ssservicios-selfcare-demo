"use client";

import Link from "next/link";
import React from "react";
import { Btn } from "../ui";

type Props = {
  brand: string;
  meName?: string | null;
  clientId?: number | null;
  loadingAccount: boolean;
  accountStatus?: string | null;
};

function bannerMessage(loadingAccount: boolean, status?: string | null) {
  if (loadingAccount) return "Cargando estado...";
  if (status === "CORTADO") return "Tu servicio figura cortado. Regularizá el estado para reactivar.";
  if (status === "CON_DEUDA") return "Tenés saldo pendiente. Revisá la próxima factura para evitar cortes.";
  return "Sin alertas críticas en este momento (demo).";
}

export default function AppHeader({ brand, meName, clientId, loadingAccount, accountStatus }: Props) {
  const topbar: React.CSSProperties = {
    background: `linear-gradient(135deg, ${brand} 0%, #2aa8db 100%)`,
    color: "white",
    padding: "16px 16px 14px",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  };

  const topbarRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  };

  const badgePill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.22)",
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
  };

  const banner: React.CSSProperties = {
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 14,
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid #e6eef5",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const bannerLeft: React.CSSProperties = { display: "flex", gap: 10, alignItems: "flex-start" };
  const bannerTitle: React.CSSProperties = { fontWeight: 900, fontSize: 13, color: "#0f172a" };
  const bannerText: React.CSSProperties = { fontSize: 12, color: "#334155", lineHeight: 1.35 };

  return (
    <div style={topbar}>
      <div style={topbarRow}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 900, letterSpacing: 0.4 }}>SSServicios</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              lineHeight: 1.15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Hola, {meName ? meName : "Cliente"}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.9 }}>Resumen de cuenta y servicios</div>
        </div>

        <div style={badgePill} title="Cliente demo">
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(255,255,255,0.85)" }} />
          ID {clientId ?? "—"}
        </div>
      </div>

      <div style={banner}>
        <div style={bannerLeft}>
          <div
            aria-hidden
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "rgba(255, 196, 0, 0.18)",
              border: "1px solid rgba(255, 196, 0, 0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
            }}
          >
            ⚠️
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={bannerTitle}>Estado operativo</div>
            <div style={bannerText}>{bannerMessage(loadingAccount, accountStatus)}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          <Link href="/invoices" style={{ textDecoration: "none" }}>
            <Btn>Facturas</Btn>
          </Link>
        </div>
      </div>
    </div>
  );
}
