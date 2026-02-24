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
      if (!token) throw new Error('No hay sesión staff. Volvé a /staff/login.');

      const url = `${apiBase}/internal/catalog/products?q=${encodeURIComponent(q.trim())}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

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

    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, text, url: p.public_url || undefined });
        return;
      } catch {}
    }

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

  // ✅ clase base para que ningún CSS global te pise el botón
  const btnBase =
    'appearance-none !border-0 !outline-none !shadow-none ring-0 focus:ring-0 active:scale-95 transition';

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen">
      <div className="relative flex min-h-screen flex-col max-w-6xl mx-auto bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center p-4 justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">sell</span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Catálogo (Staff)</h1>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-slate-400">search</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') load();
                  if (e.key === 'Escape') setQ('');
                }}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-slate-500"
                placeholder="Buscar productos..."
                type="text"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className={`${btnBase} w-full !bg-primary text-white font-bold py-3 rounded-2xl hover:opacity-95`}
              >
                {loading ? 'Buscando…' : 'Buscar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  setTimeout(load, 0);
                }}
                className={`${btnBase} px-4 !bg-slate-100 dark:!bg-slate-800 rounded-2xl font-semibold text-sm hover:opacity-90`}
              >
                Limpiar
              </button>
            </div>

            {err && <div className="mt-3 text-sm text-red-500">{err}</div>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          <div className="px-4 py-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">{items.length} resultados</p>

            {/* 2 cols mobile / 4 cols desktop */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm rounded-3xl flex flex-col h-full"
                >
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-700">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : null}
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <h3 className="text-sm lg:text-base font-bold leading-tight text-slate-900 dark:text-white line-clamp-2">
                      {p.name}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      {p.price != null ? <span className="font-bold text-primary text-xl">${p.price}</span> : null}
                      {p.stock != null ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Stock: {p.stock}</span>
                      ) : null}
                    </div>

                    {/* ✅ Acciones: mobile 2 + copiar full, desktop 3 */}
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => onWhatsApp(p)}
                        className={`${btnBase} h-10 flex items-center justify-center gap-2 !bg-slate-100 dark:!bg-slate-800 rounded-2xl`}
                      >
                        <span className="material-symbols-outlined text-green-600 text-[20px]">chat</span>
                        <span className="text-xs font-semibold whitespace-nowrap">WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onShare(p)}
                        className={`${btnBase} h-10 flex items-center justify-center gap-2 !bg-slate-100 dark:!bg-slate-800 rounded-2xl`}
                      >
                        <span className="material-symbols-outlined text-slate-700 dark:text-slate-200 text-[20px]">
                          share
                        </span>
                        <span className="text-xs font-semibold whitespace-nowrap">Compartir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onCopy(p)}
                        className={`${btnBase} col-span-2 lg:col-span-1 h-10 flex items-center justify-center gap-2 !bg-slate-100 dark:!bg-slate-800 rounded-2xl`}
                      >
                        <span className="material-symbols-outlined text-slate-700 dark:text-slate-200 text-[20px]">
                          content_copy
                        </span>
                        <span className="text-xs font-semibold whitespace-nowrap">Copiar</span>
                      </button>
                    </div>

                    <div className="mt-auto">
                      {p.public_url ? (
                        <a
                          href={p.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full !bg-primary text-white font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 hover:opacity-95"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span className="text-sm font-bold whitespace-nowrap">Ver en tienda</span>
                        </a>
                      ) : (
                        <div className="text-sm text-slate-500">Sin link público</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
