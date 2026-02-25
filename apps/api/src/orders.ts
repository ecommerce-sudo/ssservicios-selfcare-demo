// apps/api/src/orders.ts
import { pool } from "./db.js";

export type OrderStatus = "PENDIENTE" | "APLICADO" | "EN_PROCESO" | "FALLIDO";

export type OrderRow = {
  id: string;
  client_id: number;
  type: string;
  status: OrderStatus;
  conexion_id: number | null;
  previous_plan_id: number | null;
  target_plan_id: number | null;
  ticket_id: number | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
};

export async function listOrdersByClient(clientId: number): Promise<OrderRow[]> {
  const { rows } = await pool.query<OrderRow>(
    `
    select
      id, client_id, type, status, conexion_id, previous_plan_id, target_plan_id,
      ticket_id, idempotency_key, created_at, updated_at
    from orders
    where client_id = $1
    order by created_at desc
    limit 50
    `,
    [clientId]
  );
  return rows;
}

/**
 * ✅ NUEVO: idempotencia por client_id + idempotency_key (+ opcional type)
 * Si existe, devolvemos la orden ya creada (evita doble click / retry).
 */
export async function findOrderByIdempotencyKey(input: {
  clientId: number;
  idempotencyKey: string;
  type?: string;
}): Promise<OrderRow | null> {
  const key = String(input.idempotencyKey ?? "").trim();
  if (!key) return null;

  const params: any[] = [input.clientId, key];
  const typeFilter = input.type ? "and type = $3" : "";
  if (input.type) params.push(input.type);

  const { rows } = await pool.query<OrderRow>(
    `
    select
      id, client_id, type, status, conexion_id, previous_plan_id, target_plan_id,
      ticket_id, idempotency_key, created_at, updated_at
    from orders
    where client_id = $1
      and idempotency_key = $2
      ${typeFilter}
    order by created_at desc
    limit 1
    `,
    params
  );

  return rows[0] ?? null;
}

export async function createOrder(input: {
  id: string;
  clientId: number;
  type: string;
  status: OrderStatus;
  conexionId?: number | null;
  previousPlanId?: number | null;
  targetPlanId?: number | null;
  idempotencyKey?: string | null;
}): Promise<OrderRow> {
  const { rows } = await pool.query<OrderRow>(
    `
    insert into orders (
      id, client_id, type, status, conexion_id, previous_plan_id, target_plan_id, idempotency_key
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8)
    returning
      id, client_id, type, status, conexion_id, previous_plan_id, target_plan_id,
      ticket_id, idempotency_key, created_at, updated_at
    `,
    [
      input.id,
      input.clientId,
      input.type,
      input.status,
      input.conexionId ?? null,
      input.previousPlanId ?? null,
      input.targetPlanId ?? null,
      input.idempotencyKey ?? null,
    ]
  );
  return rows[0]!;
}

export async function addOrderEvent(orderId: string, eventType: string, payload: unknown = null) {
  await pool.query(
    `
    insert into order_events (order_id, event_type, payload)
    values ($1,$2,$3)
    `,
    [orderId, eventType, payload]
  );
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<OrderRow | null> {
  const { rows } = await pool.query<OrderRow>(
    `
    update orders
    set status = $2, updated_at = now()
    where id = $1
    returning
      id, client_id, type, status, conexion_id, previous_plan_id, target_plan_id,
      ticket_id, idempotency_key, created_at, updated_at
    `,
    [orderId, status]
  );

  return rows[0] ?? null;
}

export type OrderEventRow = {
  order_id: string;
  event_type: string;
  payload: any;
  created_at: string;
};

export async function listPendingBuyFinancedByClient(clientId: number): Promise<OrderRow[]> {
  const { rows } = await pool.query<OrderRow>(
    `
    select
      id, client_id, type, status, conexion_id, previous_plan_id, target_plan_id,
      ticket_id, idempotency_key, created_at, updated_at
    from orders
    where client_id = $1
      and type = 'BUY_FINANCED'
      and status = 'PENDIENTE'
    order by created_at desc
    limit 50
    `,
    [clientId]
  );
  return rows;
}

/**
 * NUEVO: trae BUY_FINANCED por múltiples estados (PENDIENTE, EN_PROCESO, etc.)
 */
export async function listBuyFinancedByClientByStatuses(
  clientId: number,
  statuses: OrderStatus[]
): Promise<OrderRow[]> {
  const { rows } = await pool.query<OrderRow>(
    `
    select
      id, client_id, type, status, conexion_id, previous_plan_id, target_plan_id,
      ticket_id, idempotency_key, created_at, updated_at
    from orders
    where client_id = $1
      and type = 'BUY_FINANCED'
      and status = any($2::text[])
    order by created_at desc
    limit 50
    `,
    [clientId, statuses]
  );
  return rows;
}

export async function listOrderEvents(orderId: string): Promise<OrderEventRow[]> {
  const { rows } = await pool.query<OrderEventRow>(
    `
    select order_id, event_type, payload, created_at
    from order_events
    where order_id = $1
    order by created_at asc
    `,
    [orderId]
  );
  return rows;
}
