import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { listOrdersByClient, createOrder, addOrderEvent } from "./orders.js";


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
// Demo: "me" (por ahora sin Aria real: devolvemos el clientId y un disponible mock)
// Luego lo conectamos a Aria con tu token.
app.get("/v1/me", (_req, res) => {
  res.json({
    clientId: DEMO_CLIENT_ID,
    name: "Mosca Javier",
    purchaseAvailable: 0,
    currency: "ARS",
    note: "purchaseAvailable mock; luego lo traemos desde Aria",
  });
});

// Listado de órdenes del cliente (lee Neon)
app.get("/v1/me/orders", async (_req, res) => {
  try {
    const orders = await listOrdersByClient(DEMO_CLIENT_ID);
    res.json({ clientId: DEMO_CLIENT_ID, orders });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
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
    res.status(500).json({ ok: false, error: "DB_ERROR", detail: String(err?.message ?? err) });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`);
});
