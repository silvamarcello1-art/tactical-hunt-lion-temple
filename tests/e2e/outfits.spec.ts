import {test,expect} from '@playwright/test';
import {installControlledClock,pauseIdleClock,advanceUntilAttribute,REPEATED_HUNT_TIMEOUT_MS} from './controlled-clock';

test('atelier references, cumulative addons, palettes, DLC and per-hero persistence are honest',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?training=1');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#open-outfits').click();
  for(const id of ['citizen','warrior','mage','druid','assassin','hunter']){
    await page.locator(`[data-outfit="${id}"]`).click();
    for(const level of [0,1,2]){
      await page.locator(`[data-addon="${level}"]`).click();await expect(page.locator(`[data-addon="${level}"]`)).toHaveAttribute('aria-pressed','true');
    }
    await expect(page.locator('.outfit-addons p')).toContainText(' + ');
    await page.locator('[data-color-region="primary"]').selectOption('ember');await page.locator('[data-apply]').click();
    await expect(page.locator('#outfit-status')).toContainText('Arte pendente');
    await expect(page.locator('#outfit-preview')).toHaveAttribute('data-rendered-sprite','knight');
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tactical-hunt-appearance-v1')!).heroes.knight);
    expect(saved).toMatchObject({outfitId:id,addonLevel:2,colors:{primary:'ember'}});
  }
  await page.locator('[data-outfit="neymar"]').click();await page.locator('[data-addon="2"]').click();
  await page.locator('[data-variant="dlc"]').click();await page.locator('[data-apply]').click();
  await page.locator('[data-outfit-hero="druid"]').click();await page.locator('[data-outfit="mage"]').click();await page.locator('[data-apply]').click();
  await page.keyboard.press('Escape');await page.reload();await page.locator('#open-outfits').click();
  await expect(page.locator('[data-outfit="neymar"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-addon="2"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-variant="dlc"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-outfit-hero="druid"]').click();await expect(page.locator('[data-outfit="mage"]')).toHaveAttribute('aria-pressed','true');
  expect(errors).toEqual([]);
});

test('preview rotates real cardinal sprites, animates, does not send gameplay input and fits desktop',async({page})=>{
  await installControlledClock(page);await page.goto('/?training=1');await pauseIdleClock(page);
  await page.locator('#open-outfits').click();await page.locator('[data-outfit="citizen"]').click();
  for(const facing of ['east','north','west','south']){
    await page.locator('[data-rotate="1"]').click();await expect(page.locator('#outfit-preview')).toHaveAttribute('data-facing',facing);
  }
  await page.locator('[data-motion="walk"]').click();await page.clock.runFor(120);
  const frame=await page.locator('#outfit-preview').getAttribute('data-frame');await page.clock.runFor(120);
  expect(await page.locator('#outfit-preview').getAttribute('data-frame')).not.toBe(frame);
  const commands=await page.locator('#player-controls').getAttribute('data-command-count');
  await page.keyboard.press('w');await page.keyboard.press('1');
  expect(await page.locator('#player-controls').getAttribute('data-command-count')).toBe(commands);
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]){
    await page.setViewportSize(size);const box=await page.locator('#outfit-dialog').boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y+box!.height).toBeLessThanOrEqual(size.height);
  }
  await page.screenshot({path:'test-results/mvp2c-outfits-atelier.png'});
  await page.keyboard.press('Escape');await expect(page.locator('#outfit-dialog')).not.toBeVisible();
});

test('cosmetics apply during a paused combat without changing HP, mana, target, modes, position or clock; customized hunt wins',async({page})=>{
  test.setTimeout(REPEATED_HUNT_TIMEOUT_MS);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await installControlledClock(page);await page.goto('/');await pauseIdleClock(page);
  await page.locator('#loop-toggle').click();await page.locator('#start').click();await page.clock.runFor(1000);await page.locator('#pause').click();
  const targetPosition=(await page.locator('#game').getAttribute('data-logical-positions'))!.split(',').find(p=>p.startsWith('lion-1:'))!.split(':');
  const bounds=(await page.locator('#game canvas').boundingBox())!,scale=Math.min(bounds.width/960,bounds.height/576);
  await page.mouse.click(bounds.x+(bounds.width-960*scale)/2+Number(targetPosition[1])*32*scale,bounds.y+(bounds.height-576*scale)/2+Number(targetPosition[2])*32*scale);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-selected-target','lion-1');
  const state=()=>page.evaluate(()=>({party:document.querySelector('#party')!.textContent,game:document.querySelector<HTMLElement>('#game')!.dataset.logicalPositions,
    time:document.querySelector('html')!.getAttribute('data-processed-events'),mode:(document.querySelector('#control-mode') as HTMLSelectElement).value,
    selected:document.documentElement.dataset.selectedHero,commands:document.querySelector<HTMLElement>('#player-controls')!.dataset.commandCount,
    target:document.querySelector<HTMLElement>('#player-controls')!.dataset.selectedTarget,logicalTime:document.querySelector<HTMLElement>('#game')!.dataset.logicalTime,
    objects:document.querySelector<HTMLElement>('#game')!.dataset.displayObjectCount}));
  const before=await state();await page.locator('#open-outfits').click();
  for(const [hero,sprite] of [['knight','druid'],['druid','sorcerer'],['sorcerer','knight']]){
    await page.locator(`[data-outfit-hero="${hero}"]`).click();await page.locator(`[data-outfit="original-${sprite}"]`).click();await page.locator('[data-apply]').click();
  }
  expect(await state()).toEqual(before);
  await expect(page.locator('#game')).toHaveAttribute('data-appearance-sprites',JSON.stringify({knight:'druid',druid:'sorcerer',sorcerer:'knight'}));
  await page.keyboard.press('Escape');await page.locator('[data-speed="4"]').click();await page.locator('#pause').click();
  await advanceUntilAttribute(page,'data-session-state','completed');await page.clock.runFor(1500);
  await expect(page.locator('#result-content')).toContainText('Vitória');
  for(const attr of ['data-logical-overlaps','data-out-of-bounds','data-reservation-count','data-residual-visual-objects'])await expect(page.locator('#game')).toHaveAttribute(attr,'0');
  await page.screenshot({path:'test-results/mvp2c-customized-victory.png'});
  await page.locator('#close-result').click();await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await expect(page.locator('#game')).toHaveAttribute('data-appearance-sprites',JSON.stringify({knight:'druid',druid:'sorcerer',sorcerer:'knight'}));
  expect(errors).toEqual([]);
});

test('customized native sprite follows WASD/facing while keeping applied appearance',async({page})=>{
  await installControlledClock(page);await page.goto('/?training=1');await pauseIdleClock(page);
  await page.locator('#open-outfits').click();await page.locator('[data-outfit="original-druid"]').click();await page.locator('[data-apply]').click();await page.keyboard.press('Escape');
  await page.locator('#start').click();await page.clock.runFor(250);
  const before=await page.locator('#game').getAttribute('data-logical-positions');
  await page.locator('#game canvas').focus();await page.keyboard.down('a');await page.clock.runFor(750);await page.keyboard.up('a');await page.clock.runFor(250);
  expect(await page.locator('#game').getAttribute('data-logical-positions')).not.toBe(before);
  await expect(page.locator('#game')).toHaveAttribute('data-visual-facings',/knight:west/);
  await expect(page.locator('#game')).toHaveAttribute('data-appearance-sprites',/"knight":"druid"/);
  await page.locator('#open-outfits').click();await expect(page.locator('[data-outfit="original-druid"]')).toHaveAttribute('aria-pressed','true');
});
