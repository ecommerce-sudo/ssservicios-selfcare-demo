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

function getTier(cupo: number): { tier: Tier; accent: string; bg: string } {
  if (cupo < 200000) {
    return { tier: "INFINIUM", accent: "#16a34a", bg: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)" };
  }
  if (cupo < 500000) {
    return { tier: "CLASSIC", accent: "#0891b2", bg: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)" };
  }
  return { tier: "BLACK", accent: "#111827", bg: "linear-gradient(135deg, #232526 0%, #414345 100%)" };
}

export default function Page() {
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE, []);
  const STORE_URL = useMemo(() => process.env.NEXT_PUBLIC_STORE_URL || DEFAULT_STORE_URL, []);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);

  const [amount, setAmount] = useState<string>("120000");
  const [desc, setDesc] = useState<string>("Compra Demo Pack X");

  const [actionLoading, setActionLoading] = useState<null | "purchase" | "reconcile">(null);
  const [actionResult, setActionResult] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // UI
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

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
    setLoadingMe(true);
    try {
      const data = await fetchJSON("/v1/me");
      setMe(data);
    } catch (e: any) {
      console.error(e);
      setMe(null);
      setActionError(String(e?.message ?? e));
    } finally {
      setLoadingMe(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runPurchase() {
    setActionError(null);
    setActionResult(null);
    setActionLoading("purchase");
    try {
      const amt = Number(String(amount).trim());
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Monto inválido");
      const qAmount = encodeURIComponent(String(amt));
      const qDesc = encodeURIComponent(desc.trim() || `Compra App Demo - ${new Date().toISOString()}`);
      const data = await fetchJSON(`/v1/me/purchase/financed?amount=${qAmount}&desc=${qDesc}`);
      setActionResult(data);
      await loadMe();
    } catch (e: any) {
      console.error(e);
      setActionError(String(e?.message ?? e));
    } finally {
      setActionLoading(null);
    }
  }

  async function runReconcile() {
    setActionError(null);
    setActionResult(null);
    setActionLoading("reconcile");
    try {
      const data = await fetchJSON("/v1/me/orders/reconcile");
      setActionResult(data);
      await loadMe();
    } catch (e: any) {
      console.error(e);
      setActionError(String(e?.message ?? e));
    } finally {
      setActionLoading(null);
    }
  }

  function openStore() {
    window.open(STORE_URL, "_blank", "noopener,noreferrer");
  }

  const fmt = (n: number) => n.toLocaleString("es-AR");
  const cupo = me?.purchaseAvailable ?? 0;
  const { tier, accent, bg } = getTier(cupo);

  // ===== Styles =====
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    paddingBottom: 36,
  };

  const container: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    padding: "0 16px",
  };

  const header: React.CSSProperties = {
    background: "#1677ff",
    color: "white",
    padding: "14px 16px",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
  };

  const headerRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const brand: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 900,
    letterSpacing: -0.3,
  };

  const burgerBtn: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.14)",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
  };

  const card: React.CSSProperties = {
    marginTop: 14,
    background: "white",
    borderRadius: 18,
    boxShadow: "0 10px 40px rgba(0,0,0,0.10)",
    padding: 16,
  };

  const titleRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  };

  const sectionTitle: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
  };

  const pillOk: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#E8FFF1",
    border: "1px solid #b7f3ce",
    color: "#0d7a37",
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
  };

  const dot: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: 99,
    background: "#22c55e",
    boxShadow: "0 0 12px rgba(34,197,94,0.7)",
  };

  const adminBtn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
  };

  const primaryBtn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ccc",
    width: "100%",
  };

  // Compact benefit card
  const benefitWrap: React.CSSProperties = {
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
    fontSize: 34,
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

  const benefitBtn: React.CSSProperties = {
    flex: "1 1 220px",
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

  const serviceGrid: React.CSSProperties = {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr",
    marginTop: 10,
    fontSize: 14,
  };

  const serviceItem: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #eef0f3",
    background: "#fafbfc",
  };

  return (
    <div style={shell}>
      {/* Header */}
      <header style={header}>
        <div style={headerRow}>
          <div style={brand}>
            <span style={{ fontSize: 18 }}>SSServicios</span>
          </div>

          <button style={burgerBtn} onClick={() => setMenuOpen(true)} aria-label="Menu">
            ☰
          </button>
        </div>
      </header>

      {/* Drawer */}
      {menuOpen ? (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 280,
              height: "100%",
              background: "#1677ff",
              color: "white",
              padding: 16,
              boxShadow: "10px 0 30px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>SSServicios</div>
              <button
                style={{ ...burgerBtn, width: 38, height: 38, borderRadius: 10 }}
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 10, fontWeight: 800 }}>
              {["Mi Perfil", "Facturas", "Pagos", "Beneficios", "Salir"].map((it) => (
                <div
                  key={it}
                  style={{ padding: "10px 10px", borderRadius: 12, background: "rgba(255,255,255,0.12)" }}
                >
                  {it}
                </div>
              ))}

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>Demo UI: el menú es visual por ahora.</div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={container}>
        {/* HOME: Servicio contratado */}
        <section style={{ ...card, marginTop: 18 }}>
          <div style={titleRow}>
            <h2 style={sectionTitle}>Servicio contratado</h2>
            <span style={pillOk}>
              <span style={dot} /> ACTIVO
            </span>
          </div>

          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Vista demo: esto después lo alimentamos con datos reales del servicio.
          </div>

          {/* MOCK servicio (hasta que tengamos endpoint) */}
          <div style={serviceGrid}>
            <div style={serviceItem}>
              <span style={{ fontWeight: 900 }}>Plan</span>
              <span>Internet Hogar (Demo)</span>
            </div>
            <div style={serviceItem}>
              <span style={{ fontWeight: 900 }}>Cliente</span>
              <span>{me ? `${me.name} (ID ${me.clientId})` : "—"}</span>
            </div>
            <div style={serviceItem}>
              <span style={{ fontWeight: 900 }}>Estado</span>
              <span style={{ fontWeight: 900, color: "#0d7a37" }}>ACTIVO</span>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={adminBtn} onClick={loadMe} disabled={loadingMe}>
              {loadingMe ? "Actualizando..." : "Refresh datos"}
            </button>

            <button style={adminBtn} onClick={() => setShowAdmin((v) => !v)}>
              {showAdmin ? "Ocultar admin demo" : "Mostrar admin demo"}
            </button>
          </div>

          {actionError ? (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff3f3", border: "1px solid #f1b4b4" }}>
              <b>Error:</b> <span style={{ fontFamily: "monospace" }}>{actionError}</span>
            </div>
          ) : null}
        </section>

        {/* HOME: Beneficio disponible (compacto) */}
        <section style={card}>
          <div style={titleRow}>
            <h2 style={sectionTitle}>Beneficio disponible</h2>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 900,
                fontSize: 12,
                color: "#0f172a",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: accent,
                  boxShadow: "0 0 12px rgba(0,0,0,0.12)",
                }}
              />
              {tier}
            </div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.75 }}>
            Usalo para comprar en <b>SSStore</b> en <b>3 cuotas sin interés</b>.
          </div>

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

            <div style={benefitCtaRow}>
              <button style={benefitBtn} onClick={openStore}>
                🛒 Usar beneficio en SSStore
              </button>

              <button
                style={{ ...primaryBtn, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}
                onClick={() => window.alert("Pantalla Beneficios (demo): la armamos en el próximo paso.")}
                title="En el próximo paso la hacemos pantalla real"
              >
                Ver detalle
              </button>
            </div>

            <div style={benefitHint}>
              ℹ️ Al finalizar tu compra elegí <b>"Financiación en Factura SSServicios"</b> e ingresá tu <b>número de cliente</b>.
            </div>
          </div>

          {/* Detalle interno (opcional) */}
          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 900 }}>Cupo oficial</span>
              <span>{me ? `${fmt(me.purchaseAvailableOfficial)} ${me.currency}` : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
              <span style={{ fontWeight: 900 }}>Reservado</span>
              <span>{me ? `${fmt(me.purchaseAvailableReserved)} ${me.currency}` : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
              <span style={{ fontWeight: 900 }}>Disponible</span>
              <span>{me ? `${fmt(me.purchaseAvailable)} ${me.currency}` : "—"}</span>
            </div>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>API base</span>
              <code style={{ fontSize: 12, opacity: 0.9 }}>{API_BASE}</code>
            </div>
          </div>
        </section>

        {/* Admin demo */}
        {showAdmin ? (
          <section style={card}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Admin demo (técnico)</h2>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
              Esto es para testear el flow sin ensuciar la vista de presentación.
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>Monto (ARS)</label>
                <input
                  style={inputStyle}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="numeric"
                  placeholder="120000"
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>Descripción</label>
                <input
                  style={inputStyle}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Compra Demo Pack X"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <button style={adminBtn} onClick={runPurchase} disabled={actionLoading !== null}>
                {actionLoading === "purchase" ? "Procesando compra..." : "Simular compra financiada"}
              </button>

              <button style={adminBtn} onClick={runReconcile} disabled={actionLoading !== null}>
                {actionLoading === "reconcile" ? "Reconciliando..." : "Reconciliar órdenes"}
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 900 }}>Resultado</h3>
              <pre style={{ padding: 12, background: "#f7f7f7", borderRadius: 12, overflowX: "auto" }}>
{actionResult ? JSON.stringify(actionResult, null, 2) : "— (todavía no ejecutaste ninguna acción) —"}
              </pre>
            </div>
          </section>
        ) : null}

        {/* Footer */}
        <div style={{ marginTop: 18, textAlign: "center", fontSize: 12, opacity: 0.65 }}>
          El beneficio se asigna automáticamente según plan, historial de pagos y antigüedad.
          <div style={{ marginTop: 8, fontWeight: 700, opacity: 0.7 }}>🔒 Sistema seguro de SSServicios (demo)</div>
        </div>
      </div>
    </div>
  );
}
