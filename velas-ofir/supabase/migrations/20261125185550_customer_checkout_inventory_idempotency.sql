begin;

alter table public.customer_orders
  add column cart_fingerprint text,
  add column checkout_url text;

create unique index customer_orders_one_open_cart_checkout
  on public.customer_orders(customer_id, cart_fingerprint)
  where payment_status = 'pending' and cart_fingerprint is not null;

create table public.customer_order_inventory_reservations (
  order_id uuid not null references public.customer_orders(id) on delete cascade,
  line_index integer not null check (line_index >= 0),
  kind text not null check (kind in ('product', 'workshop')),
  catalog_id uuid not null,
  ticket_name text not null default '',
  quantity integer not null check (quantity between 1 and 20),
  reserved_at timestamptz not null default now(),
  released_at timestamptz,
  committed_at timestamptz,
  primary key (order_id, line_index)
);

alter table public.customer_order_inventory_reservations enable row level security;
revoke all on public.customer_order_inventory_reservations from anon, authenticated;
grant all on public.customer_order_inventory_reservations to service_role;

insert into public.customer_order_inventory_reservations
  (order_id, line_index, kind, catalog_id, ticket_name, quantity, committed_at)
select
  o.id,
  (item.ordinality - 1)::integer,
  item.value->>'kind',
  (item.value->>'catalog_id')::uuid,
  coalesce(item.value->>'ticket_name', ''),
  (item.value->>'quantity')::integer,
  case when o.payment_status = 'approved' then o.updated_at else null end
from public.customer_orders o
cross join lateral jsonb_array_elements(o.items) with ordinality as item(value, ordinality)
where o.payment_status in ('pending', 'approved', 'review')
  and o.fulfillment_status <> 'cancelled'
  and item.value->>'kind' in ('product', 'workshop')
  and item.value->>'catalog_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and item.value->>'quantity' ~ '^[1-9][0-9]*$'
  and (item.value->>'quantity')::integer between 1 and 20;

