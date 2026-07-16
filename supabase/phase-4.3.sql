-- VTN Business Phase 4.3 / Sales partial delivery and backorder
-- Run after phase-4.2.sql

create or replace function public.deliver_sales_order(
  p_company_id uuid,
  p_sales_order_id uuid,
  p_delivery_date date,
  p_notes text,
  p_items jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.sales_orders%rowtype;
  v_delivery_id uuid;
  v_document_no text;
  v_stock_movement_id uuid;
  v_stock_items jsonb := '[]'::jsonb;
  v_payload jsonb;
  v_order_item public.sales_order_items%rowtype;
  v_delivery_qty numeric(18,4);
  v_remaining_qty numeric(18,4);
  v_reserved_remaining numeric(18,4);
  v_total_remaining numeric(18,4);
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_order
  from public.sales_orders
  where id=p_sales_order_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'sales order not found';
  end if;

  if v_order.status not in ('RESERVED','PARTIALLY_DELIVERED') or v_order.warehouse_id is null then
    raise exception 'sales order must be reserved before delivery';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'SALES_DELIVERY', 'DO');

  insert into public.sales_deliveries(company_id,sales_order_id,warehouse_id,document_no,delivery_date,notes,created_by)
  values(p_company_id,p_sales_order_id,v_order.warehouse_id,v_document_no,p_delivery_date,p_notes,v_actor)
  returning id into v_delivery_id;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    for v_order_item in select * from public.sales_order_items where sales_order_id=p_sales_order_id and product_id is not null order by sort_order
    loop
      v_remaining_qty := v_order_item.quantity - v_order_item.delivered_quantity;
      if v_remaining_qty > 0 then
        p_items := coalesce(p_items, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'sales_order_item_id', v_order_item.id,
          'quantity', v_remaining_qty
        ));
      end if;
    end loop;
  end if;

  for v_payload in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_delivery_qty := coalesce(nullif(v_payload->>'quantity','')::numeric, 0);

    if v_delivery_qty <= 0 then
      continue;
    end if;

    select * into v_order_item
    from public.sales_order_items
    where id=(v_payload->>'sales_order_item_id')::uuid
      and sales_order_id=p_sales_order_id
      and product_id is not null
    for update;

    if not found then
      raise exception 'sales order item not found';
    end if;

    v_remaining_qty := v_order_item.quantity - v_order_item.delivered_quantity;
    v_reserved_remaining := v_order_item.reserved_quantity - v_order_item.delivered_quantity;

    if v_delivery_qty > v_remaining_qty then
      raise exception 'delivery quantity exceeds remaining order quantity';
    end if;

    if v_delivery_qty > v_reserved_remaining then
      raise exception 'delivery quantity exceeds reserved quantity';
    end if;

    insert into public.sales_delivery_items(delivery_id,sales_order_item_id,product_id,quantity,sort_order)
    values(v_delivery_id,v_order_item.id,v_order_item.product_id,v_delivery_qty,v_order_item.sort_order);

    update public.stock_balances
    set quantity_reserved=greatest(quantity_reserved - v_delivery_qty, 0)
    where company_id=p_company_id and warehouse_id=v_order.warehouse_id and product_id=v_order_item.product_id;

    update public.sales_order_items
    set delivered_quantity=delivered_quantity + v_delivery_qty
    where id=v_order_item.id;

    v_stock_items := v_stock_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_order_item.product_id,
      'quantity', v_delivery_qty,
      'unit_cost', 0,
      'sort_order', v_order_item.sort_order
    ));
  end loop;

  if jsonb_array_length(v_stock_items) = 0 then
    raise exception 'delivery items are required';
  end if;

  v_stock_movement_id := public.post_stock_movement(
    p_company_id,
    v_order.warehouse_id,
    p_delivery_date,
    'ISSUE',
    'Sales delivery ' || v_document_no,
    v_stock_items
  );

  update public.sales_deliveries
  set stock_movement_id=v_stock_movement_id
  where id=v_delivery_id;

  select coalesce(sum(quantity - delivered_quantity), 0) into v_total_remaining
  from public.sales_order_items
  where sales_order_id=p_sales_order_id;

  update public.sales_orders
  set status=case when v_total_remaining <= 0 then 'DELIVERED' else 'PARTIALLY_DELIVERED' end
  where id=p_sales_order_id;

  insert into public.sales_order_events(sales_order_id,event_type,from_status,to_status,message,created_by)
  values(
    p_sales_order_id,
    case when v_total_remaining <= 0 then 'DELIVERED' else 'PARTIALLY_DELIVERED' end,
    v_order.status,
    case when v_total_remaining <= 0 then 'DELIVERED' else 'PARTIALLY_DELIVERED' end,
    'Sales delivery posted with partial delivery support',
    v_actor
  );

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_delivery',v_delivery_id,'posted',jsonb_build_object('document_no',v_document_no,'stock_movement_id',v_stock_movement_id,'remaining_quantity',v_total_remaining));

  return v_delivery_id;
end;
$$;
