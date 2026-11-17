begin;
create table public.commerce_orders (
  id uuid primary key,
  created_by uuid not null references auth.users(id),
  environment text not null check(environment in ('sandbox','production')),
  customer_name text not null check(length(customer_name) between 2 and 160),
  customer_email text not null check(length(customer_email) between 3 and 254),
  kind text not null check(kind in ('product','workshop')),
  catalog_id uuid not null,
  item_name text not null,
  ticket_name text not null default '',
  quantity integer not null check(quantity between 1 and 20),
  unit_cents integer not null check(unit_cents between 1 and 10000000),
  shipping_cents integer not null default 0 check(shipping_cents between 0 and 1000000),
  total_cents integer generated always as (quantity*unit_cents+shipping_cents) stored,
  delivery_description text not null default '' check(length(delivery_description)<=1000),
  production_days integer not null default 0,
  ready_quantity integer not null default 0 check(ready_quantity>=0 and ready_quantity<=quantity),
  reservation_active boolean not null default true,
  status text not null default 'reserved' check(status in ('reserved','creating','pending','cancel_requested','paid','canceled','expired','failed','review')),
  checkout_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index commerce_orders_workshop_reservations on public.commerce_orders(catalog_id,ticket_name) where kind='workshop' and reservation_active;
alter table public.commerce_orders enable row level security;
revoke all on public.commerce_orders from anon,authenticated;
grant select on public.commerce_orders to authenticated;
grant all on public.commerce_orders to service_role;
create policy commerce_orders_staff_read on public.commerce_orders for select to authenticated using(
  (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin'))
);
create table public.asaas_events (
  id text primary key check(length(id) between 1 and 200),
  environment text not null check(environment in ('sandbox','production')),
  event_type text not null check(length(event_type)<=100),
  checkout_id text,
  order_id uuid references public.commerce_orders(id),
  outcome text not null default 'pending',
  received_at timestamptz not null default now()
);
alter table public.asaas_events enable row level security;
revoke all on public.asaas_events from anon,authenticated;
grant select on public.asaas_events to authenticated;
grant all on public.asaas_events to service_role;
create policy asaas_events_staff_read on public.asaas_events for select to authenticated using(
  (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin'))
);

-- RPCs transacionais somente para o backend confiável. Não usam SECURITY DEFINER.
create function public.ofir_reserve_order(p_id uuid,p_actor uuid,p_environment text,p_kind text,p_catalog uuid,p_ticket text,p_quantity integer,p_name text,p_email text,p_shipping integer,p_delivery text,p_expected_total integer)
returns public.commerce_orders language plpgsql security invoker set search_path='' as $$
declare o public.commerce_orders; p public.products; w public.workshops; t jsonb; stock integer; held integer; all_held integer; unit integer; item text; days integer:=0; ready integer:=0;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text,0));
  select * into o from public.commerce_orders where id=p_id;
  if found then
    if o.created_by<>p_actor or o.environment<>p_environment then raise exception 'Pedido indisponível.'; end if;
    return o;
  end if;
  if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('owner','admin')) then raise exception 'Sem autorização.'; end if;
  if p_quantity is null or p_quantity not between 1 and 20 or p_shipping is null or p_shipping<0 then raise exception 'Quantidade ou frete inválido.'; end if;
  if p_kind='product' then
    select * into p from public.products where id=p_catalog for update;
    if not found or not p.published or p.kind='colecao' then raise exception 'Produto indisponível.'; end if;
    if p.stock_quantity is null then raise exception 'Confira o estoque do produto antes de cobrar.'; end if;
    stock=p.stock_quantity;
    if p_environment='sandbox' then
      select greatest(0,stock-coalesce(sum(ready_quantity),0)) into stock from public.commerce_orders where environment='sandbox' and kind='product' and catalog_id=p_catalog and reservation_active;
    end if;
    ready=least(stock,p_quantity);
    if ready<p_quantity then
      if not p.accepts_orders or p.production_days is null then raise exception 'Estoque insuficiente ou prazo de encomenda não definido.'; end if;
      days=p.production_days;
    end if;
    if length(btrim(p_delivery))<10 then raise exception 'Informe endereço, modalidade, prazo e frete confirmados com a cliente.'; end if;
    unit=(p.price*100)::integer;
    if p.price*100<>unit or unit<=0 then raise exception 'Preço inválido.'; end if;
    item=left(p.name,160);
    if p_environment='production' then update public.products set stock_quantity=stock_quantity-ready where id=p_catalog; end if;
  elsif p_kind='workshop' then
    select * into w from public.workshops where id=p_catalog for update;
    if not found or not w.published or w.starts_at<=now() then raise exception 'Workshop indisponível.'; end if;
    select value into t from jsonb_array_elements(w.ticket_types) where value->>'name'=p_ticket;
    if t is null then raise exception 'Tipo de ingresso indisponível.'; end if;
    if p_quantity<(t->>'min_per_order')::integer or p_quantity>(t->>'max_per_order')::integer then raise exception 'Confira os limites de ingressos por pedido.'; end if;
    if nullif(t->>'sales_start','')::timestamptz>now() or nullif(t->>'sales_end','')::timestamptz<now() then raise exception 'Ingresso fora do período de disponibilidade.'; end if;
    select coalesce(sum(quantity),0),coalesce(sum(quantity) filter(where ticket_name=p_ticket),0) into all_held,held from public.commerce_orders where catalog_id=p_catalog and kind='workshop' and environment=p_environment and reservation_active;
    if all_held+p_quantity>w.capacity or held+p_quantity>(t->>'quantity')::integer then raise exception 'Vagas insuficientes.'; end if;
    if p_shipping<>0 then raise exception 'Workshop não tem frete.'; end if;
    unit=(t->>'price_cents')::integer;
    if unit<=0 then raise exception 'Inscrições gratuitas não geram checkout de pagamento.'; end if;
    item=left(w.title||' — '||p_ticket,160);
  else raise exception 'Tipo de pedido inválido.';
  end if;
  if p_expected_total is null or p_expected_total<>unit*p_quantity+p_shipping then raise exception 'O preço mudou. Atualize a prévia antes de cobrar.'; end if;
  insert into public.commerce_orders(id,created_by,environment,customer_name,customer_email,kind,catalog_id,item_name,ticket_name,quantity,unit_cents,shipping_cents,delivery_description,production_days,ready_quantity)
  values(p_id,p_actor,p_environment,p_name,p_email,p_kind,p_catalog,item,case when p_kind='workshop' then p_ticket else '' end,p_quantity,unit,p_shipping,p_delivery,days,ready) returning * into o;
  return o;
