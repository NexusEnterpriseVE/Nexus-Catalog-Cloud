import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {
  Search,PackageSearch,ExternalLink,MessageCircle,ChevronLeft,ChevronRight,
  SlidersHorizontal,X,ArrowLeft,Share2,MapPin,Instagram,Globe2,
  Sparkles,Tag,CheckCircle2,Boxes,Menu,ChevronDown,Store,Clock3,
  ShieldCheck,RefreshCw,ArrowRight,Grid3X3,ShoppingBag,Heart,Plus,Minus,
  Trash2,Copy,Check,Truck,Headphones,ShoppingCart,History,Star,Layers3,
  Zap,ChevronUp,PackageCheck,SearchX,BadgeCheck,Info,LoaderCircle,Send
} from 'lucide-react'
import './styles.css'
import './v5.css'
import './v5-2.css'
import './v6.css'
import './v6-complete.css'
import './v6-3-mobile.css'

// V6 Premium Light: la tienda utiliza una sola apariencia, independiente del sistema.
if (typeof document !== 'undefined') document.documentElement.dataset.theme='light'

const CUYRA_PHONE='584125477119'
const CUYRA_LABEL='CUYRA Catalog'
const CUYRA_TAGLINE='Catálogos empresariales conectados en tiempo real'

type Banner={title:string;subtitle?:string;imageUrl?:string;mobileImageUrl?:string;ctaLabel?:string;targetType?:string;targetValue?:string}
type CarrierOption={id:string;label:string;enabled?:boolean;free?:boolean}
type PaymentOption={id:string;label:string;enabled?:boolean;hint?:string}
type CommerceSettings={
  deliveryEnabled?:boolean;pickupEnabled?:boolean;pickupLabel?:string;businessHours?:string;pickupAddress?:string;
  deliveryLabel?:string;deliveryNote?:string;freeShippingEnabled?:boolean;requireIdDocument?:boolean;
  carriers?:CarrierOption[];paymentMethods?:PaymentOption[];announcements?:string[];brandLogos?:Record<string,string>;
  visualTheme?:'inherit'|'commerce';showWholesalePrice?:boolean;wholesaleLabel?:string
}
type Review={id:string;rating:number;display_name?:string;comment?:string;created_at:string}
type Tenant={
  slug:string;public_name:string;phone:string;website:string;accent_color:string;
  show_stock_mode:'exact'|'status'|'hidden';hide_out_of_stock:boolean;rate_bs_per_usd:number;rate_source:string;
  updated_at?:string;logo_url?:string|null;hero_title?:string;hero_subtitle?:string;announcement?:string;
  catalog_theme?:'retail'|'minimal'|'bold';show_brand_filter?:boolean;show_category_nav?:boolean;
  instagram_url?:string;location_text?:string;banners_json?:Banner[];commerce_settings_json?:CommerceSettings;home_sections_json?:string[]
}
type Variant={source_product_id:number;sku:string;label:string;attributes?:Record<string,unknown>;name?:string;price_usd:number;price_bs:number;wholesale_price_usd?:number|null;wholesale_price_bs?:number|null;wholesale_min_quantity?:number|null;stock_exact:number|null;availability:'available'|'out'|null;image_url:string|null;gallery_urls?:string[]}
type Product={
  source_product_id:number;source_group_id?:number|null;group_code?:string;sku:string;name:string;description?:string;category?:string;subcategory?:string;
  brand?:string;model?:string;features?:string;featured?:boolean;recommended?:boolean;compare_at_price_usd?:number|null;compare_at_price_bs?:number|null;promo_badge?:string;rating_value?:number;rating_count?:number;price_usd:number;price_usd_max?:number;price_bs:number;price_bs_max?:number;has_price_range?:boolean;wholesale_price_usd?:number|null;wholesale_price_bs?:number|null;wholesale_min_quantity?:number|null;wholesale_retail_price_usd?:number|null;wholesale_variant_label?:string;
  stock_exact:number|null;availability:'available'|'out'|null;image_url:string|null;gallery_urls?:string[];updated_at?:string;variant_count?:number;variant_labels?:string[];variants?:Variant[]
}
type CatalogResult={
  ok:boolean;tenant:Tenant;products:Product[];
  facets:{categories:string[];subcategories:string[];brands:string[];priceRange:{min:number;max:number}};
  page:number;pages:number;total:number
}
type ProductResult={ok:boolean;tenant:Tenant;product:Product;related:Product[];reviews:Review[]}
type NavFacets={categories:string[];brands:string[]}
type StoredProduct={id:number;name:string;sku:string;brand?:string;model?:string;priceUsd:number;priceBs:number;wholesalePriceUsd?:number;wholesaleMinQuantity?:number;imageUrl?:string|null;variantId?:number|null;variantLabel?:string;hasVariants?:boolean;url:string}
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
function effectiveTheme(tenant:Tenant|null|undefined){
  // V4.6.1 VARGASUX: el storefront comercial es la experiencia pública estándar.
  // El tenant sigue resolviendo datos, branding, contacto y productos de forma independiente.
  return tenant?'commerce':'retail'
}

function hasPrice(v:unknown){return Number(v)>0}
function displayMoney(v:unknown){return hasPrice(v)?money(Number(v)):'Consultar'}

// One pricing policy throughout the storefront. The API independently recalculates
// the price from catalog_products to prevent tampered browser-side discounts.
function wholesaleTier(retail:number,wholesale:unknown,minQty:unknown,qty:number){
  const price=Number(wholesale),minimum=Math.trunc(Number(minQty)),quantity=Math.max(1,Math.trunc(Number(qty)||1))
  const eligible=Number.isFinite(retail)&&retail>0&&Number.isFinite(price)&&price>0&&price<retail&&Number.isInteger(minimum)&&minimum>=2
  const active=eligible&&quantity>=minimum
  return {eligible,active,minimum:eligible?minimum:0,unitPrice:active?price:retail,wholesalePrice:eligible?price:0,
    remaining:eligible?Math.max(0,minimum-quantity):0,savingPerUnit:eligible?retail-price:0,savingTotal:active?(retail-price)*quantity:0}
}
function cartUnitPrice(item:OrderItem){return wholesaleTier(item.priceUsd,item.wholesalePriceUsd,item.wholesaleMinQuantity,item.qty).unitPrice}
function cartTotal(items:OrderItem[]){return items.reduce((sum,item)=>sum+cartUnitPrice(item)*item.qty,0)}

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
  return {id:p.source_product_id,name:p.name,sku:variant?.sku||p.sku,brand:p.brand,model:p.model,priceUsd:variant?.price_usd??p.price_usd,priceBs:variant?.price_bs??p.price_bs,wholesalePriceUsd:variant?.wholesale_price_usd??p.wholesale_price_usd??undefined,wholesaleMinQuantity:variant?.wholesale_min_quantity??p.wholesale_min_quantity??undefined,imageUrl:variant?.image_url||p.image_url,variantId:variant?.source_product_id||null,variantLabel:variant?.label||'',hasVariants:(p.variant_count||1)>1,url:location.origin+productUrl(slug,p.source_product_id)}
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
function useMotionReveal(trigger:unknown){
  useEffect(()=>{
    if(typeof window==='undefined'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return
    const nodes=Array.from(document.querySelectorAll<HTMLElement>('.home-commerce-section,.products-section,.trust-section,.recent-section,.review-section,.related,.product-detail,.product-card'))
    nodes.forEach((el,i)=>{el.classList.add('motion-reveal');el.style.setProperty('--motion-delay',`${Math.min((i%8)*42,252)}ms`)})
    if(!('IntersectionObserver' in window)){nodes.forEach(el=>el.classList.add('motion-visible'));return}
    const io=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){(entry.target as HTMLElement).classList.add('motion-visible');io.unobserve(entry.target)}},{threshold:.08,rootMargin:'0px 0px -6% 0px'})
    nodes.forEach(el=>io.observe(el));return()=>io.disconnect()
  },[trigger])
}
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
  const sku=variant?.sku||p.sku,basePrice=variant?.price_usd??p.price_usd,priceBs=variant?.price_bs??p.price_bs
  const tier=wholesaleTier(Number(basePrice),variant?.wholesale_price_usd??p.wholesale_price_usd,variant?.wholesale_min_quantity??p.wholesale_min_quantity,qty)
  const price=tier.unitPrice
  const variantLine=variant?.label?`\n• Variante: ${variant.label}`:''
  const stock=stockLabel(tenant,variant||p)
  const stockLine=stock?`\n• Disponibilidad: ${stock}`:''
  return `Hola ${tenant.public_name}, vengo del catálogo y quiero pedir este producto:\n\n• Producto: ${p.name}\n• SKU: ${sku}${p.brand?`\n• Marca: ${p.brand}`:''}${p.model?`\n• Modelo: ${p.model}`:''}${variantLine}\n• Cantidad: ${qty}\n• Precio referencial: ${displayMoney(price)}${priceBs>0&&hasPrice(price)?` / ${bs(priceBs)}`:''}${stockLine}\n• Enlace: ${location.href}\n\nQuedo atento a confirmación, disponibilidad final y formas de pago. Gracias.\n\nOrigen: CUYRA Catalog`
}
function availabilityText(tenant:Tenant,p:Product,variant:Variant|null){
  return `Hola ${tenant.public_name}, vengo del catálogo y deseo consultar disponibilidad:\n\n• Producto: ${p.name}\n• SKU: ${variant?.sku||p.sku}${variant?.label?`\n• Variante: ${variant.label}`:''}\n• Enlace: ${location.href}\n\n¿Me confirman disponibilidad y condiciones? Gracias.\n\nOrigen: CUYRA Catalog`
}
function orderText(tenant:Tenant,items:OrderItem[],code='',fulfillment:'delivery'|'pickup'='delivery'){
  const total=cartTotal(items)
  const lines=items.map((x,i)=>`${i+1}. ${x.name}\n   SKU: ${x.sku}${x.variantLabel?`\n   Variante: ${x.variantLabel}`:''}\n   Cantidad: ${x.qty}\n   Precio por unidad: ${money(cartUnitPrice(x))}${cartUnitPrice(x)<x.priceUsd?` (mayorista desde ${x.wholesaleMinQuantity} unidades)`:``}\n   Subtotal ref.: ${money(cartUnitPrice(x)*x.qty)}`).join('\n\n')
  return `Hola ${tenant.public_name}, quiero confirmar mi pedido desde CUYRA Catalog.${code?`\n\nCódigo: ${code}`:''}\nModalidad: ${fulfillment==='pickup'?'Retiro en tienda':'Delivery'}\n\n${lines}\n\nTotal referencial: ${money(total)}\n\nPor favor confirmen disponibilidad final, total y condiciones de entrega/pago. Gracias.`
}

