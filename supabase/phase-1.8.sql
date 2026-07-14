-- VTN Business Phase 1.8 / Sprint 10 purchase order foundation
-- Run after phase-1.7.sql

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  document_no text not null,
  order_date date not null default current_date,
  expected_date date,
  status text not null default 'ISSUED' check(status in ('DRAFT','ISSUED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED')),
  currency_code text not null default 'THB',
  notes text,
  subtotal numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id),
  description text not null,
  quantity numeric(18,4) not null default 1 check(quantity > 0),
  unit_cost numeric(18,4) not null default 0,
  discount_percent numeric(7,4) not null default 0,
  tax_rate numeric(7,4) not null default 7,
  line_subtotal numeric(18,2) not null default 0,
  line_discount numeric(18,2) not null default 0,
  line_tax numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  quantity_received numeric(18,4) not null default 0,
  sort_order integer not null default 0
);

create table if not exists public.purchase_order_events (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace trigger purchase_orders_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.purchase_order_events enable row level security;

drop policy if exists "purchase orders read membership" on public.purchase_orders;
drop policy if exists "purchase order items read membership" on public.purchase_order_items;
drop policy if exists "purchase order events read membership" on public.purchase_order_events;
drop policy if exists "purchase orders insert manage" on public.purchase_orders;
drop policy if exists "purchase order items insert manage" on public.purchase_order_items;
drop policy if exists "purchase order events insert manage" on public.purchase_order_events;

create policy "purchase orders read membership" on public.purchase_orders
for select to authenticated using(public.is_company_member(company_id));

create policy "purchase order items read membership" on public.purchase_order_items
for select to authenticated using(
  exists(select 1 from public.purchase_orders p where p.id=purchase_order_id and public.is_company_member(p.company_id))
);

create policy "purchase order events read membership" on public.purchase_order_events
for select to authenticated using(
  exists(select 1 from public.purchase_orders p where p.id=purchase_order_id and public.is_company_member(p.company_id))
);

create policy "purchase orders insert manage" on public.purchase_orders
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "purchase order items insert manage" on public.purchase_order_items
for insert to authenticated with check(
  exists(select 1 from public.purchase_orders p where p.id=purchase_order_id and public.can_manage_company(p.company_id))
);

create policy "purchase order events insert manage" on public.purchase_order_events
for insert to authenticated with check(
  exists(select 1 from public.purchase_orders p where p.id=purchase_order_id and public.can_manage_company(p.company_id))
);

create index if not exists purchase_orders_company_date_idx on public.purchase_orders(company_id, order_date desc);
create index if not exists purchase_orders_supplier_idx on public.purchase_orders(supplier_id);
create index if not exists purchase_order_items_po_idx on public.purchase_order_items(purchase_order_id, sort_order);
create index if not exists purchase_order_events_po_idx on public.purchase_order_events(purchase_order_id, created_at desc);

create or replace function public.create_purchase_order(
  p_company_id uuid,
  p_supplier_id uuid,
  p_order_date date,
  p_expected_date date,
  p_currency_code text,
  p_notes text,
  p_items jsonb,
  p_subtotal numeric,
  p_discount_amount numeric,
  p_tax_amount numeric,
  p_total_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_po_id uuid;
  v_document_no text;
  v_item jsonb;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'purchase order items are required';
  end if;

  if not exists(select 1 from public.suppliers s where s.id=p_supplier_id and s.company_id=p_company_id) then
    raise exception 'supplier does not belong to company';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'PURCHASE_ORDER', 'PO');

  insert into public.purchase_orders(
    company_id, supplier_id, document_no, order_date, expected_date, status,
    currency_code, notes, subtotal, discount_amount, tax_amount, total_amount, created_by
  )
  values(
    p_company_id, p_supplier_id, v_document_no, p_order_date, p_expected_date, 'ISSUED',
    coalesce(nullif(p_currency_code,''),'THB'), p_notes, p_subtotal, p_discount_amount, p_tax_amount, p_total_amount, v_actor
  )
  returning id into v_po_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.purchase_order_items(
      purchase_order_id, product_id, description, quantity, unit_cost, discount_percent, tax_rate,
      line_subtotal, line_discount, line_tax, line_total, sort_order
    )
    values(
      v_po_id,
      nullif(v_item->>'product_id','')::uuid,
      v_item->>'description',
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_cost')::numeric,
      (v_item->>'discount_percent')::numeric,
      (v_item->>'tax_rate')::numeric,
      (v_item->>'line_subtotal')::numeric,
      (v_item->>'line_discount')::numeric,
      (v_item->>'line_tax')::numeric,
      (v_item->>'line_total')::numeric,
      (v_item->>'sort_order')::integer
    );
  end loop;

  insert into public.purchase_order_events(purchase_order_id,event_type,from_status,to_status,message,created_by)
  values(v_po_id,'CREATED',null,'ISSUED','สร้างใบสั่งซื้อ',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'purchase_order',v_po_id,'created',jsonb_build_object('document_no',v_document_no,'total_amount',p_total_amount));

  return v_po_id;
end;
$$;
