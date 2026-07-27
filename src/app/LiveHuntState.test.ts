import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '../events/types';
import { LiveHuntState } from './LiveHuntState';

const event = (
  type: CombatEvent['type'],
  data: CombatEvent['data'] = {},
  sourceId?: string,
  targetId?: string,
): CombatEvent => ({
  id:`event-${type}`,
  time:0,
  floor:1,
  type,
  sourceId,
  targetId,
  data,
});

describe('LiveHuntState', () => {
  it('agrega e reinicia as métricas ao vivo', () => {
    const state = new LiveHuntState();
    state.setTime(1200);
    state.apply(event('damage', { amount:125 }, 'knight', 'lion-1'));
    state.apply(event('damage', { amount:45 }, 'lion-1', 'knight'));
    state.apply(event('heal', { amount:80 }, 'druid', 'knight'));
    state.apply(event('death', {}, 'knight', 'lion-1'));
    state.apply(event('death', {}, 'knight', 'lion-king'));
    state.apply(event('experience', { amount:160 }, undefined, 'lion-1'));
    state.apply(
      event('loot', { item:'Gold coin', quantity:55 }, 'lion-1'),
    );

    expect(state.time).toBe(1200);
    expect(state.damage.knight).toBe(125);
    expect(state.healing).toBe(80);
    expect(state.damageTaken).toBe(45);
    expect(state.kills).toBe(2);
    expect(state.bosses).toBe(1);
    expect(state.xp).toBe(160);
    expect(state.gold).toBe(55);
    expect(state.loot['Gold coin']).toBe(55);
    expect(state.occupiedLootSlots).toBe(1);

    state.reset();
    expect(state).toMatchObject({
      time:0,
      xp:0,
      gold:0,
      kills:0,
      bosses:0,
      healing:0,
      damageTaken:0,
      damage:{ knight:0, druid:0, sorcerer:0 },
      loot:{},
    });
  });

  it('não altera bossTokens ao receber boss_reward', () => {
    const state = new LiveHuntState();
    state.apply(event('boss_reward', { amount:1 }, undefined, 'lion-king'));
    expect(state.bossTokens).toBe(0);
  });

  it('ignora NaN, Infinity e quantidades negativas', () => {
    const state = new LiveHuntState();
    state.setTime(Number.NaN);
    state.apply(event('damage', { amount:Number.POSITIVE_INFINITY }, 'knight'));
    state.apply(event('heal', { amount:-30 }, 'druid'));
    state.apply(event('experience', { amount:Number.NaN }));
    state.apply(event('loot', { item:'Gold coin', quantity:-1 }));

    expect(state.time).toBe(0);
    expect(state.damage.knight).toBe(0);
    expect(state.healing).toBe(0);
    expect(state.xp).toBe(0);
    expect(state.gold).toBe(0);
  });
});
