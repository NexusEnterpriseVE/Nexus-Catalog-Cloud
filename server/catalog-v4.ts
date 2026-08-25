export type CatalogTenantPolicy = {
  show_stock_mode:'exact'|'status'|'hidden'
  hide_out_of_stock:boolean
}

export type CatalogRow = {
  source_product_id:number
  source_group_id:number|null
  group_code:string
  group_name:string
  variant_count:number
  variant_label:string
  variant_attributes:Record<string,unknown>|null
  variant_name:string
  sku:string
  name:string
  description:string
  category:string
  subcategory:string
  brand:string
  model:string
  features:string
  featured:boolean
  price_usd:number
  price_bs:number
  stock_exact:number
  availability:'available'|'out'
  image_url:string|null
  gallery_urls:string[]
  updated_at:string
  public_visible:boolean
  published:boolean
  active:boolean
  sofia_visible:boolean
  sofia_approved:boolean
  sofia_aliases:string
  sofia_tags:string
  sofia_notes:string
  sofia_price_divisas:number|null
  sofia_rules_json:Record<string,unknown>|null
}

export type PublicVariant = {
  source_product_id:number
  sku:string
  label:string
  attributes:Record<string,unknown>
  name:string
  price_usd:number
  price_bs:number
  stock_exact:number|null
  availability:'available'|'out'|null
  image_url:string|null
  gallery_urls:string[]
}

export type PublicGroup = {
  source_product_id:number
  source_group_id:number|null
  group_code:string
  sku:string
  name:string
  description:string
  category:string
  subcategory:string
  brand:string
  model:string
  features:string
  featured:boolean
  price_usd:number
  price_usd_max:number
  price_bs:number
  price_bs_max:number
  has_price_range:boolean
  stock_exact:number|null
  availability:'available'|'out'|null
  image_url:string|null
  gallery_urls:string[]
  updated_at:string
  variant_count:number
  variant_labels:string[]
  variants:PublicVariant[]
}

function n(v:unknown){const x=Number(v);return Number.isFinite(x)?x:0}
function s(v:unknown){return typeof v==='string'?v:''}
function attrs(v:unknown):Record<string,unknown>{return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{} }

export function rowGroupKey(r:CatalogRow){
  return r.source_group_id&&Number.isInteger(Number(r.source_group_id))?`g:${r.source_group_id}`:`p:${r.source_product_id}`
}

function publicStock(policy:CatalogTenantPolicy,stock:number){
  if(policy.show_stock_mode==='exact')return Math.max(0,Math.trunc(stock))
  return null
}
function publicAvailability(policy:CatalogTenantPolicy,stock:number):'available'|'out'|null{
  if(policy.show_stock_mode==='hidden')return null
  return stock>0?'available':'out'
}

export function buildPublicGroups(rows:CatalogRow[],policy:CatalogTenantPolicy):PublicGroup[]{
  const buckets=new Map<string,CatalogRow[]>()
  for(const r of rows){
    const key=rowGroupKey(r)
    const arr=buckets.get(key)||[]
    arr.push(r)
    buckets.set(key,arr)
  }
  const out:PublicGroup[]=[]
  for(const arr0 of buckets.values()){
    let arr=arr0.slice().sort((a,b)=>{
      const ao=n(a.stock_exact)>0?0:1,bo=n(b.stock_exact)>0?0:1
      return ao-bo || s(a.variant_label).localeCompare(s(b.variant_label),'es',{numeric:true}) || a.source_product_id-b.source_product_id
    })
    if(policy.hide_out_of_stock)arr=arr.filter(x=>n(x.stock_exact)>0)
    if(!arr.length)continue
    const repCandidates=arr.slice().sort((a,b)=>a.source_product_id-b.source_product_id)
    const rep=repCandidates.find(x=>n(x.stock_exact)>0&&x.image_url)||repCandidates.find(x=>!!x.image_url)||repCandidates[0]
    const prices=arr.map(x=>n(x.price_usd)),pricesBs=arr.map(x=>n(x.price_bs))
    const min=Math.min(...prices),max=Math.max(...prices),minBs=Math.min(...pricesBs),maxBs=Math.max(...pricesBs)
    const stock=arr.reduce((sum,x)=>sum+Math.max(0,Math.trunc(n(x.stock_exact))),0)
    const updated=arr.map(x=>s(x.updated_at)).filter(Boolean).sort().at(-1)||s(rep.updated_at)
    const variants:PublicVariant[]=arr.map(x=>({
      source_product_id:x.source_product_id,
      sku:s(x.sku),
      label:s(x.variant_label)||s(x.variant_name)||s(x.sku),
      attributes:attrs(x.variant_attributes),
      name:s(x.variant_name)||s(x.name),
      price_usd:n(x.price_usd),
      price_bs:n(x.price_bs),
      stock_exact:publicStock(policy,n(x.stock_exact)),
      availability:publicAvailability(policy,n(x.stock_exact)),
      image_url:x.image_url||null,
      gallery_urls:Array.isArray(x.gallery_urls)&&x.gallery_urls.length?x.gallery_urls:(x.image_url?[x.image_url]:[])
    }))
    out.push({
      source_product_id:rep.source_product_id,
      source_group_id:rep.source_group_id?Number(rep.source_group_id):null,
      group_code:s(rep.group_code),
      sku:s(rep.sku),
      name:s(rep.name)||s(rep.group_name)||s(rep.variant_name),
      description:s(rep.description),category:s(rep.category),subcategory:s(rep.subcategory),brand:s(rep.brand),model:s(rep.model),features:s(rep.features),
      featured:arr.some(x=>!!x.featured),
      price_usd:min,price_usd_max:max,price_bs:minBs,price_bs_max:maxBs,has_price_range:Math.abs(max-min)>0.004,
      stock_exact:publicStock(policy,stock),availability:publicAvailability(policy,stock),image_url:rep.image_url||null,gallery_urls:Array.isArray(rep.gallery_urls)&&rep.gallery_urls.length?rep.gallery_urls:(rep.image_url?[rep.image_url]:[]),updated_at:updated,
      variant_count:variants.length,variant_labels:variants.map(v=>v.label).filter(Boolean),variants
    })
  }
  return out
}

