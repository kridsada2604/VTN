-- VTN Business Phase 3.7 / Project billing
-- Run after phase-3.6.sql

alter table public.sales_invoices add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists sales_invoices_project_idx on public.sales_invoices(project_id, invoice_date desc);

create or replace function public.create_project_invoice(
  p_company_id uuid,
  p_project_id uuid,
  p_invoice_date date,
  p_due_date date,
  p_description text,
  p_amount numeric,
  p_tax_rate numeric,
  p_payment_terms text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects%rowtype;
  v_invoice_id uuid;
  v_document_no text;
  v_line_tax numeric(18,2);
  v_line_total numeric(18,2);
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

  if v_project.customer_id is null then
    raise exception 'project customer is required before billing';
  end if;

  if nullif(trim(p_description),'') is null then
    raise exception 'billing description is required';
  end if;

  if coalesce(p_amount,0) <= 0 then
    raise exception 'billing amount must be greater than zero';
  end if;

  v_line_tax := round((p_amount * greatest(coalesce(p_tax_rate,0),0) / 100)::numeric, 2);
  v_line_total := round((p_amount + v_line_tax)::numeric, 2);
  v_document_no := public.next_document_number(p_company_id, 'INVOICE', 'INV');

  insert into public.sales_invoices(
    company_id, customer_id, project_id, document_no, invoice_date, due_date, status,
    payment_terms, currency_code, notes, subtotal, discount_amount, tax_amount,
    total_amount, paid_amount, balance_amount, created_by
  )
  values(
    p_company_id, v_project.customer_id, v_project.id, v_document_no, p_invoice_date, p_due_date, 'ISSUED',
    p_payment_terms, 'THB', p_notes, p_amount, 0, v_line_tax,
    v_line_total, 0, v_line_total, v_actor
  )
  returning id into v_invoice_id;

  insert into public.sales_invoice_items(
    invoice_id, product_id, description, quantity, unit_price, discount_percent,
    tax_rate, line_subtotal, line_discount, line_tax, line_total, sort_order
  )
  values(
    v_invoice_id, null, trim(p_description), 1, p_amount, 0,
    greatest(coalesce(p_tax_rate,0),0), p_amount, 0, v_line_tax, v_line_total, 1
  );

  update public.projects
  set revenue_amount=round((revenue_amount + v_line_total)::numeric, 2),
      status=case when status='PLANNED' then 'ACTIVE' else status end
  where id=v_project.id;

  insert into public.sales_invoice_events(invoice_id,event_type,from_status,to_status,message,created_by)
  values(v_invoice_id,'PROJECT_BILLING_CREATED',null,'ISSUED','Create project invoice for ' || v_project.project_no,v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'project',v_project.id,'invoice_created',jsonb_build_object('invoice_id',v_invoice_id,'document_no',v_document_no,'amount',v_line_total));

  return v_invoice_id;
end;
$$;
