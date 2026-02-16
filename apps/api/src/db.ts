import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing env DATABASE_URL");
}

export const pool = new Pool({
  connectionString,
  // Neon requiere SSL; con sslmode=require en la URL alcanza.
  // Esto ayuda a evitar problemas con algunos drivers.
  ssl: { rejectUnauthorized: false },
});
