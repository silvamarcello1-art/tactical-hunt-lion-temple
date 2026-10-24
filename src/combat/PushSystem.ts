import {GridMap} from './grid/GridMap';
import {OccupancyGrid} from './grid/OccupancyGrid';
import {gridDistance,sameGridPosition,type GridPosition} from './grid/GridTypes';

export const TRAINING_PUSH={delay:1000,cooldown:2000,skipAttack:2000};
export interface PushActor {id:string;alive:boolean;tileX:number;tileY:number;pushable?:boolean;moving?:boolean}
export interface PendingPush {id:string;sessionId:string;sourceId:string;targetId:string;origin:GridPosition;destination:GridPosition;completesAt:number}
export interface PushPreview {origin:GridPosition;destinations:{tile:GridPosition;ready:boolean;reason:string;needsApproach?:boolean}[]}
const pos=(a:PushActor)=>({x:a.tileX,y:a.tileY});
const copy=(p:PendingPush)=>({...p,origin:{...p.origin},destination:{...p.destination}});
/** Delayed intent only. Actual displacement is reserved/committed by MovementSystem. */
export class PushSystem {
  private readonly pending=new Map<string,PendingPush>();
  private readonly cooldowns=new Map<string,number>();
  constructor(private readonly map:GridMap,private readonly occupancy:OccupancyGrid){}
  validate(source:PushActor|undefined,target:PushActor|undefined,to:GridPosition,allowApproach=false){
    if(!source?.alive||!target?.alive)return 'invalid-target';
    if(target.pushable===false)return 'not-pushable';
    if(source.id===target.id)return 'self-push';
    if(!allowApproach&&gridDistance(pos(source),pos(target))>1)return 'out-of-range';
    if(gridDistance(pos(target),to)!==1||!this.map.isInside(to))return 'invalid-destination';
    const can=(tile:GridPosition)=>this.occupancy.canEnter(target.id,tile,this.occupancy.footprintOf(target.id)).allowed;
    if(!can(to)||to.x!==target.tileX&&to.y!==target.tileY&&(!can({x:to.x,y:target.tileY})||!can({x:target.tileX,y:to.y})))return 'blocked';
    return 'ok';
  }
  readiness(source:PushActor|undefined,target:PushActor|undefined,to:GridPosition,now:number,allowApproach=false){
    const reason=this.validate(source,target,to,allowApproach);if(reason!=='ok')return reason;
    if((this.cooldowns.get(source!.id)??0)>now)return 'push-cooldown';
    if([...this.pending.values()].some(p=>p.sourceId===source!.id||p.targetId===target!.id))return 'push-pending';
    return 'ok';
  }
  preview(source:PushActor|undefined,target:PushActor|undefined,now:number,allowApproach=false):PushPreview|undefined{
    if(!target)return;
    const destinations=[];
    for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)if(x||y){
      const tile={x:target.tileX+x,y:target.tileY+y},reason=this.readiness(source,target,tile,now,allowApproach);
      destinations.push({tile,reason,ready:reason==='ok',needsApproach:!!source&&gridDistance(pos(source),pos(target))>1});
    }
    return {origin:pos(target),destinations};
  }
  queue(id:string,sessionId:string,source:PushActor,target:PushActor,to:GridPosition,now:number){
    const reason=this.readiness(source,target,to,now);if(reason!=='ok')return {reason};
    const push={id,sessionId,sourceId:source.id,targetId:target.id,origin:pos(target),destination:{...to},completesAt:now+TRAINING_PUSH.delay};
    this.pending.set(id,push);this.cooldowns.set(source.id,now+TRAINING_PUSH.cooldown);
    return {reason:'ok',push:copy(push)};
  }
  resolve(now:number,sessionId:string,actors:readonly PushActor[]){
    return [...this.pending.values()].filter(p=>p.completesAt<=now).sort((a,b)=>a.completesAt-b.completesAt||a.id.localeCompare(b.id)).map(push=>{
      this.pending.delete(push.id);
      const source=actors.find(a=>a.id===push.sourceId),target=actors.find(a=>a.id===push.targetId);
      const reason=push.sessionId!==sessionId?'stale-session':!target?.alive?'target-dead':!sameGridPosition(pos(target),push.origin)?'target-moved':target.moving?'moving':this.validate(source,target,push.destination);
      return {push:copy(push),reason};
    });
  }
  deadlines(){return [...this.pending.values()].map(p=>p.completesAt);}
  cancelSource(sourceId:string){const pushes=[...this.pending.values()].filter(p=>p.sourceId===sourceId);for(const p of pushes)this.pending.delete(p.id);return pushes.map(copy);}
  clear(){const p=[...this.pending.values()].map(copy);this.pending.clear();this.cooldowns.clear();return p;}
  get size(){return this.pending.size;}
}
