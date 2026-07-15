-- VTN Business Phase 3.4 / Claim status workflow
-- Run after phase-3.3.sql

drop policy if exists "claims update manage" on public.claims;

create policy "claims update manage" on public.claims
for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create or replace function public.update_claim_status(
  p_company_id uuid,
  p_claim_id uuid,
  p_status text,
  p_resolution text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.claims%rowtype;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_claim
  from public.claims
  where id=p_claim_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'claim not found';
  end if;

  if p_status not in ('OPEN','IN_REVIEW','APPROVED','REJECTED','RESOLVED','CLOSED') then
    raise exception 'invalid claim status';
  end if;

  update public.claims
  set status=p_status,
      resolution=case when nullif(trim(coalesce(p_resolution,'')),'') is not null then p_resolution else resolution end
  where id=v_claim.id;

  insert into public.claim_events(claim_id,event_type,from_status,to_status,message,created_by)
  values(v_claim.id,'STATUS_CHANGED',v_claim.status,p_status,'Claim status changed from ' || v_claim.status || ' to ' || p_status,v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'claim',v_claim.id,'status_updated',jsonb_build_object('from_status',v_claim.status,'to_status',p_status));

  return v_claim.id;
end;
$$;
