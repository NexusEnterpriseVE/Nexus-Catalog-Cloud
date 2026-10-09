# Nexus / CUYRA Catalog Cloud V6.3 — Premium Light & Mobile Commerce

Repositorio completo para GitHub y Vercel. **La raíz de este ZIP es la raíz del repositorio** (no subas una carpeta superior). Mantiene catálogo multiempresa, Supabase, rutas, sistema de pedidos y administrador existentes.

## Instalación y despliegue

1. Haz respaldo de tu rama actual. Sube los archivos de este ZIP a una rama de prueba del repositorio.
2. Mantén en Vercel las variables de entorno de `.env.example`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXUS_CATALOG_ADMIN_SECRET`, y `CATALOG_STORAGE_BUCKET` cuando proceda. Nunca publiques sus valores.
3. Usa Node 20 o superior y ejecuta `npm install` y `npm run build` (Vercel usa `npm run build`). La salida es `dist`.
4. Verifica `/c/daca-sport`, una ficha `/c/daca-sport/p/ID` y `/nexus-admin-tenant-7f4b2.html` en **Preview** antes de fusionar con `main`.
5. Verifica stock, precios, un producto con descuento por cantidad, carrito, formulario, WhatsApp y un guardado real en el admin conectado a tu tenant.

## Qué se implementó

- Solo tema claro, sin selector ni sincronización con el tema del sistema.
- Sistema visual para catálogo y administrador: tipografía legible, márgenes consistentes, tarjetas y botones unificados, imagen sin blur agresivo, estados vacíos y transiciones discretas.
- Navegación y búsqueda públicas, todas las categorías disponibles, filtros comerciales, tarjetas y detalles con precio detal, mayorista y condición de unidades mínimas cuando están configurados.
- Bloque mayorista vinculado al selector de cantidad, ahorro y total en ficha/carrito. El API verifica precios y existencias contra Supabase para cada pedido; nunca se confía en el precio enviado por el navegador.
- Reviews con resumen, distribución, tarjetas y estado inicial sin opiniones inventadas; productos relacionados, carrito y checkout comercial.
- Admin claro con productos al inicio, búsqueda por nombre/SKU/marca, filtros, tabla en PC, fichas compactas móviles, paginación y editor comercial. Filtros plegables en teléfono.
- CSS público `src/v6-complete.css`, CSS administrativo `public/nexus-admin-v6-complete.css` y versión de caché nueva en el service worker.

## Calidad y despliegue en Vercel

- Verificadas sintaxis TS/TSX, JS y estructura CSS; probado el precio por cantidad (1, 3, 4 y 5 unidades) y la UI del administrador con 850 artículos simulados en escritorio y teléfono.
- La prueba visual usó productos simulados, no registros reales de tu tienda.
- **La compilación la realiza Vercel** después del commit. El entorno de edición no permite afirmar que Vercel compiló o que Supabase real fue probado. Si la build en Vercel resulta correcta, revisa también el catálogo y la administración con tus registros reales.

## Comandos

```bash
npm install
npm run build
npm run dev
npm run qa:wholesale
```

Nota: los archivos CSS anteriores siguen presentes para compatibilidad con las pantallas heredadas; las reglas V6.3 son las últimas aplicadas y prevalecen. No cambies las claves ni las APIs al actualizar solo el frontend.

## Reconciliación con ZIP estable

Se comparó el proyecto con `Nexus-Catalog-Cloud-main (1).zip`. Se conservan las carpetas operativas `api`, `server`, `src`, `public`, `supabase` y se reincorpora `scripts/qa` con las pruebas originales. El contenido de la raíz se mantiene limpio; las versiones y archivos de respaldo duplicados del ZIP estable no son necesarios para que Vercel ejecute el proyecto.


## Actualización V6.3

Ver `README_V6.3.md`: mejoras de legibilidad/compactación móvil y recuperación del precio mayorista **desde X unidades** por variante. Los datos mayoristas deben existir y estar habilitados en Vitrina Comercial.
