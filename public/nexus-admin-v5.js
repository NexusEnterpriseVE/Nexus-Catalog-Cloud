/* CUYRA Catalog Cloud V5 — admin shell and scalable product management.
   Existing administration endpoints and authentication are preserved. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const dollars=n=>new Intl.NumberFormat('es-VE',{style:'currency',currency:'USD'}).format(Number(n)||0);
  const state={products:[],filtered:[],page:1,perPage:25,selected:null,truncated:false};
  const make=(tag,cls,html='')=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;return e};
  function init(){
    const box=document.querySelector('.box');if(!box)return;
    document.title='CUYRA Catalog Cloud · Administración V5';
    const blocks=[...box.children],sections=blocks.filter(x=>x.classList.contains('section'));
    if(sections.length!==3)return;
    const shell=make('div','v5-shell');
    const side=make('aside','v5-sidebar',`<div class="v5-sidebar-brand"><img src="/cuyra-mark-on-dark.png" alt="CUYRA" onerror="this.style.display='none'"><span><b>CUYRA</b><small>CATALOG CLOUD</small></span></div><div class="v5-sidebar-kicker">ESPACIO DE TRABAJO</div><nav class="v5-tabs" aria-label="Secciones administrativas"><button type="button" class="active" data-tab="general"><span>⌂</span> General</button><button type="button" data-tab="vitrina"><span>▦</span> Vitrina comercial</button><button type="button" data-tab="productos"><span>▤</span> Productos y ofertas</button><button type="button" data-tab="resenas"><span>☆</span> Calificaciones</button></nav><div class="v5-sidebar-foot"><b>VERSION 5.0.0</b><small>Panel multiempresa · Nexus Cloud</small></div>`);
    const main=make('div','v5-workspace');
    const header=make('header','v5-admin-header',`<div><span class="v5-overline">GESTIÓN DE CATÁLOGO</span><h1 id="v5-section-title">Resumen del catálogo</h1><p id="v5-section-desc">Administra tu tienda en una interfaz más simple.</p></div><label class="v5-admin-theme">Apariencia <select id="v5-admin-theme" aria-label="Elegir apariencia"><option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label>`);
    const session=make('section','v5-session');
    const account=make('div','v5-session-inputs');
    for(const id of ['secret','slug']){
      const el=$(id);if(el){const label=el.closest('label');if(label)account.append(label)}
    }
    session.append(account);
    const hint=blocks.find(x=>x.classList.contains('hint'));if(hint)session.append(hint);
    const runtime=$('runtime');if(runtime){runtime.classList.add('v5-runtime');session.append(runtime)}
    const banner=make('div','v5-session-banner','<span>La clave solo se utiliza para autenticar solicitudes; no se guarda en el navegador.</span>');session.append(banner);
    const general=make('section','v5-panel active');general.dataset.panel='general';
    general.append(make('div','v5-panel-intro','<h2>Datos de la empresa</h2><p>Identidad comercial, contacto y acceso de integración.</p>'));
    const generalGrid=make('div','v5-general-fields');
    for(const id of ['name','phone','website']){const el=$(id);if(el){const label=el.closest('label');if(label)generalGrid.append(label)}}
    general.append(generalGrid);
    const tools=make('div','v5-general-actions');
    for(const id of ['create','rotate','rotateSofia','testBackend']){const el=$(id);if(el)tools.append(el)}
    general.append(tools);
    const output=$('out');if(output){const detail=make('details','v5-log','<summary>Registro técnico y resultados</summary>');detail.append(output);general.append(detail)}
    const containers=[general];
    [['vitrina',sections[0]],['productos',sections[1]],['resenas',sections[2]]].forEach(([name,section])=>{
      const panel=make('section','v5-panel');panel.dataset.panel=name;panel.append(section);containers.push(panel)
    });
    const catalogPanel=containers[2];
    const toolbar=make('div','v5-catalog-tools',`<div class="v5-catalog-search"><label for="v5-search">Buscar entre todos los productos</label><input type="search" id="v5-search" placeholder="Nombre, SKU, código o variante…" autocomplete="off"></div><div class="v5-filter-grid"><label>Marca<select id="v5-brand"><option value="">Todas las marcas</option></select></label><label>Categoría<select id="v5-category"><option value="">Todas las categorías</option></select></label><label>Existencia<select id="v5-stock"><option value="">Todos</option><option value="available">Disponibles</option><option value="out">Agotados</option><option value="low">Stock bajo (≤ 5)</option></select></label><label>Promociones<select id="v5-type"><option value="">Todos</option><option value="offers">Con oferta</option><option value="recommended">Recomendados</option><option value="no-wholesale">Sin precio mayorista</option><option value="no-image">Sin imagen</option></select></label><label>Orden<select id="v5-sort"><option value="name">Nombre A-Z</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="stock">Menor stock</option></select></label><label>Por página<select id="v5-perpage"><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label></div><div class="v5-results-bar"><span id="v5-results">Carga los productos para iniciar.</span><button type="button" id="v5-reset" class="v5-button-muted">Limpiar filtros</button></div>`);
    const products=sections[1].querySelector('#merchandising');products.classList.add('v5-product-results');
    products.before(toolbar);
    const paging=make('div','v5-pagination',`<button type="button" id="v5-prev">← Anterior</button><span id="v5-page-label">Página 1</span><button type="button" id="v5-next">Siguiente →</button>`);products.after(paging);
    const editor=make('dialog','v5-product-editor',`<form method="dialog" class="v5-editor-heading"><div><span class="v5-overline">EDICIÓN COMERCIAL</span><h2 id="v5-edit-name">Editar producto</h2><p id="v5-edit-sku"></p></div><button type="submit" aria-label="Cerrar">×</button></form><form id="v5-edit-form"><div class="v5-edit-grid"><label>Precio anterior (USD)<input type="number" step="0.01" min="0" id="v5-edit-compare" placeholder="Opcional"></label><label>Etiqueta promocional<input id="v5-edit-badge" maxlength="60" placeholder="Oferta · -15%"></label><label>Precio mayorista (USD)<input type="number" min="0" step="0.01" id="v5-edit-wholesale" placeholder="Opcional"></label><label>Mínimo mayorista<input type="number" min="1" step="1" id="v5-edit-minimum" placeholder="Ej. 6"></label></div><label class="v5-edit-check"><input type="checkbox" id="v5-edit-rec"> Mostrar como recomendado</label><div class="v5-editor-foot"><span id="v5-editor-status" role="status"></span><button type="button" id="v5-cancel">Cancelar</button><button id="v5-edit-save" type="submit">Guardar cambios</button></div></form>`);
    main.append(header,session,...containers,editor);
    shell.append(side,main);
    box.replaceChildren(shell);box.classList.add('v5-admin-shell');
    const labels={general:['Resumen del catálogo','Datos de empresa y acceso de integración.'],vitrina:['Personalización de la vitrina','Banners, pagos, envíos, marcas y portada.'],productos:['Gestión de productos','Encuentra y edita rápidamente entre cientos de artículos.'],resenas:['Moderación de calificaciones','Revisa y publica comentarios de tus clientes.']};
    function showTab(tab){if(!labels[tab])tab='general';document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false')});document.querySelectorAll('[data-panel]').forEach(el=>el.classList.toggle('active',el.dataset.panel===tab));$('v5-section-title').textContent=labels[tab][0];$('v5-section-desc').textContent=labels[tab][1];try{history.replaceState(null,'','#'+tab)}catch{};if(tab==='productos'&&!state.products.length&&$('secret').value.trim()&&$('slug').value.trim())$('loadMerchandising').click()}
    side.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
    showTab(location.hash.replace('#','')||'general');
    const theme=$('v5-admin-theme');let pref='system';try{pref=localStorage.getItem('nexus-theme-v5')||'system'}catch{};theme.value=['system','light','dark'].includes(pref)?pref:'system';
    const media=matchMedia('(prefers-color-scheme: dark)');function applyTheme(){const mode=theme.value;document.documentElement.dataset.theme=mode==='system'?(media.matches?'dark':'light'):mode;try{localStorage.setItem('nexus-theme-v5',mode)}catch{}}
    theme.addEventListener('change',applyTheme);media.addEventListener('change',()=>{if(theme.value==='system')applyTheme()});applyTheme();
    // Banners collapse independently; original form and IDs are retained exactly.
    document.querySelectorAll('#bannerFields .banner-card').forEach((card,i)=>{const title=card.querySelector('h3');const detail=make('details','v5-banner-collapse');if(i===0)detail.open=true;const summary=make('summary','v5-banner-summary',`<span>Banner ${i+1}</span><small>Editar contenido y vista previa</small>`);detail.append(summary);while(card.firstChild){if(card.firstChild===title){card.firstChild.remove();continue}detail.append(card.firstChild)}card.append(detail)});
    const filterIds=['v5-search','v5-brand','v5-category','v5-stock','v5-type','v5-sort','v5-perpage'];
    filterIds.forEach(id=>$(id).addEventListener(id==='v5-search'?'input':'change',()=>{state.page=1;state.perPage=Number($('v5-perpage').value)||25;filterAndRender()}));
    $('v5-reset').addEventListener('click',()=>{filterIds.forEach(id=>$(id).value=id==='v5-sort'?'name':id==='v5-perpage'?'25':'');state.page=1;state.perPage=25;filterAndRender()});
    $('v5-prev').addEventListener('click',()=>{state.page=Math.max(1,state.page-1);drawRows()});
    $('v5-next').addEventListener('click',()=>{state.page++;drawRows()});
    $('v5-cancel').addEventListener('click',()=>editor.close());
    $('v5-edit-form').addEventListener('submit',saveProduct);
    window.addEventListener('nexus:products-loaded',e=>{state.products=e.detail.products||[];state.truncated=e.detail.truncated;state.page=1;populateFilters();filterAndRender()});
    function populateFilters(){for(const [id,key] of [['v5-brand','brand'],['v5-category','category']]){const el=$(id),current=el.value;el.querySelectorAll('option:not(:first-child)').forEach(x=>x.remove());[...new Set(state.products.map(p=>String(p[key]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')).forEach(x=>{const o=document.createElement('option');o.value=x;o.textContent=x;el.add(o)});el.value=current}}
    function filterAndRender(){let rows=state.products.filter(p=>{
      const q=norm($('v5-search').value),hay=norm([p.name,p.group_name,p.sku,p.variant_label,p.source_product_id,p.brand,p.category].join(' '));
      if(q&&!hay.includes(q))return false;
      if($('v5-brand').value&&p.brand!==$('v5-brand').value)return false;
      if($('v5-category').value&&p.category!==$('v5-category').value)return false;
      const stock=Number(p.stock_exact),known=p.stock_exact!==null&&p.stock_exact!==undefined;
      const status=$('v5-stock').value;
      if(status==='available'&&!(p.availability==='available'||known&&stock>0))return false;
      if(status==='out'&&!(p.availability==='out'||known&&stock===0))return false;
      if(status==='low'&&!(known&&stock>0&&stock<=5))return false;
      const type=$('v5-type').value;
      if(type==='offers'&&!(p.promo_badge||Number(p.compare_at_price_usd)>Number(p.price_usd)))return false;
      if(type==='recommended'&&!p.recommended)return false;
      if(type==='no-wholesale'&&Number(p.wholesale_price_usd)>0)return false;
      if(type==='no-image'&&p.image_url)return false;
      return true;
    });const order=$('v5-sort').value;rows.sort((a,b)=>order==='price-asc'?Number(a.price_usd)-Number(b.price_usd):order==='price-desc'?Number(b.price_usd)-Number(a.price_usd):order==='stock'?Number(a.stock_exact??Infinity)-Number(b.stock_exact??Infinity):String(a.name||'').localeCompare(String(b.name||''),'es'));
      state.filtered=rows;drawRows();
    }
    function drawRows(){
      const count=state.filtered.length,totalPages=Math.max(1,Math.ceil(count/state.perPage));state.page=Math.min(state.page,totalPages);
      const from=(state.page-1)*state.perPage,show=state.filtered.slice(from,from+state.perPage);
      $('v5-results').textContent=`${count} de ${state.products.length} productos · mostrando ${count?from+1:0}–${Math.min(from+state.perPage,count)}${state.truncated?' · catálogo truncado (10.000 máx.)':''}`;
      products.innerHTML=count?`<div class="v5-table-scroll"><table class="v5-product-table"><thead><tr><th>Producto</th><th>Precio detal</th><th>Stock</th><th>Promoción</th><th>Mayorista</th><th>Acciones</th></tr></thead><tbody>${show.map(p=>{const id=Number(p.source_product_id);const available=p.availability==='out'||p.stock_exact===0?'agotado':p.availability==='available'||Number(p.stock_exact)>0?'disponible':'sin dato';return `<tr><td><div class="v5-product-identity">${p.image_url?`<img alt="" loading="lazy" src="${esc(p.image_url)}">`:'<span class="v5-product-missing">▧</span>'}<div><strong>${esc(p.name||p.group_name||'Producto')}</strong><small>${esc(p.brand||'Sin marca')} · SKU ${esc(p.sku||'—')}${p.variant_label?' · '+esc(p.variant_label):''}</small></div></div></td><td><strong>${dollars(p.price_usd)}</strong></td><td><span class="v5-stock-pill ${available}">${available==='agotado'?'Agotado':available==='disponible'?'Disponible':'Sin dato'}${p.stock_exact!==null&&p.stock_exact!==undefined?' · '+esc(p.stock_exact):''}</span></td><td>${p.promo_badge?`<span class="v5-offer-pill">${esc(p.promo_badge)}</span>`:p.recommended?'<span class="v5-recommended-pill">Recomendado</span>':'<span class="v5-muted">Sin oferta</span>'}</td><td>${Number(p.wholesale_price_usd)>0?dollars(p.wholesale_price_usd):'<span class="v5-muted">Sin configurar</span>'}</td><td><button type="button" class="v5-edit-trigger" data-edit-id="${id}">Editar</button></td></tr>`}).join('')}</tbody></table></div><div class="v5-mobile-products">${show.map(p=>`<article class="v5-mobile-row"><div class="v5-mobile-row-heading">${p.image_url?`<img loading="lazy" alt="" src="${esc(p.image_url)}">`:'<span class="v5-product-missing">▧</span>'}<div><strong>${esc(p.name||p.group_name||'Producto')}</strong><small>${esc(p.sku||'Sin SKU')} · ${esc(p.brand||'Sin marca')}</small></div></div><div class="v5-mobile-metrics"><span>Precio <b>${dollars(p.price_usd)}</b></span><span>Mayorista <b>${Number(p.wholesale_price_usd)>0?dollars(p.wholesale_price_usd):'Sin configurar'}</b></span><span>Existencia <b>${p.availability==='out'||p.stock_exact===0?'Agotado':p.stock_exact!==null&&p.stock_exact!==undefined?String(p.stock_exact)+' uds.':'Sin dato'}</b></span><span>Promoción <b>${esc(p.promo_badge|| (p.recommended?'Recomendado':'Sin oferta'))}</b></span></div><button class="v5-edit-trigger" type="button" data-edit-id="${Number(p.source_product_id)}">Editar producto</button></article>`).join('')}</div>`:`<div class="v5-empty-products">${state.products.length?'No hay productos con estos filtros.':'Pulsa «Cargar productos comerciales» para comenzar.'}</div>`;
      products.querySelectorAll('[data-edit-id]').forEach(b=>b.addEventListener('click',()=>openEditor(Number(b.dataset.editId))));
      $('v5-page-label').textContent=`Página ${state.page} de ${totalPages}`;$('v5-prev').disabled=state.page<=1;$('v5-next').disabled=state.page>=totalPages;
    }
    function openEditor(id){const p=state.products.find(x=>Number(x.source_product_id)===id);if(!p)return;state.selected=p;
      $('v5-edit-name').textContent=p.name||p.group_name||'Producto';$('v5-edit-sku').textContent=`SKU ${p.sku||'—'} · Precio base: ${dollars(p.price_usd)}`;
      $('v5-edit-compare').value=p.compare_at_price_usd??'';$('v5-edit-badge').value=p.promo_badge||'';$('v5-edit-wholesale').value=p.wholesale_price_usd??'';$('v5-edit-minimum').value=p.wholesale_min_quantity??'';$('v5-edit-rec').checked=!!p.recommended;$('v5-editor-status').textContent='';editor.showModal();
    }
    async function saveProduct(e){e.preventDefault();const p=state.selected;if(!p)return;
      const secret=$('secret').value.trim(),slug=$('slug').value.trim();if(!secret||!slug){$('v5-editor-status').textContent='Configura la clave y el slug.';return}
      const val=id=>$(id).value.trim();const payload={action:'product_merchandising',slug,sourceProductId:p.source_product_id,compareAtPriceUsd:val('v5-edit-compare')===''?null:Number(val('v5-edit-compare')),promoBadge:val('v5-edit-badge'),wholesalePriceUsd:val('v5-edit-wholesale')===''?null:Number(val('v5-edit-wholesale')),wholesaleMinQuantity:val('v5-edit-minimum')===''?null:Number(val('v5-edit-minimum')),recommended:$('v5-edit-rec').checked};
      const btn=$('v5-edit-save');btn.disabled=true;btn.textContent='Guardando…';$('v5-editor-status').textContent='';
      try{const resp=await fetch('/api/admin-analytics',{method:'POST',headers:{'content-type':'application/json','x-admin-secret':secret},body:JSON.stringify(payload)});const data=await resp.json();if(!resp.ok||data.ok===false)throw new Error(data.error||`Error ${resp.status}`);
        // Group merchandising changes apply to variants in the same group.
        for(const item of state.products){if(Number(item.source_product_id)===Number(p.source_product_id)||(p.source_group_id&&Number(item.source_group_id)===Number(p.source_group_id))){Object.assign(item,{compare_at_price_usd:payload.compareAtPriceUsd,promo_badge:payload.promoBadge,wholesale_price_usd:payload.wholesalePriceUsd,wholesale_min_quantity:payload.wholesaleMinQuantity,recommended:payload.recommended})}}
        filterAndRender();editor.close();
        const out=$('out');if(out){out.textContent='Cambios comerciales guardados para '+(p.name||p.sku);out.className='ok'}
      }catch(error){$('v5-editor-status').textContent=error.message||String(error)}finally{btn.disabled=false;btn.textContent='Guardar cambios'}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
