import type { Request, Response } from "express";

const STAFF_ACCESS_CODE = process.env.STAFF_ACCESS_CODE || "";

export function staffLogin(req: Request, res: Response) {
  const { code } = req.body || {};

  if (!STAFF_ACCESS_CODE) {
    return res.status(500).json({ error: "STAFF_ACCESS_CODE no configurado" });
  }

  if (!code || code !== STAFF_ACCESS_CODE) {
    return res.status(401).json({ error: "Código inválido" });
  }

  // MVP token (después lo cambiamos por JWT real)
  return res.json({ access_token: "SELLER_OK", role: "SELLER" });
}
