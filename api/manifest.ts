import { adminDb } from '../server/supabase.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
function response(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/manifest+json; charset=utf-8','cache-control':'public, max-age=300'}})}

async function handleGET(request:Request){
  const url=new URL(request.url),slug=(url.searchParams.get('slug')||'').trim().toLowerCase()
  if(!SLUG.test(slug))return response({error:'slug inválido'},400)
  const db=adminDb()
  const {data,error}=await db.from('catalog_tenants').select('slug,public_name,accent_color').eq('slug',slug).eq('active',true).maybeSingle()
  if(error)return response({error:error.message},500)
  if(!data)return response({error:'Catálogo no encontrado'},404)
  const accent=/^#[0-9a-f]{6}$/i.test(data.accent_color||'')?data.accent_color:'#1368ff'
  return response({
    name:`${data.public_name} · Catálogo`,short_name:String(data.public_name||'Catálogo').slice(0,28),
    description:`Catálogo online de ${data.public_name}, conectado con CUYRA.`,
    start_url:`/c/${encodeURIComponent(data.slug)}`,scope:'/',display:'standalone',
    background_color:'#f5f7fb',theme_color:accent,
    icons:[{src:'/cuyra-icon-192.png',sizes:'192x192',type:'image/png'},{src:'/cuyra-icon-512.png',sizes:'512x512',type:'image/png'}]
  })
}
export default{async fetch(request:Request){if(request.method!=='GET')return response({error:'Método no permitido'},405);return await handleGET(request)}}
