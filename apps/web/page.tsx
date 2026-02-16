type MeResponse = {
  clientId: number;
  name: string;
  purchaseAvailableOfficial: number;
  purchaseAvailableReserved: number;
  purchaseAvailable: number;
  currency: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://ssservicios-selfcare-demo.onrender.com";

async function getMe(): Promise<MeResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/me`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Page() {
  const me = await getMe();

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>SSServicios Selfcare Demo</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Front mínimo para validar deploy + consumo del API.
      </p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Estado del cliente</h2>

        {!me ? (
          <>
            <p style={{ marginBottom: 8 }}>
              No pude leer <code>/v1/me</code> desde:
            </p>
            <pre style={{ padding: 12, background: "#f7f7f7", borderRadius: 8 }}>
{API_BASE}
            </pre>
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              Después lo hacemos configurable por Environment Variable en Vercel:
              <code> NEXT_PUBLIC_API_BASE_URL</code>
            </p>
          </>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div><b>Cliente:</b> {me.name} (ID {me.clientId})</div>
            <div><b>Cupo oficial:</b> {me.purchaseAvailableOfficial.toLocaleString("es-AR")} {me.currency}</div>
            <div><b>Reservado:</b> {me.purchaseAvailableReserved.toLocaleString("es-AR")} {me.currency}</div>
            <div><b>Disponible:</b> {me.purchaseAvailable.toLocaleString("es-AR")} {me.currency}</div>

            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px dashed #ddd" }}>
              <b>API base:</b>{" "}
              <code>{API_BASE}</code>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Acciones demo (manual)</h2>
        <p style={{ marginBottom: 8 }}>Links directos al API (para probar rápido):</p>
        <ul style={{ marginTop: 0 }}>
          <li>
            <a href={`${API_BASE}/health`} target="_blank" rel="noreferrer">
              /health
            </a>
          </li>
          <li>
            <a href={`${API_BASE}/v1/me`} target="_blank" rel="noreferrer">
              /v1/me
            </a>
          </li>
          <li>
            <a href={`${API_BASE}/v1/me/orders`} target="_blank" rel="noreferrer">
              /v1/me/orders
            </a>
          </li>
          <li>
            <a href={`${API_BASE}/v1/me/reservations`} target="_blank" rel="noreferrer">
              /v1/me/reservations
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
