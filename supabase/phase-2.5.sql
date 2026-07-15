-- VTN Business Phase 2.5 / Sprint 16 AI assistant foundation
-- Run after phase-2.4.sql

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  status text not null default 'OPEN' check(status in ('OPEN','ARCHIVED')),
  context_scope text not null default 'ERP' check(context_scope in ('ERP','SALES','INVENTORY','ACCOUNTING','PURCHASE','CRM','PROJECTS','CLAIMS','POS','MARKETPLACE')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check(role in ('user','assistant','system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  module text not null,
  title text not null,
  description text not null,
  priority text not null default 'NORMAL' check(priority in ('LOW','NORMAL','HIGH','URGENT')),
  status text not null default 'OPEN' check(status in ('OPEN','DISMISSED','DONE')),
  source_type text not null default 'SYSTEM' check(source_type in ('SYSTEM','AI','USER')),
  source_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger ai_conversations_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

create or replace trigger ai_suggestions_updated_at
before update on public.ai_suggestions
for each row execute function public.set_updated_at();

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_suggestions enable row level security;

drop policy if exists "ai conversations read membership" on public.ai_conversations;
drop policy if exists "ai messages read membership" on public.ai_messages;
drop policy if exists "ai suggestions read membership" on public.ai_suggestions;
drop policy if exists "ai conversations manage" on public.ai_conversations;
drop policy if exists "ai messages insert manage" on public.ai_messages;
drop policy if exists "ai suggestions manage" on public.ai_suggestions;

create policy "ai conversations read membership" on public.ai_conversations
for select to authenticated using(public.is_company_member(company_id));

create policy "ai messages read membership" on public.ai_messages
for select to authenticated using(
  exists(select 1 from public.ai_conversations c where c.id=conversation_id and public.is_company_member(c.company_id))
);

create policy "ai suggestions read membership" on public.ai_suggestions
for select to authenticated using(public.is_company_member(company_id));

create policy "ai conversations manage" on public.ai_conversations
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "ai messages insert manage" on public.ai_messages
for insert to authenticated with check(
  exists(select 1 from public.ai_conversations c where c.id=conversation_id and public.can_manage_company(c.company_id))
);

create policy "ai suggestions manage" on public.ai_suggestions
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create index if not exists ai_conversations_company_idx on public.ai_conversations(company_id, updated_at desc);
create index if not exists ai_messages_conversation_idx on public.ai_messages(conversation_id, created_at);
create index if not exists ai_suggestions_company_status_idx on public.ai_suggestions(company_id, status, priority);

create or replace function public.create_ai_conversation(
  p_company_id uuid,
  p_title text,
  p_context_scope text,
  p_first_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if trim(p_first_message) = '' then
    raise exception 'message is required';
  end if;

  insert into public.ai_conversations(company_id,title,context_scope,created_by)
  values(p_company_id, coalesce(nullif(trim(p_title), ''), left(trim(p_first_message), 80)), p_context_scope, v_actor)
  returning id into v_conversation_id;

  insert into public.ai_messages(conversation_id,role,content,metadata,created_by)
  values(
    v_conversation_id,
    'user',
    trim(p_first_message),
    jsonb_build_object('source','user'),
    v_actor
  );

  insert into public.ai_messages(conversation_id,role,content,metadata,created_by)
  values(
    v_conversation_id,
    'assistant',
    'AI Assistant foundation is ready. Connect an Edge Function and provider key to generate live ERP recommendations.',
    jsonb_build_object('source','system_placeholder','context_scope',p_context_scope),
    v_actor
  );

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'ai_conversation',v_conversation_id,'created',jsonb_build_object('context_scope',p_context_scope));

  return v_conversation_id;
end;
$$;

create or replace function public.add_ai_message(
  p_company_id uuid,
  p_conversation_id uuid,
  p_role text,
  p_content text,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if not exists(select 1 from public.ai_conversations c where c.id=p_conversation_id and c.company_id=p_company_id) then
    raise exception 'conversation does not belong to company';
  end if;

  insert into public.ai_messages(conversation_id,role,content,metadata,created_by)
  values(p_conversation_id,p_role,trim(p_content),coalesce(p_metadata,'{}'::jsonb),v_actor)
  returning id into v_message_id;

  update public.ai_conversations set updated_at=now() where id=p_conversation_id;

  return v_message_id;
end;
$$;
