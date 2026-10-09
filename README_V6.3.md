# Nexus Catalog Cloud V6.3 — Mobile Comfort / Wholesale

Actualización del repositorio completo V6.2.

## Cambios
- Experiencia móvil compacta: hero, catálogo, imágenes, ficha, controles, reseñas y checkout.
- Precio mayorista siempre identificado con el mínimo **Desde N unidades** cuando existe un precio mayor válido y está habilitado para la empresa.
- La lista muestra la variante usada para calcular el ahorro cuando el producto contiene variantes. No mezcla el precio retail de una variante con el descuento de otra.
- Ficha de producto: acceso a beneficios mayoristas debajo del precio, tarjeta con cálculo dinámico y botón para seleccionar cantidad mínima.
- Barra inferior móvil muestra el mínimo mayorista.
- Conserva las API, reglas de pedido y configuración multiempresa originales.

## Importante
Los precios mayoristas se muestran únicamente cuando los datos de la variante tienen precio mayor positivo inferior al detal y una cantidad mínima de al menos 2 unidades. Si la empresa ha desactivado «Mostrar bloque de precio mayorista» en Vitrina Comercial, debe activarlo en el administrador. Los precios deben configurarse en Productos y ofertas; la interfaz no inventa descuentos.

Instalación: `npm install`, `npm run build`; Vercel compila el proyecto automáticamente desde GitHub. Verifica la URL de Preview antes del despliegue en producción.
