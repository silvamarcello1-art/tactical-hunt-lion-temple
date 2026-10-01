import { grownStats, progressFromTotal } from './Progression';
import type { HeroProgress, Vocation } from '../data/progression';
import { itemById, type EquipmentSlot, type ItemStat, type Modifiers } from '../data/items';
import type { EntitySnapshot } from '../events/types';

export interface ItemInstance { id:string; definitionId:string; quantity:number; upgrade:0|1 }
export type Loadout=Partial<Record<Vocation,Partial<Record<EquipmentSlot,ItemInstance>>>>;
export const statKeys:ItemStat[]=['attack','magicPower','defense','maxHp','maxMana'];
export function itemModifiers(item:ItemInstance):Modifiers {
  const definition=itemById(item.definitionId);
  if(!definition) return {};
  return Object.fromEntries(statKeys.map(stat=>[stat,(definition.modifiers[stat]??0)+(item.upgrade===1?definition.improvement[stat]??0:0)]));
}
/** Always recompute from canonical base, level/passives and catalog, never saved stats. */
export function effectiveStats(base:EntitySnapshot,progress:HeroProgress=progressFromTotal(0),loadout:Loadout={}) {
  const stats=grownStats(base,progress);
  for(const [slot,item] of Object.entries(loadout[base.role as Vocation]??{})) {
    const def=itemById(item.definitionId);
    if(!def || def.slot!==slot || !def.vocations.includes(base.role as Vocation)) continue;
    const modifiers=itemModifiers(item);
    for(const stat of statKeys) stats[stat]+=modifiers[stat]??0;
  }
  for(const stat of statKeys) stats[stat]=Math.max(stat==='maxHp'?1:0,stats[stat]);
  return stats;
}
export function applyEffectiveStats(entity:EntitySnapshot,stats:ReturnType<typeof effectiveStats>) {
  const hp=entity.hp, mana=entity.mana;
  Object.assign(entity,stats,{hp:Math.min(hp,stats.maxHp),mana:Math.min(mana,stats.maxMana)});
}
