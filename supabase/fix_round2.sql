-- =====================================================================
-- Rana Collection - round 2 fixes. Run AFTER auth_admin_setup.sql.
-- Paste ALL of this into Supabase > SQL Editor > New query > Run.
-- Safe to run again (idempotent). Does NOT touch product rows or columns.
--  1) public.settings (delivery fee + free-shipping threshold, admin editable)
--  2) order trigger reads the delivery settings
--  3) RLS re-check: profiles / orders only for the owner or an admin
--  4) WhatsApp bot orders: create_whatsapp_order() RPC (secret-protected)
-- =====================================================================

-- 1) SETTINGS ----------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

insert into public.settings (key, value)
values ('delivery', '{"flat_fee": 250, "free_over": 5000}'::jsonb)
on conflict (key) do nothing;

-- Random secret the WhatsApp bot sends with each order (never readable by the public).
insert into public.settings (key, value)
values ('whatsapp_bot', jsonb_build_object('secret', md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text)))
on conflict (key) do nothing;

alter table public.settings enable row level security;
grant select on public.settings to anon, authenticated;
grant insert, update on public.settings to authenticated;

drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings
  for select to anon, authenticated
  using (key = 'delivery' or public.is_admin());

drop policy if exists "settings_admin_insert" on public.settings;
create policy "settings_admin_insert" on public.settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists "settings_admin_update" on public.settings;
create policy "settings_admin_update" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists settings_touch_updated_at on public.settings;
create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- Delivery fee for a subtotal, from settings (defaults Rs 250, free from Rs 5,000)
create or replace function public.delivery_fee(p_subtotal numeric)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when coalesce(p_subtotal, 0) <= 0 then 0
    when coalesce((s.value ->> 'free_over')::numeric, 5000) > 0
         and p_subtotal >= coalesce((s.value ->> 'free_over')::numeric, 5000) then 0
    else greatest(0, coalesce((s.value ->> 'flat_fee')::numeric, 250))
  end
  from (select (select value from public.settings where key = 'delivery') as value) s;
$$;

grant execute on function public.delivery_fee(numeric) to anon, authenticated;

-- 2) ORDERS: allow bot orders (no website account) + order source -------------
alter table public.orders alter column user_id drop not null;
alter table public.orders add column if not exists source text not null default 'website';

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
    return new; -- admins / SQL editor / create_whatsapp_order() insert as-is
  end if;

  new.user_id := auth.uid();
  new.status := 'placed';
  new.source := 'website';
  if new.payment_method not in ('cod', 'card', 'jazzcash', 'easypaisa') then
    new.payment_method := 'cod';
  end if;
  new.payment_status := case when new.payment_method = 'cod' then 'pending_cod' else 'demo_paid' end;

  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 then
    raise exception 'Order has no items';
  end if;
  if jsonb_array_length(new.items) > 50 then
    raise exception 'Too many items in one order';
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
      v_item || jsonb_build_object('name', v_product.name, 'brand', v_product.brand, 'price', v_product.price, 'qty', v_qty)
    );
    v_subtotal := v_subtotal + coalesce(v_product.price, 0) * v_qty;
  end loop;

  new.items := v_items;
  new.subtotal := v_subtotal;
  new.shipping_fee := public.delivery_fee(v_subtotal);
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

-- 3) RLS RE-CHECK ---------------------------------------------------------------
-- The public (anon) role gets nothing on private tables; signed-in users only see their own rows.
revoke all on public.profiles from anon;
revoke all on public.orders from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.orders to authenticated;

alter table public.profiles enable row level security;
alter table public.orders   enable row level security;

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

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using ((user_id is not null and user_id = auth.uid()) or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert to authenticated
  with check ((user_id is not null and user_id = auth.uid()) or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (public.is_admin());

-- 4) WHATSAPP BOT ORDERS ----------------------------------------------------------
-- The bot only has the anon key. It calls this function with the secret from
-- settings 'whatsapp_bot'. Prices and delivery are recalculated here, never trusted.
create or replace function public.create_whatsapp_order(
  p_secret        text,
  p_order_number  text,
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_city          text,
  p_items         jsonb,
  p_notes         text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret   text;
  v_items    jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_item     jsonb;
  v_product  record;
  v_qty      integer;
  v_fee      numeric;
  v_number   text;
  v_row      public.orders%rowtype;
begin
  select value ->> 'secret' into v_secret from public.settings where key = 'whatsapp_bot';
  if v_secret is null or p_secret is null or p_secret <> v_secret then
    raise exception 'Not allowed';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order has no items';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'Too many items in one order';
  end if;
  if coalesce(length(trim(p_customer_name)), 0) < 2 or coalesce(length(trim(p_phone)), 0) < 10 then
    raise exception 'Name and phone are required';
  end if;

  v_number := left(coalesce(nullif(trim(p_order_number), ''), 'WA-' || upper(substr(md5(random()::text), 1, 10))), 40);

  -- Same order sent twice (bot retry): return the existing one.
  select * into v_row from public.orders where order_number = v_number;
  if found then
    return jsonb_build_object('id', v_row.id, 'order_number', v_row.order_number, 'total', v_row.total, 'duplicate', true);
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    select p.code, p.name, p.price, p.brand, p.images
      into v_product
      from public.products p
     where (p.code = v_item ->> 'productId' or p.id::text = v_item ->> 'productId')
       and coalesce(p.active, true)
     limit 1;
    if not found then
      raise exception 'Product % is not available', v_item ->> 'productId';
    end if;
    v_qty := greatest(1, least(99, coalesce(nullif(v_item ->> 'qty', '')::integer, 1)));
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'productId', v_product.code,
      'name', v_product.name,
      'brand', v_product.brand,
      'price', v_product.price,
      'qty', v_qty,
      'size', left(coalesce(v_item ->> 'size', ''), 10),
      'image', v_product.images[1]
    ));
    v_subtotal := v_subtotal + coalesce(v_product.price, 0) * v_qty;
  end loop;

  v_fee := public.delivery_fee(v_subtotal);

  insert into public.orders (
    order_number, user_id, customer_name, phone, address, city, notes, items,
    subtotal, shipping_fee, total, payment_method, payment_status, status, source
  ) values (
    v_number, null, left(trim(p_customer_name), 120), left(trim(p_phone), 30), left(trim(coalesce(p_address, '')), 400),
    left(trim(coalesce(p_city, '')), 80), left(p_notes, 500), v_items,
    v_subtotal, v_fee, v_subtotal + v_fee, 'cod', 'pending_cod', 'placed', 'whatsapp'
  )
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'order_number', v_row.order_number, 'total', v_row.total, 'duplicate', false);
end;
$$;

revoke all on function public.create_whatsapp_order(text, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.create_whatsapp_order(text, text, text, text, text, text, jsonb, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- Shows the secret to paste into the WhatsApp bot .env as SUPABASE_ORDER_SECRET=
-- (keep it private; anyone with it can create WhatsApp orders)
select value ->> 'secret' as whatsapp_bot_secret from public.settings where key = 'whatsapp_bot';