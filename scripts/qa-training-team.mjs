// Production manual 3v3 smoke: real clock, isolated Edge context, exact SHA.
import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const [base='http://127.0.0.1:4173/',sha='',label='local']=process.argv.slice(2);
const url=new URL(base);url.searchParams.set('training','1');if(sha)url.searchParams.set('v',sha);
const output=resolve(import.meta.dirname,'../test-results');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
try{
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[],warnings=[],events=[],samples=[],latencies=[],speedWallMs={1:0,4:0};
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  await page.exposeFunction('captureTeamEvent',e=>events.push(e));
  await page.addInitScript(()=>window.addEventListener('hunt-event',e=>window.captureTeamEvent(e.detail)));
  await page.goto(url.href);await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  if(sha){const response=await page.request.get(new URL('version.json?sha='+sha,url).href);expect((await response.json()).commit).toBe(sha);}
  const save=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>/progress|equipment|currency/.test(k)))));
  const before=await save();const point=async tile=>{
    const b=await page.locator('#game canvas').boundingBox(),c=JSON.parse(await page.locator('#game').getAttribute('data-camera'));
    return {x:b.x+c.left+(tile.x*32-c.x)*c.scale,y:b.y+c.top+(tile.y*32-c.y)*c.scale};
  };
  const click=async tile=>{const p=await point(tile);await page.mouse.click(p.x,p.y);};
  for(let key=1;key<=9;key++)await expect(page.locator(`.action-dock [data-action-slot="${key}"]`)).toHaveCount(1);
  await expect(page.locator('.rail-hint')).toHaveCount(0);
  await page.locator('#start').click();await expect(page.locator('#game')).toHaveAttribute('data-unit-count','6');
  await page.keyboard.press('Digit4');await click({x:7,y:9});await expect(page.locator('[data-rune="magic_wall"]')).toHaveAttribute('data-charges','7');
  await page.locator('#pause').click();const paused=await page.locator('#game').getAttribute('data-logical-time');await page.waitForTimeout(400);
  expect(await page.locator('#game').getAttribute('data-logical-time')).toBe(paused);
  await page.screenshot({path:resolve(output,`mvp2b4-${label}-arena.png`)});
  await page.locator('#pause').click();await expect(page.locator('[data-rune="fire_field"]')).toHaveAttribute('data-remaining','0');
  // Do not shoot diagonally through the just-placed wall at (7,9).
  await page.keyboard.press('Digit5');await click({x:9,y:10});await expect(page.locator('[data-rune="fire_field"]')).toHaveAttribute('data-charges','11');
  const placed=events.find(e=>e.type==='rune_placed'&&e.sourceId==='knight'&&e.data?.runeId==='fire_field');expect(placed).toBeTruthy();
  await expect.poll(async()=>Number(await page.locator('#game').getAttribute('data-logical-time'))).toBeGreaterThanOrEqual(placed.time+1000);
  await page.keyboard.press('Digit7');await click({x:9,y:10});
  await expect(page.locator('[data-rune="destroy_field"]')).toHaveAttribute('data-charges','11');
  await page.locator('#card-druid').click();await expect(page.locator('#card-druid')).toHaveAttribute('data-control-mode','MANUAL');
  await expect(page.locator('#card-knight')).toHaveAttribute('data-control-mode','AI');
  await expect(page.locator('#control-mode')).toBeHidden();
  await page.locator('#card-sorcerer').click();await expect(page.locator('#card-druid')).toHaveAttribute('data-control-mode','AI');
  await expect(page.locator('#card-sorcerer')).toHaveAttribute('data-control-mode','MANUAL');
  await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  for(let cycle=0;cycle<3;cycle++){
    if(cycle){await page.locator('#close-result').click();await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');}
    const initialSpeed=cycle===0?1:4;
    await page.locator('#card-knight').click();await page.locator(`[data-speed="${initialSpeed}"]`).click();await page.locator('#start').click();
    await expect(page.locator('#card-knight')).toHaveAttribute('data-control-mode','MANUAL');
    // Real taps, hold and diagonal; then explicit focus/casts, never selected Auto.
    for(const key of cycle===0?['Numpad4','Numpad8','Numpad7','Numpad6']:[]){
      await page.keyboard.down(key);await page.waitForTimeout(key==='Numpad4'?550/initialSpeed:35);await page.keyboard.up(key);await page.waitForTimeout(280/initialSpeed);
      latencies.push(Number(await page.locator('#player-controls').getAttribute('data-input-latency-ms')));
    }
    await page.keyboard.press('Escape');
    const started=Date.now();let speed=initialSpeed,last=started;
    for(let tick=0;Date.now()-started<60000&&!['completed','defeated'].includes(await page.locator('html').getAttribute('data-session-state'));tick++){
      if(Date.now()-started>30000&&speed===1){speedWallMs[1]+=Date.now()-last;await page.locator('[data-speed="4"]').click();speed=4;last=Date.now();}
      const targets=page.locator('[data-battle-target]');if(await targets.count()){
        const targetId=await targets.first().getAttribute('data-battle-target');
        const chosen=page.locator(`[data-battle-target="${targetId}"]`);
        try{await chosen.click({timeout:500});}catch(error){
          // A real target can retire before click or during final-floor cleanup.
          // Retry only an actually removed ID; all victory/cleanup checks remain.
          if(['completed','defeated'].includes(await page.locator('html').getAttribute('data-session-state')))break;
          if(await chosen.count()===0){await page.waitForTimeout(50);continue;}
          throw error;
        }
      }
      if(tick%4===0){await page.keyboard.press('Digit2');await page.waitForTimeout(280/initialSpeed);await page.keyboard.press('Digit3');}
      if(tick%10===0)samples.push(await page.locator('#game').evaluate(el=>({...el.dataset})));
      await page.waitForTimeout(250/initialSpeed);
    }
    speedWallMs[speed]+=Date.now()-last;
    await expect(page.locator('html')).toHaveAttribute('data-session-state','completed');
    await expect(page.locator('#result-content')).toContainText('Treino concluído');expect(await save()).toBe(before);
    for(const m of ['logical-overlaps','out-of-bounds','reservation-count','active-projectiles','active-rune-tiles','rune-conditions','pending-pushes','pending-approaches','residual-visual-objects','tween-count','active-floating-texts','active-spell-effects','temporary-blocked-tiles'])await expect(page.locator('#game')).toHaveAttribute('data-'+m,'0');
    await page.screenshot({path:resolve(output,`tactical-${label}-training-${cycle+1}.png`)});
  }
  const botEvents=events.filter(e=>e.sourceId?.startsWith('training-'));
  for(const id of ['training-sparring','training-vanguard','training-warden'])expect(botEvents.some(e=>e.sourceId===id&&e.type==='damage')).toBe(true);
  for(const type of ['cast','rune_used','heal'])expect(botEvents.some(e=>e.type===type)).toBe(true);
  expect(events.some(e=>['hero_experience','equipment_drop','boss_reward','loot','experience'].includes(e.type))).toBe(false);expect(errors).toEqual([]);
  console.log(JSON.stringify({url:url.href,sha,cycles:3,errors,warnings,speedWallMs,keyboardSampleLatencyMs:latencies,samples,economyUnchanged:await save()===before,botActions:botEvents.length,game:await page.locator('#game').evaluate(el=>({...el.dataset}))}));
}finally{await browser.close();}
