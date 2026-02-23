'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffLoginPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      // Llama a tu FastAPI (Render) - ajustá NEXT_PUBLIC_API_BASE si ya lo tenés
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/staff/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Login inválido');
      }

      const data = await res.json();

      // Set cookie en el browser (simple para MVP)
      document.cookie = `staff_token=${data.access_token}; Path=/; SameSite=Lax; Max-Age=86400`;

      router.push('/staff/catalog');
    } catch (e: any) {
      setErr(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui', maxWidth: 420, margin: '0 auto' }}>
      <h2>Acceso Staff</h2>
      <p style={{ opacity: 0.8 }}>Ingresá el código interno.</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código"
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button
          type="submit"
          disabled={loading || !code}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        >
          {loading ? 'Ingresando…' : 'Entrar'}
        </button>
        {err && <div style={{ color: 'crimson' }}>{err}</div>}
      </form>
    </div>
  );
}
