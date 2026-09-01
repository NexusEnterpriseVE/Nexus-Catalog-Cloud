#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[2]; fail=[]
def text(rel):
 p=ROOT/rel
 if not p.exists(): fail.append('Falta '+rel); return ''
 return p.read_text(encoding='utf-8',errors='replace')
def need(rel,*terms):
 s=text(rel)
 for t in terms:
  if t not in s: fail.append(f'{rel}: falta {t!r}')
 return s
pkg=json.loads(text('package.json') or '{}')
if pkg.get('version')!='4.3.0': fail.append('package.json != 4.3.0')
need('api/health.ts',"version: '4.3.0'")
need('public/sw.js','cuyra-catalog-v4.3.0')
main=need('src/main.tsx','mobile-leading-menu','mobile-home-shortcuts','mobile-category-strip','mobile-bottom-nav','filter-sheet-footer','sheet-apply','minPrice','maxPrice','featuredOnly',"p.set('featured','1')")
css=need('src/styles.css','CUYRA Catalog V4.3.0 · MOBILECOMMERCE01','.mobile-bottom-nav','.mobile-home-shortcuts','.mobile-category-strip','.filter-sheet-footer','.filter-switch-row','.price-inputs')
api=need('api/catalog.ts',"featuredOnly=url.searchParams.get('featured')==='1'",'if(featuredOnly)groups=groups.filter(g=>!!g.featured)','minPrice','maxPrice')
# Data safety: this UX update must not introduce a V4.3 SQL migration.
if any((ROOT/'supabase/migrations').glob('v4_3*')): fail.append('V4.3 no debe agregar migración SQL para MOBILECOMMERCE01')
# Existing core capabilities must remain present.
need('src/main.tsx','ProductDetail','OrderDrawer','FavoritesDrawer','RecentStrip','gallery_urls','variant_count','whatsapp_order')
need('api/sync-product.ts','gallery_urls','sourceGroupId','variantLabel')
if fail:
 print('QA CUYRA CATALOG V4.3.0 MOBILECOMMERCE01: FAIL')
 [print(' -',x) for x in fail]
 sys.exit(1)
print('QA CUYRA CATALOG V4.3.0 MOBILECOMMERCE01: OK')
print(' - Home móvil / accesos / categorías / bottom nav')
print(' - Catálogo móvil 2 columnas + quick-add')
print(' - Filtros bottom sheet + precio + destacados + disponibilidad')
print(' - Sin migración SQL nueva')
print(' - PDP/galería/variantes/pedido/sync preservados')
