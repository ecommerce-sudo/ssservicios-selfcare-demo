import { pool } from "./db.js";

export type CatalogProductRow = {
  id: string; // bigint/numeric puede venir como string en pg
  name: string;
  price: string | null;
  stock: number | null;
  updated_at: string | null;
};

export async function listCatalogProducts(q?: string): Promise<CatalogProductRow[]> {
  const query = (q ?? "").trim();

  if (query) {
    const { rows } = await pool.query<CatalogProductRow>(
      `
      select id, name, price, stock, updated_at
      from catalog_products
      where to_tsvector('spanish', name) @@ plainto_tsquery('spanish', $1)
      order by updated_at desc nulls last, id desc
      limit 100
      `,
      [query]
    );
    return rows;
  }

  const { rows } = await pool.query<CatalogProductRow>(
    `
    select id, name, price, stock, updated_at
    from catalog_products
    order by updated_at desc nulls last, id desc
    limit 100
    `
  );
  return rows;
}
