# Demo Script — ssservicios-selfcare-demo (2–3 min)

Objetivo: mostrar que la app puede pasar de “consulta/pago” a **canal de autogestión + compras** con scoring, trazabilidad y procesos recuperables.

Base URL (API):
- https://ssservicios-selfcare-demo.onrender.com

Cliente demo:
- 66489 (Javier Mosca)

---

## 0) Mensaje inicial (10s)
“Hoy la app es principalmente consulta y pago. El potencial real es convertirla en un canal de gestión y ventas: upgrades, packs, beneficios, y compras contra cupo, con tracking y control de riesgo.”

---

## 1) Mostrar Cupo y Disponibilidad (20s)
Abrir:
- /v1/me

Qué remarcar:
- cupo oficial viene del core (Anatod/Aria)
- el middleware descuenta reservas para evitar sobreventa
- este es el habilitador de “compras contra factura / financiadas”

---

## 2) Mostrar el historial de Órdenes (20s)
Abrir:
- /v1/me/orders

Qué remarcar:
- cada interacción genera una orden con estado (PENDIENTE/APLICADO/EN_PROCESO)
- esto habilita tracking estilo e-commerce y reduce incertidumbre del cliente

---

## 3) Mostrar Reservas (15s)
Abrir:
- /v1/me/reservations

Qué remarcar:
- ACTIVE descuenta cupo
- CONSUMED significa “ya aplicado”
- RELEASED permite rollback en caso de fallos o cancelación

---

## 4) Disparar una compra financiada (40s)
Abrir (ejemplo):
- /v1/me/purchase/financed?amount=50000&desc=Compra%20Demo%20Router

Qué remarcar:
- valida cupo disponible
- reserva cupo (anti-duplicados, anti-concurrencia)
- crea adicional real en core en 3 cuotas
- cierra la orden en APLICADO

Luego volver a abrir:
- /v1/me
y remarcar que el cupo se mantiene consistente (sin “fantasmas”).

---

## 5) Cierre ejecutivo (20–30s)
“Esto prueba el patrón para todo lo que viene: upgrades de internet, packs y beneficios. La app deja de ser ‘visor de factura’ y pasa a ser canal de autogestión y crecimiento, con riesgo controlado y trazabilidad.”

---

## Próxima etapa inmediata (para mostrar roadmap)
- Conexiones activas de internet (serviceId/conexionId)
- Planes disponibles
- Upgrade con impacto comercial directo + tracking
- Ticket solo si falla
