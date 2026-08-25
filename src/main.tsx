import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {
  Search,PackageSearch,ExternalLink,MessageCircle,ChevronLeft,ChevronRight,
  SlidersHorizontal,X,ArrowLeft,Share2,MapPin,Instagram,Globe2,
  Sparkles,Tag,CheckCircle2,Boxes,Menu,ChevronDown,Store,Clock3,
  ShieldCheck,RefreshCw,ArrowRight,Grid3X3,ShoppingBag,Heart,Plus,Minus,
  Trash2,Copy,Check,Truck,Headphones,ShoppingCart,History,Star,Layers3,
  Zap,ChevronUp,PackageCheck,SearchX,BadgeCheck,Info,LoaderCircle
} from 'lucide-react'
import './styles.css'

const CUYRA_PHONE='584125477119'
const CUYRA_LABEL='CUYRA Catalog'
const CUYRA_TAGLINE='Catálogos empresariales conectados en tiempo real'

type Tenant={
  slug:string;public_name:string;phone:string;website:string;accent_color:string;
  show_stock_mode:'exact'|'status'|'hidden';hide_out_of_stock:boolean;rate_bs_per_usd:number;rate_source:string;
  updated_at?:string;logo_url?:string|null;hero_title?:string;hero_subtitle?:string;announcement?:string;
  catalog_theme?:'retail'|'minimal'|'bold';show_brand_filter?:boolean;show_category_nav?:boolean;
  instagram_url?:string;location_text?:string
}
type Variant={source_product_id:number;sku:string;label:string;attributes?:Record<string,unknown>;name?:string;price_usd:number;price_bs:number;stock_exact:number|null;availability:'available'|'out'|null;image_url:string|null;gallery_urls?:string[]}
type Product={
  source_product_id:number;source_group_id?:number|null;group_code?:string;sku:string;name:string;description?:string;category?:string;subcategory?:string;
  brand?:string;model?:string;features?:string;featured?:boolean;price_usd:number;price_usd_max?:number;price_bs:number;price_bs_max?:number;has_price_range?:boolean;
  stock_exact:number|null;availability:'available'|'out'|null;image_url:string|null;gallery_urls?:string[];updated_at?:string;variant_count?:number;variant_labels?:string[];variants?:Variant[]
}
type CatalogResult={
  ok:boolean;tenant:Tenant;products:Product[];
  facets:{categories:string[];subcategories:string[];brands:string[];priceRange:{min:number;max:number}};
  page:number;pages:number;total:number
}
type ProductResult={ok:boolean;tenant:Tenant;product:Product;related:Product[]}
type NavFacets={categories:string[];brands:string[]}
type StoredProduct={id:number;name:string;sku:string;brand?:string;model?:string;priceUsd:number;priceBs:number;imageUrl?:string|null;variantId?:number|null;variantLabel?:string;hasVariants?:boolean;url:string}
type OrderItem=StoredProduct&{qty:number}
type AnalyticsEvent='catalog_view'|'product_view'|'search'|'whatsapp_consult'|'whatsapp_order'|'share'|'favorite'|'category_view'|'add_to_list'

