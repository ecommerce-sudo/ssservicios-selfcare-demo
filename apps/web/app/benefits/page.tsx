"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Btn, Card, SectionTitle } from "../ui";

type MeResponse = {
  clientId: number;
  name: string;
  purchaseAvailableOfficial: number;
  purchaseAvailableReserved: number;
  purchaseAvailable: number;
  currency: string;
};

const DEFAULT_API_BASE = "https://ssservicios-selfcare-demo.onrender.com";
const DEFAULT_STORE_URL = "https://ssstore.com.ar";

type Tier = "INFINIUM" | "CLASSIC" | "BLACK";

function getTier(cupo: number): { tier: Tier; accent: string; bg: string } {
  if (cupo < 200000)
    return {
      tier: "INFINIUM",
      accent: "#16a34a",
      bg: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
    };
  if (cupo < 500000)
    return {
      tier: "CLASSIC",
      accent: "#0891b2",
      bg: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)",
    };
  return {
    tier: "BLACK",
    accent: "#111827",
    bg: "linear-gradient(135deg, #232526 0%, #414345 100%)",
  };
}

export default function BenefitsPage() {
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE, []);
  const STORE_URL = useMemo(() => process.env.NEXT_PUBLIC_STORE_URL || DEFAULT_STORE_URL, []);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchJSON(path: string) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg = (data && (data.detail || data.error || data.message)) || `HTTP ${res.status} ${res.statusText}`;
      throw new Error(`${msg} | url=${url}`);
    }

    return data;
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = (await fetchJSON("/v1/me")) as MeResponse;
      setMe(data);
    } catch (e: any) {
      console.error(e);
      setMe(null);
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openStore() {
    window.open(STORE_URL, "_blank", "noopener,noreferrer");
  }

  const fmt = (n: number) => n.toLocaleString("es-AR");

  const cupo = me?.purchaseAvailable ?? 0;
  const { tier, accent, bg } = getTier(cupo);

  // ===== Styles puntuales (lo que conviene mantener local) =====
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    paddingBottom: 36,
  };

  const container: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    padding: "18px 16px 0",
  };

  // “Tarjeta elegante” (delicada, no gigante)
  const benefitWrap: React.CSSProperties = {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    color: "white",
    background: bg,
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
  };

  const benefitTop: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  };

  const tierBadge: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2.2,
    opacity: 0.9,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.14)",
    whiteSpace: "nowrap",
  };

  const benefitAmount: React.CSSProperties = {
    marginTop: 10,
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: -1,
    lineHeight: 1.05,
    textShadow: "0 4px 10px rgba(0,0,0,0.22)",
  };

  const benefitCtaRow: React.CSSProperties = {
    marginTop: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const storeBtn: React.CSSProperties = {
    flex: "1 1 240px",
    padding: "12px 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    letterSpacing: 0.2,
    color: "#052e2b",
    backgroundImage: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)",
    boxShadow: "0 12px 28px rgba(0, 201, 255, 0.30)",
  };

  const benefitHint: React.CSSProperties = {
    marginTop: 10,
    fontSize: 12,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "10px 12px",
    borderRadius: 12,
    lineHeight: 1.35,
  };

  const metricRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  };

  const metricLabel: React.CSSProperties = { fontWeight: 900 };

  return (
    <div style={shell}>
      <div style={container}>
        {/* Header de página (sin drawer) */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Beneficios</h1>
            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.75 }}>
              Detalle operativo del beneficio de compra.
            </div>
          </div>

          <Btn onClick={load} disabled={loading} title="Refresca /v1/me">
            {loading ? "Actualizando..." : "Refresh"}
          </Btn>
        </div>

        <Card>
          {/* Error */}
          {err ? (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: "#fff3f3",
                border: "1px solid #f1b4b4",
              }}
            >
              <b>Error:</b> <span style={{ fontFamily: "monospace" }}>{err}</span>
            </div>
          ) : null}

          {/* Benefit card */}
          <div style={benefitWrap}>
            <div style={benefitTop}>
              <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>SSSERVICIOS</div>
              <div style={tierBadge}>{tier}</div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9, fontWeight: 800, letterSpacing: 1.4 }}>
              DISPONIBLE HOY
            </div>

            <div style={benefitAmount}>${fmt(cupo)}</div>

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontWeight: 800 }}>
              {me?.currency ?? "ARS"} · 3 cuotas sin interés
            </div>

            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: accent, boxShadow: "0 0 12px rgba(0,0,0,0.12)" }} />
              Tier {tier}
            </div>

            {/* ✅ CTA: solo SSStore */}
            <div style={benefitCtaRow}>
              <button style={storeBtn} onClick={openStore}>
                🛒 Usar beneficio en SSStore
              </button>
            </div>

            <div style={benefitHint}>
              ℹ️ En checkout elegí <b>"Financiación en Factura SSServicios"</b> e ingresá tu <b>número de cliente</b>.
            </div>
          </div>

          {/* Detalle operativo */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <SectionTitle>Detalle operativo</SectionTitle>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Cliente: <b>{me ? `${me.name} (ID ${me.clientId})` : "—"}</b>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10, fontSize: 14 }}>
              <div style={metricRow}>
                <span style={metricLabel}>Cupo oficial</span>
                <span>{me ? `${fmt(me.purchaseAvailableOfficial)} ${me.currency}` : "—"}</span>
              </div>

              <div style={metricRow}>
                <span style={metricLabel}>Reservado</span>
                <span>{me ? `${fmt(me.purchaseAvailableReserved)} ${me.currency}` : "—"}</span>
              </div>

              <div style={metricRow}>
                <span style={metricLabel}>Disponible</span>
                <span>{me ? `${fmt(me.purchaseAvailable)} ${me.currency}` : "—"}</span>
              </div>

              <div style={{ marginTop: 6, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, opacity: 0.8 }}>
                  <span>API base</span>
                  <code style={{ fontSize: 12, opacity: 0.9 }}>{API_BASE}</code>
                </div>
              </div>
            </div>
          </div>

          {/* CTA secundarios */}
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Btn>← Volver al inicio</Btn>
            </Link>

            <Btn
              onClick={() => window.alert("Opcional: acá va 'Últimos movimientos' cuando tengamos endpoint.")}
              title="Próximamente: historial/movimientos"
            >
              Ver movimientos (próximamente)
            </Btn>
          </div>
        </Card>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, opacity: 0.65 }}>
          Beneficio sujeto a reglas de elegibilidad (plan, historial de pagos, antigüedad).
        </div>
      </div>
    </div>
  );
}
