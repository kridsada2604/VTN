-- VTN Business Phase 5.8 / User permission management
-- Run after phase-5.7.sql

create or replace function public.update_company_user_membership(
  p_company_id uuid,
  p_membership_id uuid,
  p_role_id uuid,
  p_branch_id uuid,
  p_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_membership public.company_memberships%rowtype;
  v_role_code text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_membership
  from public.company_memberships
  where id = p_membership_id and company_id = p_company_id;

  if not found then
    raise exception 'membership not found';
  end if;

  select code into v_role_code from public.roles where id = p_role_id;
  if v_role_code is null then
    raise exception 'role not found';
  end if;

  if p_branch_id is not null and not exists(
    select 1 from public.branches b where b.id = p_branch_id and b.company_id = p_company_id
  ) then
    raise exception 'branch not found';
  end if;

  if v_membership.user_id = v_actor and (p_is_active = false or v_role_code not in ('OWNER','ADMIN')) then
    raise exception 'cannot remove your own admin access';
  end if;

  update public.company_memberships
  set role_id = p_role_id,
      branch_id = p_branch_id
  where id = p_membership_id and company_id = p_company_id;

  update public.profiles
  set is_active = p_is_active
  where id = v_membership.user_id;

  insert into public.audit_logs(company_id, actor_id, entity_type, entity_id, action, metadata)
  values(
    p_company_id,
    v_actor,
    'company_membership',
    p_membership_id,
    'permission_updated',
    jsonb_build_object('user_id', v_membership.user_id, 'role_id', p_role_id, 'branch_id', p_branch_id, 'is_active', p_is_active)
  );

  return p_membership_id;
end;
$$;
