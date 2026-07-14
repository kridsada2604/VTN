-- VTN Business Phase 1.7 / Sprint 9 accounting foundation
-- Run after phase-1.6.sql

create table if not exists public.accounting_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null check(account_type in ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
  normal_balance text not null check(normal_balance in ('DEBIT','CREDIT')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_no text not null,
  entry_date date not null default current_date,
  source_type text,
  source_id uuid,
  status text not null default 'POSTED' check(status in ('DRAFT','POSTED','REVERSED')),
  memo text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.accounting_accounts(id),
  description text,
  debit numeric(18,2) not null default 0 check(debit >= 0),
  credit numeric(18,2) not null default 0 check(credit >= 0),
  sort_order integer not null default 0,
  check((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create or replace trigger accounting_accounts_updated_at
before update on public.accounting_accounts
for each row execute function public.set_updated_at();

create or replace trigger journal_entries_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

alter table public.accounting_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_entry_lines enable row level security;

drop policy if exists "accounts read membership" on public.accounting_accounts;
drop policy if exists "accounts manage" on public.accounting_accounts;
drop policy if exists "journal entries read membership" on public.journal_entries;
drop policy if exists "journal lines read membership" on public.journal_entry_lines;
drop policy if exists "journal entries insert manage" on public.journal_entries;
drop policy if exists "journal lines insert manage" on public.journal_entry_lines;

create policy "accounts read membership" on public.accounting_accounts
for select to authenticated using(public.is_company_member(company_id));

create policy "accounts manage" on public.accounting_accounts
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create policy "journal entries read membership" on public.journal_entries
for select to authenticated using(public.is_company_member(company_id));

create policy "journal lines read membership" on public.journal_entry_lines
for select to authenticated using(
  exists(select 1 from public.journal_entries j where j.id=journal_entry_id and public.is_company_member(j.company_id))
);

create policy "journal entries insert manage" on public.journal_entries
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "journal lines insert manage" on public.journal_entry_lines
for insert to authenticated with check(
  exists(select 1 from public.journal_entries j where j.id=journal_entry_id and public.can_manage_company(j.company_id))
);

create index if not exists accounting_accounts_company_code_idx on public.accounting_accounts(company_id, code);
create index if not exists journal_entries_company_date_idx on public.journal_entries(company_id, entry_date desc);
create index if not exists journal_lines_entry_idx on public.journal_entry_lines(journal_entry_id, sort_order);
create index if not exists journal_lines_account_idx on public.journal_entry_lines(account_id);

insert into public.accounting_accounts(company_id, code, name, account_type, normal_balance)
select c.id, v.code, v.name, v.account_type, v.normal_balance
from public.companies c
cross join (values
  ('1000','เงินสดและเงินฝากธนาคาร','ASSET','DEBIT'),
  ('1100','ลูกหนี้การค้า','ASSET','DEBIT'),
  ('1200','สินค้าคงเหลือ','ASSET','DEBIT'),
  ('2000','เจ้าหนี้การค้า','LIABILITY','CREDIT'),
  ('2100','ภาษีขาย','LIABILITY','CREDIT'),
  ('3000','ทุน','EQUITY','CREDIT'),
  ('4000','รายได้จากการขาย','REVENUE','CREDIT'),
  ('5000','ต้นทุนขาย','EXPENSE','DEBIT'),
  ('6000','ค่าใช้จ่ายทั่วไป','EXPENSE','DEBIT')
) as v(code, name, account_type, normal_balance)
on conflict(company_id, code) do nothing;

create or replace function public.post_journal_entry(
  p_company_id uuid,
  p_entry_date date,
  p_source_type text,
  p_source_id uuid,
  p_memo text,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry_id uuid;
  v_document_no text;
  v_line jsonb;
  v_debit_total numeric(18,2);
  v_credit_total numeric(18,2);
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) < 2 then
    raise exception 'journal entry requires at least two lines';
  end if;

  select coalesce(sum((line->>'debit')::numeric),0), coalesce(sum((line->>'credit')::numeric),0)
  into v_debit_total, v_credit_total
  from jsonb_array_elements(p_lines) as line;

  if v_debit_total <= 0 or v_credit_total <= 0 or v_debit_total <> v_credit_total then
    raise exception 'journal entry is not balanced';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'JOURNAL', 'JV');

  insert into public.journal_entries(company_id, document_no, entry_date, source_type, source_id, status, memo, created_by)
  values(p_company_id, v_document_no, p_entry_date, p_source_type, p_source_id, 'POSTED', p_memo, v_actor)
  returning id into v_entry_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    if not exists(select 1 from public.accounting_accounts a where a.id=(v_line->>'account_id')::uuid and a.company_id=p_company_id and a.is_active=true) then
      raise exception 'account does not belong to company';
    end if;

    insert into public.journal_entry_lines(journal_entry_id, account_id, description, debit, credit, sort_order)
    values(
      v_entry_id,
      (v_line->>'account_id')::uuid,
      nullif(v_line->>'description',''),
      coalesce((v_line->>'debit')::numeric,0),
      coalesce((v_line->>'credit')::numeric,0),
      coalesce((v_line->>'sort_order')::integer,0)
    );
  end loop;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'journal_entry',v_entry_id,'posted',jsonb_build_object('document_no',v_document_no,'debit_total',v_debit_total,'credit_total',v_credit_total));

  return v_entry_id;
end;
$$;
