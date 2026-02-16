# ssservicios-selfcare-demo — Endpoints (API)

Base URL (Render):
- https://ssservicios-selfcare-demo.onrender.com

Cliente demo:
- clientId = 66489 (Javier Mosca)

## 1) Healthcheck

### GET /health
Uso: monitoreo y verificación de servicio.

Ejemplo:
- /health

Respuesta esperada:
- ok: true
- service: ssservicios-selfcare-demo-api
- ts: ISO timestamp

---

## 2) Perfil + cupo disponible (Anatod + reservas Neon)

### GET /v1/me
Devuelve el cupo financiable oficial (Anatod) y el cupo reservado (Neon), calculando el disponible final.

Reglas:
- purchaseAvailableOfficial = clienteScoringFinanciable (Anatod)
- purchaseAvailableReserved = suma de reservas ACTIVE (Neon)
- purchaseAvailable = max(official - reserved, 0)

Ejemplo:
- /v1/me

Respuesta (ejemplo):
{
  "clientId": 66489,
  "name": "Javier Mosca",
  "purchaseAvailableOfficial": 700000,
  "purchaseAvailableReserved": 0,
  "purchaseAvailable": 700000,
  "currency": "ARS",
  "source": "anatod:/cliente/{id}"
}

---

## 3) Órdenes (Neon)

### GET /v1/me/orders
Lista últimas órdenes del cliente (máx 50), ordenadas por created_at desc.

Ejemplo:
- /v1/me/orders

Campos clave:
- type: BUY_FINANCED | UPGRADE_INTERNET (por ahora)
- status: PENDIENTE | APLICADO | EN_PROCESO | FALLIDO

---

## 4) Reservas (Neon)

### GET /v1/me/reservations
Lista últimas reservas del cliente (máx 50), ordenadas por created_at desc.

Estados:
- ACTIVE: reserva vigente (descuenta cupo)
- CONSUMED: reserva consumida (no descuenta cupo, ya aplicada)
- RELEASED: reserva liberada (rollback/demo; no descuenta cupo)

Ejemplo:
- /v1/me/reservations

---

## 5) Compra financiada (demo real)

### GET /v1/me/purchase/financed?amount=NUM&desc=TXT

Flujo:
1) Lee cupo oficial (Anatod) + reservas activas (Neon)
2) Valida que amount <= disponible
3) Crea order (Neon) type=BUY_FINANCED status=PENDIENTE
4) Crea reservation (Neon) por el total status=ACTIVE
5) Crea adicional real (Anatod) por 3 meses (cuota = total/3)
6) Si adicional OK:
   - Marca reserva CONSUMED
   - Marca orden APLICADO
7) Si adicional falla:
   - Deja reserva ACTIVE
   - Marca orden EN_PROCESO

Parámetros:
- amount (obligatorio): importe total de compra (ej: 120000)
- desc (opcional): descripción para el adicional (texto)

Ejemplos:
- /v1/me/purchase/financed?amount=50000&desc=Compra%20Demo%20Router
- /v1/me/purchase/financed?amount=120000&desc=Compra%20Demo%20Pack%20X

Errores típicos:
- 400 INVALID_AMOUNT
- 409 INSUFFICIENT_CREDIT (devuelve official/reserved/available/requested)
- 502 ADICIONAL_FAILED (deja orden EN_PROCESO)

---

## 6) Endpoints demo (útiles para pruebas)

### GET /v1/me/reservations/demo-add?amount=NUM
Crea una reserva ACTIVE manual (solo demo).

### GET /v1/me/reservations/demo-release?id=RES_ID
Libera una reserva (pasa a RELEASED).

### GET /v1/me/orders/demo-create
Crea una order demo (type=UPGRADE_INTERNET) en PENDIENTE.
