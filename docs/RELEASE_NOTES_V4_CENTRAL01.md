# Nexus Catalog Cloud V4.0.0 · CENTRAL01

## Objetivo
Convertir Catalog Cloud en la capa central online de Nexus, con soporte nativo para grupos/variantes y una API privada separada para Sofía.

## Cambios principales
- Recepción del protocolo `catalogProtocol: v4` emitido por Nexus Enterprise Pro V3.6.
- Persistencia de `source_group_id`, código/nombre de grupo, etiqueta/atributos de variante y nombre de variante.
- Una sola tarjeta pública por grupo.
- Ficha de producto con variantes e imágenes por SKU.
- Precio/stock/SKU/imagen dinámicos según la variante elegida.
- Stock agrupado en tarjeta y stock por variante en la ficha.
- Compatibilidad hacia atrás con productos V3 sin grupo.
- `public_visible` separado de visibilidad de Sofía.
- Campos autorizados de Sofía: visible, aprobado, alias, tags, notas, precio opcional y reglas JSON.
- Endpoints privados `sofia-catalog` y `sofia-product`.
- Token de lectura de Sofía separado por tenant.
- Admin UI V4 con generación/rotación del token privado de Sofía.
- Storefront ajustado a una estructura comercial tipo e-commerce: categorías, marcas, ficha central, selector visual de variantes y CTA de WhatsApp.

## No se expone
Costos, márgenes, proveedores, caja, usuarios, credenciales, datos administrativos privados ni secretos de Supabase/Nexus.

## Compatibilidad
- Los clientes antiguos que todavía envíen payload V3 continúan como productos simples.
- `catalog_products` mantiene `unique(tenant_id, source_product_id)` para conservar idempotencia y actualización por SKU fuente.
- La migración no elimina tablas ni columnas V3.
