-- CUYRA Catalog Cloud V4.1.0 · CATALOGANALYTICS01
-- Migración ADITIVA. No modifica productos, variantes, tenants ni tokens existentes.
create table if not exists public.catalog_events (
  id bigserial primary key,
  tenant_id uuid not null references public.catalog_tenants(id) on delete cascade,
  event_type text not null check(event_type in ('catalog_view','product_view','search','whatsapp_consult','whatsapp_order','share','favorite','category_view','add_to_list')),
  source_product_id bigint,
  source_variant_id bigint,
  query_text text not null default '',
  category text not null default '',
  source text not null default '',
  page_path text not null default '',
  referrer text not null default '',
  numeric_value numeric(18,2),
  created_at timestamptz not null default now()
);
create index if not exists idx_catalog_events_tenant_created on public.catalog_events(tenant_id,created_at desc);
create index if not exists idx_catalog_events_tenant_type on public.catalog_events(tenant_id,event_type,created_at desc);
alter table public.catalog_events enable row level security;
revoke all on table public.catalog_events from anon, authenticated;
revoke usage, select on sequence public.catalog_events_id_seq from anon, authenticated;
