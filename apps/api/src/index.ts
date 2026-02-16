import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

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

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`);
});
