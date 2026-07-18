-- VTN Business Phase 5.7 / Accounting tax codes and VAT-driven sales UI foundation
-- Run after phase-5.6.sql

create table if not exists public.accounting_tax_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  tax_type text not null default 'SALES_VAT' check(tax_type in ('SALES_VAT','PURCHASE_VAT','NO_VAT','WITHHOLDING_TAX')),
  rate numeric(7,4) not null default 0 check(rate >= 0),
  account_id uuid references public.accounting_accounts(id),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

alter table public.companies add column if not exists default_sales_tax_code_id uuid references public.accounting_tax_codes(id);

create or replace trigger accounting_tax_codes_updated_at
before update on public.accounting_tax_codes
for each row execute function public.set_updated_at();

alter table public.accounting_tax_codes enable row level security;

drop policy if exists "tax codes read membership" on public.accounting_tax_codes;
drop policy if exists "tax codes manage" on public.accounting_tax_codes;

create policy "tax codes read membership" on public.accounting_tax_codes
for select to authenticated using(public.is_company_member(company_id));

create policy "tax codes manage" on public.accounting_tax_codes
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create index if not exists accounting_tax_codes_company_type_idx on public.accounting_tax_codes(company_id, tax_type, is_active);

insert into public.accounting_tax_codes(company_id, code, name, tax_type, rate, account_id, is_default, is_active)
select c.id, 'VAT7', 'Sales VAT 7%', 'SALES_VAT', 7, a.id, c.is_vat_registered, true
from public.companies c
left join public.accounting_accounts a on a.company_id = c.id and a.code = '2100'
on conflict(company_id, code) do update
set rate = excluded.rate,
    account_id = excluded.account_id,
    is_default = public.accounting_tax_codes.is_default or excluded.is_default,
    is_active = true;

insert into public.accounting_tax_codes(company_id, code, name, tax_type, rate, account_id, is_default, is_active)
select c.id, 'NO_VAT', 'No VAT', 'NO_VAT', 0, null, not c.is_vat_registered, true
from public.companies c
on conflict(company_id, code) do update
set is_default = public.accounting_tax_codes.is_default or excluded.is_default,
    is_active = true;

update public.companies c
set default_sales_tax_code_id = tc.id,
    default_vat_rate = case when c.is_vat_registered then tc.rate else 0 end
from public.accounting_tax_codes tc
where tc.company_id = c.id
  and ((c.is_vat_registered and tc.code = 'VAT7') or (not c.is_vat_registered and tc.code = 'NO_VAT'))
  and c.default_sales_tax_code_id is null;

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
  v_tax_code_id uuid;
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

  if p_is_vat_registered then
    insert into public.accounting_tax_codes(company_id, code, name, tax_type, rate, account_id, is_default, is_active)
    select p_company_id, 'VAT' || replace(trim(to_char(p_default_vat_rate, 'FM999990.99')), '.', '_'), 'Sales VAT ' || p_default_vat_rate::text || '%', 'SALES_VAT', p_default_vat_rate, a.id, true, true
    from public.accounting_accounts a
    where a.company_id = p_company_id and a.code = '2100'
    limit 1
    on conflict(company_id, code) do update
    set rate = excluded.rate, account_id = excluded.account_id, is_default = true, is_active = true
    returning id into v_tax_code_id;
  else
    insert into public.accounting_tax_codes(company_id, code, name, tax_type, rate, is_default, is_active)
    values(p_company_id, 'NO_VAT', 'No VAT', 'NO_VAT', 0, true, true)
    on conflict(company_id, code) do update
    set is_default = true, is_active = true
    returning id into v_tax_code_id;
  end if;

  update public.accounting_tax_codes
  set is_default = false
  where company_id = p_company_id and id <> v_tax_code_id and tax_type in ('SALES_VAT','NO_VAT');

  update public.companies
  set is_vat_registered = p_is_vat_registered,
      default_vat_rate = case when p_is_vat_registered then p_default_vat_rate else 0 end,
      default_withholding_tax_rate = p_default_withholding_tax_rate,
      default_sales_tax_code_id = v_tax_code_id,
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
      'default_withholding_tax_rate', p_default_withholding_tax_rate,
      'default_sales_tax_code_id', v_tax_code_id
    )
  );
end;
$$;