function CuyraMark({compact=false,dark=false}:{compact?:boolean;dark?:boolean}){return <span className={`cuyra-brand ${compact?'compact':''}`}><img src={dark?'/cuyra-mark-on-dark.png':'/cuyra-mark.png'} alt=""/><span><b>CUYRA</b>{!compact&&<small>Catalog</small>}</span></span>}
function WhatsAppIcon({size=22}:{size?:number}){return <svg className="whatsapp-icon" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.01 3.2c-7.05 0-12.78 5.61-12.78 12.51 0 2.21.59 4.37 1.72 6.26L3.1 28.8l7.03-1.8a12.93 12.93 0 0 0 5.88 1.42h.01c7.04 0 12.78-5.61 12.78-12.51 0-3.34-1.33-6.48-3.74-8.84A12.8 12.8 0 0 0 16.01 3.2Zm0 22.99h-.01a10.66 10.66 0 0 1-5.43-1.49l-.39-.23-4.17 1.07 1.11-4.03-.26-.41a10.18 10.18 0 0 1-1.59-5.39c0-5.67 4.82-10.28 10.75-10.28 2.87 0 5.57 1.09 7.6 3.08a10.08 10.08 0 0 1 3.14 7.2c-.01 5.67-4.83 10.28-10.75 10.28Zm5.89-7.69c-.32-.16-1.91-.92-2.21-1.03-.3-.11-.52-.16-.74.16-.22.32-.85 1.03-1.04 1.24-.19.22-.38.24-.71.08-.32-.16-1.36-.49-2.6-1.56-.96-.84-1.61-1.88-1.8-2.2-.19-.32-.02-.49.14-.65.15-.14.32-.38.49-.57.16-.19.22-.32.32-.54.11-.22.05-.41-.03-.57-.08-.16-.74-1.73-1.01-2.37-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.88.41-.3.32-1.15 1.1-1.15 2.69 0 1.59 1.18 3.13 1.34 3.34.16.22 2.32 3.47 5.63 4.87.79.34 1.4.54 1.88.69.79.25 1.51.21 2.08.13.64-.09 1.91-.76 2.18-1.49.27-.73.27-1.35.19-1.49-.08-.13-.3-.21-.62-.37Z"/></svg>}

function AnnouncementBar({tenant}:{tenant:Tenant|null}){
  const configured=(tenant?.commerce_settings_json?.announcements||[]).map(x=>String(x||'').trim()).filter(Boolean)
  const message=configured[0]||tenant?.announcement||'Envíos nacionales · Atención directa por WhatsApp'
  return <div className="iv-topline" style={tenant?{'--tenant-accent':tenant.accent_color||'#001A9C'} as React.CSSProperties:undefined}><Truck size={15}/><span>{message}</span></div>
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
  const[searchOpen,setSearchOpen]=useState(false),[headerQ,setHeaderQ]=useState('')
  const slug=tenant?.slug||''
  const submitSearch=(e:React.FormEvent)=>{e.preventDefault();const q=headerQ.trim();if(!q)return;location.href=`${collectionUrl(slug,{q})}#productos`}
  return <>
    <AnnouncementBar tenant={tenant}/>
    <header className="iv-header"><div className="iv-header-inner">
      <a className="iv-header-brand" href={tenant?collectionUrl(slug):'/'} aria-label={tenant?`${tenant.public_name}, inicio`:'CUYRA Catalog'}>
        {tenant?.logo_url?<img src={tenant.logo_url} alt={tenant.public_name}/>:tenant?<span className="iv-logo-fallback">{tenant.public_name.slice(0,1).toUpperCase()}</span>:<CuyraMark/>}
        {tenant&&!tenant.logo_url&&<strong>{tenant.public_name}</strong>}
      </a>
      {tenant&&<nav className="iv-desktop-nav" aria-label="Navegación principal">
        <a href={`${collectionUrl(slug)}#inicio`}>Inicio</a>
        <a href={`${collectionUrl(slug)}#productos`}>Catálogo</a>
        <a href={`${collectionUrl(slug,{promo:'1'})}#productos`}>Ofertas</a>
        <a href={`${collectionUrl(slug)}#beneficios`}>Envíos</a>
        <a href={`${collectionUrl(slug)}#preguntas`}>Políticas</a>
      </nav>}
      {tenant&&<div className="iv-header-actions">
        <form className="v6-header-search" role="search" onSubmit={submitSearch}><Search size={17} aria-hidden="true"/><input value={headerQ} onChange={e=>setHeaderQ(e.target.value)} aria-label="Buscar productos" placeholder="Buscar productos, marcas o SKU"/><button type="submit" aria-label="Buscar"><ArrowRight size={16}/></button></form>
        <button onClick={()=>setSearchOpen(true)} aria-label="Buscar productos"><Search size={19}/></button>
        <button onClick={onOrder} aria-label="Carrito"><ShoppingBag size={19}/>{orderCount>0&&<b>{orderCount}</b>}</button>
      </div>}
    </div></header>
    {tenant&&searchOpen&&<div className="search-overlay iv-search-overlay" onClick={()=>setSearchOpen(false)}><div className="search-overlay-card iv-search-card" onClick={(e:any)=>e.stopPropagation()}><div className="search-overlay-head"><span>Buscar en {tenant.public_name}</span><button onClick={()=>setSearchOpen(false)}><X/></button></div><form className="header-search-form" onSubmit={submitSearch}><Search/><input autoFocus value={headerQ} onChange={e=>setHeaderQ(e.target.value)} placeholder="Buscar por nombre, SKU o marca"/><button type="submit">Buscar</button><SearchSuggestions slug={slug} q={headerQ} open={headerQ.trim().length>=2} onPick={()=>setSearchOpen(false)}/></form></div></div>}
  </>
}

function CuyraLanding(){
  useEffect(()=>{setTenantManifest('');setPageSeo('CUYRA Catalog · Catálogos empresariales conectados','Convierte inventario, precios y productos en un catálogo digital profesional conectado a CUYRA.')},[])
  return <div className="app no-tenant-app">
    <Header tenant={null}/>
    <main className="cuyra-landing">
      <section className="cuyra-hero">
        <div className="cuyra-hero-copy"><span className="eyebrow"><Zap size={14}/> CUYRA CATALOG</span><h1>Tu catálogo digital, <em>conectado a tu operación.</em></h1><p>Una experiencia comercial premium para mostrar productos, precios y disponibilidad sin duplicar trabajo. CUYRA conecta tu inventario con una vitrina lista para vender.</p><div className="hero-actions"><a className="hero-primary" href={cuyraLeadUrl('CUYRA Catalog')} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Solicitar información</a><a className="hero-secondary" href="#que-es">Ver cómo funciona <ArrowRight size={16}/></a></div><div className="cuyra-hero-pills"><span><RefreshCw/> Sincronización</span><span><ShoppingBag/> Catálogo comercial</span><span><MessageCircle/> WhatsApp</span></div></div>
        <div className="cuyra-hero-visual" aria-hidden="true"><div className="glass-orbit orbit-one"/><div className="glass-orbit orbit-two"/><div className="platform-card main"><CuyraMark/><strong>Catálogo conectado</strong><span>Productos · variantes · precios · disponibilidad</span></div><div className="platform-card floating"><BadgeCheck/><b>White-label</b><span>La marca del cliente es protagonista</span></div><div className="platform-card floating second"><Zap/><b>Listo para vender</b><span>Pedidos y consultas por WhatsApp</span></div></div>
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
  return <div className="search-suggestions" role="listbox">{loading&&<div className="suggestion-loading"><LoaderCircle className="spin"/> Buscando...</div>}{!loading&&items.length===0&&<div className="suggestion-empty"><SearchX/> No encontramos coincidencias rápidas.</div>}{items.map(p=><a key={p.source_product_id} href={productUrl(slug,p.source_product_id)} onClick={onPick}><span className="suggestion-thumb">{p.image_url?<img src={p.image_url} alt=""/>:<PackageSearch/>}</span><span><b>{p.name}</b><small>{p.brand||p.category||'Producto'} · {p.sku}</small></span><strong>{displayMoney(p.price_usd)}</strong></a>)}</div>
}

function bannerHref(tenant:Tenant,b:Banner){
  if(b.targetType==='product'&&b.targetValue)return productUrl(tenant.slug,Number(b.targetValue))
  if(b.targetType==='category'&&b.targetValue)return collectionUrl(tenant.slug,{category:b.targetValue})
  if(b.targetType==='brand'&&b.targetValue)return collectionUrl(tenant.slug,{brand:b.targetValue})
  if(b.targetValue?.startsWith('/'))return b.targetValue
  return '#productos'
}
function StoreHeroCarousel({tenant,total,featured}:{tenant:Tenant;total:number;featured?:Product|null}){
  const configured=(Array.isArray(tenant.banners_json)?tenant.banners_json:[]).filter(Boolean)
  const heroBanner=configured[0]
  const title=tenant.hero_title||heroBanner?.title||`Encuentra lo mejor para tu día.`
  const subtitle=tenant.hero_subtitle||heroBanner?.subtitle||`Explora productos de ${tenant.public_name} con precios claros, atención personalizada y disponibilidad actualizada.`
  const image=heroBanner?.imageUrl||heroBanner?.mobileImageUrl||featured?.image_url||null
  const phone=phoneDigits(tenant.phone||'')
  return <section id="inicio" className="iv-hero">
    <span className="iv-hero-glow iv-hero-glow-one"/><span className="iv-hero-glow iv-hero-glow-two"/>
    <div className="iv-hero-inner">
      <div className="iv-hero-copy">
        <p className="iv-hero-label"><i/>{tenant.public_name}</p>
        <h1>{title}</h1>
        <p className="iv-hero-subtitle">{subtitle}</p>
        <div className="iv-hero-actions"><a className="iv-primary-pill" href="#productos">Explorar catálogo <ArrowRight size={16}/></a>{phone&&<a className="iv-secondary-pill" href={openWhatsApp(phone,`Hola ${tenant.public_name}, quisiera consultar por un producto.`)} target="_blank" rel="noreferrer">Consultar por WhatsApp <ExternalLink size={15}/></a>}</div>
        <div className="iv-hero-checks"><span><CheckCircle2/> Atención directa</span><span><CheckCircle2/> Disponibilidad actualizada</span></div>
      </div>
      <div className="iv-hero-visual">
        <div className="iv-hero-art">
          {image?<img className="iv-hero-art-image" src={image} alt=""/>:<div className="iv-hero-placeholder"><ShoppingBag/><strong>{total}</strong><span>productos disponibles en el catálogo</span></div>}
          <div className="iv-hero-vignette"/><span className="iv-hero-brand-chip">{tenant.public_name}</span>
          <a className="iv-hero-featured-card" href={featured?productUrl(tenant.slug,featured.source_product_id):"#productos"}><span className="iv-hero-featured-icon">{featured?.image_url?<img src={featured.image_url} alt=""/>:<Sparkles/>}</span><span><small>{featured?"Producto destacado":"Catálogo conectado"}</small><b>{featured?.name||"Compra fácil, con asesoría."}</b></span><ArrowRight/></a>
        </div>
        <div className="iv-hero-float-card"><span><Truck/></span><div><small>Despacho y retiro</small><b>Consulta opciones</b></div></div>
      </div>
    </div>
  </section>
}

function BrandCarousel({tenant,brands,active,onSelect}:{tenant:Tenant;brands:string[];active:string;onSelect:(brand:string)=>void}){
  if(!brands.length)return null
  const logos=tenant.commerce_settings_json?.brandLogos||{},visible=brands.slice(0,24)
  const group=(n:number)=><div className="iv-brand-marquee-group" aria-hidden={n===1}>{visible.map(x=><button key={`${n}-${x}`} className={`iv-brand-marquee-item ${active===x?'active':''}`} onClick={()=>onSelect(x)} aria-label={`Ver ${x}`}>{logos[x]?<img src={logos[x]} alt={x} loading="lazy"/>:<b>{x}</b>}</button>)}</div>
  return <section className="iv-brand-marquee" aria-label="Marcas disponibles"><div className="iv-brand-marquee-track">{group(0)}{group(1)}</div></section>
}

function CategoryRail({categories,active,onSelect}:{categories:string[];active:string;onSelect:(category:string)=>void}){
  if(!categories.length)return null
  return <div className="iv-category-pills"><button className={!active?'active':''} onClick={()=>onSelect('')}>Todos</button>{categories.map(x=><button key={x} className={active===x?'active':''} onClick={()=>onSelect(x)}>{x}</button>)}</div>
}

function RatingLine({product:p,large=false}:{product:Product;large?:boolean}){
  const value=Number(p.rating_value||0),count=Number(p.rating_count||0),rounded=Math.round(value)
  return <span className={`rating-line ${count?'':'empty'} ${large?'large':''}`}><span className="rating-stars">{[1,2,3,4,5].map(i=><Star key={i} fill={i<=rounded?'currentColor':'none'}/>)}</span>{count?<><b>{value.toFixed(1)}</b><small>({count})</small></>:<small>Sin valoraciones</small>}</span>
}
function ReviewSection({slug,product,reviews}:{slug:string;product:Product;reviews:Review[]}){
  const [rating,setRating]=useState(5),[name,setName]=useState(''),[comment,setComment]=useState(''),[status,setStatus]=useState(''),[sending,setSending]=useState(false),[starFilter,setStarFilter]=useState(0),[visible,setVisible]=useState(6)
  const counts=[5,4,3,2,1].map(n=>({star:n,count:reviews.filter(r=>Number(r.rating)===n).length}))
  const average=Number(product.rating_value||0),total=Number(product.rating_count||0)
  const filtered=starFilter?reviews.filter(r=>Number(r.rating)===starFilter):reviews
  async function submit(e:React.FormEvent){e.preventDefault();if(sending)return;setSending(true);setStatus('');try{const r=await fetch('/api/product',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'review',slug,productId:product.source_product_id,rating,displayName:name,comment})});const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo enviar la valoración');setStatus(x.message||'Valoración enviada para revisión.');setComment('')}catch(e:any){setStatus(String(e?.message||e))}finally{setSending(false)}}
  return <section className="review-section v5-reviews" id="opiniones">
    <div className="v5-reviews-head"><span className="section-kicker">OPINIONES REALES</span><h2>Lo que opinan nuestros clientes</h2><p>Valoraciones de clientes publicadas tras moderación.</p></div>
    <div className="v5-reviews-overview"><div className="v5-rating-summary"><span className="v5-rating-caption">VALORACIÓN GENERAL</span><strong className={total?"rated":"unrated"}>{total?<>{average.toFixed(1)}<small> / 5</small></>:<span>Aún sin calificar</span>}</strong><div className="v5-rating-gold">{[1,2,3,4,5].map(i=><Star key={i} fill={total&&i<=Math.round(average)?'currentColor':'none'}/>)}</div><p>{total} {total===1?'valoración publicada':'valoraciones publicadas'}</p></div><div className="v5-rating-distribution" aria-label="Distribución de calificaciones">{reviews.length===0?<div className="v52-review-no-data"><Star size={26}/><b>Las opiniones aparecerán aquí</b><span>Cuando se publiquen reseñas podrás ver el promedio y las calificaciones por estrellas.</span></div>:<>{counts.map(x=><button key={x.star} type="button" onClick={()=>{setStarFilter(v=>v===x.star?0:x.star);setVisible(6)}} className={starFilter===x.star?'selected':''} aria-pressed={starFilter===x.star}><b>{x.star} <Star size={13} fill="currentColor"/></b><span className="v5-rating-track"><i style={{width:`${reviews.length?x.count/reviews.length*100:0}%`}}/></span><small>{x.count}</small></button>)}<button className="v5-rating-reset" type="button" onClick={()=>{setStarFilter(0);setVisible(6)}}>Ver todas las opiniones</button></>}</div></div>
    <div className="v5-review-layout"><div className="v5-review-feedback"><div className="v5-review-list-title"><h3>Reseñas de clientes</h3><span>{starFilter?`Filtro: ${starFilter} estrellas`:`${reviews.length} comentarios y valoraciones`}</span></div>{filtered.length?<div className="v5-review-cards">{filtered.slice(0,visible).map(r=><article className="v5-review-card" key={r.id}><div className="v5-review-card-top"><span className="v5-review-avatar" aria-hidden="true">{(r.display_name||'C').slice(0,1).toUpperCase()}</span><div><strong>{r.display_name||'Cliente'}</strong><small>{new Date(r.created_at).toLocaleDateString('es-VE')}</small></div><span className="v5-review-card-stars">{[1,2,3,4,5].map(i=><Star key={i} size={14} fill={i<=r.rating?'currentColor':'none'}/>)}</span></div>{r.comment&&<p>{r.comment}</p>}</article>)}</div>:<div className="v5-review-empty"><Star size={28}/><b>Sin reseñas en esta selección</b><span>{reviews.length?'Prueba otra cantidad de estrellas.':'Sé la primera persona en compartir una opinión.'}</span></div>}{filtered.length>visible&&<button className="v5-show-reviews" type="button" onClick={()=>setVisible(x=>x+6)}>Ver más reseñas <ChevronDown size={16}/></button>}</div>
    <form className="review-form v5-review-form" onSubmit={submit}><h3>Comparte tu experiencia</h3><p>Tu opinión ayuda a otros clientes a elegir.</p><label>Tu calificación</label><div className="rating-picker">{[1,2,3,4,5].map(i=><button type="button" key={i} className={i<=rating?'active':''} onClick={()=>setRating(i)} aria-label={`${i} estrellas`}><Star fill={i<=rating?'currentColor':'none'}/></button>)}</div><label htmlFor="v5-review-name">Nombre o alias</label><input id="v5-review-name" value={name} onChange={e=>setName(e.target.value)} maxLength={60} placeholder="¿Cómo te llamas? (opcional)"/><label htmlFor="v5-review-text">Comentario</label><textarea id="v5-review-text" value={comment} onChange={e=>setComment(e.target.value)} maxLength={700} placeholder="¿Qué te pareció el producto?"/><button disabled={sending} type="submit"><Send size={17}/> {sending?'Enviando…':'Enviar valoración'}</button>{status&&<small className="review-status" role="status">{status}</small>}<small>Las valoraciones se revisan antes de publicarse.</small></form></div>
  </section>
}
function CheckoutConfirmation({tenant,items,onClose,onDone}:{tenant:Tenant;items:OrderItem[];onClose:()=>void;onDone:()=>void}){
  const commerce=tenant.commerce_settings_json||{},defaultMode:'delivery'|'pickup'=commerce.deliveryEnabled===false?'pickup':'delivery'
  const defaultCarriers:CarrierOption[]=[{id:'zoom',label:'Zoom',enabled:true,free:true},{id:'tealca',label:'Tealca',enabled:true,free:true}]
  const defaultPayments:PaymentOption[]=[{id:'pago_movil',label:'Pago Móvil',enabled:true},{id:'transferencia',label:'Transferencia bancaria',enabled:true},{id:'zelle',label:'Zelle',enabled:true},{id:'usdt',label:'Binance / USDT',enabled:true}]
  const carriers=(commerce.carriers?.length?commerce.carriers:defaultCarriers).filter(x=>x.enabled!==false),payments=(commerce.paymentMethods?.length?commerce.paymentMethods:defaultPayments).filter(x=>x.enabled!==false)
  const[mode,setMode]=useState<'delivery'|'pickup'>(defaultMode),[carrier,setCarrier]=useState(carriers[0]?.id||''),[payment,setPayment]=useState(payments[0]?.id||''),[name,setName]=useState(''),[phone,setPhone]=useState(''),[documentId,setDocumentId]=useState(''),[state,setState]=useState(''),[city,setCity]=useState(''),[agency,setAgency]=useState(''),[notes,setNotes]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('')
  const total=cartTotal(items),count=items.reduce((s,x)=>s+x.qty,0)
  async function go(e?:React.FormEvent){e?.preventDefault();if(!items.length||loading)return;if(name.trim().length<3)return setError('Escribe tu nombre y apellido.');if(phoneDigits(phone).length<10)return setError('Escribe un teléfono válido.');if(mode==='delivery'&&(!carrier||!state.trim()||!city.trim()||!agency.trim()))return setError('Completa la agencia, estado, ciudad y oficina de destino.');if(!payment)return setError('Selecciona un método de pago.');setLoading(true);setError('');try{const r=await fetch('/api/catalog',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'checkout',slug:tenant.slug,fulfillment:mode,items,customer:{name,phone,documentId},shipping:mode==='delivery'?{carrier,state,city,agency}:null,paymentMethod:payment,notes})});const x=await r.json();if(!r.ok)throw new Error(x.error||'No pudimos preparar el pedido');const url=openWhatsApp(x.phone||tenant.phone,String(x.whatsappText||''));if(!url)throw new Error('WhatsApp de ventas no configurado');track(tenant.slug,'whatsapp_order',{items:Number(x.itemCount||count),total:Number(x.total??total),source:'checkout'});onDone();location.href=url}catch(e:any){setError(String(e?.message||e));setLoading(false)}}
  return <div className="checkout-screen" role="dialog" aria-modal="true"><div className="checkout-shell checkout-v2"><button className="checkout-close" onClick={onClose}><X/></button><form className="checkout-form" onSubmit={go}><div className="checkout-form-head"><span className="section-kicker">FINALIZAR PEDIDO</span><h1>Completa tus datos</h1><p>Revisaremos disponibilidad y recibirás la confirmación final por WhatsApp.</p></div><section className="checkout-block"><h3><span>1</span> Contacto</h3><div className="checkout-fields two"><label>Nombre y apellido<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Ej. María Pérez" maxLength={100}/></label><label>Teléfono<input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="04XX-XXXXXXX" maxLength={30}/></label></div>{commerce.requireIdDocument&&<label>Cédula / identificación<input value={documentId} onChange={e=>setDocumentId(e.target.value)} placeholder="V-12.345.678" maxLength={40}/></label>}</section><section className="checkout-block"><h3><span>2</span> ¿Cómo quieres recibirlo?</h3><div className="fulfillment-chooser">{commerce.deliveryEnabled!==false&&<button type="button" className={mode==='delivery'?'active':''} onClick={()=>setMode('delivery')}><Truck/><span><b>{commerce.deliveryLabel||'Envío nacional'}</b><small>{commerce.freeShippingEnabled!==false?'Envío gratis según condiciones del comercio.':commerce.deliveryNote||'La tienda confirmará las condiciones.'}</small></span></button>}{commerce.pickupEnabled!==false&&<button type="button" className={mode==='pickup'?'active':''} onClick={()=>setMode('pickup')}><Store/><span><b>{commerce.pickupLabel||'Retiro en tienda'}</b><small>{commerce.pickupAddress||commerce.businessHours||'La tienda confirmará horario y disponibilidad.'}</small></span></button>}</div>{mode==='delivery'&&<><div className="carrier-grid">{carriers.map(x=><button type="button" key={x.id} className={carrier===x.id?'active':''} onClick={()=>setCarrier(x.id)}><Truck/><b>{x.label}</b>{x.free&&<small>Envío gratis</small>}</button>)}</div><div className="checkout-fields two"><label>Estado<input value={state} onChange={e=>setState(e.target.value)} placeholder="Estado" maxLength={80}/></label><label>Ciudad<input value={city} onChange={e=>setCity(e.target.value)} placeholder="Ciudad" maxLength={80}/></label></div><label>Agencia / oficina de destino<input value={agency} onChange={e=>setAgency(e.target.value)} placeholder="Nombre o dirección de la oficina" maxLength={140}/></label></>}</section><section className="checkout-block"><h3><span>3</span> Método de pago</h3><div className="payment-options">{payments.map(x=><button type="button" key={x.id} className={payment===x.id?'active':''} onClick={()=>setPayment(x.id)}><span className="payment-radio"/><b>{x.label}</b>{x.hint&&<small>{x.hint}</small>}</button>)}</div></section><section className="checkout-block"><h3><span>4</span> Observación</h3><textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={350} placeholder="Información adicional para la tienda (opcional)"/></section>{error&&<div className="checkout-error">{error}</div>}<button className="checkout-whatsapp" disabled={loading} type="submit">{loading?<><LoaderCircle className="spin"/> Preparando pedido…</>:<><WhatsAppIcon size={21}/> Finalizar por WhatsApp</>}</button><button type="button" className="checkout-back" onClick={onClose}>Volver al carrito</button></form><aside className="checkout-summary"><div className="checkout-summary-title"><ShoppingBag/><span><b>Tu pedido</b><small>{count} {count===1?'unidad':'unidades'}</small></span></div><div className="checkout-items">{items.map(x=><div key={`${x.id}-${x.variantId||0}`}><div className="checkout-item-thumb">{x.imageUrl?<img src={x.imageUrl} alt=""/>:<PackageSearch/>}</div><span><b>{x.name}</b><small>SKU {x.sku}{x.variantLabel?` · ${x.variantLabel}`:''} · x{x.qty}</small></span><strong>{money(cartUnitPrice(x)*x.qty)}</strong></div>)}</div><div className="checkout-total"><span>Subtotal</span><strong>{money(total)}</strong></div>{mode==='delivery'&&commerce.freeShippingEnabled!==false&&<div className="checkout-shipping"><span>Envío</span><b>Gratis</b></div>}<p className="checkout-note">El total es referencial. La tienda valida disponibilidad y datos antes de cerrar la venta.</p></aside></div></div>
}

