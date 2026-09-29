# Release Notes · CUYRA Catalog V4.4.0

**Build:** MOBILECOMMERCE02 + PRODUCTUX01 + RATING01 + WACONFIRM01  
**Base:** V4.3.0 MOBILECOMMERCE01  
**Tipo:** update acumulativo multi-tenant

## Nuevo
- Home comercial estilo app con hero/banner carousel configurable.
- Destacados, Recomendados, Ofertas y Novedades.
- Filtro Ofertas y orden por calificación.
- Precio anterior, descuento/badge y merchandising administrable.
- Calificaciones reales, comentarios y moderación.
- Pantalla de confirmación antes de WhatsApp.
- Delivery / Retiro configurable.
- Código de solicitud `CY-YYMMDD-XXXXXX`.
- Registro de solicitudes WhatsApp.
- Estado explícito Sin conexión.

## Seguridad / consistencia
- Checkout revalida IDs, nombre, SKU, precio y stock contra `catalog_products` antes de generar la solicitud.
- El navegador no decide el precio final del mensaje estructurado.
- Una solicitud WhatsApp no mueve inventario ni crea venta en CUYRA.
- Reviews nuevas se guardan pendientes y el storefront usa solo reviews aprobadas.
- Anti-spam diario por fingerprint hash.
- Sincronización de un Principal anterior no pisa `recommended`, `promo_badge` ni `compare_at_price_*` si esos campos no vienen en el payload.

## Base de datos
Migración requerida: `supabase/migrations/v4_4_mobilecommerce02.sql`.

Es aditiva e incorpora configuración de vitrina, campos de merchandising, `catalog_product_reviews` y `catalog_whatsapp_requests`.

## Vercel
- Conteo `api/*.ts`: 12 (sin aumento de Functions).
- Desplegar primero en Preview.
- `GET /api/health` debe responder versión `4.4.0` y protocolo `catalog-v4.4-commerce`.


## Alcance
- Combos no forman parte de esta versión; V4.4.0 se concentra en catálogo por producto, promociones, calificaciones y pedido asistido por WhatsApp.
