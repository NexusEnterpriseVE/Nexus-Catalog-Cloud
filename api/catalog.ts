import { adminDb } from '../server/supabase.js'
import { err, json } from '../server/http.js'
import { buildPublicGroups, groupMatchesPrice, type CatalogRow, type PublicGroup } from '../server/catalog-v4.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const ROWS=`source_product_id,source_group_id,group_code,group_name,variant_count,variant_label,variant_attributes,variant_name,sku,name,description,category,subcategory,brand,model,features,featured,price_usd,price_bs,stock_exact,availability,image_url,gallery_urls,updated_at,public_visible,published,active,sofia_visible,sofia_approved,sofia_aliases,sofia_tags,sofia_notes,sofia_price_divisas,sofia_rules_json`
function posInt(v:string|null,fallback:number){const n=Number(v);return Number.isFinite(n)&&n>=1?Math.trunc(n):fallback}
function clean(v:string|null,max=180){return(v||'').trim().slice(0,max)}
function num(v:string|null){if(v===null||v.trim()==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
function norm(v:unknown){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}

async function publicRows(db:any,tenantId:string){
  const out:CatalogRow[]=[]
  const batch=1000,max=10000
  for(let from=0;from<max;from+=batch){
    const {data,error}=await db.from('catalog_products').select(ROWS).eq('tenant_id',tenantId).eq('published',true).eq('public_visible',true).eq('active',true).range(from,from+batch-1)
    if(error)throw new Error(error.message)
    const rows=(data||[]) as CatalogRow[];out.push(...rows)
    if(rows.length<batch)break
  }
  return out
}
function textMatch(g:PublicGroup,q:string){
  const needle=norm(q)
  if(!needle)return true
  const variantText=g.variants.map(v=>`${v.sku} ${v.label} ${v.name} ${Object.values(v.attributes||{}).join(' ')}`).join(' ')
  return norm(`${g.name} ${g.sku} ${g.description} ${g.category} ${g.subcategory} ${g.brand} ${g.model} ${g.features} ${g.group_code} ${variantText}`).includes(needle)
}

async function handleGET(request:Request){
  try{
    const url=new URL(request.url),slug=clean(url.searchParams.get('slug'),64).toLowerCase(),q=clean(url.searchParams.get('q'),100),manifest=url.searchParams.get('manifest')==='1'
    const category=clean(url.searchParams.get('category')),subcategory=clean(url.searchParams.get('subcategory')),brand=clean(url.searchParams.get('brand')),availability=clean(url.searchParams.get('availability'),30)
    const sort=clean(url.searchParams.get('sort'),30)||'featured',minPrice=num(url.searchParams.get('minPrice')),maxPrice=num(url.searchParams.get('maxPrice'))
    const page=posInt(url.searchParams.get('page'),1),limit=Math.min(60,posInt(url.searchParams.get('limit'),24))
    if(!SLUG.test(slug))return json({ok:false,error:'slug inválido'},{status:400})
    const db=adminDb()
    const {data:tenant,error:tErr}=await db.from('catalog_tenants').select('id,slug,public_name,phone,website,accent_color,show_stock_mode,hide_out_of_stock,rate_bs_per_usd,rate_source,updated_at,logo_url,hero_title,hero_subtitle,announcement,catalog_theme,show_brand_filter,show_category_nav,instagram_url,location_text,catalog_protocol,variant_mode').eq('slug',slug).eq('active',true).maybeSingle()
    if(tErr)throw new Error(tErr.message);if(!tenant)return json({ok:false,error:'Catálogo no encontrado'},{status:404})

    if(manifest){
      const accent=/^#[0-9a-f]{6}$/i.test(tenant.accent_color||'')?tenant.accent_color:'#1368ff'
      const manifestData={
        name:`${tenant.public_name} · Catálogo`,short_name:String(tenant.public_name||'Catálogo').slice(0,28),
        description:`Catálogo online de ${tenant.public_name}, conectado con CUYRA.`,
        start_url:`/c/${encodeURIComponent(tenant.slug)}`,scope:'/',display:'standalone',
        background_color:'#f5f7fb',theme_color:accent,
        icons:[{src:'/cuyra-icon-192.png',sizes:'192x192',type:'image/png'},{src:'/cuyra-icon-512.png',sizes:'512x512',type:'image/png'}]
      }
      return new Response(JSON.stringify(manifestData),{status:200,headers:{'content-type':'application/manifest+json; charset=utf-8','cache-control':'public, max-age=300'}})
    }

    const rows=await publicRows(db,tenant.id)
    const allGroups=buildPublicGroups(rows,tenant)
    const categories=[...new Set(allGroups.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'))
    const subcategories=[...new Set(allGroups.map(x=>x.subcategory).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'))
    const brands=[...new Set(allGroups.map(x=>x.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'))
    const prices=allGroups.map(x=>x.price_usd)
    const priceRange={min:prices.length?Math.min(...prices):0,max:allGroups.length?Math.max(...allGroups.map(x=>x.price_usd_max)):0}

    let groups=allGroups.filter(g=>textMatch(g,q))
    if(category)groups=groups.filter(g=>g.category===category)
    if(subcategory)groups=groups.filter(g=>g.subcategory===subcategory)
    if(brand)groups=groups.filter(g=>g.brand===brand)
    if(tenant.show_stock_mode!=='hidden'){
      if(availability==='available')groups=groups.filter(g=>g.availability==='available'||(typeof g.stock_exact==='number'&&g.stock_exact>0))
      if(availability==='out')groups=groups.filter(g=>g.availability==='out'||g.stock_exact===0)
    }
    groups=groups.filter(g=>groupMatchesPrice(g,minPrice!==null&&minPrice>=0?minPrice:null,maxPrice!==null&&maxPrice>=0?maxPrice:null))

    if(sort==='price_asc')groups.sort((a,b)=>a.price_usd-b.price_usd||a.name.localeCompare(b.name,'es'))
    else if(sort==='price_desc')groups.sort((a,b)=>b.price_usd_max-a.price_usd_max||a.name.localeCompare(b.name,'es'))
    else if(sort==='newest')groups.sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))
    else if(sort==='name')groups.sort((a,b)=>a.name.localeCompare(b.name,'es'))
    else groups.sort((a,b)=>Number(b.featured)-Number(a.featured)||a.name.localeCompare(b.name,'es'))

    const total=groups.length,pages=Math.max(1,Math.ceil(total/limit)),safePage=Math.min(page,pages),from=(safePage-1)*limit
    const products=groups.slice(from,from+limit).map(g=>({...g,variants:undefined}))
    const {id,...tenantPublic}=tenant as any
    return json({ok:true,tenant:tenantPublic,products,facets:{categories,subcategories,brands,priceRange},page:safePage,limit,total,pages,protocol:'v4-grouped'})
  }catch(e){return err(e)}
}
export default{async fetch(request:Request){if(request.method!=='GET')return json({ok:false,error:'Método no permitido'},{status:405});return await handleGET(request)}}
