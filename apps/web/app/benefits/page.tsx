"use client";

import { useEffect, useMemo, useState } from "react";

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

function getTier(cupo: number): { tier: Tier; bg: string } {
  if (cupo < 200000) return { tier: "INFINIUM", bg: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)" };
  if (cupo < 500000) return { tier: "CLASSIC", bg: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)" };
  return { tier: "BLACK", bg: "linear-gradient(135deg, #232526 0%, #414345 100%)" };
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
  const { tier, bg } = getTier(cupo);

  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    padding: 16,
  };

  const container: React.CSSProperties = { maxWidth: 720, margin: "0 auto" };
  const card: React.CSSProperties = {
    marginTop: 14,
    background: "white",
    borderRadius: 18,
    boxShadow: "0 10px 40px rgba(0,0,0,0.10)",
    padding: 16,
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
  };

  const benefitWrap: React.CSSProperties = {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    color: "white",
    background: bg,
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
  };

  const cta: React.CSSProperties = {
    width: "100%",
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    color: "#052e2b",
    backgroundImage: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)",
  };

  return (
    <div style={shell}>
      <div style={container}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Beneficios</h1>
          <button style={btn} onClick={load} disabled={loading}>
            {loading ? "Actualizando..." : "Refresh"}
          </button>
        </div>

        <section style={card}>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            Detalle del beneficio de compra (demo).
          </div>

          {err ? (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff3f3", border: "1px solid #f1b4b4" }}>
              <b>Error:</b> <span style={{ fontFamily: "monospace" }}>{err}</span>
            </div>
          ) : null}

          <div style={benefitWrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 900 }}>SSSERVICIOS</div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, background: "rgba(0,0,0,0.14)", padding: "6px 10px", borderRadius: 999 }}>
                {tier}
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.9, fontWeight: 900, letterSpacing: 1.4 }}>
              BENEFICIO DISPONIBLE
            </div>

            <div style={{ marginTop: 8, fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>
              ${fmt(cupo)}
            </div>

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontWeight: 800 }}>
              {me?.currency ?? "ARS"} · 3 cuotas sin interés
            </div>

            <button style={cta} onClick={openStore}>
              🛒 Usar beneficio en SSStore
            </button>

            <div style={{ marginTop: 10, fontSize: 12, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)", padding: "10px 12px", borderRadius: 12 }}>
              ℹ️ En checkout elegí <b>"Financiación en Factura SSServicios"</b> e ingresá tu <b>número de cliente</b>.
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 8, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 900 }}>Cupo oficial</span>
              <span>{me ? `${fmt(me.purchaseAvailableOfficial)} ${me.currency}` : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 900 }}>Reservado</span>
              <span>{me ? `${fmt(me.purchaseAvailableReserved)} ${me.currency}` : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 900 }}>Disponible</span>
              <span>{me ? `${fmt(me.purchaseAvailable)} ${me.currency}` : "—"}</span>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 12 }}>
          <a href="/" style={{ fontWeight: 900 }}>← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
