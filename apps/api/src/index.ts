import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import {
  listOrdersByClient,
  createOrder,
  addOrderEvent,
  setOrderStatus,
  listPendingBuyFinancedByClient,
  listOrderEvents,
} from "./orders.js";

import {
  anatodGetClienteById,
  anatodListFacturasByCliente,
  mapFacturaToDTO,
} from "./anatod.js";

import {
  sumActiveReservations,
  createReservation,
  setReservationStatus,
  listReservationsByClient,
} from "./reservations.js";
import { createAriaAdditionalStrict } from "./adicional.js";

dotenv.config();

// Demo auth: por ahora fijamos clientId=66489.
// Más adelante lo cambiamos por login real / token.
const DEMO_CLIENT_ID = 66489;

const app = express();

// Config básica
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// CORS: en demo lo dejamos abierto; luego lo restringimos al dominio de Vercel
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  })
);

// ---------- Helpers ----------
function parseMoneyLike(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  const n = Number(s.replace(/"/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function safeDate(value: any): string | null {
  const s = String(value ?? "").trim();
  if (!s || s === "0000-00-00") return null;
  return s;
}

function escapeHtml(input: any): string {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * --- Anatod: fetch genérico (para conexiones por vertical)
 * Best-effort: el caller decide si rompe o tolera.
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
    throw new Error(`ANATOD_GET_FAILED url=${url} status=${res.status} body=${text.slice(0, 300)}`);
  }

  return (await res.json()) as any;
}

/**
 * ✅ REAL: Conexiones Internet del cliente (Anatod)
 * Endpoint observado: /cliente/{id}/conexiones/internet
 */
async function anatodListConexionesInternetByCliente(anatodClientId: number | string) {
  return anatodGetJSON(`/cliente/${encodeURIComponent(String(anatodClientId))}/conexiones/internet`);
}

/**
 * ✅ REAL: Conexiones Telefonía del cliente (Anatod)
 * Endpoint (doc): /cliente/{id}/conexiones/telefonia
 */
async function anatodListConexionesTelefoniaByCliente(anatodClientId: number | string) {
  return anatodGetJSON(
    `/cliente/${encodeURIComponent(String(anatodClientId))}/conexiones/telefonia`
  );
}

/**
 * ✅ REAL: Conexiones Televisión del cliente (Anatod)
 * Endpoint (doc): /cliente/{id}/conexiones/television
 */
async function anatodListConexionesTelevisionByCliente(anatodClientId: number | string) {
  return anatodGetJSON(
    `/cliente/${encodeURIComponent(String(anatodClientId))}/conexiones/television`
  );
}

/**
 * Mapper tolerante: convierte cualquier item "conexion_*" (o similar) en un DTO de Service.
 * - Para Internet ya sabemos: conexion_id, conexion_plan, conexion_domicilio, conexion_cortado
 * - Para Telefonía/TV asumimos que viene también en forma de "conexiones" (similar estructura),
 *   pero si cambia, igual devolvemos algo usable (id/name/status) sin romper.
 */
function mapConexionToServiceDTO(item: any, type: "INTERNET" | "PHONE" | "TV") {
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

  // Activo "fuerte" si existe el campo cortado tipo N/Y; si no existe, no filtramos (unknown)
  const hasCortadoFlag = cortadoRaw !== null && cortadoRaw !== undefined && String(cortadoRaw).trim() !== "";
  const isActive = hasCortadoFlag ? String(cortadoRaw).toUpperCase() === "N" : true;

  const status = isActive ? "ACTIVE" : "INACTIVE";

  // Nombre: mientras no tengamos endpoint de planes, dejamos algo consistente
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
 * (No depende de modificar anatod.ts, se mantiene encapsulado acá)
 */
async function anatodGetFacturaById(facturaId: number | string) {
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
  // a veces viene {data:[{...}]} o {data:{...}} o directo
  if (json && typeof json === "object" && "data" in json) return (json as any).data;
  return json;
}

/**
 * ✅ NUEVO: Llamada directa a Anatod: /factura/{facturaId}/print
 * Devuelve { urlFactura: "https://....pdf" } (S3)
 */
async function anatodFacturaPrintLink(facturaId: number | string) {
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

  // esperado: { urlFactura: "..." } (a veces puede venir anidado)
  const urlFactura =
    json?.urlFactura ?? json?.data?.urlFactura ?? json?.url ?? json?.data?.url;

  return { raw: json, urlFactura: urlFactura ? String(urlFactura) : "" };
}

// ---------- Healthcheck ----------
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ssservicios-selfcare-demo-api",
    ts: new Date().toISOString(),
  });
});

