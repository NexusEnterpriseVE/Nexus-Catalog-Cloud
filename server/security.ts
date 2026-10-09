import crypto from 'node:crypto'
import { adminDb } from './supabase.js'

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex')
}

export function randomSyncToken() {
  return `nxc_${crypto.randomBytes(32).toString('base64url')}`
}

export function randomSofiaToken() {
  return `nxs_${crypto.randomBytes(32).toString('base64url')}`
}

export function bearer(request: Request) {
  const h = request.headers.get('authorization') || ''
  const [kind, token] = h.split(/\s+/, 2)
  return kind?.toLowerCase() === 'bearer' && token ? token : ''
}

export async function requireTenant(request: Request) {
  const token = bearer(request)
  if (!token) throw new Response('Token de sincronización ausente', { status: 401 })
  const db = adminDb()
  const hash = sha256(token)
  const { data, error } = await db.from('catalog_tenants').select('*').eq('sync_token_hash', hash).eq('active', true).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Response('Token de sincronización inválido', { status: 401 })
  return { db, tenant: data }
}

export function requireAdmin(request: Request) {
  const expected = process.env.NEXUS_CATALOG_ADMIN_SECRET || ''
  const provided = request.headers.get('x-admin-secret') || ''
  const a=Buffer.from(provided), b=Buffer.from(expected)
  if (!expected || !provided || a.length!==b.length || !crypto.timingSafeEqual(a,b)) {
    throw new Response('No autorizado', { status: 401 })
  }
}

export async function requireSofiaTenant(request: Request, slug: string) {
  const token = bearer(request)
  if (!token) throw new Response('Token de lectura de Sofía ausente', { status: 401 })
  const db = adminDb()
  const hash = sha256(token)
  const { data, error } = await db.from('catalog_tenants').select('*').eq('slug', slug).eq('sofia_read_token_hash', hash).eq('active', true).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Response('Token de lectura de Sofía inválido', { status: 401 })
  return { db, tenant: data }
}
