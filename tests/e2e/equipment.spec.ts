import {test,expect} from '@playwright/test';
import {installControlledClock,pauseIdleClock,advanceUntilAttribute,REPEATED_HUNT_TIMEOUT_MS} from './controlled-clock';

test('real hunt → drop → compare → equip → forge → reload → equipped combat',async({page})=>{
  test.setTimeout(REPEATED_HUNT_TIMEOUT_MS);
  await installControlledClock(page);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await pauseIdleClock(page);
  await page.locator('#loop-toggle').click();await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
  await advanceUntilAttribute(page,'data-session-state','completed');
  await expect(page.locator('#result-content')).toContainText('Vitória');
  await expect(page.locator('[data-reward-item]')).not.toHaveCount(0);
  await page.locator('#close-result').click();await page.locator('#open-equipment').click();
  const before=Number(await page.locator('[data-stat="attack"]').textContent());
  const weapon=page.locator('[data-definition="iron-edge"], [data-definition="ward-hammer"]').first();
  const id=await weapon.getAttribute('data-item-id');await weapon.click();
  await expect(page.locator('#item-comparison')).toContainText('Atual: Sem item');
  await page.locator('[data-action="equip"]').click();
  const equipped=Number(await page.locator('[data-stat="attack"]').textContent());expect(equipped).toBeGreaterThan(before);
  const goldBefore=Number((await page.locator('#inventory-gold').textContent())!.split(' ')[0]);
  await page.locator('[data-action="forge"]').click();
  await expect(page.locator('[data-action="forge"]')).toBeDisabled();
  await expect(page.locator('#inventory-gold')).toHaveText(`${goldBefore-200} ouro`);
  await expect(page.locator('#item-comparison h3').first()).toContainText('+1');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tactical-hunt-equipment-v2')!));
  expect(saved.items.find((item:any)=>item.id===id).upgrade).toBe(1);
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#loop-toggle').click();await page.locator('#open-equipment').click();
  await expect(page.locator('#inventory-gold')).toHaveText(`${goldBefore-200} ouro`);
  await expect(page.locator('.equipment-slots')).toContainText('+1');
  const attack=Number(await page.locator('[data-stat="attack"]').textContent());expect(attack).toBeGreaterThan(before);
  await page.locator('[data-equipment-hero="druid"]').click();await expect(page.locator('#equipment-content h2')).toHaveText('Equipamento · Lyra');
  await page.locator(`[data-item-id="${id}"]`).click();await expect(page.locator('[data-action="equip"]')).toBeDisabled();
  await page.locator('#close-equipment').click();await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
  await page.clock.runFor(500);await page.locator('#open-equipment').click();
  await expect(page.locator('.equipment-policy')).toContainText('Somente consulta');
  const mode=await page.locator('#player-controls').getAttribute('data-control-mode');
  await page.keyboard.press('d');await page.clock.runFor(250);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-control-mode',mode!);
  await page.keyboard.press('Escape');await expect(page.locator('#equipment-drawer')).toBeHidden();
  await advanceUntilAttribute(page,'data-session-state','completed');
  await page.clock.runFor(1500);
  for(const attr of ['data-logical-overlaps','data-out-of-bounds','data-reservation-count','data-residual-visual-objects']) await expect(page.locator('#game')).toHaveAttribute(attr,'0');
  console.log('MVP2B presentation sample',await page.locator('#game').evaluate(el=>Object.fromEntries(Array.from(el.attributes).filter(a=>/presentation-update|display-object-count|active-spell|max-visual-sync/.test(a.name)).map(a=>[a.name,a.value]))));
  expect(errors).toEqual([]);
});

test('inventory panels keep three desktop viewports readable and capture clicks',async({page})=>{
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]) {
    await page.setViewportSize(size);await page.locator('#open-equipment').click();
    await expect(page.locator('#equipment-drawer')).toBeVisible();
    await page.locator('[data-equipment-hero="sorcerer"]').click();
    await expect(page.locator('#equipment-content h2')).toHaveText('Equipamento · Orin');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('#close-equipment').click();
  }
});

test('pending rewards survive a canceled unload and can be retried',async({page})=>{
  await installControlledClock(page);
  await page.addInitScript(()=>{
    const write=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='tactical-hunt-equipment-v2' && document.documentElement.dataset.testQuota==='on') throw new DOMException('Quota test','QuotaExceededError');
      return write.call(this,key,value);
    };
  });
  await page.goto('/');await pauseIdleClock(page);
  await page.evaluate(()=>{document.documentElement.dataset.testQuota='on';});
  await page.locator('#loop-toggle').click();await page.locator('#start').click();
  await page.locator('#open-equipment').click();
  for(let elapsed=0;elapsed<20000;elapsed+=250) {
    if((await page.locator('.equipment-warning').textContent())?.includes('Não foi possível salvar')) break;
    await page.clock.runFor(250);
  }
  await page.locator('#pause').click();
  await expect(page.locator('.equipment-warning')).toContainText('Não foi possível salvar');
  const blocked=await page.evaluate(()=>{
    const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(blocked).toBe(true);
  await expect(page.locator('#game canvas')).toHaveCount(1);
  await page.evaluate(()=>{document.documentElement.dataset.testQuota='off';});
  await page.locator('[data-action="retry"]').click();
  await expect(page.locator('.equipment-warning')).toHaveText('Recompensas salvas.');
  expect(Number((await page.locator('#inventory-gold').textContent())!.split(' ')[0])).toBeGreaterThan(0);
  await page.locator('#close-equipment').click();await page.locator('#pause').click();
  await page.clock.runFor(1000);
  await expect(page.locator('html')).toHaveAttribute('data-session-state','running');
});
