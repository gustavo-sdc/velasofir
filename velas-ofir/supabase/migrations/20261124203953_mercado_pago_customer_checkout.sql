begin;

create table public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) between 0 and 160),
  birth_date date,
  postal_code text not null default '',
  street text not null default '',
  address_number text not null default '',
  address_complement text not null default '',
  neighborhood text not null default '',
  city text not null default '',
  state text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.customer_profiles enable row level security;
grant select, insert, update on public.customer_profiles to authenticated;
create policy customer_profiles_read_self on public.customer_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy customer_profiles_insert_self on public.customer_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy customer_profiles_update_self on public.customer_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.ofir_create_customer_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_birth_date date;
begin
  begin
    v_birth_date := nullif(new.raw_user_meta_data->>'birth_date', '')::date;
  exception when others then
    v_birth_date := null;
  end;
  insert into public.customer_profiles(user_id, full_name, birth_date, postal_code, street, address_number, address_complement, neighborhood, city, state)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 160),
    v_birth_date,
    left(coalesce(new.raw_user_meta_data->>'postal_code', ''), 12),
    left(coalesce(new.raw_user_meta_data->>'street', ''), 180),
    left(coalesce(new.raw_user_meta_data->>'address_number', ''), 30),
    left(coalesce(new.raw_user_meta_data->>'address_complement', ''), 100),
    left(coalesce(new.raw_user_meta_data->>'neighborhood', ''), 100),
    left(coalesce(new.raw_user_meta_data->>'city', ''), 100),
    left(coalesce(new.raw_user_meta_data->>'state', ''), 2)
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.ofir_create_customer_profile() from public, anon, authenticated;
drop trigger if exists ofir_auth_customer_profile on auth.users;
create trigger ofir_auth_customer_profile after insert on auth.users
  for each row execute function public.ofir_create_customer_profile();

create table public.customer_cart (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 30),
  updated_at timestamptz not null default now()
);
alter table public.customer_cart enable row level security;
grant select, insert, update, delete on public.customer_cart to authenticated;
create policy customer_cart_self on public.customer_cart
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id),
  customer_email text not null check (length(customer_email) between 3 and 254),
  customer_name text not null check (length(customer_name) between 2 and 160),
  delivery_address jsonb not null default '{}'::jsonb,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 30),
  subtotal_cents integer not null check (subtotal_cents > 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer generated always as (subtotal_cents + shipping_cents) stored,
  payment_status text not null default 'pending' check (payment_status in ('pending','approved','rejected','cancelled','refunded','review')),
  fulfillment_status text not null default 'awaiting_payment' check (fulfillment_status in ('awaiting_payment','payment_confirmed','preparing','shipped','delivered','cancelled')),
  mercado_pago_order_id text unique,
  mercado_pago_payment_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customer_orders_customer_created on public.customer_orders(customer_id, created_at desc);
alter table public.customer_orders enable row level security;
grant select on public.customer_orders to authenticated;
grant all on public.customer_orders to service_role;
create policy customer_orders_read_self on public.customer_orders
  for select to authenticated using ((select auth.uid()) = customer_id);
create policy customer_orders_staff_read on public.customer_orders
  for select to authenticated using (
    (select auth.jwt()->>'aal') = 'aal2' and exists (
      select 1 from public.staff_members m where m.user_id = (select auth.uid()) and m.active and m.role in ('owner','admin','support')
    )
  );

create table public.mercado_pago_events (
  id text primary key,
  event_type text not null,
  payment_id text,
  order_id uuid references public.customer_orders(id),
  outcome text not null default 'pending',
  received_at timestamptz not null default now()
);
alter table public.mercado_pago_events enable row level security;
revoke all on public.mercado_pago_events from anon, authenticated;
grant all on public.mercado_pago_events to service_role;

commit;
