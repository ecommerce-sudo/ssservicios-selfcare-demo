-- apps/api/migrations/001_orders_idempotency.sql
-- Objetivo: evitar duplicados por doble click/retry.
-- Unicidad por cliente + idempotency_key (solo cuando no es null).

-- 1) Chequeo previo: ver duplicados (si devuelve filas, hay que resolver antes)
-- select client_id, idempotency_key, count(*)
-- from orders
-- where idempotency_key is not null
-- group by client_id, idempotency_key
-- having count(*) > 1;

-- 2) Crear índice único parcial
create unique index if not exists orders_client_id_idempotency_key_uq
on orders (client_id, idempotency_key)
where idempotency_key is not null;
