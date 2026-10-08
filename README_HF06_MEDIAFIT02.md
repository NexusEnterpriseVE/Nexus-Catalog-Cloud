# CUYRA Catalog V4.1.0 HF03 · MOBILEUX01 + WAFIX01

Hotfix acumulativo sobre HF02 CARDFIX01.

## Corrige
- WhatsApp en teléfonos venezolanos guardados como `04XX...`: los convierte a formato internacional `58...` antes de abrir `wa.me`.
- Vista de producto móvil dedicada, sin contenedores rígidos de escritorio.
- Soporte de `safe-area` para iPhone.
- Header móvil más compacto.
- Menús, filtros, favoritos y lista como bottom sheets.
- Dock inferior móvil de compra con `Lista` + `Pedir por WhatsApp`.
- Oculta los botones flotantes que tapaban contenido dentro de la ficha móvil.
- Cards del catálogo a una columna en teléfonos para evitar diseño comprimido y variantes torcidas.
- Responsive de precio, SKU, variantes, compra asistida, acordeones y relacionados.

## GitHub
Este hotfix NO modifica `api/`, `server/` ni `supabase/`.
Solo reemplaza:
1. `src/main.tsx`
2. `src/styles.css`
3. `index.html`

El conteo de funciones Serverless permanece en 12.
