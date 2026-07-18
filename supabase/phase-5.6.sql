-- VTN Business Phase 5.6 / Company tax profile, withholding tax, and payment installments
-- Run after phase-5.5.sql

alter table public.companies add column if not exists is_vat_registered boolean not null default true;
alter table public.companies add column if not exists default_vat_rate numeric(7,4) not null default 7;
alter table public.companies add column if not exists default_withholding_tax_rate numeric(7,4) not null default 0;
alter table public.companies add column if not exists tax_invoice_name text;
alter table public.companies add column if not exists tax_invoice_address text;

alter table public.sales_quotations add column if not exists is_vat_registered boolean not null default true;
alter table public.sales_quotations add column if not exists withholding_tax_rate numeric(7,4) not null default 0;
alter table public.sales_quotations add column if not exists withholding_tax_amount numeric(18,2) not null default 0;
alter table public.sales_quotations add column if not exists grand_total_amount numeric(18,2) not null default 0;
alter table public.sales_quotations add column if not exists net_payable_amount numeric(18,2) not null default 0;

alter table public.sales_invoices add column if not exists is_vat_registered boolean not null default true;
alter table public.sales_invoices add column if not exists withholding_tax_rate numeric(7,4) not null default 0;
alter table public.sales_invoices add column if not exists withholding_tax_amount numeric(18,2) not null default 0;
alter table public.sales_invoices add column if not exists grand_total_amount numeric(18,2) not null default 0;
alter table public.sales_invoices add column if not exists net_payable_amount numeric(18,2) not null default 0;

update public.sales_quotations
set grand_total_amount = case when grand_total_amount = 0 then total_amount + withholding_tax_amount else grand_total_amount end,
    net_payable_amount = case when net_payable_amount = 0 then total_amount else net_payable_amount end;

update public.sales_invoices
set grand_total_amount = case when grand_total_amount = 0 then total_amount + withholding_tax_amount else grand_total_amount end,
    net_payable_amount = case when net_payable_amount = 0 then total_amount else net_payable_amount end;

create table if not exists public.sales_quotation_installments (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.sales_quotations(id) on delete cascade,
  installment_no integer not null check(installment_no > 0),
  due_date date,
  description text,
  percent numeric(7,4) not null default 0 check(percent >= 0),
  amount numeric(18,2) not null default 0 check(amount >= 0),
  created_at timestamptz not null default now(),
  unique(quotation_id, installment_no)
);

create table if not exists public.sales_invoice_installments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  installment_no integer not null check(installment_no > 0),
  due_date date,
  description text,
  percent numeric(7,4) not null default 0 check(percent >= 0),
  amount numeric(18,2) not null default 0 check(amount >= 0),
  paid_amount numeric(18,2) not null default 0 check(paid_amount >= 0),
  status text not null default 'OPEN' check(status in ('OPEN','PARTIALLY_PAID','PAID','VOID')),
  created_at timestamptz not null default now(),
  unique(invoice_id, installment_no)
);

alter table public.sales_quotation_installments enable row level security;
alter table public.sales_invoice_installments enable row level security;

drop policy if exists "quotation installments read membership" on public.sales_quotation_installments;
drop policy if exists "quotation installments manage" on public.sales_quotation_installments;
drop policy if exists "invoice installments read membership" on public.sales_invoice_installments;
drop policy if exists "invoice installments manage" on public.sales_invoice_installments;

create policy "quotation installments read membership" on public.sales_quotation_installments
for select to authenticated using(
  exists(select 1 from public.sales_quotations q where q.id = quotation_id and public.is_company_member(q.company_id))
);

create policy "quotation installments manage" on public.sales_quotation_installments
for all to authenticated using(
  exists(select 1 from public.sales_quotations q where q.id = quotation_id and public.can_manage_company(q.company_id))
) with check(
  exists(select 1 from public.sales_quotations q where q.id = quotation_id and public.can_manage_company(q.company_id))
);

create policy "invoice installments read membership" on public.sales_invoice_installments
for select to authenticated using(
  exists(select 1 from public.sales_invoices i where i.id = invoice_id and public.is_company_member(i.company_id))
);

create policy "invoice installments manage" on public.sales_invoice_installments
for all to authenticated using(
  exists(select 1 from public.sales_invoices i where i.id = invoice_id and public.can_manage_company(i.company_id))
) with check(
  exists(select 1 from public.sales_invoices i where i.id = invoice_id and public.can_manage_company(i.company_id))
);

create index if not exists quotation_installments_quotation_idx on public.sales_quotation_installments(quotation_id, installment_no);
create index if not exists invoice_installments_invoice_idx on public.sales_invoice_installments(invoice_id, installment_no);

create or replace function public.update_company_tax_profile(
  p_company_id uuid,
  p_is_vat_registered boolean,
  p_default_vat_rate numeric,
  p_default_withholding_tax_rate numeric,
  p_tax_invoice_name text,
  p_tax_invoice_address text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_default_vat_rate < 0 or p_default_vat_rate > 100 then
    raise exception 'invalid vat rate';
  end if;

  if p_default_withholding_tax_rate < 0 or p_default_withholding_tax_rate > 100 then
    raise exception 'invalid withholding tax rate';
  end if;

  update public.companies
  set is_vat_registered = p_is_vat_registered,
      default_vat_rate = case when p_is_vat_registered then p_default_vat_rate else 0 end,
      default_withholding_tax_rate = p_default_withholding_tax_rate,
      tax_invoice_name = nullif(trim(coalesce(p_tax_invoice_name, '')), ''),
      tax_invoice_address = nullif(trim(coalesce(p_tax_invoice_address, '')), '')
  where id = p_company_id;

  insert into public.audit_logs(company_id, actor_id, entity_type, entity_id, action, metadata)
  values(
    p_company_id,
    v_actor,
    'company_tax_profile',
    p_company_id,
    'updated',
    jsonb_build_object(
      'is_vat_registered', p_is_vat_registered,
      'default_vat_rate', case when p_is_vat_registered then p_default_vat_rate else 0 end,
      'default_withholding_tax_rate', p_default_withholding_tax_rate
    )
  );
end;
$$;