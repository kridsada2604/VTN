-- VTN Business Phase 2.6 / Sales order fulfillment foundation
-- Run after phase-2.5.sql

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  warehouse_id uuid references public.warehouses(id),
  document_no text not null,
  order_date date not null default current_date,
  requested_delivery_date date,
  status text not null default 'DRAFT' check(status in ('DRAFT','CONFIRMED','RESERVED','PARTIALLY_DELIVERED','DELIVERED','CANCELLED')),
  payment_terms text,
  currency_code text not null default 'THB',
  notes text,
  subtotal numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  reserved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid references public.products(id),
  description text not null,
  quantity numeric(18,4) not null check(quantity > 0),
  reserved_quantity numeric(18,4) not null default 0,
  delivered_quantity numeric(18,4) not null default 0,
  unit_price numeric(18,4) not null default 0,
  discount_percent numeric(9,4) not null default 0,
  tax_rate numeric(9,4) not null default 0,
  line_subtotal numeric(18,2) not null default 0,
  line_discount numeric(18,2) not null default 0,
  line_tax numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  sort_order integer not null default 0
);

create table if not exists public.sales_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id),
  document_no text not null,
  delivery_date date not null default current_date,
  status text not null default 'POSTED' check(status in ('POSTED','VOID')),
  stock_movement_id uuid references public.stock_movements(id),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.sales_delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.sales_deliveries(id) on delete cascade,
  sales_order_item_id uuid not null references public.sales_order_items(id),
  product_id uuid not null references public.products(id),
  quantity numeric(18,4) not null check(quantity > 0),
  sort_order integer not null default 0
);

