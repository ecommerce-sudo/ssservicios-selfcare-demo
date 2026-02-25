// apps/api/src/internalCatalog.ts
import type { Request, Response } from "express";

import { listCatalogProducts } from "./catalogRepo.js";
import { syncCatalogFull, syncCatalogIncremental } from "./syncCatalog.js";
import { requireSeller } from "./middleware/requireSeller.js";

export function registerInternalCatalogRoutes(app: any) {
  // 1) Listado catálogo (desde DB)
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
          image_url: r.image_url ?? null,
          handle: r.handle ?? null,
          public_url: r.public_url ?? null,
        }))
      );
    } catch (e: any) {
      console.error("internal catalog list error:", e);
      res.status(500).json({ error: "Error leyendo catálogo" });
    }
  });

  // 2) Sync FULL
  app.post("/internal/catalog/admin/sync/full", requireSeller, async (_req: Request, res: Response) => {
    try {
      const result = await syncCatalogFull();
      res.json({ ok: true, ...result });
    } catch (e: any) {
      console.error("sync full error:", e);
      res.status(500).json({ ok: false, error: e?.message ?? "sync full failed" });
    }
  });

  // 3) Sync incremental
  app.post(
    "/internal/catalog/admin/sync/incremental",
    requireSeller,
    async (_req: Request, res: Response) => {
      try {
        const result = await syncCatalogIncremental();
        res.json({ ok: true, ...result });
      } catch (e: any) {
        console.error("sync incremental error:", e);
        res.status(500).json({ ok: false, error: e?.message ?? "sync incremental failed" });
      }
    }
  );
}
