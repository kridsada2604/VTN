-- VTN Business Phase 1.9 / Sprint 10 purchase receive to inventory
-- Run after phase-1.8.sql

create table if not exists public.purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id),
  stock_movement_id uuid references public.stock_movements(id),
  document_no text not null,
  receipt_date date not null default current_date,
  status text not null default 'POSTED' check(status in ('POSTED','VOID')),
  notes text,
  received_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.purchase_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.purchase_receipts(id) on delete cascade,
  purchase_order_item_id uuid not null references public.purchase_order_items(id),
  product_id uuid references public.products(id),
  description text not null,
  quantity_received numeric(18,4) not null check(quantity_received > 0),
  unit_cost numeric(18,4) not null default 0,
  lot_no text,
  serial_no text,
  barcode text,
  sort_order integer not null default 0
);

alter table public.purchase_receipts enable row level security;
alter table public.purchase_receipt_items enable row level security;

drop policy if exists "purchase receipts read membership" on public.purchase_receipts;
drop policy if exists "purchase receipt items read membership" on public.purchase_receipt_items;
drop policy if exists "purchase receipts insert manage" on public.purchase_receipts;
drop policy if exists "purchase receipt items insert manage" on public.purchase_receipt_items;

create policy "purchase receipts read membership" on public.purchase_receipts
for select to authenticated using(public.is_company_member(company_id));

create policy "purchase receipt items read membership" on public.purchase_receipt_items
for select to authenticated using(
  exists(select 1 from public.purchase_receipts r where r.id=receipt_id and public.is_company_member(r.company_id))
);

create policy "purchase receipts insert manage" on public.purchase_receipts
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "purchase receipt items insert manage" on public.purchase_receipt_items
for insert to authenticated with check(
  exists(select 1 from public.purchase_receipts r where r.id=receipt_id and public.can_manage_company(r.company_id))
);

create index if not exists purchase_receipts_company_date_idx on public.purchase_receipts(company_id, receipt_date desc);
create index if not exists purchase_receipts_po_idx on public.purchase_receipts(purchase_order_id);
create index if not exists purchase_receipt_items_receipt_idx on public.purchase_receipt_items(receipt_id, sort_order);

create or replace function public.receive_purchase_order(
  p_company_id uuid,
  p_purchase_order_id uuid,
  p_warehouse_id uuid,
  p_receipt_date date,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_po public.purchase_orders%rowtype;
  v_receipt_id uuid;
  v_receipt_no text;
  v_stock_movement_id uuid;
  v_item jsonb;
  v_po_item public.purchase_order_items%rowtype;
  v_qty numeric(18,4);
  v_remaining numeric(18,4);
  v_all_received boolean;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'receipt items are required';
  end if;

  select * into v_po
  from public.purchase_orders
  where id=p_purchase_order_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'purchase order not found';
  end if;

  if v_po.status in ('CANCELLED','RECEIVED') then
    raise exception 'purchase order cannot receive';
  end if;

  if not exists(select 1 from public.warehouses w where w.id=p_warehouse_id and w.company_id=p_company_id) then
    raise exception 'warehouse does not belong to company';
  end if;

  v_receipt_no := public.next_document_number(p_company_id, 'PURCHASE_RECEIPT', 'GR');

  v_stock_movement_id := public.post_stock_movement(
    p_company_id,
    p_warehouse_id,
    p_receipt_date,
    'RECEIVE',
    coalesce('รับสินค้า PO ' || v_po.document_no || case when p_notes is null then '' else ' - ' || p_notes end, 'รับสินค้า'),
    p_items
  );

  insert into public.purchase_receipts(company_id,purchase_order_id,warehouse_id,stock_movement_id,document_no,receipt_date,status,notes,received_by)
  values(p_company_id,p_purchase_order_id,p_warehouse_id,v_stock_movement_id,v_receipt_no,p_receipt_date,'POSTED',p_notes,v_actor)
  returning id into v_receipt_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;

    select * into v_po_item
    from public.purchase_order_items
    where id=(v_item->>'purchase_order_item_id')::uuid and purchase_order_id=p_purchase_order_id
    for update;

    if not found then
      raise exception 'purchase order item not found';
    end if;

    v_remaining := v_po_item.quantity - v_po_item.quantity_received;
    if v_qty <= 0 or v_qty > v_remaining then
      raise exception 'received quantity exceeds remaining';
    end if;

    insert into public.purchase_receipt_items(
      receipt_id, purchase_order_item_id, product_id, description, quantity_received,
      unit_cost, lot_no, serial_no, barcode, sort_order
    )
    values(
      v_receipt_id, v_po_item.id, v_po_item.product_id, v_po_item.description, v_qty,
      v_po_item.unit_cost, nullif(v_item->>'lot_no',''), nullif(v_item->>'serial_no',''), nullif(v_item->>'barcode',''),
      coalesce((v_item->>'sort_order')::integer, 0)
    );

    update public.purchase_order_items
    set quantity_received = quantity_received + v_qty
    where id=v_po_item.id;
  end loop;

  select not exists(
    select 1 from public.purchase_order_items
    where purchase_order_id=p_purchase_order_id and quantity_received < quantity
  ) into v_all_received;

  update public.purchase_orders
  set status = case when v_all_received then 'RECEIVED' else 'PARTIALLY_RECEIVED' end
  where id=p_purchase_order_id;

  insert into public.purchase_order_events(purchase_order_id,event_type,from_status,to_status,message,created_by)
  values(p_purchase_order_id,'RECEIVED',v_po.status,case when v_all_received then 'RECEIVED' else 'PARTIALLY_RECEIVED' end,'รับสินค้าเข้าคลัง',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'purchase_receipt',v_receipt_id,'posted',jsonb_build_object('document_no',v_receipt_no,'purchase_order_id',p_purchase_order_id,'stock_movement_id',v_stock_movement_id));

  return v_receipt_id;
end;
$$;
