import type { Request, Response, NextFunction } from "express";

function requireSeller(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization");
  if (!auth) return res.status(401).json({ error: "Falta Authorization" });

  const [scheme, token] = auth.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ error: "Authorization inválido" });
  }

  if (token !== "SELLER_OK") {
    return res.status(403).json({ error: "No autorizado" });
  }

  return next();
}

export function registerInternalCatalogRoutes(app: any) {
  app.get("/internal/catalog/products", requireSeller, (req: Request, res: Response) => {
    const q = String(req.query.q ?? "").toLowerCase().trim();

    let items = [
      { id: 1, name: "Producto demo", price: 1000, stock: 10 },
      { id: 2, name: "Otro producto", price: 2000, stock: 4 },
    ];

    if (q) items = items.filter((x) => x.name.toLowerCase().includes(q));
    res.json(items);
  });
}
