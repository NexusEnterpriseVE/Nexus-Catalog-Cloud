import { adminDb } from '../server/supabase.js'
import { err, json } from '../server/http.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
function posInt(value:string|null,fallback:number){const n=Number(value);return Number.isFinite(n)&&n>=1?Math.trunc(n):fallback}
function clean(v:string|null,max=180){return (v||'').trim().slice(0,max)}
function num(v:string|null){
  if(v===null || v.trim()==='') return null
  const n=Number(v)
  return Number.isFinite(n)?n:null
}

async function handleGET(request: Request) {
  try {
    const url = new URL(request.url)
    const slug = clean(url.searchParams.get('slug'),64).toLowerCase()
    const q = clean(url.searchParams.get('q'),80).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ ._\-]/g,'')
    const category = clean(url.searchParams.get('category'))
    const subcategory = clean(url.searchParams.get('subcategory'))
    const brand = clean(url.searchParams.get('brand'))
    const availability = clean(url.searchParams.get('availability'),30)
    const sort = clean(url.searchParams.get('sort'),30) || 'featured'
    const minPrice = num(url.searchParams.get('minPrice'))
    const maxPrice = num(url.searchParams.get('maxPrice'))
    const page = posInt(url.searchParams.get('page'),1)
    const limit = Math.min(60,posInt(url.searchParams.get('limit'),24))
    if (!SLUG.test(slug)) return json({ok:false,error:'slug inválido'},{status:400})

    const db = adminDb()
    const { data:tenant,error:tErr } = await db.from('catalog_tenants').select(
      'id,slug,public_name,phone,website,accent_color,show_stock_mode,hide_out_of_stock,rate_bs_per_usd,rate_source,updated_at,logo_url,hero_title,hero_subtitle,announcement,catalog_theme,show_brand_filter,show_category_nav,instagram_url,location_text'
    ).eq('slug',slug).eq('active',true).maybeSingle()
    if (tErr) throw new Error(tErr.message)
    if (!tenant) return json({ok:false,error:'Catálogo no encontrado'},{status:404})

    let query = db.from('catalog_products').select(
      'source_product_id,sku,name,description,category,subcategory,brand,model,features,featured,price_usd,price_bs,stock_exact,availability,image_url,updated_at',
      {count:'exact'}
    ).eq('tenant_id',tenant.id).eq('published',true).eq('active',true)

    if (tenant.hide_out_of_stock) query = query.gt('stock_exact',0)
    if (category) query = query.eq('category',category)
    if (subcategory) query = query.eq('subcategory',subcategory)
    if (brand) query = query.eq('brand',brand)
    if (availability==='available') query = query.gt('stock_exact',0)
    if (availability==='out') query = query.eq('stock_exact',0)
    if (minPrice!==null && minPrice>=0) query = query.gte('price_usd',minPrice)
    if (maxPrice!==null && maxPrice>=0) query = query.lte('price_usd',maxPrice)
    if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`)

    if(sort==='price_asc') query=query.order('price_usd',{ascending:true})
    else if(sort==='price_desc') query=query.order('price_usd',{ascending:false})
    else if(sort==='newest') query=query.order('updated_at',{ascending:false})
    else if(sort==='name') query=query.order('name',{ascending:true})
    else query=query.order('featured',{ascending:false}).order('name',{ascending:true})

    const from=(page-1)*limit,to=from+limit-1
    const {data:rows,error:pErr,count}=await query.range(from,to)
    if(pErr)throw new Error(pErr.message)

    const products=(rows||[]).map((p:any)=>({
      ...p,
      stock_exact:tenant.show_stock_mode==='exact'?p.stock_exact:null,
      availability:tenant.show_stock_mode==='hidden'?null:p.availability
    }))

    let facetQuery=db.from('catalog_products')
      .select('category,subcategory,brand,price_usd')
      .eq('tenant_id',tenant.id).eq('published',true).eq('active',true)
    if(tenant.hide_out_of_stock) facetQuery=facetQuery.gt('stock_exact',0)
    const {data:facetRows,error:fErr}=await facetQuery.limit(5000)
    if(fErr)throw new Error(fErr.message)
    const categories=[...new Set((facetRows||[]).map((x:any)=>x.category).filter(Boolean))].sort()
    const subcategories=[...new Set((facetRows||[]).map((x:any)=>x.subcategory).filter(Boolean))].sort()
    const brands=[...new Set((facetRows||[]).map((x:any)=>x.brand).filter(Boolean))].sort()
    const prices=(facetRows||[]).map((x:any)=>Number(x.price_usd)||0)
    const priceRange={min:prices.length?Math.min(...prices):0,max:prices.length?Math.max(...prices):0}

    const {id,...tenantPublic}=tenant as any
    return json({
      ok:true,tenant:tenantPublic,products,
      facets:{categories,subcategories,brands,priceRange},
      page,limit,total:count||0,pages:Math.max(1,Math.ceil((count||0)/limit))
    })
  }catch(e){return err(e)}
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'GET') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return await handleGET(request)
  }
}
