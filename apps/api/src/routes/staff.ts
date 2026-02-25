// apps/api/src/routes/staff.ts
import type { Express } from "express";
import { staffLogin } from "../staff.js";
import { registerInternalCatalogRoutes } from "../internalCatalog.js";

/**
 * Rutas internas (staff/backoffice).
 * Mantener todo lo "interno" concentrado acá para no inflar index.ts.
 */
export function registerStaffRoutes(app: Express) {
  app.post("/staff/auth/login", staffLogin);
  registerInternalCatalogRoutes(app);
}
