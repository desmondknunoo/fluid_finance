import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/lib/artwork-layout.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {ARTWORK_LOGO,ARTWORK_HEADING_GAP_MULTIPLIER,artworkHeadingTop,artworkTextTop,beginArtworkContent}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const fake=(ascent=70)=>({font:'500 22px prior',textBaseline:'middle',measureText:()=>({actualBoundingBoxAscent:ascent}),save(){this.saved=true;},translate(x,y){this.offset=[x,y];}});
test('the Pump Report visible logo-to-heading gap grows exactly 2.5 times',()=>{
 const ctx=fake();const bottom=ARTWORK_LOGO.top+ARTWORK_LOGO.height;
 const oldGap=242-70-bottom;
 assert.ok(oldGap>0);
 assert.equal(ARTWORK_HEADING_GAP_MULTIPLIER,2.5);
 assert.ok(Math.abs(artworkHeadingTop(ctx,'FluidPumpBody')-bottom-oldGap*2.5)<1e-9);
 assert.equal(ctx.font,'500 22px prior');assert.equal(ctx.textBaseline,'middle');
});
test('different heading-block origins align to the same visible gap without moving the logo',()=>{
 for(const family of ['FluidPumpBody','FluidStudioBody','FluidStockBody'])for(const origin of [172,208.5,232,300]){
  const ctx=fake();beginArtworkContent(ctx,origin,family);
  assert.equal(ctx.saved,true);assert.equal(ctx.offset[0],0);
  assert.equal(origin+ctx.offset[1],artworkHeadingTop(ctx,family));
 }
});
test('text ink measurement accounts for baseline and restores caller text settings',()=>{
 const ctx=fake(-18);assert.equal(artworkTextTop(ctx,'TODAY’S','800 94px FluidStudioBody','top',216),234);
 assert.equal(ctx.font,'500 22px prior');assert.equal(ctx.textBaseline,'middle');
});
