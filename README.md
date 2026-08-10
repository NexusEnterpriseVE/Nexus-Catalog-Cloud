# Nexus Catalog Cloud v0.1.0 · Phase 1 / CATALOG01

Catálogo público multiempresa sincronizado desde Nexus Enterprise Pro.

## Incluye
- Vercel Functions como API;
- Supabase/Postgres multi-tenant;
- Supabase Storage para fotografías públicas;
- token de sincronización independiente por empresa;
- hash SHA-256 del token en cloud;
- rotación de token;
- idempotencia de eventos;
- RLS + revocación de acceso directo `anon/authenticated` a tablas;
- catálogo responsive `/c/<slug>` y `/catalogo/<slug>`;
- búsqueda, categorías y paginación;
- precio USD + Bs;
- stock `exact` / `status` / `hidden`;
- agotados visibles u ocultos;
- WhatsApp opcional;
- alta/rotación privada de tenants mediante página `noindex`.

## Regla de privacidad
El navegador público no consulta directamente las tablas Supabase. Consume `/api/catalog`. La Service Role queda únicamente en variables de entorno del backend.

Cuando el stock está en modo `status`, la respuesta pública no entrega la cantidad exacta. En modo `hidden`, no entrega cantidad ni estado útil al navegador.

## Fotos
La app de escritorio optimiza las imágenes antes del envío. El endpoint rechaza imágenes procesadas superiores a 2.8 MB, dejando margen para el JSON/base64.

## No incluye todavía
- carrito;
- checkout;
- pedidos online;
- pagos online;
- Nexus LAN / Multi-PC.

## Empezar
1. Lee `docs/DEPLOY_VERCEL_SUPABASE.md`.
2. Ejecuta `supabase/schema.sql` en Supabase.
3. Crea el bucket público `catalog-products`.
4. Despliega esta carpeta como proyecto Vercel.
5. Configura las variables de entorno.
6. Crea el tenant desde `/nexus-admin-tenant-7f4b2.html`.
7. Copia el token `nxc_...` en Nexus Enterprise Pro → Catálogo Online.
8. Publica y sincroniza un producto de prueba.

## QA local disponible
`python scripts/qa/qa_static.py`

El build npm/Vercel real requiere instalar las dependencias del proyecto en un entorno con acceso al registry npm.


## Hotfix 0.1.1
Las Vercel Functions en `api/*.ts` usan el Web Handler nativo mediante `export default { fetch(request) { ... } }`, compatible con el runtime Node.js actual de Vercel.
