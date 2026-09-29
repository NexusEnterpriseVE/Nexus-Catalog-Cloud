from pathlib import Path
import json,re,subprocess,sys
root=Path(__file__).resolve().parents[2]
fail=[];ok=[]
def need(rel,*terms):
    p=root/rel
    if not p.exists(): fail.append(f'{rel}: archivo ausente'); return ''
    s=p.read_text(encoding='utf-8')
    for t in terms:
        if t not in s: fail.append(f'{rel}: falta {t!r}')
    return s
try:
    pkg=json.loads((root/'package.json').read_text(encoding='utf-8'))
    (ok if pkg.get('version')=='4.4.0' else fail).append('package 4.4.0' if pkg.get('version')=='4.4.0' else 'package.json version != 4.4.0')
except Exception as e: fail.append(f'package.json inválido: {e}')
main=need('src/main.tsx','StoreHeroCarousel','ReviewSection','CheckoutConfirmation','recommendedHome','offerHome','promoOnly','Sin conexión','confirmedItems')
# Regression V4.3 / V4.2 / V4 central
need('src/main.tsx','mobile-leading-menu','mobile-home-shortcuts','mobile-category-strip','mobile-bottom-nav','filter-sheet-footer','sheet-apply','ProductDetail','OrderDrawer','FavoritesDrawer','RecentStrip','gallery_urls','variant_count','whatsapp_order','SearchSuggestions','Productos relacionados','serviceWorker')
need('src/styles.css','.mobile-bottom-nav','.mobile-home-shortcuts','.mobile-category-strip','.filter-sheet-footer','.filter-switch-row','.price-inputs','product-detail','catalog-footer','@media(max-width:560px)')
need('server/catalog-v4.ts','buildPublicGroups','buildSofiaGroups','variant_count','variants','source_group_id')
need('api/sync-product.ts','gallery_urls','sourceGroupId','variantLabel','catalog_sync_receipts')
need('api/sofia-catalog.ts','requireSofiaTenant','sofia_visible','sofia_approved','buildSofiaGroups')
need('api/sofia-product.ts','requireSofiaTenant','sofia_visible','sofia_approved','sku')
need('server/security.ts','randomSyncToken','randomSofiaToken','requireSofiaTenant','timingSafeEqual')
need('public/manifest.webmanifest','CUYRA Catalog','cuyra-icon-192.png')
need('.env.example','SUPABASE_SERVICE_ROLE_KEY','NEXUS_CATALOG_ADMIN_SECRET')
api=need('api/catalog.ts','catalog_whatsapp_requests','requestCode','CY-','promoOnly','canonical','stock_exact','deliveryEnabled')
prod=need('api/product.ts','catalog_product_reviews',".eq('approved',true)",'fingerprint_hash')
admin=need('api/admin-analytics.ts','review_status','storefront_config','product_merchandising',"mode==='merchandising'")
sync=need('api/sync-product.ts','p.recommended!==undefined','p.promoBadge!==undefined','p.compareAtPriceUsd!==undefined')
need('api/sync-settings.ts','banners_json','commerce_settings_json','home_sections_json','offers')
need('public/nexus-admin-tenant-7f4b2.html','Vitrina comercial V4.4','Ofertas y recomendados','Moderación de calificaciones')
need('public/nexus-admin-tenant-7f4b2.js','loadMerchandisingBtn','selectedHomeSections','escapeHtml')
sql=need('supabase/migrations/v4_4_mobilecommerce02.sql','catalog_product_reviews','catalog_whatsapp_requests','banners_json','compare_at_price_usd')
if sql and re.search(r'\b(drop|truncate)\b|delete\s+from|rename\s+column|alter\s+table[^;]*\bdrop\b',sql,re.I|re.S): fail.append('migración contiene SQL destructivo')
else: ok.append('migración aditiva')
api_count=len(list((root/'api').glob('*.ts')))
if api_count!=12: fail.append(f'conteo Serverless esperado 12, encontrado {api_count}')
else: ok.append('12 Serverless preservadas')
if '.from(\'catalog_products\').update' in api or '.from("catalog_products").update' in api: fail.append('checkout modifica catalog_products')
else: ok.append('checkout no mueve inventario')
if 'recommended:!!p.recommended' in sync or 'promo_badge:txt(p.promoBadge,60)' in sync: fail.append('sync antiguo podría pisar merchandising')
else: ok.append('compatibilidad con Principal anterior preservada')

combo_scan=[]
for rel in ['api/catalog.ts','api/admin-analytics.ts','api/sync-settings.ts','supabase/migrations/v4_4_mobilecommerce02.sql','supabase/schema.sql','src/main.tsx','public/nexus-admin-tenant-7f4b2.js','public/nexus-admin-tenant-7f4b2.html']:
    txt=(root/rel).read_text(encoding='utf-8')
    if re.search(r'\bcombo(?:s|Id|_json)?\b',txt,re.I): combo_scan.append(rel)
if combo_scan: fail.append('Combos fuera de alcance detectados en: '+', '.join(combo_scan))
else: ok.append('sin módulo Combos')

if re.search(r'rating_value\s*:\s*[1-5](?:\.\d+)?',main+api+prod): fail.append('rating comercial hardcodeado detectado')
else: ok.append('sin ratings falsos hardcodeados')
try:
    r=subprocess.run(['node','--check',str(root/'public/nexus-admin-tenant-7f4b2.js')],capture_output=True,text=True)
    if r.returncode: fail.append('admin JS syntax: '+r.stderr.strip())
    else: ok.append('admin JS syntax OK')
except FileNotFoundError: ok.append('node no disponible: syntax JS omitida')
for jf in ['package.json','vercel.json']:
    try: json.loads((root/jf).read_text(encoding='utf-8'))
    except Exception as e: fail.append(f'{jf} inválido: {e}')
for p in root.rglob('*'):
    if p.is_file() and p.suffix.lower() in {'.ts','.tsx','.js','.json','.sql','.md','.html','.css','.txt'}:
        try:
            t=p.read_text(encoding='utf-8')
            if '<<<<<<<' in t or '>>>>>>>' in t: fail.append(f'merge marker en {p.relative_to(root)}')
        except UnicodeDecodeError: pass
print('QA CUYRA CATALOG V4.4.0:', 'PASS' if not fail else 'FAIL')
for x in ok: print(' +',x)
for x in fail: print(' -',x)
sys.exit(1 if fail else 0)
