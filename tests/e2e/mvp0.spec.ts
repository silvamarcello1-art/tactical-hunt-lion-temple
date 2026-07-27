import { expect, test, type Page } from '@playwright/test';

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function openIdleHunt(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.locator('#game canvas')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute(
    'data-session-state',
    'idle',
  );
}

async function expectNoInvalidNumbers(page: Page) {
  const text = await page.locator('body').innerText();
  expect(text).not.toContain('NaN');
  expect(text).not.toContain('Infinity');
}

test.describe.serial('MVP 0 + MVP 1A — fluxo completo', () => {
  test('carrega sem erros e todo controle visível dá retorno', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);

    await expect(page.locator('#backpack-capacity')).toHaveText('0 / 20 slots');
    await expect(page.locator('#loot-capacity')).toHaveText('0 / 64 slots');
    await expect(page.locator('#loot')).toHaveText('Nenhum item ainda.');
    await expect(page.locator('.demo-tag')).not.toHaveCount(0);

    await page.locator('[data-module="helper"]').click();
    await expect(page.locator('#ability-modal')).toBeVisible();
    await expect(page.locator('#helper-character-name')).toHaveText('Aldric');
    await expect(page.locator('#ability-list .ability-row')).toHaveCount(3);
    await page.locator('#save-abilities').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'idle',
    );
    await expect(page.locator('#game canvas')).toHaveCount(1);

    await page.locator('#party-config').click();
    await expect(page.locator('#ability-modal')).toBeVisible();
    await page.locator('#ability-modal button[value="cancel"]').first().click();

    await page.locator('[data-ability]').first().click();
    await expect(page.locator('#ability-modal')).toBeVisible();
    await page.locator('#ability-modal button[value="cancel"]').first().click();

    for (const module of ['bestiary','progression','storage','social']) {
      await page.locator(`[data-module="${module}"]`).click();
      await expect(page.locator('#future-modal')).toBeVisible();
      await expect(page.locator('#future-description')).toContainText(
        'Disponível em um próximo MVP',
      );
      await page.locator('#close-future').click();
    }

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
    await expect(page.locator('#future-description')).toContainText(
      'Disponível em um próximo MVP',
    );
    await page.locator('#close-future').click();
    await page.locator('#loop-toggle').click();
    await expect(page.locator('#loop-toggle')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page.locator('#loop-toggle').click();
    await expect(page.locator('#loop-toggle')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expectNoInvalidNumbers(page);
    expect(errors).toEqual([]);
  });

  test('seleciona personagem e mantém o Helper funcional durante a hunt', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);

    await page.getByRole('button', { name:'Abrir Helper de Lyra' }).click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-selected-hero',
      'druid',
    );
    await expect(page.locator('#helper-character-name')).toHaveText('Lyra');
    await expect(page.locator('#helper-character-vocation')).toContainText(
      'Druid',
    );
    await expect(page.locator('#ability-list .ability-row')).toHaveCount(3);
    await page.locator('#ability-modal button[value="cancel"]').first().click();

    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'running',
    );
    await page.getByRole('button', { name:'Abrir Helper de Orin' }).click();
    await expect(page.locator('#helper-character-name')).toHaveText('Orin');
    await expect(page.locator('html')).toHaveAttribute(
      'data-selected-hero',
      'sorcerer',
    );
    await expect(page.locator('#game')).toHaveAttribute(
      'data-selected-hero',
      'sorcerer',
    );
    await page.locator('#ability-modal button[value="cancel"]').first().click();
    await expect(page.locator('html')).not.toHaveAttribute(
      'data-session-state',
      'paused',
    );
    await page.locator('#restart').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'idle',
    );

    await openIdleHunt(page, '/?debug=1');
    await expect(page.locator('html')).toHaveAttribute(
      'data-debug-enabled',
      'true',
    );
    await expect(page.locator('#game')).toHaveAttribute(
      'data-debug-enabled',
      'true',
    );
    await expect(page.locator('#game')).toHaveAttribute(
      'data-out-of-bounds',
      '0',
    );
    expect(errors).toEqual([]);
  });

  test('sessão, pausa, tweens, velocidades e reset são determinísticos', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);

    for (const speed of ['1','2','4','1']) {
      await page.locator(`[data-speed="${speed}"]`).click();
      await expect(page.locator('html')).toHaveAttribute(
        'data-playback-speed',
        speed,
      );
    }

    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'running',
    );
    await expect(page.locator('#start')).toBeDisabled();
    await expect
      .poll(async () => Number(await page.locator('#game').getAttribute(
        'data-tween-count',
      )))
      .toBeGreaterThan(0);
    const cooldown = page.locator('[data-ability="berserk"]');
    await expect
      .poll(async () => Number(await cooldown.getAttribute(
        'data-cooldown-remaining',
      )))
      .toBeGreaterThan(0);

    await page.locator('#pause').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'paused',
    );
    const pausedTime = await page.locator('#time').textContent();
    const pausedTweens = await page.locator('#game').getAttribute(
      'data-tween-count',
    );
    const pausedCooldown = await cooldown.getAttribute(
      'data-cooldown-remaining',
    );
    await page.waitForTimeout(600);
    await expect(page.locator('#time')).toHaveText(pausedTime ?? '');
    await expect(page.locator('#game')).toHaveAttribute(
      'data-tween-count',
      pausedTweens ?? '',
    );
    await expect(cooldown).toHaveAttribute(
      'data-cooldown-remaining',
      pausedCooldown ?? '',
    );
    await page.locator('[data-speed="2"]').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-playback-speed',
      '2',
    );

    await page.locator('#pause').click();
    await expect(page.locator('html')).not.toHaveAttribute(
      'data-session-state',
      'paused',
    );
    await page.locator('[data-speed="4"]').click();
    await expect
      .poll(async () => Number(await cooldown.getAttribute(
        'data-cooldown-remaining',
      )))
      .toBeLessThan(Number(pausedCooldown));
    await page.locator('#restart').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'idle',
    );
    await expect(page.locator('#game canvas')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('data-playback-speed', '4');
    await expect(page.locator('#time')).toHaveText('00:00');
    await expect(page.locator('#game')).toHaveAttribute('data-unit-count', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-tween-count', '0');
    await expect(page.locator('html')).toHaveAttribute(
      'data-processed-events',
      '0',
    );
    await expectNoInvalidNumbers(page);
    expect(errors).toEqual([]);
  });

  test('reinicia durante o boss e após a conclusão sem misturar o Analyzer', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);
    await page.locator('#loop-toggle').click();
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();

    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'boss',
      { timeout:60_000 },
    );
    await expect(page.locator('html')).toHaveAttribute(
      'data-boss-spawns',
      '1',
    );
    await page.locator('#restart').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'idle',
    );
    await expect(page.locator('#analyzer')).toContainText('XP ganho');
    await expect(page.locator('#time')).toHaveText('00:00');
    await expect(page.locator('#loot-capacity')).toHaveText('0 / 64 slots');
    await expect(page.locator('#game')).toHaveAttribute('data-unit-count', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-tween-count', '0');

    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'completed',
      { timeout:60_000 },
    );
    await page.locator('#close-result').click();
    await page.locator('#restart').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'idle',
    );
    await expect(page.locator('#time')).toHaveText('00:00');
    await expect(page.locator('#loot')).toHaveText('Nenhum item ainda.');
    await expectNoInvalidNumbers(page);
    expect(errors).toEqual([]);
  });

  test('chega ao boss e conclui três loops sem duplicações', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();

    await expect(page.locator('html')).toHaveAttribute(
      'data-completed-cycles',
      '3',
      { timeout:100_000 },
    );
    await page.locator('#loop-toggle').click();
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#stage-label')).toHaveText('Hunt concluída');
    await expect(page.locator('html')).toHaveAttribute('data-boss-spawns', '1');
    await expect(page.locator('#game canvas')).toHaveCount(1);
    await expect(page.locator('#game')).toHaveAttribute('data-unit-count', '3');
    await expect(page.locator('#game')).toHaveAttribute('data-tween-count', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-effect-count', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-entity-count', '3');
    await expect(page.locator('#game')).toHaveAttribute('data-out-of-bounds', '0');
    await expect(page.locator('.hero-card')).toHaveCount(3);
    await expect(page.locator('#analyzer')).toContainText('Bosses');
    await expect(page.locator('#analyzer')).toContainText('Dano recebido');
    await expect(page.locator('#loot-capacity')).not.toHaveText('0 / 64 slots');
    await expect(page.locator('#loot')).not.toHaveText('Nenhum item ainda.');
    await expect
      .poll(async () => Number(await page.locator('html').getAttribute(
        'data-processed-events',
      )))
      .toBeGreaterThan(0);
    await page.waitForTimeout(2500);
    await expect(page.locator('html')).toHaveAttribute(
      'data-completed-cycles',
      '3',
    );
    await expectNoInvalidNumbers(page);
    expect(errors).toEqual([]);
  });

  test('conclui uma hunt nas três resoluções sem sair da arena', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    for (const viewport of [
      { width:1366, height:768 },
      { width:1600, height:900 },
      { width:1920, height:1080 },
    ]) {
      await page.setViewportSize(viewport);
      await openIdleHunt(page);
      await expect(page.locator('html')).toHaveAttribute(
        'data-debug-enabled',
        'false',
      );
      const layout = await page.evaluate(() => ({
        clientWidth:document.documentElement.clientWidth,
        scrollWidth:document.documentElement.scrollWidth,
        canvasWidth:
          document.querySelector<HTMLCanvasElement>('#game canvas')?.clientWidth ??
          0,
      }));
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
      expect(layout.canvasWidth).toBeGreaterThan(700);
      await page.locator('#loop-toggle').click();
      await page.locator('[data-speed="4"]').click();
      await page.locator('#start').click();
      await expect(page.locator('html')).toHaveAttribute(
        'data-session-state',
        'completed',
        { timeout:60_000 },
      );
      await expect(page.locator('#game')).toHaveAttribute(
        'data-out-of-bounds',
        '0',
      );
      await expect(page.locator('#game')).toHaveAttribute(
        'data-tween-count',
        '0',
      );
      await expect(page.locator('#analyzer')).toContainText('Concluída');
    }
    expect(errors).toEqual([]);
  });
});
