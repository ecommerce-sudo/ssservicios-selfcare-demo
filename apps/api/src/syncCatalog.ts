// apps/api/src/syncCatalog.ts
import { pool } from "./db.js";
import { tnListProducts } from "./tiendanube.js";

function pickName(p: any): string {
  const n = p?.name;
  if (typeof n === "string") return n;
  return n?.es || n?.pt || n?.en || `Producto ${p?.id ?? ""}`.trim();
}

function pickPrice(p: any): number | null {
  const v = Array.isArray(p?.variants) ? p.variants[0] : null;
  const price = v?.promotional_price ?? v?.price ?? null;
  if (price == null || price === "") return null;
  const num = Number(price);
  return Number.isFinite(num) ? num : null;
}

function pickStock(p: any): number | null {
  const v = Array.isArray(p?.variants) ? p.variants[0] : null;
  const stock = v?.stock;
  if (stock == null) return null;
  const num = Number(stock);
  return Number.isFinite(num) ? num : null;
}

function pickUpdatedAt(p: any): string | null {
  return p?.updated_at ?? null;
}

async function upsertProduct(row: {
  id: number;
  name: string;
  price: number | null;
  stock: number | null;
  updated_at: string | null;
}) {
  await pool.query(
    `
    insert into catalog_products (id, name, price, stock, updated_at)
    values ($1, $2, $3, $4, $5)
    on conflict (id) do update
    set name = excluded.name,
        price = excluded.price,
        stock = excluded.stock,
        updated_at = excluded.updated_at
    `,
    [row.id, row.name, row.price, row.stock, row.updated_at]
  );
}

export async function getLastUpdatedAt(): Promise<string | null> {
  const { rows } = await pool.query<{ max: string | null }>(
    `select max(updated_at) as max from catalog_products`
  );
  return rows?.[0]?.max ?? null;
}

export async function syncCatalogFull(): Promise<{ upserted: number }> {
  let page = 1;
  const per_page = 200;
  let upserted = 0;

  while (true) {
    const products = await tnListProducts({ page, per_page });
    if (!products || products.length === 0) break;

    for (const p of products) {
      await upsertProduct({
        id: Number(p.id),
        name: pickName(p),
        price: pickPrice(p),
        stock: pickStock(p),
        updated_at: pickUpdatedAt(p),
      });
      upserted++;
    }

    page++;
  }

  return { upserted };
}

export async function syncCatalogIncremental(): Promise<{ upserted: number; since: string | null }> {
  // Tomamos el máximo updated_at local y pedimos cambios desde ahí
  const last = await getLastUpdatedAt();

  // Buffer para no perder cambios por clock drift (5 min)
  let since: string | null = last;
  if (since) {
    const d = new Date(since);
    d.setMinutes(d.getMinutes() - 5);
    since = d.toISOString();
  }

  let page = 1;
  const per_page = 200;
  let upserted = 0;

  while (true) {
    const products = await tnListProducts({ page, per_page, updated_at_min: since ?? undefined });
    if (!products || products.length === 0) break;

    for (const p of products) {
      await upsertProduct({
        id: Number(p.id),
        name: pickName(p),
        price: pickPrice(p),
        stock: pickStock(p),
        updated_at: pickUpdatedAt(p),
      });
      upserted++;
    }

    page++;
  }

  return { upserted, since };
}
