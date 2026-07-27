import { expect, test, type Page } from '@playwright/test';

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function openReadyHunt(page: Page) {
  await page.goto('/');
  await expect(page.locator('#game canvas')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute(
    'data-session-state',
    'ready',
  );
}

test.describe.serial('MVP 0 — fluxo completo', () => {
  test('carrega sem erros e todos os controles dão retorno', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await openReadyHunt(page);

    await page.locator('[data-module="helper"]').click();
    await expect(page.locator('#ability-modal')).toBeVisible();
    await page.locator('#ability-modal button[value="cancel"]').first().click();

    await page.locator('[data-module="bestiary"]').click();
    await expect(page.locator('#future-modal')).toBeVisible();
    await expect(page.locator('#future-title')).toContainText('Bestiário');
    await page.locator('#close-future').click();

    await page.locator('[data-view="combat"]').click();
    await expect(page.locator('#view-summary')).toBeVisible();
    await expect(page.locator('#view-summary')).toContainText('MVP 1');
    await page.locator('[data-view="loot"]').click();
    await expect(page.locator('#view-summary')).toContainText('inventário');
    await page.locator('[data-view="general"]').click();
    await expect(page.locator('#view-summary')).toBeHidden();

    const collapse = page.locator('[data-collapse]').first();
    const content = collapse.locator('xpath=ancestor::section[1]').locator(
      '.collapsible-content',
    );
    await collapse.click();
    await expect(content).toBeHidden();
    await collapse.click();
    await expect(content).toBeVisible();

    await page.locator('#supply-config').click();
    await expect(page.locator('#future-modal')).toBeVisible();
    await page.locator('#close-future').click();
    expect(errors).toEqual([]);
  });

  test('iniciar, pausar, continuar e reiniciar são determinísticos', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openReadyHunt(page);
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'running',
    );
    await expect(page.locator('html')).toHaveAttribute('data-playback-speed', '4');

    await page.locator('#pause').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'paused',
    );
    const pausedTime = await page.locator('#time').textContent();
    await page.waitForTimeout(1100);
    await expect(page.locator('#time')).toHaveText(pausedTime ?? '');

    await page.locator('#pause').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'running',
    );
    await page.locator('#restart').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'ready',
    );
    await expect(page.locator('#game canvas')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('data-playback-speed', '4');
    await expect(page.locator('#time')).toHaveText('00:00');
    expect(errors).toEqual([]);
  });

  test('conclui três ciclos em loop sem duplicar canvas ou eventos', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openReadyHunt(page);
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();

    await expect(page.locator('html')).toHaveAttribute(
      'data-completed-cycles',
      '3',
      { timeout:100_000 },
    );
    await page.locator('#loop-toggle').click();
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#game canvas')).toHaveCount(1);
    await expect(page.locator('#game')).toHaveAttribute('data-unit-count', '3');
    await page.waitForTimeout(2500);
    await expect(page.locator('html')).toHaveAttribute(
      'data-completed-cycles',
      '3',
    );
    expect(errors).toEqual([]);
  });

  test('mantém a composição utilizável nas resoluções alvo', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    for (const viewport of [
      { width:1366, height:768 },
      { width:1600, height:900 },
      { width:1920, height:1080 },
    ]) {
      await page.setViewportSize(viewport);
      await openReadyHunt(page);
      const layout = await page.evaluate(() => ({
        clientWidth:document.documentElement.clientWidth,
        scrollWidth:document.documentElement.scrollWidth,
        canvasWidth:
          document.querySelector<HTMLCanvasElement>('#game canvas')?.clientWidth ??
          0,
      }));
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
      expect(layout.canvasWidth).toBeGreaterThan(600);
    }
    expect(errors).toEqual([]);
  });
});
