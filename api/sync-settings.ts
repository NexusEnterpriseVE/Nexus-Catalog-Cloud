import { bodyJson, err, json } from '../server/http.js'
import { requireTenant } from '../server/security.js'
import { storageBucket } from '../server/supabase.js'

type Input = {
  publicName: string; showStockMode: 'exact'|'status'|'hidden'; hideOutOfStock: boolean;
  phone?: string; website?: string; accentColor?: string; rateBsPerUsd?: number; rateSource?: string;
  heroTitle?: string; heroSubtitle?: string; announcement?: string; catalogTheme?: 'retail'|'minimal'|'bold';
  showBrandFilter?: boolean; showCategoryNav?: boolean; instagramUrl?: string; locationText?: string;
  logoBase64?: string|null; logoMime?: string|null; logoRemove?: boolean;
  catalogProtocol?: string; variantMode?: string;
  banners?: Array<{title?:string;subtitle?:string;imageUrl?:string;mobileImageUrl?:string;ctaLabel?:string;targetType?:string;targetValue?:string}>;
  commerceSettings?: {deliveryEnabled?:boolean;pickupEnabled?:boolean;pickupLabel?:string;businessHours?:string};
  homeSections?: string[];
}
const ACCENT=/^#[0-9a-fA-F]{6}$/

async function handlePOST(request: Request) {
  try {
    const { db, tenant } = await requireTenant(request)
    const input = await bodyJson<Input>(request)
    if (!['exact','status','hidden'].includes(input.showStockMode)) return json({ ok:false,error:'Modo de stock inválido' }, {status:400})
    const publicName=(input.publicName || tenant.public_name).trim()
    if(!publicName || publicName.length>120)return json({ok:false,error:'Nombre público inválido'},{status:400})
    const accent=(input.accentColor || '#2563EB').trim()
    if(!ACCENT.test(accent))return json({ok:false,error:'Color de acento inválido'},{status:400})
    const rate=Number(input.rateBsPerUsd || 0)
    if(!Number.isFinite(rate)||rate<0)return json({ok:false,error:'Tasa inválida'},{status:400})
    const theme=['retail','minimal','bold'].includes(input.catalogTheme||'')?input.catalogTheme:'retail'

    let logoUrl: string|null|undefined=undefined
    const bucket=storageBucket()
    if(input.logoRemove){
      await db.storage.from(bucket).remove([`${tenant.slug}/branding/logo.jpg`,`${tenant.slug}/branding/logo.png`])
      logoUrl=null
    }
    if(input.logoBase64){
      const binary=Buffer.from(input.logoBase64,'base64')
      if(binary.byteLength>1_800_000)return json({ok:false,error:'Logo cloud supera 1.8 MB'},{status:413})
      const mime=input.logoMime==='image/png'?'image/png':'image/jpeg'
      const ext=mime==='image/png'?'png':'jpg',other=ext==='png'?'jpg':'png'
      const path=`${tenant.slug}/branding/logo.${ext}`
      const {error:uploadError}=await db.storage.from(bucket).upload(path,binary,{upsert:true,contentType:mime,cacheControl:'3600'})
      if(uploadError)throw new Error(uploadError.message)
      await db.storage.from(bucket).remove([`${tenant.slug}/branding/logo.${other}`])
      logoUrl=db.storage.from(bucket).getPublicUrl(path).data.publicUrl
    }

    const update:any={
      public_name: publicName,
      show_stock_mode: input.showStockMode,
      hide_out_of_stock: !!input.hideOutOfStock,
      phone: (input.phone || '').trim().slice(0,40),
      website: (input.website || '').trim().slice(0,300),
      accent_color: accent,
      rate_bs_per_usd: rate,
      rate_source: (input.rateSource || 'BCV').trim().slice(0,30),
      hero_title:(input.heroTitle||'').trim().slice(0,140),
      hero_subtitle:(input.heroSubtitle||'').trim().slice(0,360),
      announcement:(input.announcement||'').trim().slice(0,220),
      catalog_theme:theme,
      show_brand_filter:input.showBrandFilter!==false,
      show_category_nav:input.showCategoryNav!==false,
      instagram_url:(input.instagramUrl||'').trim().slice(0,300),
      location_text:(input.locationText||'').trim().slice(0,220),
      catalog_protocol:(input.catalogProtocol||'v3').trim().slice(0,30)||'v3',
      variant_mode:(input.variantMode||'legacy').trim().slice(0,30)||'legacy',
      banners_json:Array.isArray(input.banners)?input.banners.slice(0,3).map(b=>({title:String(b?.title||'').trim().slice(0,120),subtitle:String(b?.subtitle||'').trim().slice(0,260),imageUrl:String(b?.imageUrl||'').trim().slice(0,900),mobileImageUrl:String(b?.mobileImageUrl||'').trim().slice(0,900),ctaLabel:String(b?.ctaLabel||'').trim().slice(0,40),targetType:String(b?.targetType||'').trim().slice(0,30),targetValue:String(b?.targetValue||'').trim().slice(0,200)})):tenant.banners_json||[],
      commerce_settings_json:input.commerceSettings&&typeof input.commerceSettings==='object'?{deliveryEnabled:input.commerceSettings.deliveryEnabled!==false||input.commerceSettings.pickupEnabled===false,pickupEnabled:input.commerceSettings.pickupEnabled!==false,pickupLabel:String(input.commerceSettings.pickupLabel||'Retiro en tienda').trim().slice(0,80),businessHours:String(input.commerceSettings.businessHours||'').trim().slice(0,180)}:tenant.commerce_settings_json||{},
      home_sections_json:Array.isArray(input.homeSections)?input.homeSections.map(x=>String(x)).filter(x=>['categories','featured','recommended','offers','newest','brands'].includes(x)).slice(0,8):tenant.home_sections_json||[],
      updated_at: new Date().toISOString()
    }
    if(logoUrl!==undefined)update.logo_url=logoUrl
    const { error } = await db.from('catalog_tenants').update(update).eq('id', tenant.id)
    if (error) throw new Error(error.message)
    return json({ ok:true,logoUrl:logoUrl??null })
  } catch(e) { return err(e) }
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return await handlePOST(request)
  }
}
