import { items } from '../data/items';
import type { ItemInstance } from './Equipment';

/** Same LCG as combat, isolated stream: new loot must not consume combat rolls. */
export class EquipmentDrops {
  constructor(private seed:number,private sessionId:string) {
    // Session identity varies rewards between hunts while keeping replay exact.
    // This does not touch CombatEngine's random stream or encounter baseline.
    for(const character of sessionId) this.seed=Math.imul(this.seed ^ character.charCodeAt(0),16777619)>>>0;
  }
  private roll(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
  forKill(enemyId:string,boss:boolean):ItemInstance[] {
    const definitions:string[]=[];
    if(boss) {
      for(const role of ['knight','druid','sorcerer'] as const) {
        const choices=items.filter(item=>item.slot==='weapon' && item.vocations.includes(role));
        definitions.push(choices[Math.floor(this.roll()*choices.length)].id);
      }
      definitions.push(this.roll()<.5?'iron-coat':'woven-mantle','temple-ember');
    } else if(this.roll()<.18) definitions.push(this.roll()<.5?'iron-coat':'woven-mantle');
    return definitions.map((definitionId,index)=>({id:`${this.sessionId}:${enemyId}:drop:${index}`,definitionId,quantity:definitionId==='temple-ember'?3:1,upgrade:0}));
  }
}