create table if not exists public.sales_order_events (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace trigger sales_orders_updated_at
before update on public.sales_orders
for each row execute function public.set_updated_at();

alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.sales_deliveries enable row level security;
alter table public.sales_delivery_items enable row level security;
alter table public.sales_order_events enable row level security;

drop policy if exists "sales orders read membership" on public.sales_orders;
drop policy if exists "sales order items read membership" on public.sales_order_items;
drop policy if exists "sales deliveries read membership" on public.sales_deliveries;
drop policy if exists "sales delivery items read membership" on public.sales_delivery_items;
drop policy if exists "sales order events read membership" on public.sales_order_events;
drop policy if exists "sales orders insert manage" on public.sales_orders;
drop policy if exists "sales orders update manage" on public.sales_orders;
drop policy if exists "sales order items insert manage" on public.sales_order_items;
drop policy if exists "sales deliveries insert manage" on public.sales_deliveries;
drop policy if exists "sales delivery items insert manage" on public.sales_delivery_items;
drop policy if exists "sales order events insert manage" on public.sales_order_events;

create policy "sales orders read membership" on public.sales_orders
for select to authenticated using(public.is_company_member(company_id));

create policy "sales order items read membership" on public.sales_order_items
for select to authenticated using(
  exists(select 1 from public.sales_orders o where o.id=sales_order_id and public.is_company_member(o.company_id))
);

create policy "sales deliveries read membership" on public.sales_deliveries
for select to authenticated using(public.is_company_member(company_id));

create policy "sales delivery items read membership" on public.sales_delivery_items
for select to authenticated using(
  exists(select 1 from public.sales_deliveries d where d.id=delivery_id and public.is_company_member(d.company_id))
);

create policy "sales order events read membership" on public.sales_order_events
for select to authenticated using(
  exists(select 1 from public.sales_orders o where o.id=sales_order_id and public.is_company_member(o.company_id))
);

create policy "sales orders insert manage" on public.sales_orders
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "sales orders update manage" on public.sales_orders
for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "sales order items insert manage" on public.sales_order_items
for insert to authenticated with check(
  exists(select 1 from public.sales_orders o where o.id=sales_order_id and public.can_manage_company(o.company_id))
);

create policy "sales deliveries insert manage" on public.sales_deliveries
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "sales delivery items insert manage" on public.sales_delivery_items
for insert to authenticated with check(
  exists(select 1 from public.sales_deliveries d where d.id=delivery_id and public.can_manage_company(d.company_id))
);

create policy "sales order events insert manage" on public.sales_order_events
for insert to authenticated with check(
  exists(select 1 from public.sales_orders o where o.id=sales_order_id and public.can_manage_company(o.company_id))
);

create index if not exists sales_orders_company_date_idx on public.sales_orders(company_id, order_date desc);
create index if not exists sales_orders_customer_idx on public.sales_orders(customer_id);
create index if not exists sales_order_items_order_idx on public.sales_order_items(sales_order_id, sort_order);
create index if not exists sales_deliveries_order_idx on public.sales_deliveries(sales_order_id, delivery_date desc);
create index if not exists sales_order_events_order_idx on public.sales_order_events(sales_order_id, created_at desc);

create or replace function public.create_sales_order(
  p_company_id uuid,
  p_customer_id uuid,
  p_warehouse_id uuid,
  p_order_date date,
  p_requested_delivery_date date,
  p_payment_terms text,
  p_currency_code text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_document_no text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(18,4);
  v_unit_price numeric(18,4);
  v_discount_percent numeric(9,4);
  v_tax_rate numeric(9,4);
  v_line_subtotal numeric(18,2);
  v_line_discount numeric(18,2);
  v_line_tax numeric(18,2);
  v_line_total numeric(18,2);
  v_subtotal numeric(18,2) := 0;
  v_discount numeric(18,2) := 0;
  v_tax numeric(18,2) := 0;
  v_total numeric(18,2) := 0;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'sales order items are required';
  end if;

  if not exists(select 1 from public.customers c where c.id=p_customer_id and c.company_id=p_company_id and c.is_active=true) then
    raise exception 'customer does not belong to company';
  end if;

  if p_warehouse_id is not null and not exists(select 1 from public.warehouses w where w.id=p_warehouse_id and w.company_id=p_company_id and w.is_active=true) then
    raise exception 'warehouse does not belong to company';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'SALES_ORDER', 'SO');

  insert into public.sales_orders(
    company_id, customer_id, warehouse_id, document_no, order_date, requested_delivery_date,
    status, payment_terms, currency_code, notes, created_by
  )
  values(
    p_company_id, p_customer_id, p_warehouse_id, v_document_no, p_order_date, p_requested_delivery_date,
    'CONFIRMED', p_payment_terms, coalesce(nullif(p_currency_code,''),'THB'), p_notes, v_actor
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_discount_percent := coalesce(nullif(v_item->>'discount_percent','')::numeric, 0);
    v_tax_rate := coalesce(nullif(v_item->>'tax_rate','')::numeric, 0);

    if v_qty <= 0 or v_unit_price < 0 or v_discount_percent < 0 or v_tax_rate < 0 then
      raise exception 'invalid sales order item';
    end if;

    if nullif(v_item->>'product_id','') is not null then
      select * into v_product
      from public.products
      where id=(v_item->>'product_id')::uuid and company_id=p_company_id and is_active=true;

      if not found then
        raise exception 'product does not belong to company';
      end if;
    end if;

    v_line_subtotal := round((v_qty * v_unit_price)::numeric, 2);
    v_line_discount := round((v_line_subtotal * v_discount_percent / 100)::numeric, 2);
    v_line_tax := round(((v_line_subtotal - v_line_discount) * v_tax_rate / 100)::numeric, 2);
    v_line_total := v_line_subtotal - v_line_discount + v_line_tax;

    insert into public.sales_order_items(
      sales_order_id, product_id, description, quantity, unit_price, discount_percent, tax_rate,
      line_subtotal, line_discount, line_tax, line_total, sort_order
    )
    values(
      v_order_id, nullif(v_item->>'product_id','')::uuid, trim(v_item->>'description'), v_qty, v_unit_price,
      v_discount_percent, v_tax_rate, v_line_subtotal, v_line_discount, v_line_tax, v_line_total,
      coalesce((v_item->>'sort_order')::integer, 0)
    );

    v_subtotal := v_subtotal + v_line_subtotal;
    v_discount := v_discount + v_line_discount;
    v_tax := v_tax + v_line_tax;
    v_total := v_total + v_line_total;
  end loop;

  update public.sales_orders
  set subtotal=v_subtotal, discount_amount=v_discount, tax_amount=v_tax, total_amount=v_total
  where id=v_order_id;

  insert into public.sales_order_events(sales_order_id,event_type,to_status,message,created_by)
  values(v_order_id,'CREATED','CONFIRMED','สร้าง Sales Order',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_order',v_order_id,'created',jsonb_build_object('document_no',v_document_no,'total_amount',v_total));

  return v_order_id;
end;
$$;

create or replace function public.reserve_sales_order_stock(
  p_company_id uuid,
  p_sales_order_id uuid,
  p_warehouse_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.sales_orders%rowtype;
  v_item public.sales_order_items%rowtype;
  v_available numeric(18,4);
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_order
  from public.sales_orders
  where id=p_sales_order_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'sales order not found';
  end if;

  if v_order.status not in ('CONFIRMED') then
    raise exception 'sales order cannot be reserved from status %', v_order.status;
  end if;

  if not exists(select 1 from public.warehouses w where w.id=p_warehouse_id and w.company_id=p_company_id and w.is_active=true) then
    raise exception 'warehouse does not belong to company';
  end if;

  for v_item in select * from public.sales_order_items where sales_order_id=p_sales_order_id and product_id is not null order by sort_order
  loop
    insert into public.stock_balances(company_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, average_cost, total_cost)
    values(p_company_id, p_warehouse_id, v_item.product_id, 0, 0, 0, 0)
    on conflict(company_id, warehouse_id, product_id) do nothing;

    select quantity_on_hand - quantity_reserved into v_available
    from public.stock_balances
    where company_id=p_company_id and warehouse_id=p_warehouse_id and product_id=v_item.product_id
    for update;

    if v_available < v_item.quantity then
      raise exception 'insufficient available stock';
    end if;

    update public.stock_balances
    set quantity_reserved=quantity_reserved + v_item.quantity
    where company_id=p_company_id and warehouse_id=p_warehouse_id and product_id=v_item.product_id;

    update public.sales_order_items
    set reserved_quantity=quantity
    where id=v_item.id;
  end loop;

  update public.sales_orders
  set status='RESERVED', warehouse_id=p_warehouse_id, reserved_at=now()
  where id=p_sales_order_id;

  insert into public.sales_order_events(sales_order_id,event_type,from_status,to_status,message,created_by)
  values(p_sales_order_id,'RESERVED',v_order.status,'RESERVED','Reserve stock สำเร็จ',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_order',p_sales_order_id,'reserved',jsonb_build_object('warehouse_id',p_warehouse_id));

  return p_sales_order_id;
end;
$$;

create or replace function public.deliver_sales_order(
  p_company_id uuid,
  p_sales_order_id uuid,
  p_delivery_date date,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.sales_orders%rowtype;
  v_delivery_id uuid;
  v_document_no text;
  v_stock_movement_id uuid;
  v_stock_items jsonb := '[]'::jsonb;
  v_item public.sales_order_items%rowtype;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_order
  from public.sales_orders
  where id=p_sales_order_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'sales order not found';
  end if;

  if v_order.status not in ('RESERVED') or v_order.warehouse_id is null then
    raise exception 'sales order must be reserved before delivery';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'SALES_DELIVERY', 'DO');

  insert into public.sales_deliveries(company_id,sales_order_id,warehouse_id,document_no,delivery_date,notes,created_by)
  values(p_company_id,p_sales_order_id,v_order.warehouse_id,v_document_no,p_delivery_date,p_notes,v_actor)
  returning id into v_delivery_id;

  for v_item in select * from public.sales_order_items where sales_order_id=p_sales_order_id and product_id is not null order by sort_order
  loop
    insert into public.sales_delivery_items(delivery_id,sales_order_item_id,product_id,quantity,sort_order)
    values(v_delivery_id,v_item.id,v_item.product_id,v_item.quantity,v_item.sort_order);

    update public.stock_balances
    set quantity_reserved=greatest(quantity_reserved - v_item.quantity, 0)
    where company_id=p_company_id and warehouse_id=v_order.warehouse_id and product_id=v_item.product_id;

    update public.sales_order_items
    set delivered_quantity=quantity
    where id=v_item.id;

    v_stock_items := v_stock_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_item.product_id,
      'quantity', v_item.quantity,
      'unit_cost', 0,
      'sort_order', v_item.sort_order
    ));
  end loop;

  if jsonb_array_length(v_stock_items) > 0 then
    v_stock_movement_id := public.post_stock_movement(
      p_company_id,
      v_order.warehouse_id,
      p_delivery_date,
      'ISSUE',
      'Sales delivery ' || v_document_no,
      v_stock_items
    );

    update public.sales_deliveries
    set stock_movement_id=v_stock_movement_id
    where id=v_delivery_id;
  end if;

  update public.sales_orders
  set status='DELIVERED'
  where id=p_sales_order_id;

  insert into public.sales_order_events(sales_order_id,event_type,from_status,to_status,message,created_by)
  values(p_sales_order_id,'DELIVERED',v_order.status,'DELIVERED','Delivery และตัดสต๊อกสำเร็จ',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_delivery',v_delivery_id,'posted',jsonb_build_object('document_no',v_document_no,'stock_movement_id',v_stock_movement_id));

  return v_delivery_id;
end;
$$;
