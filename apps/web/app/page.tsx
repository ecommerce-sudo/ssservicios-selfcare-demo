"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Btn, Card, Pill, SectionTitle } from "./ui";

type MeResponse = {
  clientId: number;
  name: string;
  purchaseAvailableOfficial: number;
  purchaseAvailableReserved: number;
  purchaseAvailable: number;
  currency: string;
};

type ServiceRow = {
  id: string;
  type: "INTERNET" | "MOBILE" | string;
  name: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELED" | string;
  extra?: string | null;
};

type ServicesResponse = {
  clientId: number;
  services: ServiceRow[];
  source: string;
};

const DEFAULT_API_BASE = "https://ssservicios-selfcare-demo.onrender.com";
const DEFAULT_STORE_URL = "https://ssstore.com.ar";

type Tier = "INFINIUM" | "CLASSIC" | "BLACK";

function getTier(cupo: number): { tier: Tier; accent: string; bg: string } {
  if (cupo < 200000) {
    return {
      tier: "INFINIUM",
      accent: "#16a34a",
      bg: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
    };
  }
  if (cupo < 500000) {
    return {
      tier: "CLASSIC",
      accent: "#0891b2",
      bg: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)",
    };
  }
  return {
    tier: "BLACK",
    accent: "#111827",
    bg: "linear-gradient(135deg, #232526 0%, #414345 100%)",
  };
}

function serviceLabel(type: string) {
  if (type === "INTERNET") return "Internet Hogar";
  if (type === "MOBILE") return "SSMóvil";
  return type;
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "ACTIVO";
  if (status === "SUSPENDED") return "SUSPENDIDO";
  if (status === "CANCELED") return "CANCELADO";
  return status;
}

function statusTone(status: string): "ok" | "warn" | "bad" | "neutral" {
  if (status === "ACTIVE") return "ok";
  if (status === "SUSPENDED") return "warn";
  if (status === "CANCELED") return "bad";
  return "neutral";
}

export default function Page() {
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE, []);
  const STORE_URL = useMemo(() => process.env.NEXT_PUBLIC_STORE_URL || DEFAULT_STORE_URL, []);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loadingMe, setLoadingMe] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [amount, setAmount] = useState<string>("120000");
  const [desc, setDesc] = useState<string>("Compra Demo Pack X");

  const [actionLoading, setActionLoading] = useState<null | "purchase" | "reconcile">(null);
  const [actionResult, setActionResult] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // UI
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
      setActionError(null);
    } catch (e: any) {
      console.error(e);
      setMe(null);
      setActionError(String(e?.message ?? e));
    } finally {
      setLoadingMe(false);
    }
  }

  async function loadServices() {
    setLoadingServices(true);
    try {
      const data = (await fetchJSON("/v1/me/services")) as ServicesResponse;
      setServices(Array.isArray(data.services) ? data.services : []);
      setActionError(null);
    } catch (e: any) {
      console.error(e);
      setServices([]);
      setActionError(String(e?.message ?? e));
    } finally {
      setLoadingServices(false);
    }
  }

  useEffect(() => {
    loadMe();
    loadServices();
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
      await loadServices();
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
      await loadServices();
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

  // ===== Styles puntuales (lo que vale la pena mantener) =====
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

  // Compact benefit card (más “delicada”, menos gigante)
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
    fontSize: 30,
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

  // SERVICES layout
  const servicesGrid: React.CSSProperties = {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr",
    marginTop: 10,
  };

  const serviceRowStyle: React.CSSProperties = {
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid #eef0f3",
    background: "#fafbfc",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const serviceLeft: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    minWidth: 0,
  };

  const iconDot: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: "rgba(22, 119, 255, 0.10)",
    border: "1px solid rgba(22, 119, 255, 0.18)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    color: "#0f172a",
    flex: "0 0 auto",
  };

  const serviceName: React.CSSProperties = {
    fontWeight: 900,
    fontSize: 14,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%",
  };

  const serviceSub: React.CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.75,
    fontWeight: 800,
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ccc",
    width: "100%",
  };

  return (
    <div style={shell}>
      <div style={container}>
        {/* HOME: Servicios contratados */}
        <Card style={{ marginTop: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <SectionTitle>Servicios contratados</SectionTitle>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Btn onClick={loadServices} disabled={loadingServices} title="Refresca /v1/me/services">
                {loadingServices ? "Actualizando..." : "Refresh"}
              </Btn>
              <Link href="/services" style={{ textDecoration: "none" }}>
                <Btn>Ver servicios</Btn>
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Vista demo: listado de servicios del cliente.
          </div>

          <div style={servicesGrid}>
            {services.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.75 }}>— No hay servicios para mostrar —</div>
            ) : (
              services.map((s) => (
                <div key={s.id} style={serviceRowStyle}>
                  <div style={serviceLeft}>
                    <div style={iconDot} aria-hidden>
                      {s.type === "INTERNET" ? "🌐" : s.type === "MOBILE" ? "📱" : "🔧"}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={serviceName} title={s.name}>
                        {s.name}
                      </div>
                      <div style={serviceSub}>
                        {serviceLabel(s.type)} {s.extra ? `· ${s.extra}` : ""}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                        <span style={{ fontWeight: 900 }}>ID:</span>{" "}
                        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                          {s.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Pill tone={statusTone(s.status)}>{statusLabel(s.status)}</Pill>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn onClick={loadMe} disabled={loadingMe} title="Refresca /v1/me">
              {loadingMe ? "Actualizando..." : "Refresh datos"}
            </Btn>

            <Btn onClick={() => setShowAdmin((v) => !v)} title="Panel técnico de demo">
              {showAdmin ? "Ocultar admin" : "Mostrar admin"}
            </Btn>
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
              <b>Error:</b> <span style={{ fontFamily: "monospace" }}>{actionError}</span>
            </div>
          ) : null}
        </Card>

        {/* HOME: Beneficio disponible */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <SectionTitle>Beneficio disponible</SectionTitle>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 900,
                fontSize: 12,
                color: "#0f172a",
              }}
              title="Tier del beneficio"
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

          <div style={{ marginTop: 12, ...benefitWrap }}>
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

              <Link href="/benefits" style={{ textDecoration: "none", flex: "1 1 220px" }}>
                <Btn style={{ width: "100%" }} title="Ver detalle operativo del beneficio">
                  Ver detalle
                </Btn>
              </Link>
            </div>

            <div style={benefitHint}>
              ℹ️ Al finalizar tu compra elegí <b>"Financiación en Factura SSServicios"</b> e ingresá tu{" "}
              <b>número de cliente</b>.
            </div>
          </div>

          {/* Detalle operativo (resumen) */}
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
        </Card>

        {/* Admin demo */}
        {showAdmin ? (
          <Card>
            <SectionTitle>Admin demo (técnico)</SectionTitle>
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
              <Btn onClick={runPurchase} disabled={actionLoading !== null}>
                {actionLoading === "purchase" ? "Procesando compra..." : "Simular compra financiada"}
              </Btn>

              <Btn onClick={runReconcile} disabled={actionLoading !== null}>
                {actionLoading === "reconcile" ? "Reconciliando..." : "Reconciliar órdenes"}
              </Btn>
            </div>

            <div style={{ marginTop: 14 }}>
              <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 900 }}>Resultado</h3>
              <pre style={{ padding: 12, background: "#f7f7f7", borderRadius: 12, overflowX: "auto" }}>
                {actionResult ? JSON.stringify(actionResult, null, 2) : "— (todavía no ejecutaste ninguna acción) —"}
              </pre>
            </div>
          </Card>
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
