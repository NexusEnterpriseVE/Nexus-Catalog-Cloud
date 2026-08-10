import { bodyJson, err, json } from '../server/http.js'
import { requireTenant } from '../server/security.js'

type Input = {
  publicName: string; showStockMode: 'exact'|'status'|'hidden'; hideOutOfStock: boolean;
  phone?: string; website?: string; accentColor?: string; rateBsPerUsd?: number; rateSource?: string
}
const ACCENT=/^#[0-9a-fA-F]{6}$/
async function handlePOST(request: Request) {
  try {
    const { db, tenant } = await requireTenant(request)
    const input = await bodyJson<Input>(request)
    if (!['exact','status','hidden'].includes(input.showStockMode)) return json({ ok:false,error:'Modo de stock inválido' }, {status:400})
    const publicName=(input.publicName || tenant.public_name).trim()
    if(!publicName || publicName.length>120)return json({ok:false,error:'Nombre público inválido'},{status:400})
    const accent=(input.accentColor || '#2563EB').trim()
    if(!ACCENT.test(accent))return json({ok:false,error:'Color de acento inválido'},{status:400})
    const rate=Number(input.rateBsPerUsd || 0)
    if(!Number.isFinite(rate)||rate<0)return json({ok:false,error:'Tasa inválida'},{status:400})
    const { error } = await db.from('catalog_tenants').update({
      public_name: publicName,
      show_stock_mode: input.showStockMode,
      hide_out_of_stock: !!input.hideOutOfStock,
      phone: (input.phone || '').trim().slice(0,40),
      website: (input.website || '').trim().slice(0,300),
      accent_color: accent,
      rate_bs_per_usd: rate,
      rate_source: (input.rateSource || 'BCV').trim().slice(0,30),
      updated_at: new Date().toISOString()
    }).eq('id', tenant.id)
    if (error) throw new Error(error.message)
    return json({ ok:true })
  } catch(e) { return err(e) }
}


export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return await handlePOST(request)
  }
}
