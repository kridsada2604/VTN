-- VTN Business Phase 5.5 / Report Center test data and MOI wording support
-- Run after phase-5.4.sql
-- Test data is tagged with VTN_TEST_DATA and can be removed with:
-- select public.cleanup_vtn_test_report_data('VTN');

create or replace function public.cleanup_vtn_test_report_data(p_company_code text default 'VTN')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_deleted integer := 0;
  v_count integer := 0;
begin
  select id into v_company_id
  from public.companies
  where code = p_company_code;

  if v_company_id is null then
    return 0;
  end if;

  if not public.can_manage_company(v_company_id) then
    raise exception 'permission denied';
  end if;

  delete from public.sales_out_report_items
  where report_id in (
    select id from public.sales_out_reports
    where company_id = v_company_id and notes like 'VTN_TEST_DATA:%'
  );
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.sales_out_reports
  where company_id = v_company_id and notes like 'VTN_TEST_DATA:%';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.report_upload_batches
  where company_id = v_company_id and notes like 'VTN_TEST_DATA:%';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.products
  where company_id = v_company_id and sku like 'VTN-TEST-%';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.customers
  where company_id = v_company_id and code like 'VTN_TEST_DEALER_%';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.product_categories
  where company_id = v_company_id and code = 'VTN_TEST_REPORT';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.units
  where company_id = v_company_id and code = 'VTNTEST';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  insert into public.audit_logs(company_id, actor_id, entity_type, entity_id, action, metadata)
  values(v_company_id, auth.uid(), 'test_data', v_company_id, 'cleanup', jsonb_build_object('deleted_rows', v_deleted));

  return v_deleted;
end;
$$;

do $$
declare
  v_company_id uuid;
  v_unit_id uuid;
  v_category_id uuid;
  v_dealer_north_id uuid;
  v_dealer_bangkok_id uuid;
  v_product_router_id uuid;
  v_product_camera_id uuid;
  v_product_sensor_id uuid;
  v_report_june_id uuid;
  v_report_july_id uuid;
