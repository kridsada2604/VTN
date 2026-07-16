-- VTN Business Phase 4.4 / Inventory warehouse transfer
-- Run after phase-4.3.sql

create or replace function public.post_stock_transfer(
  p_company_id uuid,
  p_from_warehouse_id uuid,
  p_to_warehouse_id uuid,
  p_transfer_date date,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_out_movement_id uuid;
  v_in_movement_id uuid;
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_from_warehouse_id = p_to_warehouse_id then
    raise exception 'source and destination warehouses must be different';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'transfer items are required';
  end if;

  if not exists(select 1 from public.warehouses w where w.id=p_from_warehouse_id and w.company_id=p_company_id and w.is_active=true) then
    raise exception 'source warehouse does not belong to company';
  end if;

  if not exists(select 1 from public.warehouses w where w.id=p_to_warehouse_id and w.company_id=p_company_id and w.is_active=true) then
    raise exception 'destination warehouse does not belong to company';
  end if;

  v_out_movement_id := public.post_stock_movement(
    p_company_id,
    p_from_warehouse_id,
    p_transfer_date,
    'TRANSFER_OUT',
    concat('Transfer out. ', coalesce(p_notes,'')),
    p_items
  );

  v_in_movement_id := public.post_stock_movement(
    p_company_id,
    p_to_warehouse_id,
    p_transfer_date,
    'TRANSFER_IN',
    concat('Transfer in. ', coalesce(p_notes,'')),
    p_items
  );

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'stock_transfer',
    v_in_movement_id,
    'posted',
    jsonb_build_object(
      'from_warehouse_id', p_from_warehouse_id,
      'to_warehouse_id', p_to_warehouse_id,
      'out_movement_id', v_out_movement_id,
      'in_movement_id', v_in_movement_id
    )
  );

  return jsonb_build_object('out_movement_id', v_out_movement_id, 'in_movement_id', v_in_movement_id);
end;
$$;
