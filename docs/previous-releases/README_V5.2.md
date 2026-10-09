# Nexus Catalog Cloud V5.2 — Actualización integral de experiencia pública

## Base
Repositorio completo derivado de **Nexus Catalog Cloud V5.1 Admin Rediseño**. Incluye el administrador V5.1 ya mejorado y las correcciones de storefront V5.2. No se incluyen datos de producción ni credenciales.

## Cambios
- Diseño público V5.2: márgenes, tamaños, contenedores y tipografía con prioridades coherentes para PC y móvil.
- Tema claro y oscuro con contraste revisado; selector colocado en el encabezado (sin tapar el contenido). Las visitas sin preferencia guardada inician en claro.
- Ficha de producto: galería equilibrada, títulos proporcionales, precio legible, área de compra compacta y botones consistentes.
- Precio mayorista: aparece solo si precio y mínimo configurados suponen un descuento real; indica mínimo, ahorro por unidad y cuánto falta para llegar. Al alcanzar el mínimo, recalcula precio por unidad y total estimado.
- Carrito y checkout usan precios por cantidad; la API **recalcula y valida** el descuento desde Supabase y lo incluye en el mensaje de WhatsApp. Desactivarlo desde comercio desactiva el beneficio del checkout.
- Calificaciones: mejora de márgenes y textos, con estado sin valoraciones honesto en vez de un guion gigante y barras vacías.
- Tarjetas públicas: textos más legibles y precios mayoristas solo con descuento válido.
- Caché PWA y versiones actualizadas a V5.2.0. Rutas y estructura de datos multi-tenant preservadas.

## Archivos editados
- `src/main.tsx`, `src/v5-2.css` (nuevo), `src/v5.css` (se conserva), `src/styles.css` (se conserva)
- `api/catalog.ts` (precio mayorista recalculado en backend)
- `index.html`, `package.json`, `public/sw.js`
- `public/nexus-admin-tenant-7f4b2.html`, `public/nexus-admin-tenant-7f4b2.js` (versión)
- `scripts/qa/qa_v52_wholesale.cjs` (nuevo test de reglas mayoristas + checkout)

## Despliegue seguro
1. Haz una copia de seguridad de la rama `main` y de tus variables de entorno de Vercel.
2. Sube el contenido de este ZIP como raíz del repositorio o crea una rama de vista previa. No hagas merge a producción hasta comprobarla.
3. Instala dependencias: `npm install`.
4. Ejecuta: `node scripts/qa/qa_v52_wholesale.cjs` y `npm run build`.
5. Despliega preview de Vercel conectado a tus variables existentes; no se requiere migración SQL adicional.
6. Comprueba `/c/daca-sport`, `/c/daca-sport/p/<id>` con producto con mayorista y sin mayorista, reseñas vacías y con datos, móvil, temas, carrito, envío de solicitud y `/nexus-admin-tenant-7f4b2.html`.
7. Si todo pasa, promueve la rama a producción. Las solicitudes a la API recalculan los precios, por eso no confíes solo en la cifra almacenada en el navegador.

## Limitaciones de esta entrega
- No se ejecutó `npm run build` en el entorno de preparación: `npm install` falló por resolución DNS `EAI_AGAIN` hacia el registro npm. Requiere build en CI/Vercel para validar dependencias y TypeScript completo.
- Se validó sintaxis TypeScript con parser, CSS sin errores de sintaxis, reglas de precio y API usando un Supabase simulado y maquetación representativa en Chromium con 390px/1440px claro/oscuro. Eso **no equivale a una prueba con tu Supabase ni a un despliegue real**.
- Valores del ejemplo de QA (32 USD detal, 28 USD mayor, desde 4) son solo datos de prueba; los precios reales proceden de Supabase.
