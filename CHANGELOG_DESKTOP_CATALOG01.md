# Changelog · Nexus Enterprise Pro v0.2.0 CATALOG01

## Añadido
- Nexus Catalog Cloud real (Fase 1).
- URL API + slug + token por tenant.
- Probar conexión.
- Publicación individual/masiva.
- Nombre/descripción/categoría/precio público por producto.
- Stock disponible cloud.
- Modos exact/status/hidden.
- Ocultar agotados.
- OUTBOX con reintentos.
- Recuperación de sincronización interrumpida.
- Idempotencia cloud.
- Sincronización automática global mientras la sesión está abierta.
- Optimización/hash de imágenes.
- Estado por producto: local/pendiente/sincronizado/error.
- URL pública del catálogo.

## Eventos conectados
- producto creado/editado;
- foto;
- stock;
- ventas/compras/reversos que cambian inventario;
- tasas;
- perfil de empresa;
- configuración cloud.

## Seguridad
- Service Role no se expone al desktop.
- token independiente por tenant;
- hash del token en cloud;
- RLS habilitado;
- tablas sin permisos directos para `anon`/`authenticated`;
- el navegador consume la Function pública, no las tablas Supabase.

## No incluido todavía
- pedidos online/checkout;
- pagos online;
- Nexus LAN / Multi-PC.
