import {chromium,expect} from '@playwright/test';
import {resolve} from 'node:path';
import {mkdir} from 'node:fs/promises';
const [url='http://127.0.0.1:4173/',sha='',label='local']=process.argv.slice(2);
const output=resolve(import.meta.dirname,'../test-results');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
try {
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());if(message.type()==='warning')warnings.push(message.text());});
  // QA-only instrumentation in an isolated context. Preserve callback timestamps.
  // Measure callback execution cost, not FPS or the browser frame interval.
  await page.addInitScript(()=>{
    const raf=requestAnimationFrame.bind(window),stats={};
    window.__qaFrameStats=stats;
    window.requestAnimationFrame=callback=>raf(timestamp=>{
      const active=['running','boss'].includes(document.documentElement.dataset.sessionState);
      const speed=document.querySelector('[data-speed].active')?.getAttribute('data-speed')??'1';
      const start=performance.now();
      try {callback.call(window,timestamp);} finally {
        const cost=performance.now()-start;
        if(active){const s=stats[speed]??={count:0,total:0,max:0};s.count++;s.total+=cost;s.max=Math.max(s.max,cost);}
      }
    });
  });
  await page.goto(url);
  if(sha){const manifest=await page.request.get(new URL('version.json?sha='+sha,url).href);expect((await manifest.json()).commit).toBe(sha);}
  await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#loop-toggle').click();await page.locator('#card-druid').click();
  await page.locator('[data-speed="1"]').click();await page.locator('#start').click();
  await page.waitForTimeout(5000);
  await page.screenshot({path:resolve(output,`mvp2b1-${label}-gameplay.png`)});
  await page.waitForTimeout(10000);await page.locator('[data-speed="4"]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.sessionState==='completed',undefined,{timeout:120000});
  await page.waitForTimeout(1000);
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#result-content')).toContainText('Vitória no templo');
  await expect(page.locator('#result-content')).toContainText('4.240');
  await expect(page.locator('#result-content')).toContainText('Monstros derrotados: 19');
  for(const metric of ['logical-overlaps','out-of-bounds','active-projectiles','active-telegraphs','reservation-count','residual-visual-objects','tween-count'])await expect(page.locator('#game')).toHaveAttribute('data-'+metric,'0');
  await expect(page.locator('#game')).toHaveAttribute('data-unit-count','3');expect(errors).toEqual([]);
  const evidence=await page.evaluate(()=>({
    result:document.querySelector('#result-content')?.textContent,
    game:{...document.querySelector('#game')?.dataset},
    rafCost:Object.fromEntries(Object.entries(window.__qaFrameStats).map(([speed,s])=>[speed,{samples:s.count,averageMs:s.total/s.count,maxMs:s.max}])),
  }));
  await page.screenshot({path:resolve(output,`mvp2b1-${label}-victory.png`)});
  console.log(JSON.stringify({url,sha,errors,warnings,...evidence}));
}finally{await browser.close();}
