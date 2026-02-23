// apps/api/src/tiendanube.ts
type TNProduct = any;

const TN_STORE_ID = process.env.TN_STORE_ID || "";
const TN_ACCESS_TOKEN = process.env.TN_ACCESS_TOKEN || "";
const TN_API_VERSION = process.env.TN_API_VERSION || "2025-03";
const TN_USER_AGENT =
  process.env.TN_USER_AGENT || "SSServiciosSelfcare (ecommerce@ssservicios.com.ar)";

function assertEnv() {
  if (!TN_STORE_ID) throw new Error("TN_STORE_ID no configurado");
  if (!TN_ACCESS_TOKEN) throw new Error("TN_ACCESS_TOKEN no configurado");
  if (!TN_USER_AGENT) throw new Error("TN_USER_AGENT no configurado");
}

function tnBaseUrl() {
  return `https://api.tiendanube.com/${TN_API_VERSION}/${TN_STORE_ID}`;
}

export function tnHeaders() {
  assertEnv();
  return {
    // OJO: Tiendanube usa "Authentication", no "Authorization"
    Authentication: `bearer ${TN_ACCESS_TOKEN}`,
    "User-Agent": TN_USER_AGENT,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

export async function tnListProducts(params: {
  page?: number;
  per_page?: number;
  updated_at_min?: string;
}): Promise<TNProduct[]> {
  assertEnv();

  const url = new URL(`${tnBaseUrl()}/products`);
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("per_page", String(params.per_page ?? 200));
  if (params.updated_at_min) url.searchParams.set("updated_at_min", params.updated_at_min);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: tnHeaders(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Tiendanube /products error ${res.status}: ${txt}`);
  }

  const data = (await res.json()) as unknown;

  if (!Array.isArray(data)) {
    const txt = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Tiendanube /products: respuesta no es array: ${txt}`);
  }

  return data as TNProduct[];
}
