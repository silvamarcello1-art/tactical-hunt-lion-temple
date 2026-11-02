import {test,expect,type Page} from '@playwright/test';
import {installControlledClock,pauseIdleClock} from './controlled-clock';

async function setup(page:Page,training=false){
  await page.route('**/src/game/PixiRenderer.ts*',async route=>{
    const response=await route.fetch(),body=await response.text(),anchor='this.parent = parent;';
    expect(body.split(anchor).length-1).toBe(1);
    await route.fulfill({response,body:body.replace(anchor,`${anchor}\nwindow.__idleRenderer = this;`)});
  });
  await installControlledClock(page);await page.goto(training?'/?training=1':'/');await pauseIdleClock(page);
  await page.evaluate(()=>{
    const r=(window as any).__idleRenderer,render=r.app.render;
    (window as any).__idleDraws=0;
    r.app.render=function(){(window as any).__idleDraws++;return render.call(this);};
  });
  await page.clock.runFor(32);
}
const draws=(page:Page)=>page.evaluate(()=>(window as any).__idleDraws as number);

test('retired unit tweens cannot mutate destroyed sprite transforms or stall the ticker',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
  await page.locator('#start').click();await page.clock.runFor(250);await page.locator('#pause').click();
  // Presentation fixture: real unit objects and real death cleanup, no engine
  // change. Schedule a cast after death so the owner retires first in the frame.
  const result=await page.evaluate(()=>{
    const r=(window as any).__idleRenderer,u=r.units.get('knight'),state=JSON.stringify(r.engine.result);
    r.animateHurt(u);
    r.applyEvent({type:'death',sourceId:'lion-1',targetId:'knight',time:r.player.time,floor:1});
    r.animateUnit(u,'casting');r.updateTweens(2000);
    return {removed:!r.units.has('knight'),destroyed:u.sprite.destroyed,
      stale:r.tweens.filter((t:any)=>t.owner===u.sprite||t.owner===u.body).length,
      domainUnchanged:state===JSON.stringify(r.engine.result)};
  });
  expect(result).toEqual({removed:true,destroyed:true,stale:0,domainUnchanged:true});
  const before=await draws(page);await page.clock.runFor(32);expect(await draws(page)).toBeGreaterThan(before);
  expect(errors).toEqual([]);
});

test('idle context restoration rebuilds the cache, redraws, and detaches wake listeners on dispose',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
  const before=await draws(page),rebuilds=Number(await page.locator('#game').getAttribute('data-static-terrain-cache-rebuilds'));
  const reference=await page.locator('#game').screenshot();
  await page.evaluate(()=>new Promise<void>(resolve=>{
    const r=(window as any).__idleRenderer,c=r.app.canvas,extension=r.app.renderer.gl.getExtension('WEBGL_lose_context');
    if(!extension)throw new Error('WebGL context-loss test extension unavailable');
    (window as any).__idleLoseExtension=extension;
    c.addEventListener('webglcontextlost',()=>resolve(),{once:true});extension.loseContext();
  }));
  await page.evaluate(()=>new Promise<void>(resolve=>{
    (window as any).__idleRenderer.app.canvas.addEventListener('webglcontextrestored',()=>resolve(),{once:true});
    (window as any).__idleLoseExtension.restoreContext();
  }));
  await page.clock.runFor(64);expect(await draws(page)).toBeGreaterThan(before);
  expect(Number(await page.locator('#game').getAttribute('data-static-terrain-cache-rebuilds'))).toBeGreaterThan(rebuilds);
  const actual=await page.locator('#game').screenshot();
  const delta=await page.evaluate(async({a,b})=>{
    const pixels=async(data:string)=>{const image=new Image();image.src=`data:image/png;base64,${data}`;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
    const x=await pixels(a),y=await pixels(b);let sum=0,significant=0,visible=0;
    for(let i=0;i<x.length;i+=4){let max=0;for(let k=0;k<3;k++){const d=Math.abs(x[i+k]-y[i+k]);sum+=d;max=Math.max(max,d);}if(max>24)significant++;if(x[i]+x[i+1]+x[i+2]>30)visible++;}
    return {mean:sum/(x.length/4*3),fraction:significant/(x.length/4),visible:visible/(x.length/4)};
  },{a:actual.toString('base64'),b:reference.toString('base64')});
  expect(delta.visible).toBeGreaterThan(.5);expect(delta.mean).toBeLessThanOrEqual(1.5);expect(delta.fraction).toBeLessThanOrEqual(.005);
  const restored=await draws(page);await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.clock.runFor(32);
  expect(await draws(page)).toBeGreaterThan(restored);
  await page.evaluate(()=>(window as any).__idleRenderer.destroy());const disposed=await draws(page);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.clock.runFor(32);expect(await draws(page)).toBe(disposed);
  await expect(page.locator('#game canvas')).toHaveCount(0);expect(errors).toEqual([]);
});

