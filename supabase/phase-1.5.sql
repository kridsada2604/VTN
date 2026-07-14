-- VTN Business Phase 1.5 / Sprint 7 invoice, payment, document engine foundation
-- Run after phase-1.4.sql

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  document_no text not null,
  invoice_date date not null default current_date,
  due_date date,
  status text not null default 'ISSUED' check(status in ('ISSUED','PARTIALLY_PAID','PAID','VOID')),
  payment_terms text,
  currency_code text not null default 'THB',
  notes text,
  subtotal numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  paid_amount numeric(18,2) not null default 0,
  balance_amount numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.sales_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  product_id uuid references public.products(id),
  description text not null,
  quantity numeric(18,4) not null default 1 check(quantity > 0),
  unit_price numeric(18,2) not null default 0,
  discount_percent numeric(7,4) not null default 0,
  tax_rate numeric(7,4) not null default 7,
  line_subtotal numeric(18,2) not null default 0,
  line_discount numeric(18,2) not null default 0,
  line_tax numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  sort_order integer not null default 0
);

create table if not exists public.sales_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  payment_no text not null,
  payment_date date not null default current_date,
  method text not null check(method in ('CASH','BANK_TRANSFER','CHEQUE','CREDIT_CARD','OTHER')),
  amount numeric(18,2) not null check(amount > 0),
  reference_no text,
  notes text,
  received_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(company_id, payment_no)
);

create table if not exists public.sales_invoice_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace trigger sales_invoices_updated_at
before update on public.sales_invoices
for each row execute function public.set_updated_at();

alter table public.audit_logs enable row level security;
alter table public.sales_invoices enable row level security;
alter table public.sales_invoice_items enable row level security;
alter table public.sales_invoice_payments enable row level security;
alter table public.sales_invoice_events enable row level security;

drop policy if exists "audit logs read membership" on public.audit_logs;
drop policy if exists "invoices read membership" on public.sales_invoices;
drop policy if exists "invoice items read membership" on public.sales_invoice_items;
drop policy if exists "invoice payments read membership" on public.sales_invoice_payments;
drop policy if exists "invoice events read membership" on public.sales_invoice_events;
drop policy if exists "invoices insert manage" on public.sales_invoices;
drop policy if exists "invoices update manage" on public.sales_invoices;
drop policy if exists "invoice items insert manage" on public.sales_invoice_items;
drop policy if exists "invoice payments insert manage" on public.sales_invoice_payments;
drop policy if exists "invoice events insert manage" on public.sales_invoice_events;

create policy "audit logs read membership" on public.audit_logs
for select to authenticated using(company_id is not null and public.is_company_member(company_id));

create policy "invoices read membership" on public.sales_invoices
for select to authenticated using(public.is_company_member(company_id));

create policy "invoice items read membership" on public.sales_invoice_items
for select to authenticated using(
  exists(select 1 from public.sales_invoices i where i.id=invoice_id and public.is_company_member(i.company_id))
);

create policy "invoice payments read membership" on public.sales_invoice_payments
for select to authenticated using(public.is_company_member(company_id));

create policy "invoice events read membership" on public.sales_invoice_events
for select to authenticated using(
  exists(select 1 from public.sales_invoices i where i.id=invoice_id and public.is_company_member(i.company_id))
);

create policy "invoices insert manage" on public.sales_invoices
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "invoices update manage" on public.sales_invoices
for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "invoice items insert manage" on public.sales_invoice_items
for insert to authenticated with check(
  exists(select 1 from public.sales_invoices i where i.id=invoice_id and public.can_manage_company(i.company_id))
);

create policy "invoice payments insert manage" on public.sales_invoice_payments
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "invoice events insert manage" on public.sales_invoice_events
for insert to authenticated with check(
  exists(select 1 from public.sales_invoices i where i.id=invoice_id and public.can_manage_company(i.company_id))
);

create index if not exists sales_invoices_company_date_idx on public.sales_invoices(company_id, invoice_date desc);
create index if not exists sales_invoices_customer_idx on public.sales_invoices(customer_id);
create index if not exists sales_invoices_status_idx on public.sales_invoices(company_id, status, invoice_date desc);
create index if not exists sales_invoice_items_invoice_idx on public.sales_invoice_items(invoice_id, sort_order);
create index if not exists sales_invoice_payments_invoice_idx on public.sales_invoice_payments(invoice_id, payment_date desc);
create index if not exists sales_invoice_events_invoice_idx on public.sales_invoice_events(invoice_id, created_at desc);
create index if not exists audit_logs_company_created_idx on public.audit_logs(company_id, created_at desc);

