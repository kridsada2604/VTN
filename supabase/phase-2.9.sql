-- VTN Business Phase 2.9 / Sales accounting auto posting
-- Run after phase-2.8.sql

alter table public.sales_invoices add column if not exists journal_entry_id uuid references public.journal_entries(id);
alter table public.sales_invoice_payments add column if not exists journal_entry_id uuid references public.journal_entries(id);

create index if not exists sales_invoices_journal_entry_idx on public.sales_invoices(journal_entry_id);
create index if not exists sales_invoice_payments_journal_entry_idx on public.sales_invoice_payments(journal_entry_id);

create or replace function public.post_sales_invoice_to_accounting(
  p_company_id uuid,
  p_invoice_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.sales_invoices%rowtype;
  v_ar_account uuid;
  v_revenue_account uuid;
  v_tax_account uuid;
  v_journal_id uuid;
  v_lines jsonb;
  v_revenue_amount numeric(18,2);
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_invoice
  from public.sales_invoices
  where id=p_invoice_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'invoice not found';
  end if;

  if v_invoice.status = 'VOID' then
    raise exception 'void invoice cannot be posted';
  end if;

  if v_invoice.journal_entry_id is not null then
    return v_invoice.journal_entry_id;
  end if;

  select id into v_ar_account from public.accounting_accounts where company_id=p_company_id and code='1100' and is_active=true;
  select id into v_revenue_account from public.accounting_accounts where company_id=p_company_id and code='4000' and is_active=true;
  select id into v_tax_account from public.accounting_accounts where company_id=p_company_id and code='2100' and is_active=true;

  if v_ar_account is null or v_revenue_account is null or v_tax_account is null then
    raise exception 'required accounting accounts are missing';
  end if;

  v_revenue_amount := round((v_invoice.total_amount - v_invoice.tax_amount)::numeric, 2);
  v_lines := jsonb_build_array(
    jsonb_build_object('account_id', v_ar_account, 'description', 'AR ' || v_invoice.document_no, 'debit', v_invoice.total_amount, 'credit', 0, 'sort_order', 1),
    jsonb_build_object('account_id', v_revenue_account, 'description', 'Sales revenue ' || v_invoice.document_no, 'debit', 0, 'credit', v_revenue_amount, 'sort_order', 2)
  );

  if v_invoice.tax_amount > 0 then
    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account_id', v_tax_account, 'description', 'Output VAT ' || v_invoice.document_no, 'debit', 0, 'credit', v_invoice.tax_amount, 'sort_order', 3)
    );
  end if;

  v_journal_id := public.post_journal_entry(
    p_company_id,
    v_invoice.invoice_date,
    'sales_invoice',
    v_invoice.id,
    'Post invoice ' || v_invoice.document_no,
    v_lines
  );

  update public.sales_invoices
  set journal_entry_id=v_journal_id
  where id=v_invoice.id;

  insert into public.sales_invoice_events(invoice_id,event_type,from_status,to_status,message,created_by)
  values(v_invoice.id,'ACCOUNTING_POSTED',v_invoice.status,v_invoice.status,'Post invoice to accounting',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_invoice',v_invoice.id,'accounting_posted',jsonb_build_object('journal_entry_id',v_journal_id));

  return v_journal_id;
end;
$$;

create or replace function public.post_invoice_payment_to_accounting(
  p_company_id uuid,
  p_payment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.sales_invoice_payments%rowtype;
  v_invoice public.sales_invoices%rowtype;
  v_cash_account uuid;
  v_ar_account uuid;
  v_journal_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_payment
  from public.sales_invoice_payments
  where id=p_payment_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'payment not found';
  end if;

  if v_payment.journal_entry_id is not null then
    return v_payment.journal_entry_id;
  end if;

  select * into v_invoice
  from public.sales_invoices
  where id=v_payment.invoice_id and company_id=p_company_id;

  if not found then
    raise exception 'invoice not found';
  end if;

  select id into v_cash_account from public.accounting_accounts where company_id=p_company_id and code='1000' and is_active=true;
  select id into v_ar_account from public.accounting_accounts where company_id=p_company_id and code='1100' and is_active=true;

  if v_cash_account is null or v_ar_account is null then
    raise exception 'required accounting accounts are missing';
  end if;

  v_journal_id := public.post_journal_entry(
    p_company_id,
    v_payment.payment_date,
    'sales_invoice_payment',
    v_payment.id,
    'Post payment ' || v_payment.payment_no || ' for invoice ' || v_invoice.document_no,
    jsonb_build_array(
      jsonb_build_object('account_id', v_cash_account, 'description', 'Cash received ' || v_payment.payment_no, 'debit', v_payment.amount, 'credit', 0, 'sort_order', 1),
      jsonb_build_object('account_id', v_ar_account, 'description', 'Clear AR ' || v_invoice.document_no, 'debit', 0, 'credit', v_payment.amount, 'sort_order', 2)
    )
  );

  update public.sales_invoice_payments
  set journal_entry_id=v_journal_id
  where id=v_payment.id;

  insert into public.sales_invoice_events(invoice_id,event_type,from_status,to_status,message,created_by)
  values(v_invoice.id,'PAYMENT_ACCOUNTING_POSTED',v_invoice.status,v_invoice.status,'Post payment to accounting',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'sales_invoice_payment',v_payment.id,'accounting_posted',jsonb_build_object('journal_entry_id',v_journal_id,'invoice_id',v_invoice.id));

  return v_journal_id;
end;
$$;
