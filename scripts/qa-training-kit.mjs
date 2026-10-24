// Historical 2B.3 stationary fixture. For current production 3v3 use qa-training-team.mjs.
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
  await page.exposeFunction('captureKitEvent',e=>events.push(e));
  await page.addInitScript(()=>window.addEventListener('hunt-event',e=>window.captureKitEvent(e.detail)));
  await page.goto(url.href);
  if(sha){const response=await page.request.get(new URL('version.json?sha='+sha,url).href);expect((await response.json()).commit).toBe(sha);}
  await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  for(let slot=1;slot<=9;slot++)await expect(page.locator(`[data-action-slot="${slot}"]`)).toHaveCount(1);
  await expect(page.getByRole('slider')).toHaveCount(0);
  const pos=async(id='knight')=>{const p=(await page.locator('#game').getAttribute('data-logical-positions')).split(',').find(p=>p.startsWith(id+':')).split(':');return {x:Number(p[1]),y:Number(p[2])};};
  const point=async p=>{const b=await page.locator('#game canvas').boundingBox(),s=Math.min(b.width/960,b.height/576);return {x:b.x+(b.width-960*s)/2+p.x*32*s,y:b.y+(b.height-576*s)/2+p.y*32*s};};
  const click=async p=>{const q=await point(p);await page.mouse.click(q.x,q.y);};
  await page.locator('#start').click();await page.keyboard.press('Digit4');
  const aim=await point({x:8,y:8});await page.mouse.move(aim.x,aim.y);
  await expect(page.locator('#game')).toHaveAttribute('data-aim-tile','8:8:valid');
  await page.screenshot({path:resolve(output,`mvp2b3-${label}-aim.png`)});
  await page.mouse.click(aim.x,aim.y);await expect(page.locator('[data-rune="magic_wall"]')).toHaveAttribute('data-charges','7');
  // Destroy Field must not remove a wall or spend a charge trying.
  await page.waitForTimeout(1100);await page.keyboard.press('Digit7');await click({x:8,y:8});
  await expect(page.locator('#player-controls')).toHaveAttribute('data-last-command-result',/^(no-field|line-of-sight)$/);
  await expect(page.locator('#game')).toHaveAttribute('data-active-rune-tiles','1');
  await expect(page.locator('[data-rune="destroy_field"]')).toHaveAttribute('data-charges','12');
  await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#start').click();await page.keyboard.press('Digit5');await click({x:7,y:9});
  await expect(page.locator('[data-rune="fire_field"]')).toHaveAttribute('data-charges','11');
  await page.waitForTimeout(1100);await page.keyboard.press('Digit7');await click({x:7,y:9});
  await expect(page.locator('[data-rune="destroy_field"]')).toHaveAttribute('data-charges','11');
  await expect(page.locator('#game')).toHaveAttribute('data-active-rune-tiles','0');
  await page.waitForTimeout(1100);await page.keyboard.press('Digit6');await click(await pos('training-sparring'));
  await expect(page.locator('[data-rune="sudden_death"]')).toHaveAttribute('data-charges','11');
  await expect.poll(()=>{const used=events.find(e=>e.type==='rune_used'&&e.data?.runeId==='sudden_death');return !!used&&events.some(e=>['projectile_resolved','projectile_cancelled'].includes(e.type)&&e.data?.castId===used.data.castId);}).toBe(true);
  await page.locator('#card-druid').click();await expect(page.locator('#passives')).toContainText('Mana Buffer');
  await page.keyboard.press('Digit1');await expect(page.locator('#interaction-status')).toContainText('outro aliado');
  await click(await pos());await expect.poll(()=>events.some(e=>e.type==='cast'&&e.sourceId==='druid'&&e.targetId==='knight'&&e.data?.words==='exura sio')).toBe(true);
  await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#start').click();await page.locator('#card-druid').click();
  for(const key of ['Numpad3','Numpad3','Numpad6']){await page.keyboard.press(key);await page.waitForTimeout(500);}
  expect(await pos('druid')).toEqual({x:8,y:8});await page.locator('#card-knight').click();
  await page.keyboard.press('Digit8');await click({x:8,y:8});await click({x:9,y:8});
  await expect(page.locator('#game')).toHaveAttribute('data-pending-pushes','1');
  await page.locator('#pause').click();await page.waitForTimeout(1200);expect(await pos('druid')).toEqual({x:8,y:8});
  await page.locator('#pause').click();await expect.poll(()=>pos('druid')).toEqual({x:9,y:8});
  await expect(page.locator('#game')).toHaveAttribute('data-pending-pushes','0');
  const queuedPush=events.filter(e=>e.type==='push_queued').at(-1);expect(queuedPush).toBeTruthy();
  await expect.poll(async()=>Number(await page.locator('#game').getAttribute('data-logical-time'))).toBeGreaterThanOrEqual(queuedPush.time+2000);
  const from=await point({x:9,y:8}),to=await point({x:9,y:7});
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:5});
  const neighbours=JSON.parse(await page.locator('#game').getAttribute('data-push-destinations'));
  expect(neighbours).toHaveLength(8);expect(neighbours.filter(d=>d.ready)).toHaveLength(7);
  expect(await pos('druid')).toEqual({x:9,y:8});
  await page.screenshot({path:resolve(output,`mvp2b3-${label}-drag-neighbours.png`)});
  await page.mouse.up();
  await expect.poll(()=>pos('druid')).toEqual({x:9,y:7});
  await page.keyboard.press('Digit9');await expect(page.locator('#player-controls')).toHaveAttribute('data-last-intent','stop');
  await page.screenshot({path:resolve(output,`mvp2b3-${label}-kit.png`)});
  await page.locator('#restart').click();await expect(page.locator('#game')).toHaveAttribute('data-pending-pushes','0');
  expect(errors).toEqual([]);
  console.log(JSON.stringify({url:url.href,sha,errors,pushes:events.filter(e=>e.type==='push_resolved').length,runes:events.filter(e=>e.type==='rune_used').map(e=>e.data.runeId),game:await page.locator('#game').evaluate(el=>({...el.dataset}))}));
}finally{await browser.close();}
