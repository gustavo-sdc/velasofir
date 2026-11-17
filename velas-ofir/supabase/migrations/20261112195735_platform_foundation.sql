-- Fase 1: catálogo, turmas e administração. Não ativa vendas ou altera usuários.
-- Antes de aplicar no projeto existente: inspecionar tabelas/políticas e revisar esta migração.
begin;

-- Não inventar preço nem reconstruir IDs caso a tabela antiga tenha outro formato.
do $$ begin
  if to_regclass('public.products') is not null and (
    not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='id') or
    not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='name') or
    not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='price') or
    not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='id' and (column_default is not null or is_identity = 'YES'))
  ) then
    raise exception 'A tabela products existente não tem id, name e price. Revise o esquema antes de aplicar a migration.';
  end if;
end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), name text not null,
  collection text not null default '', description text not null default '',
  queima text not null default '', tamanho text not null default '',
  materia_prima text not null default '', price numeric(12,2) not null default 0,
  status text not null default 'disponivel', image text not null default '',
  kind text not null default 'produto', highlight boolean not null default false,
  badge text not null default '', "order" integer not null default 0
);
-- A tabela products já existia na versão anterior do site. Completar apenas
-- campos ausentes preserva as linhas e os valores que já estão no catálogo.
alter table public.products add column if not exists name text not null default '';
alter table public.products add column if not exists collection text not null default '';
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists queima text not null default '';
alter table public.products add column if not exists tamanho text not null default '';
alter table public.products add column if not exists materia_prima text not null default '';
alter table public.products add column if not exists status text not null default 'disponivel';
alter table public.products add column if not exists image text not null default '';
alter table public.products add column if not exists kind text not null default 'produto';
alter table public.products add column if not exists highlight boolean not null default false;
alter table public.products add column if not exists badge text not null default '';
alter table public.products add column if not exists "order" integer not null default 0;
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists stock_quantity integer check (stock_quantity >= 0);
alter table public.products add column if not exists accepts_orders boolean not null default false;
alter table public.products add column if not exists production_days integer check (production_days between 1 and 365);
alter table public.products add column if not exists published boolean not null default true;
-- Estoque antigo permanece NULL até conferência; não inventar quantidades na migração.
do $$ begin
  if exists (select 1 from public.products where slug is not null and slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$') then
    raise exception 'products contém slug inválido; corrija os dados antes de aplicar.';
  end if;
  if exists (select 1 from public.products where slug is not null group by slug having count(*) > 1) then
    raise exception 'products contém slugs duplicados; corrija os dados antes de aplicar.';
  end if;
end $$;
create unique index if not exists products_slug_unique on public.products(slug) where slug is not null;

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','support','editor','checkin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null, description text not null,
  starts_at timestamptz not null, location text not null,
  price_cents integer not null check (price_cents > 0),
  capacity integer not null check (capacity between 1 and 1000),
  includes text[] not null default '{}', program text[] not null default '{}',
  image text not null default '', published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint workshops_slug_format_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create index if not exists workshops_published_date on public.workshops(starts_at) where published;
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid, entity text not null, record_id text not null,
  action text not null, created_at timestamptz not null default now()
);

