import { expect, test, type Page } from '@playwright/test';

const runtimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

const gameAttribute = (page: Page, name: string) =>
  page.locator('#game').getAttribute(name);

async function openHunt(page: Page) {
  await page.goto('/');
  await expect(page.locator('#game canvas')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('data-session-state', 'idle');
}

test.describe.serial('MVP 1D — combat presentation', () => {
  test('pausa congela relógio, posições e efeitos; 1x/2x/4x usam a mesma timeline', async ({ page }) => {
    const errors = runtimeErrors(page);
    await openHunt(page);
    await page.locator('[data-speed="1"]').click();
    await page.locator('#start').click();
    await expect.poll(async () => Number(await gameAttribute(page, 'data-logical-time')))
      .toBeGreaterThan(1000);

    await page.locator('#pause').click();
    await expect(page.locator('html')).toHaveAttribute('data-session-state', 'paused');
    const paused = {
      time:await gameAttribute(page, 'data-logical-time'),
      positions:await gameAttribute(page, 'data-visual-positions'),
      projectiles:await gameAttribute(page, 'data-active-projectiles'),
      telegraphs:await gameAttribute(page, 'data-active-telegraphs'),
      states:await gameAttribute(page, 'data-presentation-states'),
    };
    await page.waitForTimeout(650);
    await expect(page.locator('#game')).toHaveAttribute('data-logical-time', paused.time ?? '');
    await expect(page.locator('#game')).toHaveAttribute('data-visual-positions', paused.positions ?? '');
    await expect(page.locator('#game')).toHaveAttribute('data-active-projectiles', paused.projectiles ?? '');
    await expect(page.locator('#game')).toHaveAttribute('data-active-telegraphs', paused.telegraphs ?? '');
    await expect(page.locator('#game')).toHaveAttribute('data-presentation-states', paused.states ?? '');

    await page.locator('[data-speed="2"]').click();
    await page.locator('#pause').click();
    await expect.poll(async () => Number(await gameAttribute(page, 'data-logical-time')))
      .toBeGreaterThan(Number(paused.time) + 500);
    await page.locator('[data-speed="4"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-playback-speed', '4');
    await page.locator('#restart').click();
    await expect(page.locator('html')).toHaveAttribute('data-session-state', 'idle');
    await expect(page.locator('#game')).toHaveAttribute('data-residual-visual-objects', '0');
    expect(errors).toEqual([]);
  });

  test('hunt completa mantém máscaras, footpoints, camadas e pools sincronizados', async ({ page }) => {
    const errors = runtimeErrors(page);
    await openHunt(page);
    await page.locator('#loop-toggle').click();
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute('data-session-state', 'completed', {
      timeout:100_000,
    });
    await expect.poll(async () => Number(await gameAttribute(page, 'data-residual-visual-objects')))
      .toBe(0);

    await expect(page.locator('#game')).toHaveAttribute('data-max-visual-sync-error', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-visual-overlap-warnings', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-mask-mismatch-count', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-active-projectiles', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-active-telegraphs', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-active-floating-texts', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-shadow-layer-count', '3');
    await expect(page.locator('#game')).toHaveAttribute('data-unit-ui-layer-count', '3');
    expect(Number(await gameAttribute(page, 'data-max-active-visual-objects'))).toBeGreaterThan(0);
    expect(Number(await gameAttribute(page, 'data-created-floating-texts'))).toBeLessThanOrEqual(48);
    expect(await gameAttribute(page, 'data-visual-facings')).toContain('knight:');
    expect(await gameAttribute(page, 'data-visual-facings')).toContain('druid:');
    expect(await gameAttribute(page, 'data-visual-facings')).toContain('sorcerer:');
    expect(errors).toEqual([]);
  });
});
