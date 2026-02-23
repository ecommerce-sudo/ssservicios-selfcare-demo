'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  name: string;
  price?: string | number | null;
  stock?: number | null;
};

export default function StaffCatalogPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/internal/catalog/products?q=${encodeURIComponent(q)}`, {
        headers: {
          // mandamos cookie al backend si lo tenés mismo dominio; si no, usá Authorization Bearer también
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error(await res.text());
      setItems(await res.json());
    } catch (e: any) {
      setErr(e?.message ?? 'Error');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h2>Catálogo (Staff)</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button onClick={load} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}>
          Buscar
        </button>
      </div>

      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>{err}</div>}

      <ul style={{ display: 'grid', gap: 10, padding: 0, listStyle: 'none' }}>
        {items.map((p) => (
          <li key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{p.name}</div>
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              ID: {p.id} {p.price != null ? `· $${p.price}` : ''} {p.stock != null ? `· Stock: ${p.stock}` : ''}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
