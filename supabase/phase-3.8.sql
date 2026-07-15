-- VTN Business Phase 3.8 / Claim resolution actions
-- Run after phase-3.7.sql

create table if not exists public.claim_resolutions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  action_type text not null check(action_type in ('REPLACEMENT','REFUND','CREDIT_NOTE')),
  warehouse_id uuid references public.warehouses(id),
  product_id uuid references public.products(id),
  quantity numeric(18,4) not null default 0,
  amount numeric(18,2) not null default 0,
  notes text,
  stock_movement_id uuid references public.stock_movements(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.claim_resolutions enable row level security;

drop policy if exists "claim resolutions read membership" on public.claim_resolutions;
drop policy if exists "claim resolutions insert manage" on public.claim_resolutions;

create policy "claim resolutions read membership" on public.claim_resolutions
for select to authenticated using(public.is_company_member(company_id));

create policy "claim resolutions insert manage" on public.claim_resolutions
for insert to authenticated with check(public.can_manage_company(company_id));

create index if not exists claim_resolutions_claim_idx on public.claim_resolutions(claim_id, created_at desc);

create or replace function public.create_claim_resolution(
  p_company_id uuid,
  p_claim_id uuid,
  p_action_type text,
  p_warehouse_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_amount numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.claims%rowtype;
  v_resolution_id uuid;
  v_stock_movement_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select * into v_claim
  from public.claims
  where id=p_claim_id and company_id=p_company_id
  for update;

  if not found then
    raise exception 'claim not found';
  end if;

  if p_action_type not in ('REPLACEMENT','REFUND','CREDIT_NOTE') then
    raise exception 'invalid claim resolution action';
  end if;

  if p_action_type = 'REPLACEMENT' then
    if p_warehouse_id is null or p_product_id is null or coalesce(p_quantity,0) <= 0 then
      raise exception 'replacement requires warehouse, product, and quantity';
    end if;

    if not exists(select 1 from public.warehouses where id=p_warehouse_id and company_id=p_company_id and is_active=true) then
      raise exception 'warehouse does not belong to company';
    end if;

    if not exists(select 1 from public.products where id=p_product_id and company_id=p_company_id and is_active=true) then
      raise exception 'product does not belong to company';
    end if;

    v_stock_movement_id := public.post_stock_movement(
      p_company_id,
      p_warehouse_id,
      current_date,
      'ISSUE',
      'Claim replacement ' || v_claim.claim_no,
      jsonb_build_array(jsonb_build_object(
        'product_id', p_product_id,
        'quantity', p_quantity,
        'unit_cost', 0,
        'sort_order', 1
      ))
    );
  end if;

  if p_action_type in ('REFUND','CREDIT_NOTE') and coalesce(p_amount,0) <= 0 then
    raise exception 'refund or credit note amount must be greater than zero';
  end if;

  insert into public.claim_resolutions(company_id,claim_id,action_type,warehouse_id,product_id,quantity,amount,notes,stock_movement_id,created_by)
  values(p_company_id,p_claim_id,p_action_type,p_warehouse_id,p_product_id,greatest(coalesce(p_quantity,0),0),greatest(coalesce(p_amount,0),0),p_notes,v_stock_movement_id,v_actor)
  returning id into v_resolution_id;

  update public.claims
  set status='RESOLVED',
      resolution=coalesce(nullif(p_notes,''), p_action_type)
  where id=v_claim.id;

  insert into public.claim_events(claim_id,event_type,from_status,to_status,message,created_by)
  values(v_claim.id,'RESOLUTION_CREATED',v_claim.status,'RESOLVED','Claim resolution: ' || p_action_type,v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'claim_resolution',v_resolution_id,'created',jsonb_build_object('claim_id',v_claim.id,'action_type',p_action_type,'amount',p_amount,'stock_movement_id',v_stock_movement_id));

  return v_resolution_id;
end;
$$;
