# CUYRA Catalog Cloud V4.4.1 · MOTIONUX01 + ADMINBANNERUX01

> Update acumulativo sobre V4.4.0. No requiere nueva migración Supabase. Conserva MOBILECOMMERCE02 + PRODUCTUX01 + RATING01 + WACONFIRM01 y añade movimiento/UX y administración visual de banners.

Catálogo cloud multiempresa conectado a **CUYRA**. CUYRA es la fuente de verdad; Catalog Cloud es la proyección online para la tienda pública y consumidores autorizados como Sofía.

> Compatibilidad: el repositorio y varias claves técnicas pueden seguir llamándose `Nexus-Catalog-Cloud` / `NEXUS_*` por continuidad operativa. El branding público de esta versión es CUYRA. No renombres secretos, slugs ni infraestructura durante este update.

## Arquitectura

`CUYRA → OUTBOX/HTTPS → Catalog Cloud → Supabase central → Web + API privada Sofía`

GitHub contiene el código, Vercel ejecuta el proyecto y Supabase conserva la proyección cloud. Los productos se administran desde CUYRA.

## V4 · producto padre + variantes

El contrato V4 conserva `sourceGroupId`, `groupCode`, `groupName`, `variantLabel`, `variantAttributes` y los metadatos privados de Sofía. Catalog Cloud almacena cada SKU sincronizable y agrupa el storefront por `source_group_id`.

En la tienda:
- una tarjeta por producto/grupo;
- precio único o `Desde` cuando hay rango;
- stock agrupado respetando `show_stock_mode`;
- ficha con selector de variantes;
- la variante cambia imagen, SKU, precio y disponibilidad;
- WhatsApp recibe la variante/SKU seleccionados;
- productos sin variantes continúan funcionando.

## V4.1 · CUYRA Catalog UI02

- Root sin tenant = experiencia institucional **CUYRA Catalog**, nunca estado genérico vacío.
- Tenant conectado = la marca del cliente es protagonista; CUYRA aparece discretamente como plataforma.
- Topbar dinámica, header glass/sticky, hero premium, subbanner fino, categorías y marcas rediseñadas.
- Buscador predictivo, filtros activos, ordenamiento y estados vacíos/error refinados.
- Cards uniformes, variantes compactas, badges de destacado/disponibilidad y carga lazy de imágenes.
- Ficha de producto comercial con CTA **Pedir por WhatsApp**, **Consultar disponibilidad**, cantidad, variantes, características y relacionados.
- Footer white-label con `Powered by CUYRA` y CTA secundario de CUYRA al WhatsApp corporativo.
- Responsive de escritorio/tablet/móvil.


## V4.3 · MOBILECOMMERCE01

Actualización enfocada en la **experiencia móvil del storefront**, sin crear una segunda fuente de verdad ni cambiar el modelo de inventario. Se conserva CUYRA como origen de productos, variantes, precios, stock, galería y publicación.

- Header móvil tipo app: menú, marca del tenant, favoritos y pedido.
- Hero compacto orientado a compra, reutilizando los datos actuales del tenant.
- Accesos rápidos: categorías, marcas, destacados y pedido.
- Carrusel horizontal de categorías en móvil.
- Navegación inferior fija: Inicio, Categorías, Buscar, Destacados y Pedido.
- Catálogo móvil de dos columnas más compacto con quick-add.
- Filtros como bottom sheet con contador de resultados y acciones `Limpiar` / `Ver productos`.
- Rango de precio utiliza los parámetros `minPrice`/`maxPrice` que ya soporta la API.
- Filtro `Destacados` usa `featured=1` sobre el campo existente; no requiere migración.
- Disponibilidad reutiliza la lógica actual del tenant.
- Desktop, ficha de producto, galería, variantes, favoritos, recientes, pedido y WhatsApp se preservan.

**No requiere migración SQL nueva.**

## V4.4 · MOBILECOMMERCE02 + PRODUCTUX01 + RATING01 + WACONFIRM01

Update acumulativo inspirado en la experiencia comercial de Doña Ula y adaptado al modelo multi-tenant de CUYRA. No copia branding ni crea una segunda fuente de verdad.

