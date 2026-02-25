// apps/api/src/middleware/clientContext.ts
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      clientId?: number;
    }
  }
}

type Options = {
  demoClientId: number;
  headerName?: string; // default: "x-client-id"
};

export function withClientContext(opts: Options) {
  const headerName = (opts.headerName ?? "x-client-id").toLowerCase();

  return function clientContext(req: Request, _res: Response, next: NextFunction) {
    const raw = String(req.headers[headerName] ?? "").trim();

    // Si no viene header, usamos demo
    if (!raw) {
      req.clientId = Number(opts.demoClientId);
      return next();
    }

    // Validación simple (numérico)
    if (!/^\d+$/.test(raw)) {
      // No cortamos el request para no romper demo; caemos a demo
      req.clientId = Number(opts.demoClientId);
      return next();
    }

    req.clientId = Number(raw);
    return next();
  };
}