-- Verificar os dados atuais antes de instalar checks novos. Nenhuma linha é apagada.
do $$ begin
  if exists (select 1 from public.staff_members where role not in ('owner','admin','support','editor','checkin') or role is null) then
    raise exception 'staff_members contém role fora da lista Ofir; corrija os dados antes de aplicar.';
  end if;
  if exists (select 1 from public.products where stock_quantity < 0 or production_days < 1 or production_days > 365) then
    raise exception 'products contém estoque ou prazo inválido; corrija os dados antes de aplicar.';
  end if;
  if exists (select 1 from public.workshops where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or price_cents <= 0 or capacity not between 1 and 1000) then
    raise exception 'workshops contém slug, preço ou capacidade inválidos; corrija os dados antes de aplicar.';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.staff_members'::regclass and conname='staff_members_role_check') then
    alter table public.staff_members add constraint staff_members_role_check check (role in ('owner','admin','support','editor','checkin'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.products'::regclass and conname='products_stock_quantity_check') then
    alter table public.products add constraint products_stock_quantity_check check (stock_quantity >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.products'::regclass and conname='products_production_days_check') then
    alter table public.products add constraint products_production_days_check check (production_days between 1 and 365);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.workshops'::regclass and conname='workshops_slug_format_check') then
    alter table public.workshops add constraint workshops_slug_format_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.workshops'::regclass and conname='workshops_price_cents_check') then
    alter table public.workshops add constraint workshops_price_cents_check check (price_cents > 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.workshops'::regclass and conname='workshops_capacity_check') then
    alter table public.workshops add constraint workshops_capacity_check check (capacity between 1 and 1000);
  end if;
end $$;

alter table public.products enable row level security;
alter table public.staff_members enable row level security;
alter table public.workshops enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.products, public.staff_members, public.workshops, public.audit_log from anon, authenticated;
grant select on public.products, public.workshops to anon, authenticated;
grant select on public.staff_members, public.audit_log to authenticated;
grant insert, update, delete on public.products, public.workshops to authenticated;
-- Gestão dos membros é exclusiva do backend confiável/painel SQL, nunca do cliente.
grant all on public.products, public.staff_members, public.workshops, public.audit_log to service_role;

-- As policies antigas das tabelas geridas são substituídas para evitar permissões
-- permissivas combinadas por OR. Nenhuma outra tabela ou bucket é alterado.
do $$ declare policy_row record; begin
  for policy_row in
    select tablename, policyname from pg_policies
    where schemaname='public'
      and tablename::text = any(array['products','staff_members','workshops','audit_log'])
  loop
    execute format('drop policy %I on public.%I', policy_row.policyname, policy_row.tablename);
  end loop;
end $$;

create policy staff_read_self on public.staff_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy products_public_read on public.products for select to anon using (published);
create policy products_read on public.products for select to authenticated
  using (published or ((select auth.jwt()->>'aal')='aal2' and exists (
    select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor')
  )));
create policy products_staff_write on public.products for all to authenticated
  using ((select auth.jwt()->>'aal')='aal2' and exists (
    select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor')
  ))
  with check ((select auth.jwt()->>'aal')='aal2' and exists (
    select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor')
  ));
create policy workshops_public_read on public.workshops for select to anon using (published);
create policy workshops_read on public.workshops for select to authenticated
  using (published or ((select auth.jwt()->>'aal')='aal2' and exists (
    select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor')
  )));
create policy workshops_staff_write on public.workshops for all to authenticated
  using ((select auth.jwt()->>'aal')='aal2' and exists (
    select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor')
  ))
  with check ((select auth.jwt()->>'aal')='aal2' and exists (
    select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor')
  ));
create policy audit_owner_read on public.audit_log for select to authenticated
  using ((select auth.jwt()->>'aal')='aal2' and exists (
    select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin')
  ));

create schema if not exists ofir_private;
revoke all on schema ofir_private from public, anon, authenticated;
-- SECURITY DEFINER restrito a um trigger, para gravar auditoria sem dar INSERT no log à equipe.
create or replace function ofir_private.audit_catalog() returns trigger
language plpgsql security definer set search_path = '' as $$
declare row_id text;
begin
  if tg_table_name='staff_members' then row_id=coalesce(new.user_id,old.user_id)::text;
  else row_id=coalesce(new.id,old.id)::text; end if;
  insert into public.audit_log(actor_id,entity,record_id,action) values (auth.uid(),tg_table_name,row_id,tg_op);
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function ofir_private.audit_catalog() from public, anon, authenticated;
drop trigger if exists audit_products on public.products;
drop trigger if exists audit_workshops on public.workshops;
drop trigger if exists audit_staff on public.staff_members;
create trigger audit_products after insert or update or delete on public.products for each row execute function ofir_private.audit_catalog();
create trigger audit_workshops after insert or update or delete on public.workshops for each row execute function ofir_private.audit_catalog();
create trigger audit_staff after insert or update or delete on public.staff_members for each row execute function ofir_private.audit_catalog();
commit;
