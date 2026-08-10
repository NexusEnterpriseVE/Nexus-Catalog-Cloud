# Nexus Catalog Cloud v3.0.0

Catálogo público multiempresa para Nexus Enterprise Pro.

## V3 Storefront
- catálogo tipo tienda;
- filtros por marca, categoría, subcategoría y disponibilidad;
- orden por destacados, nombre, precio y actualización;
- página individual de producto;
- SKU, marca, modelo, categoría, subcategoría, descripción y características públicas;
- precio USD y Bs;
- disponibilidad según política del tenant;
- productos relacionados;
- consulta por WhatsApp;
- branding por empresa: logo, color, textos y tema;
- sincronización desde Nexus Enterprise Pro;
- costos, proveedores, usuarios, caja, deudas y auditoría nunca se publican.

## Rutas públicas
- `/c/<slug>`
- `/c/<slug>/p/<source_product_id>`

## Antes de desplegar sobre CATALOG01
Ejecutar en Supabase:
`supabase/migrations/v3_storefront_upgrade.sql`

Luego desplegar este repositorio en Vercel con las mismas variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXUS_CATALOG_ADMIN_SECRET`
- `CATALOG_STORAGE_BUCKET`
