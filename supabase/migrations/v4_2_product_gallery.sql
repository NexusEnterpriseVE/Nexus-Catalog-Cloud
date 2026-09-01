-- CUYRA Catalog V4.2.0 GALLERY01 · no destructivo
alter table public.catalog_products add column if not exists gallery_urls jsonb not null default '[]'::jsonb;
update public.catalog_products set gallery_urls=jsonb_build_array(image_url) where image_url is not null and jsonb_array_length(gallery_urls)=0;
