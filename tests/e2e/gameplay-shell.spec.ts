import { expect, test, type Page } from '@playwright/test';

const position=async(page:Page,id:string)=>{
  const entry=(await page.locator('#game').getAttribute('data-logical-positions'))?.split(',').find(s=>s.startsWith(id+':'));
  const [,x,y]=entry?.split(':')??[];return{x:Number(x),y:Number(y)};
};
const clickEntity=async(page:Page,id:string,button:'left'|'right'='left')=>{
  const p=await position(page,id);const b=(await page.locator('#game canvas').boundingBox())!;
  const scale=Math.min(b.width/960,b.height/576);
  await page.mouse.click(b.x+(b.width-960*scale)/2+p.x*32*scale,b.y+(b.height-576*scale)/2+p.y*32*scale,{button});
};
test('compact slots follow selected hero; WASD and hotkeys submit real commands',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{(window as any).__events=[];window.addEventListener('hunt-event',e=>(window as any).__events.push((e as CustomEvent).detail));});
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#loop-toggle').click();await page.locator('#card-druid').click();
  await expect(page.locator('#action-bar [data-hero="druid"]')).toHaveCount(3);
  await expect(page.locator('#ability-modal')).toBeHidden();
  const rail=await page.locator('#party').boundingBox();
  await page.locator('#start').click();await page.keyboard.press('a');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-control-mode','MANUAL');
  await expect(page.locator('#card-knight')).toHaveAttribute('data-control-mode','AI');
  expect(await page.locator('#party').boundingBox()).toEqual(rail);
  await clickEntity(page,'lion-3');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-selected-target','lion-3');
  await expect(page.locator('[data-ability="heal_friend"]')).not.toHaveAttribute('data-unavailable-reason','invalid-target');
  await page.keyboard.press('1');
  await expect.poll(()=>page.evaluate(()=>(window as any).__events.some((e:any)=>e.type==='cast'&&e.sourceId==='druid'&&e.data.abilityId==='heal_friend'))).toBe(true);
  await page.locator('#pause').click();
  const cooldown=await page.locator('[data-ability="heal_friend"]').getAttribute('data-cooldown-remaining');
  await page.waitForTimeout(350);
  await expect(page.locator('[data-ability="heal_friend"]')).toHaveAttribute('data-cooldown-remaining',cooldown!);
  await page.locator('#card-knight').click();
  await expect(page.locator('#action-bar [data-hero="knight"]')).toHaveCount(3);
  await page.locator('#card-sorcerer').click();
  await expect(page.locator('#action-bar [data-hero="sorcerer"]')).toHaveCount(3);
  await expect(page.locator('#player-controls')).toHaveAttribute('data-control-mode','AI');
  expect(await page.locator('#player-attack,#player-follow,#player-stop').count()).toBe(0);
  await expect(page.locator('#game')).toHaveAttribute('data-max-visual-sync-error','0');
  expect(errors).toEqual([]);
});

test('Auto completes three evolving hunts, unlocks passives and persists progression',async({page})=>{
  test.setTimeout(180_000);
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
  await expect.poll(()=>page.locator('html').getAttribute('data-completed-cycles'),{timeout:150_000}).toBe('3');
  await page.locator('#loop-toggle').click();
  await expect(page.locator('#stage-label')).toHaveText('Hunt concluída');
  await expect(page.locator('#passive-state')).toHaveText('ATIVA');
  const level=await page.locator('#card-knight .hero-level').textContent();
  expect(level).not.toBe('Lv. 1');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await expect(page.locator('#card-knight .hero-level')).toHaveText(level!);
  await expect(page.locator('#game')).toHaveAttribute('data-visual-footprint',/logical:32/);
});
