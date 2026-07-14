-- VTN Business Phase 2.1 / Sprint 12 projects foundation
-- Run after phase-2.0.sql

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  project_no text not null,
  name text not null,
  status text not null default 'PLANNED' check(status in ('PLANNED','ACTIVE','ON_HOLD','COMPLETED','CANCELLED')),
  start_date date,
  end_date date,
  budget_amount numeric(18,2) not null default 0,
  actual_cost numeric(18,2) not null default 0,
  revenue_amount numeric(18,2) not null default 0,
  owner_id uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, project_no)
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'TODO' check(status in ('TODO','IN_PROGRESS','DONE','BLOCKED')),
  due_date date,
  assigned_to uuid references auth.users(id),
  estimated_hours numeric(18,2) not null default 0,
  actual_hours numeric(18,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_costs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  cost_date date not null default current_date,
  cost_type text not null default 'OTHER' check(cost_type in ('LABOR','MATERIAL','EXPENSE','OTHER')),
  description text not null,
  amount numeric(18,2) not null default 0,
  source_type text,
  source_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace trigger projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create or replace trigger project_tasks_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_costs enable row level security;

drop policy if exists "projects read membership" on public.projects;
drop policy if exists "project tasks read membership" on public.project_tasks;
drop policy if exists "project costs read membership" on public.project_costs;
drop policy if exists "projects insert manage" on public.projects;
drop policy if exists "project tasks insert manage" on public.project_tasks;
drop policy if exists "project costs insert manage" on public.project_costs;

create policy "projects read membership" on public.projects
for select to authenticated using(public.is_company_member(company_id));

create policy "project tasks read membership" on public.project_tasks
for select to authenticated using(public.is_company_member(company_id));

create policy "project costs read membership" on public.project_costs
for select to authenticated using(public.is_company_member(company_id));

create policy "projects insert manage" on public.projects
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "project tasks insert manage" on public.project_tasks
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "project costs insert manage" on public.project_costs
for insert to authenticated with check(public.can_manage_company(company_id));

create index if not exists projects_company_status_idx on public.projects(company_id, status, start_date desc);
create index if not exists projects_customer_idx on public.projects(customer_id);
create index if not exists project_tasks_project_idx on public.project_tasks(project_id, sort_order);
create index if not exists project_costs_project_idx on public.project_costs(project_id, cost_date desc);

create or replace function public.create_project(
  p_company_id uuid,
  p_customer_id uuid,
  p_name text,
  p_start_date date,
  p_end_date date,
  p_budget_amount numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_project_no text;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if nullif(trim(p_name),'') is null then
    raise exception 'project name is required';
  end if;

  if p_customer_id is not null and not exists(select 1 from public.customers c where c.id=p_customer_id and c.company_id=p_company_id) then
    raise exception 'customer does not belong to company';
  end if;

  v_project_no := public.next_document_number(p_company_id, 'PROJECT', 'PRJ');

  insert into public.projects(company_id,customer_id,project_no,name,status,start_date,end_date,budget_amount,owner_id,notes)
  values(p_company_id,p_customer_id,v_project_no,p_name,'PLANNED',p_start_date,p_end_date,coalesce(p_budget_amount,0),v_actor,p_notes)
  returning id into v_project_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'project',v_project_id,'created',jsonb_build_object('project_no',v_project_no,'name',p_name));

  return v_project_id;
end;
$$;
