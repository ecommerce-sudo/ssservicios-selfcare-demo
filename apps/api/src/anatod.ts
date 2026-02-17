type AnatodCliente = {
  cliente_id?: number | string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  clienteScoring?: string | number | null;
  clienteScoringFinanciable?: string | number | null;
};

type AnatodFactura = {
  factura_id?: number | string;
  factura_tipo?: string;
  factura_puntoventa?: number | string;
  factura_numero?: number | string;
  factura_importe?: string | number | null;
  factura_fecha?: string | null;
  factura_fecha_real?: string | null;
  factura_1vencimiento?: string | null;
  factura_2vencimiento?: string | null;
  factura_3vencimiento?: string | null;
  factura_anulada?: number | string | null;
  factura_detalle?: string | null;
  factura_moneda?: string | number | null;
  factura_cliente?: number | string | null;
};

function parseMoneyLike(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  const n = Number(s.replace(/"/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function isValidDate(s?: string | null) {
  return !!s && s !== "0000-00-00";
}

function displayNumber(f: AnatodFactura) {
  const tipo = (f.factura_tipo ?? "").trim();
  const pv = String(f.factura_puntoventa ?? "").padStart(4, "0");
  const num = String(f.factura_numero ?? "").padStart(8, "0");
  const core = `${pv}-${num}`;
  return tipo ? `${tipo} ${core}` : core;
}

function currencyFromFactura(_f: AnatodFactura): string {
  // Si más adelante mapeás factura_moneda con catálogo, lo cambiamos.
  return "ARS";
}

export function mapFacturaToDTO(f: AnatodFactura) {
  const due =
    (isValidDate(f.factura_1vencimiento) && f.factura_1vencimiento) ||
    (isValidDate(f.factura_2vencimiento) && f.factura_2vencimiento) ||
    (isValidDate(f.factura_3vencimiento) && f.factura_3vencimiento) ||
    null;

  const isVoided = Number(f.factura_anulada ?? 0) === 1;

  return {
    invoiceId: Number(f.factura_id),
    displayNumber: displayNumber(f),
    amount: parseMoneyLike(f.factura_importe),
    currency: currencyFromFactura(f),
    issuedAt: (f.factura_fecha_real || f.factura_fecha || null) as string | null,
    dueDate: due as string | null,
    status: isVoided ? "VOIDED" : "ISSUED",
    description: (f.factura_detalle || "").toString().slice(0, 120),
  };
}

async function anatodGet(path: string) {
  const base = process.env.ANATOD_BASE_URL; // ej: https://api.anatod.ar/api
  const apiKey = process.env.ANATOD_API_KEY;

  if (!base) throw new Error("Missing env ANATOD_BASE_URL");
  if (!apiKey) throw new Error("Missing env ANATOD_API_KEY");

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
    throw new Error(`ANATOD_GET_FAILED url=${url} status=${res.status} body=${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as any;
  return json;
}

export async function anatodGetClienteById(clienteId: number | string) {
  const json = await anatodGet(`/cliente/${clienteId}`);

  // Algunas APIs devuelven {data:{...}} y otras el objeto directo
  const cliente: AnatodCliente = json && typeof json === "object" && "data" in json ? json.data : json;

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
  const json = await anatodGet(`/cliente/${clienteId}/facturas`);

  // Anatod suele devolver { current_page, data: [...] }
  const data = json && typeof json === "object" && Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];

  return data as AnatodFactura[];
}

export async function anatodGetFacturaById(facturaId: number | string) {
  const json = await anatodGet(`/factura/${facturaId}`);

  const factura: AnatodFactura = json && typeof json === "object" && "data" in json ? json.data : json;
  return factura;
}
