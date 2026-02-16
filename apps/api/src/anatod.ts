type AnatodCliente = {
  cliente_id?: number | string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  clienteScoring?: string | number | null;
  clienteScoringFinanciable?: string | number | null;
};

function parseMoneyLike(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  const n = Number(s.replace(/"/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export async function anatodGetClienteById(clienteId: number | string) {
  const base = process.env.ANATOD_BASE_URL; // ej: https://api.anatod.ar/api
  const apiKey = process.env.ANATOD_API_KEY;

  if (!base) throw new Error("Missing env ANATOD_BASE_URL");
  if (!apiKey) throw new Error("Missing env ANATOD_API_KEY");

  const url = `${base}/cliente/${clienteId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "x-api-key": apiKey
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ANATOD_GET_CLIENTE_FAILED status=${res.status} body=${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as any;

  // Algunas APIs devuelven {data:{...}} y otras el objeto directo
  const cliente: AnatodCliente = (json && typeof json === "object" && "data" in json) ? json.data : json;

  const financiable = parseMoneyLike(cliente.clienteScoringFinanciable);
  const scoring = parseMoneyLike(cliente.clienteScoring);

  const fullName = `${cliente.cliente_nombre ?? ""} ${cliente.cliente_apellido ?? ""}`.trim();

  return {
    raw: cliente,
    clienteId: cliente.cliente_id ?? clienteId,
    fullName,
    scoring,
    financiable
  };
}
