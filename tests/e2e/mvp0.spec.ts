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

async function installGridAudit(page: Page) {
  await page.addInitScript(() => {
    const positions = new Map<string, string>();
    const reservations = new Map<string, {
      tile:string;
      startedAt:number;
      completesAt:number;
    }>();
    const projectiles = new Map<string, { impactAt:number; terminals:number }>();
    const telegraphs = new Map<string, string>();
    let currentInitialBackline = 0;
    const blocked = new Set([
      '12:5','12:6','12:12','12:13','17:7','17:8','17:10','17:11',
    ]);
    const audit = {
      floor:0,
      overlapDetected:false,
      blockedTileEntered:false,
      invalidPath:false,
      telegraphMismatch:false,
      pathEvents:0,
      spellTelegraphs:0,
      reservationObserved:false,
      invalidReservationLifecycle:false,
      projectileObserved:false,
      monsterProjectileObserved:false,
      prematureProjectileDamage:false,
      duplicateProjectileTerminal:false,
      pendingAtFloorComplete:false,
      maxInitialBacklineAttackers:0,
    };
    Object.assign(window, { __gridAudit:audit });
    window.addEventListener('hunt-event', (rawEvent) => {
      const event = (rawEvent as CustomEvent<{
        floor:number;
        type:string;
        sourceId?:string;
        targetId?:string;
        data?:Record<string, unknown>;
      }>).detail;
      if (event.floor !== audit.floor) {
        audit.floor = event.floor;
        positions.clear();
        currentInitialBackline = 0;
      }
      const tile = event.data?.tile as { x:number;y:number } | undefined;
      const toTile = event.data?.toTile as { x:number;y:number } | undefined;
      if ((event.type === 'spawn' || event.type === 'boss_spawn') && event.targetId && tile) {
        positions.set(event.targetId, `${tile.x}:${tile.y}`);
      }
      if (event.type === 'tile_reserved' && event.sourceId && toTile) {
        const startedAt = Number(event.data?.startedAt ?? event.time);
        const completesAt = Number(event.data?.completesAt ?? event.time);
        audit.reservationObserved = true;
        if (completesAt <= startedAt || positions.get(event.sourceId) === `${toTile.x}:${toTile.y}`) {
          audit.invalidReservationLifecycle = true;
        }
        reservations.set(event.sourceId, {
          tile:`${toTile.x}:${toTile.y}`,
          startedAt,
          completesAt,
        });
      }
      if (event.type === 'movement_completed' && event.sourceId && toTile) {
        const reservation = reservations.get(event.sourceId);
        if (!reservation || reservation.tile !== `${toTile.x}:${toTile.y}` || event.time < reservation.completesAt) {
          audit.invalidReservationLifecycle = true;
        }
        positions.set(event.sourceId, `${toTile.x}:${toTile.y}`);
        if (blocked.has(`${toTile.x}:${toTile.y}`)) audit.blockedTileEntered = true;
        reservations.delete(event.sourceId);
      }
      if (event.type === 'movement_cancelled' && event.sourceId) {
        reservations.delete(event.sourceId);
      }
      if (event.type === 'death' && event.targetId) {
        positions.delete(event.targetId);
        reservations.delete(event.targetId);
      }
      if (new Set(positions.values()).size !== positions.size) {
        audit.overlapDetected = true;
      }
      if (event.type === 'path_recalculated') {
        audit.pathEvents++;
        const path = (event.data?.path ?? []) as Array<{ x:number;y:number }>;
        let previous = event.data?.fromTile as { x:number;y:number } | undefined;
        for (const step of path) {
          if (
            !previous ||
            Math.max(Math.abs(step.x - previous.x), Math.abs(step.y - previous.y)) !== 1 ||
            blocked.has(`${step.x}:${step.y}`)
          ) {
            audit.invalidPath = true;
          }
          previous = step;
        }
      }
      const castId = event.data?.castId as string | undefined;
      if (event.type === 'projectile' && castId) {
        audit.projectileObserved = true;
        if (event.sourceId?.startsWith('lion-') || event.sourceId?.startsWith('mage-') || event.sourceId === 'lion-king') {
          audit.monsterProjectileObserved = true;
        }
        const impactAt = Number(event.data?.impactAt ?? event.time);
        if (impactAt <= event.time || !Array.isArray(event.data?.pathTiles) || event.data.pathTiles.length < 2) {
          audit.prematureProjectileDamage = true;
        }
        projectiles.set(castId, { impactAt, terminals:0 });
      }
      if ((event.type === 'damage' || event.type === 'dodge') && castId) {
        const projectile = projectiles.get(castId);
        if (projectile && event.time < projectile.impactAt) {
          audit.prematureProjectileDamage = true;
        }
      }
      if ((event.type === 'projectile_resolved' || event.type === 'projectile_cancelled') && castId) {
        const projectile = projectiles.get(castId);
        if (projectile) {
          projectile.terminals++;
          if (projectile.terminals > 1 || event.time < projectile.impactAt && event.type === 'projectile_resolved') {
            audit.duplicateProjectileTerminal = true;
          }
          projectiles.delete(castId);
        }
      }
      if (event.type === 'spell_telegraph' && castId) {
        audit.spellTelegraphs++;
        telegraphs.set(castId, JSON.stringify(event.data?.logicalTiles ?? []));
      }
      if ((event.type === 'spell_resolved' || event.type === 'spell_cancelled') && castId && telegraphs.has(castId)) {
        if (telegraphs.get(castId) !== JSON.stringify(event.data?.logicalTiles ?? [])) {
          audit.telegraphMismatch = true;
        }
        telegraphs.delete(castId);
      }
      if (event.type === 'floor_complete') {
        if (reservations.size || projectiles.size || telegraphs.size) {
          audit.pendingAtFloorComplete = true;
        }
      }
      if (event.type === 'target_change' && event.data?.reason === 'spatial') {
        if (event.targetId === 'druid' || event.targetId === 'sorcerer') {
          currentInitialBackline++;
          audit.maxInitialBacklineAttackers = Math.max(
            audit.maxInitialBacklineAttackers,
            currentInitialBackline,
          );
        }
      }
    });
  });
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

  test('exibe saldo persistente de Boss Tokens ao carregar a página', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'tactical-hunt-currency',
        JSON.stringify({ bossToken: 1, rewardKeys: [] }),
      );
    });
    await openIdleHunt(page);
    await expect(page.locator('#boss-token-balance')).toHaveText(
      '★ 1 Boss Token',
    );
  });

  test('concede Boss Token ao derrotar o boss e persiste o saldo após reload', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);
    await page.locator('#loop-toggle').click();
    await expect(page.locator('#loop-toggle')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.locator('#boss-token-balance')).toHaveText(
      '★ 0 Boss Token',
    );
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'completed',
      { timeout: 100_000 },
    );
    await page.waitForFunction(() => {
      const dialog = document.querySelector('#result') as HTMLDialogElement | null;
      return dialog?.open === true;
    });
    await expect(page.locator('#boss-token-balance')).toHaveText(
      '★ 1 Boss Token',
    );
    const balance = await page.locator('#boss-token-balance').innerText();
    await page.locator('#close-result').click();
    await expect(page.locator('#boss-token-balance')).toHaveText(balance);
    await page.reload();
    await openIdleHunt(page);
    await expect(page.locator('#boss-token-balance')).toHaveText(balance);
    expect(errors).toEqual([]);
  });

  test('abrir o relatório de resultado não altera o saldo de Boss Token', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);
    await page.locator('#loop-toggle').click();
    await expect(page.locator('#loop-toggle')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'completed',
      { timeout: 100_000 },
    );
    await expect(page.locator('#boss-token-balance')).toHaveText(
      '★ 1 Boss Token',
    );
    const balance = await page.locator('#boss-token-balance').innerText();
    await expect(page.locator('#result')).toBeVisible();
    await page.locator('#close-result').click();
    await expect(page.locator('#boss-token-balance')).toHaveText(balance);
    expect(errors).toEqual([]);
  });

  test('não concede Boss Token duas vezes para o mesmo boss_reward duplicado', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-session-state',
      'completed',
      { timeout: 100_000 },
    );
    const firstBalance = await page.locator('#boss-token-balance').innerText();
    await page.evaluate(() => {
      const event = {
        type: 'boss_reward',
        floor: 4,
        targetId: 'lion-king',
        data: { amount: 1, rewardType: 'bossToken' },
      };
      window.dispatchEvent(new CustomEvent('hunt-event', { detail: event }));
      window.dispatchEvent(new CustomEvent('hunt-event', { detail: event }));
    });
    await expect(page.locator('#boss-token-balance')).toHaveText(firstBalance);
    expect(errors).toEqual([]);
  });

  test('três loops legítimos concedem três Boss Tokens', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);
    await page.locator('[data-speed="4"]').click();
    await page.locator('#start').click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-completed-cycles',
      '3',
      { timeout: 100_000 },
    );
    await expect(page.locator('#boss-token-balance')).toHaveText(
      '★ 3 Boss Token',
    );
    expect(errors).toEqual([]);
  });

  test('três bosses distintos concedem três Boss Tokens no mesmo ciclo', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);
    await page.evaluate(() => {
      for (const bossId of ['boss-1', 'boss-2', 'boss-3']) {
        const event = {
          type: 'boss_reward',
          floor: 4,
          targetId: bossId,
          data: { amount: 1, rewardType: 'bossToken' },
        };
        window.dispatchEvent(new CustomEvent('hunt-event', { detail: event }));
      }
    });
    await expect(page.locator('#boss-token-balance')).toHaveText(
      '★ 3 Boss Token',
    );
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

  test('remove reservas, projéteis e telegraphs ao reiniciar durante a hunt', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page);
    await openIdleHunt(page);
    await page.locator('#start').click();
    await expect
      .poll(async () => Number(await page.locator('#game').getAttribute(
        'data-active-projectiles',
      )))
      .toBeGreaterThan(0);
    await expect
      .poll(async () => Number(await page.locator('#game').getAttribute(
        'data-reservation-count',
      )))
      .toBeGreaterThan(0);
    await page.locator('#restart').click();
    await expect(page.locator('html')).toHaveAttribute('data-session-state', 'idle');
    await expect(page.locator('#game')).toHaveAttribute('data-active-projectiles', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-active-telegraphs', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-reservation-count', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-tween-count', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-effect-count', '0');
    await page.waitForTimeout(500);
    await expect(page.locator('html')).toHaveAttribute('data-processed-events', '0');
    expect(errors).toEqual([]);
  });

  test('chega ao boss e conclui três loops sem duplicações', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await installGridAudit(page);
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
    await expect(page.locator('#game')).toHaveAttribute('data-logical-overlaps', '0');
    await expect
      .poll(async () => Number(await page.locator('#game').getAttribute(
        'data-path-recalculations',
      )))
      .toBeGreaterThan(0);
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
    const gridAudit = await page.evaluate(() =>
      (window as typeof window & { __gridAudit?:Record<string, unknown> }).__gridAudit,
    );
    expect(gridAudit).toMatchObject({
      overlapDetected:false,
      blockedTileEntered:false,
      invalidPath:false,
      telegraphMismatch:false,
      reservationObserved:true,
      invalidReservationLifecycle:false,
      projectileObserved:true,
      monsterProjectileObserved:true,
      prematureProjectileDamage:false,
      duplicateProjectileTerminal:false,
      pendingAtFloorComplete:false,
    });
    expect(Number(gridAudit?.maxInitialBacklineAttackers ?? Infinity))
      .toBeLessThanOrEqual(2);
    expect(Number(gridAudit?.pathEvents ?? 0)).toBeGreaterThan(0);
    expect(Number(gridAudit?.spellTelegraphs ?? 0)).toBeGreaterThan(0);
    await expect(page.locator('#game')).toHaveAttribute('data-active-projectiles', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-active-telegraphs', '0');
    await expect(page.locator('#game')).toHaveAttribute('data-reservation-count', '0');
    expect(Number(await page.locator('#game').getAttribute(
      'data-consecutive-no-route',
    ))).toBeLessThanOrEqual(3);
    expect(Number(await page.locator('#game').getAttribute(
      'data-max-pending-movements',
    ))).toBeGreaterThan(0);
    expect(Number(await page.locator('#game').getAttribute(
      'data-max-pending-projectiles',
    ))).toBeGreaterThan(0);
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
