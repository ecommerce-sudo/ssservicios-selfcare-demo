"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Card } from "../ui";

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

// violeta
const BRAND = "#7b00ff";

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString("es-AR");
}

function MSIcon({
  name,
  filled,
  size = 22,
  color = "#111827",
}: {
  name: string;
  filled?: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24`,
        fontSize: size,
        lineHeight: 1,
        color,
      }}
    >
      {name}
    </span>
  );
}

export default function BenefitsPage() {
  const router = useRouter();

  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE, []);
  const STORE_URL = useMemo(() => process.env.NEXT_PUBLIC_STORE_URL || DEFAULT_STORE_URL, []);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function loadMe() {
    setLoading(true);
    try {
      const data = (await fetchJSON("/v1/me")) as MeResponse;
      setMe(data);
    } catch (e) {
      console.error(e);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currency = (me?.currency ?? "ARS").toUpperCase();
  const cupoOficial = me?.purchaseAvailableOfficial ?? 0;
  const reservado = me?.purchaseAvailableReserved ?? 0;
  const disponible = me?.purchaseAvailable ?? 0;

  function openStore() {
    window.open(STORE_URL, "_blank", "noopener,noreferrer");
  }

  // ====== Styles (match captura) ======
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f4f4f6",
    paddingBottom: 92, // deja espacio al footer fijo
  };

  const container: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    padding: "12px 16px 0",
  };

  const appbar: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "#ffffffcc",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
  };

  const appbarRow: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    padding: "12px 12px",
    display: "grid",
    gridTemplateColumns: "44px 1fr 44px",
    alignItems: "center",
    gap: 8,
  };

  const iconBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(15, 23, 42, 0.08)",
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  const premiumCard: React.CSSProperties = {
    borderRadius: 22,
    padding: 18,
    color: "#fff",
    background:
      "radial-gradient(1000px 380px at 70% 0%, rgba(123,0,255,0.30) 0%, rgba(123,0,255,0.0) 55%), linear-gradient(135deg, #0b1220 0%, #111827 45%, #0b1220 100%)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
    position: "relative",
    overflow: "hidden",
  };

  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.8,
  };

  const amount: React.CSSProperties = {
    marginTop: 10,
    fontSize: 42,
    fontWeight: 900,
    letterSpacing: -1,
    lineHeight: 1,
  };

  const sub: React.CSSProperties = {
    marginTop: 6,
    opacity: 0.85,
    fontWeight: 700,
  };

  const ctas: React.CSSProperties = {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  };

  const primaryBtn: React.CSSProperties = {
    borderRadius: 14,
    border: "none",
    padding: "12px 14px",
    fontWeight: 900,
    cursor: "pointer",
    background: `linear-gradient(135deg, ${BRAND} 0%, #b88cff 100%)`,
    color: "#fff",
    boxShadow: "0 14px 30px rgba(123,0,255,0.35)",
  };

  const ghostBtn: React.CSSProperties = {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "12px 14px",
    fontWeight: 900,
    cursor: "pointer",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
  };

  const detailCard: React.CSSProperties = {
    borderRadius: 18,
    overflow: "hidden",
  };

  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 14px",
    borderTop: "1px solid rgba(15,23,42,0.06)",
  };

  const left: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, minWidth: 0 };
  const rowIcon: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: "rgba(148,163,184,0.14)",
    border: "1px solid rgba(148,163,184,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  };

  const rowLabel: React.CSSProperties = { fontWeight: 900, color: "#0f172a" };
  const rowSub: React.CSSProperties = { fontSize: 12, opacity: 0.7, fontWeight: 700 };

  const moreRow: React.CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
    padding: "0 2px",
  };

  const carousel: React.CSSProperties = {
    marginTop: 10,
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 8,
    WebkitOverflowScrolling: "touch",
  };

  const promoCard: React.CSSProperties = {
    minWidth: 180,
    maxWidth: 180,
    borderRadius: 18,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.06)",
    boxShadow: "0 14px 28px rgba(0,0,0,0.08)",
    flex: "0 0 auto",
  };

  const promoImg: React.CSSProperties = { height: 110, background: "#0f172a", position: "relative" };

  const promoTag: React.CSSProperties = {
    position: "absolute",
    top: 10,
    left: 10,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.92)",
    fontWeight: 900,
    fontSize: 12,
    color: BRAND,
  };

  const promoBody: React.CSSProperties = { padding: 12 };
  const promoTitle: React.CSSProperties = { fontWeight: 900, color: "#0f172a" };
  const promoCat: React.CSSProperties = { marginTop: 4, fontSize: 12, opacity: 0.7, fontWeight: 700 };

  // demo promos (después lo conectamos a data real)
  const promos = [
    { tag: "20% OFF", title: "Coto", cat: "Supermercados" },
    { tag: "2x1", title: "Pizzería Güerrín", cat: "Gastronomía" },
    { tag: "15% OFF", title: "Cine", cat: "Entretenimiento" },
  ];

  return (
    <div style={page}>
      {/* Appbar como la captura */}
      <div style={appbar}>
        <div style={appbarRow}>
          <button style={iconBtn} onClick={() => router.back()} aria-label="Volver">
            <MSIcon name="arrow_back" />
          </button>

          <div style={{ textAlign: "center", fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Beneficios</div>

          <button style={iconBtn} onClick={() => alert("Filtro (demo)")} aria-label="Filtrar">
            <MSIcon name="tune" />
          </button>
        </div>
      </div>

      <div style={container}>
        {/* Premium card */}
        <div style={premiumCard}>
          <div style={pill}>PREMIUM MEMBER</div>

          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, letterSpacing: -0.4 }}>
            SSServicios <span style={{ opacity: 0.55 }}>BLACK</span>
          </div>

          <div style={{ marginTop: 14, opacity: 0.85, fontWeight: 800 }}>Cupo Disponible</div>

          <div style={amount}>
            ${fmtMoney(disponible)} <span style={{ fontSize: 14, opacity: 0.7, fontWeight: 900 }}>{currency}</span>
          </div>

          <div style={sub}>3 cuotas sin interés</div>

          <div style={ctas}>
            <button style={primaryBtn} onClick={openStore}>
              Usar Beneficio
            </button>

            <button
              style={ghostBtn}
              onClick={() => router.push("/benefits")}
              title="Luego lo conectamos a movimientos reales"
            >
              Ver Movimientos
            </button>
          </div>
        </div>

        {/* Detalle de cupo */}
        <div style={{ marginTop: 14 }}>
          <Card style={detailCard}>
            <div style={{ padding: "14px 14px", fontWeight: 900, fontSize: 16 }}>Detalle de cupo</div>

            <div style={row}>
              <div style={left}>
                <div style={rowIcon}>
                  <MSIcon name="account_balance_wallet" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={rowLabel}>Cupo oficial</div>
                  <div style={rowSub}>Asignado por plan y perfil</div>
                </div>
              </div>
              <div style={{ fontWeight: 900 }}>${fmtMoney(cupoOficial)}</div>
            </div>

            <div style={row}>
              <div style={left}>
                <div style={rowIcon}>
                  <MSIcon name="lock" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={rowLabel}>Reservado</div>
                  <div style={rowSub}>Compras en curso</div>
                </div>
              </div>
              <div style={{ fontWeight: 900 }}>${fmtMoney(reservado)}</div>
            </div>

            <div style={{ ...row, borderTop: "1px solid rgba(15,23,42,0.06)" }}>
              <div style={left}>
                <div style={{ ...rowIcon, background: "rgba(123,0,255,0.12)", border: "1px solid rgba(123,0,255,0.22)" }}>
                  <MSIcon name="check_circle" filled color={BRAND} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...rowLabel }}>Disponible</div>
                  <div style={rowSub}>{loading ? "Actualizando..." : "Listo para usar"}</div>
                </div>
              </div>
              <div style={{ fontWeight: 900, color: BRAND }}>${fmtMoney(disponible)}</div>
            </div>
          </Card>
        </div>

        {/* Más beneficios */}
        <div style={moreRow}>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#0f172a" }}>Más Beneficios</div>
          <button
            onClick={() => alert("Ver todos (demo)")}
            style={{ border: "none", background: "transparent", color: BRAND, fontWeight: 900, cursor: "pointer" }}
          >
            Ver todos
          </button>
        </div>

        <div style={carousel}>
          {promos.map((p) => (
            <div key={p.title} style={promoCard}>
              <div style={promoImg}>
                <div style={promoTag}>{p.tag}</div>
              </div>
              <div style={promoBody}>
                <div style={promoTitle}>{p.title}</div>
                <div style={promoCat}>{p.cat}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
