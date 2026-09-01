# Checklist Preview · CUYRA Catalog V4.3.0 MOBILECOMMERCE01

1. Crear rama/Preview desde el deployment estable actual.
2. Subir el patch o FULL SOURCE V4.3.0.
3. **No ejecutar ninguna migración SQL nueva** por este bloque.
4. Confirmar que Vercel termina el build sin error.
5. Abrir `/api/health` y confirmar `4.3.0`.
6. Abrir `/c/daca-sport` u otro tenant real desde teléfono.
7. Confirmar logo, nombre, color y contacto correctos del tenant.
8. Probar menú, favoritos y pedido en el header.
9. Probar accesos rápidos: Categorías, Marcas, Destacados, Pedido.
10. Probar rail horizontal de categorías.
11. Probar buscador predictivo.
12. Abrir Filtros y validar categoría/subcategoría/marca.
13. Validar rango de precio.
14. Activar Destacados y Solo disponibles.
15. Confirmar que `Ver N productos` refleja el total filtrado y cierra el sheet.
16. Confirmar catálogo de 2 columnas y quick-add en productos sin variantes.
17. Producto con variantes: quick-add debe llevar a la ficha para elegir variante.
18. Abrir ficha de producto y confirmar galería completa, variante, precio, stock y WhatsApp.
19. Agregar varios productos y confirmar contador de Pedido.
20. Confirmar navegación inferior: Inicio, Categorías, Buscar, Destacados, Pedido.
21. Revisar desktop para confirmar que el rediseño móvil no deformó la experiencia de escritorio.
22. Solo entonces merge/deploy a Production.
