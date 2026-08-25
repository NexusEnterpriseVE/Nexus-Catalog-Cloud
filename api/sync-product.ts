import { bodyJson, err, json } from '../server/http.js'
import { requireTenant } from '../server/security.js'
import { storageBucket } from '../server/supabase.js'

type ProductPayload = {
  catalogProtocol?:string
  sourceProductId:number
  sourceGroupId?:number|null
  groupCode?:string
  groupName?:string
  variantCount?:number
  variantLabel?:string
  variantAttributes?:Record<string,unknown>|null
  variantName?:string
  sku:string
  name:string
  description?:string
  category?:string
  subcategory?:string
  brand?:string
  model?:string
  features?:string
  featured?:boolean
  priceUsd:number
  priceBs:number
  stockExact:number
  availability:'available'|'out'
  published:boolean
  publicVisible?:boolean
  active:boolean
  sofiaVisible?:boolean
  sofiaApproved?:boolean
  sofiaAliases?:string
  sofiaTags?:string
  sofiaNotes?:string
  sofiaPriceDivisas?:number|null
  sofiaRules?:Record<string,unknown>|null
  imageBase64?:string|null
  imageMime?:string|null
  imageRemove?:boolean
  galleryImages?:Array<{base64:string;mime?:string;position?:number;isPrimary?:boolean;hash?:string}>|null
  galleryReplace?:boolean
  updatedAt?:string
}
type Input={idempotencyKey:string;product:ProductPayload}

function txt(v:unknown,max:number){return (typeof v==='string'?v:'').trim().slice(0,max)}
function obj(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v:{} }

