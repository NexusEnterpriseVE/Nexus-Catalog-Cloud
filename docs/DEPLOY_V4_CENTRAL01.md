# Deploy controlado · V4 CENTRAL01

## 0. Antes de empezar
- Trabajar únicamente en el proyecto Vercel oficial de Nexus.
- Repositorio esperado: `NexusEnterpriseVE/Nexus-Catalog-Cloud`, rama de producción `main`.
- No compartir valores de `.env`, Service Role, Admin Secret ni tokens.

## 1. Supabase
Abrir SQL Editor del Supabase central de Nexus y ejecutar completo:

`supabase/migrations/v4_catalogcentral_variants_sofia.sql`

Es una migración aditiva. No borra productos V3.

## 2. GitHub / Vercel
Subir los archivos V4 al repositorio oficial. Vercel debe crear deployment desde Git, no mediante upload manual.

Verificar que el build corresponda al commit V4 y quede `Ready`.

## 3. Health
Abrir `/api/health` en el dominio oficial.

## 4. Prueba Daca Sport
En Nexus V3.6 abrir un grupo real de prueba, por ejemplo un producto con cuatro colores. Guardar el grupo para colocar sus variantes en OUTBOX y luego usar `Sincronizar ahora`.

Consultar:
- `/api/catalog?slug=daca-sport&limit=5`
- ficha `/c/daca-sport/p/<source_product_id>`

Esperado: una sola tarjeta, `variant_count` mayor a 1 y selector visual en detalle.

## 5. Sofía
Solo después de validar Web:
- usar la Admin UI privada V4;
- colocar el slug `daca-sport`;
- pulsar `Generar / rotar token privado de Sofía`;
- guardar el valor `nxs_...` únicamente en el backend/secret store de Sofía.

Probar con header:
`Authorization: Bearer <nxs_...>`

Endpoints:
- `/api/sofia-catalog?slug=daca-sport&limit=5`
- `/api/sofia-product?slug=daca-sport&sku=<SKU>`

## Rollback de código
Si el deployment V4 presenta un problema, Vercel puede promover/revertir al deployment V3. La migración SQL puede permanecer porque es aditiva y V3 ignora las columnas nuevas.