function StoreFaq({tenant}:{tenant:Tenant}){
  return <section className="iv-faq-section" id="preguntas"><div className="iv-faq-inner"><div className="iv-faq-copy"><span>Compra sencilla</span><h2>Tu compra, clara desde el inicio.</h2><p>Te acompañamos para confirmar producto, disponibilidad, envío y pago antes de completar tu pedido.</p></div><div className="iv-faq-list"><details><summary>¿Cómo hago un pedido?</summary><p>Agrega tus productos al carrito, completa tus datos y selecciona la modalidad de entrega. Al finalizar, enviamos el resumen por WhatsApp.</p></details><details><summary>¿Cómo se confirma la disponibilidad?</summary><p>El catálogo refleja la información sincronizada desde CUYRA y el equipo de {tenant.public_name} confirma la disponibilidad final antes de cerrar el pedido.</p></details><details><summary>¿Cuándo confirmo el pago?</summary><p>La forma de pago se coordina con el equipo antes de completar la compra. Los métodos disponibles aparecen durante el checkout.</p></details></div></div></section>
}
function StoreSupportCta({tenant}:{tenant:Tenant}){
  const phone=phoneDigits(tenant.phone||'')
  if(!phone)return null
  return <section className="iv-support-cta"><div><span>Atención directa</span><h2>¿No encuentras lo que necesitas?</h2><p>Escríbenos y te ayudamos a consultar opciones y disponibilidad.</p></div><a href={openWhatsApp(phone,`Hola ${tenant.public_name}, quiero consultar por un producto.`)} target="_blank" rel="noreferrer">Escribir por WhatsApp <ExternalLink size={16}/></a></section>
}
function StoreBenefits({tenant}:{tenant:Tenant}){
  const items=[
    {icon:'💲',title:'Precios claros',text:'Consulta precio detal y mayor en una misma vista.',kind:'price'},
    {icon:'🚚',title:'Compra con opciones de entrega',text:'Coordina envío o retiro según la configuración de la tienda.',kind:'delivery'},
    {icon:'💬',title:'Atención directa',text:`El equipo de ${tenant.public_name} confirma contigo los detalles del pedido.`,kind:'support'},
    {icon:'✓',title:'Pedido verificado',text:'El resumen se valida antes de enviarlo por WhatsApp.',kind:'check'}
  ]
  const[index,setIndex]=useState(0),[paused,setPaused]=useState(false)
  useEffect(()=>{if(paused)return;const id=setInterval(()=>setIndex(x=>(x+1)%items.length),6000);return()=>clearInterval(id)},[paused])
  const item=items[index]
  return <section className="iv-benefits" id="beneficios" data-paused={paused?'true':'false'} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}><span className="iv-benefits-glow"/><div className="iv-benefits-inner"><span className={`iv-benefit-icon iv-benefit-${item.kind}`}>{item.icon}</span><div className="iv-benefit-copy" key={index}><small>Una compra más sencilla</small><h3>{item.title}</h3><p>{item.text}</p></div><div className="iv-benefit-controls"><div className="iv-benefit-dots">{items.map((x,i)=><button key={x.title} className={i===index?'active':''} onClick={()=>setIndex(i)} aria-label={`Mostrar ${x.title}`}/>)}</div><button onClick={()=>setIndex(x=>(x-1+items.length)%items.length)} aria-label="Anterior"><ChevronLeft/></button><button onClick={()=>setIndex(x=>(x+1)%items.length)} aria-label="Siguiente"><ChevronRight/></button></div></div><div key={`progress-${index}`} className="iv-benefit-progress"/></section>
}

