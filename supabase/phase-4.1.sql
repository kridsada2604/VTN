-- VTN Business Phase 4.1 / Marketplace fee reconciliation
-- Run after phase-4.0.sql

create table if not exists public.marketplace_fee_reconciliations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  channel_id uuid not null references public.marketplace_channels(id) on delete cascade,
  fee_type text not null check(fee_type in ('COMMISSION','PAYMENT','SHIPPING','VOUCHER','SERVICE','OTHER')),
  amount numeric(18,2) not null default 0 check(amount >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.marketplace_fee_reconciliations enable row level security;

drop policy if exists "marketplace fees read membership" on public.marketplace_fee_reconciliations;
drop policy if exists "marketplace fees insert manage" on public.marketplace_fee_reconciliations;

create policy "marketplace fees read membership" on public.marketplace_fee_reconciliations
for select to authenticated using(public.is_company_member(company_id));

create policy "marketplace fees insert manage" on public.marketplace_fee_reconciliations
for insert to authenticated with check(public.can_manage_company(company_id));

create index if not exists marketplace_fee_order_idx on public.marketplace_fee_reconciliations(order_id, created_at desc);
create index if not exists marketplace_fee_company_idx on public.marketplace_fee_reconciliations(company_id, channel_id, created_at desc);

create or replace function public.create_marketplace_fee_reconciliation(
  p_company_id uuid,
  p_order_id uuid,
  p_fee_type text,
  p_amount numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fee_id uuid;
  v_channel_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  select o.channel_id into v_channel_id
  from public.marketplace_orders o
  where o.id=p_order_id and o.company_id=p_company_id;

  if v_channel_id is null then
    raise exception 'marketplace order does not belong to company';
  end if;

  if p_fee_type not in ('COMMISSION','PAYMENT','SHIPPING','VOUCHER','SERVICE','OTHER') then
    raise exception 'invalid marketplace fee type';
  end if;

  if coalesce(p_amount, 0) <= 0 then
    raise exception 'marketplace fee amount must be greater than zero';
  end if;

  insert into public.marketplace_fee_reconciliations(company_id,order_id,channel_id,fee_type,amount,notes,created_by)
  values(p_company_id,p_order_id,v_channel_id,p_fee_type,round(p_amount,2),nullif(trim(p_notes),''),v_actor)
  returning id into v_fee_id;

  insert into public.marketplace_order_events(order_id,event_type,message,created_by)
  values(p_order_id,'fee_reconciled',concat('Marketplace fee recorded: ', p_fee_type, ' ', round(p_amount,2)),v_actor);

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'marketplace_fee',v_fee_id,'created',jsonb_build_object('order_id',p_order_id,'fee_type',p_fee_type,'amount',p_amount));

  return v_fee_id;
end;
$$;