create function public.ofir_reserve_customer_order_inventory(p_order_id uuid, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_status text;
  v_item jsonb;
  v_kind text;
  v_catalog_id uuid;
  v_ticket_name text;
  v_quantity integer;
  v_line_index integer := 0;
  v_product record;
  v_workshop record;
  v_ticket jsonb;
  v_available integer;
  v_reserved integer;
  v_sales_start timestamptz;
  v_sales_end timestamptz;
begin
  select o.payment_status into v_order_status
  from public.customer_orders o
  where o.id = p_order_id
  for update;
  if not found or v_order_status <> 'pending' then
    raise exception 'Pedido não está disponível para reservar.';
  end if;

  if exists (
    select 1 from public.customer_order_inventory_reservations r
    where r.order_id = p_order_id
  ) then
    return;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'Itens do pedido inválidos.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_kind := v_item->>'kind';
    v_catalog_id := (v_item->>'catalog_id')::uuid;
    v_ticket_name := coalesce(v_item->>'ticket_name', '');
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity not between 1 and 20 then
      raise exception 'Quantidade inválida.';
    end if;

    if v_kind = 'product' then
      select p.stock_quantity, p.accepts_orders, p.published, p.kind
        into v_product
      from public.products p
      where p.id = v_catalog_id
      for update;
      if not found or v_product.published is distinct from true or v_product.kind = 'colecao' then
        raise exception 'Produto indisponível.';
      end if;

      if v_product.stock_quantity is not null and v_product.accepts_orders is not true then
        select coalesce(sum(r.quantity), 0)::integer into v_reserved
        from public.customer_order_inventory_reservations r
        where r.kind = 'product' and r.catalog_id = v_catalog_id and r.released_at is null;
        if v_product.stock_quantity - v_reserved < v_quantity then
          raise exception 'Estoque insuficiente para concluir a compra.';
        end if;
      end if;

      insert into public.customer_order_inventory_reservations
        (order_id, line_index, kind, catalog_id, ticket_name, quantity)
      values (p_order_id, v_line_index, 'product', v_catalog_id, '', v_quantity);
    elsif v_kind = 'workshop' then
      select w.ticket_types, w.capacity, w.starts_at, w.published
        into v_workshop
      from public.workshops w
      where w.id = v_catalog_id
      for update;
      if not found or v_workshop.published is distinct from true or v_workshop.starts_at <= now() then
        raise exception 'Workshop indisponível.';
      end if;

      select coalesce(sum(r.quantity), 0)::integer into v_reserved
      from public.customer_order_inventory_reservations r
      where r.kind = 'workshop' and r.catalog_id = v_catalog_id and r.released_at is null;
      if v_workshop.capacity - v_reserved < v_quantity then
        raise exception 'Não há vagas suficientes para esta quantidade.';
      end if;

      if jsonb_typeof(v_workshop.ticket_types) = 'array' and jsonb_array_length(v_workshop.ticket_types) > 0 then
        select t.value into v_ticket
        from jsonb_array_elements(v_workshop.ticket_types) t(value)
        where t.value->>'name' = v_ticket_name;
        if v_ticket is null then
          raise exception 'Tipo de ingresso indisponível.';
        end if;
        if v_quantity < coalesce((v_ticket->>'min_per_order')::integer, 1)
          or v_quantity > coalesce((v_ticket->>'max_per_order')::integer, 20) then
          raise exception 'Quantidade fora dos limites deste ingresso.';
        end if;
        v_available := coalesce((v_ticket->>'quantity')::integer, 0);
        select coalesce(sum(r.quantity), 0)::integer into v_reserved
        from public.customer_order_inventory_reservations r
        where r.kind = 'workshop' and r.catalog_id = v_catalog_id
          and r.ticket_name = v_ticket_name and r.released_at is null;
        if v_available - v_reserved < v_quantity then
          raise exception 'Não há ingressos suficientes deste tipo.';
        end if;
        v_sales_start := nullif(v_ticket->>'sales_start', '')::timestamptz;
        v_sales_end := nullif(v_ticket->>'sales_end', '')::timestamptz;
        if (v_sales_start is not null and v_sales_start > now())
          or (v_sales_end is not null and v_sales_end < now()) then
          raise exception 'Período de vendas deste ingresso encerrado.';
        end if;
      elsif v_ticket_name <> 'Ingresso individual' then
        raise exception 'Tipo de ingresso indisponível.';
      end if;

      insert into public.customer_order_inventory_reservations
        (order_id, line_index, kind, catalog_id, ticket_name, quantity)
      values (p_order_id, v_line_index, 'workshop', v_catalog_id, v_ticket_name, v_quantity);
    else
      raise exception 'Tipo de item inválido.';
    end if;
    v_line_index := v_line_index + 1;
  end loop;
end;
$$;

create function public.ofir_release_customer_order_inventory(p_order_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.customer_order_inventory_reservations
  set released_at = now()
  where order_id = p_order_id and released_at is null and committed_at is null;
$$;

create function public.ofir_commit_customer_order_inventory(p_order_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_has_reservations boolean;
begin
  select exists (
    select 1 from public.customer_order_inventory_reservations r
    where r.order_id = p_order_id and r.released_at is null
  ) into v_has_reservations;
  if v_has_reservations then
    update public.customer_order_inventory_reservations
    set committed_at = coalesce(committed_at, now())
    where order_id = p_order_id and released_at is null;
  end if;
  return v_has_reservations;
end;
$$;

create function public.ofir_apply_mercado_pago_order_state(
  p_order_id uuid,
  p_payment_status text,
  p_fulfillment_status text,
  p_payment_id text,
  p_inventory_action text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current_status text;
  v_has_reservation boolean;
begin
  if p_payment_status not in ('pending', 'approved', 'rejected', 'cancelled', 'review')
    or p_fulfillment_status not in ('awaiting_payment', 'payment_confirmed', 'cancelled')
    or p_inventory_action not in ('none', 'commit', 'release') then
    raise exception 'Estado de pagamento inválido.';
  end if;

  select o.payment_status into v_current_status
  from public.customer_orders o
  where o.id = p_order_id
  for update;
  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_current_status = 'approved' then
    return 'terminal_ignored';
  end if;
  if v_current_status in ('cancelled', 'rejected')
    and p_payment_status not in ('approved', 'review') then
    return 'terminal_ignored';
  end if;

  if p_inventory_action = 'commit' then
    select exists (
      select 1 from public.customer_order_inventory_reservations r
      where r.order_id = p_order_id and r.released_at is null
    ) into v_has_reservation;
    if not v_has_reservation then
      update public.customer_orders
      set payment_status = 'review', fulfillment_status = 'awaiting_payment',
          mercado_pago_payment_id = nullif(p_payment_id, ''), updated_at = now()
      where id = p_order_id;
      return 'reservation_missing';
    end if;
    update public.customer_order_inventory_reservations
    set committed_at = coalesce(committed_at, now())
    where order_id = p_order_id and released_at is null;
  elsif p_inventory_action = 'release' then
    update public.customer_order_inventory_reservations
    set released_at = now()
    where order_id = p_order_id and released_at is null and committed_at is null;
  end if;

  update public.customer_orders
  set payment_status = p_payment_status,
      fulfillment_status = p_fulfillment_status,
      mercado_pago_payment_id = nullif(p_payment_id, ''),
      updated_at = now()
  where id = p_order_id;
  return 'updated';
end;
$$;

revoke all on function public.ofir_reserve_customer_order_inventory(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.ofir_release_customer_order_inventory(uuid) from public, anon, authenticated;
revoke all on function public.ofir_commit_customer_order_inventory(uuid) from public, anon, authenticated;
revoke all on function public.ofir_apply_mercado_pago_order_state(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.ofir_reserve_customer_order_inventory(uuid, jsonb) to service_role;
grant execute on function public.ofir_release_customer_order_inventory(uuid) to service_role;
grant execute on function public.ofir_commit_customer_order_inventory(uuid) to service_role;
grant execute on function public.ofir_apply_mercado_pago_order_state(uuid, text, text, text, text) to service_role;

commit;
