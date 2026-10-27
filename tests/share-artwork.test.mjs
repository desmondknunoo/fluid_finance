import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
const built=await build({stdin:{contents:'export { renderMoversCard } from "./src/lib/movers-share-card";export { renderWeeklyTrendCard } from "./src/lib/weekly-trends-share-card";export {renderFuelCards} from "./src/lib/fuel-share-card";export {renderShareCard} from "./src/lib/share-card";export {renderSocialAsset} from "./src/lib/social-asset";',resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',alias:{'@':resolve('src')}});
const {renderMoversCard,renderWeeklyTrendCard,renderFuelCards,renderShareCard,renderSocialAsset}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
let canvases=[];
globalThis.FontFace=class{async load(){return this;}};
globalThis.Path2D=class{};
globalThis.window={setTimeout,clearTimeout};
globalThis.Image=class{naturalWidth=1772;naturalHeight=894;set src(url){this.url=url;queueMicrotask(()=>this.onload());}};
globalThis.document={fonts:{add(){},load:async()=>{},ready:Promise.resolve()},createElement(){const calls=[];const context=new Proxy({font:'500 30px Test',measureText(text){const size=Number(this.font.match(/(\d+)px/)?.[1]||30);return{width:[...text].reduce((n,c)=>n+(c===' '?0.25:0.48)*size,0)};},fillText(text,x,y){calls.push({text,x,y,ink:this.fillStyle});},fillRect(...args){calls.push({fill:this.fillStyle,args});},fill(){calls.push({fill:this.fillStyle});},drawImage(image,...args){calls.push({image:image.url,args});},createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},getImageData(){return{data:new Uint8ClampedArray([10,100,180,255])}}},{get(o,k){return k in o?o[k]:()=>{}}});const canvas={calls,width:0,height:0,getContext(){return context},toBlob(fn){fn(new Blob(['proof'],{type:'image/png'}));}};canvases.push(canvas);return canvas;}};
const stock={symbol:'MTNGH',company:'MTN Ghana',sector:'Telecoms',price:3.2,change:0.1,changePercent:3.23,volume:1250000};
const artwork=()=>canvases.findLast(c=>c.width===1080);
function approvedFrame(canvas){assert.equal(canvas.height,1350);assert.ok(canvas.calls.some(c=>c.image==='/logo/studio-approved.png'));assert.ok(canvas.calls.some(c=>c.text==='BUILD WEALTH'));for(const handle of ['@fluidfinanceonline','@fluid_finance','@FluidFinanceX'])assert.ok(canvas.calls.some(c=>c.text===handle));}

test('public Fuel share uses the approved background, all report pages and the correct comparisons',async()=>{
 const prices=Array.from({length:11},(_,n)=>({omc_id:null,name:`OMC ${n+1}`,logo_url:'https://api.finance.fluidterra.com/api/v1/editorial/media/omc-logos/00000000-0000-0000-0000-000000000001.png',petrol:12.5,diesel:14}));
 const report={id:'report',report_date:'2026-10-27',created_at:'2026-10-27',prices};
 const previous={...report,report_date:'2026-10-20',prices:prices.map(row=>({...row,petrol:13,diesel:13.5}))};
 canvases=[];const blobs=await renderFuelCards(report,previous);assert.equal(blobs.length,2);
 for(const canvas of canvases.filter(c=>c.width===1080)){approvedFrame(canvas);assert.ok(canvas.calls.some(c=>c.image==='/studio/backgrounds/pump-generated.png'));assert.ok(canvas.calls.some(c=>c.text==='12.50'));assert.ok(canvas.calls.some(c=>c.text==='14.00'));}
});

test('every daily mover category uses the approved generator and Most Active retains trading volume',async()=>{
 for(const category of ['gainers','losers','active']){
  canvases=[];await renderMoversCard({category,stocks:[{...stock,changePercent:category==='losers'?-3.23:3.23}]});
  const canvas=artwork();approvedFrame(canvas);
  assert.ok(canvas.calls.some(c=>c.image==='/studio/backgrounds/daily-generated.png'));
  assert.ok(canvas.calls.some(c=>c.text==='TODAY’S'));
  assert.ok(canvas.calls.some(c=>c.text===({gainers:'TOP GAINERS',losers:'TOP LOSERS',active:'MOST ACTIVE'})[category]));
  if(category==='active'){assert.ok(canvas.calls.some(c=>c.text==='Volume'));assert.ok(canvas.calls.some(c=>c.text==='1.3M'));assert.ok(!canvas.calls.some(c=>c.text==='Day change'));}
 }
});

test('weekly and single-stock public shares match Studio drawing for identical data',async()=>{
 const weekly={type:'gainers',startDate:'2026-10-19',endDate:'2026-10-23',weeklyChanges:[{stock,weeklyChangePercent:4.5}],theme:'light'};
 canvases=[];await renderWeeklyTrendCard(weekly);const publicWeekly=artwork().calls;
 canvases=[];await renderSocialAsset({kind:'week-in-review',template:'breaking',title:'Week in Review',symbol:'',value:'',change:'',details:'',date:weekly.endDate,source:'Ghana Stock Exchange',theme:'fluid-text-blue',weekReview:{direction:'gainers',startDate:weekly.startDate,rows:[{name:'MTN Ghana (MTNGH)',logo:'/gse/MTNGH.png',price:'3.20',change:'4.50'}]}});
 assert.deepEqual(JSON.parse(JSON.stringify(artwork().calls)),JSON.parse(JSON.stringify(publicWeekly)));approvedFrame(artwork());
 const chart={...stock,points:[{t:Date.UTC(2026,9,20),close:3.1,recorded:true},{t:Date.UTC(2026,9,21),close:3.2,recorded:true}],range:'1W',periodPercent:3.23,hasBackfill:false,theme:'dark'};
 canvases=[];await renderShareCard(chart);const publicStock=artwork().calls;
 canvases=[];await renderSocialAsset({kind:'single-stock',template:'breaking',title:'MTN Ghana',symbol:'MTNGH',value:'',change:'',details:'',date:'2026-10-27',stockCard:chart});
 assert.deepEqual(JSON.parse(JSON.stringify(artwork().calls)),JSON.parse(JSON.stringify(publicStock)));approvedFrame(artwork());
});

test('the portal and public site cannot drift across their shared artwork implementation',()=>{
 for(const file of ['social-asset.ts','fuel-share-card.ts','movers-share-card.ts','weekly-trends-share-card.ts','share-card.ts','fluid-design-presets.ts']){
  assert.equal(readFileSync(`src/lib/${file}`,'utf8'),readFileSync(`../fluid_finance_portal/src/lib/${file}`,'utf8'),file);
 }
});
