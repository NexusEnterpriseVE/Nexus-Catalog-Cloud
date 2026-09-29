# Despliegue · Nexus Catalog Cloud v0.1.0

## 0. Antes de comenzar
Necesitas:
- una cuenta/proyecto Supabase;
- un proyecto Vercel;
- una clave administrativa larga y aleatoria para `NEXUS_CATALOG_ADMIN_SECRET`.

No coloques la Service Role de Supabase dentro de Nexus Desktop ni en código frontend.

## 1. Supabase
1. Crear proyecto.
2. SQL Editor → ejecutar `supabase/schema.sql` completo.
3. Storage → crear bucket **público** llamado `catalog-products`.
4. El bucket se usa únicamente para imágenes que deben ser visibles en el catálogo público.
5. Project Settings/API → copiar:
   - Project URL;
   - Service Role / secret key para backend.

El SQL habilita RLS y revoca acceso directo a las tablas para `anon` y `authenticated`. Las Vercel Functions usan la credencial privilegiada solo desde servidor.

## 2. Vercel
Crear un proyecto nuevo apuntando a esta carpeta/repo.

Variables de entorno:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXUS_CATALOG_ADMIN_SECRET`
- `CATALOG_STORAGE_BUCKET=catalog-products`

Build:
- comando: `npm run build`
- output: `dist`

Después del deploy prueba:
- `/api/health`

Debe devolver `ok: true`.

## 3. Crear el primer catálogo
Abrir:
`/nexus-admin-tenant-7f4b2.html`

Introducir:
- `NEXUS_CATALOG_ADMIN_SECRET`;
- slug;
- nombre público;
- teléfono/WhatsApp opcional;
- web opcional.

El endpoint devuelve un `syncToken` `nxc_...` **una sola vez**. Guárdalo en un gestor seguro y luego cópialo a la configuración de Nexus Desktop.

Si se pierde o sospechas exposición, usa **Rotar token**. El token anterior queda inválido.

## 4. Vincular Nexus Enterprise Pro
En **Catálogo Online**:
- API: URL de Vercel sin `/` final;
- Slug: el tenant creado;
- Token: `nxc_...`;
- stock público: Exacto / Disponible-Agotado / Oculto;
- activar catálogo;
- Guardar;
- Probar conexión.

URL pública:
`https://TU-PROYECTO.vercel.app/c/TU-SLUG`

## 5. Primera prueba
1. En Nexus, selecciona un producto de prueba.
2. Define nombre/descripción/precio público.
3. Marca **Publicar**.
4. `Sincronizar ahora`.
5. Abre `/c/<slug>`.
6. Confirma foto, SKU, descripción, USD, Bs y disponibilidad.
7. Haz una venta local del producto.
8. Confirma que el cambio entra en OUTBOX y luego actualiza el catálogo.

## 6. Prueba offline
1. Desconecta Internet.
2. Procesa una venta en Nexus.
3. La venta/caja/stock deben completarse localmente.
4. El cambio cloud debe quedar pendiente.
5. Reconecta Internet.
6. Nexus debe reintentar la sincronización.

## 7. Privacidad
En DevTools/Network del catálogo público verifica:
- no aparecen costos;
- no aparecen proveedores;
- no aparecen usuarios/caja/deudas;
- modo `status`: `stock_exact` es `null`;
- modo `hidden`: `stock_exact` y `availability` son `null`.

## 8. Rotación de token
Desde la página privada:
- escribe el slug;
- pulsa Rotar token;
- guarda el nuevo `nxc_...`;
- actualízalo en Nexus Desktop.

El token anterior debe dejar de sincronizar.

## 9. Límites de imágenes
La app Desktop intenta enviar JPEG optimizado <= 2.6 MB. El API rechaza binarios procesados > 2.8 MB. Esto mantiene el payload base64/JSON dentro de un tamaño apropiado para la Function.

## 10. Antes de producción
- cambia cualquier secret de prueba;
- confirma que el admin secret sea largo/aleatorio;
- no publiques capturas que muestren tokens;
- realiza prueba con al menos 100–1000 productos;
- verifica renovación de fotos y agotados;
- revisa logs de Vercel/Supabase tras la prueba.