async function handlePOST(request:Request){
  try{
    const {db,tenant}=await requireTenant(request)
    const input=await bodyJson<Input>(request),p=input.product
    if(!input.idempotencyKey||input.idempotencyKey.length>200||!p||!Number.isInteger(p.sourceProductId)||p.sourceProductId<=0)return json({ok:false,error:'Payload inválido'},{status:400})

    const sku=txt(p.sku,120),name=txt(p.name,180)
    const priceUsd=Number(p.priceUsd),priceBs=Number(p.priceBs),stockExact=Number(p.stockExact)
    const sourceGroupId=p.sourceGroupId===null||p.sourceGroupId===undefined?null:Number(p.sourceGroupId)
    const variantCount=Math.max(1,Math.min(500,Math.trunc(Number(p.variantCount)||1)))
    if(!sku||!name)return json({ok:false,error:'SKU/nombre de producto inválido'},{status:400})
    if(sourceGroupId!==null&&(!Number.isInteger(sourceGroupId)||sourceGroupId<=0))return json({ok:false,error:'Grupo de producto inválido'},{status:400})
    if(!Number.isFinite(priceUsd)||priceUsd<0||!Number.isFinite(priceBs)||priceBs<0||!Number.isFinite(stockExact)||stockExact<0)return json({ok:false,error:'Precio o stock inválido'},{status:400})
    if(!['available','out'].includes(p.availability))return json({ok:false,error:'Disponibilidad inválida'},{status:400})
    if(p.sofiaPriceDivisas!==null&&p.sofiaPriceDivisas!==undefined&&(!Number.isFinite(Number(p.sofiaPriceDivisas))||Number(p.sofiaPriceDivisas)<0))return json({ok:false,error:'Precio Sofía inválido'},{status:400})

    const prior=await db.from('catalog_sync_receipts').select('id').eq('tenant_id',tenant.id).eq('idempotency_key',input.idempotencyKey).maybeSingle()
    if(prior.error)throw new Error(prior.error.message)
    if(prior.data)return json({ok:true,duplicate:true})

    let imageUrl:string|null|undefined=undefined
    let galleryUrls:string[]|undefined=undefined
    const bucket=storageBucket()
    if(p.galleryReplace&&Array.isArray(p.galleryImages)){
      const incoming=p.galleryImages.slice(0,5).sort((a,b)=>((b.isPrimary?1:0)-(a.isPrimary?1:0)) || (Number(a.position||0)-Number(b.position||0)))
      const stale:string[]=[];for(let i=0;i<5;i++){stale.push(`${tenant.slug}/${p.sourceProductId}/gallery-${i}.jpg`,`${tenant.slug}/${p.sourceProductId}/gallery-${i}.png`)}
      await db.storage.from(bucket).remove(stale)
      galleryUrls=[]
      let total=0
      for(let i=0;i<incoming.length;i++){const img=incoming[i];if(!img?.base64)continue;const binary=Buffer.from(img.base64,'base64');total+=binary.byteLength;if(binary.byteLength>900_000||total>4_200_000)return json({ok:false,error:'Galería supera el límite seguro de sincronización'},{status:413});const mime=img.mime==='image/png'?'image/png':'image/jpeg',ext=mime==='image/png'?'png':'jpg',path=`${tenant.slug}/${p.sourceProductId}/gallery-${i}.${ext}`;const {error:uploadError}=await db.storage.from(bucket).upload(path,binary,{upsert:true,contentType:mime,cacheControl:'86400'});if(uploadError)throw new Error(uploadError.message);galleryUrls.push(db.storage.from(bucket).getPublicUrl(path).data.publicUrl)}
      imageUrl=galleryUrls[0]??null
    }
    if(p.imageRemove&&!p.galleryReplace){
      await db.storage.from(bucket).remove([`${tenant.slug}/${p.sourceProductId}.jpg`,`${tenant.slug}/${p.sourceProductId}.png`])
      imageUrl=null
    }
    if(p.imageBase64&&!p.galleryReplace){
      const binary=Buffer.from(p.imageBase64,'base64')
      if(binary.byteLength>2_800_000)return json({ok:false,error:'Imagen cloud supera 2.8 MB después de optimizar'},{status:413})
      const mime=p.imageMime==='image/png'?'image/png':'image/jpeg',ext=mime==='image/png'?'png':'jpg',other=ext==='png'?'jpg':'png'
      const path=`${tenant.slug}/${p.sourceProductId}.${ext}`
      const {error:uploadError}=await db.storage.from(bucket).upload(path,binary,{upsert:true,contentType:mime,cacheControl:'3600'})
      if(uploadError)throw new Error(uploadError.message)
      await db.storage.from(bucket).remove([`${tenant.slug}/${p.sourceProductId}.${other}`])
      imageUrl=db.storage.from(bucket).getPublicUrl(path).data.publicUrl
    }

    const protocol=txt(p.catalogProtocol||'v3',30)||'v3'
    const publicVisible=p.publicVisible===undefined?!!p.published:!!p.publicVisible
    const row:any={
      tenant_id:tenant.id,source_product_id:p.sourceProductId,source_group_id:sourceGroupId,
      group_code:txt(p.groupCode,120),group_name:txt(p.groupName,180),variant_count:variantCount,
      variant_label:txt(p.variantLabel,180),variant_attributes:obj(p.variantAttributes),variant_name:txt(p.variantName,180),
      sku,name,description:txt(p.description,6000),category:txt(p.category,180),subcategory:txt(p.subcategory,180),brand:txt(p.brand,120),model:txt(p.model,180),features:txt(p.features,6000),featured:!!p.featured,
      price_usd:priceUsd,price_bs:priceBs,stock_exact:Math.max(0,Math.trunc(stockExact)),availability:p.availability,
      published:!!p.published,public_visible:publicVisible,active:!!p.active,
      sofia_visible:!!p.sofiaVisible,sofia_approved:!!p.sofiaApproved,sofia_aliases:txt(p.sofiaAliases,3000),sofia_tags:txt(p.sofiaTags,3000),sofia_notes:txt(p.sofiaNotes,6000),
      sofia_price_divisas:p.sofiaPriceDivisas===null||p.sofiaPriceDivisas===undefined?null:Number(p.sofiaPriceDivisas),sofia_rules_json:obj(p.sofiaRules),
      catalog_protocol:protocol,source_updated_at:p.updatedAt||new Date().toISOString(),updated_at:new Date().toISOString()
    }
    if(imageUrl!==undefined)row.image_url=imageUrl
    if(galleryUrls!==undefined)row.gallery_urls=galleryUrls

    const {error:upsertError}=await db.from('catalog_products').upsert(row,{onConflict:'tenant_id,source_product_id'})
    if(upsertError)throw new Error(upsertError.message)

    if(protocol.toLowerCase()==='v4'){
      const {error:tenantErr}=await db.from('catalog_tenants').update({catalog_protocol:'v4',variant_mode:'grouped',updated_at:new Date().toISOString()}).eq('id',tenant.id)
      if(tenantErr)throw new Error(tenantErr.message)
    }

    const {error:receiptError}=await db.from('catalog_sync_receipts').insert({tenant_id:tenant.id,idempotency_key:input.idempotencyKey,entity_type:'product',source_entity_id:p.sourceProductId})
    if(receiptError&&!String(receiptError.code||'').includes('23505'))throw new Error(receiptError.message)
    return json({ok:true,duplicate:false,catalogProtocol:protocol,sourceGroupId,imageUrl:imageUrl??null,galleryCount:galleryUrls?.length??null})
  }catch(e){return err(e)}
}

export default{async fetch(request:Request){
  if(request.method!=='POST')return json({ok:false,error:'Método no permitido'},{status:405})
  return await handlePOST(request)
}}
