import { expect, test } from '@playwright/test';

test('original cardinal sheets and effect frames freeze with the logical clock',async ({page}) => {
  const errors:string[] = [];
  const assets:string[] = [];
  page.on('pageerror',error => errors.push(error.message));
  page.on('request',request => { if(request.url().includes('/assets/')) assets.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#loop-toggle').click();
  await page.locator('#start').click();
  await page.locator('[data-speed="4"]').click();
  await expect(page.locator('#game')).not.toHaveAttribute('data-effect-frames','');
  await page.locator('#pause').click();
  const frames = await page.locator('#game').getAttribute('data-sprite-frames');
  const effects = await page.locator('#game').getAttribute('data-effect-frames');
  await page.waitForTimeout(500);
  await expect(page.locator('#game')).toHaveAttribute('data-sprite-frames',frames!);
  await expect(page.locator('#game')).toHaveAttribute('data-effect-frames',effects!);
  expect(assets.some(url => url.endsWith('/original/characters/knight.svg'))).toBe(true);
  expect(assets.some(url => /outfits.json|character-atlas.png|tibia\/tiles/.test(url))).toBe(false);
  expect(errors).toEqual([]);
});
