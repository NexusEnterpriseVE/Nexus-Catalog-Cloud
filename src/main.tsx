import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {
  Search,PackageSearch,ExternalLink,MessageCircle,ChevronLeft,ChevronRight,
  SlidersHorizontal,X,ChevronDown,ArrowLeft,Share2,MapPin,Instagram,Globe2,
  Sparkles,Tag,CheckCircle2,Boxes
} from 'lucide-react'
import './styles.css'

type Tenant={
  slug:string;public_name:string;phone:string;website:string;accent_color:string;
  show_stock_mode:'exact'|'status'|'hidden';hide_out_of_stock:boolean;rate_bs_per_usd:number;rate_source:string;
  updated_at?:string;logo_url?:string|null;hero_title?:string;hero_subtitle?:string;announcement?:string;
  catalog_theme?:'retail'|'minimal'|'bold';show_brand_filter?:boolean;show_category_nav?:boolean;
  instagram_url?:string;location_text?:string
}
type Product={
  source_product_id:number;sku:string;name:string;description?:string;category?:string;subcategory?:string;
  brand?:string;model?:string;features?:string;featured?:boolean;price_usd:number;price_bs:number;
  stock_exact:number|null;availability:'available'|'out'|null;image_url:string|null;updated_at?:string
}
type CatalogResult={
  ok:boolean;tenant:Tenant;products:Product[];
  facets:{categories:string[];subcategories:string[];brands:string[];priceRange:{min:number;max:number}};
  page:number;pages:number;total:number
}
type ProductResult={ok:boolean;tenant:Tenant;product:Product;related:Product[]}

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
function stockLabel(tenant:Tenant,p:Product){
  if(tenant.show_stock_mode==='hidden')return ''
  if(tenant.show_stock_mode==='exact')return `${p.stock_exact??0} disponibles`
  return p.availability==='out'?'Agotado':'Disponible'
}
function isOut(p:Product){return p.availability==='out'||(typeof p.stock_exact==='number'&&p.stock_exact<=0)}
function featureLines(v=''){return v.split(/\r?\n/).map(x=>x.trim().replace(/^[•\-]\s*/,'')).filter(Boolean).slice(0,20)}

