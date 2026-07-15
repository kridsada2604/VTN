-- VTN Business Phase 3.1 / CRM workflow actions
-- Run after phase-3.0.sql

drop policy if exists "crm leads update manage" on public.crm_leads;
drop policy if exists "crm opportunities update manage" on public.crm_opportunities;
drop policy if exists "crm activities update manage" on public.crm_activities;

create policy "crm leads update manage" on public.crm_leads
for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "crm opportunities update manage" on public.crm_opportunities
for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "crm activities update manage" on public.crm_activities
for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create or replace function public.create_crm_opportunity(
  p_company_id uuid,
  p_lead_id uuid,
  p_customer_id uuid,
  p_title text,
  p_stage text,
  p_expected_value numeric,
  p_probability integer,
  p_expected_close_date date,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_opportunity_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if nullif(trim(p_title),'') is null then
    raise exception 'opportunity title is required';
  end if;

  if p_lead_id is not null and not exists(select 1 from public.crm_leads where id=p_lead_id and company_id=p_company_id) then
    raise exception 'lead does not belong to company';
  end if;

  if p_customer_id is not null and not exists(select 1 from public.customers where id=p_customer_id and company_id=p_company_id) then
    raise exception 'customer does not belong to company';
  end if;

  insert into public.crm_opportunities(company_id,lead_id,customer_id,title,stage,expected_value,probability,expected_close_date,owner_id,notes)
  values(
    p_company_id,
    p_lead_id,
    p_customer_id,
    trim(p_title),
    coalesce(nullif(p_stage,''),'QUALIFY'),
    greatest(coalesce(p_expected_value,0),0),
    least(greatest(coalesce(p_probability,0),0),100),
    p_expected_close_date,
    v_actor,
    p_notes
  )
  returning id into v_opportunity_id;

  if p_lead_id is not null then
    update public.crm_leads
    set status='QUALIFIED'
    where id=p_lead_id and status in ('NEW','CONTACTED');
  end if;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'crm_opportunity',v_opportunity_id,'created',jsonb_build_object('title',p_title,'lead_id',p_lead_id,'customer_id',p_customer_id));

  return v_opportunity_id;
end;
$$;

create or replace function public.update_crm_opportunity_stage(
  p_company_id uuid,
  p_opportunity_id uuid,
  p_stage text,
  p_probability integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_opportunity public.crm_opportunities%rowtype;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_opportunity
  from public.crm_opportunities
  where id=p_opportunity_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'opportunity not found';
  end if;

  update public.crm_opportunities
  set stage=p_stage,
      probability=least(greatest(coalesce(p_probability, probability),0),100)
  where id=v_opportunity.id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'crm_opportunity',v_opportunity.id,'stage_updated',jsonb_build_object('from_stage',v_opportunity.stage,'to_stage',p_stage));

  return v_opportunity.id;
end;
$$;

create or replace function public.create_crm_activity(
  p_company_id uuid,
  p_lead_id uuid,
  p_opportunity_id uuid,
  p_activity_type text,
  p_subject text,
  p_due_at timestamptz,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activity_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if nullif(trim(p_subject),'') is null then
    raise exception 'activity subject is required';
  end if;

  if p_lead_id is not null and not exists(select 1 from public.crm_leads where id=p_lead_id and company_id=p_company_id) then
    raise exception 'lead does not belong to company';
  end if;

  if p_opportunity_id is not null and not exists(select 1 from public.crm_opportunities where id=p_opportunity_id and company_id=p_company_id) then
    raise exception 'opportunity does not belong to company';
  end if;

  insert into public.crm_activities(company_id,lead_id,opportunity_id,activity_type,subject,due_at,assigned_to,notes,created_by)
  values(p_company_id,p_lead_id,p_opportunity_id,coalesce(nullif(p_activity_type,''),'TASK'),trim(p_subject),p_due_at,v_actor,p_notes,v_actor)
  returning id into v_activity_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'crm_activity',v_activity_id,'created',jsonb_build_object('subject',p_subject,'lead_id',p_lead_id,'opportunity_id',p_opportunity_id));

  return v_activity_id;
end;
$$;

create or replace function public.complete_crm_activity(
  p_company_id uuid,
  p_activity_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  update public.crm_activities
  set completed_at=coalesce(completed_at, now())
  where id=p_activity_id and company_id=p_company_id;

  if not found then
    raise exception 'activity not found';
  end if;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'crm_activity',p_activity_id,'completed',jsonb_build_object('completed_at',now()));

  return p_activity_id;
end;
$$;

create or replace function public.convert_crm_lead_to_customer(
  p_company_id uuid,
  p_lead_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.crm_leads%rowtype;
  v_customer_id uuid;
  v_customer_code text;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_lead
  from public.crm_leads
  where id=p_lead_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'lead not found';
  end if;

  if v_lead.status = 'CONVERTED' then
    select customer_id into v_customer_id
    from public.crm_opportunities
    where lead_id=v_lead.id and customer_id is not null
    order by created_at desc
    limit 1;

    if v_customer_id is not null then
      return v_customer_id;
    end if;
  end if;

  v_customer_code := public.next_document_number(p_company_id, 'CUSTOMER', 'CUS');

  insert into public.customers(company_id,code,name,tax_id,email,phone,address,is_active)
  values(p_company_id,v_customer_code,coalesce(nullif(v_lead.company_name,''),v_lead.name),null,v_lead.email,v_lead.phone,null,true)
  returning id into v_customer_id;

  update public.crm_leads
  set status='CONVERTED'
  where id=v_lead.id;

  insert into public.crm_opportunities(company_id,lead_id,customer_id,title,stage,expected_value,probability,owner_id,notes)
  values(p_company_id,v_lead.id,v_customer_id,'Converted lead - ' || v_lead.name,'QUALIFY',0,20,v_actor,v_lead.notes);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'crm_lead',v_lead.id,'converted_to_customer',jsonb_build_object('customer_id',v_customer_id,'customer_code',v_customer_code));

  return v_customer_id;
end;
$$;
