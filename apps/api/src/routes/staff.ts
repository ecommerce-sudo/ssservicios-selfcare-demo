// apps/api/src/routes/staff.ts
import type { Express } from "express";
import rateLimit from "express-rate-limit";

import { staffLogin } from "../staff.js";
import { registerInternalCatalogRoutes } from "../internalCatalog.js";

export function registerStaffRoutes(app: Express) {
  const staffLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10, // 10 requests por ventana por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      ok: false,
      error: "RATE_LIMITED",
      detail: "Demasiados intentos. Probá de nuevo en unos minutos.",
    },
  });

  app.post("/staff/auth/login", staffLoginLimiter, staffLogin);

  // Rutas internas protegidas por requireSeller (JWT SELLER)
  registerInternalCatalogRoutes(app);
}
