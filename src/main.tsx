import React,{useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {
  Search,PackageSearch,ExternalLink,MessageCircle,ChevronLeft,ChevronRight,
  SlidersHorizontal,X,ArrowLeft,Share2,MapPin,Instagram,Globe2,
  Sparkles,Tag,CheckCircle2,Boxes,Menu,ChevronDown,Store,Clock3,
  ShieldCheck,RefreshCw,ArrowRight,Grid3X3,ShoppingBag
} from 'lucide-react'
import './styles.css'

type Tenant={
  slug:string;public_name:string;phone:string;website:string;accent_color:string;
  show_stock_mode:'exact'|'status'|'hidden';hide_out_of_stock:boolean;rate_bs_per_usd:number;rate_source:string;
  updated_at?:string;logo_url?:string|null;hero_title?:string;hero_subtitle?:string;announcement?:string;
  catalog_theme?:'retail'|'minimal'|'bold';show_brand_filter?:boolean;show_category_nav?:boolean;
  instagram_url?:string;location_text?:string
}
type Variant={source_product_id:number;sku:string;label:string;attributes?:Record<string,unknown>;name?:string;price_usd:number;price_bs:number;stock_exact:number|null;availability:'available'|'out'|null;image_url:string|null}
type Product={
  source_product_id:number;source_group_id?:number|null;group_code?:string;sku:string;name:string;description?:string;category?:string;subcategory?:string;
  brand?:string;model?:string;features?:string;featured?:boolean;price_usd:number;price_usd_max?:number;price_bs:number;price_bs_max?:number;has_price_range?:boolean;
  stock_exact:number|null;availability:'available'|'out'|null;image_url:string|null;updated_at?:string;variant_count?:number;variant_labels?:string[];variants?:Variant[]
}
type CatalogResult={
  ok:boolean;tenant:Tenant;products:Product[];
  facets:{categories:string[];subcategories:string[];brands:string[];priceRange:{min:number;max:number}};
  page:number;pages:number;total:number
}
type ProductResult={ok:boolean;tenant:Tenant;product:Product;related:Product[]}
type NavFacets={categories:string[];brands:string[]}

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
function productUrl(slug:string,id:number){return `/c/${encodeURIComponent(slug)}/p/${id}`}
function collectionUrl(slug:string,params:Record<string,string>={}){
  const q=new URLSearchParams(params).toString()
  return `/c/${encodeURIComponent(slug)}${q?`?${q}`:''}`
}
function stockLabel(tenant:Tenant,p:Product){
  if(tenant.show_stock_mode==='hidden')return ''
  if(tenant.show_stock_mode==='exact')return `${p.stock_exact??0} disponibles`
  return p.availability==='out'?'Agotado':'Disponible'
}
function isOut(p:Product){return p.availability==='out'||(typeof p.stock_exact==='number'&&p.stock_exact<=0)}
function featureLines(v=''){return v.split(/\r?\n/).map(x=>x.trim().replace(/^[•\-]\s*/,'' )).filter(Boolean).slice(0,20)}
function waProduct(tenant:Tenant,p:Product,variant?:Variant|null){
  const phone=phoneDigits(tenant.phone||'')
  if(!phone)return''
  const chosen=variant?` · Variante ${variant.label} · SKU ${variant.sku} · ${money(variant.price_usd)}`:` · SKU ${p.sku}`
  const text=`Hola, estoy interesado en ${p.name}${p.model?` · Modelo ${p.model}`:''}${chosen}. ¿Está disponible?`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
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

function Header({tenant,facets}:{tenant:Tenant|null;facets?:NavFacets}){
  const[mobileOpen,setMobileOpen]=useState(false)
  const phone=phoneDigits(tenant?.phone||'')
  const slug=tenant?.slug||''
  const categories=facets?.categories||[]
  const brands=facets?.brands||[]
  return <>
    {tenant?.announcement&&<div className="announcement"><Sparkles size={14}/><span>{tenant.announcement}</span></div>}
    <header className="top-wrap">
      <div className="top">
        <a className="brand" href={tenant?collectionUrl(tenant.slug):'#'}>
          {tenant?.logo_url?<img className="tenant-logo" src={tenant.logo_url} alt={tenant.public_name}/>:<div className="mark">{(tenant?.public_name||'N').slice(0,1).toUpperCase()}</div>}
          <div><b>{tenant?.public_name||'Nexus Catalog'}</b><span>Catálogo Online</span></div>
        </a>

        {tenant&&<nav className="desktop-nav" aria-label="Navegación principal">
          <a href={`${collectionUrl(slug)}#productos`}>Productos</a>
          {tenant.show_category_nav!==false&&categories.length>0&&<details className="nav-dropdown"><summary>Categorías <ChevronDown size={14}/></summary><div className="nav-panel"><div className="nav-panel-title"><Grid3X3 size={16}/> Explorar categorías</div>{categories.slice(0,16).map(x=><a key={x} href={collectionUrl(slug,{category:x})}>{x}<ArrowRight size={13}/></a>)}</div></details>}
          {tenant.show_brand_filter!==false&&brands.length>0&&<details className="nav-dropdown"><summary>Marcas <ChevronDown size={14}/></summary><div className="nav-panel brand-panel"><div className="nav-panel-title"><Tag size={16}/> Comprar por marca</div>{brands.slice(0,18).map(x=><a key={x} href={collectionUrl(slug,{brand:x})}>{x}<ArrowRight size={13}/></a>)}</div></details>}
          <a href={collectionUrl(slug,{sort:'newest'})}>Novedades</a>
        </nav>}

        <div className="top-actions">
          {tenant?.instagram_url&&<a className="icon-link" href={tenant.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a>}
          {tenant?.website&&<a className="icon-link site-icon" href={tenant.website} target="_blank" rel="noreferrer" aria-label="Sitio web"><Globe2 size={17}/></a>}
          {tenant&&<a className="search-jump" href={`${collectionUrl(slug)}#catalog-search`} aria-label="Buscar productos"><Search size={18}/></a>}
          {phone&&<a className="header-cta" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Contactar</a>}
          {tenant&&<button className="menu-toggle" onClick={()=>setMobileOpen(true)} aria-label="Abrir menú"><Menu size={21}/></button>}
        </div>
      </div>
    </header>

    {mobileOpen&&<div className="mobile-nav-backdrop" onClick={()=>setMobileOpen(false)}><aside className="mobile-nav" onClick={e=>e.stopPropagation()}>
      <div className="mobile-nav-head"><b>Explorar catálogo</b><button onClick={()=>setMobileOpen(false)}><X/></button></div>
      <a href={`${collectionUrl(slug)}#productos`} onClick={()=>setMobileOpen(false)}>Todos los productos <ArrowRight size={16}/></a>
      <a href={collectionUrl(slug,{sort:'newest'})}>Novedades <Clock3 size={16}/></a>
      {tenant?.show_category_nav!==false&&categories.length>0&&<div className="mobile-nav-group"><span>Categorías</span>{categories.slice(0,12).map(x=><a key={x} href={collectionUrl(slug,{category:x})}>{x}</a>)}</div>}
      {tenant?.show_brand_filter!==false&&brands.length>0&&<div className="mobile-nav-group"><span>Marcas</span>{brands.slice(0,12).map(x=><a key={x} href={collectionUrl(slug,{brand:x})}>{x}</a>)}</div>}
      {phone&&<a className="mobile-wa" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Consultar por WhatsApp</a>}
    </aside></div>}
  </>
}

function Storefront({slug}:{slug:string}){
  const urlParams=new URLSearchParams(location.search)
  const[data,setData]=useState<CatalogResult|null>(null),[q,setQ]=useState(()=>urlParams.get('q')||''),[search,setSearch]=useState(()=>urlParams.get('q')||''),
    [category,setCategory]=useState(()=>urlParams.get('category')||''),[subcategory,setSubcategory]=useState(()=>urlParams.get('subcategory')||''),[brand,setBrand]=useState(()=>urlParams.get('brand')||''),
    [availability,setAvailability]=useState(()=>urlParams.get('availability')||''),[sort,setSort]=useState(()=>urlParams.get('sort')||'featured'),[page,setPage]=useState(1),
    [error,setError]=useState(''),[loading,setLoading]=useState(true),[filtersOpen,setFiltersOpen]=useState(false)

  useEffect(()=>{const t=setTimeout(()=>setSearch(q.trim()),240);return()=>clearTimeout(t)},[q])
  useEffect(()=>setPage(1),[search,category,subcategory,brand,availability,sort])
  useEffect(()=>{
    if(!slug){setError('Catálogo no especificado.');setLoading(false);return}
    setLoading(true);setError('')
    const p=new URLSearchParams({slug,page:String(page),limit:'24',sort})
    if(search)p.set('q',search);if(category)p.set('category',category);if(subcategory)p.set('subcategory',subcategory)
    if(brand)p.set('brand',brand);if(availability)p.set('availability',availability)
    fetch(`/api/catalog?${p}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo abrir el catálogo');return x})
      .then((x:CatalogResult)=>{setData(x);document.title=`${x.tenant.public_name} · Catálogo`})
      .catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false))
  },[slug,search,category,subcategory,brand,availability,sort,page])

  const tenant=data?.tenant||null,accent=tenant?.accent_color||'#2563EB'
  const activeFilters=[category,subcategory,brand,tenant?.show_stock_mode==='hidden'?'':availability].filter(Boolean).length
  const heroTitle=tenant?.hero_title||'Encuentra lo que buscas'
  const heroSubtitle=tenant?.hero_subtitle||'Explora productos, precios y disponibilidad actualizados directamente desde Nexus Enterprise Pro.'
  const phone=phoneDigits(tenant?.phone||'')
  const navFacets={categories:data?.facets.categories||[],brands:data?.facets.brands||[]}

  const filters=<>
    <div className="filter-group"><label>Categoría</label><select value={category} onChange={e=>{setCategory(e.target.value);setSubcategory('')}}><option value="">Todas</option>{data?.facets.categories.map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="filter-group"><label>Subcategoría</label><select value={subcategory} onChange={e=>setSubcategory(e.target.value)}><option value="">Todas</option>{data?.facets.subcategories.map(x=><option key={x}>{x}</option>)}</select></div>
    {tenant?.show_brand_filter!==false&&<div className="filter-group"><label>Marca</label><select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">Todas</option>{data?.facets.brands.map(x=><option key={x}>{x}</option>)}</select></div>}
    {tenant?.show_stock_mode!=='hidden'&&<div className="filter-group"><label>Disponibilidad</label><select value={availability} onChange={e=>setAvailability(e.target.value)}><option value="">Todos</option><option value="available">Disponibles</option><option value="out">Agotados</option></select></div>}
    <button className="clear-filters" onClick={()=>{setCategory('');setSubcategory('');setBrand('');setAvailability('');setQ('')}}>Limpiar filtros</button>
  </>

  return <div className={`app theme-${tenant?.catalog_theme||'retail'}`} style={{'--accent':accent} as React.CSSProperties}>
    <Header tenant={tenant} facets={navFacets}/>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={13}/> CATÁLOGO ACTUALIZADO</span>
          <h1>{heroTitle}</h1><p>{heroSubtitle}</p>
          <div className="hero-actions">
            <a className="hero-primary" href="#productos"><ShoppingBag size={17}/> Explorar productos</a>
            {phone&&<a className="hero-secondary" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Consultar</a>}
          </div>
          <div className="hero-meta">
            {tenant?.location_text&&<span><MapPin size={14}/>{tenant.location_text}</span>}
            {tenant?.rate_bs_per_usd>0&&<span><Tag size={14}/>{tenant.rate_source}: {Number(tenant.rate_bs_per_usd).toLocaleString('es-VE')} Bs/USD</span>}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card"><Boxes/><strong>{data?.total??0}</strong><span>productos publicados</span></div>
          <div className="hero-mini mini-one"><RefreshCw/><span>Actualizado desde Nexus</span></div>
          <div className="hero-mini mini-two"><ShieldCheck/><span>Disponibilidad visible</span></div>
          <div className="hero-orb orb-a"/><div className="hero-orb orb-b"/>
        </div>
      </section>

      <section className="store-benefits" aria-label="Beneficios del catálogo">
        <span><RefreshCw size={16}/><b>Información actualizada</b><small>Sincronizada desde Nexus Enterprise Pro</small></span>
        <span><MessageCircle size={16}/><b>Compra asistida</b><small>Consulta directamente por WhatsApp</small></span>
        <span><ShieldCheck size={16}/><b>Disponibilidad clara</b><small>Stock según configuración de la empresa</small></span>
      </section>

      {tenant?.show_category_nav!==false&&data?.facets.categories.length?<section className="category-showcase">
        <div className="section-heading-row"><div><span className="section-kicker">EXPLORA</span><h2>Compra por categoría</h2></div><a href="#productos">Ver todos los productos <ArrowRight size={15}/></a></div>
        <div className="category-cards">
          {data.facets.categories.slice(0,6).map((x,i)=><button key={x} className={category===x?'category-card active':''} onClick={()=>{setCategory(x);document.getElementById('productos')?.scrollIntoView({behavior:'smooth'})}}><span className="category-index">0{i+1}</span><b>{x}</b><small>Ver productos</small><ArrowRight size={17}/></button>)}
        </div>
      </section>:null}

      {tenant?.show_brand_filter!==false&&data?.facets.brands.length?<section className="brand-rail"><span>Marcas</span><div>{data.facets.brands.slice(0,16).map(x=><button className={brand===x?'active':''} key={x} onClick={()=>{setBrand(x);document.getElementById('productos')?.scrollIntoView({behavior:'smooth'})}}>{x}</button>)}</div></section>:null}

      <section className="products-section" id="productos">
        <div className="products-title"><div><span className="section-kicker">CATÁLOGO</span><h2>{category||brand||'Todos los productos'}</h2></div><span className="product-count">{data?.total??0} resultados</span></div>
        <section className="catalog-toolbar" id="catalog-search">
          <div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar producto, SKU, marca o modelo..."/></div>
          <button className="mobile-filter" onClick={()=>setFiltersOpen(true)}><SlidersHorizontal size={17}/> Filtros {activeFilters>0&&<b>{activeFilters}</b>}</button>
          <select className="sort" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="featured">Destacados</option><option value="name">Nombre A–Z</option><option value="newest">Actualizados recientemente</option><option value="price_asc">Precio: menor a mayor</option><option value="price_desc">Precio: mayor a menor</option>
          </select>
        </section>

        <div className="catalog-shell">
          <aside className="filters">
            <div className="filter-title"><SlidersHorizontal size={17}/> Filtrar productos</div>{filters}
          </aside>
          <section className="results">
            <div className="results-head"><span>{data?.total??0} productos</span>{activeFilters>0&&<small>{activeFilters} filtro(s) activo(s)</small>}</div>
            {loading?<ProductSkeleton/>:error?<div className="state error">{error}</div>:data?.products.length===0?<div className="state"><PackageSearch size={34}/><strong>No encontramos productos</strong><span>Prueba con otros filtros o términos de búsqueda.</span></div>:<div className="grid">
              {data?.products.map(p=><ProductCard key={`${p.source_group_id||'p'}-${p.source_product_id}`} tenant={data.tenant} product={p}/>) }
            </div>}
            {data&&data.pages>1&&<div className="pager"><button disabled={page<=1} onClick={()=>setPage(x=>Math.max(1,x-1))}><ChevronLeft/> Anterior</button><span>Página {page} de {data.pages}</span><button disabled={page>=data.pages} onClick={()=>setPage(x=>Math.min(data.pages,x+1))}>Siguiente <ChevronRight/></button></div>}
          </section>
        </div>
      </section>
    </main>
    {filtersOpen&&<div className="drawer-backdrop" onClick={()=>setFiltersOpen(false)}><div className="filter-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><strong>Filtros</strong><button onClick={()=>setFiltersOpen(false)}><X/></button></div>{filters}</div></div>}
    {phone&&<a className="floating-wa" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp"><MessageCircle/></a>}
    <Footer tenant={tenant}/>
  </div>
}

function ProductCard({tenant,product:p}:{tenant:Tenant;product:Product}){
  const phone=phoneDigits(tenant.phone||''),out=isOut(p)
  return <article className={`product-card ${out?'is-out':''}`}>
    <a className="product-image" href={productUrl(tenant.slug,p.source_product_id)}>
      {p.image_url?<img src={p.image_url} alt={p.name} loading="lazy"/>:<PackageSearch/>}
      {p.featured&&<span className="featured-badge"><Sparkles size={12}/> Destacado</span>}
      {tenant.show_stock_mode!=='hidden'&&<span className={out?'stock-badge out':'stock-badge'}>{stockLabel(tenant,p)}</span>}
    </a>
    <div className="product-copy">
      <div className="product-meta"><span>{p.brand||p.category||'Producto'}</span>{p.model&&<small>{p.model}</small>}</div>
      <a className="product-name" href={productUrl(tenant.slug,p.source_product_id)}>{p.name}</a>
      <div className="product-sku">{(p.variant_count||1)>1?`${p.variant_count} variantes disponibles`:`SKU ${p.sku}`}</div>
      {(p.variant_count||1)>1&&p.variant_labels?.length?<div className="variant-preview">{p.variant_labels.slice(0,4).map(x=><span key={x}>{x}</span>)}{p.variant_labels.length>4&&<small>+{p.variant_labels.length-4}</small>}</div>:null}
      <div className="prices"><strong>{p.has_price_range?'Desde ':''}{money(p.price_usd)}</strong>{p.price_bs>0&&<span>{p.has_price_range?'Desde ':''}{bs(p.price_bs)}</span>}</div>
      <div className="card-actions">
        <a className="details-btn" href={productUrl(tenant.slug,p.source_product_id)}>Ver producto <ArrowRight size={14}/></a>
        {phone&&<a className="quick-whatsapp" target="_blank" rel="noreferrer" aria-label="Consultar por WhatsApp" href={waProduct(tenant,p)}><MessageCircle size={17}/></a>}
      </div>
    </div>
  </article>
}

function ProductDetail({slug,productId}:{slug:string;productId:number}){
  const[data,setData]=useState<ProductResult|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[selectedVariantId,setSelectedVariantId]=useState<number|null>(null)
  const nav=useNavFacets(slug,true)
  useEffect(()=>{
    setLoading(true);setError('')
    fetch(`/api/product?slug=${encodeURIComponent(slug)}&productId=${productId}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo abrir el producto');return x})
      .then((x:ProductResult)=>{setData(x);const variants=x.product.variants||[];const first=variants.find(v=>v.availability!=='out')||variants[0];setSelectedVariantId(first?.source_product_id||null);document.title=`${x.product.name} · ${x.tenant.public_name}`}).catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false))
  },[slug,productId])
  const tenant=data?.tenant||null,accent=tenant?.accent_color||'#2563EB'
  if(loading)return <div className="app" style={{'--accent':accent} as React.CSSProperties}><Header tenant={nav.tenant||tenant} facets={nav.facets}/><div className="detail-loading">Cargando producto...</div></div>
  if(error||!data)return <div className="app" style={{'--accent':accent} as React.CSSProperties}><Header tenant={nav.tenant||tenant} facets={nav.facets}/><div className="detail-loading error">{error||'Producto no encontrado'}</div></div>

  const p=data.product,variants=p.variants||[],selected=variants.find(v=>v.source_product_id===selectedVariantId)||variants.find(v=>v.availability!=='out')||variants[0]||null
  const phone=phoneDigits(data.tenant.phone||''),features=featureLines(p.features||''),selectedOut=selected?selected.availability==='out'||(typeof selected.stock_exact==='number'&&selected.stock_exact<=0):isOut(p)
  const selectedPrice=selected?.price_usd??p.price_usd,selectedPriceBs=selected?.price_bs??p.price_bs,selectedImage=selected?.image_url||p.image_url,selectedSku=selected?.sku||p.sku
  const selectedStockLabel=()=>{
    if(data.tenant.show_stock_mode==='hidden')return''
    if(data.tenant.show_stock_mode==='exact')return `${selected?.stock_exact??p.stock_exact??0} disponibles`
    return selectedOut?'Agotado':'Disponible'
  }
  const share=async()=>{const url=location.href;try{if(navigator.share)await navigator.share({title:p.name,url});else await navigator.clipboard.writeText(url)}catch{}}
  return <div className={`app theme-${data.tenant.catalog_theme||'retail'}`} style={{'--accent':data.tenant.accent_color||'#2563EB'} as React.CSSProperties}>
    <Header tenant={nav.tenant||data.tenant} facets={nav.facets}/>
    <main>
      <nav className="breadcrumbs"><a href={collectionUrl(slug)}><ArrowLeft size={14}/> Catálogo</a><span>/</span>{p.category&&<><a href={collectionUrl(slug,{category:p.category})}>{p.category}</a><span>/</span></>}<b>{p.name}</b></nav>
      <section className="product-detail v4-detail">
        <div className="detail-gallery">
          <div className="detail-media">{selectedImage?<img src={selectedImage} alt={`${p.name}${selected?.label?` · ${selected.label}`:''}`}/>:<PackageSearch/>}{data.tenant.show_stock_mode!=='hidden'&&<span className={selectedOut?'stock-badge out':'stock-badge'}>{selectedStockLabel()}</span>}</div>
          {variants.length>1&&<div className="variant-thumbs">{variants.filter(v=>v.image_url).slice(0,6).map(v=><button key={v.source_product_id} className={selected?.source_product_id===v.source_product_id?'active':''} onClick={()=>setSelectedVariantId(v.source_product_id)} title={v.label}>{v.image_url&&<img src={v.image_url} alt={v.label}/>}</button>)}</div>}
          <div className="media-caption"><Store size={15}/><span>Inventario sincronizado desde Nexus Enterprise Pro</span></div>
        </div>
        <div className="detail-copy">
          <div className="detail-brand">{p.brand||p.category||'Producto'}</div>
          <h1>{p.name}</h1>
          <div className="detail-identifiers"><span>SKU <b>{selectedSku}</b></span>{p.model&&<span>Modelo <b>{p.model}</b></span>}{variants.length>1&&<span><b>{variants.length}</b> variantes</span>}</div>
          <div className="detail-prices"><strong>{money(selectedPrice)}</strong>{selectedPriceBs>0&&<span>{bs(selectedPriceBs)}</span>}</div>
          <div className={selectedOut?'availability out':'availability'}>{selectedOut?<><X size={16}/> Agotado</>:<><CheckCircle2 size={16}/> Disponible</>}</div>

          {variants.length>1&&<section className="variant-selector">
            <div className="variant-selector-head"><div><span>Selecciona una variante</span><b>{selected?.label||'—'}</b></div><small>{variants.filter(v=>v.availability!=='out').length} disponibles</small></div>
            <div className="variant-options">{variants.map(v=>{const out=v.availability==='out'||(typeof v.stock_exact==='number'&&v.stock_exact<=0);return <button type="button" key={v.source_product_id} className={`${selected?.source_product_id===v.source_product_id?'active ':''}${out?'out':''}`} onClick={()=>setSelectedVariantId(v.source_product_id)}>
              {v.image_url?<img src={v.image_url} alt=""/>:<span className="variant-placeholder"><Boxes size={18}/></span>}
              <span><b>{v.label}</b><small>{money(v.price_usd)} · {out?'Agotado':'Disponible'}</small></span>
              {selected?.source_product_id===v.source_product_id&&<CheckCircle2 className="variant-check" size={18}/>}</button>})}</div>
          </section>}

          {p.description&&<p className="detail-description">{p.description}</p>}

          <div className="purchase-panel">
            <div><b>{selected?.label?`${selected.label} seleccionada`:'¿Te interesa este producto?'}</b><span>La consulta de WhatsApp llevará el SKU y la variante exacta que seleccionaste.</span></div>
            {phone&&<a className="primary-action" href={waProduct(data.tenant,p,selected)} target="_blank" rel="noreferrer"><MessageCircle/> Consultar esta variante por WhatsApp</a>}
          </div>

          <div className="detail-accordions">
            {features.length>0&&<details open><summary>Características <ChevronDown size={17}/></summary><div className="accordion-body"><ul>{features.map((x,i)=><li key={i}>{x}</li>)}</ul></div></details>}
            <details><summary>Información del producto <ChevronDown size={17}/></summary><div className="accordion-body info-grid"><div><span>Categoría</span><b>{p.category||'—'}</b></div><div><span>Subcategoría</span><b>{p.subcategory||'—'}</b></div><div><span>Marca</span><b>{p.brand||'—'}</b></div><div><span>Variante</span><b>{selected?.label||'Única'}</b></div></div></details>
            <details><summary>Precio y disponibilidad <ChevronDown size={17}/></summary><div className="accordion-body"><p>Precio y stock corresponden a la variante seleccionada y se sincronizan desde Nexus Enterprise Pro. {data.tenant.rate_bs_per_usd>0?`Referencia ${data.tenant.rate_source}: ${Number(data.tenant.rate_bs_per_usd).toLocaleString('es-VE')} Bs/USD.`:''}</p></div></details>
          </div>

          <div className="detail-secondary-actions"><button className="share-action" onClick={share}><Share2/> Compartir producto</button>{data.tenant.website&&<a href={data.tenant.website} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Sitio web</a>}</div>
        </div>
      </section>

      {data.related.length>0&&<section className="related"><div className="section-heading-row"><div><span className="section-kicker">DESCUBRE MÁS</span><h2>Productos relacionados</h2></div><a href={collectionUrl(slug,{category:p.category||''})}>Ver categoría <ArrowRight size={15}/></a></div><div className="grid related-grid">{data.related.map(x=><ProductCard key={`${x.source_group_id||'p'}-${x.source_product_id}`} tenant={data.tenant} product={x}/>)}</div></section>}
    </main>
    {phone&&<a className="floating-wa" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp"><MessageCircle/></a>}
    <Footer tenant={data.tenant}/>
  </div>
}

function ProductSkeleton(){return <div className="grid">{Array.from({length:8}).map((_,i)=><div className="skeleton-card" key={i}><div/><span/><span/><b/></div>)}</div>}
function Footer({tenant}:{tenant:Tenant|null}){return <footer><div className="footer-brand"><div className="footer-mark">{(tenant?.public_name||'N').slice(0,1).toUpperCase()}</div><div><b>{tenant?.public_name||'Nexus Catalog'}</b><span>Catálogo actualizado desde Nexus Enterprise Pro.</span></div></div><div className="footer-links">{tenant?.instagram_url&&<a href={tenant.instagram_url} target="_blank" rel="noreferrer"><Instagram size={14}/> Instagram</a>}{tenant?.website&&<a href={tenant.website} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Web</a>}<span>Powered by <b>Nexus Enterprise Pro</b></span></div></footer>}

const route=pathInfo()
createRoot(document.getElementById('root')!).render(route.productId?<ProductDetail slug={route.slug} productId={route.productId}/>:<Storefront slug={route.slug}/>)
