// Offline regression tests. Run: node scripts/qa/qa_v63_mobile_wholesale.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const root=path.join(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'server/catalog-v4.ts'),'utf8');
const transpiled=ts.transpileModule(source,{fileName:'catalog-v4.ts',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const sandbox={exports:{},console};vm.runInNewContext(transpiled,sandbox);
const {buildPublicGroups}=sandbox.exports;
const row=(id,group,price,wholesale,minQty,stock,variant)=>({source_product_id:id,source_group_id:group,group_code:'G-1',name:'Balón con variantes',variant_label:variant,price_usd:price,price_bs:price*40,wholesale_price_usd:wholesale,wholesale_price_bs:wholesale*40,wholesale_min_quantity:minQty,stock_exact:stock,availability:'available',gallery_urls:[],image_url:'',sku:`SKU-${id}`,public_visible:true,published:true,active:true});
const policy={show_stock_mode:'exact',hide_out_of_stock:false};
let g=buildPublicGroups([row(1,99,32,null,null,3,'Pequeño'),row(2,99,40,30,4,5,'Grande')],policy)[0];
assert.equal(g.price_usd,32);assert.equal(g.wholesale_price_usd,30);assert.equal(g.wholesale_retail_price_usd,40);assert.equal(g.wholesale_min_quantity,4);assert.equal(g.wholesale_variant_label,'Grande');
g=buildPublicGroups([row(3,null,32,28,4,9,'Única')],policy)[0];assert.equal(g.wholesale_retail_price_usd,32);assert.equal(g.wholesale_price_usd,28);
g=buildPublicGroups([row(4,null,32,40,4,9,'Inválida')],policy)[0];assert.equal(g.wholesale_price_usd,null);
const ui=fs.readFileSync(path.join(root,'src/main.tsx'),'utf8');const css=fs.readFileSync(path.join(root,'src/v6-3-mobile.css'),'utf8');
assert.match(ui,/Desde \{wholesale\.minimum\} uds\./);assert.match(ui,/href="#precio-mayor"/);assert.match(ui,/tier\.eligible\?<small>Mayor desde \{tier\.minimum\} uds/);assert.match(css,/max-width:640px/);assert.match(css,/\.iv-hero-art\{aspect-ratio:1\.85\/1/);
console.log('PASS 9 checks: per-variant wholesale integrity, minimum, invalid tiers, card, detail, mobile dock, responsive hero');
