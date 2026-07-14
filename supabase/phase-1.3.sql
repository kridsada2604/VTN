-- VTN Business Phase 1.3 / Sales quotations
-- Run after phase-1.sql, phase-1.1.sql and phase-1.2.sql

create table if not exists public.document_sequences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_type text not null,
  prefix text not null,
  running_year integer not null,
  current_number bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique(company_id, document_type, running_year)
);

create table if not exists public.sales_quotations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  document_no text not null,
  quotation_date date not null default current_date,
  valid_until date,
  status text not null default 'DRAFT' check(status in ('DRAFT','SENT','ACCEPTED','REJECTED','CANCELLED')),
  notes text,
  subtotal numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, document_no)
);

create table if not exists public.sales_quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.sales_quotations(id) on delete cascade,
  product_id uuid references public.products(id),
  description text not null,
  quantity numeric(18,4) not null default 1 check(quantity > 0),
  unit_price numeric(18,2) not null default 0,
  discount_percent numeric(7,4) not null default 0,
  tax_rate numeric(7,4) not null default 7,
  line_subtotal numeric(18,2) not null default 0,
  line_discount numeric(18,2) not null default 0,
  line_tax numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  sort_order integer not null default 0
);

create or replace trigger document_sequences_updated_at before update on public.document_sequences for each row execute function public.set_updated_at();
create or replace trigger sales_quotations_updated_at before update on public.sales_quotations for each row execute function public.set_updated_at();

alter table public.document_sequences enable row level security;
alter table public.sales_quotations enable row level security;
alter table public.sales_quotation_items enable row level security;

create policy "document sequences read membership" on public.document_sequences for select to authenticated using(public.is_company_member(company_id));
create policy "quotations read membership" on public.sales_quotations for select to authenticated using(public.is_company_member(company_id));
create policy "quotation items read membership" on public.sales_quotation_items for select to authenticated using(
  exists(select 1 from public.sales_quotations q where q.id=quotation_id and public.is_company_member(q.company_id))
);
create policy "quotations insert manage" on public.sales_quotations for insert to authenticated with check(public.can_manage_company(company_id));
create policy "quotations update manage" on public.sales_quotations for update to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));
create policy "quotation items insert manage" on public.sales_quotation_items for insert to authenticated with check(
  exists(select 1 from public.sales_quotations q where q.id=quotation_id and public.can_manage_company(q.company_id))
);
create policy "quotation items update manage" on public.sales_quotation_items for update to authenticated using(
  exists(select 1 from public.sales_quotations q where q.id=quotation_id and public.can_manage_company(q.company_id))
);
create policy "quotation items delete manage" on public.sales_quotation_items for delete to authenticated using(
  exists(select 1 from public.sales_quotations q where q.id=quotation_id and public.can_manage_company(q.company_id))
);

create index if not exists quotations_company_date_idx on public.sales_quotations(company_id, quotation_date desc);
create index if not exists quotations_customer_idx on public.sales_quotations(customer_id);
create index if not exists quotation_items_quotation_idx on public.sales_quotation_items(quotation_id, sort_order);

create or replace function public.next_document_number(p_company_id uuid, p_document_type text, p_prefix text)
returns text language plpgsql security definer set search_path='' as $$
declare v_year integer := extract(year from current_date); v_no bigint;
begin
  if not public.can_manage_company(p_company_id) then raise exception 'permission denied'; end if;
  insert into public.document_sequences(company_id,document_type,prefix,running_year,current_number)
  values(p_company_id,p_document_type,p_prefix,v_year,1)
  on conflict(company_id,document_type,running_year)
  do update set current_number=public.document_sequences.current_number+1, prefix=excluded.prefix, updated_at=now()
  returning current_number into v_no;
  return p_prefix || '-' || v_year::text || '-' || lpad(v_no::text,6,'0');
end; $$;
