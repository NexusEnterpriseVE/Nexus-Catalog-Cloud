import { err, json } from '../server/http.js'
import { requireSofiaTenant } from '../server/security.js'
import { buildSofiaGroups, type CatalogRow } from '../server/catalog-v4.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const ROWS=`source_product_id,source_group_id,group_code,group_name,variant_count,variant_label,variant_attributes,variant_name,sku,name,description,category,subcategory,brand,model,features,featured,price_usd,price_bs,stock_exact,availability,image_url,gallery_urls,updated_at,public_visible,published,active,sofia_visible,sofia_approved,sofia_aliases,sofia_tags,sofia_notes,sofia_price_divisas,sofia_rules_json`

async function handleGET(request:Request){
  try{
    const url=new URL(request.url),slug=(url.searchParams.get('slug')||'').trim().toLowerCase(),pid=Number(url.searchParams.get('productId')),sku=(url.searchParams.get('sku')||'').trim().slice(0,120)
    if(!SLUG.test(slug)||((!Number.isInteger(pid)||pid<=0)&&!sku))return json({ok:false,error:'Producto inválido. Usa productId o sku.'},{status:400})
    const {db,tenant}=await requireSofiaTenant(request,slug)
    let q:any=db.from('catalog_products').select(ROWS).eq('tenant_id',tenant.id).eq('active',true).eq('sofia_visible',true).eq('sofia_approved',true)
    q=sku?q.eq('sku',sku):q.eq('source_product_id',pid)
    const {data:target,error:tErr}=await q.maybeSingle();if(tErr)throw new Error(tErr.message);if(!target)return json({ok:false,error:'Producto no autorizado o no encontrado'},{status:404})
    let groupRows:CatalogRow[]=[]
    if(target.source_group_id){
      const {data,error}=await db.from('catalog_products').select(ROWS).eq('tenant_id',tenant.id).eq('source_group_id',target.source_group_id).eq('active',true).eq('sofia_visible',true).eq('sofia_approved',true)
      if(error)throw new Error(error.message);groupRows=(data||[]) as CatalogRow[]
    }else groupRows=[target as CatalogRow]
    const product=buildSofiaGroups(groupRows)[0]
    if(!product)return json({ok:false,error:'Producto no autorizado o no encontrado'},{status:404})
    return json({ok:true,tenant:{slug:tenant.slug,public_name:tenant.public_name,rate_bs_per_usd:tenant.rate_bs_per_usd,rate_source:tenant.rate_source},product,protocol:'sofia-v4-grouped'})
  }catch(e){return err(e)}
}
export default{async fetch(request:Request){if(request.method!=='GET')return json({ok:false,error:'Método no permitido'},{status:405});return await handleGET(request)}}
