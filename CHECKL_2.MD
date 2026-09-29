# CHECKLIST · CUYRA Catalog V4.4.0 · Vercel Preview

## 0. Antes de tocar Production
- [ ] Conservar commit/tag del V4.3.0 actualmente estable.
- [ ] No borrar variables Vercel ni secretos Supabase.
- [ ] No cambiar slug, tenant IDs, tokens `nxc_...` ni token privado de Sofía.

## 1. Base de datos
- [ ] Ejecutar `supabase/migrations/v4_4_mobilecommerce02.sql` en el Supabase oficial.
- [ ] Confirmar que el SQL termina sin error.
- [ ] No ejecutar scripts de reset ni borrar tablas/datos.

## 2. Vercel Preview
- [ ] Subir el GITHUB_REPLACE_PATCH a una rama de Preview.
- [ ] Confirmar Build = Success.
- [ ] Abrir `/api/health` y comprobar `version: 4.4.0` y `protocol: catalog-v4.4-commerce`.
- [ ] Confirmar que siguen existiendo 12 Functions del proyecto.

## 3. Home móvil
- [ ] Marca/logo del tenant sigue siendo protagonista.
- [ ] Hero carousel rota correctamente.
- [ ] Si no hay banners configurados, aparecen slides fallback sin romper diseño.
- [ ] Accesos rápidos funcionan: Categorías, Marcas, Ofertas, Pedido.
- [ ] Categorías horizontales funcionan.
- [ ] Destacados / Recomendados / Ofertas / Novedades aparecen solo cuando tienen datos y están habilitados.
- [ ] Bottom nav: Inicio, Categorías, Buscar, Ofertas, Pedido.

## 4. Catálogo
- [ ] Cards en 2 columnas en móvil.
- [ ] Fotos no se recortan.
- [ ] Precio anterior y badge/descuento solo aparecen cuando hay promoción real.
- [ ] Estrellas no muestran valores falsos: sin reseñas debe decir `Sin valoraciones todavía`.
- [ ] Filtro Ofertas funciona.
- [ ] Filtro Destacados funciona.
- [ ] Precio mínimo/máximo, categoría, subcategoría, marca y disponibilidad siguen funcionando.
- [ ] Orden Mejor calificados funciona.

## 5. Producto
- [ ] Galería y zoom.
- [ ] Variantes cambian SKU/precio/stock/imagen.
- [ ] Cantidad +/-.
- [ ] Comprar ahora abre confirmación.
- [ ] Agregar a lista no duplica líneas de forma incorrecta.
- [ ] Relacionados siguen funcionando.

## 6. Calificaciones
- [ ] Enviar valoración 1–5.
- [ ] La valoración NO aparece pública inmediatamente.
- [ ] En admin privado → Moderación de calificaciones, aparece PENDIENTE.
- [ ] Aprobarla.
- [ ] Refrescar producto: promedio, contador y comentario aparecen.
- [ ] Ocultarla y confirmar que deja de participar en el rating público.

## 7. Ofertas / merchandising
- [ ] Admin privado → Ofertas y recomendados.
- [ ] Configurar precio anterior + etiqueta + Recomendado en un producto de prueba.
- [ ] Confirmar card/ficha y sección Ofertas/Recomendados.
- [ ] Sincronizar ese producto desde un Principal que no envíe campos V4.4 y comprobar que el merchandising Cloud no se borra.

## 8. Pedido / WhatsApp
- [ ] Agregar producto simple.
- [ ] Agregar producto con variante.
- [ ] Cambiar cantidades.
- [ ] Revisar y continuar.
- [ ] Delivery / Retiro respeta la configuración del tenant.
- [ ] Continuar genera código `CY-...`.
- [ ] WhatsApp contiene código, modalidad, SKU, variante, cantidades y total.
- [ ] Cambiar precio en catálogo antes de confirmar un pedido antiguo: el backend debe usar el precio actual publicado.
- [ ] Intentar confirmar un producto agotado: debe detenerse con mensaje de stock, sin generar pedido falso.

## 9. Regresión V4.3
- [ ] Favoritos.
- [ ] Vistos recientemente.
- [ ] Compartir producto.
- [ ] Buscador predictivo.
- [ ] PWA/service worker.
- [ ] WhatsApp de consulta rápida.
- [ ] APIs privadas de Sofía.
- [ ] Sincronización CUYRA.

## 10. Production
Solo después de completar este checklist:
- [ ] Merge/replace en `main`.
- [ ] Confirmar Vercel Production = Success.
- [ ] Limpiar caché/recargar catálogo en teléfono.
