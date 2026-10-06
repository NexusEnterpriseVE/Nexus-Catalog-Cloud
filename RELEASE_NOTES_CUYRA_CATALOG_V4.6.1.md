# CUYRA Catalog Cloud v4.6.1 · VARGASUX01

## Objetivo
Portar al storefront CUYRA la experiencia visual y de interacción del tema suministrado `importadora-vargas-main`, manteniendo CUYRA como motor de datos multiempresa.

## Storefront
- Franja superior compacta y header blanco sticky/blur con navegación tipo Vargas.
- Hero editorial responsive de dos columnas, entrada escalonada, fondos glow, tarjeta flotante y animación float.
- Hero reutiliza banner del tenant y, si no existe, la imagen del primer producto destacado/disponible.
- Marquee infinito de marcas con pausa al hover.
- Catálogo con título, contador, búsqueda redondeada y pills horizontales de categorías.
- Grilla 4/3/2 columnas según viewport.
- Product Card separada para móvil y desktop, replicando jerarquía del tema: marca, nombre, rating, precio Detal/Desde, precio Mayor, mínimo mayorista, disponibilidad y estados Oferta/Destacado/Agotado.
- Productos sin precio válido muestran `Consultar`.
- FAQ visual tipo acordeón, CTA oscuro de WhatsApp, carrusel animado de beneficios de 6 segundos.
- Barra móvil flotante de 5 accesos con el lenguaje visual del tema.
- Footer multi-columna y métodos de pago.
- Ficha de producto, carrito, checkout, variantes, reseñas y WhatsApp conservan la lógica CUYRA y reciben la nueva piel visual.

## White-label / multiempresa
El layout es compartido, pero logo, color, nombre, teléfonos, productos, precios, stock, banners, marcas y métodos de pago siguen resolviéndose por tenant. Daca, Rican y cualquier otro tenant permanecen separados por su `tenant_id`/slug.

## Integración
No se modificaron los archivos críticos de sincronización o resolución de catálogo respecto de v4.6.0:
- `api/sync-product.ts`
- `api/sync-settings.ts`
- `server/supabase.ts`
- `api/catalog.ts`
- `api/product.ts`
- `v4_6_commerce_theme.sql`

## Base de datos
No requiere SQL nuevo. Se conservan las columnas mayoristas agregadas en v4.6.0.
