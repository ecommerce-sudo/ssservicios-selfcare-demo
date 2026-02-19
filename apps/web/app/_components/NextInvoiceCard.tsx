"use client";

import Link from "next/link";
import React from "react";
import { Btn, Card, Pill, SectionTitle } from "../ui";

type NextInvoiceDTO = {
  invoiceId: number;
  displayNumber: string;
  amount: number;
  currency: string;
  issuedAt: string | null;
  dueDate: string | null;
  status: "ISSUED" | "VOIDED" | string;
  description: string;
};

type Props = {
  nextInvoice: NextInvoiceDTO | null;
  loadingNextInv: boolean;
  onRefresh: () => void;
  invoicePdfUrl: (invoiceId: number) => string;

  currencyFallback: string;

  accountStatus?: string | null;
  accountBadgeTone: "ok" | "warn" | "bad" | "neutral";
  accountBadgeLabel: string;

  dueBadge: (inv: { dueDate: string | null; issuedAt: string | null; status: string }) => { label: string; tone: any } | null;
  fmtDateISO: (s: string | null) => string;
  fmtMoney: (n: number) => string;

  rowCardStyle: React.CSSProperties;
};

export default function NextInvoiceCard({
  nextInvoice,
  loadingNextInv,
  onRefresh,
  invoicePdfUrl,
  currencyFallback,
  accountBadgeTone,
  accountBadgeLabel,
  dueBadge,
  fmtDateISO,
  fmtMoney,
  rowCardStyle,
}: Props) {
  return (
    <Card style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <SectionTitle>Próxima factura</SectionTitle>

        <Btn onClick={onRefresh} disabled={loadingNextInv} title="Refresca /v1/me/invoices/next">
          {loadingNextInv ? "Actualizando..." : "Refresh"}
        </Btn>
      </div>

      {nextInvoice ? (
        <div style={{ marginTop: 10, ...rowCardStyle, background: "#ffffff", border: "1px solid #e6eef5" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                {nextInvoice.displayNumber || `Factura #${nextInvoice.invoiceId}`}
              </div>

              {(() => {
                const b = dueBadge(nextInvoice);
                return b ? <Pill tone={b.tone}>{b.label}</Pill> : null;
              })()}

              <Pill tone={accountBadgeTone}>{accountBadgeLabel}</Pill>
            </div>

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, fontWeight: 800 }}>
              {nextInvoice.description || "—"}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, opacity: 0.85 }}>
              <span style={{ fontWeight: 900 }}>Vence:</span>
              <span>{fmtDateISO(nextInvoice.dueDate)}</span>
              <span style={{ fontWeight: 900, marginLeft: 10 }}>Emisión:</span>
              <span>{fmtDateISO(nextInvoice.issuedAt)}</span>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {nextInvoice.status === "VOIDED" ? (
                <Btn disabled title="Factura anulada">
                  Ver factura
                </Btn>
              ) : (
                <a
                  href={invoicePdfUrl(nextInvoice.invoiceId)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                  title="Se abre el PDF en una pestaña nueva"
                >
                  <Btn>Ver factura</Btn>
                </a>
              )}

              <Link href="/invoices" style={{ textDecoration: "none" }}>
                <Btn>Ver todas</Btn>
              </Link>
            </div>
          </div>

          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>${fmtMoney(nextInvoice.amount)}</div>
            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 800 }}>
              {(nextInvoice.currency || currencyFallback).toUpperCase()}
            </div>

            <div style={{ marginTop: 10 }}>
              <Btn disabled title="Conectaremos link de cobranzas en roadmap">
                Pagar (próximamente)
              </Btn>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 10, padding: 12, opacity: 0.75 }}>— No hay próxima factura disponible —</div>
      )}
    </Card>
  );
}
