/** Run after npm install: node scripts/qa/qa_v52_wholesale.cjs */
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const reactText=fs.readFileSync(path.join(root,'src/main.tsx'),'utf8');
const engine=reactText.slice(reactText.indexOf('function wholesaleTier('),reactText.indexOf('function bs('));
assert.ok(engine.startsWith('function wholesaleTier('));
const engineJs=ts.transpileModule(engine,{compilerOptions:{module:ts.ModuleKind.None,target:ts.ScriptTarget.ES2022}}).outputText;
const ctx=vm.createContext({});
vm.runInContext(engineJs+'\nthis.wholesaleTier=wholesaleTier;this.cartTotal=cartTotal;',ctx);
for(const [qty,expectUnit,expectTotal] of [[1,32,32],[3,32,96],[4,28,112],[5,28,140]]){
  const tier=ctx.wholesaleTier(32,28,4,qty);
  assert.equal(tier.unitPrice,expectUnit);
  assert.equal(ctx.cartTotal([{priceUsd:32,wholesalePriceUsd:28,wholesaleMinQuantity:4,qty}]),expectTotal);
}
assert.equal(ctx.wholesaleTier(32,35,4,4).eligible,false,'Do not display fake discount');
assert.equal(ctx.wholesaleTier(32,28,0,4).eligible,false,'Require minimum quantity');

let products=[{source_product_id:100,sku:'GG5X',name:'Molten GG5X',price_usd:32,price_bs:1000,wholesale_price_usd:28,wholesale_price_bs:875,wholesale_min_quantity:4,stock_exact:100}];
let commerce={deliveryEnabled:false,pickupEnabled:true,pickupLabel:'Retiro',paymentMethods:[{id:'pago_movil',label:'Pago Móvil',enabled:true}],showWholesalePrice:true};
let lastInserted=null;
const db={from(table){return {
 select(){return this},eq(){return this},in(){return Promise.resolve({data:products,error:null})},
 maybeSingle(){return Promise.resolve({data:{id:'tenant-id',public_name:'Daca Sport',phone:'584120000000',commerce_settings_json:commerce},error:null})},
 insert(data){lastInserted=data;return Promise.resolve({error:null})}
}}};
const fakeRequire=name=>{
 if(name==='node:crypto')return {default:require('node:crypto')};
 if(name==='../server/supabase.js')return {adminDb:()=>db};
 if(name==='../server/http.js')return {json:(value,init)=>new Response(JSON.stringify(value),{status:init?.status||200,headers:{'content-type':'application/json'}}),err:(error)=>new Response(JSON.stringify({error:String(error)}),{status:500})};
 if(name==='../server/catalog-v4.js')return {buildPublicGroups:()=>[],groupMatchesPrice:()=>true};
 return require(name);
};
const raw=fs.readFileSync(path.join(root,'api/catalog.ts'),'utf8');
const transformed=ts.transpileModule(raw,{fileName:'catalog.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exportsObj={};
new Function('require','exports','module',transformed)(fakeRequire,exportsObj,{exports:exportsObj});
const handler=exportsObj.default;
assert.ok(handler?.fetch);
async function checkout(qty){
 const request=new Request('http://local/api/catalog',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'checkout',slug:'daca-sport',items:[{id:100,qty}],customer:{name:'Cliente Prueba',phone:'04120000000'},fulfillment:'pickup',paymentMethod:'pago_movil'})});
 const result=await handler.fetch(request);
 const body=await result.json();
 assert.equal(result.status,200,JSON.stringify(body));
 return body;
}
(async()=>{
 for(const [qty,total,discounted] of [[1,32,false],[3,96,false],[4,112,true],[5,140,true]]){
   const response=await checkout(qty);
   assert.equal(response.total,total);
   assert.equal(response.items[0].wholesaleApplied,discounted);
   assert.equal(lastInserted.total_reference_usd,total);
   if(discounted)assert.match(response.whatsappText,/precio al mayor/);
 }
 commerce.showWholesalePrice=false;
 const inactive=await checkout(4);
 assert.equal(inactive.total,128);
 console.log('PASS wholesale quantities: 1,3,4,5; checkout server, WhatsApp and disabled wholesale');
})().catch(e=>{console.error(e);process.exit(1)});
