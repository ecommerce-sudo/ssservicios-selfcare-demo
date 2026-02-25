// apps/api/src/middleware/requireSeller.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";

const STAFF_JWT_SECRET = process.env.STAFF_JWT_SECRET || "";

/**
 * Middleware: requiere token Bearer válido con role=SELLER.
 * - Devuelve 401 si falta/está mal el token
 * - Devuelve 403 si el rol no es SELLER
 * - Devuelve 500 si falta el secreto (config)
 */
export function requireSeller(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization");
  if (!auth) return res.status(401).json({ error: "Falta Authorization" });

  const [scheme, token] = auth.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ error: "Authorization inválido" });
  }

  if (!STAFF_JWT_SECRET) {
    return res.status(500).json({ error: "STAFF_JWT_SECRET no configurado" });
  }

  try {
    const payload = jwt.verify(token, STAFF_JWT_SECRET as Secret) as any;
    if (payload?.role !== "SELLER") {
      return res.status(403).json({ error: "No autorizado" });
    }
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido/expirado" });
  }
}
