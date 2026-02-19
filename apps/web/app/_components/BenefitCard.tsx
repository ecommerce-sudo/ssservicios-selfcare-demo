"use client";

import Link from "next/link";
import React from "react";
import { Btn, Card, SectionTitle } from "../ui";

type Props = {
  tier: string;
  accent: string;
  currency: string;
  cupo: number;

  me: {
    purchaseAvailableOfficial: number;
    purchaseAvailableReserved: number;
    purchaseAvailable: number;
  } | null;

  brand: string;
  apiBase: string;

  benefitWrapStyle: React.CSSProperties;
  tierBadgeStyle: React.CSSProperties;
  benefitAmountStyle: React.CSSProperties;
  benefitBtnStyle: React.CSSProperties;

  fmtMoney: (n: number) => string;
  openStore: () => void;

  actionError: string | null;
};

export default function BenefitCard({
  tier,
  accent,
  currency,
  cupo,
  me,
  brand,
  apiBase,
  benefitWrapStyle,
  tierBadgeStyle,
  benefitAmountStyle,
  benefitBtnStyle,
  fmtMoney,
  openStore,
  actionError,
}: Props) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <SectionTitle>Beneficio disponible</SectionTitle>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 12, color: "#0f172a" }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: accent }} />
          {tier}
        </div>
      </div>

      <div style={{ marginTop: 10, opacity: 0.75 }}>
        Usalo para comprar en <b>SSStore</b> en <b>3 cuotas sin interés</b>.
      </div>

      <div style={{ marginTop: 12, ...benefitWrapStyle }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>SSSERVICIOS</div>
          <div style={tierBadgeStyle}>{tier}</div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9, fontWeight: 800, letterSpacing: 1.4 }}>
          DISPONIBLE HOY
        </div>

        <div style={benefitAmountStyle}>${fmtMoney(cupo)}</div>

        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontWeight: 800 }}>
          {currency} · 3 cuotas sin interés
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button style={benefitBtnStyle} onClick={openStore}>
            🛒 Usar beneficio en SSStore
          </button>

          <Link href="/benefits" style={{ textDecoration: "none", flex: "1 1 220px" }}>
            <Btn style={{ width: "100%" }} title="Ver detalle operativo del beneficio">
              Ver detalle
            </Btn>
          </Link>
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.18)",
            padding: "10px 12px",
            borderRadius: 12,
            lineHeight: 1.35,
          }}
        >
          ℹ️ En checkout elegí <b>"Financiación en Factura SSServicios"</b> e ingresá tu <b>número de cliente</b>.
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontWeight: 900 }}>Cupo oficial</span>
          <span>{me ? `${fmtMoney(me.purchaseAvailableOfficial)} ${currency}` : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
          <span style={{ fontWeight: 900 }}>Reservado</span>
          <span>{me ? `${fmtMoney(me.purchaseAvailableReserved)} ${currency}` : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
          <span style={{ fontWeight: 900 }}>Disponible</span>
          <span>{me ? `${fmtMoney(me.purchaseAvailable)} ${currency}` : "—"}</span>
        </div>

        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>API base</span>
          <code style={{ fontSize: 12, opacity: 0.9 }}>{apiBase}</code>
        </div>
      </div>

      {actionError ? (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff3f3", border: "1px solid #f1b4b4" }}>
          <b>Error:</b> <span style={{ fontFamily: "monospace" }}>{actionError}</span>
        </div>
      ) : null}
    </Card>
  );
}
