-- VTN Business Phase 1.1 / Master Data
-- Run after supabase/phase-1.sql

create table if not exists public.units (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, code text not null, name text not null, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,code));
create table if not exists public.product_categories (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, code text not null, name text not null, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,code));
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, sku text not null, name text not null, category_id uuid references public.product_categories(id), unit_id uuid references public.units(id), cost_price numeric(18,2) not null default 0, selling_price numeric(18,2) not null default 0, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,sku));
create table if not exists public.customers (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, code text not null, name text not null, tax_id text, phone text, email text, address text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,code));
create table if not exists public.suppliers (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, code text not null, name text not null, tax_id text, phone text, email text, address text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,code));

create or replace trigger units_updated_at before update on public.units for each row execute function public.set_updated_at();
create or replace trigger product_categories_updated_at before update on public.product_categories for each row execute function public.set_updated_at();
create or replace trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create or replace trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create or replace trigger suppliers_updated_at before update on public.suppliers for each row execute function public.set_updated_at();

alter table public.units enable row level security; alter table public.product_categories enable row level security; alter table public.products enable row level security; alter table public.customers enable row level security; alter table public.suppliers enable row level security;
create policy "units read membership" on public.units for select to authenticated using(public.is_company_member(company_id));
create policy "categories read membership" on public.product_categories for select to authenticated using(public.is_company_member(company_id));
create policy "products read membership" on public.products for select to authenticated using(public.is_company_member(company_id));
create policy "customers read membership" on public.customers for select to authenticated using(public.is_company_member(company_id));
create policy "suppliers read membership" on public.suppliers for select to authenticated using(public.is_company_member(company_id));

insert into public.units(company_id,code,name) select id,'PCS','ชิ้น' from public.companies where code='VTN' on conflict(company_id,code) do nothing;
insert into public.units(company_id,code,name) select id,'BOX','กล่อง' from public.companies where code='VTN' on conflict(company_id,code) do nothing;
insert into public.product_categories(company_id,code,name) select id,'GENERAL','สินค้าทั่วไป' from public.companies where code='VTN' on conflict(company_id,code) do nothing;
insert into public.customers(company_id,code,name) select id,'CUS-0001','ลูกค้าทั่วไป' from public.companies where code='VTN' on conflict(company_id,code) do nothing;
insert into public.suppliers(company_id,code,name) select id,'SUP-0001','ผู้ขายทั่วไป' from public.companies where code='VTN' on conflict(company_id,code) do nothing;
insert into public.products(company_id,sku,name,category_id,unit_id,cost_price,selling_price) select c.id,'DEMO-001','สินค้าตัวอย่าง',pc.id,u.id,100,150 from public.companies c join public.product_categories pc on pc.company_id=c.id and pc.code='GENERAL' join public.units u on u.company_id=c.id and u.code='PCS' where c.code='VTN' on conflict(company_id,sku) do nothing;
