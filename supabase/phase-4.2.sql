-- VTN Business Phase 4.2 / Product barcode service workflow
-- Run after phase-4.1.sql

create or replace function public.upsert_product_master(
  p_company_id uuid,
  p_product_id uuid,
  p_sku text,
  p_name text,
  p_barcode text,
  p_category_id uuid,
  p_unit_id uuid,
  p_cost_price numeric,
  p_selling_price numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid;
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if nullif(trim(p_sku),'') is null or nullif(trim(p_name),'') is null then
    raise exception 'product sku and name are required';
  end if;

  if p_category_id is not null and not exists(select 1 from public.product_categories c where c.id=p_category_id and c.company_id=p_company_id) then
    raise exception 'product category does not belong to company';
  end if;

  if p_unit_id is not null and not exists(select 1 from public.units u where u.id=p_unit_id and u.company_id=p_company_id) then
    raise exception 'product unit does not belong to company';
  end if;

  if p_product_id is null then
    insert into public.products(company_id,sku,name,barcode,category_id,unit_id,cost_price,selling_price)
    values(
      p_company_id,
      trim(p_sku),
      trim(p_name),
      nullif(trim(p_barcode),''),
      p_category_id,
      p_unit_id,
      greatest(coalesce(p_cost_price,0),0),
      greatest(coalesce(p_selling_price,0),0)
    )
    returning id into v_product_id;

    insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
    values(p_company_id,v_actor,'product',v_product_id,'created',jsonb_build_object('sku',p_sku,'barcode',p_barcode));
  else
    update public.products
    set sku=trim(p_sku),
        name=trim(p_name),
        barcode=nullif(trim(p_barcode),''),
        category_id=p_category_id,
        unit_id=p_unit_id,
        cost_price=greatest(coalesce(p_cost_price,0),0),
        selling_price=greatest(coalesce(p_selling_price,0),0)
    where id=p_product_id and company_id=p_company_id
    returning id into v_product_id;

    if v_product_id is null then
      raise exception 'product not found';
    end if;

    insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
    values(p_company_id,v_actor,'product',v_product_id,'updated',jsonb_build_object('sku',p_sku,'barcode',p_barcode));
  end if;

  return v_product_id;
end;
$$;

create or replace function public.set_product_active(
  p_company_id uuid,
  p_product_id uuid,
  p_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  update public.products
  set is_active=coalesce(p_is_active,false)
  where id=p_product_id and company_id=p_company_id;

  if not found then
    raise exception 'product not found';
  end if;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'product',p_product_id,'active_changed',jsonb_build_object('is_active',p_is_active));

  return p_product_id;
end;
$$;
