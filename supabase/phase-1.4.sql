-- VTN Business Phase 1.4 / Sales workflow enhancement
-- Run after phase-1.3.sql

alter table public.sales_quotations add column if not exists salesperson text;
alter table public.sales_quotations add column if not exists project_name text;
alter table public.sales_quotations add column if not exists payment_terms text;
alter table public.sales_quotations add column if not exists currency_code text not null default 'THB';

create table if not exists public.sales_quotation_events (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.sales_quotations(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.sales_quotation_events enable row level security;

create policy "quotation events read membership" on public.sales_quotation_events for select to authenticated using(
  exists(select 1 from public.sales_quotations q where q.id=quotation_id and public.is_company_member(q.company_id))
);
create policy "quotation events insert manage" on public.sales_quotation_events for insert to authenticated with check(
  exists(select 1 from public.sales_quotations q where q.id=quotation_id and public.can_manage_company(q.company_id))
);

create index if not exists quotation_events_quotation_idx on public.sales_quotation_events(quotation_id, created_at desc);
create index if not exists quotations_status_idx on public.sales_quotations(company_id, status, quotation_date desc);