begin
  select id into v_company_id from public.companies where code = 'VTN';

  if v_company_id is null then
    raise notice 'Skip VTN test data because company code VTN was not found.';
    return;
  end if;

  delete from public.sales_out_report_items
  where report_id in (select id from public.sales_out_reports where company_id = v_company_id and notes like 'VTN_TEST_DATA:%');
  delete from public.sales_out_reports where company_id = v_company_id and notes like 'VTN_TEST_DATA:%';
  delete from public.report_upload_batches where company_id = v_company_id and notes like 'VTN_TEST_DATA:%';
  delete from public.products where company_id = v_company_id and sku like 'VTN-TEST-%';
  delete from public.customers where company_id = v_company_id and code like 'VTN_TEST_DEALER_%';
  delete from public.product_categories where company_id = v_company_id and code = 'VTN_TEST_REPORT';
  delete from public.units where company_id = v_company_id and code = 'VTNTEST';

  insert into public.units(company_id, code, name, is_active)
  values(v_company_id, 'VTNTEST', 'VTN Test Unit', true)
  on conflict(company_id, code) do update set name = excluded.name, is_active = true
  returning id into v_unit_id;

  insert into public.product_categories(company_id, code, name, is_active)
  values(v_company_id, 'VTN_TEST_REPORT', 'VTN Test Report Products', true)
  on conflict(company_id, code) do update set name = excluded.name, is_active = true
  returning id into v_category_id;

  insert into public.customers(company_id, code, name, phone, email, address, is_active)
  values(v_company_id, 'VTN_TEST_DEALER_NORTH', 'VTN Test Dealer North', '020000101', 'north.test@example.com', 'VTN test data - north dealer', true)
  on conflict(company_id, code) do update set name = excluded.name, phone = excluded.phone, email = excluded.email, address = excluded.address, is_active = true
  returning id into v_dealer_north_id;

  insert into public.customers(company_id, code, name, phone, email, address, is_active)
  values(v_company_id, 'VTN_TEST_DEALER_BANGKOK', 'VTN Test Dealer Bangkok', '020000102', 'bangkok.test@example.com', 'VTN test data - bangkok dealer', true)
  on conflict(company_id, code) do update set name = excluded.name, phone = excluded.phone, email = excluded.email, address = excluded.address, is_active = true
  returning id into v_dealer_bangkok_id;

  insert into public.products(company_id, sku, name, category_id, unit_id, cost_price, selling_price, is_active)
  values(v_company_id, 'VTN-TEST-ROUTER-01', 'VTN Test Router 01', v_category_id, v_unit_id, 1200, 1900, true)
  on conflict(company_id, sku) do update set name = excluded.name, category_id = excluded.category_id, unit_id = excluded.unit_id, cost_price = excluded.cost_price, selling_price = excluded.selling_price, is_active = true
  returning id into v_product_router_id;

  insert into public.products(company_id, sku, name, category_id, unit_id, cost_price, selling_price, is_active)
  values(v_company_id, 'VTN-TEST-CAMERA-01', 'VTN Test Camera 01', v_category_id, v_unit_id, 1850, 2900, true)
  on conflict(company_id, sku) do update set name = excluded.name, category_id = excluded.category_id, unit_id = excluded.unit_id, cost_price = excluded.cost_price, selling_price = excluded.selling_price, is_active = true
  returning id into v_product_camera_id;

  insert into public.products(company_id, sku, name, category_id, unit_id, cost_price, selling_price, is_active)
  values(v_company_id, 'VTN-TEST-SENSOR-01', 'VTN Test Sensor 01', v_category_id, v_unit_id, 420, 690, true)
  on conflict(company_id, sku) do update set name = excluded.name, category_id = excluded.category_id, unit_id = excluded.unit_id, cost_price = excluded.cost_price, selling_price = excluded.selling_price, is_active = true
  returning id into v_product_sensor_id;

  insert into public.sales_out_reports(
    company_id, dealer_id, document_no, report_date, period_start, period_end,
    source_channel, status, currency_code, notes, gross_amount, discount_amount, net_amount
  ) values(
    v_company_id, v_dealer_north_id, 'VTN-TEST-SO-2026-06-NORTH', date '2026-06-30', date '2026-06-01', date '2026-06-30',
    'DEALER', 'SUBMITTED', 'THB', 'VTN_TEST_DATA: June Sale Out sample for growth baseline', 260600, 5600, 255000
  ) returning id into v_report_june_id;

  insert into public.sales_out_report_items(report_id, product_id, dealer_sku, description, quantity, unit_price, line_discount, line_total, sort_order)
  values
    (v_report_june_id, v_product_router_id, 'NORTH-R01', 'VTN Test Router 01', 80, 1900, 3000, 149000, 1),
    (v_report_june_id, v_product_camera_id, 'NORTH-C01', 'VTN Test Camera 01', 38, 2900, 2600, 107600, 2),
    (v_report_june_id, v_product_sensor_id, 'NORTH-S01', 'VTN Test Sensor 01', 13, 690, 0, 8970, 3);

  insert into public.sales_out_reports(
    company_id, dealer_id, document_no, report_date, period_start, period_end,
    source_channel, status, currency_code, notes, gross_amount, discount_amount, net_amount
  ) values(
    v_company_id, v_dealer_bangkok_id, 'VTN-TEST-SO-2026-07-BKK', date '2026-07-17', date '2026-07-01', date '2026-07-31',
    'DEALER', 'SUBMITTED', 'THB', 'VTN_TEST_DATA: July Sale Out sample for current month growth', 373000, 9000, 364000
  ) returning id into v_report_july_id;

  insert into public.sales_out_report_items(report_id, product_id, dealer_sku, description, quantity, unit_price, line_discount, line_total, sort_order)
  values
    (v_report_july_id, v_product_router_id, 'BKK-R01', 'VTN Test Router 01', 110, 1900, 4000, 205000, 1),
    (v_report_july_id, v_product_camera_id, 'BKK-C01', 'VTN Test Camera 01', 45, 2900, 5000, 125500, 2),
    (v_report_july_id, v_product_sensor_id, 'BKK-S01', 'VTN Test Sensor 01', 50, 690, 0, 34500, 3);

  insert into public.report_upload_batches(
    company_id, report_type, source_name, period_start, period_end, file_name,
    file_size_bytes, storage_bucket, storage_path, status, row_count, imported_count, error_count, notes
  ) values
    (v_company_id, 'SALE_OUT', 'VTN_TEST_DEALER_BANGKOK', date '2026-07-01', date '2026-07-31', 'sale-out-sample.csv', 512, 'report-imports', 'VTN_TEST/sample/sale-out-sample.csv', 'IMPORTED', 3, 3, 0, 'VTN_TEST_DATA: Imported Sale Out sample batch'),
    (v_company_id, 'INVENTORY', 'VTN Test Dealer Bangkok', date '2026-07-01', date '2026-07-31', 'inventory-sample.csv', 384, null, null, 'REGISTERED', 3, 0, 0, 'VTN_TEST_DATA: Inventory sample batch awaiting parser'),
    (v_company_id, 'MOI', 'VTN Test Dealer Bangkok', date '2026-07-01', date '2026-07-31', 'month-of-inventory-sample.csv', 448, null, null, 'REGISTERED', 3, 0, 0, 'VTN_TEST_DATA: Month of Inventory sample batch awaiting parser'),
    (v_company_id, 'RUNRATE', 'VTN Test Dealer Bangkok', date '2026-07-01', date '2026-07-31', 'runrate-sample.csv', 420, null, null, 'REGISTERED', 3, 0, 0, 'VTN_TEST_DATA: Runrate sample batch awaiting parser');

  insert into public.audit_logs(company_id, actor_id, entity_type, entity_id, action, metadata)
  values(v_company_id, null, 'test_data', v_company_id, 'seeded', jsonb_build_object('tag', 'VTN_TEST_DATA', 'version', 'phase-5.5'));
end;
$$;