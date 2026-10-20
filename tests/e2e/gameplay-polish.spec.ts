import {test,expect,type Page} from '@playwright/test';
import {installControlledClock,pauseIdleClock} from './controlled-clock';
import {isolatedCombatFixture} from './isolated-combat-fixture';
async function boot(page:Page) {
  await isolatedCombatFixture(page);
  await installControlledClock(page);
  await page.addInitScript(()=>{(window as any).polishEvents=[];(window as any).polishKeys=[];window.addEventListener('hunt-event',e=>(window as any).polishEvents.push((e as CustomEvent).detail));for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{const k=e as KeyboardEvent;(window as any).polishKeys.push({type,code:k.code,key:k.key,location:k.location,numLock:k.getModifierState('NumLock')});});});
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');await pauseIdleClock(page);
  await page.locator('#loop-toggle').click();
  for(const id of ['druid','sorcerer','knight']) {await page.locator(`#card-${id}`).click();await page.locator('#control-mode').selectOption('MANUAL');}
  await page.locator('#start').click();await page.clock.runFor(250);
}
async function position(page:Page,id:string) {
  const entry=(await page.locator('#game').getAttribute('data-logical-positions'))!.split(',').find(s=>s.startsWith(id+':'))!.split(':');return {x:Number(entry[1]),y:Number(entry[2])};
}
async function clickEntity(page:Page,id:string,button:'left'|'right'='left') {
  const p=await position(page,id),b=(await page.locator('#game canvas').boundingBox())!,s=Math.min(b.width/960,b.height/576);
  await page.mouse.click(b.x+(b.width-960*s)/2+p.x*32*s,b.y+(b.height-576*s)/2+p.y*32*s,{button});
}
test('shown keys execute each vocation; HUD focus, self heal, targeting ESC and inventory capture',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
  await page.locator('#card-druid').click();await clickEntity(page,'lion-3');
  await page.keyboard.press('Digit1');await page.clock.runFor(250);
  expect(await page.evaluate(()=>(window as any).polishEvents.find((e:any)=>e.type==='cast'&&e.sourceId==='druid')?.data.abilityId)).toBe('heal_friend');
  await expect(page.locator('[data-ability="heal_friend"] .skill-icon')).toHaveAttribute('data-icon-id','heal_friend');
  await page.keyboard.press('Digit1');await expect(page.locator('#interaction-status')).toContainText('recarga');
  await page.locator('#card-sorcerer').click();await clickEntity(page,'lion-3');await page.keyboard.press('Digit1');await page.clock.runFor(250);
  expect(await page.evaluate(()=>(window as any).polishEvents.find((e:any)=>e.type==='cast'&&e.sourceId==='sorcerer')?.data.abilityId)).toBe('flame_strike');
  await page.locator('#card-knight').click();await page.keyboard.press('Shift+Digit2');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-interaction-state','spell-targeting');
  const count=await page.locator('#player-controls').getAttribute('data-command-count');await page.keyboard.press('Escape');
  expect(await page.locator('#player-controls').getAttribute('data-command-count')).toBe(count);
  // Let a nearby mob enter the melee tile; the explicit slot remains the same.
  await page.clock.runFor(1250);await clickEntity(page,'lion-1');await page.keyboard.press('Digit2');await page.clock.runFor(500);
  expect(await page.evaluate(()=>(window as any).polishEvents.some((e:any)=>e.type==='cast'&&e.sourceId==='knight'&&e.data.abilityId==='berserk'))).toBe(true);
  await page.locator('#open-equipment').click();const before=await position(page,'knight');await page.keyboard.press('Numpad8');await page.clock.runFor(250);
  expect(await position(page,'knight')).toEqual(before);await page.keyboard.press('Escape');
  await expect(page.locator('#equipment-drawer')).toBeHidden();await page.keyboard.press('Numpad4');await page.clock.runFor(500);
  expect((await position(page,'knight')).x).toBe(before.x-1);expect(errors).toEqual([]);
});
test('physical numpad moves eight directions with digit/navigation key meanings and bounded hold',async({page})=>{
  // Isolate keyboard direction from enemy collision with a data-only spawn fixture.
  // The production engine, MovementSystem, walls and all enemies remain enabled.
  await page.route('**/src/data/config.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nHUNT_LAYOUT_CONFIG.partyPositions.knight={x:128,y:288};heroes[0].tileX=4;heroes[0].tileY=9;heroes[0].position={x:128,y:288};'});});
  await boot(page);const cdp=await page.context().newCDPSession(page);
  const pairs=[['Numpad7','Home',-1,-1],['Numpad8','ArrowUp',0,-1],['Numpad9','PageUp',1,-1],['Numpad4','ArrowLeft',-1,0],['Numpad6','ArrowRight',1,0],['Numpad1','End',-1,1],['Numpad2','ArrowDown',0,1],['Numpad3','PageDown',1,1]] as const;
  let first=true;
  for(const navigation of [false,true]) for(const [code,key,dx,dy] of pairs) {
    if(!first) {
      // Every direction gets the same free origin, not a tile just occupied by a mob.
      await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
      for(const id of ['druid','sorcerer','knight']) {await page.locator(`#card-${id}`).click();await page.locator('#control-mode').selectOption('MANUAL');}
      await page.locator('#start').click();await page.clock.runFor(250);
    }
    first=false;
    const before=await position(page,'knight');expect(before).toEqual({x:4,y:9});
    // Real browser input protocol: physical code retained when NumLock changes key.
    await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',code,key:navigation?key:code.slice(-1),location:3,isKeypad:true});
    await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',code,key:navigation?key:code.slice(-1),location:3,isKeypad:true});
    await page.clock.runFor(500);expect(await position(page,'knight'),JSON.stringify(await page.evaluate(()=>(window as any).polishKeys))).toEqual({x:before.x+dx,y:before.y+dy});
    await expect(page.locator('#player-controls')).toHaveAttribute('data-interaction-state','idle');
  }
  const before=await position(page,'knight');await page.keyboard.down('Numpad4');await page.clock.runFor(750);await page.keyboard.up('Numpad4');
  await page.keyboard.press('Numpad5');await page.clock.runFor(500);const stopped=await position(page,'knight');expect(stopped.x).toBeLessThan(before.x);
  await page.clock.runFor(1000);expect(await position(page,'knight')).toEqual(stopped);
  await expect(page.locator('#game')).toHaveAttribute('data-logical-overlaps','0');
});
test('assistance toggles are independent, persist without engagement, and movement keeps Assistido',async({page})=>{
  await boot(page);await page.locator('#card-sorcerer').click();await page.locator('#control-mode').selectOption('ASSISTED');
  const attack=page.locator('[data-assistance="autoAttack"]'),spells=page.locator('[data-assistance="autoSpells"]');
  for(const [a,s] of [[false,false],[true,false],[false,true],[true,true]]) {
    if(await attack.getAttribute('aria-pressed')!==String(a))await attack.click();if(await spells.getAttribute('aria-pressed')!==String(s))await spells.click();
    await expect(attack).toHaveText(`Auto Attack ${a?'ON':'OFF'}`);await expect(spells).toHaveText(`Auto Magias ${s?'ON':'OFF'}`);
    await page.clock.runFor(250);
    expect(await page.evaluate(()=>(window as any).polishEvents.filter((e:any)=>e.sourceId==='sorcerer'&&['cast','basic_attack','movement_started'].includes(e.type)).length)).toBe(0);
  }
  await page.keyboard.press('Numpad4');await page.clock.runFor(500);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-control-mode','ASSISTED');await expect(attack).toHaveAttribute('aria-pressed','true');
  await clickEntity(page,'lion-3','right');await page.clock.runFor(250);
  expect(await page.evaluate(()=>(window as any).polishEvents.some((e:any)=>e.sourceId==='sorcerer'&&e.type==='cast'))).toBe(true);
  await attack.click();await spells.click();await page.clock.runFor(250);
  const actions=await page.evaluate(()=>(window as any).polishEvents.filter((e:any)=>e.sourceId==='sorcerer'&&['cast','basic_attack'].includes(e.type)).length);
  await page.clock.runFor(500);expect(await page.evaluate(()=>(window as any).polishEvents.filter((e:any)=>e.sourceId==='sorcerer'&&['cast','basic_attack'].includes(e.type)).length)).toBe(actions);
  await page.locator('#card-druid').click();await expect(attack).toBeHidden();await page.locator('#control-mode').selectOption('ASSISTED');await expect(attack).toHaveAttribute('aria-pressed','true');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#card-sorcerer').click();await page.locator('#control-mode').selectOption('ASSISTED');await expect(attack).toHaveAttribute('aria-pressed','false');await expect(spells).toHaveAttribute('aria-pressed','false');
});
test('party stays outside arena and skills/passives fit three desktop viewports',async({page})=>{
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]) {
    await page.setViewportSize(size);
    const party=(await page.locator('#party').boundingBox())!,world=(await page.locator('.world-stage').boundingBox())!,dock=(await page.locator('.action-dock').boundingBox())!;
    expect(party.x+party.width).toBeLessThan(world.x);expect(dock.y+dock.height).toBeLessThanOrEqual(size.height);
    await expect(page.locator('#passives small')).toBeVisible();
    for(const id of ['knight','druid','sorcerer']) {
      const card=(await page.locator(`#card-${id}`).boundingBox())!;
      for(const bar of ['hp','mp']) {const bounds=(await page.locator(`#card-${id} .${bar}`).boundingBox())!;expect(bounds.width).toBeGreaterThan(130);expect(bounds.x+bounds.width).toBeLessThanOrEqual(card.x+card.width);}
    }
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  }
});

