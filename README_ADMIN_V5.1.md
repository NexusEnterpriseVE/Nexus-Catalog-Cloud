# CUYRA Catalog Cloud — Admin V5.1 (UX de inventario)

Entrega del repositorio completo, basada en Nexus Catalog Cloud V5.0.

## Cambios
- Tema claro predeterminado en administración (oscuro y sistema disponibles).
- Barra superior, menú lateral claro y jerarquía visual próxima a referencia Depot.
- Pantalla Productos como entrada predeterminada en ausencia de fragmento de URL; los fragmentos #general, #vitrina, #productos, #resenas se mantienen.
- Acceso administrativo en sección desplegable: no se almacena la clave.
- Tabla compacta con producto, SKU, categoría, existencia, estado, precio y mayorista.
- Búsqueda, filtros por marca/categoría/stock/promoción, ordenación y paginación.
- Edición comercial mediante modal y panel móvil con tarjetas.
- Dashboard con indicadores calculados al cargar productos.

## Conexión
En administración, pulsar «Conectar catálogo», introducir clave administrativa y slug. Luego pulsar «Actualizar productos» para cargar el catálogo. Las llamadas API existentes se conservan.

## Instalación
`npm install` y `npm run build`. En Vercel mantener las variables de entorno previamente configuradas. No sustituir configuración de Supabase ni subir `.env` con secretos. Validar en preview antes de promocionar a producción.

## Límites de validación
Se incluyen las fuentes completas. El build con dependencias instaladas y la sincronización contra el Supabase real deben verificarse antes del despliegue definitivo.
