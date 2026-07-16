-- VTN Business Phase 5.1 / Invoice email provider logs
-- Run after phase-5.0.sql

create table if not exists public.document_email_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_type text not null check(document_type in ('SALES_INVOICE')),
  document_id uuid not null,
  recipient_email text not null,
  subject text not null,
  provider text not null default 'RESEND',
  status text not null default 'PENDING' check(status in ('PENDING','SENT','FAILED','SKIPPED')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.document_email_logs enable row level security;

drop policy if exists "document email logs read membership" on public.document_email_logs;
drop policy if exists "document email logs manage" on public.document_email_logs;

create policy "document email logs read membership" on public.document_email_logs
for select to authenticated using(public.is_company_member(company_id));

create policy "document email logs manage" on public.document_email_logs
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create index if not exists document_email_logs_company_idx on public.document_email_logs(company_id, created_at desc);
create index if not exists document_email_logs_document_idx on public.document_email_logs(document_type, document_id, created_at desc);
