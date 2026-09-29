import { createClient } from '@supabase/supabase-js'

export function adminDb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export const storageBucket = () => process.env.CATALOG_STORAGE_BUCKET || 'catalog-products'
