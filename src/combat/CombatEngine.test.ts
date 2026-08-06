import { describe, expect, it } from 'vitest';
import { abilities, defaultAbilityPreferences } from '../data/abilities';
import { floors, HUNT_LAYOUT_CONFIG } from '../data/config';
import { CombatEngine } from './CombatEngine';
import { TILE_SIZE, abilityOffsets } from './tiles';

describe('CombatEngine', () => {
  it('gera uma timeline determinística e completa', () => {
    const first = new CombatEngine(803).run();
    const second = new CombatEngine(803).run();
    expect(first).toEqual(second);
    expect(first.events.length).toBeGreaterThan(100);
    expect(first.events.some((event) => event.type === 'boss_spawn')).toBe(true);
    expect(first.events.at(-1)?.type).toBe('hunt_complete');
  });

  it('mantém o resultado da vertical slice coerente', () => {
    const result = new CombatEngine().run();
    expect(result.victory).toBe(true);
    expect(result.kills).toBe(17);
    expect(result.xp).toBe(3760);
    expect(result.gold).toBeGreaterThan(0);
    expect(result.healing).toBeGreaterThan(0);
    expect(result.floorTimes).toHaveLength(4);
  });

  it('concede boss_reward apenas na morte confirmada do boss', () => {
    const result = new CombatEngine(803).run();
    const bossRewards = result.events.filter((event) => event.type === 'boss_reward');
    expect(bossRewards.length).toBe(1);
    expect(bossRewards[0].targetId).toBe('lion-king');
    expect(bossRewards[0].data?.amount).toBe(1);
  });

  it('boss_reward ocorre após boss_spawn', () => {
    const result = new CombatEngine(803).run();
    const spawnIndex = result.events.findIndex((event) => event.type === 'boss_spawn');
    const rewardIndex = result.events.findIndex((event) => event.type === 'boss_reward');
    expect(spawnIndex).toBeGreaterThanOrEqual(0);
    expect(rewardIndex).toBeGreaterThan(spawnIndex);
  });

  it('respeita bossTokenReward configurável', () => {
    const originalReward = floors[3][1].bossTokenReward;
    floors[3][1].bossTokenReward = 3;
    const result = new CombatEngine(803).run();
    floors[3][1].bossTokenReward = originalReward;

    const bossRewards = result.events.filter((event) => event.type === 'boss_reward');
    expect(bossRewards.length).toBe(1);
    expect(bossRewards[0].data?.amount).toBe(3);
    expect(result.bossTokens).toBe(3);
  });

  it('emite todas as categorias essenciais', () => {
    const types = new Set(
      new CombatEngine().run().events.map((event) => event.type),
    );
    for (const type of [
      'spawn',
      'move',
      'basic_attack',
      'cast',
      'projectile',
      'damage',
      'heal',
      'critical',
      'dodge',
      'death',
      'loot',
      'experience',
      'boss_spawn',
      'boss_reward',
      'floor_complete',
      'hunt_complete',
    ]) {
      expect(types.has(type as never), type).toBe(true);
    }
  });

  it('mantém movimentação e efeitos presos à grade de 32 pixels', () => {
    const events = new CombatEngine().run().events;
    const points = events.flatMap((event) => [
      ...(event.data?.position ? [event.data.position] : []),
      ...(event.data?.tiles ?? []),
    ]);
    expect(points.length).toBeGreaterThan(100);
    for (const point of points) {
      expect(point.x % TILE_SIZE).toBe(0);
      expect(point.y % TILE_SIZE).toBe(0);
    }
  });

  it('usa áreas direcionais próprias para as duas ondas', () => {
    const casts = new CombatEngine()
      .run()
      .events.filter((event) => event.type === 'cast');
    const ice = casts.find(
      (event) => event.data?.abilityId === 'strong_ice_wave',
    );
    const energy = casts.find(
      (event) => event.data?.abilityId === 'energy_wave',
    );
    expect(ice?.data?.tiles).toHaveLength(25);
    expect(energy?.data?.tiles).toHaveLength(11);
    expect(new Set(ice?.data?.tiles?.map((point) => `${point.x}:${point.y}`)).size)
      .toBe(25);
  });

  it('usa as áreas originais cadastradas em SQMs', () => {
    expect(abilityOffsets('berserk')).toHaveLength(9);
    expect(abilityOffsets('groundshaker')).toHaveLength(37);
    expect(abilityOffsets('eternal_winter')).toHaveLength(61);
    expect(abilityOffsets('rage_skies')).toHaveLength(85);
  });

  it('reposiciona conjuradores em tiles seguros quando a box se forma', () => {
    const events = new CombatEngine().run().events;
    for (const id of ['druid', 'sorcerer']) {
      const positions = events
        .filter(
          (event) =>
            event.type === 'reposition' &&
            event.sourceId === id,
        )
        .map((event) => event.data!.position!);
      expect(positions.length, id).toBeGreaterThan(0);
      expect(
        positions.every(
          (point) =>
            point.x >= 2 * TILE_SIZE &&
            point.x <= 27 * TILE_SIZE &&
            point.y >= 2 * TILE_SIZE &&
            point.y <= 15 * TILE_SIZE,
        ),
      ).toBe(true);
    }
  });

  it('respeita os cooldowns das magias executadas', () => {
    const casts = new CombatEngine()
      .run()
      .events.filter((event) => event.type === 'cast');
    for (const ability of abilities) {
      const times = casts
        .filter((event) => event.data?.abilityId === ability.id)
        .map((event) => event.time);
      for (let index = 1; index < times.length; index++) {
        expect(times[index] - times[index - 1], ability.name).toBeGreaterThanOrEqual(
          ability.cooldown,
        );
      }
    }
    expect(casts.some((event) => event.data?.abilityId === 'challenge')).toBe(true);
    expect(casts.some((event) => event.data?.abilityId === 'energy_wave')).toBe(true);
  });

  it('usa exeta res após dois segundos sem alcance global ou puxão físico', () => {
    const events = new CombatEngine().run().events;
    const cast = events.find(
      (event) =>
        event.type === 'cast' &&
        event.data?.abilityId === 'challenge' &&
        event.data?.words === 'exeta res',
    );
    expect(cast).toBeDefined();
    expect(cast!.time).toBeGreaterThanOrEqual(2000);
    expect(cast?.data?.manaCost).toBe(80);
    const pullEvents = events.filter(
      (event) => event.type === 'reposition' && event.data?.pull,
    );
    expect(pullEvents).toHaveLength(0);
    const challenged = events.filter(
      (event) =>
        event.type === 'target_change' &&
        event.data?.reason === 'challenge' &&
        event.targetId === 'knight',
    );
    expect(challenged.length).toBeGreaterThan(0);
    expect(challenged.every((event) => event.data?.forcedUntil === event.time + 6000))
      .toBe(true);
  });

  it('inicia o aggro por proximidade e favorece o Knight apenas no empate', () => {
    const initial = new CombatEngine()
      .run()
      .events.filter(
        (event) =>
          event.type === 'target_change' &&
          event.floor === 1 &&
          event.time === 0 &&
          event.data?.reason === 'spatial',
      );
    expect(initial.find((event) => event.sourceId === 'lion-1')?.targetId)
      .toBe('knight');
    expect(initial.find((event) => event.sourceId === 'lion-2')?.targetId)
      .toBe('druid');
    expect(initial.find((event) => event.sourceId === 'lion-3')?.targetId)
      .toBe('sorcerer');
  });

  it('permite perder o forced target e recuperar o aggro com novo Challenge', () => {
    const events = new CombatEngine().run().events;
    const recovered = events.some((event, index) => {
      if (
        event.type !== 'target_change' ||
        event.data?.reason !== 'forced_expired' ||
        event.targetId === 'knight'
      ) {
        return false;
      }
      return events.slice(index + 1).some(
        (later) =>
          later.sourceId === event.sourceId &&
          later.type === 'target_change' &&
          later.data?.reason === 'challenge' &&
          later.targetId === 'knight',
      );
    });
    expect(recovered).toBe(true);
  });

  it('permite wave contra dois alvos quando a preferência é três', () => {
    const cast = new CombatEngine()
      .run()
      .events.find(
        (event) =>
          event.type === 'cast' &&
          event.data?.targetCount === 2 &&
          event.data?.preferredMinTargets === 3 &&
          event.data?.hardMinTargets === 1,
      );
    expect(cast).toBeDefined();
  });

  it('desconta mana das magias sem produzir valores negativos', () => {
    const casts = new CombatEngine()
      .run()
      .events.filter((event) => event.type === 'cast');
    expect(casts.length).toBeGreaterThan(0);
    expect(casts.every((event) => (event.data?.mana ?? -1) >= 0)).toBe(true);
    expect(casts.every((event) => (event.data?.manaCost ?? 0) > 0)).toBe(true);
  });

  it('obedece à configuração que desativa uma habilidade', () => {
    const preferences = defaultAbilityPreferences();
    preferences.energy_wave.enabled = false;
    const casts = new CombatEngine(803, preferences)
      .run()
      .events.filter((event) => event.type === 'cast');
    expect(
      casts.some((event) => event.data?.abilityId === 'energy_wave'),
    ).toBe(false);
  });

  it('mantém todas as entidades em tiles inteiros e sem sobreposição', () => {
    const events = new CombatEngine().run().events;
    const positions = new Map<string, { x: number; y: number }>();
    let floor = 0;
    for (const event of events) {
      if (event.floor !== floor) {
        floor = event.floor;
        positions.clear();
      }
      if (
        (event.type === 'spawn' || event.type === 'boss_spawn') &&
        event.targetId &&
        event.data?.tile
      ) {
        positions.set(event.targetId, event.data.tile);
      }
      if (
        (event.type === 'move' || event.type === 'reposition') &&
        event.sourceId &&
        event.data?.toTile
      ) {
        positions.set(event.sourceId, event.data.toTile);
      }
      if (event.type === 'death' && event.targetId) positions.delete(event.targetId);
      const keys = [...positions.values()].map((position) => {
        expect(Number.isInteger(position.x)).toBe(true);
        expect(Number.isInteger(position.y)).toBe(true);
        return `${position.x}:${position.y}`;
      });
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('emite caminhos adjacentes, dentro da arena e sem atravessar obstáculos', () => {
    const result = new CombatEngine().run();
    const blocked = new Set(
      HUNT_LAYOUT_CONFIG.blockedTiles.map((tile) => `${tile.x}:${tile.y}`),
    );
    const paths = result.events.filter(
      (event) => event.type === 'path_recalculated' && event.data?.path?.length,
    );
    expect(paths.length).toBeGreaterThan(0);
    for (const event of paths) {
      let previous = event.data!.fromTile!;
      for (const tile of event.data!.path!) {
        expect(
          Math.max(
            Math.abs(tile.x - previous.x),
            Math.abs(tile.y - previous.y),
          ),
        ).toBe(1);
        expect(blocked.has(`${tile.x}:${tile.y}`)).toBe(false);
        expect(tile.x).toBeGreaterThanOrEqual(
          HUNT_LAYOUT_CONFIG.walkableBounds.minColumn,
        );
        expect(tile.x).toBeLessThanOrEqual(
          HUNT_LAYOUT_CONFIG.walkableBounds.maxColumn,
        );
        expect(tile.y).toBeGreaterThanOrEqual(
          HUNT_LAYOUT_CONFIG.walkableBounds.minRow,
        );
        expect(tile.y).toBeLessThanOrEqual(
          HUNT_LAYOUT_CONFIG.walkableBounds.maxRow,
        );
        previous = tile;
      }
    }
    expect(result.gridMetrics.pathRecalculations).toBe(
      result.events.filter((event) => event.type === 'path_recalculated').length,
    );
  });

  it('resolve cada telegraph exatamente no mesmo conjunto lógico de tiles', () => {
    const events = new CombatEngine().run().events;
    const telegraphs = events.filter((event) => event.type === 'spell_telegraph');
    expect(telegraphs.length).toBeGreaterThan(0);
    for (const telegraph of telegraphs) {
      const terminal = events.filter(
        (event) =>
          (event.type === 'spell_resolved' || event.type === 'spell_cancelled') &&
          event.data?.castId === telegraph.data?.castId,
      );
      expect(terminal).toHaveLength(1);
      expect(terminal[0].data?.logicalTiles).toEqual(telegraph.data?.logicalTiles);
      if (terminal[0].type === 'spell_resolved') {
        expect(terminal[0].time).toBe(telegraph.data?.impactAt);
      } else {
        expect(terminal[0].data?.reason).toBeTruthy();
        expect(terminal[0].time).toBeLessThan(telegraph.data?.impactAt ?? Infinity);
      }
    }
  });

  it('resolves every basic projectile through the authoritative impact pipeline', () => {
    const events = new CombatEngine(803).run().events;
    const projectiles = events.filter((event) => event.type === 'projectile');
    expect(projectiles.length).toBeGreaterThan(0);
    for (const projectile of projectiles) {
      expect(projectile.data?.castId).toBeTruthy();
      expect(projectile.data?.pathTiles?.length).toBeGreaterThan(1);
      expect(projectile.data?.impactAt).toBeGreaterThan(projectile.time);
      const terminals = events.filter(
        (event) =>
          (event.type === 'projectile_resolved' ||
            event.type === 'projectile_cancelled') &&
          event.data?.castId === projectile.data?.castId,
      );
      expect(terminals).toHaveLength(1);
      expect(terminals[0].time).toBeGreaterThanOrEqual(projectile.time);
    }
  });

  it('never applies projectile damage before its impact timestamp', () => {
    const events = new CombatEngine(803).run().events;
    for (const projectile of events.filter((event) => event.type === 'projectile')) {
      const terminal = events.find(
        (event) =>
          event.type === 'projectile_resolved' &&
          event.data?.castId === projectile.data?.castId,
      );
      if (!terminal) continue;
      expect(terminal.time).toBe(projectile.data?.impactAt);
      const projectileIndex = events.indexOf(projectile);
      const terminalIndex = events.indexOf(terminal);
      const related = events
        .slice(projectileIndex + 1, terminalIndex)
        .filter(
          (event) =>
            (event.type === 'damage' || event.type === 'dodge') &&
            event.sourceId === projectile.sourceId &&
            event.targetId === projectile.targetId,
        );
      expect(related.every((event) => event.time >= terminal.time)).toBe(true);
      expect(related.some((event) => event.time === terminal.time)).toBe(true);
    }
  });
});
