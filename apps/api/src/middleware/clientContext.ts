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
  strictWhenProvided?: boolean; // default: true
};

export function withClientContext(opts: Options) {
  const headerName = (opts.headerName ?? "x-client-id").toLowerCase();
  const strict = opts.strictWhenProvided ?? true;

  return function clientContext(req: Request, res: Response, next: NextFunction) {
    const raw = String(req.headers[headerName] ?? "").trim();

    // Si no viene header, usamos demo (modo demo-friendly)
    if (!raw) {
      req.clientId = Number(opts.demoClientId);
      return next();
    }

    // Si viene header pero es inválido
    if (!/^\d+$/.test(raw)) {
      if (strict) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_CLIENT_ID_HEADER",
          detail: `Header ${headerName} debe ser numérico`,
        });
      }

      // fallback demo (por si algún día querés desactivar strict)
      req.clientId = Number(opts.demoClientId);
      return next();
    }

    req.clientId = Number(raw);
    return next();
  };
}
