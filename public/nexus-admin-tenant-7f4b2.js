(() => {
  "use strict";

  const VERSION = "4.4.0";
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
    function bannerFrom(i){const target=parseTarget($(`b${i}Target`).value);return {title:$(`b${i}Title`).value.trim(),subtitle:$(`b${i}Subtitle`).value.trim(),imageUrl:$(`b${i}Image`).value.trim(),ctaLabel:$(`b${i}Cta`).value.trim(),...target}}
    function fillBanner(i,b={}){$(`b${i}Title`).value=b.title||'';$(`b${i}Subtitle`).value=b.subtitle||'';$(`b${i}Image`).value=b.imageUrl||b.mobileImageUrl||'';$(`b${i}Cta`).value=b.ctaLabel||'';$(`b${i}Target`).value=b.targetType&&b.targetValue?`${b.targetType}:${b.targetValue}`:(b.targetValue||'')}

    const homeIds={categories:'homeCategories',featured:'homeFeatured',recommended:'homeRecommended',offers:'homeOffers',newest:'homeNewest',brands:'homeBrands'};
    function selectedHomeSections(){return Object.entries(homeIds).filter(([,id])=>$(id)?.checked).map(([key])=>key)}
    loadStorefrontBtn.addEventListener('click',async()=>{const secret=$('secret').value.trim(),slug=$('slug').value.trim();if(!secret||!slug)return setOutput('Falta clave administrativa o slug.','error');setBusy(true);try{const data=await requestJson(`/api/admin-analytics?slug=${encodeURIComponent(slug)}&mode=storefront`,{headers:{'x-admin-secret':secret}});for(let i=1;i<=3;i++)fillBanner(i,(data.banners||[])[i-1]||{});$('deliveryEnabled').checked=data.commerce?.deliveryEnabled!==false;$('pickupEnabled').checked=data.commerce?.pickupEnabled!==false;$('pickupLabel').value=data.commerce?.pickupLabel||'Retiro en tienda';$('businessHours').value=data.commerce?.businessHours||'';const active=Array.isArray(data.homeSections)?data.homeSections:Object.keys(homeIds);for(const [key,id] of Object.entries(homeIds))$(id).checked=active.includes(key);setOutput({ok:true,message:'Configuración comercial cargada.'},'ok')}catch(e){setOutput({ok:false,error:e instanceof Error?e.message:String(e)},'error')}finally{setBusy(false)}})
    saveStorefrontBtn.addEventListener('click',async()=>{const secret=$('secret').value.trim(),slug=$('slug').value.trim();if(!secret||!slug)return setOutput('Falta clave administrativa o slug.','error');const banners=[1,2,3].map(bannerFrom).filter(b=>b.title||b.imageUrl),homeSections=selectedHomeSections();if(!$('deliveryEnabled').checked&&!$('pickupEnabled').checked)$('deliveryEnabled').checked=true;setBusy(true);try{const data=await requestJson('/api/admin-analytics',{method:'POST',headers:adminHeaders(),body:JSON.stringify({action:'storefront_config',slug,banners,homeSections,commerce:{deliveryEnabled:$('deliveryEnabled').checked,pickupEnabled:$('pickupEnabled').checked,pickupLabel:$('pickupLabel').value,businessHours:$('businessHours').value}})});setOutput(data,'ok')}catch(e){setOutput({ok:false,error:e instanceof Error?e.message:String(e)},'error')}finally{setBusy(false)}})
    async function saveMerchandising(row,product){const slug=$('slug').value.trim();const compare=row.querySelector('[data-field="compare"]').value.trim(),promoBadge=row.querySelector('[data-field="badge"]').value.trim(),recommended=row.querySelector('[data-field="recommended"]').checked;const save=row.querySelector('[data-action="save"]');save.disabled=true;try{const data=await requestJson('/api/admin-analytics',{method:'POST',headers:adminHeaders(),body:JSON.stringify({action:'product_merchandising',slug,sourceProductId:product.source_product_id,compareAtPriceUsd:compare===''?null:Number(compare),promoBadge,recommended})});save.textContent='Guardado ✓';setTimeout(()=>{save.textContent='Guardar';save.disabled=false},1300);return data}catch(e){save.disabled=false;throw e}}
    async function loadMerchandising(){const secret=$('secret').value.trim(),slug=$('slug').value.trim();if(!secret||!slug)return setOutput('Falta clave administrativa o slug.','error');setBusy(true);try{const data=await requestJson(`/api/admin-analytics?slug=${encodeURIComponent(slug)}&mode=merchandising`,{headers:{'x-admin-secret':secret}});merchandisingBox.innerHTML='';for(const p of data.products||[]){const el=document.createElement('div');el.className='review-item merchandising-item';el.innerHTML=`<header><strong>${escapeHtml(p.name||p.group_name||'Producto')}</strong><small>${escapeHtml(p.sku||'')} · $${Number(p.price_usd||0).toFixed(2)}</small></header>${p.variant_label?`<p>Variante: <b>${escapeHtml(p.variant_label)}</b></p>`:''}<div class="grid2"><label>Precio anterior (USD)<input data-field="compare" type="number" min="0" step="0.01" value="${p.compare_at_price_usd??''}" placeholder="Ej. 25"></label><label>Etiqueta<input data-field="badge" maxlength="60" value="${escapeHtml(p.promo_badge||'')}" placeholder="Oferta · -15%"></label></div><label class="checks"><span><input data-field="recommended" type="checkbox" ${p.recommended?'checked':''}> Recomendado</span></label><button data-action="save" type="button">Guardar</button>`;el.querySelector('[data-action="save"]').onclick=()=>saveMerchandising(el,p).catch(e=>setOutput({ok:false,error:e instanceof Error?e.message:String(e)},'error'));merchandisingBox.appendChild(el)}if(!(data.products||[]).length)merchandisingBox.textContent='No hay productos públicos.';setOutput({ok:true,products:(data.products||[]).length},'ok')}catch(e){setOutput({ok:false,error:e instanceof Error?e.message:String(e)},'error')}finally{setBusy(false)}}
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