function Header({tenant}:{tenant:Tenant|null}){
  const phone=phoneDigits(tenant?.phone||'')
  return <>
    {tenant?.announcement&&<div className="announcement">{tenant.announcement}</div>}
    <header className="top">
      <a className="brand" href={tenant?`/c/${tenant.slug}`:'#'}>
        {tenant?.logo_url?<img className="tenant-logo" src={tenant.logo_url} alt={tenant.public_name}/>:<div className="mark">{(tenant?.public_name||'N').slice(0,1).toUpperCase()}</div>}
        <div><b>{tenant?.public_name||'Nexus Catalog'}</b><span>Catálogo Online</span></div>
      </a>
      <div className="top-actions">
        {tenant?.instagram_url&&<a className="icon-link" href={tenant.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a>}
        {tenant?.website&&<a className="site" href={tenant.website} target="_blank" rel="noreferrer"><Globe2 size={15}/> Sitio web</a>}
        {phone&&<a className="header-cta" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Contactar</a>}
      </div>
    </header>
  </>
}

function Storefront({slug}:{slug:string}){
  const[data,setData]=useState<CatalogResult|null>(null),[q,setQ]=useState(''),[search,setSearch]=useState(''),
    [category,setCategory]=useState(''),[subcategory,setSubcategory]=useState(''),[brand,setBrand]=useState(''),
    [availability,setAvailability]=useState(''),[sort,setSort]=useState('featured'),[page,setPage]=useState(1),
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
  const activeFilters=[category,subcategory,brand,availability].filter(Boolean).length
  const heroTitle=tenant?.hero_title||'Encuentra lo que buscas'
  const heroSubtitle=tenant?.hero_subtitle||'Explora productos, precios y disponibilidad actualizados directamente desde Nexus Enterprise Pro.'

  const filters=<>
    <div className="filter-group"><label>Categoría</label><select value={category} onChange={e=>{setCategory(e.target.value);setSubcategory('')}}><option value="">Todas</option>{data?.facets.categories.map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="filter-group"><label>Subcategoría</label><select value={subcategory} onChange={e=>setSubcategory(e.target.value)}><option value="">Todas</option>{data?.facets.subcategories.map(x=><option key={x}>{x}</option>)}</select></div>
    {tenant?.show_brand_filter!==false&&<div className="filter-group"><label>Marca</label><select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">Todas</option>{data?.facets.brands.map(x=><option key={x}>{x}</option>)}</select></div>}
    <div className="filter-group"><label>Disponibilidad</label><select value={availability} onChange={e=>setAvailability(e.target.value)}><option value="">Todos</option><option value="available">Disponibles</option><option value="out">Agotados</option></select></div>
    <button className="clear-filters" onClick={()=>{setCategory('');setSubcategory('');setBrand('');setAvailability('');setQ('')}}>Limpiar filtros</button>
  </>

  return <div className={`app theme-${tenant?.catalog_theme||'retail'}`} style={{'--accent':accent} as React.CSSProperties}>
    <Header tenant={tenant}/>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={13}/> CATÁLOGO ACTUALIZADO</span>
          <h1>{heroTitle}</h1><p>{heroSubtitle}</p>
          <div className="hero-meta">
            {tenant?.location_text&&<span><MapPin size={14}/>{tenant.location_text}</span>}
            {tenant?.rate_bs_per_usd>0&&<span><Tag size={14}/>{tenant.rate_source}: {Number(tenant.rate_bs_per_usd).toLocaleString('es-VE')} Bs/USD</span>}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card"><Boxes/><strong>{data?.total??0}</strong><span>productos publicados</span></div>
          <div className="hero-orb orb-a"/><div className="hero-orb orb-b"/>
        </div>
      </section>

      {tenant?.show_category_nav!==false&&data?.facets.categories.length?<section className="category-strip">
        <button className={!category?'active':''} onClick={()=>setCategory('')}>Todo</button>
        {data.facets.categories.slice(0,12).map(x=><button className={category===x?'active':''} key={x} onClick={()=>setCategory(x)}>{x}</button>)}
      </section>:null}

      <section className="catalog-toolbar">
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
            {data?.products.map(p=><ProductCard key={p.source_product_id} tenant={data.tenant} product={p}/>)}
          </div>}
          {data&&data.pages>1&&<div className="pager"><button disabled={page<=1} onClick={()=>setPage(x=>Math.max(1,x-1))}><ChevronLeft/> Anterior</button><span>Página {page} de {data.pages}</span><button disabled={page>=data.pages} onClick={()=>setPage(x=>Math.min(data.pages,x+1))}>Siguiente <ChevronRight/></button></div>}
        </section>
      </div>
    </main>
    {filtersOpen&&<div className="drawer-backdrop" onClick={()=>setFiltersOpen(false)}><div className="filter-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><strong>Filtros</strong><button onClick={()=>setFiltersOpen(false)}><X/></button></div>{filters}</div></div>}
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
      <div className="product-meta"><span>{p.brand||p.category||'Producto'}</span><code>{p.sku}</code></div>
      <a className="product-name" href={productUrl(tenant.slug,p.source_product_id)}>{p.name}</a>
      {p.model&&<span className="product-model">{p.model}</span>}
      <div className="prices"><strong>{money(p.price_usd)}</strong>{p.price_bs>0&&<span>{bs(p.price_bs)}</span>}</div>
      <div className="card-actions">
        <a className="details-btn" href={productUrl(tenant.slug,p.source_product_id)}>Ver detalles</a>
        {phone&&<a className="quick-whatsapp" target="_blank" rel="noreferrer" aria-label="Consultar por WhatsApp" href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quisiera consultar ${p.name} (${p.sku})`)}`}><MessageCircle size={17}/></a>}
      </div>
    </div>
  </article>
}

function ProductDetail({slug,productId}:{slug:string;productId:number}){
  const[data,setData]=useState<ProductResult|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true)
  useEffect(()=>{
    setLoading(true)
    fetch(`/api/product?slug=${encodeURIComponent(slug)}&productId=${productId}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo abrir el producto');return x})
      .then((x:ProductResult)=>{setData(x);document.title=`${x.product.name} · ${x.tenant.public_name}`}).catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false))
  },[slug,productId])
  const tenant=data?.tenant||null,accent=tenant?.accent_color||'#2563EB'
  if(loading)return <div className="app" style={{'--accent':accent} as React.CSSProperties}><Header tenant={tenant}/><div className="detail-loading">Cargando producto...</div></div>
  if(error||!data)return <div className="app" style={{'--accent':accent} as React.CSSProperties}><Header tenant={tenant}/><div className="detail-loading error">{error||'Producto no encontrado'}</div></div>
  const p=data.product,phone=phoneDigits(data.tenant.phone||''),features=featureLines(p.features||''),out=isOut(p)
  const share=async()=>{const url=location.href;try{if(navigator.share)await navigator.share({title:p.name,url});else await navigator.clipboard.writeText(url)}catch{}}
  return <div className={`app theme-${data.tenant.catalog_theme||'retail'}`} style={{'--accent':data.tenant.accent_color||'#2563EB'} as React.CSSProperties}>
    <Header tenant={data.tenant}/>
    <main>
      <nav className="breadcrumbs"><a href={`/c/${slug}`}>Catálogo</a><span>/</span>{p.category&&<><a href={`/c/${slug}?category=${encodeURIComponent(p.category)}`}>{p.category}</a><span>/</span></>}<b>{p.name}</b></nav>
      <section className="product-detail">
        <div className="detail-media">{p.image_url?<img src={p.image_url} alt={p.name}/>:<PackageSearch/>}{data.tenant.show_stock_mode!=='hidden'&&<span className={out?'stock-badge out':'stock-badge'}>{stockLabel(data.tenant,p)}</span>}</div>
        <div className="detail-copy">
          <div className="detail-brand">{p.brand||p.category||'Producto'}</div>
          <h1>{p.name}</h1>
          <div className="detail-identifiers"><span>SKU <b>{p.sku}</b></span>{p.model&&<span>Modelo <b>{p.model}</b></span>}</div>
          <div className="detail-prices"><strong>{money(p.price_usd)}</strong>{p.price_bs>0&&<span>{bs(p.price_bs)}</span>}</div>
          <div className={out?'availability out':'availability'}>{out?<><X size={16}/> Agotado</>:<><CheckCircle2 size={16}/> Disponible</>}</div>
          {p.description&&<p className="detail-description">{p.description}</p>}
          {features.length>0&&<div className="feature-box"><h3>Características</h3><ul>{features.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
          <div className="detail-data"><div><span>Categoría</span><b>{p.category||'—'}</b></div><div><span>Subcategoría</span><b>{p.subcategory||'—'}</b></div><div><span>Marca</span><b>{p.brand||'—'}</b></div></div>
          <div className="detail-actions">
            {phone&&<a className="primary-action" href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quisiera consultar disponibilidad y condiciones de ${p.name} (${p.sku})`)}`} target="_blank" rel="noreferrer"><MessageCircle/> Consultar por WhatsApp</a>}
            <button className="share-action" onClick={share}><Share2/> Compartir</button>
          </div>
          <small className="rate-note">Precios y disponibilidad sincronizados desde Nexus Enterprise Pro. {data.tenant.rate_bs_per_usd>0?`Referencia ${data.tenant.rate_source}: ${Number(data.tenant.rate_bs_per_usd).toLocaleString('es-VE')} Bs/USD.`:''}</small>
        </div>
      </section>

      {data.related.length>0&&<section className="related"><div className="section-heading"><span className="eyebrow">TAMBIÉN TE PUEDE INTERESAR</span><h2>Productos relacionados</h2></div><div className="grid related-grid">{data.related.map(x=><ProductCard key={x.source_product_id} tenant={data.tenant} product={x}/>)}</div></section>}
    </main>
    <Footer tenant={data.tenant}/>
  </div>
}

function ProductSkeleton(){return <div className="grid">{Array.from({length:8}).map((_,i)=><div className="skeleton-card" key={i}><div/><span/><span/><b/></div>)}</div>}
function Footer({tenant}:{tenant:Tenant|null}){return <footer><div><b>{tenant?.public_name||'Nexus Catalog'}</b><span>Catálogo actualizado desde Nexus Enterprise Pro.</span></div><div className="footer-links">{tenant?.website&&<a href={tenant.website} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Web</a>}<span>Powered by <b>Nexus Enterprise Pro</b></span></div></footer>}

const route=pathInfo()
createRoot(document.getElementById('root')!).render(route.productId?<ProductDetail slug={route.slug} productId={route.productId}/>:<Storefront slug={route.slug}/>)
