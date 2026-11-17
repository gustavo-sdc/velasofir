-- Execute no SQL Editor do projeto VelasOfir antes da migration.
-- São consultas somente de leitura; confira também o Project Ref mostrado no Dashboard.

select current_database() as database_name,
       current_user as database_role,
       current_setting('server_version') as postgres_version;

select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('products', 'staff_members', 'workshops', 'audit_log', 'access_control', 'user', 'client', 'shop', 'buy_history', 'payment_history')
order by table_name, ordinal_position;

select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced,
       p.policyname, p.cmd, p.roles, p.qual, p.with_check
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in ('products', 'staff_members', 'workshops', 'audit_log', 'access_control', 'user', 'client', 'shop', 'buy_history', 'payment_history')
order by c.relname, p.policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'public')
  and table_name in ('products', 'staff_members', 'workshops', 'audit_log', 'access_control', 'user', 'client', 'shop', 'buy_history', 'payment_history')
order by table_name, grantee, privilege_type;

select n.nspname as function_schema,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig as function_settings,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'is_staff'
order by n.nspname, p.oid;

