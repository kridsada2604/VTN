-- VTN Business Phase 5.2 / Sale Out dealer sales foundation
-- Run after phase-5.1.sql

create table if not exists public.sales_out_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  dealer_id uuid not null references public.customers(id),
  salesperson_id uuid references public.profiles(id),
  document_no text not null,
  report_date date not null default current_date,
  period_start date not null,
  period_end date not null,
  source_channel text not null default 'DEALER' check(source_channel in ('DEALER','MARKETPLACE','POS','MANUAL','OTHER')),
  status text not null default 'SUBMITTED' check(status in ('DRAFT','SUBMITTED','APPROVED','CANCELLED')),
  currency_code text not null default 'THB',
  notes text,
  gross_amount numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  net_amount numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.sales_out_report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.sales_out_reports(id) on delete cascade,
  product_id uuid references public.products(id),
  dealer_sku text,
  description text not null,
  quantity numeric(18,4) not null check(quantity > 0),
  unit_price numeric(18,4) not null default 0,
  line_discount numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  sort_order integer not null default 0
);

create or replace trigger sales_out_reports_updated_at
before update on public.sales_out_reports
for each row execute function public.set_updated_at();

alter table public.sales_out_reports enable row level security;
alter table public.sales_out_report_items enable row level security;

drop policy if exists "sales out reports read membership" on public.sales_out_reports;
drop policy if exists "sales out reports manage" on public.sales_out_reports;
drop policy if exists "sales out items read membership" on public.sales_out_report_items;
drop policy if exists "sales out items insert manage" on public.sales_out_report_items;

create policy "sales out reports read membership" on public.sales_out_reports
for select to authenticated using(public.is_company_member(company_id));

create policy "sales out reports manage" on public.sales_out_reports
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "sales out items read membership" on public.sales_out_report_items
for select to authenticated using(
  exists(select 1 from public.sales_out_reports r where r.id=report_id and public.is_company_member(r.company_id))
);

create policy "sales out items insert manage" on public.sales_out_report_items
for insert to authenticated with check(
  exists(select 1 from public.sales_out_reports r where r.id=report_id and public.can_manage_company(r.company_id))
);

create index if not exists sales_out_reports_company_date_idx on public.sales_out_reports(company_id, report_date desc);
create index if not exists sales_out_reports_dealer_idx on public.sales_out_reports(company_id, dealer_id, period_start, period_end);
create index if not exists sales_out_reports_salesperson_idx on public.sales_out_reports(company_id, salesperson_id, report_date desc);
create index if not exists sales_out_report_items_report_idx on public.sales_out_report_items(report_id, sort_order);
create index if not exists sales_out_report_items_product_idx on public.sales_out_report_items(product_id);

create or replace function public.create_sales_out_report(
  p_company_id uuid,
  p_dealer_id uuid,
  p_salesperson_id uuid,
  p_report_date date,
  p_period_start date,
  p_period_end date,
  p_source_channel text,
  p_currency_code text,
  p_notes text,
  p_items jsonb,
  p_gross_amount numeric,
  p_discount_amount numeric,
  p_net_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report_id uuid;
  v_document_no text;
  v_item jsonb;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'sale out items are required';
  end if;

  if p_period_start > p_period_end then
    raise exception 'period start must be before period end';
  end if;

  if not exists(select 1 from public.customers c where c.id=p_dealer_id and c.company_id=p_company_id and c.is_active=true) then
    raise exception 'dealer does not belong to company';
  end if;

  if p_salesperson_id is not null and not exists(
    select 1 from public.company_memberships m where m.company_id=p_company_id and m.user_id=p_salesperson_id
  ) then
    raise exception 'salesperson does not belong to company';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'SALE_OUT', 'SO');

  insert into public.sales_out_reports(
    company_id, dealer_id, salesperson_id, document_no, report_date, period_start,
    period_end, source_channel, status, currency_code, notes, gross_amount,
    discount_amount, net_amount, created_by
  )
  values(
    p_company_id, p_dealer_id, p_salesperson_id, v_document_no, p_report_date, p_period_start,
    p_period_end, upper(trim(coalesce(p_source_channel,'DEALER'))), 'SUBMITTED',
    coalesce(nullif(p_currency_code,''),'THB'), p_notes, p_gross_amount,
    p_discount_amount, p_net_amount, v_actor
  )
  returning id into v_report_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if trim(coalesce(v_item->>'description','')) = '' or (v_item->>'quantity')::numeric <= 0 then
      raise exception 'invalid sale out item';
    end if;

    insert into public.sales_out_report_items(
      report_id, product_id, dealer_sku, description, quantity, unit_price,
      line_discount, line_total, sort_order
    )
    values(
      v_report_id,
      nullif(v_item->>'product_id','')::uuid,
      nullif(trim(coalesce(v_item->>'dealer_sku','')), ''),
      trim(v_item->>'description'),
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_price')::numeric,
      (v_item->>'line_discount')::numeric,
      (v_item->>'line_total')::numeric,
      (v_item->>'sort_order')::integer
    );
  end loop;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'sales_out_report',
    v_report_id,
    'created',
    jsonb_build_object('document_no',v_document_no,'dealer_id',p_dealer_id,'salesperson_id',p_salesperson_id,'net_amount',p_net_amount)
  );

  return v_report_id;
end;
$$;
