# CUYRA Catalog Cloud V4.2.0 · GALLERY01

Actualización acumulativa sobre V4.1.0 HF06 MEDIAFIT02.

## Nuevo
- `gallery_urls` aditivo en productos cloud.
- Backfill de `image_url` a galería para productos existentes.
- Sincronización de hasta 5 imágenes desde CUYRA Principal.
- La imagen principal sigue siendo `image_url` para compatibilidad y cards.
- PDP con galería, miniaturas, navegación, lightbox/zoom y soporte móvil.
- API pública y endpoints Sofía incluyen la galería sin exponer datos privados.

## Deployment
1. Aplicar `supabase/migrations/v4_2_product_gallery.sql`.
2. Desplegar V4.2.0 GALLERY01.
3. Confirmar `/api/health`.
4. Sincronizar un producto de prueba desde Principal V3.10.0 GLOBAL01.
5. Validar un producto antiguo de una foto y uno nuevo de 2–5 fotos.

No elimina productos, tenants ni imágenes actuales.
