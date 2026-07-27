import type { CombatEvent } from '../events/types';

const heroIds = new Set(['knight', 'druid', 'sorcerer']);

const safeAmount = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

export class LiveHuntState {
  time = 0;
  xp = 0;
  gold = 0;
  kills = 0;
  healing = 0;
  damage: Record<string, number> = {
    knight:0,
    druid:0,
    sorcerer:0,
  };
  loot: Record<string, number> = {};

  reset() {
    this.time = 0;
    this.xp = 0;
    this.gold = 0;
    this.kills = 0;
    this.healing = 0;
    this.damage = { knight:0, druid:0, sorcerer:0 };
    this.loot = {};
  }

  setTime(value: number) {
    this.time = Number.isFinite(value) && value >= 0 ? value : 0;
  }

  apply(event: CombatEvent) {
    const amount = safeAmount(event.data?.amount);
    if (
      event.type === 'damage' &&
      event.sourceId &&
      heroIds.has(event.sourceId)
    ) {
      this.damage[event.sourceId] =
        safeAmount(this.damage[event.sourceId]) + amount;
    }
    if (event.type === 'heal') this.healing += amount;
    if (
      event.type === 'death' &&
      event.targetId &&
      !heroIds.has(event.targetId)
    ) {
      this.kills++;
    }
    if (event.type === 'experience') this.xp += amount;
    if (event.type === 'loot' && event.data?.item) {
      const quantity = safeAmount(event.data.quantity);
      this.loot[event.data.item] =
        safeAmount(this.loot[event.data.item]) + quantity;
      if (event.data.item === 'Gold coin') this.gold += quantity;
    }
  }
}
