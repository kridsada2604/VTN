-- VTN Business Phase 2.0 / Sprint 11 CRM foundation
-- Run after phase-1.9.sql

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_no text not null,
  name text not null,
  company_name text,
  email text,
  phone text,
  source text,
  status text not null default 'NEW' check(status in ('NEW','CONTACTED','QUALIFIED','CONVERTED','LOST')),
  owner_id uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, lead_no)
);

create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid references public.crm_leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  stage text not null default 'QUALIFY' check(stage in ('QUALIFY','PROPOSE','NEGOTIATE','WON','LOST')),
  expected_value numeric(18,2) not null default 0,
  expected_close_date date,
  probability integer not null default 0 check(probability >= 0 and probability <= 100),
  owner_id uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid references public.crm_leads(id) on delete cascade,
  opportunity_id uuid references public.crm_opportunities(id) on delete cascade,
  activity_type text not null check(activity_type in ('CALL','EMAIL','MEETING','TASK','NOTE')),
  subject text not null,
  due_at timestamptz,
  completed_at timestamptz,
  assigned_to uuid references auth.users(id),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace trigger crm_leads_updated_at
before update on public.crm_leads
for each row execute function public.set_updated_at();

create or replace trigger crm_opportunities_updated_at
before update on public.crm_opportunities
for each row execute function public.set_updated_at();

alter table public.crm_leads enable row level security;
alter table public.crm_opportunities enable row level security;
alter table public.crm_activities enable row level security;

drop policy if exists "crm leads read membership" on public.crm_leads;
drop policy if exists "crm opportunities read membership" on public.crm_opportunities;
drop policy if exists "crm activities read membership" on public.crm_activities;
drop policy if exists "crm leads insert manage" on public.crm_leads;
drop policy if exists "crm opportunities insert manage" on public.crm_opportunities;
drop policy if exists "crm activities insert manage" on public.crm_activities;

create policy "crm leads read membership" on public.crm_leads
for select to authenticated using(public.is_company_member(company_id));

create policy "crm opportunities read membership" on public.crm_opportunities
for select to authenticated using(public.is_company_member(company_id));

create policy "crm activities read membership" on public.crm_activities
for select to authenticated using(public.is_company_member(company_id));

create policy "crm leads insert manage" on public.crm_leads
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "crm opportunities insert manage" on public.crm_opportunities
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "crm activities insert manage" on public.crm_activities
for insert to authenticated with check(public.can_manage_company(company_id));

create index if not exists crm_leads_company_status_idx on public.crm_leads(company_id, status, created_at desc);
create index if not exists crm_opportunities_company_stage_idx on public.crm_opportunities(company_id, stage, expected_close_date);
create index if not exists crm_activities_company_due_idx on public.crm_activities(company_id, due_at);

create or replace function public.create_crm_lead(
  p_company_id uuid,
  p_name text,
  p_company_name text,
  p_email text,
  p_phone text,
  p_source text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
  v_lead_no text;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if nullif(trim(p_name),'') is null then
    raise exception 'lead name is required';
  end if;

  v_lead_no := public.next_document_number(p_company_id, 'CRM_LEAD', 'LD');

  insert into public.crm_leads(company_id,lead_no,name,company_name,email,phone,source,status,owner_id,notes)
  values(p_company_id,v_lead_no,p_name,p_company_name,p_email,p_phone,p_source,'NEW',v_actor,p_notes)
  returning id into v_lead_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'crm_lead',v_lead_id,'created',jsonb_build_object('lead_no',v_lead_no,'name',p_name));

  return v_lead_id;
end;
$$;
