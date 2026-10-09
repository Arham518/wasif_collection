-- Rana Collection: product reviews
-- Run once in Supabase > SQL Editor (safe to run again). Needs auth_admin_setup.sql first
-- (it uses public.is_admin()).
--
-- - Everyone (guests too) can read reviews.
-- - A signed-in user can add ONE review per product and edit/delete only their own.
-- - Admins can delete any review.
-- - products.rating / products.reviews are kept in sync automatically.

create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  product     text not null,                       -- products.code, e.g. p001
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text check (char_length(author_name) <= 80),
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (char_length(comment) <= 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint reviews_one_per_user unique (user_id, product)
);

create index if not exists reviews_product_idx on public.reviews (product, created_at desc);

-- updated_at on edit
create or replace function public.reviews_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.user_id := old.user_id;      -- a review can't be moved to another user
  new.product := old.product;      -- or to another product
  return new;
end $$;

drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews
  for each row execute function public.reviews_touch();

-- keep products.rating (average) and products.reviews (count) up to date
create or replace function public.reviews_sync_product()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_code text := coalesce(new.product, old.product);
begin
  update public.products p
     set rating  = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.product = v_code), 0),
         reviews = (select count(*) from public.reviews r where r.product = v_code)
   where p.code = v_code;
  return null;
end $$;

drop trigger if exists reviews_sync_product on public.reviews;
create trigger reviews_sync_product after insert or update or delete on public.reviews
  for each row execute function public.reviews_sync_product();

-- permissions
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

alter table public.reviews enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select to anon, authenticated using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

notify pgrst, 'reload schema';