function ProductCard({tenant,product:p,isFavorite,onFavorite,onAdd}:{tenant:Tenant;product:Product;isFavorite:boolean;onFavorite:(p:Product)=>void;onAdd:(p:Product)=>void}){
  const out=isOut(p),priced=hasPrice(p.price_usd),commerce=tenant.commerce_settings_json||{}
  const discount=p.compare_at_price_usd&&p.compare_at_price_usd>p.price_usd&&p.price_usd>0?Math.round((1-p.price_usd/p.compare_at_price_usd)*100):0
  const wholesale=wholesaleTier(Number(p.wholesale_retail_price_usd??p.price_usd),p.wholesale_price_usd,p.wholesale_min_quantity,1)
  const productHref=productUrl(tenant.slug,p.source_product_id),ratingCount=Number(p.rating_count||0),stars=Math.round(Number(p.rating_value||0))
  const promoLabel=p.promo_badge||((discount>0)?`-${discount}%`:'')
  const hasVariants=Number(p.variant_count||0)>1
  return <article className={`iv-product-card v5-product-card ${out?'is-out':''}`}>
    <div className="iv-card-media v5-card-media"><a href={productHref} aria-label={`Ver ${p.name}`} onClick={()=>track(tenant.slug,'product_view',{productId:p.source_product_id,source:'card'})}>{p.image_url?<img src={p.image_url} alt={p.name} loading="lazy" decoding="async"/>:<span className="iv-card-placeholder"><PackageSearch size={37}/></span>}</a>
      <div className="v5-card-badges">{promoLabel&&<span className="iv-card-badge promo">{promoLabel}</span>}{(p.recommended||p.featured)&&<span className="iv-card-badge">{p.recommended?'Recomendado':'Destacado'}</span>}</div>
      <button className={`v5-favorite ${isFavorite?'active':''}`} type="button" onClick={()=>onFavorite(p)} aria-label={isFavorite?'Quitar de favoritos':'Agregar a favoritos'}><Heart size={17} fill={isFavorite?'currentColor':'none'}/></button>
      {out&&tenant.show_stock_mode!=='hidden'&&<div className="iv-card-soldout"><span>Agotado</span></div>}
    </div>
    <div className="iv-card-body v5-card-content"><span className="iv-card-brand">{p.brand||p.category||'Catálogo'}</span><a className="iv-card-name" href={productHref}>{p.name}</a>
      <a className="v5-mini-rating" href={`${productHref}#opiniones`} aria-label={`Ver opiniones de ${p.name}`}><span className="v5-mini-stars">{[1,2,3,4,5].map(i=><Star key={i} size={12} fill={ratingCount&&i<=stars?'currentColor':'none'}/>)}</span><b>{ratingCount?Number(p.rating_value||0).toFixed(1):'Nuevo'}</b><small>{ratingCount?`(${ratingCount})`:'Sin reseñas'}</small></a>
      <div className="v5-card-bottom"><div className="v5-card-pricing"><span>{p.has_price_range?'Desde':'Precio detal'}</span>{p.compare_at_price_usd&&p.compare_at_price_usd>p.price_usd&&p.price_usd>0&&<del>{money(p.compare_at_price_usd)}</del>}<strong>{priced?money(p.price_usd):'Consultar'}</strong>{priced&&p.price_bs>0&&<small>{bs(p.price_bs)}</small>}</div>{commerce.showWholesalePrice!==false&&wholesale.eligible&&<div className="v5-wholesale v63-card-wholesale" aria-label={`Precio al mayor: ${money(wholesale.wholesalePrice)} por unidad, desde ${wholesale.minimum} unidades`}>
          <span className="v63-wholesale-kicker"><Boxes size={13}/>{commerce.wholesaleLabel||'Precio al mayor'}</span>
          <div className="v63-wholesale-inline"><b>{money(wholesale.wholesalePrice)} <em>/u</em></b><strong>Desde {wholesale.minimum} uds.</strong></div>
          <small>Ahorra {money(wholesale.savingPerUnit)} por unidad{p.wholesale_variant_label&&Number(p.variant_count)>1?` · ${p.wholesale_variant_label}`:''}</small>
        </div>}</div>
      <div className="v5-card-actions">{out?<a className="v5-card-primary ghost" href={productHref}>Ver producto <ArrowRight size={16}/></a>:!priced?<a className="v5-card-primary ghost" href={productHref}>Consultar <ArrowRight size={16}/></a>:hasVariants?<a className="v5-card-primary" href={productHref}>Elegir opción <ArrowRight size={16}/></a>:<button className="v5-card-primary" onClick={()=>onAdd(p)} type="button"><Plus size={16}/> Agregar</button>}<a className="v5-card-detail" href={productHref} aria-label="Ver detalles"><ArrowRight size={18}/></a></div>
    </div>
  </article>
}
function OrderDrawer({tenant,items,onClose,onChange,onRemove,onCheckout}:{tenant:Tenant;items:OrderItem[];onClose:()=>void;onChange:(id:number,qty:number,variantId?:number|null)=>void;onRemove:(id:number,variantId?:number|null)=>void;onCheckout:()=>void}){
  const total=cartTotal(items),count=items.reduce((s,x)=>s+x.qty,0)
  const savings=items.reduce((sum,x)=>sum+wholesaleTier(x.priceUsd,x.wholesalePriceUsd,x.wholesaleMinQuantity,x.qty).savingTotal,0)
  return <div className="drawer-backdrop commerce-backdrop" onClick={onClose}><aside className="commerce-drawer cart-drawer-v2" onClick={(e:any)=>e.stopPropagation()}><div className="commerce-head"><div><span>CARRITO</span><h3>{count?`${count} producto${count===1?'':'s'}`:'Tu carrito está vacío'}</h3></div><button onClick={onClose} aria-label="Cerrar panel"><X/></button></div>{items.length===0?<div className="commerce-empty"><ShoppingBag/><b>Tu carrito está vacío</b><p>Agrega productos y luego completa el pedido en pocos pasos.</p></div>:<><div className="order-items">{items.map(x=><article key={`${x.id}-${x.variantId||0}`}><div className="order-thumb">{x.imageUrl?<img src={x.imageUrl} alt=""/>:<PackageSearch/>}</div><div className="order-copy"><b>{x.name}</b><small>SKU {x.sku}{x.variantLabel?` · ${x.variantLabel}`:''}</small><strong>{displayMoney(cartUnitPrice(x))}</strong>{wholesaleTier(x.priceUsd,x.wholesalePriceUsd,x.wholesaleMinQuantity,x.qty).active&&<small className="v52-cart-wholesale">Precio mayorista aplicado</small>}<div className="qty-control"><button onClick={()=>onChange(x.id,Math.max(1,x.qty-1),x.variantId)}><Minus/></button><span>{x.qty}</span><button onClick={()=>onChange(x.id,x.qty+1,x.variantId)}><Plus/></button></div></div><button className="remove-item" onClick={()=>onRemove(x.id,x.variantId)} aria-label="Quitar producto del carrito"><Trash2/></button></article>)}</div><div className="order-summary"><span>Total referencial</span><strong>{money(total)}</strong>{savings>0&&<div className="v6-cart-saving"><BadgeCheck size={16}/> Ahorras {money(savings)} por comprar al mayor</div>}<small>Precios y disponibilidad sujetos a confirmación de la tienda.</small></div><button className="drawer-primary" onClick={onCheckout}><ShoppingBag/> Finalizar pedido</button><button className="drawer-secondary" onClick={onClose}>Seguir comprando</button></>}</aside></div>
}

