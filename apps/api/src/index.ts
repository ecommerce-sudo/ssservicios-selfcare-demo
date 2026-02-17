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

import { anatodGetClienteById } from "./anatod.js";
import {
  sumActiveReservations,
  createReservation,
  setReservationStatus,
  listReservationsByClient,
} from "./reservations.js";
import { createAriaAdditionalStrict } from "./adicional.js";

// ✅ NUEVO: servicios contratados (demo)
import { listServicesByClient } from "./services.js";

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

// Healthcheck (para Render)
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ssservicios-selfcare-demo-api",
    ts: new Date().toISOString(),
  });
});

// Perfil + cupo (anatod) - descuenta reservas activas (Neon)
app.get("/v1/me", async (_req, res) => {
  try {
    const c = await anatodGetClienteById(DEMO_CLIENT_ID);

    // Reservas pendientes (Neon): solo ACTIVE
    const reserved = await sumActiveReservations(Number(DEMO_CLIENT_ID));

    const official = c.financiable; // "clienteScoringFinanciable" parseado a number
    const available = Math.max(official - reserved, 0);

    res.json({
      clientId: Number(DEMO_CLIENT_ID),
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

// ✅ NUEVO: Servicios contratados (DEMO por ahora)
app.get("/v1/me/services", async (_req, res) => {
  try {
    const services = await listServicesByClient(Number(DEMO_CLIENT_ID));
    res.json({
      clientId: Number(DEMO_CLIENT_ID),
      services,
      source: "demo:services",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "SERVICES_ERROR",
      detail: String(err?.message ?? err),
    });
  }
});

// TEMP: agregar una reserva demo desde navegador: /v1/me/reservations/demo-add?amount=120000
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
    res
      .status(500)
      .json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

// TEMP: liberar una reserva (por si querés "rollback" demo)
// Uso: /v1/me/reservations/demo-release?id=res_123
app.get("/v1/me/reservations/demo-release", async (req, res) => {
  try {
    const id = String(req.query.id ?? "").trim();
    if (!id) return res.status(400).json({ ok: false, error: "MISSING_ID" });

    const updated = await setReservationStatus(id, "RELEASED");
    if (!updated) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    res.json({ ok: true, reservation: updated });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

// Listar reservas del cliente (últimas 50)
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

// COMPRA FINANCIADA (DEMO REAL): crea order + reserva + adicional (3 cuotas)
// Uso: /v1/me/purchase/financed?amount=120000&desc=Compra%20Demo%20Pack%20X
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

// TEMP: crear una orden demo desde el navegador (luego lo borramos)
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
    res
      .status(500)
      .json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

// Listado de órdenes del cliente (lee Neon)
app.get("/v1/me/orders", async (_req, res) => {
  try {
    const orders = await listOrdersByClient(DEMO_CLIENT_ID);
    res.json({ clientId: Number(DEMO_CLIENT_ID), orders });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

// TEMP: reconciliar órdenes BUY_FINANCED en PENDIENTE según eventos (deja el demo prolijo)
// Uso: /v1/me/orders/reconcile
app.get("/v1/me/orders/reconcile", async (_req, res) => {
  try {
    // hoy usamos la función existente (solo PENDIENTE)
    const pending = await listPendingBuyFinancedByClient(Number(DEMO_CLIENT_ID));

    let updatedToApplied = 0;
    let updatedToInProcess = 0;

    const touched: Array<{ orderId: string; from: string; to: string; reason: string }> = [];
    const skipped: Array<{ orderId: string; status: string; foundEvents: string[] }> = [];

    for (const o of pending) {
      const events = await listOrderEvents(o.id);
      const types = new Set(events.map((e) => e.event_type));

      // Reglas “más sólidas”: pedimos adicional + consumo de reserva para APLICADO
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
        touched.push({ orderId: o.id, from: o.status, to: "APLICADO", reason: "adicional+reserva_consumida" });
        continue;
      }

      if (hasAdicionalFailed) {
        await setOrderStatus(o.id, "EN_PROCESO");
        await addOrderEvent(o.id, "RECONCILED", { from: o.status, to: "EN_PROCESO", rule: "ADICIONAL_FAILED" });
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

// Endpoint helper para crear una orden demo (sirve para testear DB rápido)
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
    res
      .status(500)
      .json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`);
});
