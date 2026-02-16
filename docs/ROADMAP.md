# ssservicios-selfcare-demo — Roadmap de Modernización (para Dirección)

Objetivo: transformar la app de “consulta/pago” en un **canal de autogestión y compras** (self-care + upsell) con trazabilidad, scoring y procesos automatizados.

Cliente demo:
- 66489 (Javier Mosca)

Stack demo:
- Frontend: Vercel
- API/Middleware: Render
- DB: Neon (PostgreSQL)
- Core: Anatod / Aria

---

## Principios (UX + negocio)
1) **Impacto comercial directo** cuando es seguro (Opción A):
   - Impacta + genera orden + tracking
   - Ticket solo si falla o requiere intervención
2) **Trazabilidad**: todo evento relevante queda registrado (order_events)
3) **Idempotencia / anti-duplicados**: protección ante refresh/reintentos
4) **Cupo controlado**:
   - Cupo oficial (Anatod)
   - Cupo “reservado” (Neon) para evitar sobreventa en concurrencia
5) **Resiliencia**:
   - Reconciliación de estados si algo queda “a mitad”

---

## Estado actual (Hoy)
✅ Implementado en demo:
- Perfil + cupo oficial (Anatod) y cálculo de cupo disponible descontando reservas (Neon)
- Órdenes y eventos en DB (Neon)
- Reservas (ACTIVE / CONSUMED / RELEASED)
- Compra financiada (flujo real):
  - Validación de cupo
  - Reserva de cupo
  - Creación de adicional (3 meses) en core
  - Cierre de orden (APLICADO) + consumo de reserva

Pendiente en demo:
- Upgrade de internet (conexiones + planes + impacto)
- Packs / beneficios (catálogo + compra)
- Notificaciones / comunicaciones
- Login real (hoy es clientId fijo para demo)

---

## Etapas del Roadmap

### Etapa 1 — Base de autogestión “seria” (2–3 semanas)
- Login real (DNI + validación / token)
- Perfil completo (datos cliente, estado de cuenta, servicios activos)
- Centro de mensajes/notificaciones (comunicaciones relevantes)
- Historial y tracking unificado (órdenes/tickets/eventos)

**Output para Dirección**: app deja de ser “visor de factura” y pasa a “panel de control del cliente”.

---

### Etapa 2 — Compras y adicionales con scoring (3–5 semanas)
- Catálogo de “packs”/adicionales (router, mesh, IP fija, etc.)
- Compra financiada contra cupo:
  - Validación cupo
  - Reserva cupo
  - Creación adicional en core
  - Tracking de estado
- Política de riesgos:
  - clientes con cupo=0 -> solo pagos/consultas
  - límites por producto / por mes (reglas configurables)

**Output para Dirección**: canal de ventas autoservicio con control de riesgo.

---

### Etapa 3 — Upgrades de Internet (3–6 semanas)
Objetivo: permitir al cliente mejorar su plan sin fricción.

Pasos funcionales:
1) Listar conexiones/servicios activos (identificar conexionId / plan actual)
2) Listar planes disponibles (y elegibles según tecnología/segmento)
3) Simulación: mostrar precio/diferencia y confirmar
4) Ejecutar upgrade (impacto comercial directo)
5) Tracking:
   - APLICADO / EN_PROCESO / FALLIDO
   - Ticket automático solo en fallo

**Decisión UX (aprobada)**:
- Opción A: impacta “comercial” + tracking, ticket solo si falla.

---

### Etapa 4 — Beneficios y fidelización (2–4 semanas)
- Beneficios por antigüedad / scoring / packs activos
- Gamificación liviana (sin humo): “desbloqueás X por buen pagador”
- Ofertas segmentadas (cross-sell)

---

### Etapa 5 — Operación + soporte asistido (2–4 semanas)
- Botón “Necesito ayuda” con contexto (adjunta serviceId/orden)
- Autodiagnóstico básico (estado servicio, reinicio, chequeos)
- Derivación a soporte con prioridad por cliente/scoring

---

## Riesgos y mitigaciones
- Duplicados por reintentos: idempotency-key + reservas
- Inconsistencias: endpoint de reconciliación (demo) / job programado (prod)
- Dependencia core: fallback a ticket si impacto falla
- Seguridad: API keys solo en backend, nunca en frontend

---

## KPI / Impacto esperado
- Reducción de tickets por autogestión
- Incremento de ARPU (upgrades + packs)
- Menos fricción en ventas (checkout directo)
- Mejor experiencia: tracking + transparencia
