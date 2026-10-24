import type {EntitySnapshot} from '../events/types';
import {gridToWorld} from '../combat/tiles';
/** Sparring uses the existing caster AI and art. Not a networked player. */
export const trainingFloors:EntitySnapshot[][]=[[{
  id:'training-sparring',name:'Sparring Arcano · BOT',description:'Bot local: preserva distância e linha de tiro. Use paredes para cortar sua linha.',
  role:'monster',archetype:'caster',hp:1800,maxHp:1800,mana:800,maxMana:800,attack:24,defense:12,crit:0,dodge:0,
  tileX:15,tileY:9,position:gridToWorld({x:15,y:9}),color:0xa79bc9,rewardSuppressed:true,
}]];

/** Three opponents, same spell/rune pipeline as heroes; never player-owned. */
export const trainingTeamFloors:EntitySnapshot[][]=[[
  {...trainingFloors[0][0],name:'Veyra · BOT',trainingVocation:'sorcerer',hp:1150,maxHp:1150,mana:1350,maxMana:1350,attack:66,magicPower:66},
  {id:'training-vanguard',name:'Brann · BOT',role:'monster',trainingVocation:'knight',hp:1550,maxHp:1550,mana:720,maxMana:720,attack:82,defense:32,crit:.06,dodge:.03,tileX:19,tileY:6,position:gridToWorld({x:19,y:6}),color:0xc2846b,rewardSuppressed:true},
  {id:'training-warden',name:'Selya · BOT',role:'monster',trainingVocation:'druid',hp:1050,maxHp:1050,mana:1600,maxMana:1600,attack:54,magicPower:54,defense:18,crit:.05,dodge:.04,tileX:21,tileY:12,position:gridToWorld({x:21,y:12}),color:0x75a789,rewardSuppressed:true},
]];

/** Lowest HP percentage, then absolute HP, distance and stable ID. No RNG. */
export function weakestTrainingTarget<T extends {id:string;hp:number;maxHp:number;tileX:number;tileY:number;alive:boolean}>(source:{tileX:number;tileY:number},candidates:readonly T[]):T|undefined {
  const distance=(a:T)=>Math.max(Math.abs(source.tileX-a.tileX),Math.abs(source.tileY-a.tileY));
  return candidates.filter(a=>a.alive).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.hp-b.hp||distance(a)-distance(b)||a.id.localeCompare(b.id))[0];
}
