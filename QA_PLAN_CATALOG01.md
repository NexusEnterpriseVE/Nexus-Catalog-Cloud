# QA · Nexus Catalog Cloud CATALOG01

## Estructura
Ejecutar:
`python scripts/qa/qa_static.py`

## Deploy
- health OK;
- schema ejecutado;
- bucket accesible para lectura pública de imágenes;
- Service Role solo en Vercel;
- admin secret solo en env.

## Tenant
- slug válido;
- crear tenant;
- token mostrado una vez;
- token incorrecto 401;
- rotar token;
- token anterior 401.

## Productos
- crear/publicar;
- editar;
- despublicar;
- foto JPEG/PNG;
- cambio/eliminación de foto;
- USD/Bs;
- disponibilidad;
- agotado.

## Privacidad stock
- exact: cantidad visible;
- status: cantidad exacta no viaja al navegador;
- hidden: cantidad/estado no viajan de forma útil al navegador.

## Offline / idempotencia
- venta sin Internet sigue funcionando local;
- OUTBOX pendiente;
- reintento;
- doble envío de la misma idempotencyKey no duplica producto.

## Multi-tenant
Crear tenant A y B y confirmar que:
- A no recibe productos B;
- B no recibe productos A;
- cada token solo escribe en su tenant.
