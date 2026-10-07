-- =====================================================================
-- Rana Collection - Supabase Auth, roles, categories, orders, admin RLS
-- Paste ALL of this into Supabase > SQL Editor > New query > Run.
-- Safe to run again (idempotent). It does NOT insert or overwrite products.
-- It does NOT rename or drop any products column (the WhatsApp bot keeps working:
-- anon can still SELECT active products).
-- =====================================================================

-- 1) PROFILES (one row per auth user) ------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  address     text,
  city        text,
  role        text not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- columns added later stay in sync on re-run
alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists full_name  text;
alter table public.profiles add column if not exists phone      text;
alter table public.profiles add column if not exists address    text;
alter table public.profiles add column if not exists city       text;
alter table public.profiles add column if not exists role       text not null default 'customer';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('customer', 'admin'));
  end if;
end $$;

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- 2) is_admin(): SECURITY DEFINER so RLS policies can call it without recursion
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 3) New signup -> profile row (role = customer) ----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when a user changes their email
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Backfill: users that signed up before this script get a profile too
insert into public.profiles (id, email, full_name, phone)
select u.id,
       u.email,
       nullif(u.raw_user_meta_data ->> 'full_name', ''),
       nullif(u.raw_user_meta_data ->> 'phone', '')
from auth.users u
on conflict (id) do nothing;

update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id and p.email is null;

-- Customers may edit their own name/phone/address, but never their role or email
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  -- auth.uid() is null in the SQL Editor, so the owner can still promote admins there
  if auth.uid() is not null and not public.is_admin() then
    new.id    := old.id;
    new.role  := old.role;
    new.email := old.email;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- 4) CATEGORIES ------------------------------------------------------------
