"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Btn, Card, Pill } from "../ui";

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

function iconFor(type: string) {
  if (type === "INTERNET") return "🌐";
  if (type === "MOBILE") return "📱";
  return "🔧";
}

export default function ServicesPage() {
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE, []);
  const [services, setServices] = useState<ServiceRow[]>([]);
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
      const data = (await fetchJSON("/v1/me/services")) as ServicesResponse;
      setServices(Array.isArray(data.services) ? data.services : []);
    } catch (e: any) {
      console.error(e);
      setServices([]);
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Styles puntuales (layout/list item) =====
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

  const list: React.CSSProperties = {
    marginTop: 12,
    display: "grid",
    gap: 10,
  };

  const row: React.CSSProperties = {
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid #eef0f3",
    background: "#fafbfc",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const left: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    minWidth: 0,
  };

  const iconBox: React.CSSProperties = {
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

  const name: React.CSSProperties = {
    fontWeight: 900,
    fontSize: 14,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%",
  };

  const sub: React.CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.75,
    fontWeight: 800,
  };

  const meta: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.75,
  };

  return (
    <div style={shell}>
      <div style={container}>
        {/* Header página */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Servicios</h1>
            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.75 }}>
              Listado de servicios contratados del cliente.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Btn onClick={load} disabled={loading} title="Refresca /v1/me/services">
              {loading ? "Actualizando..." : "Refresh"}
            </Btn>

            <Link href="/" style={{ textDecoration: "none" }}>
              <Btn>← Volver</Btn>
            </Link>
          </div>
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

          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
            Fuente: <code>{API_BASE}</code>
          </div>

          <div style={list}>
            {services.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.75 }}>— No hay servicios para mostrar —</div>
            ) : (
              services.map((s) => (
                <div key={s.id} style={row}>
                  <div style={left}>
                    <div style={iconBox} aria-hidden>
                      {iconFor(s.type)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={name} title={s.name}>
                        {s.name}
                      </div>
                      <div style={sub}>
                        {serviceLabel(s.type)} {s.extra ? `· ${s.extra}` : ""}
                      </div>
                      <div style={meta}>
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

          {/* CTA secundario / cross-nav */}
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/benefits" style={{ textDecoration: "none" }}>
              <Btn>Ver beneficios</Btn>
            </Link>
          </div>
        </Card>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, opacity: 0.65 }}>
          Si un servicio cambia de estado, el sistema lo refleja automáticamente desde la API.
        </div>
      </div>
    </div>
  );
}