function FavoritesDrawer({tenant,items,onClose,onRemove,onAdd}:{tenant:Tenant;items:StoredProduct[];onClose:()=>void;onRemove:(id:number)=>void;onAdd:(p:StoredProduct)=>void}){
  return <div className="drawer-backdrop commerce-backdrop" onClick={onClose}><aside className="commerce-drawer" onClick={(e:any)=>e.stopPropagation()}><div className="commerce-head"><div><span>FAVORITOS</span><h3>{items.length?`${items.length} guardado${items.length===1?'':'s'}`:'Aún no tienes favoritos'}</h3></div><button onClick={onClose} aria-label="Cerrar panel"><X/></button></div>{items.length===0?<div className="commerce-empty"><Heart/><b>Guarda lo que te interesa</b><p>Los favoritos quedan guardados en este dispositivo.</p></div>:<div className="favorite-items">{items.map(x=><article key={x.id}><a className="order-thumb" href={productUrl(tenant.slug,x.id)}>{x.imageUrl?<img src={x.imageUrl} alt=""/>:<PackageSearch/>}</a><div className="order-copy"><a href={productUrl(tenant.slug,x.id)}><b>{x.name}</b></a><small>SKU {x.sku}</small><strong>{displayMoney(x.priceUsd)}</strong>{x.hasVariants&&!x.variantId?<a className="mini-add" href={productUrl(tenant.slug,x.id)}><Layers3/> Elegir variante</a>:<button className="mini-add" onClick={()=>onAdd(x)}><Plus/> Agregar a lista</button>}</div><button className="remove-item" onClick={()=>onRemove(x.id)}><Trash2/></button></article>)}</div>}</aside></div>
}

function RecentStrip({tenant,items,onFavorite,onAdd,favoriteIds}:{tenant:Tenant;items:StoredProduct[];onFavorite:(x:StoredProduct)=>void;onAdd:(x:StoredProduct)=>void;favoriteIds:Set<number>}){
  if(!items.length)return null
  return <section className="recent-section"><div className="section-heading-row"><div><span className="section-kicker">CONTINÚA EXPLORANDO</span><h2>Vistos recientemente</h2></div></div><div className="recent-rail">{items.slice(0,6).map(x=><article key={x.id}><a href={productUrl(tenant.slug,x.id)} className="recent-thumb">{x.imageUrl?<img src={x.imageUrl} alt=""/>:<PackageSearch/>}</a><div><a href={productUrl(tenant.slug,x.id)}><b>{x.name}</b></a><strong>{displayMoney(x.priceUsd)}</strong></div><div className="recent-actions"><button className={favoriteIds.has(x.id)?'active':''} onClick={()=>onFavorite(x)}><Heart fill={favoriteIds.has(x.id)?'currentColor':'none'}/></button><button onClick={()=>onAdd(x)}><Plus/></button></div></article>)}</div></section>
}

