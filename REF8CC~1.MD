# CUYRA Catalog V4.4.0
## MOBILECOMMERCE02 + PRODUCTUX01 + RATING01 + WACONFIRM01

Actualización acumulativa sobre **V4.3.0 MOBILECOMMERCE01**. Lleva al storefront multi-tenant de CUYRA la experiencia comercial que validamos en Doña Ula, sin copiar su branding ni convertir el catálogo en una segunda fuente de verdad.

## Experiencia pública
- Hero/carousel con hasta 3 banners por tenant y fallback automático si aún no se configuraron imágenes.
- Home tipo app/comercio con accesos rápidos, categorías, marcas, Destacados, Recomendados, Ofertas y Novedades.
- Orden configurable de presencia de secciones comerciales desde la configuración del tenant.
- Cards premium con favoritos, quick-add, variantes, precio anterior, descuento/badge, estrellas reales y stock según la política del tenant.
- Filtro de **Ofertas** y orden **Mejor calificados**.
- Ficha de producto con galería/zoom, variantes, cantidad, precio anterior, disponibilidad, características, relacionados y CTA de compra.
- Estados de carga, sin resultados, error y **Sin conexión**.

## RATING01 · calificaciones reales
- Tabla `catalog_product_reviews` por tenant/producto/grupo.
- Valoraciones de 1–5 estrellas y comentario opcional.
- Las nuevas reseñas nacen `approved=false`; nunca se publican automáticamente ni se fabrican ratings.
- Anti-spam diario por huella hash tenant + producto/grupo + IP + fecha.
- Promedio y contador públicos se calculan únicamente con reseñas aprobadas.
- Moderación Aprobar/Ocultar desde el admin privado existente.

## PRODUCTUX01 · merchandising
- `recommended` para selección Recomendada.
- `compare_at_price_usd` / `compare_at_price_bs` para precio anterior visual.
- `promo_badge` para etiqueta promocional.
- Panel privado **Ofertas y recomendados** para configurar estos campos sin alterar el precio base que sincroniza CUYRA.
- Compatibilidad hacia atrás: si un Principal anterior no envía estos nuevos campos, la sincronización **no borra** el merchandising configurado en Cloud.

## WACONFIRM01 · pedido y WhatsApp
- Lista/carrito con cantidades por producto/variante.
- Pantalla de confirmación tipo checkout, sin pago web.
- Elección Delivery / Retiro según configuración del comercio.
- El backend vuelve a consultar nombre, SKU, precio y stock publicados antes de generar la solicitud; no confía en el precio guardado en el navegador.
- Si un producto desapareció, se agotó o la cantidad supera el stock actual, la confirmación se detiene y pide actualizar el pedido.
- Código de solicitud `CY-YYMMDD-XXXXXX`.
- WhatsApp estructurado con código, modalidad, líneas, cantidades, precios y total referencial.
- Registro en `catalog_whatsapp_requests` para trazabilidad comercial.
- **No crea una venta, no reserva stock y no modifica inventario/Caja en CUYRA.** El comercio confirma el pedido por WhatsApp.

## Banners / Home
El admin privado permite:
- hasta 3 banners;
- título, subtítulo, imagen URL, CTA y destino;
- Delivery / Retiro, texto de retiro y horario;
- visibilidad de Categorías, Destacados, Recomendados, Ofertas, Novedades y Marcas.

`sync-settings` también acepta estas configuraciones para una integración futura desde CUYRA Principal.

## Migración requerida
Ejecutar **antes de desplegar V4.4.0**:

`supabase/migrations/v4_4_mobilecommerce02.sql`

La migración es aditiva. No contiene `DROP`, `DELETE`, `TRUNCATE` ni renombres destructivos.

## Vercel / Serverless
Se conservan **12 archivos dentro de `api/`**. Las nuevas operaciones reutilizan `GET/POST` de endpoints existentes para no aumentar el conteo histórico de Serverless Functions.

## QA
- QA estático V4.4: PASS.
- Parse/transpile de TS/TSX crítico: PASS.
- Sintaxis del admin JS: PASS.
- Migración revisada como aditiva: PASS.
- Conteo Serverless: 12 → 12.
- No fue posible ejecutar `npm install`/`vite build` en el entorno de empaquetado por timeout de acceso al registro npm. Por eso el primer despliegue debe ser **Vercel Preview**, no Production directo.


## Alcance
- Combos no forman parte de esta versión; V4.4.0 se concentra en catálogo por producto, promociones, calificaciones y pedido asistido por WhatsApp.
