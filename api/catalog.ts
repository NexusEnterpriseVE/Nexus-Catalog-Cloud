import { adminDb } from '../server/supabase.js'
import { err, json } from '../server/http.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
function posInt(value:string|null,fallback:number){const n=Number(value);return Number.isFinite(n)&&n>=1?Math.trunc(n):fallback}
async function handleGET(request: Request) {
  try {
    const url = new URL(request.url)
    const slug = (url.searchParams.get('slug') || '').trim().toLowerCase()
    const q = (url.searchParams.get('q') || '').trim().slice(0,80).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ \-]/g,'')
    const category = (url.searchParams.get('category') || '').trim().slice(0,180)
    const page = posInt(url.searchParams.get('page'),1)
    const limit = Math.min(60,posInt(url.searchParams.get('limit'),24))
    if (!SLUG.test(slug)) return json({ok:false,error:'slug inválido'},{status:400})
    const db = adminDb()
    const { data:tenant,error:tErr } = await db.from('catalog_tenants').select('id,slug,public_name,phone,website,accent_color,show_stock_mode,hide_out_of_stock,rate_bs_per_usd,rate_source,updated_at').eq('slug',slug).eq('active',true).maybeSingle()
    if (tErr) throw new Error(tErr.message)
    if (!tenant) return json({ok:false,error:'Catálogo no encontrado'},{status:404})
    let query = db.from('catalog_products').select('source_product_id,sku,name,description,category,subcategory,price_usd,price_bs,stock_exact,availability,image_url,updated_at',{count:'exact'})
      .eq('tenant_id',tenant.id).eq('published',true).eq('active',true)
    if (tenant.hide_out_of_stock) query = query.gt('stock_exact',0)
    if (category) query = query.eq('category',category)
    if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,description.ilike.%${q}%`)
    const from=(page-1)*limit,to=from+limit-1
    const {data:rows,error:pErr,count}=await query.order('name',{ascending:true}).range(from,to)
    if(pErr)throw new Error(pErr.message)
    const products=(rows||[]).map((p:any)=>({
      ...p,
      stock_exact:tenant.show_stock_mode==='exact'?p.stock_exact:null,
      availability:tenant.show_stock_mode==='hidden'?null:p.availability
    }))
    const {data:catRows,error:cErr}=await db.from('catalog_products').select('category').eq('tenant_id',tenant.id).eq('published',true).eq('active',true).limit(2000)
    if(cErr)throw new Error(cErr.message)
    const categories=[...new Set((catRows||[]).map(x=>x.category).filter(Boolean))].sort()
    const {id,...tenantPublic}=tenant as any
    return json({ok:true,tenant:tenantPublic,products,categories,page,limit,total:count||0,pages:Math.max(1,Math.ceil((count||0)/limit))})
  }catch(e){return err(e)}
}


export default {
  async fetch(request: Request) {
    if (request.method !== 'GET') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return await handleGET(request)
  }
}
