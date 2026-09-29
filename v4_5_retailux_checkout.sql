-- CUYRA Catalog V4.5.0 · RETAILUX02 + CHECKOUT02
-- Migración estrictamente ADITIVA. No elimina/renombra tablas o columnas y conserva datos existentes.

alter table public.catalog_whatsapp_requests
  add column if not exists customer_json jsonb not null default '{}'::jsonb;

alter table public.catalog_whatsapp_requests
  add column if not exists fulfillment_json jsonb not null default '{}'::jsonb;

alter table public.catalog_whatsapp_requests
  add column if not exists payment_method text not null default '';

alter table public.catalog_whatsapp_requests
  add column if not exists notes text not null default '';

create index if not exists idx_catalog_whatsapp_requests_payment
  on public.catalog_whatsapp_requests(tenant_id,payment_method,created_at desc);
