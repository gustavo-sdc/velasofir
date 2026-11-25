begin;

alter table public.products
  add column if not exists payment_preference text not null default 'standard';
alter table public.workshops
  add column if not exists payment_preference text not null default 'standard';

alter table public.products
  add constraint products_payment_preference_check
  check (payment_preference in ('standard','cash','installments_3','installments_6','installments_12','no_ticket'));
alter table public.workshops
  add constraint workshops_payment_preference_check
  check (payment_preference in ('standard','cash','installments_3','installments_6','installments_12','no_ticket'));

commit;
