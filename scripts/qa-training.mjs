// Historical 2B.2 single-sparring fixture. For current production 3v3 use qa-training-team.mjs.
import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const [base='http://127.0.0.1:4173/',sha='',label='local']=process.argv.slice(2);
const url=new URL(base);url.searchParams.set('training','1');
const output=resolve(import.meta.dirname,'../test-results');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
try{
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[],events=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.exposeFunction('captureTrainingEvent',e=>events.push(e));
  await page.addInitScript(()=>window.addEventListener('hunt-event',e=>window.captureTrainingEvent(e.detail)));
  await page.goto(url.href);
  if(sha){const manifest=await page.request.get(new URL('version.json?sha='+sha,url).href);expect((await manifest.json()).commit).toBe(sha);}
  await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await expect(page.locator('#control-mode')).toHaveValue('MANUAL');
  const save=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>/progress|equipment|currency/.test(k)))));
  const before=await save();
  const tile=async p=>{
    const b=await page.locator('#game canvas').boundingBox(),s=Math.min(b.width/960,b.height/576);
    await page.mouse.click(b.x+(b.width-960*s)/2+p.x*32*s,b.y+(b.height-576*s)/2+p.y*32*s);
  };
  await page.locator('#start').click();await page.keyboard.press('Digit4');await tile({x:7,y:9});
  await expect(page.locator('[data-rune="magic_wall"]')).toHaveAttribute('data-charges','7');
  await page.keyboard.press('Numpad4');await page.waitForTimeout(500);
  expect(await page.locator('#game').getAttribute('data-logical-positions')).toContain('knight:8:9');
  await page.waitForTimeout(2000);
  const bot=(await page.locator('#game').getAttribute('data-logical-positions')).split(',').find(p=>p.startsWith('training-sparring:')).split(':');
  await page.keyboard.press('Digit5');await tile({x:Number(bot[1]),y:Number(bot[2])});
  await expect(page.locator('[data-rune="fire_field"]')).toHaveAttribute('data-charges','11');
  await expect.poll(()=>events.some(e=>e.type==='damage'&&e.data?.castId?.startsWith('rune-'))).toBe(true);
  await page.locator('#pause').click();
  await expect.poll(()=>page.locator('#game').getAttribute('data-active-rune-tiles')).toBe('2');
  const paused=await page.locator('#game').getAttribute('data-logical-time');await page.waitForTimeout(800);
  expect(await page.locator('#game').getAttribute('data-logical-time')).toBe(paused);
  await page.screenshot({path:resolve(output,`mvp2b2-${label}-runes.png`)});
  await page.locator('#pause').click();await page.locator('[data-speed="4"]').click();
  await expect(page.locator('#game')).toHaveAttribute('data-active-rune-tiles','0',{timeout:10000});
  await page.locator('#restart').click();
  for(let cycle=0;cycle<3;cycle++){
    if(cycle){await page.locator('#close-result').click();await page.locator('#restart').click();}
    for(const id of ['druid','sorcerer','knight']){await page.locator(`#card-${id}`).click();await page.locator('#control-mode').selectOption('AI');}
    await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute('data-session-state','completed',{timeout:60000});
    await expect(page.locator('#result-content')).toContainText('Treino concluído');
    for(const metric of ['logical-overlaps','out-of-bounds','active-projectiles','active-telegraphs','reservation-count','active-rune-tiles','rune-conditions'])await expect(page.locator('#game')).toHaveAttribute('data-'+metric,'0');
    await expect(page.locator('#game canvas')).toHaveCount(1);
    expect(await save()).toBe(before);
  }
  expect(events.some(e=>['equipment_drop','hero_experience','boss_reward','loot','experience'].includes(e.type))).toBe(false);
  expect(errors).toEqual([]);
  await page.screenshot({path:resolve(output,`mvp2b2-${label}-complete.png`)});
  console.log(JSON.stringify({url:url.href,sha,cycles:3,errors,eventCount:events.length,economyUnchanged:await save()===before,game:await page.locator('#game').evaluate(el=>({...el.dataset}))}));
}finally{await browser.close();}
