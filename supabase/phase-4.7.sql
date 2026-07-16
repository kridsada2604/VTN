-- VTN Business Phase 4.7 / AI recommendation to suggestion queue
-- Run after phase-4.6.sql

create or replace function public.generate_ai_recommendations(
  p_company_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_count integer := 0;
  v_open_invoices integer := 0;
  v_low_stock integer := 0;
  v_pending_marketplace integer := 0;
  v_open_claims integer := 0;
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select count(*) into v_open_invoices from public.sales_invoices where company_id=p_company_id and balance_amount > 0;
  select count(*) into v_low_stock from public.stock_balances where company_id=p_company_id and quantity_on_hand <= 0;
  select count(*) into v_pending_marketplace from public.marketplace_orders where company_id=p_company_id and fulfillment_status='PENDING';
  select count(*) into v_open_claims from public.claims where company_id=p_company_id and status in ('OPEN','IN_REVIEW');

  if v_open_invoices > 0 then
    insert into public.ai_suggestions(company_id,module,title,description,priority,source_type,created_by)
    values(p_company_id,'Finance','Follow up unpaid invoices','There are ' || v_open_invoices || ' invoice(s) with outstanding balance.','HIGH','AI',v_actor);
    v_count := v_count + 1;
  end if;

  if v_low_stock > 0 then
    insert into public.ai_suggestions(company_id,module,title,description,priority,source_type,created_by)
    values(p_company_id,'Inventory','Review low stock balances','There are ' || v_low_stock || ' stock balance row(s) at or below zero.','NORMAL','AI',v_actor);
    v_count := v_count + 1;
  end if;

  if v_pending_marketplace > 0 then
    insert into public.ai_suggestions(company_id,module,title,description,priority,source_type,created_by)
    values(p_company_id,'Marketplace','Fulfill pending marketplace orders','There are ' || v_pending_marketplace || ' marketplace order(s) waiting for fulfillment.','NORMAL','AI',v_actor);
    v_count := v_count + 1;
  end if;

  if v_open_claims > 0 then
    insert into public.ai_suggestions(company_id,module,title,description,priority,source_type,created_by)
    values(p_company_id,'Claims','Resolve open claims','There are ' || v_open_claims || ' claim(s) open or in review.','NORMAL','AI',v_actor);
    v_count := v_count + 1;
  end if;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'ai_suggestion',p_company_id,'generated',jsonb_build_object('suggestions_created',v_count));

  return v_count;
end;
$$;
