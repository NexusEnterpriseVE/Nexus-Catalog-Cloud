import { err, json } from '../server/http.js'
import { requireSofiaTenant } from '../server/security.js'
import { buildSofiaGroups, type CatalogRow } from '../server/catalog-v4.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const ROWS=`source_product_id,source_group_id,group_code,group_name,variant_count,variant_label,variant_attributes,variant_name,sku,name,description,category,subcategory,brand,model,features,featured,price_usd,price_bs,stock_exact,availability,image_url,updated_at,public_visible,published,active,sofia_visible,sofia_approved,sofia_aliases,sofia_tags,sofia_notes,sofia_price_divisas,sofia_rules_json`
function clean(v:string|null,max=180){return(v||'').trim().slice(0,max)}
function pos(v:string|null,f=20){const n=Number(v);return Number.isFinite(n)&&n>=1?Math.trunc(n):f}
function norm(v:unknown){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}

async function rows(db:any,tenantId:string){
  const out:CatalogRow[]=[];const batch=1000,max=10000
  for(let from=0;from<max;from+=batch){
    const {data,error}=await db.from('catalog_products').select(ROWS).eq('tenant_id',tenantId).eq('active',true).eq('sofia_visible',true).eq('sofia_approved',true).range(from,from+batch-1)
    if(error)throw new Error(error.message);const part=(data||[]) as CatalogRow[];out.push(...part);if(part.length<batch)break
  }
  return out
}

async function handleGET(request:Request){
  try{
    const url=new URL(request.url),slug=clean(url.searchParams.get('slug'),64).toLowerCase(),q=clean(url.searchParams.get('q'),120),category=clean(url.searchParams.get('category')),brand=clean(url.searchParams.get('brand')),availability=clean(url.searchParams.get('availability'),20)
    const limit=Math.min(100,pos(url.searchParams.get('limit'),20)),page=pos(url.searchParams.get('page'),1)
    if(!SLUG.test(slug))return json({ok:false,error:'slug inválido'},{status:400})
    const {db,tenant}=await requireSofiaTenant(request,slug)
    let groups=buildSofiaGroups(await rows(db,tenant.id))
    if(q){const needle=norm(q);groups=groups.filter((g:any)=>norm(`${g.name} ${g.description} ${g.brand} ${g.model} ${g.category} ${g.aliases} ${g.tags} ${g.notes} ${g.variants.map((v:any)=>`${v.sku} ${v.label} ${v.name} ${Object.values(v.attributes||{}).join(' ')}`).join(' ')}`).includes(needle))}
    if(category)groups=groups.filter((g:any)=>g.category===category)
    if(brand)groups=groups.filter((g:any)=>g.brand===brand)
    if(availability==='available')groups=groups.filter((g:any)=>g.stock_exact>0)
    if(availability==='out')groups=groups.filter((g:any)=>g.stock_exact<=0)
    groups.sort((a:any,b:any)=>Number(b.stock_exact>0)-Number(a.stock_exact>0)||a.name.localeCompare(b.name,'es'))
    const total=groups.length,pages=Math.max(1,Math.ceil(total/limit)),safePage=Math.min(page,pages),from=(safePage-1)*limit
    return json({ok:true,tenant:{slug:tenant.slug,public_name:tenant.public_name,rate_bs_per_usd:tenant.rate_bs_per_usd,rate_source:tenant.rate_source},products:groups.slice(from,from+limit),page:safePage,limit,total,pages,protocol:'sofia-v4-grouped'})
  }catch(e){return err(e)}
}
export default{async fetch(request:Request){if(request.method!=='GET')return json({ok:false,error:'Método no permitido'},{status:405});return await handleGET(request)}}
