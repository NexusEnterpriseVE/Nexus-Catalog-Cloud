# Nexus Catalog Cloud V4.0.0 · CENTRAL01

Catálogo cloud multiempresa de Nexus Enterprise Pro. Nexus es la fuente de verdad; Catalog Cloud es la proyección online para tienda pública y consumidores autorizados como Sofía.

## Arquitectura

`Nexus Enterprise Pro → OUTBOX/HTTPS → Catalog Cloud → Supabase central de Nexus → Web + API privada Sofía`

GitHub contiene el código. Vercel ejecuta el proyecto. Supabase conserva la proyección cloud. Los productos se administran en Nexus.

## V4 · producto padre + variantes

Nexus V3.6 envía cada variante por el endpoint compatible `/api/sync-product`, agregando `sourceGroupId`, `groupCode`, `groupName`, `variantLabel`, `variantAttributes` y metadatos de Sofía.

Catalog Cloud almacena cada SKU como fila sincronizable y, al leer, agrupa por `source_group_id`. Esto evita duplicar inventario y mantiene idempotencia por `source_product_id`.

En la tienda:
- una tarjeta por producto/grupo;
- precio único o `Desde` cuando las variantes tienen precios diferentes;
- stock agrupado;
- ficha con selector de variantes;
- al seleccionar variante cambian imagen, SKU, precio, Bs y disponibilidad;
- WhatsApp recibe la variante y SKU seleccionados;
- productos sin variantes siguen funcionando.

## API pública

- `GET /api/catalog?slug=<tenant>`
- `GET /api/product?slug=<tenant>&productId=<source_product_id>`

Las rutas web siguen siendo:
- `/c/<slug>`
- `/c/<slug>/p/<source_product_id>`

## API privada de Sofía

- `GET /api/sofia-catalog?slug=<tenant>&q=<texto>`
- `GET /api/sofia-product?slug=<tenant>&productId=<id>`
- `GET /api/sofia-product?slug=<tenant>&sku=<sku>`

Requiere `Authorization: Bearer <token privado de Sofía>`.

El token de Sofía es distinto al token de sincronización de Nexus y se genera por tenant con:
- `POST /api/admin-rotate-sofia-token`

Nunca entregar a Sofía:
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXUS_CATALOG_ADMIN_SECRET`
- token `nxc_...` de sincronización de Nexus.

## Despliegue desde V3.0.1

1. Ejecutar `supabase/migrations/v4_catalogcentral_variants_sofia.sql` en el Supabase central de Nexus.
2. Desplegar este repositorio en el proyecto Vercel oficial conectado a `NexusEnterpriseVE/Nexus-Catalog-Cloud`.
3. Verificar `/api/health`.
4. En Nexus V3.6 guardar un grupo de prueba y sincronizarlo.
5. Verificar `/api/catalog?slug=daca-sport` y la ficha web.
6. Generar token privado de Sofía únicamente cuando la API esté validada.

La migración es aditiva: V3 puede seguir operando mientras se despliega V4.
