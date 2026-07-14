-- VTN Business Phase 1.2 / Master Data CRUD permissions
-- Run after phase-1.sql and phase-1.1.sql

create or replace function public.can_manage_company(target_company uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.company_memberships m
    join public.roles r on r.id = m.role_id
    where m.company_id = target_company
      and m.user_id = auth.uid()
      and r.code in ('OWNER','ADMIN')
  );
$$;

-- Idempotent policies for CRUD
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','suppliers','products','product_categories','units','warehouses'] LOOP
    EXECUTE format('drop policy if exists %I on public.%I', t || ' insert manage', t);
    EXECUTE format('drop policy if exists %I on public.%I', t || ' update manage', t);
    EXECUTE format('create policy %I on public.%I for insert to authenticated with check (public.can_manage_company(company_id))', t || ' insert manage', t);
    EXECUTE format('create policy %I on public.%I for update to authenticated using (public.can_manage_company(company_id)) with check (public.can_manage_company(company_id))', t || ' update manage', t);
  END LOOP;
END $$;

create index if not exists customers_company_name_idx on public.customers(company_id,name);
create index if not exists suppliers_company_name_idx on public.suppliers(company_id,name);
create index if not exists products_company_name_idx on public.products(company_id,name);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_unit_idx on public.products(unit_id);
create index if not exists warehouses_branch_idx on public.warehouses(branch_id);
