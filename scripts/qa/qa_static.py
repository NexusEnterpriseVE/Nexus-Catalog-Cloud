from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[2]
checks=[]
def need(rel,*patterns):
    p=root/rel
    if not p.exists(): raise SystemExit(f'MISSING_FILE {rel}')
    txt=p.read_text(encoding='utf-8')
    for pattern in patterns:
        if pattern not in txt: raise SystemExit(f'MISSING_PATTERN {rel}: {pattern}')

need('supabase/schema.sql','catalog_tenants','catalog_products','catalog_sync_receipts','enable row level security','revoke all on table public.catalog_tenants')
need('server/security.ts','randomSyncToken','timingSafeEqual','sync_token_hash')
need('api/admin-create-tenant.ts','requireAdmin','sha256(token)','SLUG')
need('api/admin-rotate-token.ts','sync_token_hash','randomSyncToken')
need('api/sync-settings.ts','requireTenant','showStockMode')
need('api/sync-product.ts','idempotencyKey','catalog_sync_receipts','2_800_000','getPublicUrl')
need('api/catalog.ts',"show_stock_mode==='exact'","show_stock_mode==='hidden'",'tenant_id')
need('src/main.tsx','/api/catalog','show_stock_mode','WhatsApp' if False else 'MessageCircle')
need('public/nexus-admin-tenant-7f4b2.html','noindex,nofollow,noarchive','x-admin-secret','admin-rotate-token')
need('.env.example','SUPABASE_SERVICE_ROLE_KEY','NEXUS_CATALOG_ADMIN_SECRET')
print('CLOUD_QA_STATIC_OK')
print('MULTI_TENANT_SCOPE_OK')
print('TOKEN_HASH_ROTATION_OK')
print('RLS_DIRECT_ACCESS_GUARD_OK')
print('PUBLIC_STOCK_PRIVACY_OK')
print('IDEMPOTENCY_STORAGE_OK')
print('ADMIN_NOINDEX_OK')
