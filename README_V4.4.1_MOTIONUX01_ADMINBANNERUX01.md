# CUYRA Catalog V4.4.1 · MOTIONUX01 + ADMINBANNERUX01

Update visual/UX acumulativo sobre V4.4.0.

## No modifica
- Supabase schema ni migraciones.
- Sincronización CUYRA → Catalog.
- Stock, precios base ni variantes.
- Checkout/WhatsApp del V4.4.0.
- Número de Serverless Functions (12).

## MOTIONUX01
- Carousel automático con transición premium.
- Pausa al interactuar, flechas desktop, swipe móvil y barra de progreso.
- Revelado progresivo al hacer scroll para secciones y productos.
- Microanimaciones en favoritos, agregar, cantidades, variantes y navegación.
- Entrada animada de drawer/filtros y confirmación WhatsApp.
- Check animado en “Tu pedido está listo”.
- Shimmer de carga mejorado.
- Respeta `prefers-reduced-motion`.

## ADMINBANNERUX01
En `/nexus-admin-tenant-7f4b2.html`:
- Vista previa en vivo de cada banner.
- Imagen escritorio y móvil separadas.
- Título/subtítulo y CTA más claros.
- Selector de destino: productos, categoría, marca, producto o ruta interna.
- Botón para limpiar cada banner antes de guardar.

### Ejemplos de destino
- Productos: tipo `Productos`, valor vacío.
- Categoría: tipo `Categoría`, valor `Balones`.
- Marca: tipo `Marca`, valor `Mikasa`.
- Producto: tipo `Producto (ID)`, valor `123`.
- Ruta interna: tipo `Ruta interna`, valor `/c/daca-sport`.

## Deploy
No ejecutar SQL. Reemplazar únicamente los archivos del patch V4.4.1 y dejar que Vercel despliegue.
