-- Nexus Catalog Cloud v3.0.0 · Supabase/Postgres
-- Puede ejecutarse tanto en una instalación nueva como sobre CATALOG01.
create extension if not exists pgcrypto;

create table if not exists public.catalog_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  public_name text not null,
  phone text not null default '',
  website text not null default '',
  accent_color text not null default '#2563EB',
  sync_token_hash text not null unique,
  active boolean not null default true,
  show_stock_mode text not null default 'status' check(show_stock_mode in ('exact','status','hidden')),
  hide_out_of_stock boolean not null default false,
  rate_bs_per_usd numeric(18,6) not null default 0,
  rate_source text not null default 'BCV',
  logo_url text,
  hero_title text not null default '',
  hero_subtitle text not null default '',
  announcement text not null default '',
  catalog_theme text not null default 'retail' check(catalog_theme in ('retail','minimal','bold')),
  show_brand_filter boolean not null default true,
  show_category_nav boolean not null default true,
  instagram_url text not null default '',
  location_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_tenants add column if not exists logo_url text;
alter table public.catalog_tenants add column if not exists hero_title text not null default '';
alter table public.catalog_tenants add column if not exists hero_subtitle text not null default '';
alter table public.catalog_tenants add column if not exists announcement text not null default '';
alter table public.catalog_tenants add column if not exists catalog_theme text not null default 'retail';
alter table public.catalog_tenants add column if not exists show_brand_filter boolean not null default true;
alter table public.catalog_tenants add column if not exists show_category_nav boolean not null default true;
alter table public.catalog_tenants add column if not exists instagram_url text not null default '';
alter table public.catalog_tenants add column if not exists location_text text not null default '';

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.catalog_tenants(id) on delete cascade,
  source_product_id bigint not null,
  sku text not null,
  name text not null,
  description text not null default '',
  category text not null default '',
  subcategory text not null default '',
  brand text not null default '',
  model text not null default '',
  features text not null default '',
  featured boolean not null default false,
  price_usd numeric(18,2) not null check(price_usd>=0),
  price_bs numeric(18,2) not null check(price_bs>=0),
  stock_exact bigint not null default 0 check(stock_exact>=0),
  availability text not null default 'available' check(availability in ('available','out')),
  image_url text,
  published boolean not null default true,
  active boolean not null default true,
  source_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(tenant_id,source_product_id)
);

alter table public.catalog_products add column if not exists brand text not null default '';
alter table public.catalog_products add column if not exists model text not null default '';
alter table public.catalog_products add column if not exists features text not null default '';
alter table public.catalog_products add column if not exists featured boolean not null default false;

create index if not exists idx_catalog_products_tenant_name on public.catalog_products(tenant_id,name);
create index if not exists idx_catalog_products_tenant_sku on public.catalog_products(tenant_id,sku);
create index if not exists idx_catalog_products_tenant_category on public.catalog_products(tenant_id,category);
create index if not exists idx_catalog_products_tenant_brand on public.catalog_products(tenant_id,brand);
create index if not exists idx_catalog_products_tenant_featured on public.catalog_products(tenant_id,featured);

create table if not exists public.catalog_sync_receipts (
  id bigserial primary key,
  tenant_id uuid not null references public.catalog_tenants(id) on delete cascade,
  idempotency_key text not null,
  entity_type text not null,
  source_entity_id bigint,
  received_at timestamptz not null default now(),
  unique(tenant_id,idempotency_key)
);

alter table public.catalog_tenants enable row level security;
alter table public.catalog_products enable row level security;
alter table public.catalog_sync_receipts enable row level security;

revoke all on table public.catalog_tenants from anon, authenticated;
revoke all on table public.catalog_products from anon, authenticated;
revoke all on table public.catalog_sync_receipts from anon, authenticated;
revoke usage, select on sequence public.catalog_sync_receipts_id_seq from anon, authenticated;