end $$;

create function public.ofir_claim_checkout(p_id uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
  update public.commerce_orders set status='creating',updated_at=now() where id=p_id and status='reserved';
  return found;
end $$;

create function public.ofir_close_unpaid_order(p_id uuid,p_status text) returns void language plpgsql security invoker set search_path='' as $$
declare o public.commerce_orders;
begin
  if p_status not in ('failed','expired','canceled') then raise exception 'Situação inválida.'; end if;
  select * into o from public.commerce_orders where id=p_id for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;
  if o.status in ('paid','review') then return; end if;
  if o.reservation_active and o.kind='product' and o.environment='production' then update public.products set stock_quantity=stock_quantity+o.ready_quantity where id=o.catalog_id; end if;
  update public.commerce_orders set status=p_status,reservation_active=false,updated_at=now() where id=p_id;
end $$;

create function public.ofir_attach_checkout(p_id uuid,p_checkout text) returns void language plpgsql security invoker set search_path='' as $$
declare o public.commerce_orders;
begin
  select * into o from public.commerce_orders where id=p_id for update;
  if not found or o.status='reserved' then raise exception 'Pedido não iniciado.'; end if;
  if o.checkout_id is not null and o.checkout_id<>p_checkout then raise exception 'Checkout divergente.'; end if;
  update public.commerce_orders set checkout_id=p_checkout,status=case when status='creating' then 'pending' else status end,updated_at=now() where id=p_id;
end $$;

create function public.ofir_process_asaas_event(p_event_id text,p_environment text,p_event text,p_checkout text,p_order uuid,p_amount integer)
returns text language plpgsql security invoker set search_path='' as $$
declare o public.commerce_orders; result text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_event_id,1));
  select outcome into result from public.asaas_events where id=p_event_id;
  if found and result not in ('unmatched','pending') then return result; end if;
  insert into public.asaas_events(id,environment,event_type,checkout_id) values(p_event_id,p_environment,p_event,p_checkout) on conflict(id) do nothing;
  select * into o from public.commerce_orders where environment=p_environment and (checkout_id=p_checkout or (id=p_order and checkout_id is null)) for update;
  if not found then
    update public.asaas_events set outcome='unmatched' where id=p_event_id;return 'unmatched';
  end if;
  if o.checkout_id is not null and o.checkout_id<>p_checkout then raise exception 'Checkout divergente.'; end if;
  if o.status='reserved' then raise exception 'Checkout ainda não foi iniciado.'; end if;
  perform public.ofir_attach_checkout(o.id,p_checkout);
  if p_event='CHECKOUT_PAID' then
    if o.status='paid' then result='already_paid';
    elsif p_amount is null or p_amount<>o.total_cents then
      update public.commerce_orders set status='review',updated_at=now() where id=o.id;result='amount_review';
    elsif not o.reservation_active then
      update public.commerce_orders set status='review',updated_at=now() where id=o.id;result='late_payment_review';
    elsif o.status='review' then result='manual_review';
    else update public.commerce_orders set status='paid',updated_at=now() where id=o.id;result='paid';end if;
  elsif p_event in ('CHECKOUT_CANCELED','CHECKOUT_EXPIRED') then
    perform public.ofir_close_unpaid_order(o.id,case when p_event='CHECKOUT_CANCELED' then 'canceled' else 'expired' end);result='closed';
  elsif p_event='CHECKOUT_CREATED' then result='linked';
  else result='unsupported';end if;
  update public.asaas_events set order_id=o.id,outcome=result where id=p_event_id;
  return result;
end $$;

revoke all on function public.ofir_reserve_order(uuid,uuid,text,text,uuid,text,integer,text,text,integer,text,integer) from public,anon,authenticated;
revoke all on function public.ofir_claim_checkout(uuid) from public,anon,authenticated;
revoke all on function public.ofir_close_unpaid_order(uuid,text) from public,anon,authenticated;
revoke all on function public.ofir_attach_checkout(uuid,text) from public,anon,authenticated;
revoke all on function public.ofir_process_asaas_event(text,text,text,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.ofir_reserve_order(uuid,uuid,text,text,uuid,text,integer,text,text,integer,text,integer) to service_role;
grant execute on function public.ofir_claim_checkout(uuid) to service_role;
grant execute on function public.ofir_close_unpaid_order(uuid,text) to service_role;
grant execute on function public.ofir_attach_checkout(uuid,text) to service_role;
grant execute on function public.ofir_process_asaas_event(text,text,text,text,uuid,integer) to service_role;
create trigger audit_commerce_orders after insert or update on public.commerce_orders for each row execute function ofir_private.audit_catalog();
commit;
