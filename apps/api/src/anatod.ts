type AnatodCliente = {
  cliente_id?: number | string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  clienteScoring?: string | number | null;
  clienteScoringFinanciable?: string | number | null;
};

type AnatodPaginated<T> = {
  current_page?: number;
  data?: T[];
  first_page_url?: string;
  from?: number;
  last_page?: number;
  last_page_url?: string;
  links?: any;
  next_page_url?: string | null;
  path?: string;
  per_page?: number;
  prev_page_url?: string | null;
  to?: number;
  total?: number;
};

export type AnatodFactura = {
  factura_id: number;
  factura_tipo?: string;
  factura_puntoventa?: number;
  factura_numero?: number;
  factura_importe?: string | number;
  factura_cliente?: number;
  factura_fecha?: string;
  factura_1vencimiento?: string;
  factura_2vencimiento?: string;
  factura_3vencimiento?: string | null;
  factura_detalle?: string;
  factura_anulada?: 0 | 1 | number;
};

export type AnatodCobranza = {
  cobranza_id: number;
  cobranza_fecha?: string;
  cobranza_importe?: string | number;
  cobranza_cliente?: number;
  cobranza_detalle?: string;
  cobranza_medio_pago?: string;
};

export type AnatodFacturaPrint = {
  url?: string;
  link?: string;
  pdf?: string;
};

function parseMoneyLike(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  const n = Number(s.replace(/"/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function getAnatodEnv() {
  const base = process.env.ANATOD_BASE_URL; // ej: https://api.anatod.ar/api
  const apiKey = process.env.ANATOD_API_KEY;

  if (!base) throw new Error("Missing env ANATOD_BASE_URL");
  if (!apiKey) throw new Error("Missing env ANATOD_API_KEY");

  return { base, apiKey };
}

async function anatodGetJSON<T>(path: string): Promise<T> {
  const { base, apiKey } = getAnatodEnv();
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `ANATOD_HTTP_FAILED status=${res.status} url=${url} body=${text.slice(0, 300)}`
    );
  }

  return (await res.json()) as T;
}

export async function anatodGetClienteById(clienteId: number | string) {
  const json = await anatodGetJSON<any>(`/cliente/${clienteId}`);

  // Algunas APIs devuelven {data:{...}} y otras el objeto directo
  const cliente: AnatodCliente =
    json && typeof json === "object" && "data" in json ? json.data : json;

  const financiable = parseMoneyLike(cliente.clienteScoringFinanciable);
  const scoring = parseMoneyLike(cliente.clienteScoring);

  const fullName = `${cliente.cliente_nombre ?? ""} ${cliente.cliente_apellido ?? ""}`.trim();

  return {
    raw: cliente,
    clienteId: cliente.cliente_id ?? clienteId,
    fullName,
    scoring,
    financiable,
  };
}

export async function anatodListFacturasByCliente(clienteId: number | string) {
  // Docs: GET /cliente/{cliente_id}/facturas
  const json = await anatodGetJSON<AnatodPaginated<AnatodFactura> | AnatodFactura[]>(
    `/cliente/${clienteId}/facturas`
  );

  if (Array.isArray(json)) {
    return { current_page: 1, data: json } as AnatodPaginated<AnatodFactura>;
  }
  return json as AnatodPaginated<AnatodFactura>;
}

export async function anatodListCobranzasByCliente(clienteId: number | string) {
  // Docs: GET /cliente/{cliente_id}/cobranzas
  const json = await anatodGetJSON<AnatodPaginated<AnatodCobranza> | AnatodCobranza[]>(
    `/cliente/${clienteId}/cobranzas`
  );

  if (Array.isArray(json)) {
    return { current_page: 1, data: json } as AnatodPaginated<AnatodCobranza>;
  }
  return json as AnatodPaginated<AnatodCobranza>;
}

export async function anatodFacturaPrintLink(facturaId: number | string) {
  // Docs: GET /factura/{id}/print
  const json = await anatodGetJSON<any>(`/factura/${facturaId}/print`);
  const obj: AnatodFacturaPrint =
    json && typeof json === "object" && "data" in json ? (json.data as any) : (json as any);
  return obj;
}

export function normalizeFactura(f: AnatodFactura) {
  const amount = parseMoneyLike(f.factura_importe);
  const anulada = Number(f.factura_anulada ?? 0) === 1;

  const numero = [f.factura_tipo, f.factura_puntoventa, f.factura_numero]
    .filter((x) => x !== undefined && x !== null && String(x).length > 0)
    .join("-");

  return {
    id: Number(f.factura_id),
    number: numero || String(f.factura_id),
    date: f.factura_fecha ?? null,
    due1: f.factura_1vencimiento ?? null,
    due2: f.factura_2vencimiento ?? null,
    description: f.factura_detalle ?? "",
    amount,
    canceled: anulada,
  };
}

export function normalizeCobranza(c: AnatodCobranza) {
  return {
    id: Number(c.cobranza_id),
    date: c.cobranza_fecha ?? null,
    description: c.cobranza_detalle ?? "",
    amount: parseMoneyLike(c.cobranza_importe),
    method: c.cobranza_medio_pago ?? null,
  };
}
