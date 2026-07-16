-- VTN Business Phase 4.9 / AI action approval queue
-- Run after phase-4.8.sql

create table if not exists public.ai_action_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  suggestion_id uuid references public.ai_suggestions(id) on delete set null,
  module text not null check(module in ('SALES','INVENTORY','ACCOUNTING','PURCHASE','CRM','PROJECTS','CLAIMS','POS','MARKETPLACE','SYSTEM')),
  action_type text not null,
  title text not null,
  description text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED','EXECUTED','CANCELLED')),
  requested_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger ai_action_requests_updated_at
before update on public.ai_action_requests
for each row execute function public.set_updated_at();

alter table public.ai_action_requests enable row level security;

drop policy if exists "ai action requests read membership" on public.ai_action_requests;
drop policy if exists "ai action requests manage" on public.ai_action_requests;

create policy "ai action requests read membership" on public.ai_action_requests
for select to authenticated using(public.is_company_member(company_id));

create policy "ai action requests manage" on public.ai_action_requests
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create index if not exists ai_action_requests_company_status_idx on public.ai_action_requests(company_id, status, created_at desc);
create index if not exists ai_action_requests_conversation_idx on public.ai_action_requests(conversation_id, created_at desc);

create or replace function public.create_ai_action_request(
  p_company_id uuid,
  p_conversation_id uuid,
  p_module text,
  p_action_type text,
  p_title text,
  p_description text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action_request_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_conversation_id is not null and not exists(
    select 1 from public.ai_conversations c where c.id=p_conversation_id and c.company_id=p_company_id
  ) then
    raise exception 'conversation does not belong to company';
  end if;

  if trim(p_title) = '' or trim(p_description) = '' or trim(p_action_type) = '' then
    raise exception 'action request title, description, and action type are required';
  end if;

  insert into public.ai_action_requests(
    company_id, conversation_id, module, action_type, title, description, payload, requested_by
  )
  values(
    p_company_id,
    p_conversation_id,
    upper(trim(p_module)),
    upper(trim(p_action_type)),
    trim(p_title),
    trim(p_description),
    coalesce(p_payload, '{}'::jsonb),
    v_actor
  )
  returning id into v_action_request_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'ai_action_request',
    v_action_request_id,
    'created',
    jsonb_build_object('module', upper(trim(p_module)), 'action_type', upper(trim(p_action_type)))
  );

  return v_action_request_id;
end;
$$;

create or replace function public.review_ai_action_request(
  p_company_id uuid,
  p_action_request_id uuid,
  p_decision text,
  p_review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status text := upper(trim(p_decision));
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if v_status not in ('APPROVED','REJECTED','CANCELLED') then
    raise exception 'invalid action request decision';
  end if;

  update public.ai_action_requests
  set status=v_status,
      reviewed_by=v_actor,
      reviewed_at=now(),
      review_note=nullif(trim(coalesce(p_review_note, '')), '')
  where id=p_action_request_id
    and company_id=p_company_id
    and status='PENDING';

  if not found then
    raise exception 'pending action request not found';
  end if;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'ai_action_request',
    p_action_request_id,
    lower(v_status),
    jsonb_build_object('review_note', nullif(trim(coalesce(p_review_note, '')), ''))
  );

  return p_action_request_id;
end;
$$;
