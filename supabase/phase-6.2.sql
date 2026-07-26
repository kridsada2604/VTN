-- VTN Business Phase 6.2 / Dealer target vs actual analysis
-- Run after phase-6.1.sql

create table if not exists public.sales_dealer_targets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  dealer_id uuid not null references public.customers(id),
  period_start date not null,
  period_end date not null,
  target_amount numeric(18,2) not null default 0 check(target_amount >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, dealer_id, period_start, period_end)
);

create or replace trigger sales_dealer_targets_updated_at
before update on public.sales_dealer_targets
for each row execute function public.set_updated_at();

alter table public.sales_dealer_targets enable row level security;

drop policy if exists "dealer targets read membership" on public.sales_dealer_targets;
drop policy if exists "dealer targets manage" on public.sales_dealer_targets;

create policy "dealer targets read membership" on public.sales_dealer_targets
for select to authenticated using(public.is_company_member(company_id));

create policy "dealer targets manage" on public.sales_dealer_targets
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create index if not exists sales_dealer_targets_company_period_idx on public.sales_dealer_targets(company_id, period_start, period_end);
create index if not exists sales_dealer_targets_dealer_idx on public.sales_dealer_targets(company_id, dealer_id);

create or replace function public.upsert_sales_dealer_target(
  p_company_id uuid,
  p_dealer_id uuid,
  p_period_start date,
  p_period_end date,
  p_target_amount numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_target_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_period_start is null or p_period_end is null or p_period_start > p_period_end then
    raise exception 'invalid target period';
  end if;

  if coalesce(p_target_amount, 0) < 0 then
    raise exception 'target amount cannot be negative';
  end if;

  if not exists(select 1 from public.customers c where c.id = p_dealer_id and c.company_id = p_company_id and c.is_active = true) then
    raise exception 'dealer does not belong to company';
  end if;

  insert into public.sales_dealer_targets(company_id,dealer_id,period_start,period_end,target_amount,notes,created_by)
  values(p_company_id, p_dealer_id, p_period_start, p_period_end, coalesce(p_target_amount, 0), nullif(trim(coalesce(p_notes, '')), ''), v_actor)
  on conflict(company_id, dealer_id, period_start, period_end)
  do update set target_amount = excluded.target_amount,
                notes = excluded.notes,
                updated_at = now()
  returning id into v_target_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'sales_dealer_target',
    v_target_id,
    'upserted',
    jsonb_build_object('dealer_id', p_dealer_id, 'period_start', p_period_start, 'period_end', p_period_end, 'target_amount', coalesce(p_target_amount, 0))
  );

  return v_target_id;
end;
$$;
