-- VTN Business Phase 2.3 / Sprint 14 POS foundation
-- Run after phase-2.2.sql

create table if not exists public.pos_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  warehouse_id uuid not null references public.warehouses(id),
  opened_by uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash numeric(18,2) not null default 0,
  closing_cash numeric(18,2),
  status text not null default 'OPEN' check(status in ('OPEN','CLOSED')),
  notes text
);

create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  session_id uuid references public.pos_sessions(id) on delete set null,
  warehouse_id uuid not null references public.warehouses(id),
  customer_id uuid references public.customers(id) on delete set null,
  sale_no text not null,
  sale_date date not null default current_date,
  status text not null default 'PAID' check(status in ('DRAFT','PAID','VOID','REFUNDED')),
  payment_method text not null default 'CASH' check(payment_method in ('CASH','TRANSFER','CARD','QR','MIXED')),
  subtotal numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  paid_amount numeric(18,2) not null default 0,
  change_amount numeric(18,2) not null default 0,
  stock_movement_id uuid references public.stock_movements(id),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, sale_no)
);

create table if not exists public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  description text not null,
  quantity numeric(18,4) not null check(quantity > 0),
  unit_price numeric(18,4) not null default 0,
  line_discount numeric(18,2) not null default 0,
  line_tax numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  barcode text,
  sort_order integer not null default 0
);

create table if not exists public.pos_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  payment_method text not null,
  amount numeric(18,2) not null check(amount > 0),
  reference_no text,
  created_at timestamptz not null default now()
);

create or replace trigger pos_sales_updated_at
before update on public.pos_sales
for each row execute function public.set_updated_at();

alter table public.pos_sessions enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;
alter table public.pos_payments enable row level security;

drop policy if exists "pos sessions read membership" on public.pos_sessions;
drop policy if exists "pos sales read membership" on public.pos_sales;
drop policy if exists "pos sale items read membership" on public.pos_sale_items;
drop policy if exists "pos payments read membership" on public.pos_payments;
drop policy if exists "pos sessions manage" on public.pos_sessions;
drop policy if exists "pos sales insert manage" on public.pos_sales;
drop policy if exists "pos sale items insert manage" on public.pos_sale_items;
drop policy if exists "pos payments insert manage" on public.pos_payments;

create policy "pos sessions read membership" on public.pos_sessions
for select to authenticated using(public.is_company_member(company_id));

create policy "pos sales read membership" on public.pos_sales
for select to authenticated using(public.is_company_member(company_id));

create policy "pos sale items read membership" on public.pos_sale_items
for select to authenticated using(
  exists(select 1 from public.pos_sales s where s.id=sale_id and public.is_company_member(s.company_id))
);

create policy "pos payments read membership" on public.pos_payments
for select to authenticated using(
  exists(select 1 from public.pos_sales s where s.id=sale_id and public.is_company_member(s.company_id))
);

create policy "pos sessions manage" on public.pos_sessions
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "pos sales insert manage" on public.pos_sales
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "pos sale items insert manage" on public.pos_sale_items
for insert to authenticated with check(
  exists(select 1 from public.pos_sales s where s.id=sale_id and public.can_manage_company(s.company_id))
);

create policy "pos payments insert manage" on public.pos_payments
for insert to authenticated with check(
  exists(select 1 from public.pos_sales s where s.id=sale_id and public.can_manage_company(s.company_id))
);

create index if not exists pos_sessions_company_status_idx on public.pos_sessions(company_id, status, opened_at desc);
create index if not exists pos_sales_company_date_idx on public.pos_sales(company_id, sale_date desc, created_at desc);
create index if not exists pos_sales_customer_idx on public.pos_sales(customer_id);
create index if not exists pos_sale_items_sale_idx on public.pos_sale_items(sale_id, sort_order);
create index if not exists pos_sale_items_product_idx on public.pos_sale_items(product_id);
create index if not exists pos_payments_sale_idx on public.pos_payments(sale_id);

