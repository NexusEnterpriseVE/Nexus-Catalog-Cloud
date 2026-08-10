import React,{useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Search,PackageSearch,ExternalLink,MessageCircle,ChevronLeft,ChevronRight} from 'lucide-react'
import './styles.css'

type Tenant={slug:string;public_name:string;phone:string;website:string;accent_color:string;show_stock_mode:'exact'|'status'|'hidden';hide_out_of_stock:boolean;rate_bs_per_usd:number;rate_source:string;updated_at:string}
type Product={source_product_id:number;sku:string;name:string;description:string;category:string;subcategory:string;price_usd:number;price_bs:number;stock_exact:number|null;availability:'available'|'out'|null;image_url:string|null;updated_at:string}
type Result={ok:boolean;tenant:Tenant;products:Product[];categories:string[];page:number;pages:number;total:number}

function slugFromLocation(){const m=location.pathname.match(/^\/(?:c|catalogo)\/([^/]+)/);return decodeURIComponent(m?.[1]||new URLSearchParams(location.search).get('slug')||'')}
function money(v:number,currency='USD'){return new Intl.NumberFormat('es-VE',{style:'currency',currency,maximumFractionDigits:2}).format(v||0)}
function App(){
 const slug=slugFromLocation(),[data,setData]=useState<Result|null>(null),[q,setQ]=useState(''),[search,setSearch]=useState(''),[category,setCategory]=useState(''),[page,setPage]=useState(1),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 useEffect(()=>{const t=setTimeout(()=>setSearch(q.trim()),250);return()=>clearTimeout(t)},[q])
 useEffect(()=>{setPage(1)},[search,category])
 useEffect(()=>{if(!slug){setError('Catálogo no especificado.');setLoading(false);return}setLoading(true);setError('');const p=new URLSearchParams({slug,page:String(page),limit:'24'});if(search)p.set('q',search);if(category)p.set('category',category);fetch(`/api/catalog?${p}`).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||'No se pudo abrir el catálogo');return x}).then((x:Result)=>{setData(x);document.title=`${x.tenant.public_name} · Catálogo`}).catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false))},[slug,search,category,page])
 const accent=data?.tenant.accent_color||'#2563EB';const phone=(data?.tenant.phone||'').replace(/\D/g,'')
 const status=(p:Product)=>data?.tenant.show_stock_mode==='hidden'?'':data?.tenant.show_stock_mode==='exact'?`${p.stock_exact??0} disponibles`:p.availability==='out'?'Agotado':'Disponible'
 const isOut=(p:Product)=>p.availability==='out'||(typeof p.stock_exact==='number'&&p.stock_exact<=0)
 return <div className="app" style={{'--accent':accent} as React.CSSProperties}>
  <header className="top"><div className="brand"><div className="mark">N</div><div><b>{data?.tenant.public_name||'Nexus Catalog'}</b><span>Catálogo Online</span></div></div>{data?.tenant.website&&<a className="site" href={data.tenant.website} target="_blank" rel="noreferrer">Sitio web <ExternalLink size={14}/></a>}</header>
  <main>
   <section className="hero"><span className="eyebrow">CATÁLOGO ACTUALIZADO</span><h1>{data?.tenant.public_name||'Productos disponibles'}</h1><p>Consulta precios, disponibilidad y productos publicados directamente desde Nexus Enterprise Pro.</p></section>
   <section className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar nombre, SKU o descripción..."/></div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas las categorías</option>{data?.categories.map(c=><option key={c}>{c}</option>)}</select></section>
   {loading?<div className="state">Actualizando catálogo...</div>:error?<div className="state error">{error}</div>:data?.products.length===0?<div className="state"><PackageSearch size={34}/>No encontramos productos con esos filtros.</div>:<div className="grid">{data?.products.map(p=><article className="card" key={p.source_product_id}>
      <div className="photo">{p.image_url?<img src={p.image_url} alt={p.name}/>:<PackageSearch/>}{data.tenant.show_stock_mode!=='hidden'&&<span className={isOut(p)?'badge out':'badge'}>{status(p)}</span>}</div>
      <div className="card-body"><div className="meta"><span>{p.category||'Producto'}</span><code>{p.sku}</code></div><h2>{p.name}</h2>{p.description&&<p>{p.description}</p>}<div className="prices"><strong>{money(p.price_usd)}</strong>{p.price_bs>0&&<span>Bs {Number(p.price_bs).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>}</div>
      {phone&&<a className="consult" target="_blank" rel="noreferrer" href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quisiera consultar disponibilidad de ${p.name} (${p.sku})`)}`}><MessageCircle size={16}/> Consultar</a>}</div>
    </article>)}</div>}
   {data&&data.pages>1&&<div className="pager"><button disabled={page<=1} onClick={()=>setPage(x=>Math.max(1,x-1))}><ChevronLeft/> Anterior</button><span>Página {page} de {data.pages} · {data.total} productos</span><button disabled={page>=data.pages} onClick={()=>setPage(x=>Math.min(data.pages,x+1))}>Siguiente <ChevronRight/></button></div>}
  </main>
  <footer><span>Powered by <b>Nexus Enterprise Pro</b></span><span>Nexus Enterprise · Tecnología que conecta tu empresa.</span></footer>
 </div>
}
createRoot(document.getElementById('root')!).render(<App/> )
