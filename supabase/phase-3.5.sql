-- VTN Business Phase 3.5 / POS session workflow
-- Run after phase-3.4.sql

create or replace function public.open_pos_session(
  p_company_id uuid,
  p_warehouse_id uuid,
  p_opening_cash numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if not exists(select 1 from public.warehouses where id=p_warehouse_id and company_id=p_company_id and is_active=true) then
    raise exception 'warehouse does not belong to company';
  end if;

  if exists(select 1 from public.pos_sessions where company_id=p_company_id and warehouse_id=p_warehouse_id and status='OPEN') then
    raise exception 'POS session is already open for this warehouse';
  end if;

  insert into public.pos_sessions(company_id,warehouse_id,opened_by,opening_cash,status,notes)
  values(p_company_id,p_warehouse_id,v_actor,greatest(coalesce(p_opening_cash,0),0),'OPEN',p_notes)
  returning id into v_session_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'pos_session',v_session_id,'opened',jsonb_build_object('warehouse_id',p_warehouse_id,'opening_cash',p_opening_cash));

  return v_session_id;
end;
$$;

create or replace function public.close_pos_session(
  p_company_id uuid,
  p_session_id uuid,
  p_closing_cash numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.pos_sessions%rowtype;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_session
  from public.pos_sessions
  where id=p_session_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'POS session not found';
  end if;

  if v_session.status <> 'OPEN' then
    return v_session.id;
  end if;

  update public.pos_sessions
  set status='CLOSED',
      closed_at=now(),
      closing_cash=greatest(coalesce(p_closing_cash,0),0),
      notes=coalesce(nullif(p_notes,''),notes)
  where id=v_session.id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'pos_session',v_session.id,'closed',jsonb_build_object('closing_cash',p_closing_cash));

  return v_session.id;
end;
$$;
