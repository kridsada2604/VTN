-- VTN Business Phase 3.9 / Warranty policy foundation
-- Run after phase-3.8.sql

create table if not exists public.warranty_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  policy_name text not null,
  duration_days integer not null default 0 check(duration_days >= 0),
  coverage text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.warranty_policies enable row level security;

drop policy if exists "warranty policies read membership" on public.warranty_policies;
drop policy if exists "warranty policies insert manage" on public.warranty_policies;

create policy "warranty policies read membership" on public.warranty_policies
for select to authenticated using(public.is_company_member(company_id));

create policy "warranty policies insert manage" on public.warranty_policies
for insert to authenticated with check(public.can_manage_company(company_id));

create index if not exists warranty_policies_company_active_idx on public.warranty_policies(company_id, is_active, created_at desc);
create index if not exists warranty_policies_product_idx on public.warranty_policies(product_id);

create or replace function public.create_warranty_policy(
  p_company_id uuid,
  p_product_id uuid,
  p_policy_name text,
  p_duration_days integer,
  p_coverage text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_policy_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if nullif(trim(p_policy_name),'') is null then
    raise exception 'warranty policy name is required';
  end if;

  if p_product_id is not null and not exists(select 1 from public.products where id=p_product_id and company_id=p_company_id) then
    raise exception 'product does not belong to company';
  end if;

  insert into public.warranty_policies(company_id,product_id,policy_name,duration_days,coverage,created_by)
  values(p_company_id,p_product_id,trim(p_policy_name),greatest(coalesce(p_duration_days,0),0),p_coverage,v_actor)
  returning id into v_policy_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'warranty_policy',v_policy_id,'created',jsonb_build_object('policy_name',p_policy_name,'product_id',p_product_id,'duration_days',p_duration_days));

  return v_policy_id;
end;
$$;
