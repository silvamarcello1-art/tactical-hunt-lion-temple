import type {EntitySnapshot} from '../events/types';
import {gridToWorld} from '../combat/tiles';
/** Sparring uses the existing caster AI and art. Not a networked player. */
export const trainingFloors:EntitySnapshot[][]=[[{
  id:'training-sparring',name:'Sparring Arcano · BOT',description:'Bot local: preserva distância e linha de tiro. Use paredes para cortar sua linha.',
  role:'monster',archetype:'caster',hp:1800,maxHp:1800,mana:800,maxMana:800,attack:24,defense:12,crit:0,dodge:0,
  tileX:15,tileY:9,position:gridToWorld({x:15,y:9}),color:0xa79bc9,rewardSuppressed:true,
}]];
