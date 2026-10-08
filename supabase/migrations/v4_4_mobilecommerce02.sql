-- CUYRA Catalog V4.4.0 · MOBILECOMMERCE02 + PRODUCTUX01 + RATING01 + WACONFIRM01
-- Migración ADITIVA. No elimina, renombra ni reescribe datos existentes.

alter table public.catalog_tenants add column if not exists banners_json jsonb not null default '[]'::jsonb;
alter table public.catalog_tenants add column if not exists commerce_settings_json jsonb not null default '{"deliveryEnabled":true,"pickupEnabled":true,"pickupLabel":"Retiro en tienda","businessHours":""}'::jsonb;
alter table public.catalog_tenants add column if not exists home_sections_json jsonb not null default '["categories","featured","recommended","offers","newest","brands"]'::jsonb;

alter table public.catalog_products add column if not exists compare_at_price_usd numeric(18,2);
alter table public.catalog_products add column if not exists compare_at_price_bs numeric(18,2);
alter table public.catalog_products add column if not exists promo_badge text not null default '';
alter table public.catalog_products add column if not exists recommended boolean not null default false;
create index if not exists idx_catalog_products_tenant_recommended on public.catalog_products(tenant_id,recommended);

create table if not exists public.catalog_product_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.catalog_tenants(id) on delete cascade,
  source_product_id bigint not null,
  source_group_id bigint,
  rating smallint not null check(rating between 1 and 5),
  display_name text not null default '',
  comment text not null default '',
  approved boolean not null default false,
  fingerprint_hash text not null default '',
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);
create index if not exists idx_catalog_reviews_tenant_product on public.catalog_product_reviews(tenant_id,source_product_id,approved,created_at desc);
create index if not exists idx_catalog_reviews_tenant_group on public.catalog_product_reviews(tenant_id,source_group_id,approved,created_at desc);
create index if not exists idx_catalog_reviews_pending on public.catalog_product_reviews(tenant_id,approved,created_at desc);
create unique index if not exists uq_catalog_reviews_daily_fingerprint on public.catalog_product_reviews(tenant_id,fingerprint_hash) where fingerprint_hash<>'';

create table if not exists public.catalog_whatsapp_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.catalog_tenants(id) on delete cascade,
  request_code text not null unique,
  fulfillment_type text not null default 'delivery' check(fulfillment_type in ('delivery','pickup')),
  items_json jsonb not null default '[]'::jsonb,
  item_count integer not null default 0,
  total_reference_usd numeric(18,2) not null default 0,
  source text not null default 'web-confirmation',
  created_at timestamptz not null default now()
);
create index if not exists idx_catalog_whatsapp_requests_tenant_created on public.catalog_whatsapp_requests(tenant_id,created_at desc);

alter table public.catalog_product_reviews enable row level security;
alter table public.catalog_whatsapp_requests enable row level security;
revoke all on table public.catalog_product_reviews from anon, authenticated;
revoke all on table public.catalog_whatsapp_requests from anon, authenticated;