create or replace function public.create_sales_invoice(
  p_company_id uuid,
  p_customer_id uuid,
  p_invoice_date date,
  p_due_date date,
  p_payment_terms text,
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
  v_invoice_id uuid;
  v_document_no text;
  v_item jsonb;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'invoice items are required';
  end if;

  if not exists(select 1 from public.customers c where c.id=p_customer_id and c.company_id=p_company_id) then
    raise exception 'customer does not belong to company';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'INVOICE', 'INV');

  insert into public.sales_invoices(
    company_id, customer_id, document_no, invoice_date, due_date, status,
    payment_terms, currency_code, notes, subtotal, discount_amount,
    tax_amount, total_amount, paid_amount, balance_amount, created_by
  )
  values(
    p_company_id, p_customer_id, v_document_no, p_invoice_date, p_due_date, 'ISSUED',
    p_payment_terms, coalesce(nullif(p_currency_code,''),'THB'), p_notes,
    p_subtotal, p_discount_amount, p_tax_amount, p_total_amount, 0, p_total_amount, v_actor
  )
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.sales_invoice_items(
      invoice_id, product_id, description, quantity, unit_price, discount_percent,
      tax_rate, line_subtotal, line_discount, line_tax, line_total, sort_order
    )
    values(
      v_invoice_id,
      nullif(v_item->>'product_id','')::uuid,
      v_item->>'description',
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_price')::numeric,
      (v_item->>'discount_percent')::numeric,
      (v_item->>'tax_rate')::numeric,
      (v_item->>'line_subtotal')::numeric,
      (v_item->>'line_discount')::numeric,
      (v_item->>'line_tax')::numeric,
      (v_item->>'line_total')::numeric,
      (v_item->>'sort_order')::integer
    );
  end loop;

  insert into public.sales_invoice_events(invoice_id,event_type,from_status,to_status,message,created_by)
  values(v_invoice_id,'CREATED',null,'ISSUED','สร้างใบแจ้งหนี้',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_invoice',v_invoice_id,'created',jsonb_build_object('document_no',v_document_no,'total_amount',p_total_amount));

  return v_invoice_id;
end;
$$;

create or replace function public.receive_invoice_payment(
  p_company_id uuid,
  p_invoice_id uuid,
  p_payment_date date,
  p_method text,
  p_amount numeric,
  p_reference_no text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.sales_invoices%rowtype;
  v_payment_id uuid;
  v_payment_no text;
  v_new_paid numeric(18,2);
  v_new_balance numeric(18,2);
  v_new_status text;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_amount <= 0 then
    raise exception 'payment amount must be greater than zero';
  end if;

  select * into v_invoice
  from public.sales_invoices
  where id=p_invoice_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'invoice not found';
  end if;

  if v_invoice.status = 'VOID' then
    raise exception 'void invoice cannot receive payment';
  end if;

  if p_amount > v_invoice.balance_amount then
    raise exception 'payment amount exceeds balance';
  end if;

  v_payment_no := public.next_document_number(p_company_id, 'RECEIVE_PAYMENT', 'RC');
  v_new_paid := v_invoice.paid_amount + p_amount;
  v_new_balance := v_invoice.total_amount - v_new_paid;
  v_new_status := case when v_new_balance <= 0 then 'PAID' else 'PARTIALLY_PAID' end;

  insert into public.sales_invoice_payments(
    company_id, invoice_id, payment_no, payment_date, method, amount,
    reference_no, notes, received_by
  )
  values(
    p_company_id, p_invoice_id, v_payment_no, p_payment_date, p_method, p_amount,
    p_reference_no, p_notes, v_actor
  )
  returning id into v_payment_id;

  update public.sales_invoices
  set paid_amount=v_new_paid, balance_amount=v_new_balance, status=v_new_status
  where id=p_invoice_id;

  insert into public.sales_invoice_events(invoice_id,event_type,from_status,to_status,message,created_by)
  values(p_invoice_id,'PAYMENT_RECEIVED',v_invoice.status,v_new_status,'รับชำระเงิน ' || p_amount::text,v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_invoice',p_invoice_id,'payment_received',jsonb_build_object('payment_id',v_payment_id,'payment_no',v_payment_no,'amount',p_amount));

  return v_payment_id;
end;
$$;
