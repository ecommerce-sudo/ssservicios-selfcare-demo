import { pool } from "./db.js";

export type ReservationStatus = "ACTIVE" | "RELEASED" | "CONSUMED";

export type ReservationRow = {
  id: string;
  client_id: number;
  order_id: string | null;
  amount: string; // pg devuelve numeric como string
  status: ReservationStatus;
  created_at: string;
};

export async function sumActiveReservations(clientId: number): Promise<number> {
  const { rows } = await pool.query<{ total: string | null }>(
    `
    select coalesce(sum(amount), 0) as total
    from credit_reservations
    where client_id = $1 and status = 'ACTIVE'
    `,
    [clientId]
  );

  const raw = rows[0]?.total ?? "0";
  const n = Number(String(raw));
  return Number.isFinite(n) ? n : 0;
}

export async function createReservation(input: {
  id: string;
  clientId: number;
  orderId?: string | null;
  amount: number;
  status?: ReservationStatus;
}): Promise<ReservationRow> {
  const status = input.status ?? "ACTIVE";

  const { rows } = await pool.query<ReservationRow>(
    `
    insert into credit_reservations (id, client_id, order_id, amount, status)
    values ($1,$2,$3,$4,$5)
    returning id, client_id, order_id, amount, status, created_at
    `,
    [input.id, input.clientId, input.orderId ?? null, input.amount, status]
  );

  return rows[0]!;
}
export async function setReservationStatus(id: string, status: ReservationStatus) {
  const { rows } = await pool.query<ReservationRow>(
    `
    update credit_reservations
    set status = $2
    where id = $1
    returning id, client_id, order_id, amount, status, created_at
    `,
    [id, status]
  );

  return rows[0] ?? null;
}
