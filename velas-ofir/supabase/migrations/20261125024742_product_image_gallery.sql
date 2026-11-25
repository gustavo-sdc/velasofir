alter table public.products
  add column if not exists images text[] not null default '{}';

update public.products
set images = array[image]
where coalesce(image, '') <> ''
  and cardinality(images) = 0;
