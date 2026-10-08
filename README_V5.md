# Nexus / CUYRA Catalog Cloud V5.0 — entrega integral

## Qué cambia

- Vitrina pública: tarjetas con CTA, jerarquía de precio, favoritos, ratings y enlaces a la ficha; imágenes agotadas reconocibles con desenfoque mínimo.
- Calificaciones: puntuación global, distribución real por estrellas, filtro de comentarios, formulario existente de moderación (sin valoraciones inventadas).
- Claro, oscuro y sistema: preferencia persistente local al navegador para la tienda pública y el admin.
- Responsive: dos columnas de productos en teléfono; administrador con navegación adaptable, tabla de escritorio y tarjetas móviles.
- Admin multiempresa: configuración por secciones, banners plegables, gestión comercial con búsqueda por nombre, SKU, identificador o variante, filtros por marca/categoría/stock/promoción, ordenación, paginación y edición en modal. Se mantiene el contrato de actualizaciones comerciales actual.
- Endpoint `mode=merchandising`: lectura paginada de hasta 10.000 filas (antes solo 1.000); incluye campos necesarios para filtrar.
- Service worker: nueva versión de caché, carga de recursos por red primero para prevenir ver diseños anteriores por caché PWA.

## Preparación y despliegue

1. Conserva las variables de entorno que ya utiliza tu despliegue de Supabase/Vercel. Revisa `.env.example` y los documentos de despliegue anteriores. **No publiques ni copies secretos al ZIP**.
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio de GitHub, conservando la estructura `src/`, `public/`, `api/`, `server/`, `supabase/` y `vercel.json`.
3. En Vercel, conserva el proyecto y las variables de entorno existentes, con build command `npm run build` y output directory `dist`.
4. En tu PC o en CI, ejecuta `npm install` y `npm run build`; valida las rutas `/c/<slug>`, `/c/<slug>/p/<id>` y `/nexus-admin-tenant-7f4b2.html`.
5. Después del despliegue, prueba una recarga forzada del navegador y, para instalaciones PWA antiguas, cierra y vuelve a abrir la aplicación para activar el nuevo service worker.

## Compatibilidad y límites

- No se renombraron slugs, tablas, claves ni endpoints de sincronización; la arquitectura multiempresa se mantiene.
- Los precios, stock, fotos y variantes provienen de CUYRA/Nexus; editar promociones desde el admin no reemplaza el sistema de inventario de origen.
- No se requieren nuevas migraciones SQL para esta versión, presuponiendo que el esquema V4.6 previo está aplicado.
- La consola V5 usa un máximo de 10.000 filas visibles en administración por petición; se informa si se alcanza el tope.
- Los datos reales y la sincronización de Supabase solo pueden probarse conectando un despliegue configurado. No es posible asegurar compatibilidad operativa en producción sin esa prueba de integración.

## Comprobaciones de esta entrega

- Sintaxis de TypeScript/TSX y JavaScript, CSS y existencia de controles: se verifica localmente.
- `npm run build`: depende de instalar módulos externos con npm. En el entorno de empaquetado la red no permitió descargar dependencias (error EAI_AGAIN); ejecutar en el equipo o CI con acceso a npm antes de publicar.

