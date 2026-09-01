import { adminDb } from '../server/supabase.js'
import { err, json } from '../server/http.js'
import { buildPublicGroups, groupMatchesPrice, type CatalogRow, type PublicGroup } from '../server/catalog-v4.js'
import crypto from 'node:crypto'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const ROWS=`source_product_id,source_group_id,group_code,group_name,variant_count,variant_label,variant_attributes,variant_name,sku,name,description,category,subcategory,brand,model,features,featured,recommended,compare_at_price_usd,compare_at_price_bs,promo_badge,price_usd,price_bs,stock_exact,availability,image_url,gallery_urls,updated_at,public_visible,published,active,sofia_visible,sofia_approved,sofia_aliases,sofia_tags,sofia_notes,sofia_price_divisas,sofia_rules_json`
const TENANT=`id,slug,public_name,phone,website,accent_color,show_stock_mode,hide_out_of_stock,rate_bs_per_usd,rate_source,updated_at,logo_url,hero_title,hero_subtitle,announcement,catalog_theme,show_brand_filter,show_category_nav,instagram_url,location_text,catalog_protocol,variant_mode,banners_json,commerce_settings_json,home_sections_json`
function posInt(v:string|null,fallback:number){const n=Number(v);return Number.isFinite(n)&&n>=1?Math.trunc(n):fallback}
function clean(v:string|null,max=180){return(v||'').trim().slice(0,max)}
function num(v:string|null){if(v===null||v.trim()==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
function norm(v:unknown){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}

async function publicRows(db:any,tenantId:string){
  const out:CatalogRow[]=[];const batch=1000,max=10000
  for(let from=0;from<max;from+=batch){
    const {data,error}=await db.from('catalog_products').select(ROWS).eq('tenant_id',tenantId).eq('published',true).eq('public_visible',true).eq('active',true).range(from,from+batch-1)
    if(error)throw new Error(error.message)
    const rows=(data||[]) as CatalogRow[];out.push(...rows);if(rows.length<batch)break
  }
  return out
}
function textMatch(g:PublicGroup,q:string){const needle=norm(q);if(!needle)return true;const variantText=g.variants.map(v=>`${v.sku} ${v.label} ${v.name} ${Object.values(v.attributes||{}).join(' ')}`).join(' ');return norm(`${g.name} ${g.sku} ${g.description} ${g.category} ${g.subcategory} ${g.brand} ${g.model} ${g.features} ${g.group_code} ${variantText}`).includes(needle)}
function reviewKey(g:PublicGroup){return g.source_group_id?`g:${g.source_group_id}`:`p:${g.source_product_id}`}
async function ratingMap(db:any,tenantId:string){
  const map=new Map<string,{sum:number,count:number}>()
  const {data,error}=await db.from('catalog_product_reviews').select('source_product_id,source_group_id,rating').eq('tenant_id',tenantId).eq('approved',true).limit(5000)
  if(error){if(String(error.message||'').toLowerCase().includes('catalog_product_reviews'))return map;throw new Error(error.message)}
  for(const r of data||[]){const k=r.source_group_id?`g:${r.source_group_id}`:`p:${r.source_product_id}`,old=map.get(k)||{sum:0,count:0};old.sum+=Number(r.rating)||0;old.count++;map.set(k,old)}
  return map
}
function attachRating(g:PublicGroup,map:Map<string,{sum:number,count:number}>){const x=map.get(reviewKey(g));return {...g,rating_value:x&&x.count?Math.round((x.sum/x.count)*10)/10:0,rating_count:x?.count||0}}
function requestCode(){const d=new Date(),yy=String(d.getUTCFullYear()).slice(-2),mm=String(d.getUTCMonth()+1).padStart(2,'0'),dd=String(d.getUTCDate()).padStart(2,'0'),rnd=crypto.randomBytes(3).toString('hex').toUpperCase();return `CY-${yy}${mm}${dd}-${rnd}`}

async function handleGET(request:Request){
  try{
    const url=new URL(request.url),slug=clean(url.searchParams.get('slug'),64).toLowerCase(),q=clean(url.searchParams.get('q'),100),manifest=url.searchParams.get('manifest')==='1'
    const category=clean(url.searchParams.get('category')),subcategory=clean(url.searchParams.get('subcategory')),brand=clean(url.searchParams.get('brand')),availability=clean(url.searchParams.get('availability'),30),featuredOnly=url.searchParams.get('featured')==='1',recommendedOnly=url.searchParams.get('recommended')==='1',promoOnly=url.searchParams.get('promo')==='1'
    const sort=clean(url.searchParams.get('sort'),30)||'featured',minPrice=num(url.searchParams.get('minPrice')),maxPrice=num(url.searchParams.get('maxPrice'))
    const page=posInt(url.searchParams.get('page'),1),limit=Math.min(60,posInt(url.searchParams.get('limit'),24))
    if(!SLUG.test(slug))return json({ok:false,error:'slug inválido'},{status:400})
    const db=adminDb();const {data:tenant,error:tErr}=await db.from('catalog_tenants').select(TENANT).eq('slug',slug).eq('active',true).maybeSingle();if(tErr)throw new Error(tErr.message);if(!tenant)return json({ok:false,error:'Catálogo no encontrado'},{status:404})
    if(manifest){const accent=/^#[0-9a-f]{6}$/i.test(tenant.accent_color||'')?tenant.accent_color:'#1368ff';return new Response(JSON.stringify({name:`${tenant.public_name} · Catálogo`,short_name:String(tenant.public_name||'Catálogo').slice(0,28),description:`Catálogo online de ${tenant.public_name}, conectado con CUYRA.`,start_url:`/c/${encodeURIComponent(tenant.slug)}`,scope:'/',display:'standalone',background_color:'#f5f7fb',theme_color:accent,icons:[{src:'/cuyra-icon-192.png',sizes:'192x192',type:'image/png'},{src:'/cuyra-icon-512.png',sizes:'512x512',type:'image/png'}]}),{status:200,headers:{'content-type':'application/manifest+json; charset=utf-8','cache-control':'public, max-age=300'}})}
    const rows=await publicRows(db,tenant.id),ratings=await ratingMap(db,tenant.id),allGroups=buildPublicGroups(rows,tenant).map(g=>attachRating(g,ratings))
    const categories=[...new Set(allGroups.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')),subcategories=[...new Set(allGroups.map(x=>x.subcategory).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')),brands=[...new Set(allGroups.map(x=>x.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'))
    const prices=allGroups.map(x=>x.price_usd),priceRange={min:prices.length?Math.min(...prices):0,max:allGroups.length?Math.max(...allGroups.map(x=>x.price_usd_max)):0}
    let groups=allGroups.filter(g=>textMatch(g,q));if(category)groups=groups.filter(g=>g.category===category);if(subcategory)groups=groups.filter(g=>g.subcategory===subcategory);if(brand)groups=groups.filter(g=>g.brand===brand);if(featuredOnly)groups=groups.filter(g=>!!g.featured);if(recommendedOnly)groups=groups.filter(g=>!!g.recommended);if(promoOnly)groups=groups.filter(g=>!!g.promo_badge||(Number(g.compare_at_price_usd)||0)>Number(g.price_usd))
    if(tenant.show_stock_mode!=='hidden'){if(availability==='available')groups=groups.filter(g=>g.availability==='available'||(typeof g.stock_exact==='number'&&g.stock_exact>0));if(availability==='out')groups=groups.filter(g=>g.availability==='out'||g.stock_exact===0)}
    groups=groups.filter(g=>groupMatchesPrice(g,minPrice!==null&&minPrice>=0?minPrice:null,maxPrice!==null&&maxPrice>=0?maxPrice:null))
    if(sort==='price_asc')groups.sort((a,b)=>a.price_usd-b.price_usd||a.name.localeCompare(b.name,'es'));else if(sort==='price_desc')groups.sort((a,b)=>b.price_usd_max-a.price_usd_max||a.name.localeCompare(b.name,'es'));else if(sort==='newest')groups.sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));else if(sort==='rating')groups.sort((a:any,b:any)=>Number(b.rating_value)-Number(a.rating_value)||Number(b.rating_count)-Number(a.rating_count));else if(sort==='name')groups.sort((a,b)=>a.name.localeCompare(b.name,'es'));else groups.sort((a,b)=>Number(b.featured)-Number(a.featured)||Number(b.recommended)-Number(a.recommended)||a.name.localeCompare(b.name,'es'))
    const total=groups.length,pages=Math.max(1,Math.ceil(total/limit)),safePage=Math.min(page,pages),from=(safePage-1)*limit,products=groups.slice(from,from+limit).map(g=>({...g,variants:undefined}));const {id,...tenantPublic}=tenant as any
    return json({ok:true,tenant:tenantPublic,products,facets:{categories,subcategories,brands,priceRange},page:safePage,limit,total,pages,protocol:'v4.4-commerce'})
  }catch(e){return err(e)}
}

async function handlePOST(request:Request){
  try{
    const body=await request.json().catch(()=>({})),slug=String(body?.slug||'').trim().toLowerCase()
    if(!SLUG.test(slug)||body?.action!=='checkout')return json({ok:false,error:'Solicitud inválida'},{status:400})
    const raw=Array.isArray(body?.items)?body.items.slice(0,40):[]
    if(!raw.length)return json({ok:false,error:'El pedido está vacío'},{status:400})
    const requested=raw.map((x:any)=>({id:Number(x?.id),variantId:x?.variantId?Number(x.variantId):null,qty:Math.max(1,Math.min(99,Math.trunc(Number(x?.qty)||1)))})).filter((x:any)=>Number.isInteger(x.id)&&x.id>0&&(!x.variantId||Number.isInteger(x.variantId)))
    if(!requested.length)return json({ok:false,error:'No hay productos válidos'},{status:400})

    const db=adminDb()
    const {data:tenant,error}=await db.from('catalog_tenants').select('id,public_name,phone,commerce_settings_json').eq('slug',slug).eq('active',true).maybeSingle()
    if(error)throw new Error(error.message)
    if(!tenant)return json({ok:false,error:'Catálogo no encontrado'},{status:404})
    const commerce=tenant.commerce_settings_json&&typeof tenant.commerce_settings_json==='object'?tenant.commerce_settings_json:{},fulfillment=body?.fulfillment==='pickup'?'pickup':'delivery'
    if(fulfillment==='delivery'&&commerce.deliveryEnabled===false)return json({ok:false,error:'Delivery no está habilitado para este catálogo.'},{status:400})
    if(fulfillment==='pickup'&&commerce.pickupEnabled===false)return json({ok:false,error:'Retiro en tienda no está habilitado para este catálogo.'},{status:400})

    const sourceIds=[...new Set(requested.map((x:any)=>Number(x.variantId||x.id)))]
    const {data:rows,error:rowsError}=await db.from('catalog_products').select('source_product_id,source_group_id,group_name,variant_label,variant_name,sku,name,price_usd,price_bs,stock_exact').eq('tenant_id',tenant.id).eq('published',true).eq('public_visible',true).eq('active',true).in('source_product_id',sourceIds)
    if(rowsError)throw new Error(rowsError.message)
    const byId=new Map((rows||[]).map((r:any)=>[Number(r.source_product_id),r])),demand=new Map<number,number>()
    for(const item of requested){const sourceId=Number(item.variantId||item.id);demand.set(sourceId,(demand.get(sourceId)||0)+item.qty)}
    for(const [id,qty] of demand){const row:any=byId.get(id);if(!row)return json({ok:false,error:'Uno de los productos del pedido ya no está publicado. Actualiza el pedido.'},{status:409});const stock=Math.max(0,Math.trunc(Number(row.stock_exact)||0));if(stock<qty)return json({ok:false,error:stock<=0?`${String(row.name||row.group_name||'Un producto')} está agotado.`:`Solo quedan ${stock} unidad(es) de ${String(row.name||row.group_name||'un producto')}.`},{status:409})}

    const canonical=requested.map((item:any)=>{const sourceId=Number(item.variantId||item.id),row:any=byId.get(sourceId);return {kind:'product',id:item.id,variantId:item.variantId||null,name:String(row.name||row.group_name||row.variant_name||'Producto').trim().slice(0,180),sku:String(row.sku||'').trim().slice(0,120),variantLabel:String(row.variant_label||row.variant_name||'').trim().slice(0,180),qty:item.qty,priceUsd:Math.max(0,Number(row.price_usd)||0),priceBs:Math.max(0,Number(row.price_bs)||0)}})
    const total=Math.round(canonical.reduce((sum:number,x:any)=>sum+x.priceUsd*x.qty,0)*100)/100,code=requestCode(),itemCount=canonical.reduce((sum:number,x:any)=>sum+x.qty,0)
    const {error:insertError}=await db.from('catalog_whatsapp_requests').insert({tenant_id:tenant.id,request_code:code,fulfillment_type:fulfillment,items_json:canonical,item_count:itemCount,total_reference_usd:total,source:'web-confirmation'})
    if(insertError)throw new Error(insertError.message)
    return json({ok:true,requestCode:code,total,itemCount,fulfillment,items:canonical,phone:tenant.phone,publicName:tenant.public_name,commerce})
  }catch(e){return err(e)}
}
export default{async fetch(request:Request){if(request.method==='GET')return await handleGET(request);if(request.method==='POST')return await handlePOST(request);return json({ok:false,error:'Método no permitido'},{status:405})}}
