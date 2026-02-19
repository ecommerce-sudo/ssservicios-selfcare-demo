"use client";

import Link from "next/link";
import React from "react";
import { Btn } from "../ui";

type Props = {
  brand: string; // accent (violeta)
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

function initials(name?: string | null) {
  const n = (name || "Cliente").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  const a = (parts[0]?.[0] || "C").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b).slice(0, 2);
}

export default function AppHeader({ brand, meName, clientId, loadingAccount, accountStatus }: Props) {
  // Header estilo “app” como captura (fondo claro + blur + sticky)
  const headerWrap: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(255,255,255,0.86)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
  };

  const headerRow: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const left: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  };

  const avatar: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    color: brand,
    background: "rgba(123,0,255,0.10)",
    border: `2px solid ${brand}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
    flex: "0 0 auto",
  };

  const hello: React.CSSProperties = { fontSize: 12, color: "rgba(15,23,42,0.55)", fontWeight: 700, lineHeight: 1.1 };
  const name: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.15,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const right: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: "0 0 auto",
  };

  const bellBtn: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(15, 23, 42, 0.08)",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  };

  const bellBadge: React.CSSProperties = {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 99,
    background: "#ef4444",
    border: "2px solid #fff",
  };

  const idPill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(15, 23, 42, 0.08)",
    background: "#fff",
    fontWeight: 900,
    fontSize: 12,
    color: "rgba(15,23,42,0.80)",
    whiteSpace: "nowrap",
  };

  // Banner tipo captura (amarillo suave)
  const bannerOuter: React.CSSProperties = {
    maxWidth: 720,
    margin: "10px auto 0",
    padding: "0 16px 12px",
  };

  const banner: React.CSSProperties = {
    padding: "14px 14px",
    borderRadius: 18,
    background: "rgba(255, 245, 200, 0.55)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const bannerLeft: React.CSSProperties = { display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 };

  const warnIcon: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: "rgba(245, 158, 11, 0.18)",
    border: "1px solid rgba(245, 158, 11, 0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    flex: "0 0 auto",
  };

  const bannerTitle: React.CSSProperties = { fontWeight: 900, fontSize: 15, color: "#7c2d12" };
  const bannerText: React.CSSProperties = { fontSize: 13, color: "rgba(124, 45, 18, 0.85)", lineHeight: 1.35, marginTop: 4 };

  return (
    <div>
      {/* Header sticky */}
      <div style={headerWrap}>
        <div style={headerRow}>
          <div style={left}>
            <div style={avatar} aria-label="Avatar">
              {initials(meName)}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={hello}>Hola,</div>
              <div style={name}>{meName ? meName : "Cliente"}</div>
            </div>
          </div>

          <div style={right}>
            <button style={bellBtn} title="Notificaciones (demo)" aria-label="Notificaciones">
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: "rgba(15,23,42,0.78)" }}>
                notifications
              </span>
              <span style={bellBadge} />
            </button>

            <div style={idPill} title="Cliente demo">
              <span style={{ width: 8, height: 8, borderRadius: 99, background: brand }} />
              ID {clientId ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Banner operativo */}
      <div style={bannerOuter}>
        <div style={banner}>
          <div style={bannerLeft}>
            <div aria-hidden style={warnIcon}>
              ⚠️
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={bannerTitle}>Estado operativo: {accountStatus === "CON_DEUDA" ? "Pendiente" : accountStatus === "CORTADO" ? "Cortado" : "OK"}</div>
              <div style={bannerText}>{bannerMessage(loadingAccount, accountStatus)}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
            <Link href="/invoices" style={{ textDecoration: "none" }}>
              <Btn>Ir a Facturas</Btn>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
