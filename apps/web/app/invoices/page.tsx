"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Btn, Card, Pill, SectionTitle } from "../ui";

type InvoiceDTO = {
  invoiceId: number;
  displayNumber: string;
  amount: number;
  currency: string;
  issuedAt: string | null;
  dueDate: string | null;
  status: "ISSUED" | "VOIDED" | string;
  description: string;
};

type InvoicesResponse = {
  clientId: number;
  anatodClientId: number;
  invoices: InvoiceDTO[];
  source: string;
};

const DEFAULT_API_BASE = "https://ssservicios-selfcare-demo.onrender.com";

function fmtMoney(n: number) {
  return n.toLocaleString("es-AR");
}

function fmtDateISO(s: string | null) {
  if (!s) return "—";
  // s viene tipo "YYYY-MM-DD"
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function statusLabel(status: string) {
  if (status === "ISSUED") return "EMITIDA";
  if (status === "VOIDED") return "ANULADA";
  return status;
}

function statusTone(status: string): "ok" | "warn" | "bad" | "neutral" {
  if (status === "ISSUED") return "ok";
  if (status === "VOIDED") return "bad";
  return "neutral";
}

function pickCurrency(inv: InvoiceDTO) {
  return (inv.currency || "ARS").toUpperCase();
}

function pickDueOrIssued(inv: InvoiceDTO) {
  return inv.dueDate || inv.issuedAt;
}

export default function InvoicesPage() {
  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE,
    []
  );

  const [data, setData] = useState<InvoicesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchJSON(path: string) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      const msg =
        (json && (json.detail || json.error || json.message)) ||
        `HTTP ${res.status} ${res.statusText}`;
      throw new Error(`${msg} | url=${url}`);
    }

    return json;
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = (await fetchJSON("/v1/me/invoices?limit=20")) as InvoicesResponse;
      setData(res);
    } catch (e: any) {
      console.error(e);
      setData(null);
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invoices = data?.invoices ?? [];

  // Orden: vencimiento/fecha asc, anuladas al final (para lectura humana)
  const sorted = [...invoices].sort((a, b) => {
    const aVoid = a.status === "VOIDED";
    const bVoid = b.status === "VOIDED";
    if (aVoid !== bVoid) return aVoid ? 1 : -1;

    const ad = pickDueOrIssued(a);
    const bd = pickDueOrIssued(b);
    const at = ad ? new Date(ad).getTime() : Number.POSITIVE_INFINITY;
    const bt = bd ? new Date(bd).getTime() : Number.POSITIVE_INFINITY;
    return at - bt;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        paddingBottom: 36,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 0" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Facturas</h1>
            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.75 }}>
              Estado de facturación del cliente (data real desde API).
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Btn onClick={load} disabled={loading} title="Refresca /v1/me/invoices">
              {loading ? "Actualizando..." : "Refresh"}
            </Btn>

            <Link href="/benefits" style={{ textDecoration: "none" }}>
              <Btn>Ver beneficios</Btn>
            </Link>
          </div>
        </div>

        <Card>
          <SectionTitle>Resumen</SectionTitle>

          <div style={{ marginTop: 8, display: "grid", gap: 8, fontSize: 13, opacity: 0.9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 900 }}>Cliente (demo)</span>
              <span>
                {data ? (
                  <>
                    ID {data.clientId} · Anatod {data.anatodClientId}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 900 }}>Cantidad</span>
              <span>{sorted.length}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 900 }}>Fuente</span>
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {API_BASE}
              </span>
            </div>
          </div>

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
              <b>Error:</b>{" "}
              <span style={{ fontFamily: "monospace" }}>{err}</span>
            </div>
          ) : null}

          <SectionTitle>Listado</SectionTitle>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {sorted.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.75 }}>— No hay facturas para mostrar —</div>
            ) : (
              sorted.map((inv) => (
                <div
                  key={inv.invoiceId}
                  style={{
                    padding: "12px 12px",
                    borderRadius: 16,
                    border: "1px solid #eef0f3",
                    background: "#fafbfc",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>
                        {inv.displayNumber || `Factura #${inv.invoiceId}`}
                      </div>
                      <Pill tone={statusTone(inv.status)}>{statusLabel(inv.status)}</Pill>
                    </div>

                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, fontWeight: 800 }}>
                      {inv.description || "—"}
                    </div>

                    <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 12, opacity: 0.8 }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 900 }}>Emisión:</span>
                        <span>{fmtDateISO(inv.issuedAt)}</span>

                        <span style={{ fontWeight: 900, marginLeft: 10 }}>Vence:</span>
                        <span>{fmtDateISO(inv.dueDate)}</span>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 900 }}>ID:</span>
                        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                          {inv.invoiceId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>
                      ${fmtMoney(inv.amount)}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>
                      {pickCurrency(inv)}
                    </div>

                    {/* CTA pagar: lo dejamos “prolijo” hasta conectar link de cobranzas */}
                    <div style={{ marginTop: 10 }}>
                      <Btn
                        disabled
                        title="Cuando conectemos Link de Cobranzas, este botón abre el pago."
                      >
                        Pagar (próximamente)
                      </Btn>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Btn>← Volver al inicio</Btn>
            </Link>

            <Link href="/services" style={{ textDecoration: "none" }}>
              <Btn>Ir a servicios</Btn>
            </Link>

            <Link href="/benefits" style={{ textDecoration: "none" }}>
              <Btn>Ir a beneficios</Btn>
            </Link>
          </div>
        </Card>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, opacity: 0.65 }}>
          Próximo paso: conectar “Link de Cobranzas” para habilitar el botón <b>Pagar</b>.
        </div>
      </div>
    </div>
  );
}
