# CUYRA Catalog Cloud V4.5.0 — RETAILUX02 + CHECKOUT02

## Objetivo
Actualizar la experiencia visual/comercial del catálogo sin romper los contratos existentes con CUYRA, Supabase, Vercel, Sofía, tenants, tokens, rutas, Storage ni claves de `localStorage`.

## UX / Retail
- Header premium responsive con logo del tenant, Marcas, Categorías, Ofertas, búsqueda, favoritos y carrito.
- Buscador real en overlay con resultados predictivos y navegación al catálogo.
- Barra de anuncios rotativos administrables.
- Hero/banner responsive con soporte `imageUrl` + `mobileImageUrl`, swipe, autoplay y controles.
- Carrusel de marcas con logos opcionales administrables y fallback tipográfico.
- Navegación de categorías compacta; se elimina la estética tipo dashboard numerado.
- Product Card V3: foto protagonista, SKU, rating, precio, descuento, favorito y CTA simplificados.
- Product Detail V3: galería, variantes, SKU, ratings, precio, disponibilidad, Comprar ahora / Agregar al carrito.
- WhatsApp FAB con icono reconocible y posición responsive.
- Bloque de confianza movido al final y simplificado.
- Responsive móvil diseñado específicamente: 2 columnas, bottom sheets/drawers y barra de compra sticky.

## Checkout request
- Carrito con cantidades y resumen.
- `Comprar ahora` abre checkout directamente.
- Datos de contacto y cédula opcional configurable.
- Entrega: retiro en tienda o envío.
- Agencias configurables; defaults: Zoom / Tealca.
- Métodos de pago configurables; defaults: Pago Móvil, transferencia, Zelle, Binance/USDT.
- Validación servidor de producto, SKU/variante, precio y stock antes de generar el mensaje.
- WhatsApp final estructurado con código de solicitud, cliente, entrega, productos, total y método de pago.
- Registro estructurado aditivo en `catalog_whatsapp_requests`.

## Compatibilidad preservada
- Rutas `/c/:slug`, `/catalogo/:slug`, `/p/:productId`.
- Tokens `nxc_*`, `nxs_*` y Admin Secret.
- Variables de entorno actuales.
- `tenant_id + source_product_id`, `source_group_id`, SKU, OUTBOX e idempotencia.
- Buckets/rutas de Storage existentes.
- `localStorage`: `cuyra.catalog.favorites.*`, `recent.*`, `order.*`.
- Catalog Cloud sigue sin crear ventas, reservar stock o tocar Caja automáticamente.

## Migración
Ejecutar `supabase/migrations/v4_5_retailux_checkout.sql` antes de aprovechar el registro enriquecido. El endpoint mantiene fallback compatible con el esquema V4.4.x si las columnas nuevas aún no existen.
