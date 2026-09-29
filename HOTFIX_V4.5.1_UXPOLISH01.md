# Nexus Catalog Cloud V3.0.1 — Product Query Hotfix

## Corregido

### 1. Productos invisibles aunque estaban sincronizados
`URLSearchParams.get('minPrice')` y `get('maxPrice')` devuelven `null`
cuando esos filtros no se envían.

La función anterior hacía:

```ts
Number(null) === 0
```

por lo que el catálogo aplicaba accidentalmente:

- `price_usd >= 0`
- `price_usd <= 0`

Esto excluía todos los productos con precio mayor a cero.

Ahora los parámetros ausentes retornan `null` y no generan filtros de precio.

### 2. Categorías/marcas fantasma
Cuando `hide_out_of_stock = true`, los facets ahora también excluyen productos
agotados, igual que la lista principal.

## No requiere
- recompilar Nexus Enterprise Pro;
- modificar Supabase;
- cambiar tenant;
- cambiar token;
- volver a publicar productos.

Solo desplegar este Cloud V3.0.1 en Vercel.
