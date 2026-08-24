from pathlib import Path
root=Path(__file__).resolve().parents[2]

def need(rel,*patterns):
    p=root/rel
    if not p.exists(): raise SystemExit(f'MISSING_FILE {rel}')
    txt=p.read_text(encoding='utf-8')
    for pattern in patterns:
        if pattern not in txt: raise SystemExit(f'MISSING_PATTERN {rel}: {pattern}')

def forbid(rel,*patterns):
    txt=(root/rel).read_text(encoding='utf-8')
    for pattern in patterns:
        if pattern in txt: raise SystemExit(f'FORBIDDEN_PATTERN {rel}: {pattern}')

# V4 central / security continuity
need('supabase/schema.sql','catalog_tenants','catalog_products','source_group_id','sofia_read_token_hash','enable row level security','catalog_events')
need('supabase/migrations/v4_catalogcentral_variants_sofia.sql','source_group_id','public_visible','sofia_visible','sofia_approved','sofia_rules_json')
need('server/security.ts','randomSyncToken','randomSofiaToken','requireSofiaTenant','timingSafeEqual')
need('server/catalog-v4.ts','buildPublicGroups','buildSofiaGroups','variant_count','variants')
need('api/sync-product.ts','catalogProtocol','sourceGroupId','variantLabel','variantAttributes','sofiaVisible','sofiaApproved','catalog_sync_receipts')
need('api/sync-settings.ts','catalogProtocol','variantMode')
need('api/catalog.ts','buildPublicGroups','public_visible','protocol:\'v4-grouped\'')
need('api/product.ts','buildPublicGroups','source_group_id','variants')
need('api/sofia-catalog.ts','requireSofiaTenant','sofia_visible','sofia_approved','buildSofiaGroups')
need('api/sofia-product.ts','requireSofiaTenant','sofia_visible','sofia_approved','sku')
need('api/admin-rotate-sofia-token.ts','randomSofiaToken','sofia_read_token_hash')

# CUYRA UI02 / Commerce UX
need('src/main.tsx','CUYRA Catalog','AnnouncementBar','CuyraLanding','SearchSuggestions','ProductCard','OrderDrawer','FavoritesDrawer','RecentStrip','Pedir por WhatsApp','Consultar disponibilidad','Productos relacionados','Powered by','serviceWorker')
need('src/styles.css','announcement-track','category-cards','search-suggestions','commerce-drawer','product-detail','catalog-footer','no-tenant-app','@media(max-width:560px)')
need('public/manifest.webmanifest','CUYRA Catalog','cuyra-icon-192.png')
need('public/sw.js','cuyra-catalog-v4.1.0','/api/')
need('index.html','CUYRA Catalog','manifest.webmanifest')
need('api/analytics.ts','catalog_events','whatsapp_order','favorite')
need('api/admin-analytics.ts','requireAdmin','topProducts','topSearches','topCategories')
need('api/health.ts','CUYRA Catalog Cloud','4.1.0')
need('api/manifest.ts','application/manifest+json','start_url','CUYRA')
need('public/nexus-admin-tenant-7f4b2.html','noindex,nofollow,noarchive','CUYRA Catalog Cloud','V4.1.0')
need('public/nexus-admin-tenant-7f4b2.js','admin-rotate-sofia-token','x-admin-secret','VERSION = "4.1.0"')
need('.env.example','SUPABASE_SERVICE_ROLE_KEY','NEXUS_CATALOG_ADMIN_SECRET')

# No visible old brand in public storefront/admin shell.
for rel in ['src/main.tsx','index.html','public/nexus-admin-tenant-7f4b2.html','public/nexus-admin-tenant-7f4b2.js']:
    forbid(rel,'Nexus Catalog')

forbid('server/catalog-v4.ts','service_role')
print('CLOUD_QA_STATIC_OK')
print('V4_GROUP_VARIANTS_OK')
print('SOFIA_SEPARATE_READ_TOKEN_OK')
print('CUYRA_UI02_OK')
print('COMMERCEUX01_OK')
print('CATALOGANALYTICS01_OK')
print('PWA01_OK')
print('WHITE_LABEL_TENANT_OK')
print('PUBLIC_PRIVATE_VISIBILITY_SPLIT_OK')
print('RLS_DIRECT_ACCESS_GUARD_OK')
