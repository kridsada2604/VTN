-- VTN Business Phase 3.6 / POS void and refund workflow
-- Run after phase-3.5.sql

alter table public.pos_sales add column if not exists voided_at timestamptz;
alter table public.pos_sales add column if not exists voided_by uuid references auth.users(id);
alter table public.pos_sales add column if not exists refund_reason text;
alter table public.pos_sales add column if not exists reversal_stock_movement_id uuid references public.stock_movements(id);

create or replace function public.reverse_pos_sale_stock(
  p_company_id uuid,
  p_sale public.pos_sales
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock_items jsonb := '[]'::jsonb;
  v_item record;
  v_movement_id uuid;
begin
  for v_item in
    select product_id, quantity, barcode, sort_order
    from public.pos_sale_items
    where sale_id=p_sale.id
    order by sort_order
  loop
    v_stock_items := v_stock_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_item.product_id,
      'quantity', v_item.quantity,
      'unit_cost', 0,
      'barcode', v_item.barcode,
      'sort_order', v_item.sort_order
    ));
  end loop;

  v_movement_id := public.post_stock_movement(
    p_company_id,
    p_sale.warehouse_id,
    current_date,
    'RECEIVE',
    'Reverse POS sale ' || p_sale.sale_no,
    v_stock_items
  );

  return v_movement_id;
end;
$$;

create or replace function public.void_pos_sale(
  p_company_id uuid,
  p_sale_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.pos_sales%rowtype;
  v_reversal_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_sale
  from public.pos_sales
  where id=p_sale_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'POS sale not found';
  end if;

  if v_sale.status in ('VOID','REFUNDED') then
    return v_sale.id;
  end if;

  v_reversal_id := public.reverse_pos_sale_stock(p_company_id, v_sale);

  update public.pos_sales
  set status='VOID',
      voided_at=now(),
      voided_by=v_actor,
      refund_reason=p_reason,
      reversal_stock_movement_id=v_reversal_id
  where id=v_sale.id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'pos_sale',v_sale.id,'voided',jsonb_build_object('sale_no',v_sale.sale_no,'reason',p_reason,'reversal_stock_movement_id',v_reversal_id));

  return v_sale.id;
end;
$$;

create or replace function public.refund_pos_sale(
  p_company_id uuid,
  p_sale_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.pos_sales%rowtype;
  v_reversal_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_sale
  from public.pos_sales
  where id=p_sale_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'POS sale not found';
  end if;

  if v_sale.status in ('VOID','REFUNDED') then
    return v_sale.id;
  end if;

  if v_sale.status <> 'PAID' then
    raise exception 'only paid POS sales can be refunded';
  end if;

  v_reversal_id := public.reverse_pos_sale_stock(p_company_id, v_sale);

  update public.pos_sales
  set status='REFUNDED',
      voided_at=now(),
      voided_by=v_actor,
      refund_reason=p_reason,
      reversal_stock_movement_id=v_reversal_id
  where id=v_sale.id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'pos_sale',v_sale.id,'refunded',jsonb_build_object('sale_no',v_sale.sale_no,'amount',v_sale.total_amount,'reason',p_reason,'reversal_stock_movement_id',v_reversal_id));

  return v_sale.id;
end;
$$;
