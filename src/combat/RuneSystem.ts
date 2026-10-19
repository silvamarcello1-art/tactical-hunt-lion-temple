import {TRAINING_FIELD,type RuneId} from '../data/runes';
import {GridMap} from './grid/GridMap';
import {OccupancyGrid} from './grid/OccupancyGrid';
import {gridKey,type GridPosition} from './grid/GridTypes';

export interface RuneTile {id:string;runeId:RuneId;sourceId:string;sessionId:string;tile:GridPosition;startedAt:number;expiresAt:number}
type Actor = {id:string;tileX:number;tileY:number;alive:boolean;role:string};
export interface RuneHit {sourceId:string;targetId:string;amount:number;castId:string}
type Burn={sourceId:string;targetId:string;castId:string;until:number;nextTick:number};
/** One session owns temporary rune terrain and non-stacking burning conditions. No DOM/timers/RNG. */
export class RuneSystem {
  private active=new Map<string,RuneTile>();
  private burns=new Map<string,Burn>();
  constructor(private map:GridMap,private occupancy:OccupancyGrid){}
  get tiles(){return [...this.active.values()].map(r=>({...r,tile:{...r.tile}}));}
  place(rune:RuneTile):boolean {
    if(!this.map.isWalkable(rune.tile)||this.active.has(gridKey(rune.tile)))return false;
    if(rune.runeId==='magic_wall'&&this.occupancy.occupantAt(rune.tile))return false;
    this.active.set(gridKey(rune.tile),{...rune,tile:{...rune.tile}});
    if(rune.runeId==='magic_wall')this.map.setBlocked(rune.tile,true);
    return true;
  }
  expire(now:number) {
    const removed:RuneTile[]=[];
    for(const [key,rune] of this.active)if(rune.expiresAt<=now){
      if(rune.runeId==='magic_wall')this.map.setBlocked(rune.tile,false);
      this.active.delete(key);removed.push({...rune,tile:{...rune.tile}});
    }
    return removed;
  }
  resolve(now:number,actors:readonly Actor[]):RuneHit[] {
    const hits:RuneHit[]=[];
    const hero=(actor:Actor)=>['knight','druid','sorcerer'].includes(actor.role);
    for(const field of this.active.values())if(field.runeId==='fire_field'&&field.expiresAt>now){
      const source=actors.find(a=>a.id===field.sourceId);
      if(!source)continue;
      for(const target of actors)if(target.alive&&hero(target)!==hero(source)&&gridKey({x:target.tileX,y:target.tileY})===gridKey(field.tile)){
        let burn=this.burns.get(target.id);
        if(!burn){
          hits.push({sourceId:field.sourceId,targetId:target.id,amount:TRAINING_FIELD.entryDamage,castId:field.id});
          burn={sourceId:field.sourceId,targetId:target.id,castId:field.id,until:now+TRAINING_FIELD.burnMs,nextTick:now+TRAINING_FIELD.tickMs};
          this.burns.set(target.id,burn);
        }
        burn.until=Math.max(burn.until,now+TRAINING_FIELD.burnMs);
      }
    }
    for(const [id,burn] of this.burns){
      if(!actors.some(a=>a.id===id&&a.alive)){this.burns.delete(id);continue;}
      while(burn.nextTick<=now&&burn.nextTick<=burn.until){
        hits.push({sourceId:burn.sourceId,targetId:id,amount:TRAINING_FIELD.tickDamage,castId:burn.castId});burn.nextTick+=TRAINING_FIELD.tickMs;
      }
      if(now>=burn.until)this.burns.delete(id);
    }
    return hits;
  }
  deadlines(now:number){return [...this.active.values()].map(r=>r.expiresAt).concat([...this.burns.values()].map(b=>Math.min(b.nextTick,b.until))).filter(t=>t>now);}
  clear(){const removed=this.expire(Infinity);this.burns.clear();return removed;}
  get conditionCount(){return this.burns.size;}
}
