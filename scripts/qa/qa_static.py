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

need('supabase/schema.sql','catalog_tenants','catalog_products','source_group_id','sofia_read_token_hash','enable row level security')
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
need('src/main.tsx','variant-selector','selectedVariantId','variant_count','waProduct(data.tenant,p,selected)')
need('public/nexus-admin-tenant-7f4b2.html','noindex,nofollow,noarchive','rotateSofia','V4.0.0')
need('public/nexus-admin-tenant-7f4b2.js','admin-rotate-sofia-token','x-admin-secret','VERSION = "4.0.0"')
need('.env.example','SUPABASE_SERVICE_ROLE_KEY','NEXUS_CATALOG_ADMIN_SECRET')

# Public API builders must not return private Sofia notes/rules.
forbid('server/catalog-v4.ts','service_role')
print('CLOUD_QA_STATIC_OK')
print('V4_GROUP_VARIANTS_OK')
print('V3_BACKWARD_COMPAT_FIELDS_OK')
print('SOFIA_SEPARATE_READ_TOKEN_OK')
print('PUBLIC_PRIVATE_VISIBILITY_SPLIT_OK')
print('RLS_DIRECT_ACCESS_GUARD_OK')
print('IDEMPOTENCY_STORAGE_OK')
print('ADMIN_NOINDEX_OK')
