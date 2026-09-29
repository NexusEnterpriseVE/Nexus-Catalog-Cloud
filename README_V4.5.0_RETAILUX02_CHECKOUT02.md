# CUYRA Catalog Cloud V4.5.0

Update no destructivo sobre V4.4.1.

1. Aplicar `supabase/migrations/v4_5_retailux_checkout.sql`.
2. Mantener sin cambios las variables de entorno existentes.
3. Desplegar el proyecto en Vercel.
4. Probar sincronización desde CUYRA y confirmar que los productos siguen entrando por `/api/sync-product`.
5. Desde el administrador privado, configurar mensajes, retiro, agencias, métodos de pago y logos de marcas si aplica.
6. Ejecutar `python scripts/qa/qa_v450_retailux_checkout.py`.

No se requiere migración de tenants, tokens, slugs, productos o Storage.
