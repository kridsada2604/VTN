-- VTN Business Phase 3.3 / Project cost posting
-- Run after phase-3.2.sql

alter table public.project_costs add column if not exists journal_entry_id uuid references public.journal_entries(id);

insert into public.accounting_accounts(company_id, code, name, account_type, normal_balance)
select c.id, '6100', 'ต้นทุนโครงการ', 'EXPENSE', 'DEBIT'
from public.companies c
where not exists (
  select 1 from public.accounting_accounts a where a.company_id=c.id and a.code='6100'
);

create index if not exists project_costs_journal_idx on public.project_costs(journal_entry_id);

create or replace function public.create_project_cost(
  p_company_id uuid,
  p_project_id uuid,
  p_cost_date date,
  p_cost_type text,
  p_description text,
  p_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects%rowtype;
  v_cost_id uuid;
  v_cost_account uuid;
  v_cash_account uuid;
  v_journal_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_project
  from public.projects
  where id=p_project_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'project not found';
  end if;

  if nullif(trim(p_description),'') is null then
    raise exception 'cost description is required';
  end if;

  if coalesce(p_amount,0) <= 0 then
    raise exception 'cost amount must be greater than zero';
  end if;

  select id into v_cost_account from public.accounting_accounts where company_id=p_company_id and code='6100' and is_active=true;
  select id into v_cash_account from public.accounting_accounts where company_id=p_company_id and code='1000' and is_active=true;

  if v_cost_account is null or v_cash_account is null then
    raise exception 'required accounting accounts are missing';
  end if;

  insert into public.project_costs(company_id,project_id,cost_date,cost_type,description,amount,source_type,created_by)
  values(p_company_id,p_project_id,coalesce(p_cost_date,current_date),coalesce(nullif(p_cost_type,''),'OTHER'),trim(p_description),p_amount,'MANUAL',v_actor)
  returning id into v_cost_id;

  v_journal_id := public.post_journal_entry(
    p_company_id,
    coalesce(p_cost_date,current_date),
    'project_cost',
    v_cost_id,
    'Post project cost for ' || v_project.project_no,
    jsonb_build_array(
      jsonb_build_object('account_id', v_cost_account, 'description', trim(p_description), 'debit', p_amount, 'credit', 0, 'sort_order', 1),
      jsonb_build_object('account_id', v_cash_account, 'description', 'Cash paid for project cost', 'debit', 0, 'credit', p_amount, 'sort_order', 2)
    )
  );

  update public.project_costs
  set journal_entry_id=v_journal_id
  where id=v_cost_id;

  update public.projects
  set actual_cost=round((actual_cost + p_amount)::numeric, 2),
      status=case when status='PLANNED' then 'ACTIVE' else status end
  where id=p_project_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'project_cost',v_cost_id,'posted',jsonb_build_object('project_id',p_project_id,'amount',p_amount,'journal_entry_id',v_journal_id));

  return v_cost_id;
end;
$$;
