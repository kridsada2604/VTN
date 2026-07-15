-- VTN Business Phase 2.4 / Sprint 15 marketplace foundation
-- Run after phase-2.3.sql

create table if not exists public.marketplace_channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  platform text not null check(platform in ('SHOPEE','LAZADA','TIKTOK','FACEBOOK','LINE_SHOPPING','OTHER')),
  shop_code text not null,
  status text not null default 'ACTIVE' check(status in ('ACTIVE','PAUSED','DISCONNECTED')),
  sync_status text not null default 'MANUAL' check(sync_status in ('MANUAL','CONNECTED','ERROR')),
  last_synced_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, platform, shop_code)
);

create table if not exists public.marketplace_product_mappings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel_id uuid not null references public.marketplace_channels(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  marketplace_sku text not null,
  marketplace_product_name text,
  status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(channel_id, marketplace_sku)
);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel_id uuid not null references public.marketplace_channels(id),
  customer_id uuid references public.customers(id) on delete set null,
  order_no text not null,
  external_order_no text not null,
  order_date timestamptz not null,
  status text not null default 'IMPORTED' check(status in ('IMPORTED','CONFIRMED','PACKED','SHIPPED','COMPLETED','CANCELLED')),
  payment_status text not null default 'PAID' check(payment_status in ('UNPAID','PAID','REFUNDED','PARTIAL_REFUND')),
  fulfillment_status text not null default 'PENDING' check(fulfillment_status in ('PENDING','READY_TO_SHIP','SHIPPED','DELIVERED','CANCELLED')),
  buyer_name text not null,
  buyer_phone text,
  shipping_address text,
  currency_code text not null default 'THB',
  subtotal numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  shipping_fee numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  raw_payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(channel_id, external_order_no),
  unique(company_id, order_no)
);

create table if not exists public.marketplace_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  marketplace_sku text not null,
  description text not null,
  quantity numeric(18,4) not null check(quantity > 0),
  unit_price numeric(18,4) not null default 0,
  line_discount numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  mapping_status text not null default 'UNMAPPED' check(mapping_status in ('MAPPED','UNMAPPED')),
  sort_order integer not null default 0
);

create table if not exists public.marketplace_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace trigger marketplace_channels_updated_at
before update on public.marketplace_channels
for each row execute function public.set_updated_at();

create or replace trigger marketplace_product_mappings_updated_at
before update on public.marketplace_product_mappings
for each row execute function public.set_updated_at();

create or replace trigger marketplace_orders_updated_at
before update on public.marketplace_orders
for each row execute function public.set_updated_at();

alter table public.marketplace_channels enable row level security;
alter table public.marketplace_product_mappings enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_order_items enable row level security;
alter table public.marketplace_order_events enable row level security;

drop policy if exists "marketplace channels read membership" on public.marketplace_channels;
drop policy if exists "marketplace mappings read membership" on public.marketplace_product_mappings;
drop policy if exists "marketplace orders read membership" on public.marketplace_orders;
drop policy if exists "marketplace order items read membership" on public.marketplace_order_items;
drop policy if exists "marketplace order events read membership" on public.marketplace_order_events;
drop policy if exists "marketplace channels manage" on public.marketplace_channels;
drop policy if exists "marketplace mappings manage" on public.marketplace_product_mappings;
drop policy if exists "marketplace orders insert manage" on public.marketplace_orders;
drop policy if exists "marketplace order items insert manage" on public.marketplace_order_items;
drop policy if exists "marketplace order events insert manage" on public.marketplace_order_events;

create policy "marketplace channels read membership" on public.marketplace_channels
for select to authenticated using(public.is_company_member(company_id));

create policy "marketplace mappings read membership" on public.marketplace_product_mappings
for select to authenticated using(public.is_company_member(company_id));

create policy "marketplace orders read membership" on public.marketplace_orders
for select to authenticated using(public.is_company_member(company_id));

create policy "marketplace order items read membership" on public.marketplace_order_items
for select to authenticated using(
  exists(select 1 from public.marketplace_orders o where o.id=order_id and public.is_company_member(o.company_id))
);

create policy "marketplace order events read membership" on public.marketplace_order_events
for select to authenticated using(
  exists(select 1 from public.marketplace_orders o where o.id=order_id and public.is_company_member(o.company_id))
);

create policy "marketplace channels manage" on public.marketplace_channels
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "marketplace mappings manage" on public.marketplace_product_mappings
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "marketplace orders insert manage" on public.marketplace_orders
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "marketplace order items insert manage" on public.marketplace_order_items
for insert to authenticated with check(
  exists(select 1 from public.marketplace_orders o where o.id=order_id and public.can_manage_company(o.company_id))
);

create policy "marketplace order events insert manage" on public.marketplace_order_events
for insert to authenticated with check(
  exists(select 1 from public.marketplace_orders o where o.id=order_id and public.can_manage_company(o.company_id))
);

