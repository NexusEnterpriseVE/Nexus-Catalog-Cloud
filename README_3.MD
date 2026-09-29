# CUYRA Catalog V4.1.0 HF06 · MEDIAFIT02

Corrige el recorte residual de imágenes en cards.

## Causa
`.product-image` tenía `height:100%` y `padding`, pero sin `box-sizing:border-box`.
El padding se sumaba al 100% de altura, la caja excedía `product-media-wrap` y el `overflow:hidden` recortaba la parte inferior de productos grandes (por ejemplo balones).

## Solución
- `box-sizing:border-box` en el contenedor de imagen.
- El `<img>` usa el 100% del área útil con `object-fit:contain`.
- Zona de texto sigue completamente aislada.
- No cambia APIs, Supabase, tenants, variantes ni Serverless Functions.

## GitHub
Reemplazar solamente `src/styles.css`.
