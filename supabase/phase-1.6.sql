-- VTN Business Phase 1.6 / Sprint 8 inventory stock movement foundation
-- Run after phase-1.5.sql

alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists costing_method text not null default 'AVERAGE'
  check(costing_method in ('FIFO','AVERAGE'));
alter table public.products add column if not exists track_lot boolean not null default false;
alter table public.products add column if not exists track_serial boolean not null default false;

create table if not exists public.stock_balances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_on_hand numeric(18,4) not null default 0,
  quantity_reserved numeric(18,4) not null default 0,
  average_cost numeric(18,4) not null default 0,
  total_cost numeric(18,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique(company_id, warehouse_id, product_id)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id),
  document_no text not null,
  movement_date date not null default current_date,
  movement_type text not null check(movement_type in ('RECEIVE','ISSUE','ADJUSTMENT_IN','ADJUSTMENT_OUT','TRANSFER_IN','TRANSFER_OUT')),
  source_type text,
  source_id uuid,
  status text not null default 'POSTED' check(status in ('DRAFT','POSTED','VOID')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.stock_movement_items (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null references public.stock_movements(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(18,4) not null check(quantity > 0),
  unit_cost numeric(18,4) not null default 0,
  line_cost numeric(18,2) not null default 0,
  lot_no text,
  serial_no text,
  barcode text,
  sort_order integer not null default 0
);

create table if not exists public.stock_layers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_item_id uuid not null references public.stock_movement_items(id) on delete cascade,
  received_date date not null,
  quantity_in numeric(18,4) not null default 0,
  quantity_remaining numeric(18,4) not null default 0,
  unit_cost numeric(18,4) not null default 0,
  lot_no text,
  serial_no text,
  created_at timestamptz not null default now()
);

create or replace trigger stock_balances_updated_at
before update on public.stock_balances
for each row execute function public.set_updated_at();

alter table public.stock_balances enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_movement_items enable row level security;
alter table public.stock_layers enable row level security;

drop policy if exists "stock balances read membership" on public.stock_balances;
drop policy if exists "stock movements read membership" on public.stock_movements;
drop policy if exists "stock movement items read membership" on public.stock_movement_items;
drop policy if exists "stock layers read membership" on public.stock_layers;
drop policy if exists "stock balances manage" on public.stock_balances;
drop policy if exists "stock movements insert manage" on public.stock_movements;
drop policy if exists "stock movement items insert manage" on public.stock_movement_items;
drop policy if exists "stock layers insert manage" on public.stock_layers;

create policy "stock balances read membership" on public.stock_balances
for select to authenticated using(public.is_company_member(company_id));

create policy "stock movements read membership" on public.stock_movements
for select to authenticated using(public.is_company_member(company_id));

create policy "stock movement items read membership" on public.stock_movement_items
for select to authenticated using(
  exists(select 1 from public.stock_movements m where m.id=movement_id and public.is_company_member(m.company_id))
);

create policy "stock layers read membership" on public.stock_layers
for select to authenticated using(public.is_company_member(company_id));

create policy "stock balances manage" on public.stock_balances
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "stock movements insert manage" on public.stock_movements
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "stock movement items insert manage" on public.stock_movement_items
for insert to authenticated with check(
  exists(select 1 from public.stock_movements m where m.id=movement_id and public.can_manage_company(m.company_id))
);

create policy "stock layers insert manage" on public.stock_layers
for insert to authenticated with check(public.can_manage_company(company_id));

create index if not exists stock_balances_company_product_idx on public.stock_balances(company_id, product_id);
create index if not exists stock_balances_warehouse_idx on public.stock_balances(warehouse_id);
create index if not exists stock_movements_company_date_idx on public.stock_movements(company_id, movement_date desc);
create index if not exists stock_movements_warehouse_idx on public.stock_movements(warehouse_id);
create index if not exists stock_movement_items_movement_idx on public.stock_movement_items(movement_id, sort_order);
create index if not exists stock_movement_items_product_idx on public.stock_movement_items(product_id);
create index if not exists stock_layers_fifo_idx on public.stock_layers(company_id, warehouse_id, product_id, received_date, created_at);

create or replace function public.post_stock_movement(
  p_company_id uuid,
  p_warehouse_id uuid,
  p_movement_date date,
  p_movement_type text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_movement_id uuid;
  v_document_no text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_item_id uuid;
  v_qty numeric(18,4);
  v_unit_cost numeric(18,4);
  v_line_cost numeric(18,2);
  v_current_qty numeric(18,4);
  v_current_cost numeric(18,2);
  v_current_average_cost numeric(18,4);
  v_new_qty numeric(18,4);
  v_new_total_cost numeric(18,2);
  v_new_average_cost numeric(18,4);
  v_sign integer;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'stock movement items are required';
  end if;

  if not exists(select 1 from public.warehouses w where w.id=p_warehouse_id and w.company_id=p_company_id) then
    raise exception 'warehouse does not belong to company';
  end if;

  v_sign := case
    when p_movement_type in ('RECEIVE','ADJUSTMENT_IN','TRANSFER_IN') then 1
    when p_movement_type in ('ISSUE','ADJUSTMENT_OUT','TRANSFER_OUT') then -1
    else null
  end;

  if v_sign is null then
    raise exception 'invalid movement type';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'STOCK_MOVEMENT', 'STK');

  insert into public.stock_movements(company_id, warehouse_id, document_no, movement_date, movement_type, status, notes, created_by)
  values(p_company_id, p_warehouse_id, v_document_no, p_movement_date, p_movement_type, 'POSTED', p_notes, v_actor)
  returning id into v_movement_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_cost := coalesce(nullif(v_item->>'unit_cost','')::numeric, 0);
    v_line_cost := round((v_qty * v_unit_cost)::numeric, 2);

    select * into v_product
    from public.products
    where id=(v_item->>'product_id')::uuid and company_id=p_company_id and is_active=true;

    if not found then
      raise exception 'product does not belong to company';
    end if;

    insert into public.stock_movement_items(
      movement_id, product_id, quantity, unit_cost, line_cost, lot_no, serial_no, barcode, sort_order
    )
    values(
      v_movement_id, v_product.id, v_qty, v_unit_cost, v_line_cost,
      nullif(v_item->>'lot_no',''), nullif(v_item->>'serial_no',''), nullif(v_item->>'barcode',''),
      coalesce((v_item->>'sort_order')::integer, 0)
    )
    returning id into v_item_id;

    insert into public.stock_balances(company_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, average_cost, total_cost)
    values(p_company_id, p_warehouse_id, v_product.id, 0, 0, 0, 0)
    on conflict(company_id, warehouse_id, product_id) do nothing;

    select quantity_on_hand, total_cost
    into v_current_qty, v_current_cost
    from public.stock_balances
    where company_id=p_company_id and warehouse_id=p_warehouse_id and product_id=v_product.id
    for update;

    if v_sign < 0 and v_current_qty < v_qty then
      raise exception 'insufficient stock for product %', v_product.sku;
    end if;

    v_new_qty := v_current_qty + (v_qty * v_sign);

    v_current_average_cost := case when v_current_qty > 0 then round((v_current_cost / v_current_qty)::numeric, 4) else v_unit_cost end;

    if v_sign > 0 then
      v_new_total_cost := round((v_current_cost + v_line_cost)::numeric, 2);
    else
      v_new_total_cost := round(greatest((v_current_cost - (v_qty * v_current_average_cost))::numeric, 0), 2);
    end if;

    v_new_average_cost := case when v_new_qty > 0 then round((v_new_total_cost / v_new_qty)::numeric, 4) else 0 end;

    update public.stock_balances
    set quantity_on_hand=v_new_qty,
        average_cost=v_new_average_cost,
        total_cost=v_new_total_cost
    where company_id=p_company_id and warehouse_id=p_warehouse_id and product_id=v_product.id;

    if v_sign > 0 then
      insert into public.stock_layers(
        company_id, warehouse_id, product_id, movement_item_id, received_date,
        quantity_in, quantity_remaining, unit_cost, lot_no, serial_no
      )
      values(
        p_company_id, p_warehouse_id, v_product.id, v_item_id, p_movement_date,
        v_qty, v_qty, v_unit_cost, nullif(v_item->>'lot_no',''), nullif(v_item->>'serial_no','')
      );
    end if;
  end loop;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'stock_movement',v_movement_id,'posted',jsonb_build_object('document_no',v_document_no,'movement_type',p_movement_type));

  return v_movement_id;
end;
$$;
