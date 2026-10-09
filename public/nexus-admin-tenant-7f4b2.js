(() => {
  "use strict";

  const VERSION = "6.1.0";
  const $ = (id) => document.getElementById(id);

  function boot() {
    const runtime = $("runtime");
    const out = $("out");
    const createBtn = $("create");
    const rotateBtn = $("rotate");
    const rotateSofiaBtn = $("rotateSofia");
    const testBackendBtn = $("testBackend");
    const loadStorefrontBtn=$("loadStorefront"), saveStorefrontBtn=$("saveStorefront"), loadMerchandisingBtn=$("loadMerchandising"), merchandisingBox=$("merchandising"), loadReviewsBtn=$("loadReviews"), reviewsBox=$("reviews");

    if (!runtime || !out || !createBtn || !rotateBtn || !rotateSofiaBtn || !testBackendBtn || !loadStorefrontBtn || !saveStorefrontBtn || !loadMerchandisingBtn || !merchandisingBox || !loadReviewsBtn || !reviewsBox) {
      console.error("CUYRA Catalog Admin: DOM incompleto");
      return;
    }

    runtime.className = "runtime ok";
    runtime.textContent = `JavaScript activo ✓ · Admin UI ${VERSION}`;

    function setOutput(message, type = "") {
      out.className = type;
      out.textContent = typeof message === "string"
        ? message
        : JSON.stringify(message, null, 2);
    }

    function setBusy(busy) {
      createBtn.disabled = busy;
      rotateBtn.disabled = busy;
      rotateSofiaBtn.disabled = busy;
      testBackendBtn.disabled = busy;
      loadStorefrontBtn.disabled=busy;saveStorefrontBtn.disabled=busy;loadMerchandisingBtn.disabled=busy;loadReviewsBtn.disabled=busy;
    }

    async function requestJson(url, options = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const text = await response.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = { ok: false, error: text || `HTTP ${response.status}` };
        }
        if (!response.ok) {
          const msg = payload?.error || `Error HTTP ${response.status}`;
          throw new Error(msg);
        }
        return payload;
      } finally {
        clearTimeout(timer);
      }
    }

    function adminHeaders(){return {'content-type':'application/json','x-admin-secret':$('secret').value.trim()}}
    function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
    function parseTarget(raw){const v=String(raw||'').trim();if(!v)return {targetType:'',targetValue:''};const m=v.match(/^(product|category|brand):(.*)$/i);if(m)return {targetType:m[1].toLowerCase(),targetValue:m[2].trim()};return {targetType:v.startsWith('/')?'path':'',targetValue:v}}
    function bannerFrom(i){const targetType=$(`b${i}TargetType`).value.trim(),targetValue=$(`b${i}TargetValue`).value.trim();return {title:$(`b${i}Title`).value.trim(),subtitle:$(`b${i}Subtitle`).value.trim(),imageUrl:$(`b${i}Image`).value.trim(),mobileImageUrl:$(`b${i}MobileImage`).value.trim(),ctaLabel:$(`b${i}Cta`).value.trim(),targetType,targetValue}}
    function updateBannerPreview(i){const box=$(`b${i}Preview`),title=$(`b${i}PreviewTitle`),subtitle=$(`b${i}PreviewSubtitle`),desktop=$(`b${i}Image`).value.trim(),mobile=$(`b${i}MobileImage`).value.trim(),img=mobile||desktop;title.textContent=$(`b${i}Title`).value.trim()||`Banner ${i}`;subtitle.textContent=$(`b${i}Subtitle`).value.trim()||'La vista previa se actualiza mientras escribes.';box.style.backgroundImage=img?`linear-gradient(90deg,rgba(5,12,28,.88),rgba(5,12,28,.25)),url(${img})`:'linear-gradient(135deg,#07101f,#15243d)'}
    function fillBanner(i,b={}){$(`b${i}Title`).value=b.title||'';$(`b${i}Subtitle`).value=b.subtitle||'';$(`b${i}Image`).value=b.imageUrl||'';$(`b${i}MobileImage`).value=b.mobileImageUrl||'';$(`b${i}Cta`).value=b.ctaLabel||'';$(`b${i}TargetType`).value=b.targetType||'';$(`b${i}TargetValue`).value=b.targetValue||'';updateBannerPreview(i)}
    for(let i=1;i<=3;i++){for(const id of [`b${i}Title`,`b${i}Subtitle`,`b${i}Image`,`b${i}MobileImage`])$(id).addEventListener('input',()=>updateBannerPreview(i));document.querySelector(`[data-clear-banner="${i}"]`).addEventListener('click',()=>{fillBanner(i,{});setOutput({ok:true,message:`Banner ${i} limpiado localmente. Pulsa Guardar vitrina comercial para aplicar.`},'ok')});updateBannerPreview(i)}

    const homeIds={categories:'homeCategories',featured:'homeFeatured',recommended:'homeRecommended',offers:'homeOffers',newest:'homeNewest',brands:'homeBrands'};
    function selectedHomeSections(){return Object.entries(homeIds).filter(([,id])=>$(id)?.checked).map(([key])=>key)}
    function parseLines(id){return String($(id)?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}
    function parseBrandLogos(){const out={};for(const line of parseLines('brandLogos')){const i=line.indexOf('|');if(i<=0)continue;const name=line.slice(0,i).trim(),url=line.slice(i+1).trim();if(name&&url)out[name]=url}return out}
    function brandLogoText(map){return Object.entries(map&&typeof map==='object'?map:{}).map(([name,url])=>`${name}|${url}`).join('\n')}
    loadStorefrontBtn.addEventListener('click',async()=>{const secret=$('secret').value.trim(),slug=$('slug').value.trim();if(!secret||!slug)return setOutput('Falta clave administrativa o slug.','error');setBusy(true);try{const data=await requestJson(`/api/admin-analytics?slug=${encodeURIComponent(slug)}&mode=storefront`,{headers:{'x-admin-secret':secret}});for(let i=1;i<=3;i++)fillBanner(i,(data.banners||[])[i-1]||{});const c=data.commerce||{};$('visualTheme').value=c.visualTheme==='commerce'?'commerce':'inherit';$('showWholesalePrice').checked=c.showWholesalePrice!==false;$('wholesaleLabel').value=c.wholesaleLabel||'Mayor';$('deliveryEnabled').checked=c.deliveryEnabled!==false;$('pickupEnabled').checked=c.pickupEnabled!==false;$('freeShippingEnabled').checked=c.freeShippingEnabled!==false;$('requireIdDocument').checked=c.requireIdDocument===true;$('pickupLabel').value=c.pickupLabel||'Retiro en tienda';$('businessHours').value=c.businessHours||'';$('pickupAddress').value=c.pickupAddress||'';$('announcements').value=Array.isArray(c.announcements)?c.announcements.join('\n'):'';$('brandLogos').value=brandLogoText(c.brandLogos);const carriers=Array.isArray(c.carriers)?c.carriers:[];$('carrierZoom').checked=!carriers.length||carriers.some(x=>x.id==='zoom'&&x.enabled!==false);$('carrierTealca').checked=!carriers.length||carriers.some(x=>x.id==='tealca'&&x.enabled!==false);const pays=Array.isArray(c.paymentMethods)?c.paymentMethods:[];$('payPagoMovil').checked=!pays.length||pays.some(x=>x.id==='pago_movil'&&x.enabled!==false);$('payTransferencia').checked=!pays.length||pays.some(x=>x.id==='transferencia'&&x.enabled!==false);$('payZelle').checked=!pays.length||pays.some(x=>x.id==='zelle'&&x.enabled!==false);$('payUsdt').checked=!pays.length||pays.some(x=>x.id==='usdt'&&x.enabled!==false);const active=Array.isArray(data.homeSections)?data.homeSections:Object.keys(homeIds);for(const [key,id] of Object.entries(homeIds))$(id).checked=active.includes(key);setOutput({ok:true,message:'Configuración comercial cargada.'},'ok')}catch(e){setOutput({ok:false,error:e instanceof Error?e.message:String(e)},'error')}finally{setBusy(false)}})
    saveStorefrontBtn.addEventListener('click',async()=>{const secret=$('secret').value.trim(),slug=$('slug').value.trim();if(!secret||!slug)return setOutput('Falta clave administrativa o slug.','error');const banners=[1,2,3].map(bannerFrom).filter(b=>b.title||b.imageUrl||b.mobileImageUrl),homeSections=selectedHomeSections();if(!$('deliveryEnabled').checked&&!$('pickupEnabled').checked)$('deliveryEnabled').checked=true;const carriers=[{id:'zoom',label:'Zoom',enabled:$('carrierZoom').checked,free:$('freeShippingEnabled').checked},{id:'tealca',label:'Tealca',enabled:$('carrierTealca').checked,free:$('freeShippingEnabled').checked}];const paymentMethods=[{id:'pago_movil',label:'Pago Móvil',enabled:$('payPagoMovil').checked},{id:'transferencia',label:'Transferencia bancaria',enabled:$('payTransferencia').checked},{id:'zelle',label:'Zelle',enabled:$('payZelle').checked},{id:'usdt',label:'Binance / USDT',enabled:$('payUsdt').checked}];setBusy(true);try{const data=await requestJson('/api/admin-analytics',{method:'POST',headers:adminHeaders(),body:JSON.stringify({action:'storefront_config',slug,banners,homeSections,commerce:{visualTheme:$('visualTheme').value,showWholesalePrice:$('showWholesalePrice').checked,wholesaleLabel:$('wholesaleLabel').value,deliveryEnabled:$('deliveryEnabled').checked,pickupEnabled:$('pickupEnabled').checked,freeShippingEnabled:$('freeShippingEnabled').checked,requireIdDocument:$('requireIdDocument').checked,pickupLabel:$('pickupLabel').value,businessHours:$('businessHours').value,pickupAddress:$('pickupAddress').value,announcements:parseLines('announcements'),brandLogos:parseBrandLogos(),carriers,paymentMethods}})});setOutput(data,'ok')}catch(e){setOutput({ok:false,error:e instanceof Error?e.message:String(e)},'error')}finally{setBusy(false)}})
    async function saveMerchandising(row,product){const slug=$('slug').value.trim();const compare=row.querySelector('[data-field="compare"]').value.trim(),promoBadge=row.querySelector('[data-field="badge"]').value.trim(),wholesale=row.querySelector('[data-field="wholesale"]').value.trim(),wholesaleMin=row.querySelector('[data-field="wholesaleMin"]').value.trim(),recommended=row.querySelector('[data-field="recommended"]').checked;const save=row.querySelector('[data-action="save"]');save.disabled=true;try{const data=await requestJson('/api/admin-analytics',{method:'POST',headers:adminHeaders(),body:JSON.stringify({action:'product_merchandising',slug,sourceProductId:product.source_product_id,compareAtPriceUsd:compare===''?null:Number(compare),wholesalePriceUsd:wholesale===''?null:Number(wholesale),wholesaleMinQuantity:wholesaleMin===''?null:Number(wholesaleMin),promoBadge,recommended})});save.textContent='Guardado ✓';setTimeout(()=>{save.textContent='Guardar';save.disabled=false},1300);return data}catch(e){save.disabled=false;throw e}}
    async function loadMerchandising(){
      const secret=$('secret').value.trim(),slug=$('slug').value.trim();
      if(!secret||!slug)return setOutput('Falta clave administrativa o slug.','error');
      setBusy(true);
      try{
        const data=await requestJson(`/api/admin-analytics?slug=${encodeURIComponent(slug)}&mode=merchandising`,{headers:{'x-admin-secret':secret}});
        window.dispatchEvent(new CustomEvent('nexus:products-loaded',{detail:{products:data.products||[],truncated:!!data.truncated}}));
        setOutput({ok:true,message:'Productos comerciales cargados.',products:(data.products||[]).length,limited:!!data.truncated},'ok');
      }catch(e){setOutput({ok:false,error:e instanceof Error?e.message:String(e)},'error')}
      finally{setBusy(false)}
    }
    loadMerchandisingBtn.addEventListener('click',loadMerchandising)

    async function moderate(reviewId,approved){const slug=$('slug').value.trim();await requestJson('/api/admin-analytics',{method:'POST',headers:adminHeaders(),body:JSON.stringify({action:'review_status',slug,reviewId,approved})});await loadReviews()}
    async function loadReviews(){const secret=$('secret').value.trim(),slug=$('slug').value.trim();if(!secret||!slug)return setOutput('Falta clave administrativa o slug.','error');setBusy(true);try{const data=await requestJson(`/api/admin-analytics?slug=${encodeURIComponent(slug)}&mode=reviews`,{headers:{'x-admin-secret':secret}});reviewsBox.innerHTML='';for(const r of data.reviews||[]){const el=document.createElement('div');el.className='review-item';const stars='★'.repeat(Number(r.rating)||0)+'☆'.repeat(5-(Number(r.rating)||0));el.innerHTML=`<header><strong>${stars} · ${escapeHtml(r.product_name||`Producto ${r.source_group_id||r.source_product_id}`)}</strong><small>${r.approved?'PUBLICADA':'PENDIENTE'}</small></header><p><b>${escapeHtml(r.display_name||'Cliente')}</b>${r.comment?`<br>${escapeHtml(r.comment)}`:''}</p><div class="review-actions"><button data-action="approve">Aprobar</button><button data-action="reject" class="reject">Ocultar</button></div>`;el.querySelector('[data-action="approve"]').onclick=()=>moderate(r.id,true);el.querySelector('[data-action="reject"]').onclick=()=>moderate(r.id,false);reviewsBox.appendChild(el)}if(!(data.reviews||[]).length)reviewsBox.textContent='No hay reseñas todavía.';setOutput({ok:true,reviews:(data.reviews||[]).length},'ok')}catch(e){setOutput({ok:false,error:e instanceof Error?e.message:String(e)},'error')}finally{setBusy(false)}}
    loadReviewsBtn.addEventListener('click',loadReviews)

    testBackendBtn.addEventListener("click", async () => {
      setBusy(true);
      setOutput("Probando /api/health...");
      try {
        const data = await requestJson("/api/health", { method: "GET" });
        setOutput(data, "ok");
      } catch (error) {
        setOutput({
          ok: false,
          step: "health",
          error: error?.name === "AbortError"
            ? "Tiempo de espera agotado (20 s)."
            : (error instanceof Error ? error.message : String(error))
        }, "error");
      } finally {
        setBusy(false);
      }
    });

    createBtn.addEventListener("click", async () => {
      const secret = $("secret").value.trim();
      const slug = $("slug").value.trim();
      const publicName = $("name").value.trim();
      const phone = $("phone").value.trim();
      const website = $("website").value.trim();

      if (!secret) return setOutput("Falta la clave administrativa.", "error");
      if (!slug) return setOutput("Falta el slug.", "error");
      if (!publicName) return setOutput("Falta el nombre público.", "error");

      setBusy(true);
      setOutput("Creando catálogo...");

      try {
        const data = await requestJson("/api/admin-create-tenant", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-secret": secret
          },
          body: JSON.stringify({ slug, publicName, phone, website })
        });
        setOutput(data, "ok");
      } catch (error) {
        setOutput({
          ok: false,
          step: "create-tenant",
          error: error?.name === "AbortError"
            ? "Tiempo de espera agotado (20 s)."
            : (error instanceof Error ? error.message : String(error))
        }, "error");
      } finally {
        setBusy(false);
      }
    });


    rotateSofiaBtn.addEventListener("click", async () => {
      const secret = $("secret").value.trim();
      const slug = $("slug").value.trim();
      if (!secret) return setOutput("Falta la clave administrativa.", "error");
      if (!slug) return setOutput("Falta el slug.", "error");
      setBusy(true);
      setOutput("Generando token privado de Sofía...");
      try {
        const data = await requestJson("/api/admin-rotate-sofia-token", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-secret": secret
          },
          body: JSON.stringify({ slug })
        });
        setOutput(data, "ok");
      } catch (error) {
        setOutput({
          ok: false,
          step: "rotate-sofia-token",
          error: error?.name === "AbortError"
            ? "Tiempo de espera agotado (20 s)."
            : (error instanceof Error ? error.message : String(error))
        }, "error");
      } finally {
        setBusy(false);
      }
    });
    rotateBtn.addEventListener("click", async () => {
      const secret = $("secret").value.trim();
      const slug = $("slug").value.trim();

      if (!secret) return setOutput("Falta la clave administrativa.", "error");
      if (!slug) return setOutput("Falta el slug.", "error");

      setBusy(true);
      setOutput("Rotando token...");

      try {
        const data = await requestJson("/api/admin-rotate-token", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-secret": secret
          },
          body: JSON.stringify({ slug })
        });
        setOutput(data, "ok");
      } catch (error) {
        setOutput({
          ok: false,
          step: "rotate-token",
          error: error?.name === "AbortError"
            ? "Tiempo de espera agotado (20 s)."
            : (error instanceof Error ? error.message : String(error))
        }, "error");
      } finally {
        setBusy(false);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
