'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  name: string;
  price?: string | number | null;
  stock?: number | null;
  image_url?: string | null;
  public_url?: string | null;
};

function getCookie(name: string): string | null {
  const parts = document.cookie.split(';').map((c) => c.trim());
  const found = parts.find((c) => c.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.substring(name.length + 1));
}

function buildShareText(p: Product) {
  const price = p.price != null ? `💰 $${p.price}` : '';
  const stock = p.stock != null ? `📦 Stock: ${p.stock}` : '';
  const link = p.public_url ? `🔗 ${p.public_url}` : '';
  return [`🛒 ${p.name}`, price, stock, link].filter(Boolean).join('\n');
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function StaffCatalogPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      if (!apiBase) throw new Error('Falta configurar NEXT_PUBLIC_API_BASE_URL en Vercel.');

      const token = getCookie('staff_token');
      if (!token) throw new Error('No hay sesión staff. Volvé a /staff/login e ingresá el código.');

      const url = `${apiBase}/internal/catalog/products?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Error HTTP ${res.status}`);
      }

      setItems(await res.json());
    } catch (e: any) {
      setErr(e?.message ?? 'Error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function onShare(p: Product) {
    const text = buildShareText(p);

    // 1) Web Share API (celular): abre selector nativo
    if (navigator.share) {
      try {
        await navigator.share({
          title: p.name,
          text,
          url: p.public_url || undefined,
        });
        return;
      } catch {
        // si cancelan share, no hacemos nada
      }
    }

    // 2) Fallback: copiar
    await copyToClipboard(text);
    alert('Texto copiado');
  }

  function onWhatsApp(p: Product) {
    const text = encodeURIComponent(buildShareText(p));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  async function onCopy(p: Product) {
    await copyToClipboard(buildShareText(p));
    alert('Texto copiado');
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h2>Catálogo (Staff)</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', flex: 1 }}
        />
        <button
          onClick={load}
          disabled={loading}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>{err}</div>}

      <ul style={{ display: 'grid', gap: 10, padding: 0, listStyle: 'none' }}>
        {items.map((p) => (
          <li
            key={p.id}
            style={{
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 12,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.name}
                loading="lazy"
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid #eee',
                  flex: '0 0 auto',
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  border: '1px solid #eee',
                  background: '#fafafa',
                  flex: '0 0 auto',
                }}
                title="Sin imagen"
              />
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </div>
              <div style={{ opacity: 0.8, marginTop: 4 }}>
                ID: {p.id} {p.price != null ? `· $${p.price}` : ''} {p.stock != null ? `· Stock: ${p.stock}` : ''}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => onWhatsApp(p)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => onShare(p)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
                >
                  Compartir
                </button>
                <button
                  onClick={() => onCopy(p)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
                >
                  Copiar
                </button>

                {p.public_url && (
                  <a
                    href={p.public_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', textDecoration: 'none' }}
                  >
                    Ver en tienda
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
