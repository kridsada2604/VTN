-- VTN Business Phase 3.0 / Purchase payment and accounting posting
-- Run after phase-2.9.sql

alter table public.purchase_orders add column if not exists paid_amount numeric(18,2) not null default 0;
alter table public.purchase_orders add column if not exists balance_amount numeric(18,2) not null default 0;
alter table public.purchase_orders add column if not exists journal_entry_id uuid references public.journal_entries(id);

update public.purchase_orders
set balance_amount = greatest(total_amount - paid_amount, 0)
where balance_amount = 0 and total_amount > 0;

create table if not exists public.purchase_order_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  payment_no text not null,
  payment_date date not null default current_date,
  method text not null check(method in ('CASH','BANK_TRANSFER','CHEQUE','CREDIT_CARD','OTHER')),
  amount numeric(18,2) not null check(amount > 0),
  reference_no text,
  notes text,
  journal_entry_id uuid references public.journal_entries(id),
  paid_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(company_id, payment_no)
);

alter table public.purchase_order_payments enable row level security;

drop policy if exists "purchase order payments read membership" on public.purchase_order_payments;
drop policy if exists "purchase order payments insert manage" on public.purchase_order_payments;

create policy "purchase order payments read membership" on public.purchase_order_payments
for select to authenticated using(public.is_company_member(company_id));

create policy "purchase order payments insert manage" on public.purchase_order_payments
for insert to authenticated with check(public.can_manage_company(company_id));

create index if not exists purchase_order_payments_po_idx on public.purchase_order_payments(purchase_order_id, payment_date desc);
create index if not exists purchase_orders_payment_balance_idx on public.purchase_orders(company_id, balance_amount);

insert into public.accounting_accounts(company_id, code, name, account_type, normal_balance)
select c.id, '1300', 'ภาษีซื้อ', 'ASSET', 'DEBIT'
from public.companies c
where not exists (
  select 1 from public.accounting_accounts a where a.company_id=c.id and a.code='1300'
);

create or replace function public.post_purchase_order_to_accounting(
  p_company_id uuid,
  p_purchase_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_po public.purchase_orders%rowtype;
  v_inventory_account uuid;
  v_ap_account uuid;
  v_tax_account uuid;
  v_journal_id uuid;
  v_lines jsonb;
  v_inventory_amount numeric(18,2);
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_po
  from public.purchase_orders
  where id=p_purchase_order_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'purchase order not found';
  end if;

  if v_po.status not in ('RECEIVED','PARTIALLY_RECEIVED') then
    raise exception 'purchase order must be received before accounting posting';
  end if;

  if v_po.journal_entry_id is not null then
    return v_po.journal_entry_id;
  end if;

  select id into v_inventory_account from public.accounting_accounts where company_id=p_company_id and code='1200' and is_active=true;
  select id into v_ap_account from public.accounting_accounts where company_id=p_company_id and code='2000' and is_active=true;
  select id into v_tax_account from public.accounting_accounts where company_id=p_company_id and code='1300' and is_active=true;

  if v_inventory_account is null or v_ap_account is null or v_tax_account is null then
    raise exception 'required accounting accounts are missing';
  end if;

  v_inventory_amount := round((v_po.total_amount - v_po.tax_amount)::numeric, 2);
  v_lines := jsonb_build_array(
    jsonb_build_object('account_id', v_inventory_account, 'description', 'Purchase inventory ' || v_po.document_no, 'debit', v_inventory_amount, 'credit', 0, 'sort_order', 1)
  );

  if v_po.tax_amount > 0 then
    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account_id', v_tax_account, 'description', 'Purchase VAT ' || v_po.document_no, 'debit', v_po.tax_amount, 'credit', 0, 'sort_order', 2)
    );
  end if;

  v_lines := v_lines || jsonb_build_array(
    jsonb_build_object('account_id', v_ap_account, 'description', 'AP ' || v_po.document_no, 'debit', 0, 'credit', v_po.total_amount, 'sort_order', 3)
  );

  v_journal_id := public.post_journal_entry(
    p_company_id,
    v_po.order_date,
    'purchase_order',
    v_po.id,
    'Post purchase order ' || v_po.document_no,
    v_lines
  );

  update public.purchase_orders
  set journal_entry_id=v_journal_id
  where id=v_po.id;

  insert into public.purchase_order_events(purchase_order_id,event_type,from_status,to_status,message,created_by)
  values(v_po.id,'ACCOUNTING_POSTED',v_po.status,v_po.status,'Post purchase order to accounting',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'purchase_order',v_po.id,'accounting_posted',jsonb_build_object('journal_entry_id',v_journal_id));

  return v_journal_id;
