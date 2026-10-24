import {test,expect,type Page} from '@playwright/test';
import {installControlledClock,pauseIdleClock} from './controlled-clock';
import {worldPoint,tilePoint} from './world-point';
async function boot(page:Page){
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await installControlledClock(page);await page.addInitScript(()=>{(window as any).teamEvents=[];window.addEventListener('hunt-event',e=>(window as any).teamEvents.push((e as CustomEvent).detail));});
  await page.goto('/?training=1');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');await pauseIdleClock(page);return errors;
}
async function clickActor(page:Page,id:string){
  const p=(await page.locator('#game').getAttribute('data-visual-positions'))!.split(',').find(p=>p.startsWith(id+':'))!.split(':').slice(1).map(Number);
  const screen=await worldPoint(page,p[0],p[1]);await page.mouse.click(screen.x,screen.y);
}
test('unified bottom dock, full viewport scenery and three pixel opponents fit desktop sizes',async({page})=>{
  const errors=await boot(page);
  await expect(page.locator('.rail-hint')).toHaveCount(0);await expect(page.locator('#player-controls #rune-kit')).toHaveCount(0);
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]){
    await page.setViewportSize(size);await page.clock.runFor(32);
    const dock=(await page.locator('.action-dock').boundingBox())!,world=(await page.locator('.world-stage').boundingBox())!,canvas=(await page.locator('#game canvas').boundingBox())!;
    expect(Math.abs(canvas.width-world.width)).toBeLessThanOrEqual(3);expect(Math.abs(canvas.height-world.height)).toBeLessThanOrEqual(3);
    await expect(page.locator('#game')).toHaveAttribute('data-view-columns','15');await expect(page.locator('#game')).toHaveAttribute('data-view-rows','11');
    const camera=JSON.parse((await page.locator('#game').getAttribute('data-camera'))!);expect(camera.width*camera.scale/15).toBeCloseTo(camera.height*camera.scale/11);
    let right=0;
    for(let i=1;i<=9;i++){const slot=page.locator(`[data-action-slot="${i}"]`);await expect(slot).toBeVisible();const r=(await slot.boundingBox())!;expect(r.y).toBeGreaterThanOrEqual(dock.y);expect(r.x).toBeGreaterThanOrEqual(right);right=r.x+r.width;expect(r.y+r.height).toBeLessThanOrEqual(size.height);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    await page.screenshot({path:`test-results/training-team-${size.width}.png`});
  }
  await page.locator('#start').click();await page.clock.runFor(500);
  expect(await page.evaluate(()=>(window as any).teamEvents.filter((e:any)=>e.type==='spawn'&&e.data?.entity?.trainingVocation).length)).toBe(3);
  await expect(page.locator('#game')).toHaveAttribute('data-unit-count','6');
  for(const id of ['training-sparring','training-vanguard','training-warden'])await expect(page.locator('#game')).toHaveAttribute('data-visible-unit-names',new RegExp(id));
  expect(errors).toEqual([]);
});
test('cards and world selection transfer only one controller; previous hero returns to Auto',async({page})=>{
  const errors=await boot(page);await page.locator('#start').click();await page.clock.runFor(250);
  await page.locator('[data-battle-target="training-sparring"]').click();await page.clock.runFor(250);
  await expect(page.locator('#card-knight')).toHaveAttribute('data-control-mode','MANUAL');
  for(const id of ['druid','sorcerer','knight']){
    await page.locator(`#card-${id}`).click();await page.clock.runFor(500);
    await expect(page.locator(`#card-${id}`)).toHaveAttribute('data-control-mode','MANUAL');
    for(const other of ['knight','druid','sorcerer'].filter(h=>h!==id))await expect(page.locator(`#card-${other}`)).toHaveAttribute('data-control-mode','AI');
    await expect(page.locator('#control-mode')).toBeHidden();await expect(page.locator('#manual-mode')).toContainText('aliados Auto');
    await expect(page.locator('#game')).toHaveAttribute('data-party-focus','training-sparring');
  }
  await clickActor(page,'druid');await page.clock.runFor(500);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-controlled-actor','druid');await expect(page.locator('#card-knight')).toHaveAttribute('data-control-mode','AI');
  await page.keyboard.press('Escape');await page.clock.runFor(500);await expect(page.locator('#game')).toHaveAttribute('data-party-focus','');
  await expect(page.locator('#card-druid')).toHaveAttribute('data-control-mode','MANUAL');await expect(page.locator('#card-sorcerer')).toHaveAttribute('data-control-mode','AI');
  expect(errors).toEqual([]);
});
test('camera reaches real map corners and resize cannot change logical bounds',async({page})=>{
  const errors=await boot(page);await page.locator('#start').click();await page.clock.runFor(250);
  const game=page.locator('#game'),w=Number(await game.getAttribute('data-arena-width')),h=Number(await game.getAttribute('data-arena-height'));
  await page.keyboard.down('Numpad8');await page.clock.runFor(3000);await page.keyboard.up('Numpad8');await page.keyboard.down('Numpad4');await page.clock.runFor(2500);await page.keyboard.up('Numpad4');await page.clock.runFor(250);
  await expect(game).toHaveAttribute('data-logical-positions',/knight:0:0(?:,|$)/);
  await page.keyboard.press('Digit4');const near=await tilePoint(page,1,0);await page.mouse.move(near.x,near.y);
  await expect(game).toHaveAttribute('data-aim-tile','1:0:valid');await page.mouse.click(near.x,near.y);await page.clock.runFor(500);
  await expect(page.locator('[data-rune="magic_wall"]')).toHaveAttribute('data-charges','7');
  await page.setViewportSize({width:1920,height:1080});await page.clock.runFor(32);await expect(game).toHaveAttribute('data-arena-width',String(w));await expect(game).toHaveAttribute('data-arena-height',String(h));
  const before=await page.locator('#player-controls').getAttribute('data-command-count');await page.locator('.tactical-rail header').click();expect(await page.locator('#player-controls').getAttribute('data-command-count')).toBe(before);
  // Far logical bounds are covered by domain tests; off-camera rails are not fake clickable tiles.
  await expect(game).toHaveAttribute('data-out-of-bounds','0');await expect(game).toHaveAttribute('data-logical-overlaps','0');expect(errors).toEqual([]);
});
test('three active opponents cast, use runes, heal and damage heroes; three wins preserve economic saves',async({page})=>{
  const errors=await boot(page);
  const saves=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>/progress|equipment|currency/.test(k)))));
  const before=await saves();
  for(let cycle=0;cycle<3;cycle++){
    if(cycle){await page.locator('#close-result').click();await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');}
    await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
    if(cycle===0){await page.clock.runFor(500);await page.screenshot({path:'test-results/training-team-active.png'});}
    for(let t=0;t<160&&(await page.locator('html').getAttribute('data-session-state'))!=='completed';t++){
      const targets=page.locator('[data-battle-target]');if(await targets.count())await targets.first().click();
      if(t%4===0){await page.keyboard.press('Digit2');await page.clock.runFor(64);await page.keyboard.press('Digit3');}
      await page.clock.runFor(250);
    }
    await expect(page.locator('#result-content')).toContainText('Treino concluído');expect(await saves()).toBe(before);
    for(const metric of ['logical-overlaps','out-of-bounds','reservation-count','active-projectiles','active-rune-tiles','rune-conditions','pending-pushes','residual-visual-objects'])await expect(page.locator('#game')).toHaveAttribute('data-'+metric,'0');
  }
  const actions=await page.evaluate(()=>(window as any).teamEvents.filter((e:any)=>e.sourceId?.startsWith('training-')));
  for(const id of ['training-sparring','training-vanguard','training-warden'])expect(actions.some((e:any)=>e.sourceId===id&&e.type==='damage')).toBe(true);
  expect(actions.some((e:any)=>e.type==='cast')).toBe(true);expect(actions.some((e:any)=>e.type==='rune_used')).toBe(true);expect(actions.some((e:any)=>e.type==='heal')).toBe(true);expect(errors).toEqual([]);
});
