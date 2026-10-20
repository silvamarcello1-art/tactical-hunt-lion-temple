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
async function point(page:Page,p:{x:number;y:number}){
  const b=(await page.locator('#game canvas').boundingBox())!,s=Math.min(b.width/960,b.height/576);
  return {x:b.x+(b.width-960*s)/2+p.x*32*s,y:b.y+(b.height-576*s)/2+p.y*32*s};
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

test('nine real actions, larger original pixel sprites and tile aim ignore tall sprite picking',async({page})=>{
  const errors=await boot(page);
  for(const slot of ['1','2','3','4','5','6','7','8','9'])await expect(page.locator(`[data-action-slot="${slot}"]`)).toHaveCount(1);
  await expect(page.getByRole('slider')).toHaveCount(0);
  await page.locator('#start').click();await page.clock.runFor(250);
  await page.keyboard.press('Digit4');const p=await point(page,{x:8,y:8});await page.mouse.move(p.x,p.y);
  await expect(page.locator('#game')).toHaveAttribute('data-aim-tile','8:8:valid');
  await page.mouse.click(p.x,p.y);await page.clock.runFor(500);
  expect(await page.evaluate(()=>(window as any).runeEvents.some((e:any)=>e.type==='rune_placed'&&e.data.tile.x===8&&e.data.tile.y===8))).toBe(true);
  await expect(page.locator('#game')).toHaveAttribute('data-aim-tile','');
  await page.keyboard.press('Digit8');await expect(page.locator('#player-controls')).toHaveAttribute('data-interaction-state','push-targeting');
  await page.keyboard.press('Escape');await page.keyboard.press('Digit9');await page.clock.runFor(250);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-last-intent','stop');
  await page.screenshot({path:'test-results/training-pixel-tile-aim.png'});expect(errors).toEqual([]);
});

test('SD uses the real projectile lifecycle and Destroy Field removes a field, never a wall',async({page})=>{
  const errors=await boot(page);await page.locator('#start').click();await page.clock.runFor(500);
  await page.keyboard.press('Digit6');await tile(page,{x:7,y:9});await page.clock.runFor(250);
  await expect(page.locator('[data-rune="sudden_death"]')).toHaveAttribute('data-charges','12');
  await page.keyboard.press('Digit5');await tile(page,{x:7,y:9});await page.clock.runFor(1500);
  await page.keyboard.press('Digit7');await tile(page,{x:7,y:9});await page.clock.runFor(500);
  await expect(page.locator('[data-rune="destroy_field"]')).toHaveAttribute('data-charges','11');
  await expect(page.locator('#game')).toHaveAttribute('data-active-rune-tiles','0');
  await page.clock.runFor(1500);await page.keyboard.press('Digit6');
  const bot=await pos(page,'training-sparring'),head=await point(page,{x:bot.x,y:bot.y-.75});await page.mouse.move(head.x,head.y);
  await expect(page.locator('#game')).toHaveAttribute('data-aim-tile',`${bot.x}:${bot.y}:valid`);
  await page.mouse.click(head.x,head.y);await page.clock.runFor(1000);
  await expect(page.locator('[data-rune="sudden_death"]')).toHaveAttribute('data-charges','11');
  expect(await page.evaluate(()=>{const es=(window as any).runeEvents,cast=es.find((e:any)=>e.type==='rune_used'&&e.data?.runeId==='sudden_death');return !!cast&&es.some((e:any)=>e.type==='projectile'&&e.data?.castId===cast.data.castId)&&es.some((e:any)=>['projectile_resolved','projectile_cancelled'].includes(e.type)&&e.data?.castId===cast.data.castId);})).toBe(true);
  expect(errors).toEqual([]);
});

test('push targeting and drag use delayed revalidated grid steps, pause and reset clean pending work',async({page})=>{
  const errors=await boot(page);await page.locator('#start').click();await page.clock.runFor(250);
  await page.locator('#card-druid').click();
  for(const key of ['Numpad3','Numpad3','Numpad6']){await page.keyboard.press(key);await page.clock.runFor(500);}
  expect(await pos(page,'druid')).toEqual({x:8,y:8});await page.locator('#card-knight').click();
  await page.keyboard.press('Digit8');await tile(page,{x:8,y:8});await tile(page,{x:9,y:8});await page.clock.runFor(250);
  await expect(page.locator('#game')).toHaveAttribute('data-pending-pushes','1');
  await page.locator('#pause').click();await page.clock.runFor(2000);expect(await pos(page,'druid')).toEqual({x:8,y:8});
  await page.locator('#pause').click();await page.clock.runFor(1500);expect(await pos(page,'druid')).toEqual({x:9,y:8});
  await expect(page.locator('#game')).toHaveAttribute('data-pending-pushes','0');await page.clock.runFor(500);
  const from=await point(page,{x:9,y:8}),to=await point(page,{x:9,y:7});
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:6});
  const options=JSON.parse((await page.locator('#game').getAttribute('data-push-destinations'))!);
  expect(options).toHaveLength(8);expect(options.filter((o:{ready:boolean})=>o.ready)).toHaveLength(7);
  await expect(page.locator('#game')).toHaveAttribute('data-aim-tile','9:7:valid');
  expect(await pos(page,'druid')).toEqual({x:9,y:8}); // Holding never teleports the creature.
  await page.clock.runFor(32); // Render the new Graphics before capturing the held gesture.
  await expect(page.locator('#game')).toHaveAttribute('data-telegraph-layer-count','2');
  await page.screenshot({path:'test-results/training-push-neighbours.png'});
  await page.mouse.up();await page.clock.runFor(1500);
  expect(await pos(page,'druid')).toEqual({x:9,y:7});
  expect(await page.evaluate(()=>(window as any).runeEvents.filter((e:any)=>e.type==='push_resolved').length)).toBe(2);
  await expect(page.locator('#game')).toHaveAttribute('data-push-destinations','');
  await page.locator('#restart').click();await expect(page.locator('#game')).toHaveAttribute('data-pending-pushes','0');
  for(const metric of ['reservation-count','logical-overlaps','out-of-bounds'])await expect(page.locator('#game')).toHaveAttribute('data-'+metric,'0');expect(errors).toEqual([]);
});

test('training Druid uses real ice identity and Heal Friend requires another ally',async({page})=>{
  const errors=await boot(page);await page.locator('#card-druid').click();
  await expect(page.locator('[data-ability="strong_ice_wave"]')).toHaveAttribute('aria-label','Strong Ice Wave');
  await expect(page.locator('[data-ability="strong_ice_wave"] .skill-icon')).toHaveAttribute('style',/training-strong_ice_wave/);
  await expect(page.locator('#passives')).toContainText('Mana Buffer');
  await page.locator('#start').click();await page.clock.runFor(250);await page.keyboard.press('Digit1');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-interaction-state','spell-targeting');
  await expect(page.locator('#interaction-status')).toContainText('outro aliado');
  await tile(page,await pos(page,'knight'));await page.clock.runFor(500);
  expect(await page.evaluate(()=>(window as any).runeEvents.some((e:any)=>e.type==='cast'&&e.sourceId==='druid'&&e.targetId==='knight'&&e.data.words==='exura sio'))).toBe(true);
  await expect(page.locator('#card-druid')).toHaveClass(/selected/);expect(errors).toEqual([]);
});
