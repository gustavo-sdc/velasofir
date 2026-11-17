begin;
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 2 and 140),
  title text not null check(length(btrim(title)) between 3 and 180),
  excerpt text not null default '' check(length(excerpt)<=500),
  content text not null default '' check(length(content)<=60000),
  category text not null default 'Inspiração' check(length(btrim(category)) between 2 and 80),
  author_name text not null default 'Ofir Velas' check(length(btrim(author_name)) between 2 and 120),
  cover_image text not null default '' check(cover_image='' or cover_image like 'https://%'),
  cover_alt text not null default '' check(length(cover_alt)<=250),
  seo_title text not null default '' check(length(seo_title)<=120),
  seo_description text not null default '' check(length(seo_description)<=320),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_publication_complete check(not published or (published_at is not null and length(btrim(content))>=100 and length(btrim(excerpt))>=30 and (cover_image='' or length(btrim(cover_alt))>=3)))
);
create index blog_posts_publication_date on public.blog_posts(published_at desc) where published;
alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon,authenticated;
grant select on public.blog_posts to anon,authenticated;
grant insert,update on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
create policy blog_public_read on public.blog_posts for select to anon using(published and published_at<=now());
create policy blog_authenticated_read on public.blog_posts for select to authenticated using(
  (published and published_at<=now()) or ((select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor')))
);
create policy blog_staff_insert on public.blog_posts for insert to authenticated with check(
  (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor'))
);
create policy blog_staff_update on public.blog_posts for update to authenticated using(
  (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor'))
) with check(
  (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor'))
);
create function ofir_private.blog_timestamps() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='INSERT' then
    new.created_at=now();
    new.published_at=case when new.published then now() else null end;
  else
    if new.slug is distinct from old.slug then raise exception 'O endereço do artigo é permanente.'; end if;
    new.created_at=old.created_at;
    new.published_at=old.published_at;
    if new.published and not old.published and old.published_at is null then new.published_at=now(); end if;
  end if;
  new.updated_at=now();
  return new;
end $$;
revoke all on function ofir_private.blog_timestamps() from public,anon,authenticated;
create trigger blog_timestamps before insert or update on public.blog_posts for each row execute function ofir_private.blog_timestamps();
create trigger audit_blog after insert or update on public.blog_posts for each row execute function ofir_private.audit_catalog();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('blog-media','blog-media',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy blog_media_staff_insert on storage.objects for insert to authenticated with check(
  bucket_id='blog-media' and (storage.foldername(name))[1]=(select auth.uid())::text
  and (select auth.jwt()->>'aal')='aal2'
  and exists(select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin','editor'))
);
-- Os dois guias existentes serão importados abaixo, preservando seus endereços.
insert into public.blog_posts(slug,title,excerpt,category,content,published) values
('como-cuidar-da-sua-vela','Como cuidar da sua vela','Cuidados simples para usar sua vela artesanal com mais atenção e segurança.','Cuidados','## Comece pelas instruções da sua vela

Leia o rótulo e respeite os limites de uso indicados para o produto. Cada combinação de recipiente, cera e pavio pode pedir cuidados diferentes.

## Escolha onde acender

Use uma superfície firme e resistente ao calor, longe de cortinas, objetos inflamáveis e correntes de ar. Mantenha a vela fora do alcance de crianças e animais e nunca a deixe acesa sem supervisão.

## Observe o pavio e o recipiente

Antes de cada uso, com a vela fria, verifique o pavio conforme as instruções do produto. Não utilize recipientes trincados. Evite mover a vela enquanto estiver acesa ou com a cera líquida.

## Encerre o seu ritual com cuidado

Apague a chama antes de sair do ambiente e espere o recipiente esfriar antes de tocar ou guardar. Não use água para apagar a vela. Se tiver dúvidas sobre uma peça Ofir, fale com a nossa equipe.',true),
('como-escolher-sua-fragrancia','Como escolher sua fragrância','Explore suas preferências e encontre um aroma que combine com a sua casa.','Inspiração','## Comece pelo que você gosta

Pense nos aromas que fazem parte dos seus momentos favoritos: um chá, um jardim, uma sobremesa ou uma casa recém-arrumada. Essas referências ajudam a descobrir suas preferências.

## Conheça as famílias de aromas

Fragrâncias cítricas, florais, amadeiradas e adocicadas são pontos de partida para explorar. A percepção é pessoal: o mesmo aroma pode trazer lembranças diferentes para cada pessoa.

## Considere o ambiente

O tamanho e a ventilação do espaço influenciam a percepção da fragrância. Consulte as características de cada produto e comece com uma escolha que combine com seu gosto e sua rotina.

## Escolha com tempo

Leia as descrições das fragrâncias e pergunte sobre as notas que mais chamam sua atenção. Se houver oportunidade de conhecer os aromas presencialmente, aproveite para experimentar antes de escolher.',true);
commit;
