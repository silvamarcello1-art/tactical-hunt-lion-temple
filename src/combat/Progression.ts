import { growth, passives, PROGRESSION, type HeroProgress, type Vocation } from '../data/progression';
import type { EntitySnapshot } from '../events/types';

export const xpThreshold = (level:number) => Math.round(PROGRESSION.baseThreshold*(1+(level-1)*PROGRESSION.thresholdGrowth));
/** Total XP is canonical. Never trust saved level, derived stats or threshold. */
export function progressFromTotal(total:number):HeroProgress {
  const totalXp = Number.isSafeInteger(total) && total >= 0 ? Math.min(total,100_000_000) : 0;
  let xp = totalXp; let level = 1;
  while (level < PROGRESSION.maxLevel && xp >= xpThreshold(level)) {xp -= xpThreshold(level);level++;}
  return {level,xp:level === PROGRESSION.maxLevel ? 0 : xp,totalXp,xpToNextLevel:level === PROGRESSION.maxLevel ? 0 : xpThreshold(level)};
}
export function awardXp(progress:HeroProgress,amount:number) {
  if (!Number.isSafeInteger(amount) || amount < 0) return progressFromTotal(progress.totalXp);
  return progressFromTotal(progress.totalXp+amount);
}
export function passiveAmount(role:Vocation,level:number,stat:'defense'|'healing'|'magicPower') {
  return passives.filter(p=>p.vocation===role && level>=p.unlockLevel && p.effect.stat===stat).reduce((sum,p)=>sum+p.effect.amount,0);
}
export function grownStats(base:EntitySnapshot,progress:HeroProgress) {
  const role = base.role as Vocation; const step = growth[role]; const levels=progress.level-1;
  return {
    maxHp:base.maxHp+step.maxHp*levels,maxMana:base.maxMana+step.maxMana*levels,
    attack:base.attack+step.attack*levels,
    magicPower:(base.attack+step.magicPower*levels)*(1+passiveAmount(role,progress.level,'magicPower')),
    defense:base.defense+step.defense*levels+passiveAmount(role,progress.level,'defense'),
  };
}
