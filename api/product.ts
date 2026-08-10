import { adminDb } from '../server/supabase.js'
import { err, json } from '../server/http.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
async function handleGET(request: Request){
  try{
    const url=new URL(request.url)
    const slug=(url.searchParams.get('slug')||'').trim().toLowerCase()
    const sourceProductId=Number(url.searchParams.get('productId'))
    if(!SLUG.test(slug) || !Number.isInteger(sourceProductId) || sourceProductId<=0){
      return json({ok:false,error:'Producto inválido'},{status:400})
    }
    const db=adminDb()
    const {data:tenant,error:tErr}=await db.from('catalog_tenants').select(
      'id,slug,public_name,phone,website,accent_color,show_stock_mode,hide_out_of_stock,rate_bs_per_usd,rate_source,logo_url,hero_title,hero_subtitle,announcement,catalog_theme,instagram_url,location_text'
    ).eq('slug',slug).eq('active',true).maybeSingle()
    if(tErr)throw new Error(tErr.message)
    if(!tenant)return json({ok:false,error:'Catálogo no encontrado'},{status:404})

    const {data:p,error:pErr}=await db.from('catalog_products').select(
      'source_product_id,sku,name,description,category,subcategory,brand,model,features,featured,price_usd,price_bs,stock_exact,availability,image_url,updated_at'
    ).eq('tenant_id',tenant.id).eq('source_product_id',sourceProductId).eq('published',true).eq('active',true).maybeSingle()
    if(pErr)throw new Error(pErr.message)
    if(!p)return json({ok:false,error:'Producto no encontrado'},{status:404})
    if(tenant.hide_out_of_stock && Number(p.stock_exact)<=0)return json({ok:false,error:'Producto no disponible'},{status:404})

    let relatedQuery=db.from('catalog_products').select(
      'source_product_id,sku,name,category,brand,price_usd,price_bs,stock_exact,availability,image_url'
    ).eq('tenant_id',tenant.id).eq('published',true).eq('active',true).neq('source_product_id',sourceProductId)
    if(p.category)relatedQuery=relatedQuery.eq('category',p.category)
    const {data:related,error:rErr}=await relatedQuery.order('featured',{ascending:false}).limit(8)
    if(rErr)throw new Error(rErr.message)

    const sanitize=(x:any)=>({
      ...x,
      stock_exact:tenant.show_stock_mode==='exact'?x.stock_exact:null,
      availability:tenant.show_stock_mode==='hidden'?null:x.availability
    })
    const {id,...tenantPublic}=tenant as any
    return json({ok:true,tenant:tenantPublic,product:sanitize(p),related:(related||[]).map(sanitize)})
  }catch(e){return err(e)}
}
export default{
  async fetch(request:Request){
    if(request.method!=='GET')return json({ok:false,error:'Método no permitido'},{status:405})
    return await handleGET(request)
  }
}
