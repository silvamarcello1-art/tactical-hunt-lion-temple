import {polishedFloors} from './config';
import type {EntitySnapshot} from '../events/types';

/** Explicit production profile: legacy/polished fixtures stay reproducible.
 * Reinforcements keep the existing reward budget; no price/save migration.
 */
export const HUNT_PROFILE_VERSION='sqm-pressure-v1';
export const HUNT_PRESSURE={counts:[5,6,8,5],hp:[1,1.02,1.04,1.06],attack:[1,1.01,1.02,1.03]} as const;
const extraSpawns:readonly (readonly {template:string;id:string;x:number;y:number}[])[]=[
  [],
  [{template:'lion-5',id:'pressure-flanker-2',x:20,y:13}],
  [{template:'lion-8',id:'pressure-flanker-3',x:20,y:13},{template:'mage-4',id:'pressure-caster-3',x:24,y:12}],
  [{template:'guard-1',id:'pressure-guard-3',x:24,y:6},{template:'guard-2',id:'pressure-guard-4',x:24,y:12}],
];
export const progressiveHuntFloors:EntitySnapshot[][]=polishedFloors.map((source,index)=>{
  const floor=source.map(enemy=>structuredClone(enemy));
  for(const spawn of extraSpawns[index]){
    const template=source.find(enemy=>enemy.id===spawn.template)!;
    const hp=180+index*20;
    floor.push({...structuredClone(template),id:spawn.id,hp,maxHp:hp,attack:18+index*2,tileX:spawn.x,tileY:spawn.y,position:{x:spawn.x*32,y:spawn.y*32},rewardSuppressed:true});
  }
  return floor.map(enemy=>({...enemy,hp:Math.round(enemy.hp*HUNT_PRESSURE.hp[index]),maxHp:Math.round(enemy.maxHp*HUNT_PRESSURE.hp[index]),attack:Math.round(enemy.attack*HUNT_PRESSURE.attack[index])}));
});
