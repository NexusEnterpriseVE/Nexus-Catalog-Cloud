import { adminDb } from '../server/supabase.js'
import { bodyJson, err, json } from '../server/http.js'
import { randomSofiaToken, requireAdmin, sha256 } from '../server/security.js'

type Input={slug:string}
const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/

async function handlePOST(request:Request){
  try{
    requireAdmin(request)
    const input=await bodyJson<Input>(request),slug=(input.slug||'').trim().toLowerCase()
    if(!SLUG.test(slug))return json({ok:false,error:'Slug inválido'},{status:400})
    const token=randomSofiaToken(),db=adminDb()
    const {data,error}=await db.from('catalog_tenants').update({sofia_read_token_hash:sha256(token),updated_at:new Date().toISOString()}).eq('slug',slug).select('id,slug,public_name').maybeSingle()
    if(error)throw new Error(error.message);if(!data)return json({ok:false,error:'Tenant no encontrado'},{status:404})
    return json({ok:true,tenant:data,sofiaReadToken:token,warning:'Guarda este token en el backend de Sofía. El valor no vuelve a mostrarse y no debe ponerse en frontend.'})
  }catch(e){return err(e)}
}
export default{async fetch(request:Request){if(request.method!=='POST')return json({ok:false,error:'Método no permitido'},{status:405});return await handlePOST(request)}}
