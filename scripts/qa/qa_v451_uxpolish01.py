from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[2]
ORIGINAL=Path('/mnt/data/nexus_audit/Nexus-Catalog-Cloud-main')
checks=[]
def check(name, ok, detail=''):
    checks.append((name,bool(ok),detail))

def text(rel): return (ROOT/rel).read_text(encoding='utf-8')

def same(rel):
    if not ORIGINAL.exists(): return True
    return (ROOT/rel).read_bytes()==(ORIGINAL/rel).read_bytes()

pkg=text('package.json'); main=text('src/main.tsx'); css=text('src/styles.css'); cat=text('api/catalog.ts'); adm=text('api/admin-analytics.ts'); schema=text('supabase/schema.sql'); migration=text('supabase/migrations/v4_5_retailux_checkout.sql'); health=text('api/health.ts'); sw=text('public/sw.js')

check('version package 4.5.1','"version": "4.5.1"' in pkg)
check('health 4.5.1',"version: '4.5.1'" in health)
check('service worker cache 4.5.1',"cuyra-catalog-v4.5.1" in sw)
check('sync-product unchanged',same('api/sync-product.ts'))
check('sync-settings unchanged',same('api/sync-settings.ts'))
check('Sofía catalog unchanged',same('api/sofia-catalog.ts'))
check('Sofía product unchanged',same('api/sofia-product.ts'))
check('security unchanged',same('server/security.ts'))
check('supabase client unchanged',same('server/supabase.ts'))
check('vercel routes unchanged',same('vercel.json'))
check('env contract unchanged',same('.env.example'))
check('storage/idempotency sync contract','catalog_sync_receipts' in text('api/sync-product.ts') and 'source_product_id' in text('api/sync-product.ts'))
check('search overlay','search-overlay' in main and 'SearchSuggestions' in main)
check('announcement configurable','announcements' in main and 'announcements' in adm)
check('brand carousel','function BrandCarousel' in main and 'brandLogos' in adm)
check('compact categories','function CategoryRail' in main and 'category-rail-track' in css)
check('product card v3','product-card-v3' in main and 'product-card-v3' in css)
check('product detail buy now','Comprar ahora' in main and 'Agregar al carrito' in main)
check('mobile buybar polish','mobile-product-buybar' in css and 'ShoppingCart' in main and '>Comprar ahora<' in main)
check('mobile quantity restored','premium-purchase{display:block!important' in css and 'quantity-label' in css)
check('favorite stock collision fix','card-badges{right:60px!important' in css and 'detail-media-badges{right:68px!important' in css)
check('hover overlay removed','card-hover-actions{display:none!important' in css)

check('WhatsApp icon FAB','floating-wa' in main and 'WhatsAppIcon' in main)
check('checkout form','checkout-v2' in main and 'Método de pago' in main and 'Agencia / oficina de destino' in main)
check('Zoom / Tealca defaults',"id:'zoom'" in main and "id:'tealca'" in main)
check('server checkout validation',"body?.action!=='checkout'" in cat and 'stock<qty' in cat and 'priceUsd' in cat)
check('checkout does not update inventory','.update(' not in re.search(r'async function handlePOST[\s\S]*?export default',cat).group(0))
check('structured WhatsApp','*CLIENTE*' in cat and '*ENTREGA*' in cat and '*PRODUCTOS*' in cat and '*MÉTODO DE PAGO*' in cat)
check('request metadata columns','customer_json' in schema and 'fulfillment_json' in schema and 'payment_method' in schema)
check('migration additive only',all(x not in migration.lower() for x in ['drop table','drop column','truncate','delete from','alter column','rename to']))
check('legacy localStorage favorites',"storageKey('favorites'" in main)
check('legacy localStorage recent',"storageKey('recent'" in main)
check('legacy localStorage order',"storageKey('order'" in main)
check('admin checkout config','carrierZoom' in text('public/nexus-admin-tenant-7f4b2.js') and 'payPagoMovil' in text('public/nexus-admin-tenant-7f4b2.js'))

bad=[x for x in checks if not x[1]]
for name,ok,detail in checks: print(('PASS' if ok else 'FAIL'),name,detail)
print(f'\n{len(checks)-len(bad)}/{len(checks)} checks passed')
sys.exit(1 if bad else 0)
