-- CUYRA Catalog Cloud v4.6.0 · Commerce Theme
-- Campos comerciales administrados desde Cloud. La sincronización CUYRA existente no necesita enviarlos.
alter table public.catalog_products add column if not exists wholesale_price_usd numeric(18,2) check (wholesale_price_usd is null or wholesale_price_usd >= 0);
alter table public.catalog_products add column if not exists wholesale_price_bs numeric(18,2) check (wholesale_price_bs is null or wholesale_price_bs >= 0);
alter table public.catalog_products add column if not exists wholesale_min_quantity integer check (wholesale_min_quantity is null or wholesale_min_quantity >= 1);

comment on column public.catalog_products.wholesale_price_usd is 'Precio mayorista opcional administrado en Catalog Cloud; no modifica price_usd sincronizado desde CUYRA.';
comment on column public.catalog_products.wholesale_min_quantity is 'Cantidad mínima opcional para mostrar precio mayorista en Commerce Theme.';
