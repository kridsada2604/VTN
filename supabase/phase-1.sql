-- VTN Business Phase 1 / Supabase
-- Run once in SQL Editor on a new Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_th text not null,
  name_en text,
  tax_id text,
  phone text,
  email text,
  address text,
  timezone text not null default 'Asia/Bangkok',
  currency_code text not null default 'THB',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  branch_number text not null default '00000',
  is_head_office boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  branch_id uuid references public.branches(id),
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create or replace trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create or replace trigger branches_updated_at before update on public.branches for each row execute function public.set_updated_at();
create or replace trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create or replace trigger warehouses_updated_at before update on public.warehouses for each row execute function public.set_updated_at();

insert into public.companies(code,name_th,name_en) values ('VTN','บริษัท วรรณธน อินโนเวชั่น จำกัด','Vanthana Innovation Co., Ltd.') on conflict(code) do nothing;
insert into public.roles(code,name,description) values
 ('OWNER','เจ้าของระบบ','สิทธิ์สูงสุด'),('ADMIN','ผู้ดูแลระบบ','จัดการระบบ'),('VIEWER','ผู้ดูข้อมูล','อ่านข้อมูลพื้นฐาน')
on conflict(code) do nothing;

insert into public.branches(company_id,code,name,branch_number,is_head_office)
select id,'HO','สำนักงานใหญ่','00000',true from public.companies where code='VTN'
on conflict(company_id,code) do nothing;

insert into public.warehouses(company_id,branch_id,code,name)
select c.id,b.id,'MAIN','คลังสินค้าหลัก' from public.companies c join public.branches b on b.company_id=c.id where c.code='VTN' and b.code='HO'
on conflict(company_id,code) do nothing;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_company uuid; v_role uuid; v_branch uuid;
begin
  insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)));
  select id into v_company from public.companies where code='VTN';
  select id into v_branch from public.branches where company_id=v_company and code='HO';
  if not exists(select 1 from public.company_memberships where company_id=v_company) then select id into v_role from public.roles where code='OWNER';
  else select id into v_role from public.roles where code='VIEWER'; end if;
  insert into public.company_memberships(company_id,user_id,role_id,branch_id) values(v_company,new.id,v_role,v_branch);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.companies enable row level security;
alter table public.branches enable row level security;
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.company_memberships enable row level security;
alter table public.warehouses enable row level security;

create or replace function public.is_company_member(target_company uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.company_memberships m where m.company_id=target_company and m.user_id=auth.uid());
$$;

create policy "profiles own or company peers read" on public.profiles for select to authenticated using (
 id=auth.uid() or exists(select 1 from public.company_memberships me join public.company_memberships them on them.company_id=me.company_id where me.user_id=auth.uid() and them.user_id=profiles.id)
);
create policy "profiles update own" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "memberships read own company" on public.company_memberships for select to authenticated using(public.is_company_member(company_id));
create policy "companies read membership" on public.companies for select to authenticated using(public.is_company_member(id));
create policy "branches read membership" on public.branches for select to authenticated using(public.is_company_member(company_id));
create policy "warehouses read membership" on public.warehouses for select to authenticated using(public.is_company_member(company_id));
create policy "roles authenticated read" on public.roles for select to authenticated using(true);