create or replace function public.create_pos_sale(
  p_company_id uuid,
  p_session_id uuid,
  p_warehouse_id uuid,
  p_customer_id uuid,
  p_sale_date date,
  p_payment_method text,
  p_paid_amount numeric,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale_id uuid;
  v_sale_no text;
  v_stock_movement_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(18,4);
  v_unit_price numeric(18,4);
  v_line_subtotal numeric(18,2);
  v_line_discount numeric(18,2);
  v_line_tax numeric(18,2);
  v_line_total numeric(18,2);
  v_subtotal numeric(18,2) := 0;
  v_discount numeric(18,2) := 0;
  v_tax numeric(18,2) := 0;
  v_total numeric(18,2) := 0;
  v_stock_items jsonb := '[]'::jsonb;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'POS sale items are required';
  end if;

  if not exists(select 1 from public.warehouses w where w.id=p_warehouse_id and w.company_id=p_company_id and w.is_active=true) then
    raise exception 'warehouse does not belong to company';
  end if;

  if p_customer_id is not null and not exists(select 1 from public.customers c where c.id=p_customer_id and c.company_id=p_company_id) then
    raise exception 'customer does not belong to company';
  end if;

  if p_session_id is not null and not exists(select 1 from public.pos_sessions s where s.id=p_session_id and s.company_id=p_company_id and s.status='OPEN') then
    raise exception 'POS session is not open';
  end if;

  v_sale_no := public.next_document_number(p_company_id, 'POS_SALE', 'POS');

  insert into public.pos_sales(
    company_id, session_id, warehouse_id, customer_id, sale_no, sale_date,
    status, payment_method, paid_amount, notes, created_by
  )
  values(
    p_company_id, p_session_id, p_warehouse_id, p_customer_id, v_sale_no, p_sale_date,
    'PAID', p_payment_method, p_paid_amount, p_notes, v_actor
  )
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unit_price')::numeric;

    if v_qty <= 0 or v_unit_price < 0 then
      raise exception 'invalid POS item quantity or price';
    end if;

    select * into v_product
    from public.products
    where id=(v_item->>'product_id')::uuid and company_id=p_company_id and is_active=true;

    if not found then
      raise exception 'product does not belong to company';
    end if;

    v_line_subtotal := round((v_qty * v_unit_price)::numeric, 2);
    v_line_discount := round(coalesce(nullif(v_item->>'line_discount','')::numeric, 0), 2);
    v_line_tax := round(coalesce(nullif(v_item->>'line_tax','')::numeric, 0), 2);
    v_line_total := round((v_line_subtotal - v_line_discount + v_line_tax)::numeric, 2);

    if v_line_discount < 0 or v_line_tax < 0 or v_line_total < 0 then
      raise exception 'invalid POS item totals';
    end if;

    insert into public.pos_sale_items(
      sale_id, product_id, description, quantity, unit_price, line_discount, line_tax, line_total, barcode, sort_order
    )
    values(
      v_sale_id, v_product.id, coalesce(nullif(v_item->>'description',''), v_product.name),
      v_qty, v_unit_price, v_line_discount, v_line_tax, v_line_total,
      coalesce(nullif(v_item->>'barcode',''), v_product.barcode),
      coalesce((v_item->>'sort_order')::integer, 0)
    );

    v_subtotal := v_subtotal + v_line_subtotal;
    v_discount := v_discount + v_line_discount;
    v_tax := v_tax + v_line_tax;
    v_total := v_total + v_line_total;
    v_stock_items := v_stock_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'quantity', v_qty,
      'unit_cost', 0,
      'barcode', coalesce(nullif(v_item->>'barcode',''), v_product.barcode),
      'sort_order', coalesce((v_item->>'sort_order')::integer, 0)
    ));
  end loop;

  if p_paid_amount < v_total then
    raise exception 'paid amount is less than sale total';
  end if;

  v_stock_movement_id := public.post_stock_movement(
    p_company_id,
    p_warehouse_id,
    p_sale_date,
    'ISSUE',
    'POS sale ' || v_sale_no,
    v_stock_items
  );

  update public.pos_sales
  set subtotal=v_subtotal,
      discount_amount=v_discount,
      tax_amount=v_tax,
      total_amount=v_total,
      paid_amount=p_paid_amount,
      change_amount=round((p_paid_amount - v_total)::numeric, 2),
      stock_movement_id=v_stock_movement_id
  where id=v_sale_id;

  insert into public.pos_payments(sale_id, payment_method, amount)
  values(v_sale_id, p_payment_method, p_paid_amount);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'pos_sale',v_sale_id,'created',jsonb_build_object('sale_no',v_sale_no,'total_amount',v_total,'stock_movement_id',v_stock_movement_id));

  return v_sale_id;
end;
$$;