create index if not exists marketplace_channels_company_idx on public.marketplace_channels(company_id, platform, status);
create index if not exists marketplace_mappings_channel_sku_idx on public.marketplace_product_mappings(channel_id, marketplace_sku);
create index if not exists marketplace_orders_company_date_idx on public.marketplace_orders(company_id, order_date desc);
create index if not exists marketplace_orders_channel_status_idx on public.marketplace_orders(channel_id, status, fulfillment_status);
create index if not exists marketplace_order_items_order_idx on public.marketplace_order_items(order_id, sort_order);
create index if not exists marketplace_events_order_idx on public.marketplace_order_events(order_id, created_at desc);

create or replace function public.create_marketplace_channel(
  p_company_id uuid,
  p_name text,
  p_platform text,
  p_shop_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_channel_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  insert into public.marketplace_channels(company_id, name, platform, shop_code, created_by)
  values(p_company_id, trim(p_name), p_platform, trim(p_shop_code), v_actor)
  returning id into v_channel_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'marketplace_channel',v_channel_id,'created',jsonb_build_object('platform',p_platform,'shop_code',p_shop_code));

  return v_channel_id;
end;
$$;

create or replace function public.import_marketplace_order(
  p_company_id uuid,
  p_channel_id uuid,
  p_external_order_no text,
  p_order_date timestamptz,
  p_buyer_name text,
  p_buyer_phone text,
  p_shipping_address text,
  p_shipping_fee numeric,
  p_discount_amount numeric,
  p_tax_amount numeric,
  p_raw_payload jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_no text;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric(18,4);
  v_unit_price numeric(18,4);
  v_line_discount numeric(18,2);
  v_line_total numeric(18,2);
  v_subtotal numeric(18,2) := 0;
  v_total numeric(18,2) := 0;
  v_sku text;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'marketplace order items are required';
  end if;

  if not exists(select 1 from public.marketplace_channels c where c.id=p_channel_id and c.company_id=p_company_id and c.status='ACTIVE') then
    raise exception 'marketplace channel does not belong to company';
  end if;

  v_order_no := public.next_document_number(p_company_id, 'MARKETPLACE_ORDER', 'MKT');

  insert into public.marketplace_orders(
    company_id, channel_id, order_no, external_order_no, order_date,
    buyer_name, buyer_phone, shipping_address, shipping_fee, discount_amount, tax_amount,
    raw_payload, created_by
  )
  values(
    p_company_id, p_channel_id, v_order_no, trim(p_external_order_no), p_order_date,
    trim(p_buyer_name), nullif(trim(p_buyer_phone), ''), nullif(trim(p_shipping_address), ''),
    coalesce(p_shipping_fee, 0), coalesce(p_discount_amount, 0), coalesce(p_tax_amount, 0),
    coalesce(p_raw_payload, '{}'::jsonb), v_actor
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku := trim(v_item->>'marketplace_sku');
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_line_discount := round(coalesce(nullif(v_item->>'line_discount','')::numeric, 0), 2);
    v_line_total := round(((v_qty * v_unit_price) - v_line_discount)::numeric, 2);

    if v_sku = '' or v_qty <= 0 or v_unit_price < 0 or v_line_total < 0 then
      raise exception 'invalid marketplace order item';
    end if;

    select m.product_id into v_product_id
    from public.marketplace_product_mappings m
    where m.company_id=p_company_id and m.channel_id=p_channel_id and m.marketplace_sku=v_sku and m.status='ACTIVE'
    limit 1;

    if v_product_id is null and nullif(v_item->>'product_id','') is not null then
      select p.id into v_product_id
      from public.products p
      where p.id=(v_item->>'product_id')::uuid and p.company_id=p_company_id and p.is_active=true;
    end if;

    insert into public.marketplace_order_items(
      order_id, product_id, marketplace_sku, description, quantity, unit_price,
      line_discount, line_total, mapping_status, sort_order
    )
    values(
      v_order_id, v_product_id, v_sku, coalesce(nullif(v_item->>'description',''), v_sku),
      v_qty, v_unit_price, v_line_discount, v_line_total,
      case when v_product_id is null then 'UNMAPPED' else 'MAPPED' end,
      coalesce((v_item->>'sort_order')::integer, 0)
    );

    v_subtotal := v_subtotal + round((v_qty * v_unit_price)::numeric, 2);
  end loop;

  v_total := round((v_subtotal - coalesce(p_discount_amount, 0) + coalesce(p_shipping_fee, 0) + coalesce(p_tax_amount, 0))::numeric, 2);

  update public.marketplace_orders
  set subtotal=v_subtotal,
      total_amount=v_total
  where id=v_order_id;

  insert into public.marketplace_order_events(order_id,event_type,to_status,message,created_by)
  values(v_order_id,'imported','IMPORTED','Marketplace order imported',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'marketplace_order',v_order_id,'imported',jsonb_build_object('order_no',v_order_no,'external_order_no',p_external_order_no,'total_amount',v_total));

  return v_order_id;
end;
$$;