-- products.category stays a text column (the bot reads it); this table is the
-- admin-managed list of category names.
create table if not exists public.categories (
  id          bigint generated by default as identity primary key,
  name        text not null,
  slug        text,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.categories add column if not exists slug       text;
alter table public.categories add column if not exists sort_order integer not null default 0;
alter table public.categories add column if not exists active     boolean not null default true;
alter table public.categories add column if not exists created_at timestamptz not null default now();

create unique index if not exists categories_name_key on public.categories (name);
create unique index if not exists categories_slug_key on public.categories (slug);

insert into public.categories (name, slug)
select distinct on (lower(trim(p.category)))
       trim(p.category),
       trim(both '-' from regexp_replace(lower(trim(p.category)), '[^a-z0-9]+', '-', 'g'))
from public.products p
where p.category is not null and trim(p.category) <> ''
order by lower(trim(p.category)), trim(p.category)
on conflict do nothing;

-- 5) ORDERS (items stored as jsonb - simple and enough for this shop) -------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null default ('RC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  customer_name   text,
  phone           text,
  email           text,
  address         text,
  city            text,
  notes           text,
  items           jsonb not null default '[]'::jsonb,
  subtotal        numeric not null default 0,
  shipping_fee    numeric not null default 0,
  total           numeric not null default 0,
  payment_method  text not null default 'cod',
  payment_status  text not null default 'pending_cod',
  status          text not null default 'placed',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.orders add column if not exists notes          text;
alter table public.orders add column if not exists payment_status text not null default 'pending_cod';
alter table public.orders add column if not exists updated_at     timestamptz not null default now();

create unique index if not exists orders_order_number_key on public.orders (order_number);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conname = 'orders_status_check' and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_status_check
      check (status in ('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));
  end if;
end $$;

-- Server-side order checks: customers can't fake prices, totals, owner or status.
create or replace function public.orders_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_items    jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_item     jsonb;
  v_product  record;
  v_qty      integer;
begin
  if public.is_admin() or auth.uid() is null then
    return new; -- admins / SQL editor insert as-is
  end if;

  new.user_id := auth.uid();
  new.status := 'placed';
  if new.payment_method not in ('cod', 'card', 'jazzcash', 'easypaisa') then
    new.payment_method := 'cod';
  end if;
  new.payment_status := case when new.payment_method = 'cod' then 'pending_cod' else 'demo_paid' end;

  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 then
    raise exception 'Order has no items';
  end if;

  for v_item in select value from jsonb_array_elements(new.items) loop
    select p.code, p.name, p.price, p.brand
      into v_product
      from public.products p
     where (p.code = v_item ->> 'productId' or p.id::text = v_item ->> 'productId')
       and coalesce(p.active, true)
     limit 1;
    if not found then
      raise exception 'Product % is not available', v_item ->> 'productId';
    end if;
    v_qty := greatest(1, least(99, coalesce(nullif(v_item ->> 'qty', '')::integer, 1)));
    v_items := v_items || jsonb_build_array(
      v_item || jsonb_build_object(
        'name', v_product.name,
        'brand', v_product.brand,
        'price', v_product.price,
        'qty', v_qty
      )
    );
    v_subtotal := v_subtotal + coalesce(v_product.price, 0) * v_qty;
  end loop;

  new.items := v_items;
  new.subtotal := v_subtotal;
  new.shipping_fee := case when v_subtotal >= 5000 then 0 else 250 end;
  new.total := v_subtotal + new.shipping_fee;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert
  before insert on public.orders
  for each row execute function public.orders_before_insert();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- 6) GRANTS (RLS below decides which rows) ----------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.products, public.categories to anon, authenticated;
grant insert, update, delete on public.products, public.categories to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.orders to authenticated;

do $$
declare s text;
begin
  s := pg_get_serial_sequence('public.products', 'id');
  if s is not null then execute format('grant usage, select on sequence %s to authenticated', s); end if;
  s := pg_get_serial_sequence('public.categories', 'id');
  if s is not null then execute format('grant usage, select on sequence %s to authenticated', s); end if;
end $$;

-- 7) ROW LEVEL SECURITY -------------------------------------------------------
alter table public.products   enable row level security;
alter table public.categories enable row level security;
alter table public.profiles   enable row level security;
alter table public.orders     enable row level security;

-- PRODUCTS: everyone reads active products (bot + website); admins do everything
drop policy if exists "Public read products" on public.products;
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon, authenticated
  using (coalesce(active, true) or public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete to authenticated using (public.is_admin());

-- CATEGORIES: everyone reads active categories; admins do everything
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select to anon, authenticated
  using (active or public.is_admin());

drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories
  for insert to authenticated with check (public.is_admin());

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories
  for delete to authenticated using (public.is_admin());

-- PROFILES: a user reads/updates only their own row; admins read all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'customer');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ORDERS: customers read/insert only their own; admins read/update/delete all
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (public.is_admin());

-- 8) STORAGE: bucket product-images (public read, admin write) ---------------
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true)
  on conflict (id) do update set public = true;
exception when others then
  raise notice 'Could not create/update bucket product-images (%). Create it in Storage > New bucket (Public).', sqlerrm;
end $$;

do $$
begin
  drop policy if exists "Public read product-images" on storage.objects;
  create policy "Public read product-images" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'product-images');

  drop policy if exists "Admin insert product-images" on storage.objects;
  create policy "Admin insert product-images" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'product-images' and public.is_admin());

  drop policy if exists "Admin update product-images" on storage.objects;
  create policy "Admin update product-images" on storage.objects
    for update to authenticated
    using (bucket_id = 'product-images' and public.is_admin())
    with check (bucket_id = 'product-images' and public.is_admin());

  drop policy if exists "Admin delete product-images" on storage.objects;
  create policy "Admin delete product-images" on storage.objects
    for delete to authenticated
    using (bucket_id = 'product-images' and public.is_admin());
exception when others then
  raise warning 'Storage policies failed (%). Add them in Storage > Policies for bucket product-images.', sqlerrm;
end $$;

-- 9) Tell the Supabase API about the new tables right away ------------------
notify pgrst, 'reload schema';

-- 10) Quick check ----------------------------------------------------------
select
  (select count(*) from public.products)   as products,
  (select count(*) from public.categories) as categories,
  (select count(*) from public.profiles)   as profiles,
  (select count(*) from public.orders)     as orders;

-- =====================================================================
-- MAKE YOURSELF ADMIN (after you register on the website at /login):
-- remove the two dashes at the start of the next line, put your email, and Run it.
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
-- =====================================================================