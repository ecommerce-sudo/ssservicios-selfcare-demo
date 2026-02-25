// apps/api/src/app.ts
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";

export function createApp(): Express {
  const app = express();

  // Config básica (igual a como estaba en index.ts)
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  // CORS: por defecto queda abierto (demo).
  // En prod: seteá CORS_ORIGIN=https://tu-dominio.vercel.app (o lista separada por coma)
  const corsOriginRaw = (process.env.CORS_ORIGIN ?? "*").trim();
  const corsOrigins =
    corsOriginRaw === "*"
      ? "*"
      : corsOriginRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

  app.use(
    cors({
      origin: corsOrigins as any,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    })
  );

  return app;
}
