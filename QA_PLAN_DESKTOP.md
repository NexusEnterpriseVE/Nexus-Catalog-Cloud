# QA Plan · CATALOG01

## A. Desktop build
- QA estático.
- TypeScript/Vite.
- cargo test.
- Tauri NSIS.

## B. Migración DEV04 → CATALOG01
- backup DEV04;
- instalar encima;
- usuario ADMIN intacto;
- licencia intacta;
- installation_id intacto;
- datos comerciales intactos;
- columnas nuevas creadas.

## C. Cloud
- `/api/health` responde OK;
- crear tenant;
- guardar token una sola vez;
- conexión desde Nexus;
- publicar producto;
- editar producto;
- foto;
- precio USD/Bs;
- stock exact/status/hidden;
- agotado visible/oculto;
- búsqueda/categoría/paginación;
- rotar token y confirmar que el anterior falla.

## D. Offline
- desconectar Internet;
- procesar venta;
- venta/caja/stock local funcionan;
- OUTBOX queda pendiente;
- reconectar;
- sync reintenta;
- catálogo se actualiza.

## E. Stock disponible
- stock físico 10;
- reservar 3;
- catálogo debe publicar 7;
- completar/cancelar reserva y verificar nuevo disponible.

## F. Privacidad
Confirmar que el catálogo/API público no expone:
- costo;
- proveedor;
- margen;
- caja;
- deuda;
- usuarios;
- auditoría.

En modo `status`, comprobar en Network que no se entrega cantidad exacta. En `hidden`, no entregar cantidad/estado útil al navegador.

## G. Fotos
- JPEG;
- PNG;
- foto grande optimizada;
- cambio de foto;
- eliminación de foto;
- producto sin foto.

## H. Volumen
- 1.000 productos;
- cola de múltiples cambios;
- sincronización por lotes;
- búsqueda/paginación pública.
