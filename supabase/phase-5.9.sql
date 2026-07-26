-- VTN Business Phase 5.9 / Company role permission matrix
-- Run after phase-5.8.sql

create table if not exists public.company_role_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  module_key text not null,
  action_key text not null,
  is_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, role_id, module_key, action_key)
);

create or replace trigger company_role_permissions_updated_at
before update on public.company_role_permissions
for each row execute function public.set_updated_at();

alter table public.company_role_permissions enable row level security;

drop policy if exists "role permissions read membership" on public.company_role_permissions;
drop policy if exists "role permissions insert manage" on public.company_role_permissions;
drop policy if exists "role permissions update manage" on public.company_role_permissions;

create policy "role permissions read membership" on public.company_role_permissions
for select to authenticated using(public.is_company_member(company_id));

create policy "role permissions insert manage" on public.company_role_permissions
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "role permissions update manage" on public.company_role_permissions
for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create index if not exists company_role_permissions_company_role_idx
on public.company_role_permissions(company_id, role_id);

create index if not exists company_role_permissions_module_action_idx
on public.company_role_permissions(company_id, module_key, action_key);

with modules(module_key) as (
  values ('DASHBOARD'),('SALES'),('PURCHASE'),('INVENTORY'),('ACCOUNTING'),('CRM'),('PROJECTS'),('CLAIMS'),('POS'),('MARKETPLACE'),('REPORTS'),('AI'),('SETTINGS')
), actions(action_key) as (
  values ('VIEW'),('CREATE'),('UPDATE'),('APPROVE'),('POST'),('EXPORT'),('MANAGE')
)
insert into public.company_role_permissions(company_id, role_id, module_key, action_key, is_allowed)
select c.id, r.id, m.module_key, a.action_key,
  case when r.code in ('OWNER','ADMIN') then true when a.action_key = 'VIEW' then true else false end
from public.companies c
cross join public.roles r
cross join modules m
cross join actions a
on conflict(company_id, role_id, module_key, action_key) do nothing;

create or replace function public.upsert_company_role_permission(
  p_company_id uuid,
  p_role_id uuid,
  p_module_key text,
  p_action_key text,
  p_is_allowed boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_permission_id uuid;
  v_role_code text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select code into v_role_code from public.roles where id = p_role_id;
  if v_role_code is null then
    raise exception 'role not found';
  end if;

  if p_module_key not in ('DASHBOARD','SALES','PURCHASE','INVENTORY','ACCOUNTING','CRM','PROJECTS','CLAIMS','POS','MARKETPLACE','REPORTS','AI','SETTINGS') then
    raise exception 'invalid module';
  end if;

  if p_action_key not in ('VIEW','CREATE','UPDATE','APPROVE','POST','EXPORT','MANAGE') then
    raise exception 'invalid action';
  end if;

  if v_role_code = 'OWNER' and p_is_allowed = false then
    raise exception 'owner permissions cannot be removed';
  end if;

  insert into public.company_role_permissions(company_id, role_id, module_key, action_key, is_allowed)
  values(p_company_id, p_role_id, upper(trim(p_module_key)), upper(trim(p_action_key)), p_is_allowed)
  on conflict(company_id, role_id, module_key, action_key)
  do update set is_allowed = excluded.is_allowed, updated_at = now()
  returning id into v_permission_id;

  insert into public.audit_logs(company_id, actor_id, entity_type, entity_id, action, metadata)
  values(
    p_company_id,
    v_actor,
    'company_role_permission',
    v_permission_id,
    'permission_matrix_updated',
    jsonb_build_object('role_id', p_role_id, 'role_code', v_role_code, 'module_key', upper(trim(p_module_key)), 'action_key', upper(trim(p_action_key)), 'is_allowed', p_is_allowed)
  );

  return v_permission_id;
end;
$$;
