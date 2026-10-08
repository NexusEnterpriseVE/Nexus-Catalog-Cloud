import { bodyJson, err, json } from '../server/http.js'
import { adminDb } from '../server/supabase.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const EVENTS=new Set(['catalog_view','product_view','search','whatsapp_consult','whatsapp_order','share','favorite','category_view','add_to_list'])
type Input={slug:string;event:string;path?:string;referrer?:string;productId?:number;variantId?:number|null;q?:string;category?:string;source?:string;qty?:number;items?:number;total?:number}
function clean(v:unknown,max:number){return String(v||'').trim().slice(0,max)}

async function handlePOST(request:Request){
  try{
    const input=await bodyJson<Input>(request)
    const slug=clean(input.slug,64).toLowerCase(),event=clean(input.event,40)
    if(!SLUG.test(slug)||!EVENTS.has(event))return json({ok:false,error:'Evento inválido'},{status:400})
    const db=adminDb()
    const {data:tenant,error:tErr}=await db.from('catalog_tenants').select('id').eq('slug',slug).eq('active',true).maybeSingle()
    if(tErr)throw new Error(tErr.message)
    if(!tenant)return json({ok:false,error:'Catálogo no encontrado'},{status:404})
    const payload={
      tenant_id:tenant.id,event_type:event,
      source_product_id:Number.isInteger(Number(input.productId))?Number(input.productId):null,
      source_variant_id:Number.isInteger(Number(input.variantId))?Number(input.variantId):null,
      query_text:clean(input.q,120),category:clean(input.category,160),source:clean(input.source,50),
      page_path:clean(input.path,240),referrer:clean(input.referrer,240),
      numeric_value:Number.isFinite(Number(input.total))?Number(input.total):Number.isFinite(Number(input.qty))?Number(input.qty):Number.isFinite(Number(input.items))?Number(input.items):null
    }
    const {error}=await db.from('catalog_events').insert(payload)
    if(error){
      // Analytics is additive. If migration is not installed yet, never break the public catalog.
      if(String(error.message||'').toLowerCase().includes('catalog_events'))return json({ok:true,stored:false})
      throw new Error(error.message)
    }
    return json({ok:true,stored:true})
  }catch(e){return err(e)}
}
export default{async fetch(request:Request){if(request.method!=='POST')return json({ok:false,error:'Método no permitido'},{status:405});return await handlePOST(request)}}
