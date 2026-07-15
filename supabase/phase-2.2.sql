-- VTN Business Phase 2.2 / Sprint 13 claims foundation
-- Run after phase-2.1.sql

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  claim_no text not null,
  claim_date date not null default current_date,
  claim_type text not null default 'PRODUCT' check(claim_type in ('PRODUCT','SERVICE','WARRANTY','RETURN','REFUND')),
  priority text not null default 'NORMAL' check(priority in ('LOW','NORMAL','HIGH','URGENT')),
  status text not null default 'OPEN' check(status in ('OPEN','IN_REVIEW','APPROVED','REJECTED','RESOLVED','CLOSED')),
  subject text not null,
  description text,
  resolution text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, claim_no)
);

create table if not exists public.claim_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace trigger claims_updated_at
before update on public.claims
for each row execute function public.set_updated_at();

alter table public.claims enable row level security;
alter table public.claim_events enable row level security;

drop policy if exists "claims read membership" on public.claims;
drop policy if exists "claim events read membership" on public.claim_events;
drop policy if exists "claims insert manage" on public.claims;
drop policy if exists "claim events insert manage" on public.claim_events;

create policy "claims read membership" on public.claims
for select to authenticated using(public.is_company_member(company_id));

create policy "claim events read membership" on public.claim_events
for select to authenticated using(
  exists(select 1 from public.claims c where c.id=claim_id and public.is_company_member(c.company_id))
);

create policy "claims insert manage" on public.claims
for insert to authenticated with check(public.can_manage_company(company_id));

create policy "claim events insert manage" on public.claim_events
for insert to authenticated with check(
  exists(select 1 from public.claims c where c.id=claim_id and public.can_manage_company(c.company_id))
);

create index if not exists claims_company_status_idx on public.claims(company_id, status, claim_date desc);
create index if not exists claims_customer_idx on public.claims(customer_id);
create index if not exists claims_product_idx on public.claims(product_id);
create index if not exists claim_events_claim_idx on public.claim_events(claim_id, created_at desc);

create or replace function public.create_claim(
  p_company_id uuid,
  p_customer_id uuid,
  p_product_id uuid,
  p_claim_date date,
  p_claim_type text,
  p_priority text,
  p_subject text,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim_id uuid;
  v_claim_no text;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if nullif(trim(p_subject),'') is null then
    raise exception 'claim subject is required';
  end if;

  if p_customer_id is not null and not exists(select 1 from public.customers c where c.id=p_customer_id and c.company_id=p_company_id) then
    raise exception 'customer does not belong to company';
  end if;

  if p_product_id is not null and not exists(select 1 from public.products p where p.id=p_product_id and p.company_id=p_company_id) then
    raise exception 'product does not belong to company';
  end if;

  v_claim_no := public.next_document_number(p_company_id, 'CLAIM', 'CLM');

  insert into public.claims(company_id,customer_id,product_id,claim_no,claim_date,claim_type,priority,status,subject,description,created_by)
  values(p_company_id,p_customer_id,p_product_id,v_claim_no,p_claim_date,coalesce(nullif(p_claim_type,''),'PRODUCT'),coalesce(nullif(p_priority,''),'NORMAL'),'OPEN',p_subject,p_description,v_actor)
  returning id into v_claim_id;

  insert into public.claim_events(claim_id,event_type,from_status,to_status,message,created_by)
  values(v_claim_id,'CREATED',null,'OPEN','สร้างเคลม',v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'claim',v_claim_id,'created',jsonb_build_object('claim_no',v_claim_no,'subject',p_subject));

  return v_claim_id;
end;
$$;
