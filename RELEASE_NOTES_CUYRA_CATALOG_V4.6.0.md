# CUYRA Catalog Cloud v4.6.0 · Commerce Theme

## Objetivo
Adaptar la experiencia visual/comercial al patrón de Distribuidora Vargas sin reemplazar la arquitectura CUYRA.

## Compatibilidad con CUYRA Desktop
- No cambia `x-sync-token`, `sync_token_hash`, el protocolo v3/v4 ni las rutas `/api/sync-product` y `/api/sync-settings`.
- El tema Commerce se guarda como `commerce_settings_json.visualTheme`, un override Cloud separado de `catalog_theme`.
- `/api/sync-settings` ahora fusiona los ajustes enviados por la PC con la configuración Cloud existente para no borrar carriers, pagos, anuncios, logos, tema Commerce ni ajustes futuros del Admin.
- Los campos mayoristas son opcionales y se administran en Cloud; el sync actual no los pisa.

## UI
- Nuevo tema `Commerce`: tarjetas más comerciales, precio Detal/Desde, Mayor, badges, rating, disponibilidad y 2 columnas móviles.
- Precio 0 se presenta como `Consultar` en tarjetas y ficha.
- Precio mayorista opcional + cantidad mínima.

## Base de datos
Ejecutar `v4_6_commerce_theme.sql` antes de usar precio mayorista.