// ---------- Perfil + cupo ----------
app.get("/v1/me", async (_req, res) => {
  try {
    const c = await anatodGetClienteById(DEMO_CLIENT_ID);

    // Reservas pendientes (Neon): solo ACTIVE
    const reserved = await sumActiveReservations(Number(DEMO_CLIENT_ID));

    const official = c.financiable; // "clienteScoringFinanciable" parseado a number
    const available = Math.max(official - reserved, 0);

    res.json({
      clientId: Number(DEMO_CLIENT_ID),

      // ✅ ID real de Anatod (facturas / cuenta corriente)
      // Importante: NO exponemos PII; solo el identificador técnico.
      anatodClientId: Number(c.clienteId),

      name: c.fullName || "Cliente",
      purchaseAvailableOfficial: official,
      purchaseAvailableReserved: reserved,
      purchaseAvailable: available,
      currency: "ARS",
      source: "anatod:/cliente/{id}",
    });
  } catch (err: any) {
    console.error(err);
    res.status(502).json({
      ok: false,
      error: "ANATOD_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

// ---------- Servicios (REAL: Internet + Telefonía + TV, best-effort) ----------
app.get("/v1/me/services", async (_req, res) => {
  try {
    // 1) Cliente real (para obtener anatodClientId)
    const me = await anatodGetClienteById(DEMO_CLIENT_ID);
    const anatodClientId = Number(me.clienteId);

    // 2) Llamadas best-effort en paralelo
    const results = await Promise.allSettled([
      anatodListConexionesInternetByCliente(anatodClientId),
      anatodListConexionesTelefoniaByCliente(anatodClientId),
      anatodListConexionesTelevisionByCliente(anatodClientId),
    ]);

    const [internetRes, phoneRes, tvRes] = results;

    const errors: Array<{ type: string; message: string }> = [];
    const services: Array<any> = [];

    // Internet
    if (internetRes.status === "fulfilled") {
      const list = Array.isArray(internetRes.value?.data) ? internetRes.value.data : [];
      // Activo fuerte si existe conexion_cortado
      const active = list.filter(
        (x: any) =>
          String(x?.conexion_cortado ?? "").toUpperCase() === "N" ||
          String(x?.conexion_cortado ?? "").trim() === ""
      );
      for (const item of active) services.push(mapConexionToServiceDTO(item, "INTERNET"));
    } else {
      errors.push({ type: "INTERNET", message: String(internetRes.reason?.message ?? internetRes.reason) });
    }

    // Telefonía (si no hay data, no aparece)
    if (phoneRes.status === "fulfilled") {
      const list = Array.isArray(phoneRes.value?.data) ? phoneRes.value.data : [];
      // si hay flag de cortado, filtramos; si no, mostramos todo (UNKNOWN->ACTIVE)
      const active = list.filter((x: any) => {
        const v = x?.conexion_cortado ?? x?.cortado ?? x?.servicio_cortado;
        if (v === null || v === undefined || String(v).trim() === "") return true;
        return String(v).toUpperCase() === "N";
      });
      for (const item of active) services.push(mapConexionToServiceDTO(item, "PHONE"));
    } else {
      errors.push({ type: "PHONE", message: String(phoneRes.reason?.message ?? phoneRes.reason) });
    }

    // TV
    if (tvRes.status === "fulfilled") {
      const list = Array.isArray(tvRes.value?.data) ? tvRes.value.data : [];
      const active = list.filter((x: any) => {
        const v = x?.conexion_cortado ?? x?.cortado ?? x?.servicio_cortado;
        if (v === null || v === undefined || String(v).trim() === "") return true;
        return String(v).toUpperCase() === "N";
      });
      for (const item of active) services.push(mapConexionToServiceDTO(item, "TV"));
    } else {
      errors.push({ type: "TV", message: String(tvRes.reason?.message ?? tvRes.reason) });
    }

    // 3) Respuesta consolidada
    res.json({
      clientId: Number(DEMO_CLIENT_ID),
      anatodClientId,
      services,
      source: "anatod:/cliente/{id}/conexiones/*",
      meta: {
        fetched: {
          internet: internetRes.status === "fulfilled",
          telefonia: phoneRes.status === "fulfilled",
          television: tvRes.status === "fulfilled",
        },
        errors, // útil para debug; si querés lo escondemos después en prod
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(502).json({
      ok: false,
      error: "ANATOD_SERVICES_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

// ---------- FACTURAS ----------
app.get("/v1/me/invoices", async (req, res) => {
  try {
    const me = await anatodGetClienteById(DEMO_CLIENT_ID);
    const anatodClientId = Number(me.clienteId);

    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 50);

    const raw = await anatodListFacturasByCliente(anatodClientId);
    const mapped = (raw.data ?? []).map(mapFacturaToDTO);

    // Orden: vencimiento asc (null al final)
    mapped.sort((a: any, b: any) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    });

    res.json({
      clientId: Number(DEMO_CLIENT_ID),
      anatodClientId,
      invoices: mapped.slice(0, limit),
      source: "anatod:/cliente/{id}/facturas",
    });
  } catch (err: any) {
    console.error(err);
    res.status(502).json({
      ok: false,
      error: "ANATOD_INVOICES_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

app.get("/v1/me/invoices/next", async (_req, res) => {
  try {
    const me = await anatodGetClienteById(DEMO_CLIENT_ID);
    const anatodClientId = Number(me.clienteId);

    const raw = await anatodListFacturasByCliente(anatodClientId);
    const mapped = (raw.data ?? []).map(mapFacturaToDTO);

    const candidates = mapped
      .filter((x: any) => x.status !== "VOIDED" && !!x.dueDate)
      .sort(
        (a: any, b: any) =>
          new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime()
      );

    res.json({
      clientId: Number(DEMO_CLIENT_ID),
      anatodClientId,
      nextInvoice: candidates[0] ?? null,
      source: "anatod:/cliente/{id}/facturas",
    });
  } catch (err: any) {
    console.error(err);
    res.status(502).json({
      ok: false,
      error: "ANATOD_NEXT_INVOICE_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

// Factura puntual (DTO) — útil para “detalle”
app.get("/v1/me/invoices/:facturaId", async (req, res) => {
  try {
    const facturaId = String(req.params.facturaId ?? "").trim();
    if (!facturaId) return res.status(400).json({ ok: false, error: "MISSING_FACTURA_ID" });

    // Llamada directa a /factura/{id}
    const raw = await anatodGetFacturaById(facturaId);

    // Si devuelve array, tomamos el primer elemento
    const item = Array.isArray(raw) ? raw[0] : raw;
    if (!item) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    const dto = mapFacturaToDTO(item);

    res.json({
      clientId: Number(DEMO_CLIENT_ID),
      invoice: dto,
      source: "anatod:/factura/{id}",
    });
  } catch (err: any) {
    console.error(err);
    res.status(502).json({
      ok: false,
      error: "ANATOD_INVOICE_DETAIL_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

/**
 * ✅ NUEVO: PDF nativo (Anatod → S3) vía redirect:
 * - tu API NO proxynea bytes
 * - NO expone API key
 * - Render no paga ancho de banda
 */
app.get("/v1/me/invoices/:facturaId/print", async (req, res) => {
  try {
    const facturaId = String(req.params.facturaId ?? "").trim();
    if (!facturaId) return res.status(400).json({ ok: false, error: "MISSING_FACTURA_ID" });

    // sanity: demo only ids numéricos
    if (!/^\d+$/.test(facturaId)) {
      return res.status(400).json({ ok: false, error: "INVALID_FACTURA_ID" });
    }

    // ✅ Validación “pro” (segura) sin depender de nuevos endpoints:
    // listamos facturas del cliente y verificamos pertenencia antes de pedir el print
    const me = await anatodGetClienteById(DEMO_CLIENT_ID);
    const anatodClientId = Number(me.clienteId);

    const rawList = await anatodListFacturasByCliente(anatodClientId);
    const list = Array.isArray((rawList as any)?.data) ? (rawList as any).data : [];

    const found = list.find(
      (f: any) => String(f?.factura_id ?? f?.id ?? f?.facturaId) === facturaId
    );
    if (!found) {
      return res.status(404).json({ ok: false, error: "INVOICE_NOT_FOUND_FOR_CLIENT" });
    }

    const print = await anatodFacturaPrintLink(facturaId);

    if (!print.urlFactura) {
      return res.status(502).json({
        ok: false,
        error: "PRINT_LINK_MISSING",
        raw: print.raw,
      });
    }

    return res.redirect(302, print.urlFactura);
  } catch (err: any) {
    console.error(err);
    return res.status(502).json({
      ok: false,
      error: "ANATOD_PRINT_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

/**
 * ✅ Descarga de “comprobante” sin dependencias:
 * - retorna HTML como attachment (el usuario puede imprimir “Guardar como PDF”)
 */
app.get("/v1/me/invoices/:facturaId/receipt", async (req, res) => {
  try {
    const facturaId = String(req.params.facturaId ?? "").trim();
    if (!facturaId) return res.status(400).json({ ok: false, error: "MISSING_FACTURA_ID" });

    const me = await anatodGetClienteById(DEMO_CLIENT_ID);

    const raw = await anatodGetFacturaById(facturaId);
    const item = Array.isArray(raw) ? raw[0] : raw;
    if (!item) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    const dto: any = mapFacturaToDTO(item);

    // Intentamos extraer campos comunes del raw por si el mapper no trae alguno
    const tipo = dto.type ?? item.factura_tipo ?? "-";
    const ptoVta = dto.pointOfSale ?? item.factura_puntoventa ?? "-";
    const nro = dto.number ?? item.factura_numero ?? "-";
    const issueDate = dto.issueDate ?? safeDate(item.factura_fecha) ?? "-";
    const dueDate = dto.dueDate ?? safeDate(item.factura_1vencimiento) ?? null;
    const amount = dto.amount ?? parseMoneyLike(item.factura_importe);
    const currency = dto.currency ?? "ARS";
    const detail = dto.detail ?? item.factura_detalle ?? "";
    const status = dto.status ?? (item.factura_anulada ? "VOIDED" : "OPEN");

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Comprobante Factura ${escapeHtml(facturaId)}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto; background:#f5f7fa; margin:0; padding:24px;}
    .wrap{max-width:720px; margin:0 auto;}
    .card{background:#fff; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,.10); padding:18px;}
    .top{display:flex; justify-content:space-between; gap:12px; align-items:flex-start;}
    .brand{font-weight:900; font-size:18px;}
    .pill{display:inline-flex; align-items:center; padding:6px 10px; border-radius:999px; font-weight:800; font-size:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#1e3a8a;}
    h1{margin:0; font-size:18px;}
    .muted{opacity:.7; font-size:12px; margin-top:4px;}
    .grid{margin-top:14px; display:grid; gap:10px;}
    .row{display:flex; justify-content:space-between; gap:12px; font-size:14px; padding:10px 12px; background:#fafbfc; border:1px solid #eef0f3; border-radius:12px;}
    .k{font-weight:900;}
    .amt{font-size:26px; font-weight:900; letter-spacing:-.5px; margin-top:12px;}
    .note{margin-top:12px; font-size:12px; opacity:.8; line-height:1.4; background:#f8fafc; border:1px solid #e2e8f0; padding:12px; border-radius:12px;}
    .footer{margin-top:14px; font-size:11px; opacity:.7; text-align:center;}
    @media print { body{background:#fff; padding:0;} .card{box-shadow:none; border:1px solid #e2e8f0;} }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="top">
        <div>
          <div class="brand">SSServicios</div>
          <div class="muted">Comprobante de factura (demo) · Generado: ${escapeHtml(
            new Date().toISOString()
          )}</div>
        </div>
        <div class="pill">${escapeHtml(status)}</div>
      </div>

      <div style="margin-top:14px;">
        <h1>Factura ${escapeHtml(tipo)} ${escapeHtml(String(ptoVta))}-${escapeHtml(String(nro))}</h1>
        <div class="muted">Factura ID: ${escapeHtml(facturaId)} · Cliente (Selfcare): ${escapeHtml(
      String(DEMO_CLIENT_ID)
    )} · Anatod: ${escapeHtml(String(me.clienteId))}</div>
      </div>

      <div class="amt">$ ${escapeHtml(Number(amount).toLocaleString("es-AR"))} ${escapeHtml(currency)}</div>

      <div class="grid">
        <div class="row"><span class="k">Fecha de emisión</span><span>${escapeHtml(issueDate)}</span></div>
        <div class="row"><span class="k">Vencimiento</span><span>${escapeHtml(dueDate ?? "—")}</span></div>
        <div class="row"><span class="k">Detalle</span><span style="text-align:right; max-width:420px;">${escapeHtml(
      detail || "—"
    )}</span></div>
      </div>

      <div class="note">
        <b>Importante:</b> este comprobante es una representación para demo. Para un “PDF nativo” se puede generar con un motor de PDF
        (ej. pdfkit/puppeteer) cuando lo prioricemos en roadmap.
      </div>

      <div class="footer">SSServicios Selfcare Demo · Facturación / Estado de cuenta</div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="factura_${facturaId}.html"`);
    res.status(200).send(html);
  } catch (err: any) {
    console.error(err);
    res.status(502).json({
      ok: false,
      error: "ANATOD_RECEIPT_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

// ---------- ESTADO DE CUENTA (Account Status) ----------
app.get("/v1/me/account", async (_req, res) => {
  try {
    const c = await anatodGetClienteById(DEMO_CLIENT_ID);
    const raw: any = (c as any).raw ?? {};

    // Campos típicos del cliente (según tu JSON de ejemplo)
    const saldo = parseMoneyLike(raw.cliente_saldo);
    const mora = String(raw.cliente_mora ?? "").toUpperCase() === "Y";
    const mesesAtraso = Number(raw.cliente_meses_atraso ?? 0) || 0;
    const cortado = String(raw.cliente_cortado ?? "").toUpperCase() === "Y";

    const habilitacion = safeDate(raw.cliente_habilitacion);
    const corte = safeDate(raw.cliente_corte);

    // Señales de “estado” (para UI)
    const status =
      cortado
        ? "CORTADO"
        : mora || mesesAtraso > 0 || saldo > 0
          ? "CON_DEUDA"
          : "AL_DIA";

    res.json({
      clientId: Number(DEMO_CLIENT_ID),
      anatodClientId: Number(c.clienteId),

      status, // AL_DIA | CON_DEUDA | CORTADO
      balance: saldo, // saldo numérico
      currency: "ARS",

      inArrears: mora,
      monthsInArrears: mesesAtraso,
      cutOff: cortado,

      habilitacionDate: habilitacion,
      lastCutDate: corte,

      // Sin PII: nada de DNI, domicilio, teléfonos, etc.
      source: "anatod:/cliente/{id}",
    });
  } catch (err: any) {
    console.error(err);
    res.status(502).json({
      ok: false,
      error: "ANATOD_ACCOUNT_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

// ---------- Reservas ----------
app.get("/v1/me/reservations/demo-add", async (req, res) => {
  try {
    const amountRaw = String(req.query.amount ?? "").trim();
    const amount = Number(amountRaw);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, error: "INVALID_AMOUNT" });
    }

    const id = `res_${Date.now()}`;

    const row = await createReservation({
      id,
      clientId: Number(DEMO_CLIENT_ID),
      amount,
      status: "ACTIVE",
    });

    res.status(201).json({ ok: true, reservation: row });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

app.get("/v1/me/reservations/demo-release", async (req, res) => {
  try {
    const id = String(req.query.id ?? "").trim();
    if (!id) return res.status(400).json({ ok: false, error: "MISSING_ID" });

    const updated = await setReservationStatus(id, "RELEASED");
    if (!updated) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    res.json({ ok: true, reservation: updated });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

app.get("/v1/me/reservations", async (_req, res) => {
  try {
    const rows = await listReservationsByClient(Number(DEMO_CLIENT_ID));
    res.json({ clientId: Number(DEMO_CLIENT_ID), reservations: rows });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "DB_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

// ---------- Compra financiada ----------
app.get("/v1/me/purchase/financed", async (req, res) => {
  try {
    const amountRaw = String(req.query.amount ?? "").trim();
    const descRaw = String(req.query.desc ?? "").trim();

    const amount = Number(amountRaw);
    const description = descRaw || `Compra App Demo - ${new Date().toISOString()}`;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, error: "INVALID_AMOUNT" });
    }

    // 1) Cupo oficial (anatod) + 2) Reservas activas (Neon)
    const c = await anatodGetClienteById(DEMO_CLIENT_ID);
    const reserved = await sumActiveReservations(Number(DEMO_CLIENT_ID));

    const official = c.financiable;
    const available = Math.max(official - reserved, 0);

    // 3) Validación de cupo
    if (amount > available) {
      return res.status(409).json({
        ok: false,
        error: "INSUFFICIENT_CREDIT",
        official,
        reserved,
        available,
        requested: amount,
      });
    }

    // 4) Crear Order en Neon
    const orderId = `ord_${Date.now()}`;
    const order = await createOrder({
      id: orderId,
      clientId: DEMO_CLIENT_ID,
      type: "BUY_FINANCED",
      status: "PENDIENTE",
      conexionId: null,
      idempotencyKey: req.header("Idempotency-Key") ?? null,
    });

    await addOrderEvent(orderId, "CREATED", {
      type: "BUY_FINANCED",
      amount,
      description,
    });

    // 5) Crear Reserva en Neon por el total
    const reservationId = `res_${Date.now()}`;
    const reservation = await createReservation({
      id: reservationId,
      clientId: Number(DEMO_CLIENT_ID),
      orderId,
      amount,
      status: "ACTIVE",
    });

    await addOrderEvent(orderId, "RESERVED_CREDIT", {
      reservationId,
      amount,
    });

    // 6) Calcular cuota (3 meses)
    const installment = Math.round((amount / 3) * 100) / 100;

    // 7) Crear adicional real en anatod
    const adicionalRes = await createAriaAdditionalStrict({
      clientId: DEMO_CLIENT_ID,
      installmentValue: installment,
      description,
    });

    if (adicionalRes.ok) {
      await addOrderEvent(orderId, "ADICIONAL_CREATED", {
        installment,
        months: 3,
        status: adicionalRes.status,
      });

      // 8) Consumir reserva (ya se creó el adicional OK)
      const consumed = await setReservationStatus(reservationId, "CONSUMED");

      await addOrderEvent(orderId, "RESERVATION_CONSUMED", {
        reservationId,
        status: consumed?.status ?? "CONSUMED",
      });

      // 9) Estado final de orden
      await setOrderStatus(orderId, "APLICADO");
      await addOrderEvent(orderId, "STATUS_UPDATED", { status: "APLICADO" });

      return res.status(201).json({
        ok: true,
        order,
        reservation: consumed ?? reservation,
        adicional: { ok: true, status: adicionalRes.status },
        status: "APLICADO",
      });
    }

    // Si falla el adicional: dejamos reserva ACTIVE y orden EN_PROCESO
    await addOrderEvent(orderId, "ADICIONAL_FAILED", {
      status: adicionalRes.status,
      body: adicionalRes.bodyText.slice(0, 500),
    });

    await setOrderStatus(orderId, "EN_PROCESO");
    await addOrderEvent(orderId, "STATUS_UPDATED", { status: "EN_PROCESO" });

    return res.status(502).json({
      ok: false,
      error: "ADICIONAL_FAILED",
      order,
      reservation,
      status: "EN_PROCESO",
      adicional: {
        ok: false,
        status: adicionalRes.status,
        body: adicionalRes.bodyText.slice(0, 500),
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "PURCHASE_FLOW_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

// ---------- Órdenes ----------
app.get("/v1/me/orders/demo-create", async (req, res) => {
  try {
    const orderId = `ord_${Date.now()}`;

    const order = await createOrder({
      id: orderId,
      clientId: DEMO_CLIENT_ID,
      type: "UPGRADE_INTERNET",
      status: "PENDIENTE",
      conexionId: null,
      idempotencyKey: req.header("Idempotency-Key") ?? null,
    });

    await addOrderEvent(orderId, "CREATED", { via: "demo_create_get" });

    res.status(201).json({ ok: true, order });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

app.get("/v1/me/orders", async (_req, res) => {
  try {
    const orders = await listOrdersByClient(DEMO_CLIENT_ID);
    res.json({ clientId: Number(DEMO_CLIENT_ID), orders });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

app.get("/v1/me/orders/reconcile", async (_req, res) => {
  try {
    const pending = await listPendingBuyFinancedByClient(Number(DEMO_CLIENT_ID));

    let updatedToApplied = 0;
    let updatedToInProcess = 0;

    const touched: Array<{ orderId: string; from: string; to: string; reason: string }> = [];
    const skipped: Array<{ orderId: string; status: string; foundEvents: string[] }> = [];

    for (const o of pending) {
      const events = await listOrderEvents(o.id);
      const types = new Set(events.map((e) => e.event_type));

      const hasAdicionalCreated = types.has("ADICIONAL_CREATED");
      const hasReservationConsumed = types.has("RESERVATION_CONSUMED");
      const hasAdicionalFailed = types.has("ADICIONAL_FAILED");

      if (hasAdicionalCreated && hasReservationConsumed) {
        await setOrderStatus(o.id, "APLICADO");
        await addOrderEvent(o.id, "RECONCILED", {
          from: o.status,
          to: "APLICADO",
          rule: "ADICIONAL_CREATED+RESERVATION_CONSUMED",
        });
        await addOrderEvent(o.id, "STATUS_UPDATED", { status: "APLICADO", via: "reconcile" });

        updatedToApplied++;
        touched.push({
          orderId: o.id,
          from: o.status,
          to: "APLICADO",
          reason: "adicional+reserva_consumida",
        });
        continue;
      }

      if (hasAdicionalFailed) {
        await setOrderStatus(o.id, "EN_PROCESO");
        await addOrderEvent(o.id, "RECONCILED", {
          from: o.status,
          to: "EN_PROCESO",
          rule: "ADICIONAL_FAILED",
        });
        await addOrderEvent(o.id, "STATUS_UPDATED", { status: "EN_PROCESO", via: "reconcile" });

        updatedToInProcess++;
        touched.push({ orderId: o.id, from: o.status, to: "EN_PROCESO", reason: "adicional_failed" });
        continue;
      }

      skipped.push({ orderId: o.id, status: o.status, foundEvents: Array.from(types) });
    }

    res.json({
      ok: true,
      clientId: Number(DEMO_CLIENT_ID),
      scanned: pending.length,
      updatedToApplied,
      updatedToInProcess,
      skipped,
      touched,
      note: "Esta reconcile hoy solo mira BUY_FINANCED en PENDIENTE (por función actual). Si querés, la extendemos a EN_PROCESO también.",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "RECONCILE_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

app.post("/v1/me/orders/demo", async (req, res) => {
  try {
    const orderId = `ord_${Date.now()}`;
    const order = await createOrder({
      id: orderId,
      clientId: DEMO_CLIENT_ID,
      type: "UPGRADE_INTERNET",
      status: "PENDIENTE",
      conexionId: null,
      idempotencyKey: req.header("Idempotency-Key") ?? null,
    });

    await addOrderEvent(orderId, "CREATED", { via: "demo_endpoint" });

    res.status(201).json({ ok: true, order });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`);
});
