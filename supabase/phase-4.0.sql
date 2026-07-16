-- VTN Business Phase 4.0 / Marketplace SKU mapping workflow
-- Run after phase-3.9.sql

create or replace function public.map_marketplace_sku(
  p_company_id uuid,
  p_channel_id uuid,
  p_marketplace_sku text,
  p_product_id uuid,
  p_marketplace_product_name text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_marketplace_sku text := trim(p_marketplace_sku);
  v_updated_count integer := 0;
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if v_marketplace_sku = '' then
    raise exception 'marketplace sku is required';
  end if;

  if not exists(select 1 from public.marketplace_channels c where c.id=p_channel_id and c.company_id=p_company_id) then
    raise exception 'marketplace channel does not belong to company';
  end if;

  if not exists(select 1 from public.products p where p.id=p_product_id and p.company_id=p_company_id and p.is_active=true) then
    raise exception 'product does not belong to company';
  end if;

  insert into public.marketplace_product_mappings(
    company_id, channel_id, product_id, marketplace_sku, marketplace_product_name, status, created_by
  )
  values(
    p_company_id, p_channel_id, p_product_id, v_marketplace_sku, nullif(trim(p_marketplace_product_name), ''), 'ACTIVE', v_actor
  )
  on conflict(channel_id, marketplace_sku)
  do update set
    product_id=excluded.product_id,
    marketplace_product_name=excluded.marketplace_product_name,
    status='ACTIVE',
    updated_at=now();

  update public.marketplace_order_items i
  set product_id=p_product_id,
      mapping_status='MAPPED'
  from public.marketplace_orders o
  where o.id=i.order_id
    and o.company_id=p_company_id
    and o.channel_id=p_channel_id
    and i.marketplace_sku=v_marketplace_sku
    and i.mapping_status='UNMAPPED';

  get diagnostics v_updated_count = row_count;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(
    p_company_id,
    v_actor,
    'marketplace_sku',
    p_product_id,
    'mapped',
    jsonb_build_object(
      'channel_id', p_channel_id,
      'marketplace_sku', v_marketplace_sku,
      'updated_order_items', v_updated_count
    )
  );

  return v_updated_count;
end;
$$;
