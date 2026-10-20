// Production 3v3 smoke: real clock, isolated Edge context, exact published SHA.
import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const [base='http://127.0.0.1:4173/',sha='',label='local']=process.argv.slice(2);
const url=new URL(base);url.searchParams.set('training','1');if(sha)url.searchParams.set('v',sha);
const output=resolve(import.meta.dirname,'../test-results');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
try{
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[],events=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.exposeFunction('captureTeamEvent',e=>events.push(e));
  await page.addInitScript(()=>window.addEventListener('hunt-event',e=>window.captureTeamEvent(e.detail)));
  await page.goto(url.href);await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  if(sha){const response=await page.request.get(new URL('version.json?sha='+sha,url).href);expect((await response.json()).commit).toBe(sha);}
  const save=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>/progress|equipment|currency/.test(k)))));
  const before=await save();const point=async tile=>{
    const game=page.locator('#game'),w=Number(await game.getAttribute('data-arena-width')),h=Number(await game.getAttribute('data-arena-height'));
    const [ox,oy]=(await game.getAttribute('data-arena-origin')).split(':').map(Number),b=await page.locator('#game canvas').boundingBox(),s=Math.min(b.width/w,b.height/h);
    return {x:b.x+(b.width-w*s)/2+(tile.x*32-ox)*s,y:b.y+(b.height-h*s)/2+(tile.y*32-oy)*s};
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
  await page.locator('#control-mode').selectOption('ASSISTED');await expect(page.locator('#card-druid')).toHaveAttribute('data-control-mode','ASSISTED');
  await page.locator('#card-sorcerer').click();await expect(page.locator('#card-druid')).toHaveAttribute('data-control-mode','AI');
  await expect(page.locator('#card-sorcerer')).toHaveAttribute('data-control-mode','MANUAL');
  await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  for(let cycle=0;cycle<3;cycle++){
    if(cycle){await page.locator('#close-result').click();await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');}
    await page.locator('#control-mode').selectOption('AI');await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute('data-session-state','completed',{timeout:60000});
    await expect(page.locator('#result-content')).toContainText('Treino concluído');expect(await save()).toBe(before);
    for(const m of ['logical-overlaps','out-of-bounds','reservation-count','active-projectiles','active-rune-tiles','rune-conditions','pending-pushes','residual-visual-objects'])await expect(page.locator('#game')).toHaveAttribute('data-'+m,'0');
  }
  const botEvents=events.filter(e=>e.sourceId?.startsWith('training-'));
  for(const id of ['training-sparring','training-vanguard','training-warden'])expect(botEvents.some(e=>e.sourceId===id&&e.type==='damage')).toBe(true);
  for(const type of ['cast','rune_used','heal'])expect(botEvents.some(e=>e.type===type)).toBe(true);
  expect(events.some(e=>['hero_experience','equipment_drop','boss_reward','loot','experience'].includes(e.type))).toBe(false);expect(errors).toEqual([]);
  console.log(JSON.stringify({url:url.href,sha,cycles:3,errors,economyUnchanged:await save()===before,botActions:botEvents.length,game:await page.locator('#game').evaluate(el=>({...el.dataset}))}));
}finally{await browser.close();}
