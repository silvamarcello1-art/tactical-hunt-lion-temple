import { expect, test, type Page } from '@playwright/test';

async function position(page:Page,id = 'knight') {
  const value = await page.locator('#game').getAttribute('data-logical-positions');
  const entry = value?.split(',').find(value => value.startsWith(`${id}:`));
  const [,x,y] = entry?.split(':') ?? [];
  return {x:Number(x),y:Number(y)};
}
async function clickTile(page:Page,tile:{x:number;y:number},button:'left'|'right' = 'left') {
  const bounds = (await page.locator('#game canvas').boundingBox())!;
  await page.mouse.click(bounds.x + tile.x*32*bounds.width/960,bounds.y + tile.y*32*bounds.height/576,{button});
}
async function open(page:Page) {
  const errors:string[] = [];
  page.on('pageerror',error => errors.push(error.message));
  page.on('console',message => {if(message.type() === 'error') errors.push(message.text());});
  await page.addInitScript(() => {
    (window as any).__controlEvents = [];
    window.addEventListener('hunt-event',(event) => (window as any).__controlEvents.push((event as CustomEvent).detail));
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#loop-toggle').click();
  await page.locator('#control-mode').selectOption('MANUAL');
  await page.locator('#start').click();
  await expect.poll(() => position(page)).toEqual({x:8,y:9});
  return errors;
}

test('WASD, arrows, focus loss, pause and Auto takeover preserve the live hunt', async ({page}) => {
  const errors = await open(page);
  await page.keyboard.down('a');
  await expect.poll(async () => (await position(page)).x).toBeLessThan(7);
  await page.keyboard.up('a');
  await page.locator('#player-stop').click();
  await page.waitForTimeout(350);
  const west = await position(page);
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await position(page)).y).toBeLessThan(west.y);
  await page.keyboard.up('ArrowUp');
  await page.locator('#player-stop').click();
  await page.waitForTimeout(350);
  await page.keyboard.down('ArrowLeft');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-held-keys','1');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#player-controls')).toHaveAttribute('data-held-keys','0');
  await page.keyboard.up('ArrowLeft');
  await page.locator('#pause').click();
  const paused = await page.locator('#game').getAttribute('data-visual-positions');
  await page.waitForTimeout(350);
  await expect(page.locator('#game')).toHaveAttribute('data-visual-positions',paused!);
  await page.locator('#controlled-actor').focus();
  await page.keyboard.press('w');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-held-keys','0');
  await page.locator('#control-mode').selectOption('AI');
  await page.locator('[data-speed="4"]').click();
  await page.locator('#pause').click();
  await expect(page.locator('html')).toHaveAttribute('data-session-state',/completed|defeated/,{timeout:100000});
  await expect(page.locator('#game')).toHaveAttribute('data-logical-overlaps','0');
  await expect(page.locator('#game')).toHaveAttribute('data-max-visual-sync-error','0');
  expect(errors).toEqual([]);
});

test('select, attack, follow, Stop and contextual Look issue domain actions', async ({page}) => {
  const errors = await open(page);
  await page.locator('#pause').click();
  await clickTile(page,await position(page,'lion-1'));
  await expect(page.locator('#player-controls')).toHaveAttribute('data-selected-target','lion-1');
  await page.locator('#player-attack').click();
  await page.locator('#pause').click();
  await expect.poll(() => page.evaluate(() => (window as any).__controlEvents.some((event:any) => event.sourceId === 'knight' && event.type === 'basic_attack'))).toBe(true);
  await expect(page.locator('#game')).toHaveAttribute('data-visual-facings',/knight:east/);
  await page.locator('#player-stop').click();
  await page.waitForTimeout(350);
  const attackCount = await page.evaluate(() => (window as any).__controlEvents.filter((event:any) => event.sourceId === 'knight' && event.type === 'basic_attack').length);
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => (window as any).__controlEvents.filter((event:any) => event.sourceId === 'knight' && event.type === 'basic_attack').length)).toBe(attackCount);
  await page.locator('#pause').click();
  await clickTile(page,await position(page,'sorcerer'),'right');
  await expect(page.locator('#interaction-menu')).toBeVisible();
  await page.locator('[data-interaction="look"]').click();
  await expect(page.locator('#interaction-status')).toContainText('Orin');
  await page.locator('#player-follow').click();
  await page.locator('#pause').click();
  await page.waitForTimeout(600);
  await page.locator('#player-stop').click();
  await expect(page.locator('#game')).toHaveAttribute('data-logical-overlaps','0');
  await expect(page.locator('#game')).toHaveAttribute('data-out-of-bounds','0');
  expect(errors).toEqual([]);
});

test('spell targeting cancels with ESC and reset clears held and interaction state', async ({page}) => {
  const errors = await open(page);
  await page.locator('[data-ability="berserk"]').click({button:'right'});
  await expect(page.locator('#player-controls')).toHaveAttribute('data-interaction-state','spell-targeting');
  await page.keyboard.press('Escape');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-interaction-state','idle');
  await page.locator('[data-ability="berserk"]').click({button:'right'});
  await page.keyboard.down('w');
  await page.locator('#restart').click();
  await page.keyboard.up('w');
  await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-interaction-state','idle');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-held-keys','0');
  await expect(page.locator('#player-controls')).toHaveAttribute('data-control-mode','AI');
  await expect(page.locator('#game')).toHaveAttribute('data-residual-visual-objects','0');
  expect(errors).toEqual([]);
});

test('manual steps route around a pillar and reject a blocked diagonal', async ({page}) => {
  const errors = await open(page);
  const step = async (key:string,tile:{x:number;y:number}) => {
    const count = await page.evaluate(() => (window as any).__controlEvents.filter((event:any) => event.sourceId === 'knight' && event.type === 'movement_started').length);
    await page.keyboard.down(key);
    await expect.poll(() => page.evaluate(() => (window as any).__controlEvents.filter((event:any) => event.sourceId === 'knight' && event.type === 'movement_started').length),{intervals:[20]}).toBeGreaterThan(count);
    await page.keyboard.up(key);
    await expect.poll(() => position(page),{intervals:[20]}).toEqual(tile);
  };
  await step('w',{x:8,y:8}); await step('w',{x:8,y:7}); await step('w',{x:8,y:6});
  await step('d',{x:9,y:6}); await step('d',{x:10,y:6}); await step('d',{x:11,y:6});
  // Free destination (12,7), but the orthogonal tile (12,6) is a pillar.
  await page.keyboard.down('s'); await page.keyboard.down('d');
  await page.waitForTimeout(300);
  await page.keyboard.up('s'); await page.keyboard.up('d');
  expect(await position(page)).toEqual({x:11,y:6});
  await step('s',{x:11,y:7}); await step('d',{x:12,y:7});
  await expect(page.locator('#game')).toHaveAttribute('data-logical-overlaps','0');
  await expect(page.locator('#game')).toHaveAttribute('data-out-of-bounds','0');
  expect(errors).toEqual([]);
});
