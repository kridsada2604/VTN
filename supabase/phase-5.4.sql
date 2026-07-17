-- VTN Business Phase 5.4 / Report Center storage upload
-- Run after phase-5.3.sql

insert into storage.buckets(id, name, public)
values('report-imports', 'report-imports', false)
on conflict(id) do nothing;

drop policy if exists "report imports read membership" on storage.objects;
drop policy if exists "report imports insert manage" on storage.objects;
drop policy if exists "report imports update manage" on storage.objects;
drop policy if exists "report imports delete manage" on storage.objects;

create policy "report imports read membership" on storage.objects
for select to authenticated using(
  bucket_id='report-imports'
  and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.is_company_member(split_part(name,'/',1)::uuid)
);

create policy "report imports insert manage" on storage.objects
for insert to authenticated with check(
  bucket_id='report-imports'
  and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.can_manage_company(split_part(name,'/',1)::uuid)
);

create policy "report imports update manage" on storage.objects
for update to authenticated using(
  bucket_id='report-imports'
  and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.can_manage_company(split_part(name,'/',1)::uuid)
) with check(
  bucket_id='report-imports'
  and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.can_manage_company(split_part(name,'/',1)::uuid)
);

create policy "report imports delete manage" on storage.objects
for delete to authenticated using(
  bucket_id='report-imports'
  and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.can_manage_company(split_part(name,'/',1)::uuid)
);

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
  v_status text := case when nullif(trim(coalesce(p_storage_path,'')), '') is null then 'REGISTERED' else 'UPLOADED' end;
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
    nullif(trim(coalesce(p_storage_path,'')), ''), v_status, p_notes, v_actor
  )
  returning id into v_batch_id;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'report_upload_batch',
    v_batch_id,
    'created',
    jsonb_build_object('report_type',v_report_type,'source_name',trim(p_source_name),'file_name',trim(p_file_name),'status',v_status)
  );

  return v_batch_id;
end;
$$;
