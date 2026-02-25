// apps/api/src/integrations/anatodClient.ts
/**
 * Anatod client helpers (read-only).
 * Centraliza fetch, endpoints observados y mappers tolerantes.
 */

async function anatodGetJSON(path: string) {
  const base = process.env.ANATOD_BASE_URL; // ej: https://api.anatod.ar/api
  const apiKey = process.env.ANATOD_API_KEY;

  if (!base) throw new Error("Missing env ANATOD_BASE_URL");
  if (!apiKey) throw new Error("Missing env ANATOD_API_KEY");

  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json", "x-api-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `ANATOD_GET_FAILED url=${url} status=${res.status} body=${text.slice(0, 300)}`
    );
  }

  return (await res.json()) as any;
}

/**
 * ✅ REAL: Conexiones Internet del cliente (Anatod)
 * Endpoint observado: /cliente/{id}/conexiones/internet
 */
export async function anatodListConexionesInternetByCliente(anatodClientId: number | string) {
  return anatodGetJSON(`/cliente/${encodeURIComponent(String(anatodClientId))}/conexiones/internet`);
}

/**
 * ✅ REAL: Conexiones Telefonía del cliente (Anatod)
 * Endpoint (doc): /cliente/{id}/conexiones/telefonia
 */
export async function anatodListConexionesTelefoniaByCliente(anatodClientId: number | string) {
  return anatodGetJSON(
    `/cliente/${encodeURIComponent(String(anatodClientId))}/conexiones/telefonia`
  );
}

/**
 * ✅ REAL: Conexiones Televisión del cliente (Anatod)
 * Endpoint (doc): /cliente/{id}/conexiones/television
 */
export async function anatodListConexionesTelevisionByCliente(anatodClientId: number | string) {
  return anatodGetJSON(
    `/cliente/${encodeURIComponent(String(anatodClientId))}/conexiones/television`
  );
}

/**
 * Mapper tolerante: convierte cualquier item "conexion_*" (o similar) en un DTO de Service.
 * - Para Internet ya sabemos: conexion_id, conexion_plan, conexion_domicilio, conexion_cortado
 * - Para Telefonía/TV asumimos estructura similar, pero devolvemos algo usable igual.
 */
export function mapConexionToServiceDTO(item: any, type: "INTERNET" | "PHONE" | "TV") {
  const id =
    item?.conexion_id ??
    item?.telefono_id ??
    item?.television_id ??
    item?.id ??
    item?.servicio_id ??
    item?.linea_id ??
    item?.abonado_id ??
    null;

  const planId =
    item?.conexion_plan ??
    item?.plan_id ??
    item?.telefono_plan ??
    item?.television_plan ??
    item?.servicio_plan ??
    null;

  const domicilio =
    item?.conexion_domicilio ??
    item?.domicilio ??
    item?.direccion ??
    item?.instalacion_domicilio ??
    "";

  const cortadoRaw =
    item?.conexion_cortado ??
    item?.cortado ??
    item?.estado_corte ??
    item?.servicio_cortado ??
    null;

  const hasCortadoFlag =
    cortadoRaw !== null && cortadoRaw !== undefined && String(cortadoRaw).trim() !== "";
  const isActive = hasCortadoFlag ? String(cortadoRaw).toUpperCase() === "N" : true;

  const status = isActive ? "ACTIVE" : "INACTIVE";

  const name =
    item?.name ??
    item?.servicio_nombre ??
    item?.plan_nombre ??
    item?.descripcion ??
    (planId ? `${type} (Plan ${planId})` : `${type} (Servicio ${String(id ?? "s/n")})`);

  return {
    id: String(id ?? `${type}_${Math.random().toString(16).slice(2)}`),
    type,
    name: String(name),
    status,
    extra: domicilio ? String(domicilio) : "",
    sourceId: id ? Number(id) : undefined,
    planId: planId ? Number(planId) : undefined,
  };
}

/**
 * Llamada directa a Anatod: /factura/{facturaId}
 * (Encapsulada acá para no inflar index.ts)
 */
export async function anatodGetFacturaById(facturaId: number | string) {
  const base = process.env.ANATOD_BASE_URL; // ej: https://api.anatod.ar/api
  const apiKey = process.env.ANATOD_API_KEY;

  if (!base) throw new Error("Missing env ANATOD_BASE_URL");
  if (!apiKey) throw new Error("Missing env ANATOD_API_KEY");

  const url = `${base}/factura/${facturaId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json", "x-api-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `ANATOD_GET_FACTURA_FAILED status=${res.status} body=${text.slice(0, 300)}`
    );
  }

  const json = (await res.json()) as any;
  if (json && typeof json === "object" && "data" in json) return (json as any).data;
  return json;
}

/**
 * ✅ NUEVO: /factura/{facturaId}/print
 * Devuelve { urlFactura: "https://....pdf" } (S3)
 */
export async function anatodFacturaPrintLink(facturaId: number | string) {
  const base = process.env.ANATOD_BASE_URL; // ej: https://api.anatod.ar/api
  const apiKey = process.env.ANATOD_API_KEY;

  if (!base) throw new Error("Missing env ANATOD_BASE_URL");
  if (!apiKey) throw new Error("Missing env ANATOD_API_KEY");

  const id = String(facturaId).trim();
  if (!id) throw new Error("Missing facturaId");

  const url = `${base}/factura/${encodeURIComponent(id)}/print`;

  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json", "x-api-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `ANATOD_FACTURA_PRINT_FAILED status=${res.status} body=${text.slice(0, 300)}`
    );
  }

  const json = (await res.json()) as any;
  const urlFactura = json?.urlFactura ?? json?.data?.urlFactura ?? json?.url ?? json?.data?.url;

  return { raw: json, urlFactura: urlFactura ? String(urlFactura) : "" };
}
