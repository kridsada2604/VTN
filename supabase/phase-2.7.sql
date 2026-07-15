-- VTN Business Phase 2.7 / Sales Order to Invoice
-- Run after phase-2.6.sql

alter table public.sales_invoices add column if not exists sales_order_id uuid references public.sales_orders(id);
alter table public.sales_invoice_items add column if not exists sales_order_item_id uuid references public.sales_order_items(id);

create unique index if not exists sales_invoices_sales_order_unique_idx
on public.sales_invoices(sales_order_id)
where sales_order_id is not null;

create index if not exists sales_invoice_items_sales_order_item_idx
on public.sales_invoice_items(sales_order_item_id)
where sales_order_item_id is not null;

create or replace function public.create_invoice_from_sales_order(
  p_company_id uuid,
  p_sales_order_id uuid,
  p_invoice_date date,
  p_due_date date,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.sales_orders%rowtype;
  v_invoice_id uuid;
  v_document_no text;
  v_item public.sales_order_items%rowtype;
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

  if v_order.status not in ('DELIVERED') then
    raise exception 'sales order must be delivered before invoice';
  end if;

  if exists(select 1 from public.sales_invoices i where i.sales_order_id=p_sales_order_id) then
    raise exception 'invoice already exists for sales order';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'INVOICE', 'INV');

  insert into public.sales_invoices(
    company_id, customer_id, sales_order_id, document_no, invoice_date, due_date, status,
    payment_terms, currency_code, notes, subtotal, discount_amount, tax_amount,
    total_amount, paid_amount, balance_amount, created_by
  )
  values(
    p_company_id, v_order.customer_id, v_order.id, v_document_no, p_invoice_date, p_due_date, 'ISSUED',
    v_order.payment_terms, v_order.currency_code, coalesce(p_notes, v_order.notes),
    v_order.subtotal, v_order.discount_amount, v_order.tax_amount,
    v_order.total_amount, 0, v_order.total_amount, v_actor
  )
  returning id into v_invoice_id;

  for v_item in select * from public.sales_order_items where sales_order_id=p_sales_order_id order by sort_order
  loop
    insert into public.sales_invoice_items(
      invoice_id, sales_order_item_id, product_id, description, quantity, unit_price,
      discount_percent, tax_rate, line_subtotal, line_discount, line_tax, line_total, sort_order
    )
    values(
      v_invoice_id, v_item.id, v_item.product_id, v_item.description, v_item.quantity, v_item.unit_price,
      v_item.discount_percent, v_item.tax_rate, v_item.line_subtotal, v_item.line_discount, v_item.line_tax, v_item.line_total, v_item.sort_order
    );
  end loop;

  insert into public.sales_invoice_events(invoice_id,event_type,from_status,to_status,message,created_by)
  values(v_invoice_id,'CREATED_FROM_SALES_ORDER',null,'ISSUED','สร้างใบแจ้งหนี้จาก Sales Order ' || v_order.document_no,v_actor);

  insert into public.sales_order_events(sales_order_id,event_type,from_status,to_status,message,created_by)
  values(p_sales_order_id,'INVOICED',v_order.status,v_order.status,'สร้าง Invoice ' || v_document_no,v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_invoice',v_invoice_id,'created_from_sales_order',jsonb_build_object('document_no',v_document_no,'sales_order_id',p_sales_order_id,'sales_order_no',v_order.document_no));

  return v_invoice_id;
end;
$$;