end;
$$;

create or replace function public.pay_purchase_order(
  p_company_id uuid,
  p_purchase_order_id uuid,
  p_payment_date date,
  p_method text,
  p_amount numeric,
  p_reference_no text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_po public.purchase_orders%rowtype;
  v_payment_id uuid;
  v_payment_no text;
  v_cash_account uuid;
  v_ap_account uuid;
  v_journal_id uuid;
  v_new_paid numeric(18,2);
  v_new_balance numeric(18,2);
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_po
  from public.purchase_orders
  where id=p_purchase_order_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'purchase order not found';
  end if;

  if p_amount <= 0 or p_amount > coalesce(nullif(v_po.balance_amount,0), v_po.total_amount - v_po.paid_amount) then
    raise exception 'payment amount exceeds balance';
  end if;

  select id into v_cash_account from public.accounting_accounts where company_id=p_company_id and code='1000' and is_active=true;
  select id into v_ap_account from public.accounting_accounts where company_id=p_company_id and code='2000' and is_active=true;

  if v_cash_account is null or v_ap_account is null then
    raise exception 'required accounting accounts are missing';
  end if;

  v_payment_no := public.next_document_number(p_company_id, 'PURCHASE_PAYMENT', 'PP');

  insert into public.purchase_order_payments(company_id,purchase_order_id,payment_no,payment_date,method,amount,reference_no,notes,paid_by)
  values(p_company_id,p_purchase_order_id,v_payment_no,p_payment_date,p_method,p_amount,p_reference_no,p_notes,v_actor)
  returning id into v_payment_id;

  v_journal_id := public.post_journal_entry(
    p_company_id,
    p_payment_date,
    'purchase_payment',
    v_payment_id,
    'Post purchase payment ' || v_payment_no || ' for PO ' || v_po.document_no,
    jsonb_build_array(
      jsonb_build_object('account_id', v_ap_account, 'description', 'Clear AP ' || v_po.document_no, 'debit', p_amount, 'credit', 0, 'sort_order', 1),
      jsonb_build_object('account_id', v_cash_account, 'description', 'Cash paid ' || v_payment_no, 'debit', 0, 'credit', p_amount, 'sort_order', 2)
    )
  );

  update public.purchase_order_payments
  set journal_entry_id=v_journal_id
  where id=v_payment_id;

  v_new_paid := round((v_po.paid_amount + p_amount)::numeric, 2);
  v_new_balance := greatest(round((v_po.total_amount - v_new_paid)::numeric, 2), 0);

  update public.purchase_orders
  set paid_amount=v_new_paid,
      balance_amount=v_new_balance
  where id=v_po.id;

  insert into public.purchase_order_events(purchase_order_id,event_type,from_status,to_status,message,created_by)
  values(v_po.id,'PAYMENT_POSTED',v_po.status,v_po.status,'Post supplier payment ' || v_payment_no,v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'purchase_payment',v_payment_id,'posted',jsonb_build_object('payment_no',v_payment_no,'purchase_order_id',v_po.id,'journal_entry_id',v_journal_id));

  return v_payment_id;
end;
$$;
