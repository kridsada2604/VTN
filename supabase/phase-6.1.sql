-- VTN Business Phase 6.1 / Sale Out commission rule engine foundation
-- Run after phase-6.0.sql

create table if not exists public.sales_commission_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  basis text not null default 'SALE_OUT_NET' check(basis in ('SALE_OUT_NET','SALE_OUT_GROSS')),
  rate_percent numeric(7,4) not null default 0 check(rate_percent >= 0 and rate_percent <= 100),
  minimum_base_amount numeric(18,2) not null default 0,
  is_active boolean not null default true,
  effective_from date,
  effective_to date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_commission_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  rule_id uuid not null references public.sales_commission_rules(id),
  period_start date not null,
  period_end date not null,
  status text not null default 'CALCULATED' check(status in ('CALCULATED','APPROVED','CANCELLED')),
  total_base_amount numeric(18,2) not null default 0,
  total_commission_amount numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_commission_run_lines (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.sales_commission_runs(id) on delete cascade,
  salesperson_id uuid references public.profiles(id),
  dealer_id uuid references public.customers(id),
  sale_out_report_id uuid not null references public.sales_out_reports(id),
  base_amount numeric(18,2) not null default 0,
  rate_percent numeric(7,4) not null default 0,
  commission_amount numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(run_id, sale_out_report_id)
);

create or replace trigger sales_commission_rules_updated_at
before update on public.sales_commission_rules
for each row execute function public.set_updated_at();

create or replace trigger sales_commission_runs_updated_at
before update on public.sales_commission_runs
for each row execute function public.set_updated_at();

alter table public.sales_commission_rules enable row level security;
alter table public.sales_commission_runs enable row level security;
alter table public.sales_commission_run_lines enable row level security;

drop policy if exists "commission rules read membership" on public.sales_commission_rules;
drop policy if exists "commission rules manage" on public.sales_commission_rules;
drop policy if exists "commission runs read membership" on public.sales_commission_runs;
drop policy if exists "commission runs manage" on public.sales_commission_runs;
drop policy if exists "commission lines read membership" on public.sales_commission_run_lines;
drop policy if exists "commission lines insert manage" on public.sales_commission_run_lines;

create policy "commission rules read membership" on public.sales_commission_rules
for select to authenticated using(public.is_company_member(company_id));

create policy "commission rules manage" on public.sales_commission_rules
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "commission runs read membership" on public.sales_commission_runs
for select to authenticated using(public.is_company_member(company_id));

create policy "commission runs manage" on public.sales_commission_runs
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "commission lines read membership" on public.sales_commission_run_lines
for select to authenticated using(
  exists(select 1 from public.sales_commission_runs r where r.id=run_id and public.is_company_member(r.company_id))
);

create policy "commission lines insert manage" on public.sales_commission_run_lines
for insert to authenticated with check(
  exists(select 1 from public.sales_commission_runs r where r.id=run_id and public.can_manage_company(r.company_id))
);

create index if not exists sales_commission_rules_company_idx on public.sales_commission_rules(company_id, is_active, effective_from);
create index if not exists sales_commission_runs_company_period_idx on public.sales_commission_runs(company_id, period_start, period_end, created_at desc);
create index if not exists sales_commission_lines_run_idx on public.sales_commission_run_lines(run_id, salesperson_id);

create or replace function public.create_sales_commission_rule(
  p_company_id uuid,
  p_name text,
  p_basis text,
  p_rate_percent numeric,
  p_minimum_base_amount numeric,
  p_effective_from date,
  p_effective_to date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_rule_id uuid;
  v_basis text := upper(trim(coalesce(p_basis, 'SALE_OUT_NET')));
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'commission rule name is required';
  end if;

  if v_basis not in ('SALE_OUT_NET','SALE_OUT_GROSS') then
    raise exception 'invalid commission basis';
  end if;

  if p_rate_percent < 0 or p_rate_percent > 100 then
    raise exception 'commission rate must be between 0 and 100';
  end if;

  if p_effective_from is not null and p_effective_to is not null and p_effective_from > p_effective_to then
    raise exception 'effective from must be before effective to';
  end if;

  insert into public.sales_commission_rules(company_id,name,basis,rate_percent,minimum_base_amount,effective_from,effective_to,created_by)
  values(p_company_id, trim(p_name), v_basis, p_rate_percent, greatest(coalesce(p_minimum_base_amount, 0), 0), p_effective_from, p_effective_to, v_actor)
  returning id into v_rule_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id, v_actor, 'sales_commission_rule', v_rule_id, 'created', jsonb_build_object('name', trim(p_name), 'basis', v_basis, 'rate_percent', p_rate_percent));

  return v_rule_id;
end;
$$;

create or replace function public.create_sales_commission_run(
  p_company_id uuid,
  p_rule_id uuid,
  p_period_start date,
  p_period_end date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_rule public.sales_commission_rules%rowtype;
  v_run_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_period_start is null or p_period_end is null or p_period_start > p_period_end then
    raise exception 'invalid commission period';
  end if;

  select * into v_rule
  from public.sales_commission_rules
  where id = p_rule_id and company_id = p_company_id and is_active = true
  for update;

  if not found then
    raise exception 'active commission rule not found';
  end if;

  insert into public.sales_commission_runs(company_id,rule_id,period_start,period_end,status,created_by)
  values(p_company_id, p_rule_id, p_period_start, p_period_end, 'CALCULATED', v_actor)
  returning id into v_run_id;

  insert into public.sales_commission_run_lines(run_id,salesperson_id,dealer_id,sale_out_report_id,base_amount,rate_percent,commission_amount)
  select
    v_run_id,
    r.salesperson_id,
    r.dealer_id,
    r.id,
    case when v_rule.basis = 'SALE_OUT_GROSS' then r.gross_amount else r.net_amount end,
    v_rule.rate_percent,
    round((case when v_rule.basis = 'SALE_OUT_GROSS' then r.gross_amount else r.net_amount end) * v_rule.rate_percent / 100, 2)
  from public.sales_out_reports r
  where r.company_id = p_company_id
    and r.status = 'APPROVED'
    and r.report_date between p_period_start and p_period_end
    and r.salesperson_id is not null
    and (case when v_rule.basis = 'SALE_OUT_GROSS' then r.gross_amount else r.net_amount end) >= v_rule.minimum_base_amount
    and (v_rule.effective_from is null or r.report_date >= v_rule.effective_from)
    and (v_rule.effective_to is null or r.report_date <= v_rule.effective_to);

  update public.sales_commission_runs run
  set total_base_amount = coalesce((select sum(line.base_amount) from public.sales_commission_run_lines line where line.run_id = v_run_id), 0),
      total_commission_amount = coalesce((select sum(line.commission_amount) from public.sales_commission_run_lines line where line.run_id = v_run_id), 0)
  where run.id = v_run_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'sales_commission_run',
    v_run_id,
    'created',
    jsonb_build_object('rule_id', p_rule_id, 'period_start', p_period_start, 'period_end', p_period_end)
  );

  return v_run_id;
end;
$$;