function pathInfo(){
  const product=location.pathname.match(/^\/(?:c|catalogo)\/([^/]+)\/p\/(\d+)/)
  if(product)return{slug:decodeURIComponent(product[1]),productId:Number(product[2])}
  const collection=location.pathname.match(/^\/(?:c|catalogo)\/([^/]+)/)
  return{slug:decodeURIComponent(collection?.[1]||new URLSearchParams(location.search).get('slug')||''),productId:null as number|null}
}
function money(v:number,currency='USD'){
  try{return new Intl.NumberFormat('es-VE',{style:'currency',currency,maximumFractionDigits:2}).format(v||0)}
  catch{return `$${Number(v||0).toFixed(2)}`}
}
function bs(v:number){return `Bs ${Number(v||0).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function phoneDigits(v=''){return v.replace(/\D/g,'')}
function normalizeWhatsAppPhone(v=''){
  let p=phoneDigits(v)
  if(!p)return ''
  if(p.startsWith('00'))p=p.slice(2)
  // Venezuela: convierte formatos locales 04XX... / 4XX... a E.164 para wa.me.
  if(/^0(?:4\d{9})$/.test(p))return `58${p.slice(1)}`
  if(/^4\d{9}$/.test(p))return `58${p}`
  return p
}
function productUrl(slug:string,id:number){return `/c/${encodeURIComponent(slug)}/p/${id}`}
function collectionUrl(slug:string,params:Record<string,string>={}){
  const q=new URLSearchParams(params).toString()
  return `/c/${encodeURIComponent(slug)}${q?`?${q}`:''}`
}
function stockLabel(tenant:Tenant,p:Product|Variant){
  if(tenant.show_stock_mode==='hidden')return ''
  if(tenant.show_stock_mode==='exact')return `${p.stock_exact??0} disponibles`
  return p.availability==='out'?'Agotado':'Disponible'
}
function isOut(p:Product|Variant){return p.availability==='out'||(typeof p.stock_exact==='number'&&p.stock_exact<=0)}
function featureLines(v=''){return v.split(/\r?\n/).map(x=>x.trim().replace(/^[•\-]\s*/,'' )).filter(Boolean).slice(0,24)}
function safeJson<T>(raw:string|null,fallback:T):T{try{return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}
function storageKey(kind:string,slug:string){return `cuyra.catalog.${kind}.${slug}`}
function loadFavorites(slug:string){return safeJson<StoredProduct[]>(localStorage.getItem(storageKey('favorites',slug)),[])}
function loadRecent(slug:string){return safeJson<StoredProduct[]>(localStorage.getItem(storageKey('recent',slug)),[])}
function loadOrder(slug:string){return safeJson<OrderItem[]>(localStorage.getItem(storageKey('order',slug)),[])}
function persist<T>(kind:string,slug:string,value:T){localStorage.setItem(storageKey(kind,slug),JSON.stringify(value))}
function snapshot(p:Product,slug:string,variant?:Variant|null):StoredProduct{
  return {id:p.source_product_id,name:p.name,sku:variant?.sku||p.sku,brand:p.brand,model:p.model,priceUsd:variant?.price_usd??p.price_usd,priceBs:variant?.price_bs??p.price_bs,imageUrl:variant?.image_url||p.image_url,variantId:variant?.source_product_id||null,variantLabel:variant?.label||'',hasVariants:(p.variant_count||1)>1,url:location.origin+productUrl(slug,p.source_product_id)}
}
function openWhatsApp(phone:string,text:string){const p=normalizeWhatsAppPhone(phone);return p?`https://wa.me/${p}?text=${encodeURIComponent(text)}`:''}
function cuyraLeadUrl(context='catálogo'){return openWhatsApp(CUYRA_PHONE,`Hola CUYRA, vi su solución de ${context} y quiero conocer más.`)}
function setMeta(name:string,content:string,property=false){
  const selector=property?`meta[property="${name}"]`:`meta[name="${name}"]`
  let el=document.head.querySelector(selector) as HTMLMetaElement|null
  if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',name);document.head.appendChild(el)}
  el.content=content
}
function setTenantManifest(slug=''){const link=document.querySelector('link[rel="manifest"]') as HTMLLinkElement|null;if(link)link.href=slug?`/api/catalog?manifest=1&slug=${encodeURIComponent(slug)}`:'/manifest.webmanifest'}
function setPageSeo(title:string,description:string,image?:string|null){
  document.title=title;setMeta('description',description);setMeta('og:title',title,true);setMeta('og:description',description,true);setMeta('og:url',location.href,true)
  if(image)setMeta('og:image',image,true)
}
function track(slug:string,event:AnalyticsEvent,data:Record<string,unknown>={}){
  if(!slug)return
  let referrer='';try{referrer=document.referrer?new URL(document.referrer).origin:''}catch{};const payload={slug,event,path:location.pathname,referrer,...data}
  fetch('/api/analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{})
}
function productPurchaseText(tenant:Tenant,p:Product,variant:Variant|null,qty=1){
  const sku=variant?.sku||p.sku,price=variant?.price_usd??p.price_usd,priceBs=variant?.price_bs??p.price_bs
  const variantLine=variant?.label?`\n• Variante: ${variant.label}`:''
  const stock=stockLabel(tenant,variant||p)
  const stockLine=stock?`\n• Disponibilidad: ${stock}`:''
  return `Hola ${tenant.public_name}, vengo del catálogo y quiero pedir este producto:\n\n• Producto: ${p.name}\n• SKU: ${sku}${p.brand?`\n• Marca: ${p.brand}`:''}${p.model?`\n• Modelo: ${p.model}`:''}${variantLine}\n• Cantidad: ${qty}\n• Precio referencial: ${money(price)}${priceBs>0?` / ${bs(priceBs)}`:''}${stockLine}\n• Enlace: ${location.href}\n\nQuedo atento a confirmación, disponibilidad final y formas de pago. Gracias.\n\nOrigen: CUYRA Catalog`
}
function availabilityText(tenant:Tenant,p:Product,variant:Variant|null){
  return `Hola ${tenant.public_name}, vengo del catálogo y deseo consultar disponibilidad:\n\n• Producto: ${p.name}\n• SKU: ${variant?.sku||p.sku}${variant?.label?`\n• Variante: ${variant.label}`:''}\n• Enlace: ${location.href}\n\n¿Me confirman disponibilidad y condiciones? Gracias.\n\nOrigen: CUYRA Catalog`
}
function orderText(tenant:Tenant,items:OrderItem[]){
  const total=items.reduce((s,x)=>s+x.priceUsd*x.qty,0)
  const lines=items.map((x,i)=>`${i+1}. ${x.name}\n   SKU: ${x.sku}${x.variantLabel?`\n   Variante: ${x.variantLabel}`:''}\n   Cantidad: ${x.qty}\n   Precio ref.: ${money(x.priceUsd)}\n   Subtotal ref.: ${money(x.priceUsd*x.qty)}`).join('\n\n')
  return `Hola ${tenant.public_name}, vengo del catálogo y quiero solicitar este pedido:\n\n${lines}\n\nTotal referencial: ${money(total)}\n\nPor favor confirmen disponibilidad final, total y formas de pago. Gracias.\n\nOrigen: CUYRA Catalog`
}

function CuyraMark({compact=false,dark=false}:{compact?:boolean;dark?:boolean}){return <span className={`cuyra-brand ${compact?'compact':''}`}><img src={dark?'/cuyra-mark-on-dark.png':'/cuyra-mark.png'} alt=""/><span><b>CUYRA</b>{!compact&&<small>Catalog</small>}</span></span>}

function AnnouncementBar({tenant}:{tenant:Tenant|null}){
  const messages=useMemo(()=>{
    if(!tenant)return['CUYRA Catalog · Tecnología comercial conectada','Catálogos empresariales rápidos, claros y listos para vender','Convierte tu inventario en una vitrina comercial conectada']
    return [tenant.announcement,'Catálogo actualizado desde CUYRA','Compra asistida directamente por WhatsApp','Precios y disponibilidad sincronizados'].filter(Boolean) as string[]
  },[tenant])
  const[index,setIndex]=useState(0)
  useEffect(()=>{setIndex(0);if(messages.length<2)return;const id=setInterval(()=>setIndex(x=>(x+1)%messages.length),4200);return()=>clearInterval(id)},[messages])
  return <div className="announcement" style={tenant?{'--tenant-accent':tenant.accent_color||'#1368ff'} as React.CSSProperties:undefined}><div className="announcement-track"><Sparkles size={14}/><span key={`${index}-${messages[index]}`}>{messages[index]}</span></div>{messages.length>1&&<div className="announcement-dots">{messages.map((_,i)=><i key={i} className={i===index?'active':''}/>)}</div>}</div>
}

function useNavFacets(slug:string,enabled:boolean){
  const[nav,setNav]=useState<{facets:NavFacets;tenant:Tenant|null}>({facets:{categories:[],brands:[]},tenant:null})
  useEffect(()=>{
    if(!slug||!enabled)return
    let cancelled=false
    fetch(`/api/catalog?slug=${encodeURIComponent(slug)}&page=1&limit=1&sort=featured`)
      .then(r=>r.ok?r.json():null)
      .then((x:CatalogResult|null)=>{if(!cancelled&&x?.facets)setNav({facets:{categories:x.facets.categories||[],brands:x.facets.brands||[]},tenant:x.tenant||null})})
      .catch(()=>{})
    return()=>{cancelled=true}
  },[slug,enabled])
  return nav
}

type HeaderProps={tenant:Tenant|null;facets?:NavFacets;favoriteCount?:number;orderCount?:number;onFavorites?:()=>void;onOrder?:()=>void}
function Header({tenant,facets,favoriteCount=0,orderCount=0,onFavorites,onOrder}:HeaderProps){
  const[mobileOpen,setMobileOpen]=useState(false)
  const phone=phoneDigits(tenant?.phone||'')
  const slug=tenant?.slug||''
  const categories=facets?.categories||[]
  const brands=facets?.brands||[]
  return <>
    <AnnouncementBar tenant={tenant}/>
    <header className="top-wrap">
      <div className="top">
        <a className="brand" href={tenant?collectionUrl(tenant.slug):'/'}>
          {tenant?.logo_url?<img className="tenant-logo" src={tenant.logo_url} alt={tenant.public_name}/>:tenant?<div className="mark">{tenant.public_name.slice(0,1).toUpperCase()}</div>:<CuyraMark dark/>}
          {tenant&&<div><b>{tenant.public_name}</b><span>Catálogo Online · <em>Powered by CUYRA</em></span></div>}
        </a>

        {tenant&&<nav className="desktop-nav" aria-label="Navegación principal">
          <a href={`${collectionUrl(slug)}#productos`}>Productos</a>
          {tenant.show_category_nav!==false&&categories.length>0&&<details className="nav-dropdown"><summary>Categorías <ChevronDown size={14}/></summary><div className="nav-panel"><div className="nav-panel-title"><Grid3X3 size={16}/> Explorar categorías</div>{categories.slice(0,16).map(x=><a key={x} href={collectionUrl(slug,{category:x})}>{x}<ArrowRight size={13}/></a>)}</div></details>}
          {tenant.show_brand_filter!==false&&brands.length>0&&<details className="nav-dropdown"><summary>Marcas <ChevronDown size={14}/></summary><div className="nav-panel brand-panel"><div className="nav-panel-title"><Tag size={16}/> Comprar por marca</div>{brands.slice(0,18).map(x=><a key={x} href={collectionUrl(slug,{brand:x})}>{x}<ArrowRight size={13}/></a>)}</div></details>}
          <a href={collectionUrl(slug,{sort:'newest'})}>Novedades</a>
        </nav>}

        <div className="top-actions">
          {tenant?.instagram_url&&<a className="icon-link optional-action" href={tenant.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a>}
          {tenant?.website&&<a className="icon-link optional-action" href={tenant.website} target="_blank" rel="noreferrer" aria-label="Sitio web"><Globe2 size={17}/></a>}
          {tenant&&<a className="icon-link" href={`${collectionUrl(slug)}#catalog-search`} aria-label="Buscar productos"><Search size={18}/></a>}
          {tenant&&<button className="icon-link badge-action" onClick={onFavorites} aria-label="Favoritos"><Heart size={18}/>{favoriteCount>0&&<b>{favoriteCount}</b>}</button>}
          {tenant&&<button className="icon-link badge-action" onClick={onOrder} aria-label="Lista de pedido"><ShoppingBag size={18}/>{orderCount>0&&<b>{orderCount}</b>}</button>}
          {phone&&<a className="header-cta" href={openWhatsApp(phone,`Hola ${tenant?.public_name||''}, vengo del catálogo y quisiera recibir atención.`)} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Contactar</a>}
          {tenant&&<button className="menu-toggle" onClick={()=>setMobileOpen(true)} aria-label="Abrir menú"><Menu size={21}/></button>}
        </div>
      </div>
    </header>

    {mobileOpen&&<div className="mobile-nav-backdrop" onClick={()=>setMobileOpen(false)}><aside className="mobile-nav" onClick={(e:any)=>e.stopPropagation()}>
      <div className="mobile-nav-head"><div><span>Catálogo</span><b>{tenant?.public_name}</b></div><button onClick={()=>setMobileOpen(false)}><X/></button></div>
      <a href={`${collectionUrl(slug)}#productos`} onClick={()=>setMobileOpen(false)}>Todos los productos <ArrowRight size={16}/></a>
      <a href={collectionUrl(slug,{sort:'newest'})}>Novedades <Clock3 size={16}/></a>
      <button className="mobile-inline-action" onClick={()=>{setMobileOpen(false);onFavorites?.()}}><Heart size={16}/> Favoritos {favoriteCount>0&&<b>{favoriteCount}</b>}</button>
      <button className="mobile-inline-action" onClick={()=>{setMobileOpen(false);onOrder?.()}}><ShoppingBag size={16}/> Lista de pedido {orderCount>0&&<b>{orderCount}</b>}</button>
      {tenant?.show_category_nav!==false&&categories.length>0&&<div className="mobile-nav-group"><span>Categorías</span>{categories.slice(0,12).map(x=><a key={x} href={collectionUrl(slug,{category:x})}>{x}</a>)}</div>}
      {tenant?.show_brand_filter!==false&&brands.length>0&&<div className="mobile-nav-group"><span>Marcas</span>{brands.slice(0,12).map(x=><a key={x} href={collectionUrl(slug,{brand:x})}>{x}</a>)}</div>}
      {phone&&<a className="mobile-wa" href={openWhatsApp(phone,`Hola ${tenant?.public_name||''}, vengo del catálogo y quisiera recibir atención.`)} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Hablar por WhatsApp</a>}
      <a className="powered-mobile" href={cuyraLeadUrl('catálogo digital')} target="_blank" rel="noreferrer"><CuyraMark compact/> Tecnología por CUYRA</a>
    </aside></div>}
  </>
}

function CuyraLanding(){
  useEffect(()=>{setTenantManifest('');setPageSeo('CUYRA Catalog · Catálogos empresariales conectados','Convierte inventario, precios y productos en un catálogo digital profesional conectado a CUYRA.')},[])
  return <div className="app no-tenant-app">
    <Header tenant={null}/>
    <main className="cuyra-landing">
      <section className="cuyra-hero">
        <div className="cuyra-hero-copy"><span className="eyebrow"><Zap size={14}/> CUYRA CATALOG</span><h1>Tu catálogo digital, <em>conectado a tu operación.</em></h1><p>Una experiencia comercial premium para mostrar productos, precios y disponibilidad sin duplicar trabajo. CUYRA conecta tu inventario con una vitrina lista para vender.</p><div className="hero-actions"><a className="hero-primary" href={cuyraLeadUrl('CUYRA Catalog')} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Solicitar información</a><a className="hero-secondary" href="#que-es">Ver cómo funciona <ArrowRight size={16}/></a></div><div className="cuyra-hero-pills"><span><RefreshCw/> Sincronización</span><span><ShoppingBag/> Catálogo comercial</span><span><MessageCircle/> WhatsApp</span></div></div>
        <div className="cuyra-hero-visual" aria-hidden="true"><div className="glass-orbit orbit-one"/><div className="glass-orbit orbit-two"/><div className="platform-card main"><CuyraMark dark/><strong>Catálogo conectado</strong><span>Productos · variantes · precios · disponibilidad</span></div><div className="platform-card floating"><BadgeCheck/><b>White-label</b><span>La marca del cliente es protagonista</span></div><div className="platform-card floating second"><Zap/><b>Listo para vender</b><span>Pedidos y consultas por WhatsApp</span></div></div>
      </section>
      <section className="cuyra-thin-banner"><span><RefreshCw/> Datos conectados</span><span><Layers3/> Personalización por empresa</span><span><ShoppingCart/> Pedido asistido</span><span><ShieldCheck/> Plataforma CUYRA</span></section>
      <section className="landing-features" id="que-es"><div className="section-heading-row"><div><span className="section-kicker">UNA PLATAFORMA, MUCHAS MARCAS</span><h2>Hecho para que tu empresa sea la protagonista</h2></div></div><div className="trust-grid"><article><div className="trust-icon"><Store/></div><h3>Identidad propia</h3><p>Logo, colores, mensajes y contacto de cada empresa dentro de una experiencia premium.</p></article><article><div className="trust-icon"><RefreshCw/></div><h3>Información actualizada</h3><p>Productos, variantes, precios y disponibilidad reflejados desde el ecosistema CUYRA.</p></article><article><div className="trust-icon"><MessageCircle/></div><h3>Venta conversacional</h3><p>Pedidos organizados y consultas estructuradas para cerrar la venta por WhatsApp.</p></article><article><div className="trust-icon"><Zap/></div><h3>Experiencia moderna</h3><p>Búsqueda rápida, favoritos, lista de pedido, responsive y navegación comercial.</p></article></div></section>
      <section className="landing-cta"><div><span>¿Quieres una solución como esta?</span><h2>Convierte tu inventario en una experiencia comercial.</h2></div><a href={cuyraLeadUrl('CUYRA Catalog')} target="_blank" rel="noreferrer">Hablar con CUYRA <ArrowRight/></a></section>
    </main>
    <Footer tenant={null}/>
  </div>
}

function SearchSuggestions({slug,q,open,onPick}:{slug:string;q:string;open:boolean;onPick:()=>void}){
  const[items,setItems]=useState<Product[]>([]),[loading,setLoading]=useState(false)
  useEffect(()=>{
    const value=q.trim();if(!open||value.length<2){setItems([]);return}
    let cancelled=false;setLoading(true)
    const t=setTimeout(()=>fetch(`/api/catalog?slug=${encodeURIComponent(slug)}&page=1&limit=6&sort=featured&q=${encodeURIComponent(value)}`).then(r=>r.ok?r.json():null).then((x:CatalogResult|null)=>{if(!cancelled)setItems(x?.products||[])}).catch(()=>{}).finally(()=>{if(!cancelled)setLoading(false)}),180)
    return()=>{cancelled=true;clearTimeout(t)}
  },[slug,q,open])
  if(!open||q.trim().length<2)return null
  return <div className="search-suggestions" role="listbox">{loading&&<div className="suggestion-loading"><LoaderCircle className="spin"/> Buscando...</div>}{!loading&&items.length===0&&<div className="suggestion-empty"><SearchX/> No encontramos coincidencias rápidas.</div>}{items.map(p=><a key={p.source_product_id} href={productUrl(slug,p.source_product_id)} onClick={onPick}><span className="suggestion-thumb">{p.image_url?<img src={p.image_url} alt=""/>:<PackageSearch/>}</span><span><b>{p.name}</b><small>{p.brand||p.category||'Producto'} · {p.sku}</small></span><strong>{money(p.price_usd)}</strong></a>)}</div>
}

function TrustGrid({tenant}:{tenant:Tenant}){return <section className="trust-section"><div className="section-heading-row"><div><span className="section-kicker">COMPRA CON CONFIANZA</span><h2>Una experiencia clara de principio a fin</h2></div></div><div className="trust-grid"><article><div className="trust-icon"><BadgeCheck/></div><h3>Información confiable</h3><p>Datos comerciales sincronizados desde CUYRA según la configuración de {tenant.public_name}.</p></article><article><div className="trust-icon"><Truck/></div><h3>Compra asistida</h3><p>Consulta condiciones, entrega y disponibilidad directamente con la empresa.</p></article><article><div className="trust-icon"><Headphones/></div><h3>Soporte en tiempo real</h3><p>Habla por WhatsApp con el equipo comercial sin formularios innecesarios.</p></article><article><div className="trust-icon"><ShieldCheck/></div><h3>Pedido sin fricción</h3><p>Arma una lista con productos, variantes y cantidades antes de enviar tu solicitud.</p></article></div></section>}

function ProductCard({tenant,product:p,isFavorite,onFavorite,onAdd}:{tenant:Tenant;product:Product;isFavorite:boolean;onFavorite:(p:Product)=>void;onAdd:(p:Product)=>void}){
  const phone=phoneDigits(tenant.phone||''),out=isOut(p)
  const consult=`Hola ${tenant.public_name}, vengo del catálogo y deseo consultar:\n\n• Producto: ${p.name}\n• SKU: ${p.sku}\n• Enlace: ${location.origin+productUrl(tenant.slug,p.source_product_id)}\n\n¿Me confirman disponibilidad? Gracias.\n\nOrigen: CUYRA Catalog`
  return <article className={`product-card ${out?'is-out':''}`}>
    <div className="product-media-wrap">
      <a className="product-image" href={productUrl(tenant.slug,p.source_product_id)} onClick={()=>track(tenant.slug,'product_view',{productId:p.source_product_id,source:'card'})}>{p.image_url?<img src={p.image_url} alt={p.name} loading="lazy" decoding="async"/>:<PackageSearch/>}</a>
      <div className="card-badges">{p.featured&&<span className="featured-badge"><Star size={11}/> Destacado</span>}{tenant.show_stock_mode!=='hidden'&&<span className={out?'stock-badge out':'stock-badge'}>{stockLabel(tenant,p)}</span>}</div>
      <button className={`favorite-btn ${isFavorite?'active':''}`} onClick={()=>onFavorite(p)} aria-label={isFavorite?'Quitar de favoritos':'Agregar a favoritos'}><Heart size={18} fill={isFavorite?'currentColor':'none'}/></button>
    </div>
    <div className="product-copy">
      <div className="product-meta"><span>{p.brand||p.category||'Producto'}</span>{p.model&&<small>{p.model}</small>}</div>
      <a className="product-name" href={productUrl(tenant.slug,p.source_product_id)}>{p.name}</a>
      <div className="product-sku">{(p.variant_count||1)>1?<><Layers3 size={12}/>{p.variant_count} variantes</>:<>SKU {p.sku}</>}</div>
      {(p.variant_count||1)>1&&p.variant_labels?.length?<div className="variant-preview">{p.variant_labels.slice(0,2).map(x=><span key={x}>{x}</span>)}{p.variant_labels.length>2&&<small>+{p.variant_labels.length-2}</small>}</div>:<div className="variant-preview-spacer"/>}
      <div className="prices"><strong>{p.has_price_range?'Desde ':''}{money(p.price_usd)}</strong>{p.price_bs>0&&<span>{p.has_price_range?'Desde ':''}{bs(p.price_bs)}</span>}</div>
      <div className="card-actions"><a className="details-btn" href={productUrl(tenant.slug,p.source_product_id)}>Ver producto <ArrowRight size={14}/></a><button className="add-list-btn" onClick={()=>{if((p.variant_count||1)>1){location.href=productUrl(tenant.slug,p.source_product_id);return}onAdd(p)}} title={(p.variant_count||1)>1?'Elegir variante':'Agregar a lista'}>{(p.variant_count||1)>1?<Layers3 size={17}/>:<Plus size={17}/>}</button>{phone&&<a className="quick-whatsapp" target="_blank" rel="noreferrer" aria-label="Consultar por WhatsApp" href={openWhatsApp(phone,consult)} onClick={()=>track(tenant.slug,'whatsapp_consult',{productId:p.source_product_id,source:'card'})}><MessageCircle size={17}/></a>}</div>
    </div>
  </article>
}

function OrderDrawer({tenant,items,onClose,onChange,onRemove}:{tenant:Tenant;items:OrderItem[];onClose:()=>void;onChange:(id:number,qty:number,variantId?:number|null)=>void;onRemove:(id:number,variantId?:number|null)=>void}){
  const total=items.reduce((s,x)=>s+x.priceUsd*x.qty,0),count=items.reduce((s,x)=>s+x.qty,0),phone=phoneDigits(tenant.phone||'')
  return <div className="drawer-backdrop commerce-backdrop" onClick={onClose}><aside className="commerce-drawer" onClick={(e:any)=>e.stopPropagation()}><div className="commerce-head"><div><span>LISTA DE PEDIDO</span><h3>{count?`${count} producto${count===1?'':'s'}`:'Tu lista está vacía'}</h3></div><button onClick={onClose}><X/></button></div>{items.length===0?<div className="commerce-empty"><ShoppingBag/><b>Agrega productos para armar tu pedido</b><p>Puedes combinar productos, variantes y cantidades antes de escribir por WhatsApp.</p></div>:<><div className="order-items">{items.map(x=><article key={`${x.id}-${x.variantId||0}`}><div className="order-thumb">{x.imageUrl?<img src={x.imageUrl} alt=""/>:<PackageSearch/>}</div><div className="order-copy"><b>{x.name}</b><small>SKU {x.sku}{x.variantLabel?` · ${x.variantLabel}`:''}</small><strong>{money(x.priceUsd)}</strong><div className="qty-control"><button onClick={()=>onChange(x.id,Math.max(1,x.qty-1),x.variantId)}><Minus/></button><span>{x.qty}</span><button onClick={()=>onChange(x.id,x.qty+1,x.variantId)}><Plus/></button></div></div><button className="remove-item" onClick={()=>onRemove(x.id,x.variantId)} aria-label="Quitar"><Trash2/></button></article>)}</div><div className="order-summary"><span>Total referencial</span><strong>{money(total)}</strong><small>El precio y la disponibilidad final los confirma {tenant.public_name}.</small></div>{phone&&<a className="drawer-primary" href={openWhatsApp(phone,orderText(tenant,items))} target="_blank" rel="noreferrer" onClick={()=>track(tenant.slug,'whatsapp_order',{items:items.length,total})}><MessageCircle/> Pedir lista por WhatsApp</a>}<button className="drawer-secondary" onClick={onClose}>Seguir explorando</button></>}</aside></div>
}

function FavoritesDrawer({tenant,items,onClose,onRemove,onAdd}:{tenant:Tenant;items:StoredProduct[];onClose:()=>void;onRemove:(id:number)=>void;onAdd:(p:StoredProduct)=>void}){
  return <div className="drawer-backdrop commerce-backdrop" onClick={onClose}><aside className="commerce-drawer" onClick={(e:any)=>e.stopPropagation()}><div className="commerce-head"><div><span>FAVORITOS</span><h3>{items.length?`${items.length} guardado${items.length===1?'':'s'}`:'Aún no tienes favoritos'}</h3></div><button onClick={onClose}><X/></button></div>{items.length===0?<div className="commerce-empty"><Heart/><b>Guarda lo que te interesa</b><p>Los favoritos quedan guardados en este dispositivo.</p></div>:<div className="favorite-items">{items.map(x=><article key={x.id}><a className="order-thumb" href={productUrl(tenant.slug,x.id)}>{x.imageUrl?<img src={x.imageUrl} alt=""/>:<PackageSearch/>}</a><div className="order-copy"><a href={productUrl(tenant.slug,x.id)}><b>{x.name}</b></a><small>SKU {x.sku}</small><strong>{money(x.priceUsd)}</strong>{x.hasVariants&&!x.variantId?<a className="mini-add" href={productUrl(tenant.slug,x.id)}><Layers3/> Elegir variante</a>:<button className="mini-add" onClick={()=>onAdd(x)}><Plus/> Agregar a lista</button>}</div><button className="remove-item" onClick={()=>onRemove(x.id)}><Trash2/></button></article>)}</div>}</aside></div>
}

function RecentStrip({tenant,items,onFavorite,onAdd,favoriteIds}:{tenant:Tenant;items:StoredProduct[];onFavorite:(x:StoredProduct)=>void;onAdd:(x:StoredProduct)=>void;favoriteIds:Set<number>}){
  if(!items.length)return null
  return <section className="recent-section"><div className="section-heading-row"><div><span className="section-kicker">CONTINÚA EXPLORANDO</span><h2>Vistos recientemente</h2></div></div><div className="recent-rail">{items.slice(0,6).map(x=><article key={x.id}><a href={productUrl(tenant.slug,x.id)} className="recent-thumb">{x.imageUrl?<img src={x.imageUrl} alt=""/>:<PackageSearch/>}</a><div><a href={productUrl(tenant.slug,x.id)}><b>{x.name}</b></a><strong>{money(x.priceUsd)}</strong></div><div className="recent-actions"><button className={favoriteIds.has(x.id)?'active':''} onClick={()=>onFavorite(x)}><Heart fill={favoriteIds.has(x.id)?'currentColor':'none'}/></button><button onClick={()=>onAdd(x)}><Plus/></button></div></article>)}</div></section>
}

function Storefront({slug}:{slug:string}){
  const urlParams=new URLSearchParams(location.search)
  const[data,setData]=useState<CatalogResult|null>(null),[q,setQ]=useState(()=>urlParams.get('q')||''),[search,setSearch]=useState(()=>urlParams.get('q')||''),
    [category,setCategory]=useState(()=>urlParams.get('category')||''),[subcategory,setSubcategory]=useState(()=>urlParams.get('subcategory')||''),[brand,setBrand]=useState(()=>urlParams.get('brand')||''),
    [availability,setAvailability]=useState(()=>urlParams.get('availability')||''),[sort,setSort]=useState(()=>urlParams.get('sort')||'featured'),[page,setPage]=useState(1),
    [error,setError]=useState(''),[loading,setLoading]=useState(true),[filtersOpen,setFiltersOpen]=useState(false),[searchFocus,setSearchFocus]=useState(false),
    [favorites,setFavorites]=useState<StoredProduct[]>([]),[order,setOrder]=useState<OrderItem[]>([]),[recent,setRecent]=useState<StoredProduct[]>([]),[favoritesOpen,setFavoritesOpen]=useState(false),[orderOpen,setOrderOpen]=useState(false)

  useEffect(()=>{const t=setTimeout(()=>setSearch(q.trim()),260);return()=>clearTimeout(t)},[q])
  useEffect(()=>setPage(1),[search,category,subcategory,brand,availability,sort])
  useEffect(()=>{setFavorites(loadFavorites(slug));setOrder(loadOrder(slug));setRecent(loadRecent(slug))},[slug])
  useEffect(()=>{
    setLoading(true);setError('')
    const p=new URLSearchParams({slug,page:String(page),limit:'24',sort})
    if(search)p.set('q',search);if(category)p.set('category',category);if(subcategory)p.set('subcategory',subcategory)
    if(brand)p.set('brand',brand);if(availability)p.set('availability',availability)
    fetch(`/api/catalog?${p}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo abrir el catálogo');return x})
      .then((x:CatalogResult)=>{setData(x);setTenantManifest(slug);setPageSeo(`${x.tenant.public_name} · Catálogo Online`,x.tenant.hero_subtitle||`Explora productos, precios y disponibilidad de ${x.tenant.public_name}.`,x.tenant.logo_url);track(slug,'catalog_view',{total:x.total})})
      .catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false))
  },[slug,search,category,subcategory,brand,availability,sort,page])
  useEffect(()=>{if(search.length>=2)track(slug,'search',{q:search.slice(0,100)})},[slug,search])

  const tenant=data?.tenant||null,accent=tenant?.accent_color||'#1368ff'
  const activeFilters=[category,subcategory,brand,tenant?.show_stock_mode==='hidden'?'':availability].filter(Boolean).length
  const heroTitle=tenant?.hero_title||tenant?.public_name||'Encuentra lo que buscas'
  const heroSubtitle=tenant?.hero_subtitle||'Explora productos, precios y disponibilidad actualizados directamente desde CUYRA.'
  const phone=phoneDigits(tenant?.phone||'')
  const navFacets={categories:data?.facets.categories||[],brands:data?.facets.brands||[]}
  const favoriteIds=useMemo(()=>new Set(favorites.map(x=>x.id)),[favorites])
  const orderCount=order.reduce((s,x)=>s+x.qty,0)
  const clearAll=()=>{setCategory('');setSubcategory('');setBrand('');setAvailability('');setQ('')}
  const toggleFavoriteProduct=(p:Product)=>{const snap=snapshot(p,slug);setFavorites(old=>{const exists=old.some(x=>x.id===p.source_product_id);const next=exists?old.filter(x=>x.id!==p.source_product_id):[snap,...old].slice(0,60);persist('favorites',slug,next);if(!exists)track(slug,'favorite',{productId:p.source_product_id});return next})}
  const toggleFavoriteStored=(x:StoredProduct)=>setFavorites(old=>{const exists=old.some(y=>y.id===x.id);const next=exists?old.filter(y=>y.id!==x.id):[x,...old].slice(0,60);persist('favorites',slug,next);return next})
  const addStoredToOrder=(x:StoredProduct)=>setOrder(old=>{const idx=old.findIndex(y=>y.id===x.id&&y.variantId===x.variantId);let next:OrderItem[];if(idx>=0)next=old.map((y,i)=>i===idx?{...y,qty:y.qty+1}:y);else next=[...old,{...x,qty:1}];persist('order',slug,next);track(slug,'add_to_list',{productId:x.id});return next})
  const addProductToOrder=(p:Product)=>addStoredToOrder(snapshot(p,slug))
  const changeQty=(id:number,qty:number,variantId?:number|null)=>setOrder(old=>{const next=old.map(x=>x.id===id&&(x.variantId||null)===(variantId||null)?{...x,qty:Math.max(1,qty)}:x);persist('order',slug,next);return next})
  const removeOrder=(id:number,variantId?:number|null)=>setOrder(old=>{const next=old.filter(x=>!(x.id===id&&(x.variantId||null)===(variantId||null)));persist('order',slug,next);return next})
  const removeFavorite=(id:number)=>setFavorites(old=>{const next=old.filter(x=>x.id!==id);persist('favorites',slug,next);return next})
  const activeChips=[category&&{label:category,clear:()=>{setCategory('');setSubcategory('')}},subcategory&&{label:subcategory,clear:()=>setSubcategory('')},brand&&{label:brand,clear:()=>setBrand('')},availability&&tenant?.show_stock_mode!=='hidden'&&{label:availability==='available'?'Disponibles':'Agotados',clear:()=>setAvailability('')}].filter(Boolean) as {label:string;clear:()=>void}[]

  const filters=<>
    <div className="filter-group"><label>Categoría</label><select value={category} onChange={(e:any)=>{setCategory(e.target.value);setSubcategory('');if(e.target.value)track(slug,'category_view',{category:e.target.value})}}><option value="">Todas</option>{data?.facets.categories.map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="filter-group"><label>Subcategoría</label><select value={subcategory} onChange={(e:any)=>setSubcategory(e.target.value)}><option value="">Todas</option>{data?.facets.subcategories.map(x=><option key={x}>{x}</option>)}</select></div>
    {tenant?.show_brand_filter!==false&&<div className="filter-group"><label>Marca</label><select value={brand} onChange={(e:any)=>setBrand(e.target.value)}><option value="">Todas</option>{data?.facets.brands.map(x=><option key={x}>{x}</option>)}</select></div>}
    {tenant?.show_stock_mode!=='hidden'&&<div className="filter-group"><label>Disponibilidad</label><select value={availability} onChange={(e:any)=>setAvailability(e.target.value)}><option value="">Todos</option><option value="available">Disponibles</option><option value="out">Agotados</option></select></div>}
    <button className="clear-filters" onClick={clearAll}>Limpiar filtros</button>
  </>

  return <div className={`app theme-${tenant?.catalog_theme||'retail'}`} style={{'--accent':accent,'--tenant-accent':accent} as React.CSSProperties}>
    <Header tenant={tenant} facets={navFacets} favoriteCount={favorites.length} orderCount={orderCount} onFavorites={()=>setFavoritesOpen(true)} onOrder={()=>setOrderOpen(true)}/>
    <main>
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow"><Sparkles size={13}/> CATÁLOGO ACTUALIZADO</span><h1>{heroTitle}</h1><p>{heroSubtitle}</p><div className="hero-actions"><a className="hero-primary" href="#productos"><ShoppingBag size={17}/> Explorar productos</a>{phone&&<a className="hero-secondary" href={openWhatsApp(phone,`Hola ${tenant?.public_name||''}, vengo del catálogo y quisiera asesoría para comprar.`)} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Consultar</a>}</div><div className="hero-meta">{tenant?.location_text&&<span><MapPin size={14}/>{tenant.location_text}</span>}{tenant&&tenant.rate_bs_per_usd>0&&<span><Tag size={14}/>{tenant.rate_source}: {Number(tenant.rate_bs_per_usd).toLocaleString('es-VE')} Bs/USD</span>}</div></div>
        <div className="hero-visual"><div className="hero-card"><div className="hero-card-icon"><Boxes/></div><strong>{data?.total??0}</strong><span>productos publicados</span><small>Explora la colección completa</small></div><div className="hero-mini mini-one"><RefreshCw/><span>Sincronizado con <b>CUYRA</b></span></div><div className="hero-mini mini-two"><ShieldCheck/><span>Disponibilidad visible</span></div><div className="hero-orb orb-a"/><div className="hero-orb orb-b"/></div>
      </section>

      <section className="store-benefits" aria-label="Beneficios del catálogo"><span><RefreshCw size={17}/><b>Información actualizada</b><small>Sincronizada con CUYRA</small></span><span><MessageCircle size={17}/><b>Compra asistida</b><small>Atención directa por WhatsApp</small></span><span><ShieldCheck size={17}/><b>Disponibilidad clara</b><small>Según configuración de la empresa</small></span><span><ShoppingBag size={17}/><b>Lista de pedido</b><small>Organiza varios productos antes de consultar</small></span></section>

      {tenant?.show_category_nav!==false&&data?.facets.categories.length?<section className="category-showcase"><div className="section-heading-row"><div><span className="section-kicker">EXPLORA</span><h2>Compra por categoría</h2></div><a href="#productos">Ver todos los productos <ArrowRight size={15}/></a></div><div className="category-cards">{data.facets.categories.slice(0,8).map((x,i)=><button key={x} className={category===x?'category-card active':'category-card'} onClick={()=>{setCategory(x);track(slug,'category_view',{category:x,source:'showcase'});document.getElementById('productos')?.scrollIntoView({behavior:'smooth'})}}><span className="category-index">{String(i+1).padStart(2,'0')}</span><span className="category-main"><b>{x}</b><small>Explorar productos</small></span><ArrowRight size={18}/></button>)}</div></section>:null}

      {tenant?.show_brand_filter!==false&&data?.facets.brands.length?<section className="brand-rail"><span>Marcas</span><div>{data.facets.brands.slice(0,20).map(x=><button className={brand===x?'active':''} key={x} onClick={()=>{setBrand(x);document.getElementById('productos')?.scrollIntoView({behavior:'smooth'})}}>{x}</button>)}</div></section>:null}

      {tenant&&<TrustGrid tenant={tenant}/>} 

      <section className="products-section" id="productos">
        <div className="products-title"><div><span className="section-kicker">CATÁLOGO</span><h2>{category||brand||'Todos los productos'}</h2></div><span className="product-count">{data?.total??0} resultados</span></div>
        <section className="catalog-toolbar" id="catalog-search">
          <div className={`search ${searchFocus?'focused':''}`}><Search size={19}/><input value={q} onFocus={()=>setSearchFocus(true)} onBlur={()=>setTimeout(()=>setSearchFocus(false),160)} onChange={(e:any)=>setQ(e.target.value)} placeholder="Buscar producto, SKU, marca o modelo..."/>{q&&<button className="search-clear" onClick={()=>setQ('')} aria-label="Limpiar búsqueda"><X/></button>}<SearchSuggestions slug={slug} q={q} open={searchFocus} onPick={()=>setSearchFocus(false)}/></div>
          <button className="mobile-filter" onClick={()=>setFiltersOpen(true)}><SlidersHorizontal size={17}/> Filtros {activeFilters>0&&<b>{activeFilters}</b>}</button>
          <select className="sort" value={sort} onChange={(e:any)=>setSort(e.target.value)}><option value="featured">Destacados</option><option value="newest">Más recientes</option><option value="price_asc">Precio: menor a mayor</option><option value="price_desc">Precio: mayor a menor</option><option value="name">Nombre A–Z</option></select>
        </section>
        {activeChips.length>0&&<div className="active-filters"><span>Filtros activos:</span>{activeChips.map(x=><button key={x.label} onClick={x.clear}>{x.label}<X/></button>)}<button className="clear-inline" onClick={clearAll}>Limpiar todo</button></div>}

        <div className="catalog-shell"><aside className="filters"><div className="filter-title"><SlidersHorizontal size={17}/> Filtrar productos</div>{filters}</aside><section className="results"><div className="results-head"><span>{data?.total??0} productos</span>{activeFilters>0&&<small>{activeFilters} filtro(s) activo(s)</small>}</div>{loading?<ProductSkeleton/>:error?<div className="state error"><Info/><strong>No pudimos cargar el catálogo</strong><span>{error}</span></div>:data?.products.length===0?<div className="state"><PackageSearch size={38}/><strong>No encontramos productos</strong><span>Prueba con otros filtros o términos de búsqueda.</span><button onClick={clearAll}>Ver todo el catálogo</button></div>:<div className="grid">{data?.products.map(p=><ProductCard key={`${p.source_group_id||'p'}-${p.source_product_id}`} tenant={data.tenant} product={p} isFavorite={favoriteIds.has(p.source_product_id)} onFavorite={toggleFavoriteProduct} onAdd={addProductToOrder}/>)}</div>}{data&&data.pages>1&&<div className="pager"><button disabled={page<=1} onClick={()=>setPage(x=>Math.max(1,x-1))}><ChevronLeft/> Anterior</button><span>Página {page} de {data.pages}</span><button disabled={page>=data.pages} onClick={()=>setPage(x=>Math.min(data.pages,x+1))}>Siguiente <ChevronRight/></button></div>}</section></div>
      </section>
      {tenant&&<RecentStrip tenant={tenant} items={recent} onFavorite={toggleFavoriteStored} onAdd={addStoredToOrder} favoriteIds={favoriteIds}/>} 
    </main>
    {filtersOpen&&<div className="drawer-backdrop" onClick={()=>setFiltersOpen(false)}><div className="filter-drawer" onClick={(e:any)=>e.stopPropagation()}><div className="drawer-head"><div><span>CATÁLOGO</span><strong>Filtrar productos</strong></div><button onClick={()=>setFiltersOpen(false)}><X/></button></div>{filters}</div></div>}
    {tenant&&favoritesOpen&&<FavoritesDrawer tenant={tenant} items={favorites} onClose={()=>setFavoritesOpen(false)} onRemove={removeFavorite} onAdd={addStoredToOrder}/>} 
    {tenant&&orderOpen&&<OrderDrawer tenant={tenant} items={order} onClose={()=>setOrderOpen(false)} onChange={changeQty} onRemove={removeOrder}/>} 
    {tenant&&orderCount>0&&<button className="floating-order" onClick={()=>setOrderOpen(true)}><ShoppingBag/><span>Lista</span><b>{orderCount}</b></button>}
    {phone&&<a className="floating-wa" href={openWhatsApp(phone,`Hola ${tenant?.public_name||''}, vengo del catálogo y quisiera recibir atención.`)} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp"><MessageCircle/></a>}
    <Footer tenant={tenant}/>
  </div>
}

function ProductDetail({slug,productId}:{slug:string;productId:number}){
  const[data,setData]=useState<ProductResult|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[selectedVariantId,setSelectedVariantId]=useState<number|null>(null),[qty,setQty]=useState(1),[copied,setCopied]=useState(false),[favorites,setFavorites]=useState<StoredProduct[]>([]),[order,setOrder]=useState<OrderItem[]>([]),[favoritesOpen,setFavoritesOpen]=useState(false),[orderOpen,setOrderOpen]=useState(false),[galleryIndex,setGalleryIndex]=useState(0),[zoomOpen,setZoomOpen]=useState(false),[touchStartX,setTouchStartX]=useState<number|null>(null)
  const nav=useNavFacets(slug,true)
  useEffect(()=>{setFavorites(loadFavorites(slug));setOrder(loadOrder(slug))},[slug])
  useEffect(()=>{
    setLoading(true);setError('')
    fetch(`/api/product?slug=${encodeURIComponent(slug)}&productId=${productId}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo abrir el producto');return x})
      .then((x:ProductResult)=>{setData(x);setTenantManifest(slug);const variants=x.product.variants||[];const first=variants.find(v=>v.availability!=='out')||variants[0];setSelectedVariantId(first?.source_product_id||null);setPageSeo(`${x.product.name} · ${x.tenant.public_name}`,x.product.description||`Consulta ${x.product.name} en el catálogo de ${x.tenant.public_name}.`,first?.image_url||x.product.image_url);track(slug,'product_view',{productId:x.product.source_product_id,source:'detail'})}).catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false))
  },[slug,productId])
  const tenant=data?.tenant||null,accent=tenant?.accent_color||'#1368ff'
  const favoriteIds=useMemo(()=>new Set(favorites.map(x=>x.id)),[favorites]),orderCount=order.reduce((s,x)=>s+x.qty,0)
  useEffect(()=>{
    if(!data)return
    const variants=data.product.variants||[]
    const current=variants.find(v=>v.source_product_id===selectedVariantId)||variants.find(v=>v.availability!=='out')||variants[0]||null
    const next=[snapshot(data.product,slug,current),...loadRecent(slug).filter(x=>x.id!==data.product.source_product_id)].slice(0,12)
    persist('recent',slug,next)
  },[data,selectedVariantId,slug])
  useEffect(()=>{
    if(!data)return
    const p0=data.product,variants=p0.variants||[]
    const current=variants.find(v=>v.source_product_id===selectedVariantId)||variants.find(v=>v.availability!=='out')||variants[0]||null
    const out=current?isOut(current):isOut(p0),price=current?.price_usd??p0.price_usd,image=current?.image_url||p0.image_url,sku=current?.sku||p0.sku
    const id='cuyra-product-jsonld';document.getElementById(id)?.remove()
    const script=document.createElement('script');script.id=id;script.type='application/ld+json'
    script.text=JSON.stringify({'@context':'https://schema.org','@type':'Product',name:p0.name,sku,brand:p0.brand?{'@type':'Brand',name:p0.brand}:undefined,image:image?[image]:undefined,description:p0.description||undefined,offers:{'@type':'Offer',priceCurrency:'USD',price,availability:out?'https://schema.org/OutOfStock':'https://schema.org/InStock',url:location.href}})
    document.head.appendChild(script);return()=>script.remove()
  },[data,selectedVariantId])
  if(loading)return <div className="app" style={{'--accent':accent} as React.CSSProperties}><Header tenant={nav.tenant||tenant} facets={nav.facets}/><div className="detail-loading"><LoaderCircle className="spin"/> Cargando producto...</div></div>
  if(error||!data)return <div className="app" style={{'--accent':accent} as React.CSSProperties}><Header tenant={nav.tenant||tenant} facets={nav.facets}/><div className="detail-loading error"><PackageSearch/><b>Producto no disponible</b><span>{error||'Producto no encontrado'}</span><a href={collectionUrl(slug)}>Volver al catálogo</a></div></div>

  const p=data.product,variants=p.variants||[],selected=variants.find(v=>v.source_product_id===selectedVariantId)||variants.find(v=>v.availability!=='out')||variants[0]||null
  const phone=phoneDigits(data.tenant.phone||''),features=featureLines(p.features||''),selectedOut=selected?isOut(selected):isOut(p)
  const selectedPrice=selected?.price_usd??p.price_usd,selectedPriceBs=selected?.price_bs??p.price_bs,selectedImage=selected?.image_url||p.image_url,selectedSku=selected?.sku||p.sku
  const selectedGallery=Array.from(new Set([...(selected?.gallery_urls||[]),...(selected?.image_url?[selected.image_url]:[]),...(p.gallery_urls||[]),...(p.image_url?[p.image_url]:[])])),activeImage=selectedGallery[galleryIndex]||selectedImage
  const galleryMove=(delta:number)=>{if(selectedGallery.length<2)return;setGalleryIndex(i=>(i+delta+selectedGallery.length)%selectedGallery.length)}
  const galleryTouchStart=(e:React.TouchEvent)=>setTouchStartX(e.touches[0]?.clientX??null)
  const galleryTouchEnd=(e:React.TouchEvent)=>{if(touchStartX===null)return;const end=e.changedTouches[0]?.clientX??touchStartX,dx=end-touchStartX;setTouchStartX(null);if(Math.abs(dx)>=42)galleryMove(dx<0?1:-1)}
  const selectedStock=selected?stockLabel(data.tenant,selected):stockLabel(data.tenant,p)
  const snap=snapshot(p,slug,selected)
  const addToOrder=()=>setOrder(old=>{const idx=old.findIndex(x=>x.id===snap.id&&(x.variantId||null)===(snap.variantId||null));let next:OrderItem[];if(idx>=0)next=old.map((x,i)=>i===idx?{...x,qty:x.qty+qty}:x);else next=[...old,{...snap,qty}];persist('order',slug,next);track(slug,'add_to_list',{productId:p.source_product_id,variantId:selected?.source_product_id||null,qty});return next})
  const toggleFav=()=>setFavorites(old=>{const exists=old.some(x=>x.id===p.source_product_id),next=exists?old.filter(x=>x.id!==p.source_product_id):[snap,...old].slice(0,60);persist('favorites',slug,next);if(!exists)track(slug,'favorite',{productId:p.source_product_id});return next})
  const changeQty=(id:number,n:number,variantId?:number|null)=>setOrder(old=>{const next=old.map(x=>x.id===id&&(x.variantId||null)===(variantId||null)?{...x,qty:Math.max(1,n)}:x);persist('order',slug,next);return next})
  const removeOrder=(id:number,variantId?:number|null)=>setOrder(old=>{const next=old.filter(x=>!(x.id===id&&(x.variantId||null)===(variantId||null)));persist('order',slug,next);return next})
  const share=async()=>{try{if(navigator.share)await navigator.share({title:p.name,text:`${p.name} · ${money(selectedPrice)}`,url:location.href});else{await navigator.clipboard.writeText(location.href);setCopied(true);setTimeout(()=>setCopied(false),1600)}track(slug,'share',{productId:p.source_product_id})}catch{}}
  return <div className={`app product-page theme-${data.tenant.catalog_theme||'retail'}`} style={{'--accent':data.tenant.accent_color||'#1368ff','--tenant-accent':data.tenant.accent_color||'#1368ff'} as React.CSSProperties}>
    <Header tenant={nav.tenant||data.tenant} facets={nav.facets} favoriteCount={favorites.length} orderCount={orderCount} onFavorites={()=>setFavoritesOpen(true)} onOrder={()=>setOrderOpen(true)}/>
    <main>
      <nav className="breadcrumbs"><a href={collectionUrl(slug)}><ArrowLeft size={14}/> Catálogo</a><span>/</span>{p.category&&<><a href={collectionUrl(slug,{category:p.category})}>{p.category}</a><span>/</span></>}<b>{p.name}</b></nav>
      <section className="product-detail v4-detail">
        <div className="detail-gallery"><div className="detail-media" onTouchStart={galleryTouchStart} onTouchEnd={galleryTouchEnd}>{activeImage?<button className="detail-main-image" onClick={()=>setZoomOpen(true)} aria-label="Ampliar imagen"><img src={activeImage} alt={`${p.name}${selected?.label?` · ${selected.label}`:''}`}/></button>:<PackageSearch/>}{selectedGallery.length>1&&<><button type="button" className="gallery-arrow prev" aria-label="Foto anterior" onClick={()=>galleryMove(-1)}><ChevronLeft/></button><button type="button" className="gallery-arrow next" aria-label="Foto siguiente" onClick={()=>galleryMove(1)}><ChevronRight/></button><span className="gallery-counter">{galleryIndex+1} / {selectedGallery.length}</span></>}<div className="detail-media-badges">{p.featured&&<span className="featured-badge"><Star size={11}/> Destacado</span>}{data.tenant.show_stock_mode!=='hidden'&&<span className={selectedOut?'stock-badge out':'stock-badge'}>{selectedStock}</span>}</div><button className={`detail-favorite ${favoriteIds.has(p.source_product_id)?'active':''}`} onClick={toggleFav}><Heart fill={favoriteIds.has(p.source_product_id)?'currentColor':'none'}/></button></div>{selectedGallery.length>1&&<div className="product-gallery-thumbs">{selectedGallery.slice(0,5).map((url,i)=><button key={url} className={galleryIndex===i?'active':''} onClick={()=>setGalleryIndex(i)} aria-label={`Foto ${i+1}`}><img src={url} alt={`${p.name} ${i+1}`}/></button>)}</div>}{variants.length>1&&<div className="variant-thumbs">{variants.filter(v=>v.image_url).slice(0,8).map(v=><button key={v.source_product_id} className={selected?.source_product_id===v.source_product_id?'active':''} onClick={()=>{setSelectedVariantId(v.source_product_id);setGalleryIndex(0)}} title={v.label}>{v.image_url&&<img src={v.image_url} alt={v.label}/>}</button>)}</div>}<div className="media-caption"><RefreshCw size={15}/><span>Inventario sincronizado con <b>CUYRA</b></span></div></div>
        <div className="detail-copy"><div className="detail-brand">{p.brand||p.category||'Producto'}</div><h1>{p.name}</h1><div className="detail-identifiers"><span>SKU <b>{selectedSku}</b></span>{p.model&&<span>Modelo <b>{p.model}</b></span>}{variants.length>1&&<span><b>{variants.length}</b> variantes</span>}</div><div className="detail-prices"><strong>{money(selectedPrice)}</strong>{selectedPriceBs>0&&<span>{bs(selectedPriceBs)}</span>}</div><div className={selectedOut?'availability out':'availability'}>{selectedOut?<><X size={16}/> Agotado</>:<><CheckCircle2 size={16}/> Disponible</>}{selectedStock&&<small>{selectedStock}</small>}</div>

          {variants.length>1&&<section className="variant-selector"><div className="variant-selector-head"><div><span>Selecciona una variante</span><b>{selected?.label||'—'}</b></div><small>{variants.filter(v=>!isOut(v)).length} disponibles</small></div><div className="variant-options">{variants.map(v=>{const out=isOut(v);return <button type="button" key={v.source_product_id} className={`${selected?.source_product_id===v.source_product_id?'active ':''}${out?'out':''}`} onClick={()=>{setSelectedVariantId(v.source_product_id);setGalleryIndex(0)}}>{v.image_url?<img src={v.image_url} alt=""/>:<span className="variant-placeholder"><Boxes size={18}/></span>}<span><b>{v.label}</b><small>{money(v.price_usd)} · {out?'Agotado':'Disponible'}</small></span>{selected?.source_product_id===v.source_product_id&&<CheckCircle2 className="variant-check" size={18}/>}</button>})}</div></section>}

          {p.description&&<p className="detail-description">{p.description}</p>}
          <section className="purchase-panel premium-purchase"><div className="purchase-top"><div><span>COMPRA ASISTIDA</span><b>{selected?.label?`${selected.label} seleccionada`:'Selecciona la cantidad'}</b><small>El mensaje incluirá producto, SKU, variante, cantidad y enlace.</small></div><div className="quantity-field"><span className="quantity-label">Cantidad</span><div className="detail-qty"><button aria-label="Disminuir cantidad" disabled={qty<=1} onClick={()=>setQty(x=>Math.max(1,x-1))}><Minus/></button><strong>{qty}</strong><button aria-label="Aumentar cantidad" onClick={()=>setQty(x=>x+1)}><Plus/></button></div></div></div>{phone&&<a className="primary-action" href={openWhatsApp(phone,productPurchaseText(data.tenant,p,selected,qty))} target="_blank" rel="noreferrer" onClick={()=>track(slug,'whatsapp_order',{productId:p.source_product_id,variantId:selected?.source_product_id||null,qty,total:selectedPrice*qty})}><MessageCircle/> Pedir por WhatsApp</a>}<div className="purchase-secondary"><button onClick={addToOrder}><ShoppingBag/> Agregar a lista</button>{phone&&<a href={openWhatsApp(phone,availabilityText(data.tenant,p,selected))} target="_blank" rel="noreferrer" onClick={()=>track(slug,'whatsapp_consult',{productId:p.source_product_id,variantId:selected?.source_product_id||null})}><PackageCheck/> Consultar disponibilidad</a>}</div></section>

          <div className="detail-accordions">{features.length>0&&<details open><summary>Características <ChevronDown size={17}/></summary><div className="accordion-body"><ul>{features.map((x,i)=><li key={i}>{x}</li>)}</ul></div></details>}<details><summary>Información del producto <ChevronDown size={17}/></summary><div className="accordion-body info-grid"><div><span>Categoría</span><b>{p.category||'—'}</b></div><div><span>Subcategoría</span><b>{p.subcategory||'—'}</b></div><div><span>Marca</span><b>{p.brand||'—'}</b></div><div><span>Variante</span><b>{selected?.label||'Única'}</b></div></div></details><details><summary>Precio y disponibilidad <ChevronDown size={17}/></summary><div className="accordion-body"><p>Precio y stock corresponden a la variante seleccionada y se sincronizan con CUYRA. {data.tenant.rate_bs_per_usd>0?`Referencia ${data.tenant.rate_source}: ${Number(data.tenant.rate_bs_per_usd).toLocaleString('es-VE')} Bs/USD.`:''}</p></div></details></div>
          <div className="detail-secondary-actions"><button className="share-action" onClick={share}>{copied?<><Check/> Enlace copiado</>:<><Share2/> Compartir producto</>}</button>{data.tenant.website&&<a href={data.tenant.website} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Sitio web</a>}</div>
        </div>
      </section>
      {data.related.length>0&&<section className="related"><div className="section-heading-row"><div><span className="section-kicker">DESCUBRE MÁS</span><h2>Productos relacionados</h2></div><a href={collectionUrl(slug,{category:p.category||''})}>Ver categoría <ArrowRight size={15}/></a></div><div className="grid related-grid">{data.related.map(x=><ProductCard key={`${x.source_group_id||'p'}-${x.source_product_id}`} tenant={data.tenant} product={x} isFavorite={favoriteIds.has(x.source_product_id)} onFavorite={prod=>{const s=snapshot(prod,slug);setFavorites(old=>{const exists=old.some(y=>y.id===prod.source_product_id),next=exists?old.filter(y=>y.id!==prod.source_product_id):[s,...old].slice(0,60);persist('favorites',slug,next);return next})}} onAdd={prod=>{const s=snapshot(prod,slug);setOrder(old=>{const idx=old.findIndex(y=>y.id===s.id&&!y.variantId);const next=idx>=0?old.map((y,i)=>i===idx?{...y,qty:y.qty+1}:y):[...old,{...s,qty:1}];persist('order',slug,next);return next})}}/>)}</div></section>}
    </main>
    {favoritesOpen&&<FavoritesDrawer tenant={data.tenant} items={favorites} onClose={()=>setFavoritesOpen(false)} onRemove={id=>setFavorites(old=>{const next=old.filter(x=>x.id!==id);persist('favorites',slug,next);return next})} onAdd={x=>setOrder(old=>{const idx=old.findIndex(y=>y.id===x.id&&(y.variantId||null)===(x.variantId||null));const next=idx>=0?old.map((y,i)=>i===idx?{...y,qty:y.qty+1}:y):[...old,{...x,qty:1}];persist('order',slug,next);return next})}/>} 
    {orderOpen&&<OrderDrawer tenant={data.tenant} items={order} onClose={()=>setOrderOpen(false)} onChange={changeQty} onRemove={removeOrder}/>} 
    {orderCount>0&&<button className="floating-order" onClick={()=>setOrderOpen(true)}><ShoppingBag/><span>Lista</span><b>{orderCount}</b></button>}
    {phone&&<a className="floating-wa" href={openWhatsApp(phone,`Hola ${data.tenant.public_name}, vengo del catálogo y quisiera recibir atención.`)} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp"><MessageCircle/></a>}
    {zoomOpen&&activeImage&&<div className="gallery-lightbox" role="dialog" aria-modal="true" onClick={()=>setZoomOpen(false)} onTouchStart={galleryTouchStart} onTouchEnd={galleryTouchEnd}><button className="gallery-lightbox-close" onClick={()=>setZoomOpen(false)}><X/></button>{selectedGallery.length>1&&<button className="gallery-lightbox-nav prev" aria-label="Foto anterior" onClick={(e)=>{e.stopPropagation();galleryMove(-1)}}><ChevronLeft/></button>}<img src={activeImage} alt={p.name} onClick={e=>e.stopPropagation()}/>{selectedGallery.length>1&&<button className="gallery-lightbox-nav next" aria-label="Foto siguiente" onClick={(e)=>{e.stopPropagation();galleryMove(1)}}><ChevronRight/></button>}<span>{Math.min(galleryIndex+1,selectedGallery.length)} / {selectedGallery.length}</span></div>}
    <div className="mobile-purchase-dock" aria-label="Acciones de compra">
      <button className="mobile-dock-list" onClick={()=>setOrderOpen(true)}><ShoppingBag/><span>Lista</span>{orderCount>0&&<b>{orderCount}</b>}</button>
      {phone&&<a className="mobile-dock-wa" href={openWhatsApp(phone,productPurchaseText(data.tenant,p,selected,qty))} target="_blank" rel="noreferrer" onClick={()=>track(slug,'whatsapp_order',{productId:p.source_product_id,variantId:selected?.source_product_id||null,qty,total:selectedPrice*qty,source:'mobile_dock'})}><MessageCircle/><span>Pedir por WhatsApp</span></a>}
    </div>
    <Footer tenant={data.tenant}/>
  </div>
}

function ProductSkeleton(){return <div className="grid">{Array.from({length:8}).map((_,i)=><div className="skeleton-card" key={i}><div/><span/><span/><b/></div>)}</div>}

function Footer({tenant}:{tenant:Tenant|null}){
  const phone=phoneDigits(tenant?.phone||'')
  return <footer className="catalog-footer"><div className="footer-grid"><div className="footer-company">{tenant?.logo_url?<img src={tenant.logo_url} alt={tenant.public_name}/>:tenant?<div className="footer-mark">{tenant.public_name.slice(0,1).toUpperCase()}</div>:<CuyraMark dark/>}<h3>{tenant?.public_name||CUYRA_LABEL}</h3><p>{tenant?`Catálogo online de ${tenant.public_name}. Información comercial conectada con CUYRA.`:CUYRA_TAGLINE}</p>{tenant?.location_text&&<span><MapPin/> {tenant.location_text}</span>}</div><div className="footer-col"><h4>Explorar</h4>{tenant?<><a href={`${collectionUrl(tenant.slug)}#productos`}>Productos</a><a href={collectionUrl(tenant.slug,{sort:'newest'})}>Novedades</a><a href={`${collectionUrl(tenant.slug)}#catalog-search`}>Buscar</a></>:<><a href={cuyraLeadUrl('CUYRA Catalog')} target="_blank" rel="noreferrer">Solicitar catálogo</a><a href={cuyraLeadUrl('software empresarial')} target="_blank" rel="noreferrer">Soluciones CUYRA</a></>}</div><div className="footer-col"><h4>{tenant?'Ayuda':'Contacto'}</h4>{phone&&<a href={openWhatsApp(phone,`Hola ${tenant?.public_name}, vengo del catálogo y necesito ayuda.`)} target="_blank" rel="noreferrer">WhatsApp</a>}{tenant?.instagram_url&&<a href={tenant.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}{tenant?.website&&<a href={tenant.website} target="_blank" rel="noreferrer">Sitio web</a>}{!tenant&&<a href={cuyraLeadUrl('CUYRA')} target="_blank" rel="noreferrer">+58 412-547-71-19</a>}</div><div className="footer-col footer-cuyra"><h4>Tecnología</h4><CuyraMark compact dark/><p>Plataforma empresarial para conectar operación, catálogo y experiencia comercial.</p><a className="cuyra-soft-cta" href={cuyraLeadUrl('catálogo conectado')} target="_blank" rel="noreferrer">¿Quieres un catálogo como este? <ArrowRight/></a></div></div><div className="footer-bottom"><span>© 2026 {tenant?.public_name||'CUYRA'}. Todos los derechos reservados.</span><span>Powered by <a href={cuyraLeadUrl('CUYRA')} target="_blank" rel="noreferrer"><b>CUYRA</b></a> · Developed by Oliver Lugo</span></div></footer>
}

if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}

const route=pathInfo()
createRoot(document.getElementById('root')!).render(route.productId?<ProductDetail slug={route.slug} productId={route.productId}/>:route.slug?<Storefront slug={route.slug}/>:<CuyraLanding/>)
