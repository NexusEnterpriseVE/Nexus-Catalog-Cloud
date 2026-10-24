/** Búsqueda y Bs del catálogo público. Ejecutar: node scripts/qa/qa_search.cjs */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const load=(file,req)=>{const out=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={};new Function('require','exports','module',out)(req,m,{exports:m});return m};
const catalogV4=load('server/catalog-v4.ts',require);

const row=(id,name,extra={})=>({source_product_id:id,source_group_id:null,name,sku:`SKU${id}`,brand:'',model:'',category:'Balones',subcategory:'',description:'',features:'',group_code:'',variant_label:'',variant_name:'',variant_attributes:null,price_usd:35,price_bs:30769.2,stock_exact:10,published:true,public_visible:true,active:true,image_url:null,gallery_urls:[],updated_at:'2026-10-24',...extra});
const rows=[
  row(56,'Balón de Fútbol Campo Molten #4 AFC 4000',{brand:'Molten'}),
  row(66,'Balón de Fútbol Campo Molten #5 AFC 5000',{brand:'Molten'}),
  row(118,'Balón de Voleibol Mikasa V200W #5',{brand:'Mikasa',price_usd:32}),
  row(200,'Rodillera deportiva',{description:'Compatible con balón de voleibol'}),
];
const tenant={id:'t1',slug:'daca-sport',public_name:'Daca Sport',show_stock_mode:'exact',hide_out_of_stock:false,rate_bs_per_usd:887.3,rate_source:'BCV',commerce_settings_json:{}};
const chain=(result)=>{const q={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,range:()=>Promise.resolve(result),limit:()=>Promise.resolve(result),maybeSingle:()=>Promise.resolve(result)};return q};
const db={from:t=>t==='catalog_tenants'?chain({data:tenant,error:null}):t==='catalog_products'?chain({data:rows,error:null}):chain({data:[],error:null})};
const api=load('api/catalog.ts',name=>{
  if(name==='../server/supabase.js')return {adminDb:()=>db};
  if(name==='../server/http.js')return {json:(v,init)=>new Response(JSON.stringify(v),{status:init?.status||200}),err:e=>new Response(JSON.stringify({error:String(e)}),{status:500})};
  if(name==='../server/catalog-v4.js')return catalogV4;
  return require(name);
});
const search=async q=>{const r=await api.default.fetch(new Request(`http://local/api/catalog?slug=daca-sport&q=${encodeURIComponent(q)}`));const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j};

(async()=>{
  const ids=j=>j.products.map(p=>p.source_product_id);
  assert.deepEqual(ids(await search('balon molten')).sort(),[56,66],'Palabras en cualquier orden');
  assert.deepEqual(ids(await search('molten balon')).sort(),[56,66]);
  assert.deepEqual(ids(await search('Molten AFC')).sort(),[56,66],'Términos no contiguos');
  assert.deepEqual(ids(await search('MOLTEN #4')),[56],'Mayúsculas y # ignorados');
  assert.deepEqual(ids(await search('voleibol')),[118,200],'Relevancia: nombre antes que descripción');
  assert.equal((await search('balon inexistente')).total,0,'Todas las palabras deben aparecer');
  assert.equal((await search('')).total,4);
  const j=await search('molten');
  for(const p of j.products)assert.equal(p.price_bs,31055.5,'Bs = USD x tasa de la empresa, no el price_bs almacenado');
  console.log('PASS search: word order, non-contiguous terms, case/accents/#, relevance, no-match, Bs at tenant rate');
})().catch(e=>{console.error(e);process.exit(1)});
