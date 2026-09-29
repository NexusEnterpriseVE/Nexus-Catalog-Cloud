import { adminDb } from '../server/supabase.js'
import { bodyJson, err, json } from '../server/http.js'
import { randomSyncToken, requireAdmin, sha256 } from '../server/security.js'

type Input = { slug: string; publicName: string; phone?: string; website?: string; accentColor?: string }
const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const ACCENT=/^#[0-9a-fA-F]{6}$/

async function handlePOST(request: Request) {
  try {
    requireAdmin(request)
    const input = await bodyJson<Input>(request)
    const slug = (input.slug || '').trim().toLowerCase()
    const publicName = (input.publicName || '').trim()
    if (!SLUG.test(slug)) return json({ ok: false, error: 'Slug inválido. Usa 3–64 caracteres: letras minúsculas, números y guiones; sin guion al inicio/final.' }, { status: 400 })
    if (!publicName || publicName.length > 120) return json({ ok: false, error: 'Nombre público requerido (máx. 120 caracteres).' }, { status: 400 })
    const accent=(input.accentColor || '#2563EB').trim()
    if(!ACCENT.test(accent)) return json({ok:false,error:'Color de acento inválido.'},{status:400})
    const token = randomSyncToken()
    const db = adminDb()
    const { data, error } = await db.from('catalog_tenants').insert({
      slug,
      public_name: publicName,
      phone: (input.phone || '').trim().slice(0,40),
      website: (input.website || '').trim().slice(0,300),
      accent_color: accent,
      sync_token_hash: sha256(token),
      active: true
    }).select('id,slug,public_name').single()
    if (error) return json({ ok: false, error: error.message }, { status: 400 })
    return json({ ok: true, tenant: data, syncToken: token, warning: 'Guarda el token ahora. No vuelve a mostrarse.' }, { status: 201 })
  } catch (e) { return err(e) }
}


export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return await handlePOST(request)
  }
}
