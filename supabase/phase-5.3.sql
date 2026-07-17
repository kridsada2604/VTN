-- VTN Business Phase 5.3 / Report Center upload registry
-- Run after phase-5.2.sql

create table if not exists public.report_upload_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_type text not null check(report_type in ('SALE_IN','SALE_OUT','INVENTORY','MOI','RUNRATE','OTHER')),
  source_name text not null,
  period_start date,
  period_end date,
  file_name text not null,
  file_size_bytes bigint,
  storage_bucket text,
  storage_path text,
  status text not null default 'REGISTERED' check(status in ('REGISTERED','UPLOADED','PROCESSING','IMPORTED','FAILED','ARCHIVED')),
  row_count integer not null default 0 check(row_count >= 0),
  imported_count integer not null default 0 check(imported_count >= 0),
  error_count integer not null default 0 check(error_count >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger report_upload_batches_updated_at
before update on public.report_upload_batches
for each row execute function public.set_updated_at();

alter table public.report_upload_batches enable row level security;

drop policy if exists "report uploads read membership" on public.report_upload_batches;
drop policy if exists "report uploads manage" on public.report_upload_batches;

create policy "report uploads read membership" on public.report_upload_batches
for select to authenticated using(public.is_company_member(company_id));

create policy "report uploads manage" on public.report_upload_batches
for all to authenticated using(public.can_manage_company(company_id)) with check(public.can_manage_company(company_id));

create index if not exists report_upload_batches_company_type_idx on public.report_upload_batches(company_id, report_type, created_at desc);
create index if not exists report_upload_batches_status_idx on public.report_upload_batches(company_id, status, created_at desc);

create or replace function public.create_report_upload_batch(
  p_company_id uuid,
  p_report_type text,
  p_source_name text,
  p_period_start date,
  p_period_end date,
  p_file_name text,
  p_file_size_bytes bigint,
  p_storage_bucket text,
  p_storage_path text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch_id uuid;
  v_actor uuid := auth.uid();
  v_report_type text := upper(trim(p_report_type));
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if v_report_type not in ('SALE_IN','SALE_OUT','INVENTORY','MOI','RUNRATE','OTHER') then
    raise exception 'invalid report type';
  end if;

  if trim(coalesce(p_source_name,'')) = '' or trim(coalesce(p_file_name,'')) = '' then
    raise exception 'source name and file name are required';
  end if;

  if p_period_start is not null and p_period_end is not null and p_period_start > p_period_end then
    raise exception 'period start must be before period end';
  end if;

  insert into public.report_upload_batches(
    company_id, report_type, source_name, period_start, period_end, file_name,
    file_size_bytes, storage_bucket, storage_path, status, notes, created_by
  )
  values(
    p_company_id, v_report_type, trim(p_source_name), p_period_start, p_period_end,
    trim(p_file_name), p_file_size_bytes, nullif(trim(coalesce(p_storage_bucket,'')), ''),
    nullif(trim(coalesce(p_storage_path,'')), ''), 'REGISTERED', p_notes, v_actor
  )
  returning id into v_batch_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'report_upload_batch',
    v_batch_id,
    'created',
    jsonb_build_object('report_type',v_report_type,'source_name',trim(p_source_name),'file_name',trim(p_file_name))
  );

  return v_batch_id;
end;
$$;
