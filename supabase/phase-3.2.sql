-- VTN Business Phase 3.2 / Project task workflow
-- Run after phase-3.1.sql

drop policy if exists "project tasks update manage" on public.project_tasks;

create policy "project tasks update manage" on public.project_tasks
for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create or replace function public.create_project_task(
  p_company_id uuid,
  p_project_id uuid,
  p_title text,
  p_due_date date,
  p_estimated_hours numeric,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if not exists(select 1 from public.projects where id=p_project_id and company_id=p_company_id) then
    raise exception 'project not found';
  end if;

  if nullif(trim(p_title),'') is null then
    raise exception 'task title is required';
  end if;

  insert into public.project_tasks(company_id,project_id,title,status,due_date,assigned_to,estimated_hours,actual_hours,sort_order)
  values(p_company_id,p_project_id,trim(p_title),'TODO',p_due_date,v_actor,greatest(coalesce(p_estimated_hours,0),0),0,coalesce(p_sort_order,0))
  returning id into v_task_id;

  update public.projects
  set status=case when status='PLANNED' then 'ACTIVE' else status end
  where id=p_project_id and company_id=p_company_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'project_task',v_task_id,'created',jsonb_build_object('project_id',p_project_id,'title',p_title));

  return v_task_id;
end;
$$;

create or replace function public.update_project_task(
  p_company_id uuid,
  p_task_id uuid,
  p_status text,
  p_due_date date,
  p_estimated_hours numeric,
  p_actual_hours numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.project_tasks%rowtype;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_task
  from public.project_tasks
  where id=p_task_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'task not found';
  end if;

  update public.project_tasks
  set status=coalesce(nullif(p_status,''),status),
      due_date=p_due_date,
      estimated_hours=greatest(coalesce(p_estimated_hours,estimated_hours),0),
      actual_hours=greatest(coalesce(p_actual_hours,actual_hours),0)
  where id=v_task.id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'project_task',
    v_task.id,
    'updated',
    jsonb_build_object('from_status',v_task.status,'to_status',coalesce(nullif(p_status,''),v_task.status),'project_id',v_task.project_id)
  );

  return v_task.id;
end;
$$;
