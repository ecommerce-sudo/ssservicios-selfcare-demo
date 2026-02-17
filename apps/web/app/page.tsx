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

function getTier(cupo: number): { tier: Tier; gradient: string } {
  if (cupo < 200000) {
    return { tier: "INFINIUM", gradient: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)" };
  }
  if (cupo < 500000) {
    return { tier: "CLASSIC", gradient: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)" };
  }
  return { tier: "BLACK", gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)" };
}

function safeJSONParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
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

  // Persistencia del Admin demo (para demo real: recarga y sigue igual)
  useEffect(() => {
    try {
      const v = localStorage.getItem("ssselfcare_showAdmin");
      if (v === "1") setShowAdmin(true);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ssselfcare_showAdmin", showAdmin ? "1" : "0");
    } catch {
      // noop
    }
  }, [showAdmin]);

  async function fetchJSON(path: string) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    const data = safeJSONParse(text);

    if (!res.ok) {
      const msg =
        (data && (data.detail || data.error || data.message)) ||
        `HTTP ${res.status} ${res.statusText}`;
      throw new Error(`${msg} | url=${url}`);
    }
    return data;
  }

  async function loadMe() {
    setLoadingMe(true);
    setActionError(null);
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

  const cupo = me?.purchaseAvailable ?? 0;
  const { tier, gradient } = getTier(cupo);

  const fmt = (n: number) => n.toLocaleString("es-AR");

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

  const contentCard: React.CSSProperties = {
    marginTop: 16,
    background: "white",
    borderRadius: 18,
    boxShadow: "0 10px 40px rgba(0,0,0,0.10)",
    padding: 16,
  };

  const sectionTitle: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
  };

  const subtle: React.CSSProperties = { opacity: 0.75 };

  const pillOk: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#E8FFF1",
    border: "1px solid #b7f3ce",
    color: "#0d7a37",
    fontWeight: 800,
    fontSize: 12,
    whiteSpace: "nowrap",
  };

  const dot: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: 99,
    background: "#22c55e",
    boxShadow: "0 0 12px rgba(34,197,94,0.7)",
    flexShrink: 0,
  };

  // Tarjeta beneficio
  const benefitCard: React.CSSProperties = {
    marginTop: 14,
    borderRadius: 20,
    padding: 22,
    color: "white",
    background: gradient,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const chip: React.CSSProperties = {
    position: "absolute",
    top: 86,
    right: 22,
    width: 54,
    height: 40,
    borderRadius: 8,
    background: "linear-gradient(135deg, #fce38a 0%, #f38181 100%)",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
  };

  const chipLine: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: "33%",
    width: 1,
    height: "100%",
    background: "rgba(0,0,0,0.15)",
  };

  const chipLine2: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: "66%",
    width: 1,
    height: "100%",
    background: "rgba(0,0,0,0.15)",
  };

  const ctaBtn: React.CSSProperties = {
    width: "100%",
    marginTop: 14,
    padding: "14px 14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    letterSpacing: 0.4,
    color: "white",
    backgroundImage: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)",
    boxShadow: "0 12px 28px rgba(0, 201, 255, 0.35)",
  };

  const adminBtn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ccc",
    width: "100%",
  };

  function openStore() {
    // tracking liviano para demo
    const clientId = me?.clientId ?? 0;
    const u = new URL(STORE_URL);
    u.searchParams.set("utm_source", "selfcare");
    if (clientId) u.searchParams.set("clientId", String(clientId));
    window.open(u.toString(), "_blank", "noopener,noreferrer");
  }

  const mono =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 20,
          }}
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
              {["Mi Perfil", "Facturas", "Pagos", "Beneficios", "Salir"].map((x) => (
                <div
                  key={x}
                  style={{
                    padding: "10px 10px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.12)",
                  }}
                >
                  {x}
                </div>
              ))}

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                Demo UI: el menú es visual por ahora.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={container}>
        {/* Estado + Beneficio */}
        <section style={{ ...contentCard, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h2 style={sectionTitle}>Servicio activo</h2>
            <span style={pillOk}>
              <span style={dot} /> ACTIVO
            </span>
          </div>

          <div style={{ marginTop: 10, ...subtle }}>
            Panel demo para mostrar <b>beneficio disponible</b> (compras en tienda online).
          </div>

          {!me ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 14,
                border: "1px solid #f1b4b4",
                background: "#fff3f3",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>No pude leer /v1/me</div>
              <div style={{ fontFamily: mono, fontSize: 12, opacity: 0.9 }}>{API_BASE}</div>
              {actionError ? (
                <div style={{ marginTop: 8, fontFamily: mono, fontSize: 12 }}>{actionError}</div>
              ) : null}
              <div style={{ marginTop: 10 }}>
                <button style={adminBtn} onClick={loadMe} disabled={loadingMe}>
                  {loadingMe ? "Actualizando..." : "Reintentar"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Beneficio card */}
              <div style={benefitCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                  <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.2 }}>SSSERVICIOS</div>
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2.5, opacity: 0.9 }}>
                    {tier}
                  </div>
                </div>

                <div style={chip}>
                  <div style={chipLine} />
                  <div style={chipLine2} />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      width: "100%",
                      height: 1,
                      background: "rgba(0,0,0,0.15)",
                      transform: "translateY(-50%)",
                    }}
                  />
                </div>

                <div style={{ marginTop: 26, zIndex: 2 }}>
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 18,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {me.name} <span style={{ opacity: 0.85, fontSize: 14 }}>(ID {me.clientId})</span>
                  </div>
                </div>

                <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, opacity: 0.85 }}>
                      BENEFICIO DISPONIBLE
                    </div>
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 40,
                        fontWeight: 800,
                        letterSpacing: -1,
                        lineHeight: 1.05,
                        textShadow: "0 4px 10px rgba(0,0,0,0.25)",
                      }}
                    >
                      ${fmt(me.purchaseAvailable)}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                      {me.currency} · 3 cuotas sin interés
                    </div>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(0,0,0,0.18)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      padding: "7px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 1,
                      marginLeft: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={dot} /> ACTIVO
                  </div>
                </div>

                <button style={ctaBtn} onClick={openStore}>
                  🛒 APROVECHAR MI BENEFICIO EN SSSTORE
                </button>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    background: "rgba(255,255,255,0.16)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    padding: "10px 12px",
                    borderRadius: 14,
                    lineHeight: 1.35,
                  }}
                >
                  ℹ️ Al finalizar tu compra elegí <b>"Financiación en Factura SSServicios"</b> y no olvides
                  ingresar tu <b>número de cliente</b>.
                </div>
              </div>

              {/* Detalle operativo */}
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px dashed #ddd",
                  display: "grid",
                  gap: 8,
                  fontSize: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontWeight: 800 }}>Cupo oficial</span>
                  <span>
                    {fmt(me.purchaseAvailableOfficial)} {me.currency}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontWeight: 800 }}>Reservado</span>
                  <span>
                    {fmt(me.purchaseAvailableReserved)} {me.currency}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontWeight: 800 }}>Disponible</span>
                  <span>
                    {fmt(me.purchaseAvailable)} {me.currency}
                  </span>
                </div>

                <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>API base</span>
                  <code style={{ fontSize: 12, opacity: 0.9 }}>{API_BASE}</code>
                </div>

                <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={adminBtn} onClick={loadMe} disabled={loadingMe} title="Refresca /v1/me">
                    {loadingMe ? "Actualizando..." : "Refresh datos"}
                  </button>

                  <button
                    style={adminBtn}
                    onClick={() => setShowAdmin((v) => !v)}
                    title="Muestra/oculta panel técnico (queda guardado)"
                  >
                    {showAdmin ? "Ocultar admin demo" : "Mostrar admin demo"}
                  </button>
                </div>

                {actionError ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: "#fff3f3",
                      border: "1px solid #f1b4b4",
                    }}
                  >
                    <b>Error:</b> <span style={{ fontFamily: mono }}>{actionError}</span>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>

        {/* Admin demo */}
        {showAdmin ? (
          <section style={contentCard}>
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

            <div style={{ marginTop: 12 }}>
              <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 900 }}>Links directos al API</h3>
              <ul style={{ marginTop: 0 }}>
                <li><a href={`${API_BASE}/health`} target="_blank" rel="noreferrer">/health</a></li>
                <li><a href={`${API_BASE}/v1/me`} target="_blank" rel="noreferrer">/v1/me</a></li>
                <li><a href={`${API_BASE}/v1/me/orders`} target="_blank" rel="noreferrer">/v1/me/orders</a></li>
                <li><a href={`${API_BASE}/v1/me/reservations`} target="_blank" rel="noreferrer">/v1/me/reservations</a></li>
                <li>
                  <a
                    href={`${API_BASE}/v1/me/purchase/financed?amount=${encodeURIComponent(amount)}&desc=${encodeURIComponent(desc)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    /v1/me/purchase/financed?amount=...&desc=...
                  </a>
                </li>
                <li><a href={`${API_BASE}/v1/me/orders/reconcile`} target="_blank" rel="noreferrer">/v1/me/orders/reconcile</a></li>
              </ul>
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
