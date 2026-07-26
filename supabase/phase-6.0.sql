-- VTN Business Phase 6.0 / Sale Out approval workflow
-- Run after phase-5.9.sql

alter table public.sales_out_reports add column if not exists reviewed_by uuid references auth.users(id);
alter table public.sales_out_reports add column if not exists reviewed_at timestamptz;
alter table public.sales_out_reports add column if not exists review_note text;

create table if not exists public.sales_out_report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.sales_out_reports(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.sales_out_report_events enable row level security;

drop policy if exists "sales out events read membership" on public.sales_out_report_events;
drop policy if exists "sales out events insert manage" on public.sales_out_report_events;

create policy "sales out events read membership" on public.sales_out_report_events
for select to authenticated using(
  exists(select 1 from public.sales_out_reports r where r.id=report_id and public.is_company_member(r.company_id))
);

create policy "sales out events insert manage" on public.sales_out_report_events
for insert to authenticated with check(
  exists(select 1 from public.sales_out_reports r where r.id=report_id and public.can_manage_company(r.company_id))
);

create index if not exists sales_out_report_events_report_idx
on public.sales_out_report_events(report_id, created_at desc);

insert into public.sales_out_report_events(report_id, event_type, from_status, to_status, message, created_by, created_at)
select r.id, 'CREATED', null, r.status, 'Created Sale Out report', r.created_by, r.created_at
from public.sales_out_reports r
where not exists(select 1 from public.sales_out_report_events e where e.report_id = r.id and e.event_type = 'CREATED');

create or replace function public.update_sales_out_report_status(
  p_company_id uuid,
  p_report_id uuid,
  p_status text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_report public.sales_out_reports%rowtype;
  v_next_status text := upper(trim(coalesce(p_status, '')));
  v_event_type text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_report
  from public.sales_out_reports
  where id = p_report_id and company_id = p_company_id
  for update;

  if not found then
    raise exception 'sale out report not found';
  end if;

  if v_next_status not in ('SUBMITTED','APPROVED','CANCELLED') then
    raise exception 'invalid sale out status';
  end if;

  if v_report.status = v_next_status then
    return p_report_id;
  end if;

  if v_next_status = 'SUBMITTED' and v_report.status not in ('DRAFT') then
    raise exception 'only draft sale out reports can be submitted';
  end if;

  if v_next_status = 'APPROVED' and v_report.status <> 'SUBMITTED' then
    raise exception 'only submitted sale out reports can be approved';
  end if;

  if v_next_status = 'CANCELLED' and v_report.status not in ('DRAFT','SUBMITTED') then
    raise exception 'only draft or submitted sale out reports can be cancelled';
  end if;

  v_event_type := case
    when v_next_status = 'SUBMITTED' then 'SUBMITTED'
    when v_next_status = 'APPROVED' then 'APPROVED'
    when v_next_status = 'CANCELLED' then 'CANCELLED'
    else 'STATUS_CHANGED'
  end;

  update public.sales_out_reports
  set status = v_next_status,
      reviewed_by = case when v_next_status in ('APPROVED','CANCELLED') then v_actor else reviewed_by end,
      reviewed_at = case when v_next_status in ('APPROVED','CANCELLED') then now() else reviewed_at end,
      review_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_report_id;

  insert into public.sales_out_report_events(report_id, event_type, from_status, to_status, message, created_by)
  values(p_report_id, v_event_type, v_report.status, v_next_status, nullif(trim(coalesce(p_note, '')), ''), v_actor);

  insert into public.audit_logs(company_id, actor_id, entity_type, entity_id, action, metadata)
  values(
    p_company_id,
    v_actor,
    'sales_out_report',
    p_report_id,
    lower('status_' || v_next_status),
    jsonb_build_object('from_status', v_report.status, 'to_status', v_next_status, 'note', nullif(trim(coalesce(p_note, '')), ''))
  );

  return p_report_id;
end;
$$;