function Storefront({slug}:{slug:string}){
  const urlParams=new URLSearchParams(location.search)
  const[data,setData]=useState<CatalogResult|null>(null),[q,setQ]=useState(()=>urlParams.get('q')||''),[search,setSearch]=useState(()=>urlParams.get('q')||''),
    [category,setCategory]=useState(()=>urlParams.get('category')||''),[subcategory,setSubcategory]=useState(()=>urlParams.get('subcategory')||''),[brand,setBrand]=useState(()=>urlParams.get('brand')||''),
    [availability,setAvailability]=useState(()=>urlParams.get('availability')||''),[minPrice,setMinPrice]=useState(()=>urlParams.get('minPrice')||''),[maxPrice,setMaxPrice]=useState(()=>urlParams.get('maxPrice')||''),
    [featuredOnly,setFeaturedOnly]=useState(()=>urlParams.get('featured')==='1'),[promoOnly,setPromoOnly]=useState(()=>urlParams.get('promo')==='1'),[sort,setSort]=useState(()=>urlParams.get('sort')||'featured'),[page,setPage]=useState(1),
    [error,setError]=useState(''),[loading,setLoading]=useState(true),[filtersOpen,setFiltersOpen]=useState(false),[searchFocus,setSearchFocus]=useState(false),
    [favorites,setFavorites]=useState<StoredProduct[]>([]),[order,setOrder]=useState<OrderItem[]>([]),[favoritesOpen,setFavoritesOpen]=useState(false),[orderOpen,setOrderOpen]=useState(false),[checkoutOpen,setCheckoutOpen]=useState(false)

  useEffect(()=>{const t=setTimeout(()=>setSearch(q.trim()),260);return()=>clearTimeout(t)},[q])
  useEffect(()=>setPage(1),[search,category,subcategory,brand,availability,minPrice,maxPrice,featuredOnly,promoOnly,sort])
  useEffect(()=>{setFavorites(loadFavorites(slug));setOrder(loadOrder(slug))},[slug])
  useEffect(()=>{
    setLoading(true);setError('')
    const p=new URLSearchParams({slug,page:String(page),limit:'24',sort})
    if(search)p.set('q',search);if(category)p.set('category',category);if(subcategory)p.set('subcategory',subcategory);if(brand)p.set('brand',brand);if(availability)p.set('availability',availability);if(minPrice)p.set('minPrice',minPrice);if(maxPrice)p.set('maxPrice',maxPrice);if(featuredOnly)p.set('featured','1');if(promoOnly)p.set('promo','1')
    fetch(`/api/catalog?${p}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo abrir el catálogo');return x}).then((x:CatalogResult)=>{setData(x);setTenantManifest(slug);setPageSeo(`${x.tenant.public_name} · Catálogo Online`,x.tenant.hero_subtitle||`Explora productos, precios y disponibilidad de ${x.tenant.public_name}.`,x.tenant.logo_url);track(slug,'catalog_view',{total:x.total})}).catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false))
  },[slug,search,category,subcategory,brand,availability,minPrice,maxPrice,featuredOnly,promoOnly,sort,page])
  useEffect(()=>{if(search.length>=2)track(slug,'search',{q:search.slice(0,100)})},[slug,search])
  useMotionReveal(`${loading}-${data?.total??0}-${page}`)

  const tenant=data?.tenant||null,accent=tenant?.accent_color||'#001A9C',phone=phoneDigits(tenant?.phone||'')
  const navFacets={categories:data?.facets.categories||[],brands:data?.facets.brands||[]}
  const favoriteIds=useMemo(()=>new Set(favorites.map(x=>x.id)),[favorites]),orderCount=order.reduce((s,x)=>s+x.qty,0)
  const activeFilters=[category,subcategory,brand,tenant?.show_stock_mode==='hidden'?'':availability,minPrice,maxPrice,featuredOnly?'featured':'',promoOnly?'promo':''].filter(Boolean).length
  const clearAll=()=>{setCategory('');setSubcategory('');setBrand('');setAvailability('');setMinPrice('');setMaxPrice('');setFeaturedOnly(false);setPromoOnly(false);setQ('')}
  const toggleFavoriteProduct=(p:Product)=>{const snap=snapshot(p,slug);setFavorites(old=>{const exists=old.some(x=>x.id===p.source_product_id);const next=exists?old.filter(x=>x.id!==p.source_product_id):[snap,...old].slice(0,60);persist('favorites',slug,next);if(!exists)track(slug,'favorite',{productId:p.source_product_id});return next})}
  const addStoredToOrder=(x:StoredProduct)=>setOrder(old=>{const idx=old.findIndex(y=>y.id===x.id&&y.variantId===x.variantId);const next=idx>=0?old.map((y,i)=>i===idx?{...y,qty:y.qty+1}:y):[...old,{...x,qty:1}];persist('order',slug,next);track(slug,'add_to_list',{productId:x.id});return next})
  const addProductToOrder=(p:Product)=>addStoredToOrder(snapshot(p,slug))
  const changeQty=(id:number,qty:number,variantId?:number|null)=>setOrder(old=>{const next=old.map(x=>x.id===id&&(x.variantId||null)===(variantId||null)?{...x,qty:Math.max(1,qty)}:x);persist('order',slug,next);return next})
  const removeOrder=(id:number,variantId?:number|null)=>setOrder(old=>{const next=old.filter(x=>!(x.id===id&&(x.variantId||null)===(variantId||null)));persist('order',slug,next);return next})
  const removeFavorite=(id:number)=>setFavorites(old=>{const next=old.filter(x=>x.id!==id);persist('favorites',slug,next);return next})

  const filters=<><div className="filter-group"><label>Categoría</label><select value={category} onChange={(e:any)=>{setCategory(e.target.value);setSubcategory('')}}><option value="">Todas</option>{data?.facets.categories.map(x=><option key={x}>{x}</option>)}</select></div><div className="filter-group"><label>Marca</label><select value={brand} onChange={(e:any)=>setBrand(e.target.value)}><option value="">Todas</option>{data?.facets.brands.map(x=><option key={x}>{x}</option>)}</select></div><div className="filter-group price-filter"><label>Rango de precio</label><div className="price-inputs"><label><span>Desde</span><input type="number" min="0" value={minPrice} onChange={(e:any)=>setMinPrice(e.target.value)}/></label><label><span>Hasta</span><input type="number" min="0" value={maxPrice} onChange={(e:any)=>setMaxPrice(e.target.value)}/></label></div></div><div className="filter-group filter-switch-row"><span><b>Ofertas</b><small>Productos con promoción</small></span><button type="button" className={promoOnly?'switch active':'switch'} onClick={()=>setPromoOnly(x=>!x)}><i/></button></div>{tenant?.show_stock_mode!=='hidden'&&<div className="filter-group filter-switch-row"><span><b>Solo disponibles</b><small>Ocultar agotados</small></span><button type="button" className={availability==='available'?'switch active':'switch'} onClick={()=>setAvailability(x=>x==='available'?'':'available')}><i/></button></div>}<button className="clear-filters" onClick={clearAll}>Limpiar filtros</button></>

  return <div className="app theme-commerce iv-store" style={{'--accent':accent,'--tenant-accent':accent,'--iv-primary':accent,'--iv-primary-dark':accent} as React.CSSProperties}>
    <Header tenant={tenant} facets={navFacets} favoriteCount={favorites.length} orderCount={orderCount} onFavorites={()=>setFavoritesOpen(true)} onOrder={()=>setOrderOpen(true)}/>
    <main>
      {tenant&&<StoreHeroCarousel tenant={tenant} total={data?.total??0} featured={data?.products.find(p=>p.featured)||data?.products[0]||null}/>} 
      {tenant?.show_brand_filter!==false&&data?.facets.brands.length?<BrandCarousel tenant={tenant} brands={data.facets.brands} active={brand} onSelect={x=>{setBrand(x);setPage(1);setTimeout(()=>document.getElementById('productos')?.scrollIntoView({behavior:'smooth'}),80)}}/>:null}
      <section id="productos" className="iv-catalog-section">
        <div className="iv-catalog-heading"><div><span>Catálogo</span><div className="iv-catalog-title-row"><h2>{category||brand||(search?'Resultados de búsqueda':'Encuentra tu próximo producto')}</h2><b>{data?.total??0} {(data?.total??0)===1?'producto':'productos'}</b></div><p>Explora novedades y consulta precios por unidad o al mayor.</p></div><div className={`iv-catalog-search ${searchFocus?'focused':''}`}><Search/><input value={q} onFocus={()=>setSearchFocus(true)} onBlur={()=>setTimeout(()=>setSearchFocus(false),160)} onChange={(e:any)=>setQ(e.target.value)} placeholder="Buscar por nombre, marca, SKU o modelo"/><SearchSuggestions slug={slug} q={q} open={searchFocus} onPick={()=>setSearchFocus(false)}/></div></div>
        {tenant?.show_category_nav!==false&&data?.facets.categories.length?<CategoryRail categories={data.facets.categories} active={category} onSelect={x=>{setCategory(x);setSubcategory('');setPage(1)}}/>:null}
        {loading?<ProductSkeleton/>:error?<div className="iv-store-empty"><Info/><h3>No pudimos cargar el catálogo</h3><p>{error}</p><button onClick={()=>location.reload()}>Reintentar</button></div>:data?.products.length===0?<div className="iv-store-empty"><Sparkles/><h3>No encontramos esos productos.</h3><p>Prueba otra búsqueda o cambia de categoría. También podemos ayudarte por WhatsApp.</p>{phone&&<a href={openWhatsApp(phone,`Hola ${tenant?.public_name||''}, quiero consultar un producto.`)} target="_blank" rel="noreferrer">Consultar producto <ArrowRight/></a>}</div>:<div className="iv-product-grid">{data?.products.map((p,i)=><div className="iv-product-card-wrap" style={{animationDelay:`${Math.min(i,7)*55}ms`}} key={`${p.source_group_id||'p'}-${p.source_product_id}`}><ProductCard tenant={data.tenant} product={p} isFavorite={favoriteIds.has(p.source_product_id)} onFavorite={toggleFavoriteProduct} onAdd={addProductToOrder}/></div>)}</div>}
        {data&&data.pages>1&&<div className="iv-pager"><button disabled={page<=1} onClick={()=>setPage(x=>Math.max(1,x-1))}><ChevronLeft/> Anterior</button><span>Página {page} de {data.pages}</span><button disabled={page>=data.pages} onClick={()=>setPage(x=>Math.min(data.pages,x+1))}>Siguiente <ChevronRight/></button></div>}
      </section>
      {tenant&&<StoreFaq tenant={tenant}/>} {tenant&&<StoreSupportCta tenant={tenant}/>} {tenant&&<StoreBenefits tenant={tenant}/>} 
    </main>
    {tenant&&favoritesOpen&&<FavoritesDrawer tenant={tenant} items={favorites} onClose={()=>setFavoritesOpen(false)} onRemove={removeFavorite} onAdd={addStoredToOrder}/>} 
    {tenant&&orderOpen&&<OrderDrawer tenant={tenant} items={order} onClose={()=>setOrderOpen(false)} onChange={changeQty} onRemove={removeOrder} onCheckout={()=>{setOrderOpen(false);setCheckoutOpen(true)}}/>} 
    {tenant&&checkoutOpen&&<CheckoutConfirmation tenant={tenant} items={order} onClose={()=>{setCheckoutOpen(false);setOrderOpen(true)}} onDone={()=>{persist('order',slug,[]);setOrder([]);setCheckoutOpen(false)}}/>} 
    {phone&&<a className="floating-wa" href={openWhatsApp(phone,`Hola ${tenant?.public_name||''}, vengo del catálogo y quisiera recibir atención.`)} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp"><WhatsAppIcon size={27}/></a>}
    {tenant&&<nav className="iv-mobile-nav" aria-label="Navegación móvil"><a className="active" href="#inicio"><Store/><span>Inicio</span></a><a href="#productos"><Grid3X3/><span>Catálogo</span></a><button onClick={()=>{setPromoOnly(true);setFeaturedOnly(false);document.getElementById('productos')?.scrollIntoView({behavior:'smooth'})}}><Tag/><span>Ofertas</span></button><button onClick={()=>setOrderOpen(true)}><ShoppingBag/><span>Carrito</span>{orderCount>0&&<b>{orderCount}</b>}</button><a href={phone?openWhatsApp(phone,`Hola ${tenant.public_name}, necesito ayuda.`):'#preguntas'} target={phone?'_blank':undefined} rel={phone?'noreferrer':undefined}><Headphones/><span>Ayuda</span></a></nav>}
    <Footer tenant={tenant}/>
  </div>
}

function ProductDetail({slug,productId}:{slug:string;productId:number}){
  const[data,setData]=useState<ProductResult|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[selectedVariantId,setSelectedVariantId]=useState<number|null>(null),[qty,setQty]=useState(1),[copied,setCopied]=useState(false),[favorites,setFavorites]=useState<StoredProduct[]>([]),[order,setOrder]=useState<OrderItem[]>([]),[favoritesOpen,setFavoritesOpen]=useState(false),[orderOpen,setOrderOpen]=useState(false),[galleryIndex,setGalleryIndex]=useState(0),[zoomOpen,setZoomOpen]=useState(false),[touchStartX,setTouchStartX]=useState<number|null>(null),[checkoutOpen,setCheckoutOpen]=useState(false)
  const nav=useNavFacets(slug,true)
  useEffect(()=>{setFavorites(loadFavorites(slug));setOrder(loadOrder(slug))},[slug])
  useEffect(()=>{
    setLoading(true);setError('')
    fetch(`/api/product?slug=${encodeURIComponent(slug)}&productId=${productId}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo abrir el producto');return x})
      .then((x:ProductResult)=>{setData(x);setTenantManifest(slug);const variants=x.product.variants||[];const first=variants.find(v=>v.availability!=='out')||variants[0];setSelectedVariantId(first?.source_product_id||null);setPageSeo(`${x.product.name} · ${x.tenant.public_name}`,x.product.description||`Consulta ${x.product.name} en el catálogo de ${x.tenant.public_name}.`,first?.image_url||x.product.image_url);track(slug,'product_view',{productId:x.product.source_product_id,source:'detail'})}).catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false))
  },[slug,productId])
  useMotionReveal(`${loading}-${data?.product.source_product_id??0}-${selectedVariantId??0}`)
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
  useEffect(()=>{
    const variants=data?.product.variants||[]
    const current=variants.find(v=>v.source_product_id===selectedVariantId)||null
    const stock=current?.stock_exact??data?.product.stock_exact
    if(typeof stock==='number' && Number.isFinite(stock) && stock>0)setQty(v=>Math.max(1,Math.min(v,stock)))
  },[data,selectedVariantId])
  if(loading)return <div className="app" style={{'--accent':accent} as React.CSSProperties}><Header tenant={nav.tenant||tenant} facets={nav.facets}/><div className="detail-loading"><LoaderCircle className="spin"/> Cargando producto...</div></div>
  if(error||!data)return <div className="app" style={{'--accent':accent} as React.CSSProperties}><Header tenant={nav.tenant||tenant} facets={nav.facets}/><div className="detail-loading error"><PackageSearch/><b>Producto no disponible</b><span>{error||'Producto no encontrado'}</span><a href={collectionUrl(slug)}>Volver al catálogo</a></div></div>

  const p=data.product,variants=p.variants||[],selected=variants.find(v=>v.source_product_id===selectedVariantId)||variants.find(v=>v.availability!=='out')||variants[0]||null
  const phone=phoneDigits(data.tenant.phone||''),features=featureLines(p.features||''),selectedOut=selected?isOut(selected):isOut(p)
  const selectedPrice=selected?.price_usd??p.price_usd,selectedPriceBs=selected?.price_bs??p.price_bs,selectedImage=selected?.image_url||p.image_url,selectedSku=selected?.sku||p.sku
  // Variant switch may reduce available stock. The selector never requests more than that variant has.
  const maxSelectedQty=typeof (selected?.stock_exact??p.stock_exact)==='number'?Math.max(1,Number(selected?.stock_exact??p.stock_exact)):9999
  const selectedWholesalePrice=Number((selected?.wholesale_price_usd??p.wholesale_price_usd)||0),selectedWholesaleMin=Math.max(0,Math.trunc(Number((selected?.wholesale_min_quantity??p.wholesale_min_quantity)||0))),selectedPriced=hasPrice(selectedPrice)
  const tier=wholesaleTier(Number(selectedPrice),selectedWholesalePrice,selectedWholesaleMin,Math.min(qty,maxSelectedQty))
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
  const share=async()=>{try{if(navigator.share)await navigator.share({title:p.name,text:`${p.name} · ${displayMoney(selectedPrice)}`,url:location.href});else{await navigator.clipboard.writeText(location.href);setCopied(true);setTimeout(()=>setCopied(false),1600)}track(slug,'share',{productId:p.source_product_id})}catch{}}
  return <div className={`app product-page theme-${effectiveTheme(data.tenant)}`} style={{'--accent':data.tenant.accent_color||'#1368ff','--tenant-accent':data.tenant.accent_color||'#1368ff'} as React.CSSProperties}>
    <Header tenant={nav.tenant||data.tenant} facets={nav.facets} favoriteCount={favorites.length} orderCount={orderCount} onFavorites={()=>setFavoritesOpen(true)} onOrder={()=>setOrderOpen(true)}/>
    <main>
      <nav className="breadcrumbs"><a href={collectionUrl(slug)}><ArrowLeft size={14}/> Catálogo</a><span>/</span>{p.category&&<><a href={collectionUrl(slug,{category:p.category})}>{p.category}</a><span>/</span></>}<b>{p.name}</b></nav>
      <section className="product-detail v4-detail">
        <div className="detail-gallery"><div className="detail-media" onTouchStart={galleryTouchStart} onTouchEnd={galleryTouchEnd}>{activeImage?<button className="detail-main-image" onClick={()=>setZoomOpen(true)} aria-label="Ampliar imagen"><img src={activeImage} alt={`${p.name}${selected?.label?` · ${selected.label}`:''}`}/></button>:<PackageSearch/>}{selectedGallery.length>1&&<><button type="button" className="gallery-arrow prev" aria-label="Foto anterior" onClick={()=>galleryMove(-1)}><ChevronLeft/></button><button type="button" className="gallery-arrow next" aria-label="Foto siguiente" onClick={()=>galleryMove(1)}><ChevronRight/></button><span className="gallery-counter">{galleryIndex+1} / {selectedGallery.length}</span></>}<div className="detail-media-badges">{p.featured&&<span className="featured-badge"><Star size={11}/> Destacado</span>}{data.tenant.show_stock_mode!=='hidden'&&<span className={selectedOut?'stock-badge out':'stock-badge'}>{selectedStock}</span>}</div><button className={`detail-favorite ${favoriteIds.has(p.source_product_id)?'active':''}`} onClick={toggleFav}><Heart fill={favoriteIds.has(p.source_product_id)?'currentColor':'none'}/></button></div>{selectedGallery.length>1&&<div className="product-gallery-thumbs">{selectedGallery.slice(0,5).map((url,i)=><button key={url} className={galleryIndex===i?'active':''} onClick={()=>setGalleryIndex(i)} aria-label={`Foto ${i+1}`}><img src={url} alt={`${p.name} ${i+1}`}/></button>)}</div>}{variants.length>1&&<div className="variant-thumbs">{variants.filter(v=>v.image_url).slice(0,8).map(v=><button key={v.source_product_id} className={selected?.source_product_id===v.source_product_id?'active':''} onClick={()=>{setSelectedVariantId(v.source_product_id);setGalleryIndex(0)}} title={v.label}>{v.image_url&&<img src={v.image_url} alt={v.label}/>}</button>)}</div>}<div className="media-caption"><RefreshCw size={15}/><span>Información de precio y disponibilidad actualizada</span></div></div>
        <div className="detail-copy"><div className="detail-brand">{p.brand||p.category||'Producto'}</div><h1>{p.name}</h1><RatingLine product={p} large/><div className="detail-identifiers"><span>SKU <b>{selectedSku}</b></span>{p.model&&<span>Modelo <b>{p.model}</b></span>}{variants.length>1&&<span><b>{variants.length}</b> variantes</span>}</div><div className="detail-prices">{p.compare_at_price_usd&&p.compare_at_price_usd>selectedPrice&&selectedPrice>0&&<del>{money(p.compare_at_price_usd)}</del>}<strong>{displayMoney(selectedPrice)}</strong>{selectedPriceBs>0&&selectedPrice>0&&<span>{bs(selectedPriceBs)}</span>}</div>{tier.eligible&&data.tenant.commerce_settings_json?.showWholesalePrice!==false&&<a className="v63-wholesale-teaser" href="#precio-mayor"><Boxes size={15}/><span>Mayor: <b>{money(tier.wholesalePrice)} c/u</b> desde <b>{tier.minimum} uds.</b></span><ChevronDown size={15}/></a>}{effectiveTheme(data.tenant)==='commerce'&&data.tenant.commerce_settings_json?.showWholesalePrice!==false&&tier.eligible&&<section id="precio-mayor" className={`detail-wholesale v52-wholesale ${tier.active?'is-active':''}`} aria-label="Beneficio de compra al mayor">
  <div className="v52-wholesale-top"><span className="v52-wholesale-icon"><Boxes size={19}/></span><div><span className="v52-wholesale-kicker">{data.tenant.commerce_settings_json?.wholesaleLabel||'Precio al mayor'}</span><h2>Compra más y ahorra</h2></div>{tier.active&&<span className="v52-wholesale-status"><Check size={14}/> Aplicado</span>}</div>
  <div className="v52-wholesale-main"><div><strong>{money(tier.wholesalePrice)}</strong><span>por unidad · desde {tier.minimum} unidades</span></div><span className="v52-wholesale-savings">Ahorras {money(tier.savingPerUnit)} por unidad</span></div>
  <div className="v52-wholesale-feedback" role="status">{tier.active?<><CheckCircle2 size={17}/><span>¡Ya tienes precio mayorista! Ahorras <b>{money(tier.savingTotal)}</b> en estas {qty} unidades.</span></>:<><Info size={17}/><span>Agrega <b>{tier.remaining} {tier.remaining===1?'unidad':'unidades'} más</b> para activar el precio al mayor.</span></>}</div>
  {!tier.active&&!selectedOut&&!(typeof (selected?.stock_exact??p.stock_exact)==='number'&&Number(selected?.stock_exact??p.stock_exact)<tier.minimum)&&<button type="button" className="v6-wholesale-shortcut" onClick={()=>setQty(tier.minimum)}><ShoppingBag size={16}/> Comprar {tier.minimum} unidades al mayor <ArrowRight size={15}/></button>}
  <div className="v52-wholesale-progress" role="progressbar" aria-valuemin={0} aria-valuemax={tier.minimum} aria-valuenow={Math.min(qty,tier.minimum)} aria-label="Cantidad para precio al mayor"><span style={{width:`${Math.min(100,qty/tier.minimum*100)}%`}}/></div>
</section>}<div className={selectedOut?'availability out':'availability'}>{selectedOut?<><X size={16}/> Agotado</>:<><CheckCircle2 size={16}/> Disponible</>}{selectedStock&&<small>{selectedStock}</small>}</div>

          {variants.length>1&&<section className="variant-selector"><div className="variant-selector-head"><div><span>Selecciona una variante</span><b>{selected?.label||'—'}</b></div><small>{variants.filter(v=>!isOut(v)).length} disponibles</small></div><div className="variant-options">{variants.map(v=>{const out=isOut(v);return <button type="button" key={v.source_product_id} className={`${selected?.source_product_id===v.source_product_id?'active ':''}${out?'out':''}`} onClick={()=>{setSelectedVariantId(v.source_product_id);setGalleryIndex(0)}}>{v.image_url?<img src={v.image_url} alt=""/>:<span className="variant-placeholder"><Boxes size={18}/></span>}<span><b>{v.label}</b><small>{displayMoney(v.price_usd)} · {out?'Agotado':'Disponible'}</small></span>{selected?.source_product_id===v.source_product_id&&<CheckCircle2 className="variant-check" size={18}/>}</button>})}</div></section>}

          {p.description&&<p className="detail-description">{p.description}</p>}
          <section className="purchase-panel premium-purchase"><div className="purchase-top"><div><span>COMPRA</span><b>{selected?.label?`${selected.label} seleccionada`:'Elige la cantidad'}</b><small>{tier.active?`Precio mayorista activado: ${money(tier.unitPrice)} c/u`:'Agrega al carrito o completa tus datos para comprar ahora.'}</small></div><div className="quantity-field"><span className="quantity-label">Cantidad</span><div className="detail-qty"><button aria-label="Disminuir cantidad" disabled={qty<=1} onClick={()=>setQty(x=>Math.max(1,x-1))}><Minus/></button><strong>{qty}</strong><button aria-label="Aumentar cantidad" onClick={()=>setQty(x=>typeof (selected?.stock_exact??p.stock_exact)==='number'?Math.min(Number(selected?.stock_exact??p.stock_exact),x+1):x+1)} disabled={selectedOut||(typeof (selected?.stock_exact??p.stock_exact)==='number'&&qty>=Number(selected?.stock_exact??p.stock_exact))}><Plus/></button></div></div></div>{selectedPriced&&<div className="v52-purchase-estimate"><span>Total referencial para {qty} {qty===1?'unidad':'unidades'}</span><strong>{money(tier.unitPrice*qty)}</strong></div>}{selectedPriced?<button className="primary-action" disabled={selectedOut} onClick={()=>{const s=snapshot(p,slug,selected);setOrder(old=>{const idx=old.findIndex(y=>y.id===s.id&&(y.variantId||null)===(s.variantId||null));const next=idx>=0?old.map((y,i)=>i===idx?{...y,qty:y.qty+qty}:y):[...old,{...s,qty}];persist('order',slug,next);return next});setCheckoutOpen(true)}}><ShoppingBag/> Comprar ahora</button>:phone?<a className="primary-action" href={openWhatsApp(phone,availabilityText(data.tenant,p,selected))} target="_blank" rel="noreferrer" onClick={()=>track(slug,'whatsapp_consult',{productId:p.source_product_id,variantId:selected?.source_product_id||null})}><WhatsAppIcon size={18}/> Consultar precio</a>:<button className="primary-action" disabled>Consultar precio</button>}<div className="purchase-secondary">{selectedPriced&&<button disabled={selectedOut} onClick={addToOrder}><Plus/> Agregar al carrito</button>}{phone&&<a href={openWhatsApp(phone,availabilityText(data.tenant,p,selected))} target="_blank" rel="noreferrer" onClick={()=>track(slug,'whatsapp_consult',{productId:p.source_product_id,variantId:selected?.source_product_id||null})}><WhatsAppIcon size={18}/> Consultar</a>}</div></section><div className="detail-benefit-row"><span><Truck/> Envío / retiro</span><span><ShieldCheck/> Pedido sujeto a confirmación</span><span><WhatsAppIcon size={18}/> Atención directa</span></div>

          <div className="detail-accordions">{features.length>0&&<details open><summary>Características <ChevronDown size={17}/></summary><div className="accordion-body"><ul>{features.map((x,i)=><li key={i}>{x}</li>)}</ul></div></details>}<details><summary>Información del producto <ChevronDown size={17}/></summary><div className="accordion-body info-grid"><div><span>Categoría</span><b>{p.category||'—'}</b></div><div><span>Subcategoría</span><b>{p.subcategory||'—'}</b></div><div><span>Marca</span><b>{p.brand||'—'}</b></div><div><span>Variante</span><b>{selected?.label||'Única'}</b></div></div></details><details><summary>Precio y disponibilidad <ChevronDown size={17}/></summary><div className="accordion-body"><p>Precio y disponibilidad corresponden a la variante seleccionada y se actualizan desde el sistema de la tienda. {data.tenant.rate_bs_per_usd>0?`Referencia ${data.tenant.rate_source}: ${Number(data.tenant.rate_bs_per_usd).toLocaleString('es-VE')} Bs/USD.`:''}</p></div></details></div>
          <div className="detail-secondary-actions"><button className="share-action" onClick={share}>{copied?<><Check/> Enlace copiado</>:<><Share2/> Compartir producto</>}</button>{data.tenant.website&&<a href={data.tenant.website} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Sitio web</a>}</div>
        </div>
      </section>
      <ReviewSection slug={slug} product={p} reviews={data.reviews||[]}/>
      {data.related.length>0&&<section className="related"><div className="section-heading-row"><div><span className="section-kicker">DESCUBRE MÁS</span><h2>Productos relacionados</h2></div><a href={collectionUrl(slug,{category:p.category||''})}>Ver categoría <ArrowRight size={15}/></a></div><div className="grid related-grid">{data.related.map(x=><ProductCard key={`${x.source_group_id||'p'}-${x.source_product_id}`} tenant={data.tenant} product={x} isFavorite={favoriteIds.has(x.source_product_id)} onFavorite={prod=>{const s=snapshot(prod,slug);setFavorites(old=>{const exists=old.some(y=>y.id===prod.source_product_id),next=exists?old.filter(y=>y.id!==prod.source_product_id):[s,...old].slice(0,60);persist('favorites',slug,next);return next})}} onAdd={prod=>{const s=snapshot(prod,slug);setOrder(old=>{const idx=old.findIndex(y=>y.id===s.id&&!y.variantId);const next=idx>=0?old.map((y,i)=>i===idx?{...y,qty:y.qty+1}:y):[...old,{...s,qty:1}];persist('order',slug,next);return next})}}/>)}</div></section>}
    </main>
    {favoritesOpen&&<FavoritesDrawer tenant={data.tenant} items={favorites} onClose={()=>setFavoritesOpen(false)} onRemove={id=>setFavorites(old=>{const next=old.filter(x=>x.id!==id);persist('favorites',slug,next);return next})} onAdd={x=>setOrder(old=>{const idx=old.findIndex(y=>y.id===x.id&&(y.variantId||null)===(x.variantId||null));const next=idx>=0?old.map((y,i)=>i===idx?{...y,qty:y.qty+1}:y):[...old,{...x,qty:1}];persist('order',slug,next);return next})}/>} 
    {orderOpen&&<OrderDrawer tenant={data.tenant} items={order} onClose={()=>setOrderOpen(false)} onChange={changeQty} onRemove={removeOrder} onCheckout={()=>{setOrderOpen(false);setCheckoutOpen(true)}}/>} 
    {checkoutOpen&&<CheckoutConfirmation tenant={data.tenant} items={order} onClose={()=>setCheckoutOpen(false)} onDone={()=>{persist('order',slug,[]);setOrder([]);setCheckoutOpen(false)}}/>} 
    {orderCount>0&&<button className="floating-order" onClick={()=>setOrderOpen(true)}><ShoppingBag/><span>Carrito</span><b>{orderCount}</b></button>}
    {phone&&<a className="floating-wa" href={openWhatsApp(phone,`Hola ${data.tenant.public_name}, vengo del catálogo y quisiera recibir atención.`)} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp"><WhatsAppIcon size={27}/></a>}
    {zoomOpen&&activeImage&&<div className="gallery-lightbox" role="dialog" aria-modal="true" onClick={()=>setZoomOpen(false)} onTouchStart={galleryTouchStart} onTouchEnd={galleryTouchEnd}><button className="gallery-lightbox-close" onClick={()=>setZoomOpen(false)}><X/></button>{selectedGallery.length>1&&<button className="gallery-lightbox-nav prev" aria-label="Foto anterior" onClick={(e)=>{e.stopPropagation();galleryMove(-1)}}><ChevronLeft/></button>}<img src={activeImage} alt={p.name} onClick={e=>e.stopPropagation()}/>{selectedGallery.length>1&&<button className="gallery-lightbox-nav next" aria-label="Foto siguiente" onClick={(e)=>{e.stopPropagation();galleryMove(1)}}><ChevronRight/></button>}<span>{Math.min(galleryIndex+1,selectedGallery.length)} / {selectedGallery.length}</span></div>}
    <div className="mobile-purchase-dock mobile-product-buybar" aria-label="Acciones de compra"><div className="mobile-dock-price"><small>Precio</small><strong>{displayMoney(tier.unitPrice)}</strong>{tier.active?<small>Mayorista aplicado</small>:tier.eligible?<small>Mayor desde {tier.minimum} uds.</small>:null}</div><button className="mobile-dock-list" aria-label="Agregar al carrito" disabled={selectedOut||!selectedPriced} onClick={addToOrder}><ShoppingCart/><span>Carrito</span>{orderCount>0&&<b>{orderCount}</b>}</button>{selectedPriced?<button className="mobile-dock-wa" disabled={selectedOut} onClick={()=>{const s=snapshot(p,slug,selected);setOrder(old=>{const idx=old.findIndex(y=>y.id===s.id&&(y.variantId||null)===(s.variantId||null));const next=idx>=0?old.map((y,i)=>i===idx?{...y,qty:y.qty+qty}:y):[...old,{...s,qty}];persist('order',slug,next);return next});setCheckoutOpen(true)}}><ShoppingBag/><span>Comprar ahora</span></button>:phone?<a className="mobile-dock-wa" href={openWhatsApp(phone,availabilityText(data.tenant,p,selected))} target="_blank" rel="noreferrer"><WhatsAppIcon size={19}/><span>Consultar</span></a>:<button className="mobile-dock-wa" disabled><span>Consultar</span></button>}</div>
    <Footer tenant={data.tenant}/>
  </div>
}

