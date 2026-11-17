begin;
-- Bucket exclusivo para novas fotos; preserva os arquivos e permissões do legado.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-media','product-media',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy product_media_staff_insert on storage.objects for insert to authenticated
with check (
  bucket_id='product-media' and (storage.foldername(name))[1]=(select auth.uid())::text
  and (select auth.jwt()->>'aal')='aal2'
  and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor'))
);
commit;
