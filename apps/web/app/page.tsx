"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Btn, Card, Pill, SectionTitle } from "./ui";

type MeResponse = {
  clientId: number;
  name: string;
  purchaseAvailableOfficial: number;
  purchaseAvailableReserved: number;
  purchaseAvailable: number;
  currency: string;
  anatodClientId?: number;
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

type NextInvoiceResponse = {
  clientId: number;
  anatodClientId: number;
  nextInvoice: NextInvoiceDTO | null;
  source: string;
};

type AccountResponse = {
  clientId: number;
  anatodClientId: number;
  status: "AL_DIA" | "CON_DEUDA" | "CORTADO" | string;
  balance: number;
  currency: string;
  inArrears: boolean;
  monthsInArrears: number;
  cutOff: boolean;
  habilitacionDate: string | null;
  lastCutDate: string | null;
  source: string;
};

const DEFAULT_API_BASE = "https://ssservicios-selfcare-demo.onrender.com";
const DEFAULT_STORE_URL = "https://ssstore.com.ar";

const BRAND = "#5ac8fa";

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

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString("es-AR");
}

function fmtDateISO(s: string | null) {
  if (!s) return "—";
  const [y, m, d] = String(s).split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function parseISODateOnly(s: string) {
  const [y, m, d] = s.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function dueBadge(inv: { dueDate: string | null; issuedAt: string | null; status: string }) {
  if (inv.status === "VOIDED") return null;
  const base = inv.dueDate || inv.issuedAt;
  if (!base) return { label: "Sin fecha", tone: "neutral" as const };

  const due = parseISODateOnly(base);
  if (!due) return { label: "Fecha inválida", tone: "neutral" as const };

  const today = startOfToday();
  const ms = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((due.getTime() - today.getTime()) / ms);

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      label: days === 1 ? "Vencida hace 1 día" : `Vencida hace ${days} días`,
      tone: "bad" as const,
    };
  }
  if (diffDays === 0) return { label: "Vence hoy", tone: "warn" as const };
  if (diffDays === 1) return { label: "Vence mañana", tone: "warn" as const };
  if (diffDays <= 5) return { label: `Vence en ${diffDays} días`, tone: "warn" as const };
  return { label: `Vence en ${diffDays} días`, tone: "neutral" as const };
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

function accountTone(status: string): "ok" | "warn" | "bad" | "neutral" {
  if (status === "AL_DIA") return "ok";
  if (status === "CON_DEUDA") return "warn";
  if (status === "CORTADO") return "bad";
  return "neutral";
}

function accountLabel(status: string) {
  if (status === "AL_DIA") return "AL DÍA";
  if (status === "CON_DEUDA") return "CON DEUDA";
  if (status === "CORTADO") return "CORTADO";
  return status;
}

export default function Page() {
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE, []);
  const STORE_URL = useMemo(() => process.env.NEXT_PUBLIC_STORE_URL || DEFAULT_STORE_URL, []);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [nextInvoice, setNextInvoice] = useState<NextInvoiceDTO | null>(null);
  const [account, setAccount] = useState<AccountResponse | null>(null);

  const [loadingMe, setLoadingMe] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingNextInv, setLoadingNextInv] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const [amount, setAmount] = useState<string>("120000");
  const [desc, setDesc] = useState<string>("Compra Demo Pack X");

  const [actionLoading, setActionLoading] = useState<null | "purchase" | "reconcile">(null);
  const [actionResult, setActionResult] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
      const data = (await fetchJSON("/v1/me")) as MeResponse;
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

  async function loadNextInvoice() {
    setLoadingNextInv(true);
    try {
      const data = (await fetchJSON("/v1/me/invoices/next")) as NextInvoiceResponse;
      setNextInvoice(data?.nextInvoice ?? null);
      setActionError(null);
    } catch (e: any) {
      console.error(e);
      setNextInvoice(null);
      setActionError(String(e?.message ?? e));
    } finally {
      setLoadingNextInv(false);
    }
  }

  async function loadAccount() {
    setLoadingAccount(true);
    try {
      const data = (await fetchJSON("/v1/me/account")) as AccountResponse;
      setAccount(data);
    } catch (e: any) {
      console.error(e);
      setAccount(null);
    } finally {
      setLoadingAccount(false);
    }
  }

  useEffect(() => {
    loadMe();
    loadServices();
    loadNextInvoice();
    loadAccount();
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

      await Promise.all([loadMe(), loadServices(), loadNextInvoice(), loadAccount()]);
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

      await Promise.all([loadMe(), loadServices(), loadNextInvoice(), loadAccount()]);
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

  function invoicePdfUrl(invoiceId: number) {
    return `${API_BASE}/v1/me/invoices/${invoiceId}/print`;
  }

  const cupo = me?.purchaseAvailable ?? 0;
  const currency = (me?.currency ?? "ARS").toUpperCase();
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
    padding: "0 16px 0",
  };

  const topbar: React.CSSProperties = {
    background: `linear-gradient(135deg, ${BRAND} 0%, #2aa8db 100%)`,
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

  // ✅ Banner con texto oscuro para legibilidad
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

  const rowCard: React.CSSProperties = {
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid #eef0f3",
    background: "#fafbfc",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const quickGrid: React.CSSProperties = {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  };

  const quickItem: React.CSSProperties = {
    padding: "12px 10px",
    borderRadius: 16,
    border: "1px solid #e6eef5",
    background: "#ffffff",
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
    textAlign: "center",
    cursor: "pointer",
    userSelect: "none",
  };

  const quickIcon: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(90, 200, 250, 0.16)",
    border: "1px solid rgba(90, 200, 250, 0.28)",
    fontSize: 20,
  };

  const quickText: React.CSSProperties = { marginTop: 8, fontSize: 12, fontWeight: 900, opacity: 0.9 };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ccc",
    width: "100%",
  };

  // Benefit: vuelve el “tier” por escala con tu bg, pero mantenemos el look cuidado
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

  const benefitBtn: React.CSSProperties = {
    flex: "1 1 220px",
    padding: "12px 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    letterSpacing: 0.2,
    color: "#052e2b",
    backgroundImage: `linear-gradient(135deg, ${BRAND} 0%, #9be7ff 100%)`,
    boxShadow: "0 12px 28px rgba(90, 200, 250, 0.30)",
  };

  const servicesTop3 = services.slice(0, 3);

  return (
    <div style={shell}>
      {/* Topbar */}
      <div style={topbar}>
        <div style={topbarRow}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 900, letterSpacing: 0.4 }}>SSServicios</div>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Hola, {me?.name ? me.name : "Cliente"}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.9 }}>Resumen de cuenta y servicios</div>
          </div>

          <div style={badgePill} title="Cliente demo">
            <span style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(255,255,255,0.85)" }} />
            ID {me?.clientId ?? "—"}
          </div>
        </div>

        {/* Banner */}
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
              <div style={bannerText}>
                {loadingAccount ? (
                  "Cargando estado..."
                ) : account?.status === "CORTADO" ? (
                  "Tu servicio figura cortado. Regularizá el estado para reactivar."
                ) : account?.status === "CON_DEUDA" ? (
                  "Tenés saldo pendiente. Revisá la próxima factura para evitar cortes."
                ) : (
                  "Sin alertas críticas en este momento (demo)."
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
            <Link href="/invoices" style={{ textDecoration: "none" }}>
              <Btn>Facturas</Btn>
            </Link>
          </div>
        </div>
      </div>

      <div style={container}>
        {/* 1) Próxima factura */}
        <Card style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <SectionTitle>Próxima factura</SectionTitle>

            <Btn onClick={() => loadNextInvoice()} disabled={loadingNextInv} title="Refresca /v1/me/invoices/next">
              {loadingNextInv ? "Actualizando..." : "Refresh"}
            </Btn>
          </div>

          {nextInvoice ? (
            <div style={{ marginTop: 10, ...rowCard, background: "#ffffff", border: "1px solid #e6eef5" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>
                    {nextInvoice.displayNumber || `Factura #${nextInvoice.invoiceId}`}
                  </div>

                  {(() => {
                    const b = dueBadge(nextInvoice);
                    return b ? <Pill tone={b.tone}>{b.label}</Pill> : null;
                  })()}

                  <Pill tone={accountTone(account?.status ?? "neutral")}>
                    {account ? accountLabel(account.status) : "ESTADO"}
                  </Pill>
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
                  {(nextInvoice.currency || currency).toUpperCase()}
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

        {/* 2) Mis servicios */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <SectionTitle>Mis servicios</SectionTitle>

            <Btn onClick={loadServices} disabled={loadingServices} title="Refresca /v1/me/services">
              {loadingServices ? "Actualizando..." : "Refresh"}
            </Btn>
          </div>

          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Resumen rápido (top 3). El detalle completo está en “Servicios”.
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {servicesTop3.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.75 }}>— No hay servicios para mostrar —</div>
            ) : (
              servicesTop3.map((s) => (
                <div key={s.id} style={rowCard}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                    <div
                      aria-hidden
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        background: "rgba(90, 200, 250, 0.16)",
                        border: "1px solid rgba(90, 200, 250, 0.28)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                      }}
                    >
                      {s.type === "INTERNET" ? "🌐" : s.type === "MOBILE" ? "📱" : "🔧"}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                        {serviceLabel(s.type)} {s.extra ? `· ${s.extra}` : ""}
                      </div>
                    </div>
                  </div>

                  <Pill tone={statusTone(s.status)}>{statusLabel(s.status)}</Pill>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/services" style={{ textDecoration: "none" }}>
              <Btn>Ver servicios</Btn>
            </Link>
            <Link href="/invoices" style={{ textDecoration: "none" }}>
              <Btn>Ver facturas</Btn>
            </Link>
          </div>
        </Card>

        {/* 3) Accesos rápidos */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <SectionTitle>Accesos rápidos</SectionTitle>
            <Btn onClick={() => setShowAdmin((v) => !v)} title="Panel técnico (demo)">
              {showAdmin ? "Ocultar admin" : "Mostrar admin"}
            </Btn>
          </div>

          <div style={quickGrid}>
            <Link href="/invoices" style={{ textDecoration: "none" }}>
              <div style={quickItem}>
                <div style={quickIcon}>🧾</div>
                <div style={quickText}>Facturas</div>
              </div>
            </Link>

            <Link href="/services" style={{ textDecoration: "none" }}>
              <div style={quickItem}>
                <div style={quickIcon}>🌐</div>
                <div style={quickText}>Servicios</div>
              </div>
            </Link>

            <Link href="/benefits" style={{ textDecoration: "none" }}>
              <div style={quickItem}>
                <div style={quickIcon}>🎁</div>
                <div style={quickText}>Beneficios</div>
              </div>
            </Link>

            <div style={quickItem} onClick={openStore} role="button" title="Abre SSStore en una pestaña nueva">
              <div style={quickIcon}>🛒</div>
              <div style={quickText}>SSStore</div>
            </div>

            <div style={quickItem} title="Próximo: soporte / tickets">
              <div style={quickIcon}>🛠️</div>
              <div style={quickText}>Soporte</div>
            </div>

            <div style={quickItem} title="Próximo: débito automático">
              <div style={quickIcon}>💳</div>
              <div style={quickText}>Débito</div>
            </div>

            <div style={quickItem} title="Próximo: perfil y datos">
              <div style={quickIcon}>👤</div>
              <div style={quickText}>Perfil</div>
            </div>

            <div style={quickItem} title="Más opciones (demo)">
              <div style={quickIcon}>➕</div>
              <div style={quickText}>Más</div>
            </div>
          </div>
        </Card>

        {/* 4) Beneficio disponible (tier por escala) */}
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

          <div style={{ marginTop: 12, ...benefitWrap }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>SSSERVICIOS</div>
              <div style={tierBadge}>{tier}</div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9, fontWeight: 800, letterSpacing: 1.4 }}>
              DISPONIBLE HOY
            </div>

            <div style={benefitAmount}>${fmtMoney(cupo)}</div>

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontWeight: 800 }}>
              {currency} · 3 cuotas sin interés
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button style={benefitBtn} onClick={openStore}>
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
              ℹ️ En checkout elegí <b>"Financiación en Factura SSServicios"</b> e ingresá tu{" "}
              <b>número de cliente</b>.
            </div>
          </div>

          {/* Resumen operativo */}
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
              <code style={{ fontSize: 12, opacity: 0.9 }}>{API_BASE}</code>
            </div>
          </div>

          {actionError ? (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff3f3", border: "1px solid #f1b4b4" }}>
              <b>Error:</b> <span style={{ fontFamily: "monospace" }}>{actionError}</span>
            </div>
          ) : null}
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

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 12, opacity: 0.65 }}>
          El beneficio se asigna automáticamente según plan, historial de pagos y antigüedad.
          <div style={{ marginTop: 8, fontWeight: 700, opacity: 0.7 }}>🔒 Sistema seguro de SSServicios (demo)</div>
        </div>
      </div>
    </div>
  );
}
