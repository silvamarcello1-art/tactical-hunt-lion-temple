import {test,expect,type Page} from '@playwright/test';
import {installControlledClock,pauseIdleClock} from './controlled-clock';
async function pos(page:Page,id='knight'){
  const entry=(await page.locator('#game').getAttribute('data-logical-positions'))!.split(',').find(s=>s.startsWith(id+':'))!.split(':');
  return {x:Number(entry[1]),y:Number(entry[2])};
}
async function tile(page:Page,p:{x:number;y:number}){
  const b=(await page.locator('#game canvas').boundingBox())!,s=Math.min(b.width/960,b.height/576);
  await page.mouse.click(b.x+(b.width-960*s)/2+p.x*32*s,b.y+(b.height-576*s)/2+p.y*32*s);
}
async function boot(page:Page){
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await installControlledClock(page);await page.addInitScript(()=>{(window as any).runeEvents=[];window.addEventListener('hunt-event',e=>(window as any).runeEvents.push((e as CustomEvent).detail));});
  await page.goto('/?training=1');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');await pauseIdleClock(page);
  return errors;
}
test('local training: ground hotkeys, real wall collision, field burn, pause, expiry and reset',async({page})=>{
  const errors=await boot(page);
  await expect(page.locator('#loop-toggle')).toBeDisabled();await expect(page.locator('#control-mode')).toHaveValue('MANUAL');
  await page.locator('#start').click();await page.clock.runFor(250);
  await page.keyboard.press('Digit4');await expect(page.locator('#player-controls')).toHaveAttribute('data-interaction-state','rune-targeting');
  const count=await page.locator('#player-controls').getAttribute('data-command-count');await page.keyboard.press('Escape');
  expect(await page.locator('#player-controls').getAttribute('data-command-count')).toBe(count);
  await page.keyboard.press('Digit4');await tile(page,{x:7,y:9});await page.clock.runFor(500);
  await expect(page.locator('#game')).toHaveAttribute('data-active-rune-tiles','1');await expect(page.locator('[data-rune="magic_wall"]')).toHaveAttribute('data-charges','7');
  await page.keyboard.press('Numpad4');await page.clock.runFor(500);expect(await pos(page)).toEqual({x:8,y:9});
  await page.keyboard.press('Numpad7');await page.clock.runFor(500);expect(await pos(page)).toEqual({x:8,y:9});
  await page.clock.runFor(1250);await page.keyboard.press('Digit5');await tile(page,await pos(page,'training-sparring'));await page.clock.runFor(1500);
  expect(await page.evaluate(()=>(window as any).runeEvents.some((e:any)=>e.type==='damage'&&e.data?.element==='fire'&&e.data?.castId?.startsWith('rune-')))).toBe(true);
  await expect(page.locator('[data-rune="fire_field"]')).toHaveAttribute('data-charges','11');
  await page.screenshot({path:'test-results/training-runes-gameplay.png'});
  await page.locator('#pause').click();const before=await page.locator('#game').getAttribute('data-logical-time');await page.clock.runFor(2500);
  expect(await page.locator('#game').getAttribute('data-logical-time')).toBe(before);await expect(page.locator('#game')).toHaveAttribute('data-active-rune-tiles','2');
  await page.locator('#pause').click();await page.locator('[data-speed="4"]').click();await page.clock.runFor(6000);
  await expect(page.locator('#game')).toHaveAttribute('data-active-rune-tiles','0');await expect(page.locator('#game')).toHaveAttribute('data-rune-conditions','0');
  await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await expect(page.locator('[data-rune="magic_wall"]')).toHaveAttribute('data-charges','8');await expect(page.locator('#game')).toHaveAttribute('data-active-rune-tiles','0');
  expect(errors).toEqual([]);
});
test('training win grants no real XP, drops, gold or Boss Tokens and leaves economic saves intact',async({page})=>{
  const errors=await boot(page);
  const save=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>/progress|equipment|currency/.test(k)))));
  const before=await save();
  for(let cycle=0;cycle<3;cycle++){
  if(cycle){await page.locator('#close-result').click();await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');}
  for(const id of ['druid','sorcerer','knight']){await page.locator(`#card-${id}`).click();await page.locator('#control-mode').selectOption('AI');}
  await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
  for(let i=0;i<35&&(await page.locator('html').getAttribute('data-session-state'))!=='completed';i++)await page.clock.runFor(1000);
  await expect(page.locator('#result-content')).toContainText('Treino concluído');expect(await save()).toBe(before);
  expect(await page.evaluate(()=>(window as any).runeEvents.some((e:any)=>['equipment_drop','hero_experience','boss_reward','loot','experience'].includes(e.type)))).toBe(false);
  for(const metric of ['active-rune-tiles','rune-conditions','reservation-count','active-projectiles','logical-overlaps','out-of-bounds'])await expect(page.locator('#game')).toHaveAttribute('data-'+metric,'0');
  await expect(page.locator('#game canvas')).toHaveCount(1);await expect(page.locator('#game')).toHaveAttribute('data-unit-count','3');
  }
  expect(errors).toEqual([]);
});
test('training kit fits desktop layouts and normal hunts keep three real slots without runes',async({page})=>{
  await boot(page);
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]){
    await page.setViewportSize(size);await expect(page.locator('#rune-kit')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    const dock=(await page.locator('.action-dock').boundingBox())!;expect(dock.y+dock.height).toBeLessThanOrEqual(size.height+1);
  }
  await page.locator('#training-link').click();await expect(page.locator('html')).toHaveAttribute('data-scenario','hunt');
  await expect(page.locator('#rune-kit')).toBeHidden();await expect(page.locator('[data-ability]')).toHaveCount(3);
});
