import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";

import { listCatalogProducts } from "./catalogRepo.js";

const STAFF_JWT_SECRET = process.env.STAFF_JWT_SECRET || "";

function requireSeller(req: Request, res: Response, next: NextFunction) {
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

export function registerInternalCatalogRoutes(app: any) {
  app.get("/internal/catalog/products", requireSeller, async (req: Request, res: Response) => {
    const q = String(req.query.q ?? "").trim();

    try {
      const rows = await listCatalogProducts(q);

      res.json(
        rows.map((r) => ({
          id: Number(r.id),
          name: r.name,
          price: r.price ? Number(r.price) : null,
          stock: r.stock,
        }))
      );
    } catch (e: any) {
      console.error("internal catalog list error:", e);
      res.status(500).json({ error: "Error leyendo catálogo" });
    }
  });
}
