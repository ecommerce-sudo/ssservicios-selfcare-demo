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

export default function Page() {
  const API_BASE = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);

  const [amount, setAmount] = useState<string>("120000");
  const [desc, setDesc] = useState<string>("Compra Demo Pack X");

  const [actionLoading, setActionLoading] = useState<null | "purchase" | "reconcile">(null);
  const [actionResult, setActionResult] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
      const msg =
        (data && (data.detail || data.error || data.message)) ||
        `HTTP ${res.status} ${res.statusText}`;
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

      // refrescamos /v1/me para ver impacto inmediato
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

      // refrescamos /v1/me para ver impacto inmediato
      await loadMe();
    } catch (e: any) {
      console.error(e);
      setActionError(String(e?.message ?? e));
    } finally {
      setActionLoading(null);
    }
  }

  const cardStyle: React.CSSProperties = {
    marginTop: 24,
    padding: 16,
    border: "1px solid #ddd",
    borderRadius: 12,
  };

  const btnStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    width: "100%",
  };

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>SSServicios Selfcare Demo</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Front mínimo para validar deploy + consumo del API.
      </p>

      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>Estado del cliente</h2>
          <button style={btnStyle} onClick={loadMe} disabled={loadingMe}>
            {loadingMe ? "Actualizando..." : "Refresh /v1/me"}
          </button>
        </div>

        {!me ? (
          <>
            <p style={{ marginBottom: 8 }}>
              No pude leer <code>/v1/me</code> desde:
            </p>
            <pre style={{ padding: 12, background: "#f7f7f7", borderRadius: 8 }}>{API_BASE}</pre>
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              Configurable por Environment Variable en Vercel:
              <code> NEXT_PUBLIC_API_BASE_URL</code>
            </p>
          </>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <div>
              <b>Cliente:</b> {me.name} (ID {me.clientId})
            </div>
            <div>
              <b>Cupo oficial:</b> {me.purchaseAvailableOfficial.toLocaleString("es-AR")} {me.currency}
            </div>
            <div>
              <b>Reservado:</b> {me.purchaseAvailableReserved.toLocaleString("es-AR")} {me.currency}
            </div>
            <div>
              <b>Disponible:</b> {me.purchaseAvailable.toLocaleString("es-AR")} {me.currency}
            </div>

            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px dashed #ddd" }}>
              <b>API base:</b> <code>{API_BASE}</code>
            </div>
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Acciones demo (botones)</h2>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Monto (ARS)</label>
            <input
              style={inputStyle}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              placeholder="120000"
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Descripción</label>
            <input
              style={inputStyle}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Compra Demo Pack X"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <button style={btnStyle} onClick={runPurchase} disabled={actionLoading !== null}>
            {actionLoading === "purchase" ? "Procesando compra..." : "Simular compra financiada"}
          </button>

          <button style={btnStyle} onClick={runReconcile} disabled={actionLoading !== null}>
            {actionLoading === "reconcile" ? "Reconciliando..." : "Reconciliar órdenes"}
          </button>
        </div>

        {actionError ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#fff3f3", border: "1px solid #f1b4b4" }}>
            <b>Error:</b> <span style={{ fontFamily: "monospace" }}>{actionError}</span>
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <h3 style={{ marginBottom: 8 }}>Resultado</h3>
          <pre style={{ padding: 12, background: "#f7f7f7", borderRadius: 8, overflowX: "auto" }}>
{actionResult ? JSON.stringify(actionResult, null, 2) : "— (todavía no ejecutaste ninguna acción) —"}
          </pre>
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Acciones demo (links directos al API)</h2>
        <ul style={{ marginTop: 0 }}>
          <li>
            <a href={`${API_BASE}/health`} target="_blank" rel="noreferrer">/health</a>
          </li>
          <li>
            <a href={`${API_BASE}/v1/me`} target="_blank" rel="noreferrer">/v1/me</a>
          </li>
          <li>
            <a href={`${API_BASE}/v1/me/orders`} target="_blank" rel="noreferrer">/v1/me/orders</a>
          </li>
          <li>
            <a href={`${API_BASE}/v1/me/reservations`} target="_blank" rel="noreferrer">/v1/me/reservations</a>
          </li>
          <li>
            <a
              href={`${API_BASE}/v1/me/purchase/financed?amount=${encodeURIComponent(amount)}&desc=${encodeURIComponent(desc)}`}
              target="_blank"
              rel="noreferrer"
            >
              /v1/me/purchase/financed?amount=...&desc=...
            </a>
          </li>
          <li>
            <a href={`${API_BASE}/v1/me/orders/reconcile`} target="_blank" rel="noreferrer">
              /v1/me/orders/reconcile
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
