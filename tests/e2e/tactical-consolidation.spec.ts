import {test,expect,type Page} from '@playwright/test';
import {installControlledClock,pauseIdleClock,advanceUntilAttribute} from './controlled-clock';
import {tilePoint} from './world-point';
async function pos(page:Page,id:string){const entry=(await page.locator('#game').getAttribute('data-logical-positions'))!.split(',').find(p=>p.startsWith(id+':'))!.split(':');return{x:Number(entry[1]),y:Number(entry[2])};}
async function drag(page:Page,id:string,to:{x:number;y:number}){const p=await pos(page,id),from=await tilePoint(page,p.x,p.y),dest=await tilePoint(page,to.x,to.y);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(dest.x,dest.y,{steps:8});await page.mouse.up();}
test('new cast cancels an unreleased drag; real target death does not cancel unrelated held movement',async({page})=>{
  // Data-only adapter edge fixture: retain the production control profile and
  // three real bots, but make one nearby enemy die from a real companion attack.
  // This fixture is NOT used to prove three wins or the production boss flow.
  await page.route('**/src/data/training.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nObject.assign(trainingTeamFloors[0][0],{hp:1,maxHp:1,tileX:9,tileY:9,position:{x:288,y:288}});'});});
  await installControlledClock(page);await page.addInitScript(()=>{(window as any).gestureEvents=[];window.addEventListener('hunt-event',e=>(window as any).gestureEvents.push((e as CustomEvent).detail));});
  await page.goto('/?training=1');await pauseIdleClock(page);await page.locator('#start').click();await page.clock.runFor(250);
  const target=await pos(page,'sorcerer'),from=await tilePoint(page,target.x,target.y),to=await tilePoint(page,target.x-1,target.y);
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.keyboard.press('Digit2');await page.mouse.up();await page.clock.runFor(500);
  await expect(page.locator('#game')).toHaveAttribute('data-pending-pushes','0');await expect(page.locator('#game')).toHaveAttribute('data-push-destinations','');
  expect(await page.evaluate(()=>(window as any).gestureEvents.some((e:any)=>e.type==='push_queued'))).toBe(false);
  await page.keyboard.press('Escape');await page.locator('[data-battle-target="training-sparring"]').click();await page.keyboard.down('ArrowUp');await page.clock.runFor(1000);
  expect(await page.evaluate(()=>(window as any).gestureEvents.some((e:any)=>e.type==='death'&&e.targetId==='training-sparring'))).toBe(true);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-held-keys','1');await page.keyboard.up('ArrowUp');await page.clock.runFor(500);
  const released=await pos(page,'knight');await page.clock.runFor(500);expect(await pos(page,'knight')).toEqual(released);
  await expect(page.locator('#game')).toHaveAttribute('data-logical-overlaps','0');await expect(page.locator('#game')).toHaveAttribute('data-reservation-count','0');
});
test('production focus/takeover → distant drag approach/push → cast and movement cancellation → equivalent Hunt and boss',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await installControlledClock(page);await page.addInitScript(()=>{(window as any).tacticalEvents=[];window.addEventListener('hunt-event',e=>(window as any).tacticalEvents.push((e as CustomEvent).detail));});
  await page.goto('/?training=1');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');await pauseIdleClock(page);
  await page.locator('#start').click();await page.clock.runFor(250);
  await page.locator('[data-battle-target="training-sparring"]').click();await page.clock.runFor(250);
  await page.locator('#card-druid').click();await page.clock.runFor(250);
  await expect(page.locator('#game')).toHaveAttribute('data-party-focus','training-sparring');await expect(page.locator('#card-knight')).toHaveAttribute('data-control-mode','AI');await expect(page.locator('#card-druid')).toHaveAttribute('data-control-mode','MANUAL');
  await page.keyboard.press('Escape');await page.clock.runFor(500);await page.locator('#card-knight').click();await page.clock.runFor(250);
  const original=await pos(page,'sorcerer'),destination={x:original.x-1,y:original.y};
  await drag(page,'sorcerer',destination);await page.clock.runFor(250);
  await expect(page.locator('#game')).toHaveAttribute('data-pending-approaches','1');expect(await pos(page,'sorcerer')).toEqual(original);
  await page.clock.runFor(3000);expect(await pos(page,'sorcerer')).toEqual(destination);
  expect(await page.evaluate(()=>(window as any).tacticalEvents.filter((e:any)=>e.type==='push_resolved').length)).toBe(1);
  for(const cancel of ['cast','move']){
    // Walk away first; a push from farther away remains an explicit manual order.
    await page.keyboard.down('Numpad8');await page.clock.runFor(1000);await page.keyboard.up('Numpad8');await page.clock.runFor(250);
    const target=await pos(page,'sorcerer');await page.keyboard.press('Digit8');
    const select=await tilePoint(page,target.x,target.y);await page.mouse.click(select.x,select.y);const to=await tilePoint(page,target.x-1,target.y);await page.mouse.click(to.x,to.y);await page.clock.runFor(250);
    if(cancel==='cast')await page.keyboard.press('Digit2');else await page.keyboard.press('Numpad6');
    await page.clock.runFor(500);await expect(page.locator('#game')).toHaveAttribute('data-pending-approaches','0');await page.keyboard.press('Escape');await page.clock.runFor(2000);
    expect(await page.evaluate(()=>(window as any).tacticalEvents.filter((e:any)=>e.type==='push_resolved').length)).toBe(1);
  }
  await page.screenshot({path:'test-results/tactical-training.png'});
  await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#training-link').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await expect(page.locator('#game')).toHaveAttribute('data-view-columns','15');await expect(page.locator('#game')).toHaveAttribute('data-view-rows','11');await expect(page.locator('#control-mode')).toBeVisible();
  await page.locator('#loop-toggle').click();await page.locator('[data-speed="4"]').click();await page.locator('#start').click();await advanceUntilAttribute(page,'data-session-state','completed');
  await expect(page.locator('#result-content')).toContainText('Vitória no templo');await expect(page.locator('#result-content')).toContainText('4.240');await expect(page.locator('#result-content')).toContainText('Monstros derrotados: 19');
  for(const metric of ['logical-overlaps','out-of-bounds','reservation-count','pending-pushes','active-projectiles','active-telegraphs','residual-visual-objects'])await expect(page.locator('#game')).toHaveAttribute(`data-${metric}`,'0');expect(errors).toEqual([]);
});
