# ssservicios-selfcare-demo — Variables de Entorno (API)

Este documento lista las variables necesarias para correr la API en Render.

## Servicio (Render)
Base URL:
- https://ssservicios-selfcare-demo.onrender.com

Node:
- Render usa Node por defecto. (Si se fija versión, documentarla acá)

---

## 1) Neon (PostgreSQL)

### DATABASE_URL (obligatoria)
Cadena de conexión PostgreSQL con SSL.

Ejemplo:
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"

Notas:
- Debe incluir `sslmode=require`.
- Se recomienda usar el "pooler" de Neon para ambientes serverless.
- Esta variable es consumida por `pg` en el middleware.

---

## 2) Anatod API (obligatoria para cupo y cliente)

### ANATOD_API_KEY (obligatoria)
Token de acceso a Anatod.

Ejemplo:
ANATOD_API_KEY="xxxxxxxxxxxxxxxxxxxx"

Uso:
- GET cliente (financiable / scoring)
- POST adicional (cuando aplica)

---

## 3) Aria / Usuario (obligatoria para crear adicional)

### ARIA_USER_ID (obligatoria para crear adicional)
Identificador del usuario que crea el adicional en el core.

Ejemplo:
ARIA_USER_ID="123"

Uso:
- Se envía como `adicional_usuario` al endpoint de creación de adicional.

---

## 4) Puerto (Render)

### PORT (Render la inyecta)
No setear manualmente en general.

La app levanta con:
- process.env.PORT (fallback 3001)

---

## Checklist (Render → Environment)
Obligatorias:
- DATABASE_URL
- ANATOD_API_KEY
- ARIA_USER_ID

Recomendadas:
- (más adelante) CORS_ORIGIN para restringir a Vercel

---

## Comandos Render (referencia)
Build:
- pnpm install --no-frozen-lockfile && pnpm build

Start:
- pnpm start
