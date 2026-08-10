import { bodyJson, err, json } from '../server/http.js'
import { requireTenant } from '../server/security.js'
import { storageBucket } from '../server/supabase.js'

type ProductPayload = {
  sourceProductId: number; sku: string; name: string; description?: string; category?: string; subcategory?: string;
  priceUsd: number; priceBs: number; stockExact: number; availability: 'available'|'out'; published: boolean; active: boolean;
  imageBase64?: string|null; imageMime?: string|null; imageRemove?: boolean; updatedAt?: string
}
type Input = { idempotencyKey: string; product: ProductPayload }

async function handlePOST(request: Request) {
  try {
    const { db, tenant } = await requireTenant(request)
    const input = await bodyJson<Input>(request)
    const p=input.product
    if (!input.idempotencyKey || input.idempotencyKey.length>200 || !p || !Number.isInteger(p.sourceProductId) || p.sourceProductId<=0) {
      return json({ok:false,error:'Payload inválido'}, {status:400})
    }
    const sku=(p.sku||'').trim(),name=(p.name||'').trim()
    const priceUsd=Number(p.priceUsd),priceBs=Number(p.priceBs),stockExact=Number(p.stockExact)
    if(!sku || sku.length>120 || !name || name.length>180)return json({ok:false,error:'SKU/nombre de producto inválido'},{status:400})
    if(!Number.isFinite(priceUsd)||priceUsd<0||!Number.isFinite(priceBs)||priceBs<0||!Number.isFinite(stockExact)||stockExact<0)return json({ok:false,error:'Precio o stock inválido'},{status:400})
    if(!['available','out'].includes(p.availability))return json({ok:false,error:'Disponibilidad inválida'},{status:400})

    const prior = await db.from('catalog_sync_receipts').select('id').eq('tenant_id',tenant.id).eq('idempotency_key',input.idempotencyKey).maybeSingle()
    if (prior.error) throw new Error(prior.error.message)
    if (prior.data) return json({ok:true,duplicate:true})

    let imageUrl: string|null|undefined = undefined
    const bucket=storageBucket()
    if (p.imageRemove) {
      await db.storage.from(bucket).remove([`${tenant.slug}/${p.sourceProductId}.jpg`,`${tenant.slug}/${p.sourceProductId}.png`])
      imageUrl=null
    }
    if (p.imageBase64) {
      const binary = Buffer.from(p.imageBase64, 'base64')
      if (binary.byteLength > 2_800_000) return json({ok:false,error:'Imagen cloud supera 2.8 MB después de optimizar'}, {status:413})
      const mime = p.imageMime === 'image/png' ? 'image/png' : 'image/jpeg'
      const ext = mime === 'image/png' ? 'png' : 'jpg'
      const other = ext==='png'?'jpg':'png'
      const path = `${tenant.slug}/${p.sourceProductId}.${ext}`
      const { error: uploadError } = await db.storage.from(bucket).upload(path, binary, { upsert:true, contentType:mime, cacheControl:'3600' })
      if (uploadError) throw new Error(uploadError.message)
      await db.storage.from(bucket).remove([`${tenant.slug}/${p.sourceProductId}.${other}`])
      imageUrl = db.storage.from(bucket).getPublicUrl(path).data.publicUrl
    }

    const row:any = {
      tenant_id:tenant.id, source_product_id:p.sourceProductId, sku, name,
      description:(p.description||'').trim().slice(0,4000), category:(p.category||'').trim().slice(0,180), subcategory:(p.subcategory||'').trim().slice(0,180),
      price_usd:priceUsd, price_bs:priceBs, stock_exact:Math.max(0,Math.trunc(stockExact)),
      availability:p.availability, published:!!p.published, active:!!p.active,
      source_updated_at:p.updatedAt || new Date().toISOString(), updated_at:new Date().toISOString()
    }
    if (imageUrl !== undefined) row.image_url = imageUrl
    const { error: upsertError } = await db.from('catalog_products').upsert(row,{onConflict:'tenant_id,source_product_id'})
    if (upsertError) throw new Error(upsertError.message)
    const { error: receiptError } = await db.from('catalog_sync_receipts').insert({tenant_id:tenant.id,idempotency_key:input.idempotencyKey,entity_type:'product',source_entity_id:p.sourceProductId})
    if (receiptError && !String(receiptError.code||'').includes('23505')) throw new Error(receiptError.message)
    return json({ok:true,duplicate:false,imageUrl:imageUrl ?? null})
  } catch(e) { return err(e) }
}


export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return await handlePOST(request)
  }
}
