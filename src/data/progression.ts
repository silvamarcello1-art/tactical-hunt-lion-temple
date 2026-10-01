export type Vocation = 'knight' | 'druid' | 'sorcerer';
export interface HeroProgress { level:number; xp:number; totalXp:number; xpToNextLevel:number }
export type PartyProgress = Record<string,HeroProgress>;
export const PROGRESSION = {maxLevel:100,baseThreshold:500,thresholdGrowth:.35,monsterXp:160,bossXp:1200,floorXp:120} as const;
export const growth:Record<Vocation,{maxHp:number;maxMana:number;attack:number;magicPower:number;defense:number}> = {
  knight:{maxHp:55,maxMana:12,attack:4,magicPower:2,defense:2},
  druid:{maxHp:22,maxMana:50,attack:2,magicPower:5,defense:1},
  sorcerer:{maxHp:18,maxMana:42,attack:2,magicPower:7,defense:1},
};
export interface PassiveDefinition {
  id:string; vocation:Vocation; name:string; description:string; unlockLevel:number;
  effect:{stat:'defense'|'healing'|'magicPower';amount:number};
}
export const passives:PassiveDefinition[] = [
  {id:'iron-oath',vocation:'knight',name:'Juramento de Ferro',description:'+4 de defesa.',unlockLevel:2,effect:{stat:'defense',amount:4}},
  {id:'living-thread',vocation:'druid',name:'Fio Vital',description:'+6% de cura.',unlockLevel:2,effect:{stat:'healing',amount:.06}},
  {id:'resonance',vocation:'sorcerer',name:'Ressonância',description:'+4% de poder mágico.',unlockLevel:2,effect:{stat:'magicPower',amount:.04}},
];
