// apps/api/src/middleware/clientContext.ts
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      clientId?: number;
    }
  }
}

type AppMode = "demo" | "prod";

type Options = {
  demoClientId: number;
  headerName?: string; // default: "x-client-id"
  strictWhenProvided?: boolean; // default: true
};

function getAppMode(): AppMode {
  const raw = String(process.env.APP_MODE ?? "").trim().toLowerCase();
  return raw === "prod" ? "prod" : "demo";
}

export function withClientContext(opts: Options) {
  const headerName = (opts.headerName ?? "x-client-id").toLowerCase();
  const strict = opts.strictWhenProvided ?? true;

  return function clientContext(req: Request, res: Response, next: NextFunction) {
    const mode = getAppMode();
    const raw = String(req.headers[headerName] ?? "").trim();

    // ✅ PROD: sin header => 401 (no hay demo fallback)
    if (!raw) {
      if (mode === "prod") {
        return res.status(401).json({
          ok: false,
          error: "MISSING_CLIENT_ID_HEADER",
          detail: `Falta header ${headerName}`,
        });
      }

      // ✅ DEMO: fallback al demoClientId
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

      // fallback demo si algún día querés desactivar strict
      req.clientId = Number(opts.demoClientId);
      return next();
    }

    req.clientId = Number(raw);
    return next();
  };
}
