-- VTN Business Phase 2.8 / Quotation to Sales Order
-- Run after phase-2.7.sql

alter table public.sales_orders add column if not exists quotation_id uuid references public.sales_quotations(id);

create unique index if not exists sales_orders_quotation_unique_idx
on public.sales_orders(quotation_id)
where quotation_id is not null;

create or replace function public.create_sales_order_from_quotation(
  p_company_id uuid,
  p_quotation_id uuid,
  p_order_date date,
  p_requested_delivery_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quotation public.sales_quotations%rowtype;
  v_order_id uuid;
  v_document_no text;
  v_item public.sales_quotation_items%rowtype;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_quotation
  from public.sales_quotations
  where id=p_quotation_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'quotation not found';
  end if;

  if v_quotation.status <> 'ACCEPTED' then
    raise exception 'quotation must be accepted before sales order';
  end if;

  if exists(select 1 from public.sales_orders o where o.quotation_id=p_quotation_id) then
    raise exception 'sales order already exists for quotation';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'SALES_ORDER', 'SO');

  insert into public.sales_orders(
    company_id, customer_id, quotation_id, document_no, order_date, requested_delivery_date,
    status, payment_terms, currency_code, notes, subtotal, discount_amount, tax_amount, total_amount, created_by
  )
  values(
    p_company_id, v_quotation.customer_id, v_quotation.id, v_document_no, p_order_date, p_requested_delivery_date,
    'CONFIRMED', v_quotation.payment_terms, v_quotation.currency_code, v_quotation.notes,
    v_quotation.subtotal, v_quotation.discount_amount, v_quotation.tax_amount, v_quotation.total_amount, v_actor
  )
  returning id into v_order_id;

  for v_item in select * from public.sales_quotation_items where quotation_id=p_quotation_id order by sort_order
  loop
    insert into public.sales_order_items(
      sales_order_id, product_id, description, quantity, unit_price, discount_percent, tax_rate,
      line_subtotal, line_discount, line_tax, line_total, sort_order
    )
    values(
      v_order_id, v_item.product_id, v_item.description, v_item.quantity, v_item.unit_price, v_item.discount_percent, v_item.tax_rate,
      v_item.line_subtotal, v_item.line_discount, v_item.line_tax, v_item.line_total, v_item.sort_order
    );
  end loop;

  insert into public.sales_order_events(sales_order_id,event_type,to_status,message,created_by)
  values(v_order_id,'CREATED_FROM_QUOTATION','CONFIRMED','สร้าง Sales Order จาก Quotation ' || v_quotation.document_no,v_actor);

  insert into public.sales_quotation_events(quotation_id,event_type,from_status,to_status,message,created_by)
  values(p_quotation_id,'CONVERTED_TO_SALES_ORDER',v_quotation.status,v_quotation.status,'สร้าง Sales Order ' || v_document_no,v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_order',v_order_id,'created_from_quotation',jsonb_build_object('document_no',v_document_no,'quotation_id',p_quotation_id,'quotation_no',v_quotation.document_no));

  return v_order_id;
end;
$$;
