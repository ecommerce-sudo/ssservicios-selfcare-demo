"use client";

import { useEffect, useMemo, useState } from "react";

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

function statusColor(status: string) {
  if (status === "ACTIVE") return { bg: "#E8FFF1", border: "#b7f3ce", fg: "#0d7a37", dot: "#22c55e" };
  if (status === "SUSPENDED") return { bg: "#fff7ed", border: "#fed7aa", fg: "#9a3412", dot: "#f97316" };
  if (status === "CANCELED") return { bg: "#fff1f2", border: "#fecdd3", fg: "#9f1239", dot: "#fb7185" };
  return { bg: "#eef2ff", border: "#c7d2fe", fg: "#1e3a8a", dot: "#6366f1" };
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

  const serviceCard: React.CSSProperties = {
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid #eef0f3",
    background: "#fafbfc",
  };

  return (
    <div style={shell}>
      <div style={container}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Servicios</h1>
          <button style={btn} onClick={load} disabled={loading}>
            {loading ? "Actualizando..." : "Refresh"}
          </button>
        </div>

        <section style={card}>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            Listado de servicios contratados del cliente (demo).
          </div>

          {err ? (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff3f3", border: "1px solid #f1b4b4" }}>
              <b>Error:</b> <span style={{ fontFamily: "monospace" }}>{err}</span>
            </div>
          ) : null}

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {services.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.75 }}>— No hay servicios para mostrar —</div>
            ) : (
              services.map((s) => {
                const st = statusColor(s.status);
                return (
                  <div key={s.id} style={serviceCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{s.name}</div>
                        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                          {serviceLabel(s.type)} {s.extra ? `· ${s.extra}` : ""}
                        </div>
                      </div>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: st.bg,
                          border: `1px solid ${st.border}`,
                          color: st.fg,
                          fontWeight: 900,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          height: "fit-content",
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: st.dot }} />
                        {statusLabel(s.status)}
                      </span>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                      <b>ID servicio:</b>{" "}
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                        {s.id}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <div style={{ marginTop: 12 }}>
          <a href="/" style={{ fontWeight: 900 }}>← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
