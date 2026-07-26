-- VTN Business Phase 6.4 / Inventory external report schema and analytics
-- Run after phase-6.3.sql

create table if not exists public.external_inventory_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  dealer_id uuid not null references public.customers(id),
  period_month text not null check(period_month ~ '^\d{4}-\d{2}$'),
  source_channel text not null default 'CSV' check(source_channel in ('CSV','MANUAL','API','OTHER')),
  status text not null default 'IMPORTED' check(status in ('IMPORTED','VOID')),
  notes text,
  total_stock_on_hand numeric(18,4) not null default 0,
  total_inbound_qty numeric(18,4) not null default 0,
  total_outbound_qty numeric(18,4) not null default 0,
  total_adjustment_qty numeric(18,4) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, dealer_id, period_month)
);

create table if not exists public.external_inventory_report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.external_inventory_reports(id) on delete cascade,
  product_id uuid references public.products(id),
  product_sku text,
  stock_on_hand numeric(18,4) not null default 0,
  inbound_qty numeric(18,4) not null default 0,
  outbound_qty numeric(18,4) not null default 0,
  adjustment_qty numeric(18,4) not null default 0,
  sort_order integer not null default 0
);

create or replace trigger external_inventory_reports_updated_at
before update on public.external_inventory_reports
for each row execute function public.set_updated_at();

alter table public.external_inventory_reports enable row level security;
alter table public.external_inventory_report_items enable row level security;

drop policy if exists "external inventory reports read membership" on public.external_inventory_reports;
drop policy if exists "external inventory reports manage" on public.external_inventory_reports;
drop policy if exists "external inventory items read membership" on public.external_inventory_report_items;
drop policy if exists "external inventory items insert manage" on public.external_inventory_report_items;

create policy "external inventory reports read membership" on public.external_inventory_reports
for select to authenticated using(public.is_company_member(company_id));

create policy "external inventory reports manage" on public.external_inventory_reports
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "external inventory items read membership" on public.external_inventory_report_items
for select to authenticated using(
  exists(select 1 from public.external_inventory_reports r where r.id=report_id and public.is_company_member(r.company_id))
);

create policy "external inventory items insert manage" on public.external_inventory_report_items
for insert to authenticated with check(
  exists(select 1 from public.external_inventory_reports r where r.id=report_id and public.can_manage_company(r.company_id))
);

create index if not exists external_inventory_reports_company_month_idx on public.external_inventory_reports(company_id, period_month desc);
create index if not exists external_inventory_reports_dealer_idx on public.external_inventory_reports(company_id, dealer_id, period_month desc);
create index if not exists external_inventory_items_report_idx on public.external_inventory_report_items(report_id, sort_order);
create index if not exists external_inventory_items_product_idx on public.external_inventory_report_items(product_id);

create or replace function public.create_external_inventory_report(
  p_company_id uuid,
  p_dealer_id uuid,
  p_period_month text,
  p_source_channel text,
  p_notes text,
  p_items jsonb,
  p_total_stock_on_hand numeric,
  p_total_inbound_qty numeric,
  p_total_outbound_qty numeric,
  p_total_adjustment_qty numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report_id uuid;
  v_item jsonb;
  v_actor uuid := auth.uid();
  v_source_channel text := upper(trim(coalesce(p_source_channel, 'CSV')));
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_period_month is null or p_period_month !~ '^\d{4}-\d{2}$' then
    raise exception 'invalid inventory period month';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'inventory items are required';
  end if;

  if v_source_channel not in ('CSV','MANUAL','API','OTHER') then
    raise exception 'invalid inventory source channel';
  end if;

  if not exists(select 1 from public.customers c where c.id=p_dealer_id and c.company_id=p_company_id and c.is_active=true) then
    raise exception 'dealer does not belong to company';
  end if;

  insert into public.external_inventory_reports(
    company_id,dealer_id,period_month,source_channel,status,notes,total_stock_on_hand,
    total_inbound_qty,total_outbound_qty,total_adjustment_qty,created_by
  )
  values(
    p_company_id,p_dealer_id,p_period_month,v_source_channel,'IMPORTED',p_notes,
    p_total_stock_on_hand,p_total_inbound_qty,p_total_outbound_qty,p_total_adjustment_qty,v_actor
  )
  on conflict(company_id, dealer_id, period_month)
  do update set source_channel = excluded.source_channel,
                status = 'IMPORTED',
                notes = excluded.notes,
                total_stock_on_hand = excluded.total_stock_on_hand,
                total_inbound_qty = excluded.total_inbound_qty,
                total_outbound_qty = excluded.total_outbound_qty,
                total_adjustment_qty = excluded.total_adjustment_qty,
                updated_at = now()
  returning id into v_report_id;

  delete from public.external_inventory_report_items where report_id = v_report_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.external_inventory_report_items(
      report_id, product_id, product_sku, stock_on_hand, inbound_qty, outbound_qty, adjustment_qty, sort_order
    )
    values(
      v_report_id,
      nullif(v_item->>'product_id','')::uuid,
      nullif(trim(coalesce(v_item->>'product_sku','')), ''),
      (v_item->>'stock_on_hand')::numeric,
      (v_item->>'inbound_qty')::numeric,
      (v_item->>'outbound_qty')::numeric,
      (v_item->>'adjustment_qty')::numeric,
      (v_item->>'sort_order')::integer
    );
  end loop;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'external_inventory_report',
    v_report_id,
    'upserted',
    jsonb_build_object('dealer_id', p_dealer_id, 'period_month', p_period_month, 'total_stock_on_hand', p_total_stock_on_hand)
  );

  return v_report_id;
end;
$$;
