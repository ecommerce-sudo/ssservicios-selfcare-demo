// apps/api/src/index.ts
import dotenv from "dotenv";
import { createApp } from "./app.js";

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
import { registerStaffRoutes } from "./routes/staff.js";
import { registerMeInvoicesRoutes } from "./routes/meInvoices.js";

import {
  anatodListConexionesInternetByCliente,
  anatodListConexionesTelefoniaByCliente,
  anatodListConexionesTelevisionByCliente,
  mapConexionToServiceDTO,
} from "./integrations/anatodClient.js";

dotenv.config();

// Demo auth: por ahora fijamos clientId=66489.
// Más adelante lo cambiamos por login real / token.
const DEMO_CLIENT_ID = 66489;

// ✅ Express bootstrap centralizado en app.ts
const app = createApp();

// ---------- Staff (interno) ----------
registerStaffRoutes(app);

// ---------- Invoices ----------
registerMeInvoicesRoutes(app, { demoClientId: DEMO_CLIENT_ID });

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

    const reserved = await sumActiveReservations(Number(DEMO_CLIENT_ID));

    const official = c.financiable;
    const available = Math.max(official - reserved, 0);

    res.json({
      clientId: Number(DEMO_CLIENT_ID),
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
    const me = await anatodGetClienteById(DEMO_CLIENT_ID);
    const anatodClientId = Number(me.clienteId);

    const results = await Promise.allSettled([
      anatodListConexionesInternetByCliente(anatodClientId),
      anatodListConexionesTelefoniaByCliente(anatodClientId),
      anatodListConexionesTelevisionByCliente(anatodClientId),
    ]);

    const [internetRes, phoneRes, tvRes] = results;

    const errors: Array<{ type: string; message: string }> = [];
    const services: Array<any> = [];

    if (internetRes.status === "fulfilled") {
      const list = Array.isArray(internetRes.value?.data) ? internetRes.value.data : [];
      const active = list.filter(
        (x: any) =>
          String(x?.conexion_cortado ?? "").toUpperCase() === "N" ||
          String(x?.conexion_cortado ?? "").trim() === ""
      );
      for (const item of active) services.push(mapConexionToServiceDTO(item, "INTERNET"));
    } else {
      errors.push({
        type: "INTERNET",
        message: String(internetRes.reason?.message ?? internetRes.reason),
      });
    }

    if (phoneRes.status === "fulfilled") {
      const list = Array.isArray(phoneRes.value?.data) ? phoneRes.value.data : [];
      const active = list.filter((x: any) => {
        const v = x?.conexion_cortado ?? x?.cortado ?? x?.servicio_cortado;
        if (v === null || v === undefined || String(v).trim() === "") return true;
        return String(v).toUpperCase() === "N";
      });
      for (const item of active) services.push(mapConexionToServiceDTO(item, "PHONE"));
    } else {
      errors.push({ type: "PHONE", message: String(phoneRes.reason?.message ?? phoneRes.reason) });
    }

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
        errors,
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

// ---------- ESTADO DE CUENTA (Account Status) ----------
app.get("/v1/me/account", async (_req, res) => {
  try {
    const c = await anatodGetClienteById(DEMO_CLIENT_ID);
    const raw: any = (c as any).raw ?? {};

    const saldo = parseMoneyLike(raw.cliente_saldo);
    const mora = String(raw.cliente_mora ?? "").toUpperCase() === "Y";
    const mesesAtraso = Number(raw.cliente_meses_atraso ?? 0) || 0;
    const cortado = String(raw.cliente_cortado ?? "").toUpperCase() === "Y";

    const habilitacion = safeDate(raw.cliente_habilitacion);
    const corte = safeDate(raw.cliente_corte);

    const status =
      cortado
        ? "CORTADO"
        : mora || mesesAtraso > 0 || saldo > 0
          ? "CON_DEUDA"
          : "AL_DIA";

    res.json({
      clientId: Number(DEMO_CLIENT_ID),
      anatodClientId: Number(c.clienteId),

      status,
      balance: saldo,
      currency: "ARS",

      inArrears: mora,
      monthsInArrears: mesesAtraso,
      cutOff: cortado,

      habilitacionDate: habilitacion,
      lastCutDate: corte,

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

    const c = await anatodGetClienteById(DEMO_CLIENT_ID);
    const reserved = await sumActiveReservations(Number(DEMO_CLIENT_ID));

    const official = c.financiable;
    const available = Math.max(official - reserved, 0);

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

    const installment = Math.round((amount / 3) * 100) / 100;

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

      const consumed = await setReservationStatus(reservationId, "CONSUMED");

      await addOrderEvent(orderId, "RESERVATION_CONSUMED", {
        reservationId,
        status: consumed?.status ?? "CONSUMED",
      });

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
