-- VTN Business Phase 4.6 / Marketplace order conversion
-- Run after phase-4.5.sql

alter table public.marketplace_orders add column if not exists sales_order_id uuid references public.sales_orders(id) on delete set null;
alter table public.marketplace_orders add column if not exists sales_delivery_id uuid references public.sales_deliveries(id) on delete set null;

create index if not exists marketplace_orders_sales_order_idx on public.marketplace_orders(sales_order_id);

create or replace function public.convert_marketplace_order_to_sales(
  p_company_id uuid,
  p_marketplace_order_id uuid,
  p_warehouse_id uuid,
  p_auto_deliver boolean,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.marketplace_orders%rowtype;
  v_customer_id uuid;
  v_customer_code text;
  v_sales_order_id uuid;
  v_delivery_id uuid;
  v_document_no text;
  v_item public.marketplace_order_items%rowtype;
  v_line_subtotal numeric(18,2);
  v_discount_percent numeric(9,4);
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_order
  from public.marketplace_orders
  where id=p_marketplace_order_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'marketplace order not found';
  end if;

  if v_order.sales_order_id is not null then
    raise exception 'marketplace order already converted';
  end if;

  if exists(select 1 from public.marketplace_order_items i where i.order_id=p_marketplace_order_id and i.product_id is null) then
    raise exception 'all marketplace order items must be mapped before conversion';
  end if;

  if p_warehouse_id is not null and not exists(select 1 from public.warehouses w where w.id=p_warehouse_id and w.company_id=p_company_id and w.is_active=true) then
    raise exception 'warehouse does not belong to company';
  end if;

  if v_order.customer_id is not null then
    v_customer_id := v_order.customer_id;
  else
    v_customer_code := 'MKT-' || upper(substr(replace(v_order.id::text, '-', ''), 1, 10));

    insert into public.customers(company_id, code, name, phone, address)
    values(p_company_id, v_customer_code, v_order.buyer_name, v_order.buyer_phone, v_order.shipping_address)
    on conflict(company_id, code) do update set
      name=excluded.name,
      phone=excluded.phone,
      address=excluded.address
    returning id into v_customer_id;

    update public.marketplace_orders
    set customer_id=v_customer_id
    where id=p_marketplace_order_id;
  end if;

  v_document_no := public.next_document_number(p_company_id, 'SALES_ORDER', 'SO');

  insert into public.sales_orders(
    company_id, customer_id, warehouse_id, document_no, order_date, requested_delivery_date,
    status, payment_terms, currency_code, notes, subtotal, discount_amount, tax_amount, total_amount, created_by
  )
  values(
    p_company_id,
    v_customer_id,
    p_warehouse_id,
    v_document_no,
    v_order.order_date::date,
    null,
    'CONFIRMED',
    'Marketplace paid',
    v_order.currency_code,
    concat('Converted from marketplace order ', v_order.order_no, '. ', coalesce(p_notes,'')),
    v_order.subtotal,
    v_order.discount_amount,
    v_order.tax_amount,
    v_order.total_amount,
    v_actor
  )
  returning id into v_sales_order_id;

  for v_item in select * from public.marketplace_order_items where order_id=p_marketplace_order_id order by sort_order
  loop
    v_line_subtotal := round((v_item.quantity * v_item.unit_price)::numeric, 2);
    v_discount_percent := case when v_line_subtotal > 0 then round((v_item.line_discount / v_line_subtotal * 100)::numeric, 4) else 0 end;

    insert into public.sales_order_items(
      sales_order_id, product_id, description, quantity, unit_price, discount_percent, tax_rate,
      line_subtotal, line_discount, line_tax, line_total, sort_order
    )
    values(
      v_sales_order_id,
      v_item.product_id,
      v_item.description,
      v_item.quantity,
      v_item.unit_price,
      v_discount_percent,
      0,
      v_line_subtotal,
      v_item.line_discount,
      0,
      v_item.line_total,
      v_item.sort_order
    );
  end loop;

  insert into public.sales_order_events(sales_order_id,event_type,to_status,message,created_by)
  values(v_sales_order_id,'CREATED','CONFIRMED','Converted from Marketplace Order ' || v_order.order_no,v_actor);

  if p_warehouse_id is not null then
    perform public.reserve_sales_order_stock(p_company_id, v_sales_order_id, p_warehouse_id);

    if coalesce(p_auto_deliver,false) then
      v_delivery_id := public.deliver_sales_order(p_company_id, v_sales_order_id, current_date, 'Auto delivery from Marketplace Order ' || v_order.order_no);
    end if;
  end if;

  update public.marketplace_orders
  set sales_order_id=v_sales_order_id,
      sales_delivery_id=v_delivery_id,
      status='CONFIRMED',
      fulfillment_status=case when v_delivery_id is not null then 'READY_TO_SHIP' else fulfillment_status end
  where id=p_marketplace_order_id;

  insert into public.marketplace_order_events(order_id,event_type,to_status,message,created_by)
  values(p_marketplace_order_id,'converted','CONFIRMED','Converted to Sales Order ' || v_document_no,v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'marketplace_order',p_marketplace_order_id,'converted',jsonb_build_object('sales_order_id',v_sales_order_id,'sales_delivery_id',v_delivery_id));

  return jsonb_build_object('sales_order_id', v_sales_order_id, 'sales_delivery_id', v_delivery_id);
end;
$$;
