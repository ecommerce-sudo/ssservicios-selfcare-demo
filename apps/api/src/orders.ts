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
