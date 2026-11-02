import {test,expect,type Page} from '@playwright/test';
import {installControlledClock,pauseIdleClock} from './controlled-clock';

// Presentation fixture only: expose the actual renderer; do not replace combat,
// RNG, timers, assets, controls or application state.
async function exposeRenderer(page:Page,url='/?training=1'){
  await page.route('**/src/game/PixiRenderer.ts*',async route=>{
    const response=await route.fetch(),body=await response.text();
    const anchor='this.parent = parent;';expect(body.split(anchor).length-1).toBe(1);
    await route.fulfill({response,body:body.replace(anchor,`${anchor}\nwindow.__cacheRenderer = this;`)});
  });
  await installControlledClock(page);await page.goto(url);await pauseIdleClock(page);
}

for(const training of [false,true])test(`static cache preserves ${training?'training':'hunt'} reference appearance after resize and camera pan`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await exposeRenderer(page,training?'/?training=1':'/');
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]){
    await page.setViewportSize(size);await page.clock.runFor(32);
    for(const hero of ['knight','druid','sorcerer']){
      const comparison=await page.evaluate(hero=>{
        const r=(window as any).__cacheRenderer;r.selectHero(hero);
        const events=JSON.stringify(r.engine.result),camera=JSON.stringify(r.camera);
        const capture=()=>{
          r.app.render();const canvas=document.createElement('canvas');canvas.width=r.app.canvas.width;canvas.height=r.app.canvas.height;
          const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(r.app.canvas,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;
        };
        r.cacheStaticTerrain=false;r.syncStaticTerrainCache();const reference=capture();
        r.cacheStaticTerrain=true;r.syncStaticTerrainCache();const actual=capture();
        let sum=0,significant=0,nonBlack=0;
        for(let i=0;i<actual.length;i+=4){let max=0;for(let c=0;c<3;c++){const delta=Math.abs(actual[i+c]-reference[i+c]);sum+=delta;max=Math.max(max,delta);}if(max>24)significant++;if(actual[i]+actual[i+1]+actual[i+2]>30)nonBlack++;}
        const pixels=actual.length/4;
        return {meanDelta:sum/(pixels*3),significantFraction:significant/pixels,nonBlackFraction:nonBlack/pixels,
          unchanged:events===JSON.stringify(r.engine.result)&&camera===JSON.stringify(r.camera),cached:r.staticTerrainCache.enabled};
      },hero);
      expect(comparison.cached).toBe(true);expect(comparison.unchanged).toBe(true);expect(comparison.nonBlackFraction).toBeGreaterThan(.5);
      // Same scene, with subpixel raster edge tolerance fixed before measurement.
      expect(comparison.meanDelta).toBeLessThanOrEqual(1.5);expect(comparison.significantFraction).toBeLessThanOrEqual(.005);
    }
  }
  await page.screenshot({path:`test-results/static-cache-${training?'training':'hunt'}-1920.png`});
  expect(errors).toEqual([]);
});

test('dynamic runes and rubble stay live outside the static cache and dispose cleanly',async({page})=>{
  await exposeRenderer(page);
  const result=await page.evaluate(()=>{
    const r=(window as any).__cacheRenderer,baselineRebuilds=r.staticTerrainCache.rebuilds;
    const pixels=()=>{r.app.render();const c=document.createElement('canvas');c.width=r.app.canvas.width;c.height=r.app.canvas.height;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(r.app.canvas,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
    const before=pixels();
    r.applyEvent({type:'rune_placed',time:0,floor:1,data:{tile:{x:14,y:9},castId:'cache-fixture-wall',runeId:'magic_wall'}});
    r.applyEvent({type:'map_changed',time:0,floor:1,data:{logicalTiles:[{x:13,y:9}],blocked:true}});
    const after=pixels();
    const liveParents=r.runeVisuals.get('cache-fixture-wall').graphic.parent===r.terrainLayer&&r.rubble.get('13:9').parent===r.terrainLayer;
    const visible=before.some((value,index)=>value!==after[index]);
    r.applyEvent({type:'rune_removed',time:0,floor:1,data:{castId:'cache-fixture-wall'}});r.updateTweens(250);
    r.applyEvent({type:'map_changed',time:0,floor:1,data:{logicalTiles:[{x:13,y:9}],blocked:false}});
    const removed=r.runeVisuals.size===0&&r.rubble.size===0;
    const stableCache=r.staticTerrainCache.rebuilds===baselineRebuilds&&r.staticTerrainCache.enabled;
    r.destroy();r.destroy();
    return {liveParents,visible,removed,stableCache,disposed:r.staticTerrainCache.reason==='disposed',cached:r.staticTerrainLayer.isCachedAsTexture};
  });
  expect(result).toEqual({liveParents:true,visible:true,removed:true,stableCache:true,disposed:true,cached:false});
  await expect(page.locator('#game canvas')).toHaveCount(0);await expect(page.locator('#game')).toHaveAttribute('data-static-terrain-cache-pixels','0');
});

test.describe('high DPI cache budget',()=>{
  test.use({deviceScaleFactor:2});
  test('oversized textures use the full-quality reference renderer and resize recovers',async({page})=>{
    await exposeRenderer(page);await page.setViewportSize({width:1920,height:1080});await page.clock.runFor(32);
    const game=page.locator('#game');await expect(game).toHaveAttribute('data-static-terrain-cache-reason','budget');
    await expect(game).toHaveAttribute('data-static-terrain-cached','false');
    const sizing=await page.locator('#game canvas').evaluate(c=>({buffer:(c as HTMLCanvasElement).width,css:c.getBoundingClientRect().width}));
    expect(Math.abs(sizing.buffer-sizing.css*2)).toBeLessThan(3);
    await page.setViewportSize({width:1366,height:768});await page.clock.runFor(32);
    await expect(game).toHaveAttribute('data-static-terrain-cached','true');
    expect(Number(await game.getAttribute('data-static-terrain-cache-pixels'))).toBeLessThanOrEqual(8_388_608);
    await page.locator('#restart').click();await page.clock.runFor(32);
    await expect(page.locator('#game canvas')).toHaveCount(1);await expect(game).toHaveAttribute('data-static-terrain-cached','true');
  });
});