test('engaged assistance respects all four budgets and stops until a new explicit target',async({page})=>{
  await boot(page);
  const attack=page.locator('[data-assistance="autoAttack"]'),spells=page.locator('[data-assistance="autoSpells"]');
  let first=true;
  for(const [autoAttack,autoSpells] of [[false,false],[true,false],[false,true],[true,true]]) {
    if(!first) {
      await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
      for(const id of ['druid','sorcerer','knight']) {await page.locator(`#card-${id}`).click();await page.locator('#control-mode').selectOption('MANUAL');}
      await page.locator('#start').click();await page.clock.runFor(250);
    }
    first=false;
    await page.locator('#card-sorcerer').click();await page.locator('#control-mode').selectOption('ASSISTED');
    if(await attack.getAttribute('aria-pressed')!==String(autoAttack))await attack.click();
    if(await spells.getAttribute('aria-pressed')!==String(autoSpells))await spells.click();
    const before=await position(page,'sorcerer'),index=await page.evaluate(()=>(window as any).polishEvents.length);
    await clickEntity(page,'lion-3','right');await page.clock.runFor(250);
    const events=await page.evaluate((i)=>(window as any).polishEvents.slice(i).filter((e:any)=>e.sourceId==='sorcerer'),index);
    const actions=events.filter((e:any)=>['cast','basic_attack'].includes(e.type));
    if(!autoAttack&&!autoSpells)expect(actions).toHaveLength(0);
    else expect(actions.length).toBeGreaterThan(0);
    // The closed playback interval may include both boundary decisions.
    // Budget is per logical timestamp, never per browser clock.runFor call.
    for(const time of new Set(actions.map((e:any)=>e.time)))expect(actions.filter((e:any)=>e.time===time)).toHaveLength(1);
    if(!autoAttack)expect(actions.some((e:any)=>e.type==='basic_attack')).toBe(false);
    if(!autoSpells)expect(actions.some((e:any)=>e.type==='cast')).toBe(false);
    expect(actions[0]?.type).toBe(autoSpells?'cast':autoAttack?'basic_attack':undefined);
    expect(events.some((e:any)=>e.type==='movement_started')).toBe(false);
    expect(await position(page,'sorcerer')).toEqual(before);
  }
  for(let t=0;t<20000;t+=250) {
    if(await page.evaluate(()=>(window as any).polishEvents.some((e:any)=>e.type==='death'&&e.targetId==='lion-3')))break;
    await page.clock.runFor(250);
  }
  expect(await page.evaluate(()=>(window as any).polishEvents.some((e:any)=>e.type==='death'&&e.targetId==='lion-3'))).toBe(true);
  const index=await page.evaluate(()=>(window as any).polishEvents.length);
  await page.clock.runFor(2000);
  expect(await page.evaluate(i=>(window as any).polishEvents.slice(i).filter((e:any)=>e.sourceId==='sorcerer'&&['cast','basic_attack','movement_started'].includes(e.type)),index)).toEqual([]);
  await clickEntity(page,'lion-1','right');await page.clock.runFor(250);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-last-command-result','ok');
  expect(await page.evaluate(i=>(window as any).polishEvents.slice(i).some((e:any)=>e.sourceId==='sorcerer'&&['cast','basic_attack'].includes(e.type)),index)).toBe(true);
});