- Hero/banner carousel de hasta 3 slides por tenant, con fallback automático.
- Home comercial con Categorías, Marcas, Destacados, Recomendados, Ofertas y Novedades.
- Cards con precio anterior/descuento, badge promocional y calificaciones reales.
- Filtro Ofertas y orden Mejor calificados.
- Ficha de producto con galería/variantes, cantidad, relacionados, rating y reseñas moderadas.
- Las reseñas nuevas nacen pendientes; el promedio público usa solo `approved=true`. No existen estrellas falsas precargadas.
- Admin privado ampliado para banners/Home, Delivery/Retiro, merchandising (precio anterior, badge, recomendado) y moderación de reseñas.
- Flujo de compra: lista/carrito → confirmación → Delivery/Retiro → código `CY-YYMMDD-XXXXXX` → WhatsApp estructurado.
- El backend revalida producto, SKU, precio y stock publicados antes de crear la solicitud; no confía en precios guardados en el navegador.
- Las solicitudes WhatsApp se registran en `catalog_whatsapp_requests`, pero **no crean ventas, no reservan stock y no modifican inventario/Caja**.
- La sincronización desde Principales anteriores preserva el merchandising V4.4 cuando esos clientes todavía no envían los campos nuevos.
- Se mantienen **12 archivos Serverless** en `api/`.

**Migración requerida:** `supabase/migrations/v4_4_mobilecommerce02.sql` antes de desplegar V4.4.0. Es aditiva y no contiene `DROP`, `DELETE`, `TRUNCATE` ni renombres destructivos.

## COMMERCEUX01

- Lista de pedido ligera (sin checkout/pago web).
- Cantidades por producto/variante.
- Favoritos locales y vistos recientemente.
- Compartir producto.
- PWA instalable (manifest + service worker).
- Mensajes de WhatsApp estructurados con producto, SKU, variante, cantidad, precio referencial, disponibilidad y origen.

No se implementan todavía reservas, cotizaciones, apartados ni pagos online. La arquitectura queda preparada para esas etapas.

## CATALOGANALYTICS01

Eventos agregados y sin identidad de usuario: vistas de catálogo/producto, búsquedas, categorías, favoritos, compartir, añadir a lista y clics de consulta/pedido por WhatsApp.

- Escritura pública controlada: `POST /api/analytics` (solo eventos allowlist, tenant activo y datos acotados).
- Lectura administrativa: `GET /api/admin-analytics?slug=<tenant>&days=30` con `x-admin-secret`.
- Migración aditiva: `supabase/migrations/v4_1_catalog_analytics.sql`.
- Si la migración todavía no existe, el storefront sigue funcionando y la API de analytics degrada sin romper el catálogo.

## API pública

- `GET /api/catalog?slug=<tenant>`
- `GET /api/product?slug=<tenant>&productId=<source_product_id>`
- `POST /api/analytics`

Rutas web:
- `/c/<slug>`
- `/c/<slug>/p/<source_product_id>`

## API privada de Sofía

- `GET /api/sofia-catalog?slug=<tenant>&q=<texto>`
- `GET /api/sofia-product?slug=<tenant>&productId=<id>`
- `GET /api/sofia-product?slug=<tenant>&sku=<sku>`

Usa un token de lectura propio por tenant. Nunca entregar a Sofía `SUPABASE_SERVICE_ROLE_KEY`, `NEXUS_CATALOG_ADMIN_SECRET` ni el token `nxc_...` de sincronización.

## Despliegue recomendado

1. Crear commit/tag de respaldo del repo actual.
2. Probar este source en una rama/Preview de Vercel.
3. Ejecutar **solo si quieres analytics** `supabase/migrations/v4_1_catalog_analytics.sql` en el Supabase oficial.
4. Ejecutar `supabase/migrations/v4_4_mobilecommerce02.sql` en el Supabase oficial.
5. Verificar `/api/health` → `CUYRA Catalog Cloud`, `4.4.1`.
6. Probar primero `/c/daca-sport` con productos reales, variantes, filtros, WhatsApp y móvil.
7. Confirmar que logo/colores/datos de Daca Sport siguen siendo protagonistas.
8. Solo después hacer merge a `main` / Production.

La actualización del storefront no cambia la fuente de verdad ni requiere duplicar productos.
