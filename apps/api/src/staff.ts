import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

const STAFF_ACCESS_CODE = process.env.STAFF_ACCESS_CODE || "";
const STAFF_JWT_SECRET = process.env.STAFF_JWT_SECRET || "";
const STAFF_JWT_TTL = process.env.STAFF_JWT_TTL || "24h"; // opcional

export function staffLogin(req: Request, res: Response) {
  const { code } = req.body || {};

  if (!STAFF_ACCESS_CODE) {
    return res.status(500).json({ error: "STAFF_ACCESS_CODE no configurado" });
  }
  if (!STAFF_JWT_SECRET) {
    return res.status(500).json({ error: "STAFF_JWT_SECRET no configurado" });
  }

  if (!code || code !== STAFF_ACCESS_CODE) {
    return res.status(401).json({ error: "Código inválido" });
  }

  const token = jwt.sign(
    { role: "SELLER" },
    STAFF_JWT_SECRET as Secret,
    { expiresIn: STAFF_JWT_TTL as SignOptions["expiresIn"] }
  );

  return res.json({ access_token: token, role: "SELLER" });
}