function ProductSkeleton(){return <div className="iv-product-grid iv-skeleton-grid">{Array.from({length:8}).map((_,i)=><div className="iv-skeleton-card" key={i}><div className="iv-skeleton-media"/><div className="iv-skeleton-body"><span/><b/><b/><i/><i/></div></div>)}</div>}

function Footer({tenant}:{tenant:Tenant|null}){
  if(!tenant)return <footer className="catalog-footer"><div className="footer-bottom"><span>© 2026 CUYRA.</span><span>Powered by <b>CUYRA</b></span></div></footer>
  const commerce=tenant.commerce_settings_json||{},phone=phoneDigits(tenant.phone||''),payments=(commerce.paymentMethods||[]).filter(x=>x.enabled!==false)
  return <footer className="iv-footer" id="contacto"><div className="iv-footer-grid"><div className="iv-footer-brand">{tenant.logo_url?<img src={tenant.logo_url} alt={tenant.public_name}/>:<div className="iv-brand-fallback">{tenant.public_name.slice(0,1).toUpperCase()}</div>}<p>Productos, precios claros y atención directa para que compres con confianza.</p>{tenant.location_text&&<span>{tenant.location_text}</span>}</div><div className="iv-footer-col"><h3>Ayuda</h3><a href="#preguntas">Preguntas frecuentes</a><a href="#beneficios">Envíos y entregas</a><a href="#productos">Catálogo</a><a href={`${collectionUrl(tenant.slug,{promo:'1'})}#productos`}>Ofertas</a></div><div className="iv-footer-col"><h3>Acerca de {tenant.public_name}</h3><p>Catálogo online conectado a CUYRA con productos, precios y disponibilidad actualizados desde la operación de la tienda.</p>{tenant.website&&<a href={tenant.website} target="_blank" rel="noreferrer">Sitio web ↗</a>}{tenant.instagram_url&&<a href={tenant.instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a>}</div><div className="iv-footer-col"><h3>¿Necesitas ayuda?</h3><p>Te ayudamos con disponibilidad, pagos y seguimiento de tu pedido.</p>{phone&&<a className="iv-footer-wa" href={openWhatsApp(phone,`Hola ${tenant.public_name}, necesito ayuda con mi pedido.`)} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>}<small>También atendemos por WhatsApp para coordinar tu compra.</small></div></div><section className="iv-payment-strip"><div><h3>Métodos de pago</h3><p>Se confirman contigo al preparar el pedido.</p></div>{payments.length?<div className="iv-payment-list">{payments.map(x=><span key={x.id}><i>{x.label.trim().charAt(0).toUpperCase()}</i>{x.label}</span>)}</div>:<small>Consulta los métodos disponibles por WhatsApp.</small>}</section><div className="iv-footer-bottom"><span>© {new Date().getFullYear()} {tenant.public_name}. Todos los derechos reservados.</span><span>Powered by <b>CUYRA</b></span></div></footer>
}

if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}

const route=pathInfo()
createRoot(document.getElementById('root')!).render(route.productId?<ProductDetail slug={route.slug} productId={route.productId}/>:route.slug?<Storefront slug={route.slug}/>:<CuyraLanding/>)
