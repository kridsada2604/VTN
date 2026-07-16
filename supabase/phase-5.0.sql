-- VTN Business Phase 5.0 / Marketplace connector sync foundation
-- Run after phase-4.9.sql

create table if not exists public.marketplace_sync_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel_id uuid not null references public.marketplace_channels(id) on delete cascade,
  trigger_source text not null default 'MANUAL' check(trigger_source in ('MANUAL','SCHEDULED','WEBHOOK','SYSTEM')),
  status text not null default 'RUNNING' check(status in ('RUNNING','SUCCESS','FAILED')),
  orders_imported integer not null default 0 check(orders_imported >= 0),
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_by uuid references auth.users(id)
);

alter table public.marketplace_sync_logs enable row level security;

drop policy if exists "marketplace sync logs read membership" on public.marketplace_sync_logs;
drop policy if exists "marketplace sync logs manage" on public.marketplace_sync_logs;

create policy "marketplace sync logs read membership" on public.marketplace_sync_logs
for select to authenticated using(public.is_company_member(company_id));

create policy "marketplace sync logs manage" on public.marketplace_sync_logs
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create index if not exists marketplace_sync_logs_company_idx on public.marketplace_sync_logs(company_id, started_at desc);
create index if not exists marketplace_sync_logs_channel_idx on public.marketplace_sync_logs(channel_id, started_at desc);

create or replace function public.start_marketplace_sync(
  p_company_id uuid,
  p_channel_id uuid,
  p_trigger_source text default 'MANUAL'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sync_log_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if not exists(select 1 from public.marketplace_channels c where c.id=p_channel_id and c.company_id=p_company_id and c.status='ACTIVE') then
    raise exception 'active marketplace channel not found';
  end if;

  insert into public.marketplace_sync_logs(company_id,channel_id,trigger_source,status,created_by)
  values(p_company_id,p_channel_id,upper(trim(coalesce(p_trigger_source,'MANUAL'))),'RUNNING',v_actor)
  returning id into v_sync_log_id;

  update public.marketplace_channels
  set sync_status='CONNECTED'
  where id=p_channel_id and company_id=p_company_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'marketplace_sync',v_sync_log_id,'started',jsonb_build_object('channel_id',p_channel_id,'trigger_source',upper(trim(coalesce(p_trigger_source,'MANUAL')))));

  return v_sync_log_id;
end;
$$;

create or replace function public.finish_marketplace_sync(
  p_company_id uuid,
  p_sync_log_id uuid,
  p_status text,
  p_orders_imported integer default 0,
  p_error_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status text := upper(trim(p_status));
  v_channel_id uuid;
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if v_status not in ('SUCCESS','FAILED') then
    raise exception 'invalid marketplace sync status';
  end if;

  select channel_id into v_channel_id
  from public.marketplace_sync_logs
  where id=p_sync_log_id and company_id=p_company_id and status='RUNNING';

  if v_channel_id is null then
    raise exception 'running marketplace sync log not found';
  end if;

  update public.marketplace_sync_logs
  set status=v_status,
      orders_imported=greatest(coalesce(p_orders_imported,0),0),
      error_message=nullif(trim(coalesce(p_error_message,'')), ''),
      finished_at=now()
  where id=p_sync_log_id and company_id=p_company_id;

  update public.marketplace_channels
  set sync_status=case when v_status='SUCCESS' then 'CONNECTED' else 'ERROR' end,
      last_synced_at=case when v_status='SUCCESS' then now() else last_synced_at end
  where id=v_channel_id and company_id=p_company_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'marketplace_sync',
    p_sync_log_id,
    lower(v_status),
    jsonb_build_object('channel_id',v_channel_id,'orders_imported',greatest(coalesce(p_orders_imported,0),0),'error_message',nullif(trim(coalesce(p_error_message,'')), ''))
  );

  return p_sync_log_id;
end;
$$;