export function buildSofiaGroups(rows:CatalogRow[]){
  const buckets=new Map<string,CatalogRow[]>()
  for(const r of rows){const key=rowGroupKey(r);const arr=buckets.get(key)||[];arr.push(r);buckets.set(key,arr)}
  return [...buckets.values()].map(arr0=>{
    const arr=arr0.slice().sort((a,b)=>s(a.variant_label).localeCompare(s(b.variant_label),'es',{numeric:true})||a.source_product_id-b.source_product_id)
    const repCandidates=arr.slice().sort((a,b)=>a.source_product_id-b.source_product_id)
    const rep=repCandidates.find(x=>n(x.stock_exact)>0&&x.image_url)||repCandidates.find(x=>!!x.image_url)||repCandidates[0]
    const prices=arr.map(x=>n(x.price_usd)),stock=arr.reduce((sum,x)=>sum+Math.max(0,Math.trunc(n(x.stock_exact))),0)
    return {
      source_product_id:rep.source_product_id,
      source_group_id:rep.source_group_id?Number(rep.source_group_id):null,
      group_code:s(rep.group_code),
      name:s(rep.name)||s(rep.group_name)||s(rep.variant_name),
      description:s(rep.description),category:s(rep.category),subcategory:s(rep.subcategory),brand:s(rep.brand),model:s(rep.model),features:s(rep.features),
      aliases:s(rep.sofia_aliases),tags:s(rep.sofia_tags),notes:s(rep.sofia_notes),price_divisas:rep.sofia_price_divisas===null?null:n(rep.sofia_price_divisas),rules:attrs(rep.sofia_rules_json),
      price_usd:Math.min(...prices),price_usd_max:Math.max(...prices),stock_exact:stock,availability:stock>0?'available':'out',image_url:rep.image_url||null,gallery_urls:Array.isArray(rep.gallery_urls)&&rep.gallery_urls.length?rep.gallery_urls:(rep.image_url?[rep.image_url]:[]),
      variant_count:arr.length,
      variants:arr.map(x=>({
        source_product_id:x.source_product_id,sku:s(x.sku),label:s(x.variant_label)||s(x.variant_name)||s(x.sku),attributes:attrs(x.variant_attributes),name:s(x.variant_name)||s(x.name),
        price_usd:n(x.price_usd),price_bs:n(x.price_bs),stock_exact:Math.max(0,Math.trunc(n(x.stock_exact))),availability:n(x.stock_exact)>0?'available':'out',image_url:x.image_url||null,gallery_urls:Array.isArray(x.gallery_urls)&&x.gallery_urls.length?x.gallery_urls:(x.image_url?[x.image_url]:[])
      }))
    }
  })
}

export function groupMatchesPrice(g:PublicGroup,minPrice:number|null,maxPrice:number|null){
  if(minPrice!==null&&g.price_usd_max<minPrice)return false
  if(maxPrice!==null&&g.price_usd>maxPrice)return false
  return true
}
