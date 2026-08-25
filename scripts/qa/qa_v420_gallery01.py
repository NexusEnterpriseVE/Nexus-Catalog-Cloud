#!/usr/bin/env python3
from pathlib import Path
import json,sys,re
ROOT=Path(__file__).resolve().parents[2]; fail=[]
def txt(rel):
 p=ROOT/rel
 if not p.exists(): fail.append('Falta '+rel); return ''
 return p.read_text(encoding='utf-8',errors='replace')
def need(rel,*terms):
 s=txt(rel)
 for t in terms:
  if t not in s: fail.append(f'{rel}: falta {t!r}')
 return s
pkg=json.loads(txt('package.json'))
if pkg.get('version')!='4.2.0': fail.append('package.json != 4.2.0')
need('api/health.ts',"version: '4.2.0'")
schema=need('supabase/schema.sql','gallery_urls jsonb','jsonb_build_array(image_url)')
need('supabase/migrations/v4_2_product_gallery.sql','add column if not exists gallery_urls','jsonb_build_array(image_url)')
sync=need('api/sync-product.ts','galleryImages','galleryReplace','gallery_urls','galleryCount','slice(0,5)','let total=0')
for f in ['api/catalog.ts','api/product.ts','api/sofia-catalog.ts','api/sofia-product.ts']:
 need(f,'gallery_urls')
need('server/catalog-v4.ts','gallery_urls','gallery_urls:Array.isArray(rep.gallery_urls)','gallery_urls:Array.isArray(x.gallery_urls)')
main=need('src/main.tsx','gallery_urls','galleryIndex','zoomOpen','detail-gallery','gallery-lightbox')
need('src/styles.css','.detail-gallery','.gallery-lightbox')
need('public/sw.js','cuyra-catalog-v4.2.0')
if fail:
 print('QA CUYRA CATALOG V4.2.0 GALLERY01: FAIL'); [print(' -',x) for x in fail]; sys.exit(1)
print('QA CUYRA CATALOG V4.2.0 GALLERY01: OK')
print(' - gallery_urls aditivo y backfill de image_url')
print(' - sincronización máx. 5 imágenes y portada')
print(' - storefront con miniaturas/swipe conceptual y lightbox/zoom')
print(' - API pública/Sofía conservan galería')
