-- VTN Business Phase 4.5 / FIFO issue consumption
-- Run after phase-4.4.sql

create table if not exists public.stock_layer_consumptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  movement_item_id uuid not null references public.stock_movement_items(id) on delete cascade,
  stock_layer_id uuid not null references public.stock_layers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity numeric(18,4) not null check(quantity > 0),
  unit_cost numeric(18,4) not null default 0,
  line_cost numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.stock_layer_consumptions enable row level security;

drop policy if exists "stock layer consumptions read membership" on public.stock_layer_consumptions;

create policy "stock layer consumptions read membership" on public.stock_layer_consumptions
for select to authenticated using(public.is_company_member(company_id));

create index if not exists stock_layer_consumptions_item_idx on public.stock_layer_consumptions(movement_item_id);
create index if not exists stock_layer_consumptions_layer_idx on public.stock_layer_consumptions(stock_layer_id);

create or replace function public.post_stock_movement(
  p_company_id uuid,
  p_warehouse_id uuid,
  p_movement_date date,
  p_movement_type text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_movement_id uuid;
  v_document_no text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_item_id uuid;
  v_qty numeric(18,4);
  v_unit_cost numeric(18,4);
  v_line_cost numeric(18,2);
  v_current_qty numeric(18,4);
  v_current_cost numeric(18,2);
  v_current_average_cost numeric(18,4);
  v_new_qty numeric(18,4);
  v_new_total_cost numeric(18,2);
  v_new_average_cost numeric(18,4);
  v_sign integer;
  v_actor uuid := auth.uid();
  v_remaining_to_consume numeric(18,4);
  v_layer public.stock_layers%rowtype;
  v_layer_qty numeric(18,4);
  v_fifo_cost numeric(18,2);
begin
  if not public.can_manage_company(p_company_id) then
    raise exception 'permission denied';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'stock movement items are required';
  end if;

  if not exists(select 1 from public.warehouses w where w.id=p_warehouse_id and w.company_id=p_company_id) then
    raise exception 'warehouse does not belong to company';
  end if;

  v_sign := case
    when p_movement_type in ('RECEIVE','ADJUSTMENT_IN','TRANSFER_IN') then 1
    when p_movement_type in ('ISSUE','ADJUSTMENT_OUT','TRANSFER_OUT') then -1
    else null
  end;

  if v_sign is null then
    raise exception 'invalid movement type';
  end if;

  v_document_no := public.next_document_number(p_company_id, 'STOCK_MOVEMENT', 'STK');

  insert into public.stock_movements(company_id, warehouse_id, document_no, movement_date, movement_type, status, notes, created_by)
  values(p_company_id, p_warehouse_id, v_document_no, p_movement_date, p_movement_type, 'POSTED', p_notes, v_actor)
  returning id into v_movement_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_cost := coalesce(nullif(v_item->>'unit_cost','')::numeric, 0);
    v_line_cost := round((v_qty * v_unit_cost)::numeric, 2);

    select * into v_product
    from public.products
    where id=(v_item->>'product_id')::uuid and company_id=p_company_id and is_active=true;

    if not found then
      raise exception 'product does not belong to company';
    end if;

    insert into public.stock_movement_items(
      movement_id, product_id, quantity, unit_cost, line_cost, lot_no, serial_no, barcode, sort_order
    )
    values(
      v_movement_id, v_product.id, v_qty, v_unit_cost, v_line_cost,
      nullif(v_item->>'lot_no',''), nullif(v_item->>'serial_no',''), nullif(v_item->>'barcode',''),
      coalesce((v_item->>'sort_order')::integer, 0)
    )
    returning id into v_item_id;

    insert into public.stock_balances(company_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, average_cost, total_cost)
    values(p_company_id, p_warehouse_id, v_product.id, 0, 0, 0, 0)
    on conflict(company_id, warehouse_id, product_id) do nothing;

    select quantity_on_hand, total_cost
    into v_current_qty, v_current_cost
    from public.stock_balances
    where company_id=p_company_id and warehouse_id=p_warehouse_id and product_id=v_product.id
    for update;

    if v_sign < 0 and v_current_qty < v_qty then
      raise exception 'insufficient stock for product %', v_product.sku;
    end if;

    v_current_average_cost := case when v_current_qty > 0 then round((v_current_cost / v_current_qty)::numeric, 4) else v_unit_cost end;

    if v_sign < 0 and v_product.costing_method = 'FIFO' then
      v_remaining_to_consume := v_qty;
      v_fifo_cost := 0;

      for v_layer in
        select *
        from public.stock_layers
        where company_id=p_company_id
          and warehouse_id=p_warehouse_id
          and product_id=v_product.id
          and quantity_remaining > 0
        order by received_date asc, created_at asc, id asc
        for update
      loop
        exit when v_remaining_to_consume <= 0;
        v_layer_qty := least(v_layer.quantity_remaining, v_remaining_to_consume);

        update public.stock_layers
        set quantity_remaining=quantity_remaining - v_layer_qty
        where id=v_layer.id;

        insert into public.stock_layer_consumptions(company_id,movement_item_id,stock_layer_id,product_id,warehouse_id,quantity,unit_cost,line_cost)
        values(p_company_id,v_item_id,v_layer.id,v_product.id,p_warehouse_id,v_layer_qty,v_layer.unit_cost,round((v_layer_qty * v_layer.unit_cost)::numeric,2));

        v_fifo_cost := v_fifo_cost + round((v_layer_qty * v_layer.unit_cost)::numeric,2);
        v_remaining_to_consume := v_remaining_to_consume - v_layer_qty;
      end loop;

      if v_remaining_to_consume > 0 then
        raise exception 'insufficient FIFO layer quantity for product %', v_product.sku;
      end if;

      v_line_cost := round(v_fifo_cost, 2);
      v_unit_cost := case when v_qty > 0 then round((v_line_cost / v_qty)::numeric, 4) else 0 end;

      update public.stock_movement_items
      set unit_cost=v_unit_cost,
          line_cost=v_line_cost
      where id=v_item_id;
    end if;

    v_new_qty := v_current_qty + (v_qty * v_sign);

    if v_sign > 0 then
      v_new_total_cost := round((v_current_cost + v_line_cost)::numeric, 2);
    else
      v_new_total_cost := round(greatest((v_current_cost - case when v_product.costing_method = 'FIFO' then v_line_cost else (v_qty * v_current_average_cost) end)::numeric, 0), 2);
    end if;

    v_new_average_cost := case when v_new_qty > 0 then round((v_new_total_cost / v_new_qty)::numeric, 4) else 0 end;

    update public.stock_balances
    set quantity_on_hand=v_new_qty,
        average_cost=v_new_average_cost,
        total_cost=v_new_total_cost
    where company_id=p_company_id and warehouse_id=p_warehouse_id and product_id=v_product.id;

    if v_sign > 0 then
      insert into public.stock_layers(
        company_id, warehouse_id, product_id, movement_item_id, received_date,
        quantity_in, quantity_remaining, unit_cost, lot_no, serial_no
      )
      values(
        p_company_id, p_warehouse_id, v_product.id, v_item_id, p_movement_date,
        v_qty, v_qty, v_unit_cost, nullif(v_item->>'lot_no',''), nullif(v_item->>'serial_no','')
      );
    end if;
  end loop;

  insert into public.audit_logs(company_id,actor_id,entity_type,entity_id,action,metadata)
  values(p_company_id,v_actor,'stock_movement',v_movement_id,'posted',jsonb_build_object('document_no',v_document_no,'movement_type',p_movement_type));

  return v_movement_id;
end;
$$;
