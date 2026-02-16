import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing env DATABASE_URL");
}

export const pool = new Pool({
  connectionString,
  // Neon usa SSL; con sslmode=require en la URL alcanza.
  // Esto evita problemas de SSL en algunos entornos.
  ssl: { rejectUnauthorized: false }
});
