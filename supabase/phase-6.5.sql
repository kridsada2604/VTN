-- VTN Business Phase 6.5 / Month of Inventory analytics
-- Run after phase-6.4.sql

create table if not exists public.month_of_inventory_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  dealer_id uuid not null references public.customers(id),
  period_month text not null check(period_month ~ '^\d{4}-\d{2}$'),
  source_channel text not null default 'CSV' check(source_channel in ('CSV','MANUAL','API','OTHER')),
  status text not null default 'IMPORTED' check(status in ('IMPORTED','VOID')),
  notes text,
  total_stock_on_hand numeric(18,4) not null default 0,
  total_average_monthly_sale_out numeric(18,4) not null default 0,
  average_month_of_inventory numeric(18,4) not null default 0,
  reorder_count integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, dealer_id, period_month)
);

create table if not exists public.month_of_inventory_report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.month_of_inventory_reports(id) on delete cascade,
  product_id uuid references public.products(id),
  product_sku text,
  stock_on_hand numeric(18,4) not null default 0,
  average_monthly_sale_out numeric(18,4) not null default 0,
  month_of_inventory numeric(18,4) not null default 0,
  reorder_note text,
  sort_order integer not null default 0
);

create or replace trigger month_of_inventory_reports_updated_at
before update on public.month_of_inventory_reports
for each row execute function public.set_updated_at();

alter table public.month_of_inventory_reports enable row level security;
alter table public.month_of_inventory_report_items enable row level security;

drop policy if exists "moi reports read membership" on public.month_of_inventory_reports;
drop policy if exists "moi reports manage" on public.month_of_inventory_reports;
drop policy if exists "moi items read membership" on public.month_of_inventory_report_items;
drop policy if exists "moi items insert manage" on public.month_of_inventory_report_items;

create policy "moi reports read membership" on public.month_of_inventory_reports
for select to authenticated using(public.is_company_member(company_id));

create policy "moi reports manage" on public.month_of_inventory_reports
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "moi items read membership" on public.month_of_inventory_report_items
for select to authenticated using(
  exists(select 1 from public.month_of_inventory_reports r where r.id=report_id and public.is_company_member(r.company_id))
);

create policy "moi items insert manage" on public.month_of_inventory_report_items
for insert to authenticated with check(
  exists(select 1 from public.month_of_inventory_reports r where r.id=report_id and public.can_manage_company(r.company_id))
);

create index if not exists moi_reports_company_month_idx on public.month_of_inventory_reports(company_id, period_month desc);
create index if not exists moi_reports_dealer_idx on public.month_of_inventory_reports(company_id, dealer_id, period_month desc);
create index if not exists moi_items_report_idx on public.month_of_inventory_report_items(report_id, sort_order);

create or replace function public.create_month_of_inventory_report(
  p_company_id uuid,
  p_dealer_id uuid,
  p_period_month text,
  p_source_channel text,
  p_notes text,
  p_items jsonb,
  p_total_stock_on_hand numeric,
  p_total_average_monthly_sale_out numeric,
  p_average_month_of_inventory numeric,
  p_reorder_count integer
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
  if v_actor is null then raise exception 'authentication required'; end if;
  if not public.can_manage_company(p_company_id) then raise exception 'permission denied'; end if;
  if p_period_month is null or p_period_month !~ '^\d{4}-\d{2}$' then raise exception 'invalid MOI period month'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'MOI items are required'; end if;
  if v_source_channel not in ('CSV','MANUAL','API','OTHER') then raise exception 'invalid MOI source channel'; end if;
  if not exists(select 1 from public.customers c where c.id=p_dealer_id and c.company_id=p_company_id and c.is_active=true) then raise exception 'dealer does not belong to company'; end if;

  insert into public.month_of_inventory_reports(
    company_id,dealer_id,period_month,source_channel,status,notes,total_stock_on_hand,
    total_average_monthly_sale_out,average_month_of_inventory,reorder_count,created_by
  ) values(
    p_company_id,p_dealer_id,p_period_month,v_source_channel,'IMPORTED',p_notes,p_total_stock_on_hand,
    p_total_average_monthly_sale_out,p_average_month_of_inventory,coalesce(p_reorder_count,0),v_actor
  )
  on conflict(company_id, dealer_id, period_month)
  do update set source_channel = excluded.source_channel,
                status = 'IMPORTED',
                notes = excluded.notes,
                total_stock_on_hand = excluded.total_stock_on_hand,
                total_average_monthly_sale_out = excluded.total_average_monthly_sale_out,
                average_month_of_inventory = excluded.average_month_of_inventory,
                reorder_count = excluded.reorder_count,
                updated_at = now()
  returning id into v_report_id;

  delete from public.month_of_inventory_report_items where report_id = v_report_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.month_of_inventory_report_items(
      report_id, product_id, product_sku, stock_on_hand, average_monthly_sale_out, month_of_inventory, reorder_note, sort_order
    ) values(
      v_report_id,
      nullif(v_item->>'product_id','')::uuid,
      nullif(trim(coalesce(v_item->>'product_sku','')), ''),
      (v_item->>'stock_on_hand')::numeric,
      (v_item->>'average_monthly_sale_out')::numeric,
      (v_item->>'month_of_inventory')::numeric,
      nullif(trim(coalesce(v_item->>'reorder_note','')), ''),
      (v_item->>'sort_order')::integer
    );
  end loop;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id, v_actor, 'month_of_inventory_report', v_report_id, 'upserted', jsonb_build_object('dealer_id', p_dealer_id, 'period_month', p_period_month, 'reorder_count', coalesce(p_reorder_count,0)));

  return v_report_id;
end;
$$;
