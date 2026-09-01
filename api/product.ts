import { adminDb } from '../server/supabase.js'
import { err, json } from '../server/http.js'
import { buildPublicGroups, rowGroupKey, type CatalogRow } from '../server/catalog-v4.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const ROWS=`source_product_id,source_group_id,group_code,group_name,variant_count,variant_label,variant_attributes,variant_name,sku,name,description,category,subcategory,brand,model,features,featured,price_usd,price_bs,stock_exact,availability,image_url,gallery_urls,updated_at,public_visible,published,active,sofia_visible,sofia_approved,sofia_aliases,sofia_tags,sofia_notes,sofia_price_divisas,sofia_rules_json`

async function fetchPublicRows(db:any,tenantId:string,limit=6000){
  const out:CatalogRow[]=[];const batch=1000
  for(let from=0;from<limit;from+=batch){
    const {data,error}=await db.from('catalog_products').select(ROWS).eq('tenant_id',tenantId).eq('published',true).eq('public_visible',true).eq('active',true).range(from,Math.min(limit-1,from+batch-1))
    if(error)throw new Error(error.message)
    const rows=(data||[]) as CatalogRow[];out.push(...rows);if(rows.length<batch)break
  }
  return out
}

async function handleGET(request:Request){
  try{
    const url=new URL(request.url),slug=(url.searchParams.get('slug')||'').trim().toLowerCase(),sourceProductId=Number(url.searchParams.get('productId'))
    if(!SLUG.test(slug)||!Number.isInteger(sourceProductId)||sourceProductId<=0)return json({ok:false,error:'Producto inválido'},{status:400})
    const db=adminDb()
    const {data:tenant,error:tErr}=await db.from('catalog_tenants').select('id,slug,public_name,phone,website,accent_color,show_stock_mode,hide_out_of_stock,rate_bs_per_usd,rate_source,logo_url,hero_title,hero_subtitle,announcement,catalog_theme,instagram_url,location_text,show_brand_filter,show_category_nav,catalog_protocol,variant_mode').eq('slug',slug).eq('active',true).maybeSingle()
    if(tErr)throw new Error(tErr.message);if(!tenant)return json({ok:false,error:'Catálogo no encontrado'},{status:404})

    const {data:target,error:targetErr}=await db.from('catalog_products').select(ROWS).eq('tenant_id',tenant.id).eq('source_product_id',sourceProductId).eq('published',true).eq('public_visible',true).eq('active',true).maybeSingle()
    if(targetErr)throw new Error(targetErr.message);if(!target)return json({ok:false,error:'Producto no encontrado'},{status:404})

    let groupRows:CatalogRow[]=[]
    if(target.source_group_id){
      const {data,error}=await db.from('catalog_products').select(ROWS).eq('tenant_id',tenant.id).eq('source_group_id',target.source_group_id).eq('published',true).eq('public_visible',true).eq('active',true)
      if(error)throw new Error(error.message);groupRows=(data||[]) as CatalogRow[]
    }else groupRows=[target as CatalogRow]
    const product=buildPublicGroups(groupRows,tenant)[0]
    if(!product)return json({ok:false,error:'Producto no disponible'},{status:404})

    const allRows=await fetchPublicRows(db,tenant.id)
    const currentKey=rowGroupKey(target as CatalogRow)
    const related=buildPublicGroups(allRows,tenant).filter(g=>{
      const key=g.source_group_id?`g:${g.source_group_id}`:`p:${g.source_product_id}`
      return key!==currentKey&&(!product.category||g.category===product.category)
    }).sort((a,b)=>Number(b.featured)-Number(a.featured)||a.name.localeCompare(b.name,'es')).slice(0,8).map(g=>({...g,variants:undefined}))

    const {id,...tenantPublic}=tenant as any
    return json({ok:true,tenant:tenantPublic,product,related,protocol:'v4-grouped'})
  }catch(e){return err(e)}
}
export default{async fetch(request:Request){if(request.method!=='GET')return json({ok:false,error:'Método no permitido'},{status:405});return await handleGET(request)}}
