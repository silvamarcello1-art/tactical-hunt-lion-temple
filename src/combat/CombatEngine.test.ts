import { describe, expect, it } from 'vitest';
import { defaultAbilityPreferences } from '../data/abilities';
import { heroes } from '../data/config';
import { CombatEngine } from './CombatEngine';
import { TILE_SIZE } from './tiles';

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
    expect(ice?.data?.tiles).toHaveLength(13);
    expect(energy?.data?.tiles).toHaveLength(11);
    expect(new Set(ice?.data?.tiles?.map((point) => `${point.x}:${point.y}`)).size)
      .toBe(13);
  });

  it('reposiciona conjuradores e retorna ao tile seguro depois da magia', () => {
    const events = new CombatEngine().run().events;
    for (const id of ['druid', 'sorcerer']) {
      const safe = heroes.find((hero) => hero.id === id)!.position;
      const positions = events
        .filter(
          (event) =>
            event.type === 'reposition' &&
            event.sourceId === id &&
            event.floor === 1,
        )
        .map((event) => event.data!.position!);
      expect(positions.some((point) => point.x !== safe.x || point.y !== safe.y))
        .toBe(true);
      expect(positions.some((point) => point.x === safe.x && point.y === safe.y))
        .toBe(true);
    }
  });

  it('respeita cooldowns próprios das nove magias', () => {
    const casts = new CombatEngine()
      .run()
      .events.filter((event) => event.type === 'cast');
    const expected: Record<string, number> = {
      Challenge:2000,
      Berserk:4000,
      Groundshaker:8000,
      'Heal Friend':1000,
      'Strong Ice Wave':4000,
      'Eternal Winter':40000,
      'Flame Strike':2000,
      'Energy Wave':8000,
      'Rage of the Skies':40000,
    };
    for (const [name, cooldown] of Object.entries(expected)) {
      const times = casts
        .filter((event) => event.data?.ability === name)
        .map((event) => event.time);
      expect(times.length, name).toBeGreaterThan(0);
      for (let index = 1; index < times.length; index++) {
        expect(times[index] - times[index - 1], name).toBeGreaterThanOrEqual(
          cooldown,
        );
      }
    }
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
});