test('idle and paused draws sleep; active animation and simulation keep their cadence',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
  const idle=await draws(page);await page.clock.runFor(500);expect(await draws(page)).toBe(idle);
  await page.locator('#loop-toggle').click();await page.locator('#start').click();
  const before=await draws(page);await page.clock.runFor(250);
  expect((await draws(page))-before).toBeGreaterThanOrEqual(14);
  expect(Number(await page.locator('html').getAttribute('data-processed-events'))).toBeGreaterThan(0);
  await page.locator('#pause').click();await page.clock.runFor(32);
  const paused=await draws(page),time=await page.locator('#game').getAttribute('data-logical-time');
  await page.clock.runFor(500);expect(await draws(page)).toBe(paused);
  await expect(page.locator('#game')).toHaveAttribute('data-logical-time',time!);
  await page.locator('#card-druid').click();await page.clock.runFor(32);expect(await draws(page)).toBeGreaterThan(paused);
  const changed=await draws(page);await page.setViewportSize({width:1600,height:900});await page.clock.runFor(64);
  expect(await draws(page)).toBeGreaterThan(changed);
  await page.locator('#pause').click();const resume=await draws(page);await page.clock.runFor(250);
  expect((await draws(page))-resume).toBeGreaterThanOrEqual(14);expect(errors).toEqual([]);
});

test('idle aim invalidation matches a forced full-quality reference and clears once',async({page})=>{
  await setup(page,true);
  await page.evaluate(()=>(window as any).__idleRenderer.showAim({x:14,y:9},false));await page.clock.runFor(32);
  await expect(page.locator('#game')).toHaveAttribute('data-aim-tile','14:9:invalid');
  const actual=await page.locator('#game').screenshot();
  await page.evaluate(()=>(window as any).__idleRenderer.app.render());
  const reference=await page.locator('#game').screenshot();
  const delta=await page.evaluate(async({a,b})=>{
    const pixels=async(data:string)=>{const image=new Image();image.src=`data:image/png;base64,${data}`;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
    const x=await pixels(a),y=await pixels(b);let sum=0,significant=0;
    for(let i=0;i<x.length;i+=4){let max=0;for(let k=0;k<3;k++){const d=Math.abs(x[i+k]-y[i+k]);sum+=d;max=Math.max(max,d);}if(max>24)significant++;}
    return {mean:sum/(x.length/4*3),fraction:significant/(x.length/4)};
  },{a:actual.toString('base64'),b:reference.toString('base64')});
  expect(delta.mean).toBeLessThanOrEqual(1.5);expect(delta.fraction).toBeLessThanOrEqual(.005);
  const before=await draws(page);await page.evaluate(()=>(window as any).__idleRenderer.showAim());await page.clock.runFor(32);
  expect(await draws(page)).toBeGreaterThan(before);const cleared=await draws(page);
  await page.evaluate(()=>(window as any).__idleRenderer.showAim());await page.clock.runFor(250);expect(await draws(page)).toBe(cleared);
});

test('repeated HUD values preserve DOM identity while real changes still appear',async({page})=>{
  await setup(page);
  const repeated=await page.evaluate(async()=>{
    const policy=document.querySelector('#mode-policy')!,number=document.querySelector('.cooldown-number')!;
    const marker=document.createTextNode('');number.append(marker);
    let mutations=0;const observer=new MutationObserver(records=>mutations+=records.length);
    observer.observe(policy,{childList:true});observer.observe(number,{childList:true});
    for(let i=0;i<10;i++)window.dispatchEvent(new CustomEvent('hunt-time',{detail:0}));
    await Promise.resolve();observer.disconnect();return {mutations,preserved:marker.parentNode===number};
  });
  expect(repeated).toEqual({mutations:0,preserved:true});
  await page.locator('#start').click();await page.clock.runFor(1500);
  expect(Number(await page.locator('html').getAttribute('data-processed-events'))).toBeGreaterThan(0);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-control-mode','AI');
});
