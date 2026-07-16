-- VTN Business Phase 4.8 / AI conversation follow-up
-- Run after phase-4.7.sql

create or replace function public.add_ai_conversation_message(
  p_company_id uuid,
  p_conversation_id uuid,
  p_message text
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

  if nullif(trim(p_message),'') is null then
    raise exception 'message is required';
  end if;

  if not exists(select 1 from public.ai_conversations c where c.id=p_conversation_id and c.company_id=p_company_id and c.status='OPEN') then
    raise exception 'conversation not found';
  end if;

  insert into public.ai_messages(conversation_id,role,content,metadata,created_by)
  values(p_conversation_id,'user',trim(p_message),jsonb_build_object('source','user_follow_up'),v_actor)
  returning id into v_message_id;

  insert into public.ai_messages(conversation_id,role,content,metadata,created_by)
  values(
    p_conversation_id,
    'assistant',
    'Follow-up message saved. Connect the OpenAI Edge Function provider to generate a live assistant response.',
    jsonb_build_object('source','system_placeholder','follow_up_to',v_message_id),
    v_actor
  );

  update public.ai_conversations
  set updated_at=now()
  where id=p_conversation_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'ai_conversation',p_conversation_id,'message_added',jsonb_build_object('message_id',v_message_id));

  return v_message_id;
end;
$$;
