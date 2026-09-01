-- Nexus Catalog Cloud V4 · CENTRAL01
-- Migración ADITIVA y compatible con V3.
-- Ejecutar una sola vez en el Supabase central de Nexus ANTES de desplegar el código V4.

begin;

alter table public.catalog_tenants add column if not exists catalog_protocol text not null default 'v3';
alter table public.catalog_tenants add column if not exists variant_mode text not null default 'legacy';
alter table public.catalog_tenants add column if not exists sofia_read_token_hash text;
create unique index if not exists idx_catalog_tenants_sofia_read_token_hash on public.catalog_tenants(sofia_read_token_hash) where sofia_read_token_hash is not null;

alter table public.catalog_products add column if not exists source_group_id bigint;
alter table public.catalog_products add column if not exists group_code text not null default '';
alter table public.catalog_products add column if not exists group_name text not null default '';
alter table public.catalog_products add column if not exists variant_count integer not null default 1;
alter table public.catalog_products add column if not exists variant_label text not null default '';
alter table public.catalog_products add column if not exists variant_attributes jsonb not null default '{}'::jsonb;
alter table public.catalog_products add column if not exists variant_name text not null default '';
alter table public.catalog_products add column if not exists public_visible boolean not null default true;
alter table public.catalog_products add column if not exists sofia_visible boolean not null default false;
alter table public.catalog_products add column if not exists sofia_approved boolean not null default false;
alter table public.catalog_products add column if not exists sofia_aliases text not null default '';
alter table public.catalog_products add column if not exists sofia_tags text not null default '';
alter table public.catalog_products add column if not exists sofia_notes text not null default '';
alter table public.catalog_products add column if not exists sofia_price_divisas numeric(18,2);
alter table public.catalog_products add column if not exists sofia_rules_json jsonb not null default '{}'::jsonb;
alter table public.catalog_products add column if not exists catalog_protocol text not null default 'v3';

-- Backfill seguro para filas creadas antes de V4.
update public.catalog_products
set public_visible = published
where public_visible is distinct from published
  and catalog_protocol = 'v3';

update public.catalog_products
set variant_name = name
where coalesce(variant_name,'') = '';

create index if not exists idx_catalog_products_tenant_group
  on public.catalog_products(tenant_id,source_group_id);
create index if not exists idx_catalog_products_tenant_public
  on public.catalog_products(tenant_id,public_visible,published,active);
create index if not exists idx_catalog_products_tenant_sofia
  on public.catalog_products(tenant_id,sofia_visible,sofia_approved,active);
create index if not exists idx_catalog_products_tenant_variant_label
  on public.catalog_products(tenant_id,variant_label);
create index if not exists idx_catalog_products_tenant_group_code
  on public.catalog_products(tenant_id,group_code);
create index if not exists idx_catalog_products_tenant_sofia_aliases
  on public.catalog_products using gin (to_tsvector('simple', coalesce(sofia_aliases,'') || ' ' || coalesce(sofia_tags,'')));

commit;
