import { err, json } from '../server/http.js'
import { adminDb } from '../server/supabase.js'
import { requireAdmin } from '../server/security.js'

const SLUG=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const MAX_ROWS=5000

type EventRow={event_type:string;source_product_id:number|null;query_text:string;category:string;numeric_value:number|null;created_at:string}
function top<T extends string|number>(rows:T[],limit=10){
  const m=new Map<T,number>();for(const v of rows){if(v===''||v===null||v===undefined)continue;m.set(v,(m.get(v)||0)+1)}
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([value,count])=>({value,count}))
}

async function handleGET(request:Request){
  try{
    requireAdmin(request)
    const url=new URL(request.url),slug=(url.searchParams.get('slug')||'').trim().toLowerCase()
    const days=Math.min(365,Math.max(1,Math.trunc(Number(url.searchParams.get('days')||30))))
    if(!SLUG.test(slug))return json({ok:false,error:'slug inválido'},{status:400})
    const db=adminDb()
    const {data:tenant,error:tErr}=await db.from('catalog_tenants').select('id,slug,public_name').eq('slug',slug).eq('active',true).maybeSingle()
    if(tErr)throw new Error(tErr.message);if(!tenant)return json({ok:false,error:'Catálogo no encontrado'},{status:404})
    const since=new Date(Date.now()-days*86400000).toISOString()
    const {data,error}=await db.from('catalog_events').select('event_type,source_product_id,query_text,category,numeric_value,created_at').eq('tenant_id',tenant.id).gte('created_at',since).order('created_at',{ascending:false}).limit(MAX_ROWS)
    if(error){
      if(String(error.message||'').toLowerCase().includes('catalog_events'))return json({ok:true,migrated:false,tenant:{slug:tenant.slug,publicName:tenant.public_name},days,summary:{},topProducts:[],topSearches:[],topCategories:[]})
      throw new Error(error.message)
    }
    const rows=(data||[]) as EventRow[],summary:Record<string,number>={}
    for(const r of rows)summary[r.event_type]=(summary[r.event_type]||0)+1
    const orders=rows.filter(r=>r.event_type==='whatsapp_order').reduce((s,r)=>s+Number(r.numeric_value||0),0)
    return json({
      ok:true,migrated:true,tenant:{slug:tenant.slug,publicName:tenant.public_name},days,eventsSampled:rows.length,maxRows:MAX_ROWS,
      summary:{...summary,orderReferenceValue:orders},
      topProducts:top(rows.filter(r=>r.event_type==='product_view'&&r.source_product_id!==null).map(r=>Number(r.source_product_id)),12),
      topSearches:top(rows.filter(r=>r.event_type==='search').map(r=>r.query_text.trim().toLowerCase()).filter(Boolean),12),
      topCategories:top(rows.filter(r=>r.event_type==='category_view').map(r=>r.category).filter(Boolean),12)
    })
  }catch(e){return err(e)}
}

export default{async fetch(request:Request){if(request.method!=='GET')return json({ok:false,error:'Método no permitido'},{status:405});return await handleGET(request)}}
