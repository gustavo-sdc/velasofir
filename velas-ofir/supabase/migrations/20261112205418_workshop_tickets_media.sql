begin;
alter table public.workshops add column if not exists images text[] not null default '{}';
alter table public.workshops add column if not exists ticket_types jsonb not null default '[]'::jsonb;
alter table public.workshops drop constraint if exists workshops_price_cents_check;
alter table public.workshops add constraint workshops_price_cents_check check (price_cents >= 0);
alter table public.workshops add constraint workshops_images_limit check (cardinality(images) <= 8);
alter table public.workshops add constraint workshops_ticket_types_array check (jsonb_typeof(ticket_types)='array' and jsonb_array_length(ticket_types) <= 20);
-- Preserve os valores e a capacidade já cadastrados, sem criar novas vagas.
update public.workshops set ticket_types=jsonb_build_array(jsonb_build_object(
  'name','Ingresso individual','description','','price_cents',price_cents,
  'quantity',capacity,'min_per_order',1,'max_per_order',1,'sales_start',null,'sales_end',null
)) where ticket_types='[]'::jsonb;
update public.workshops set images=array[image] where image<>'' and cardinality(images)=0;

-- Bucket exclusivo de material de divulgação. Não modifica o bucket de produtos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('workshop-media','workshop-media',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy workshop_media_staff_insert on storage.objects for insert to authenticated
with check (
  bucket_id='workshop-media' and (storage.foldername(name))[1]=(select auth.uid())::text
  and (select auth.jwt()->>'aal')='aal2'
  and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor'))
);
commit;
