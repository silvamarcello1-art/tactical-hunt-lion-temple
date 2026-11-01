import {describe,it,expect} from 'vitest';
import {PushSystem,type PushActor} from './PushSystem';
import {GridMap} from './grid/GridMap';
import {OccupancyGrid} from './grid/OccupancyGrid';
const setup=()=>{
  const map=new GridMap(12,12),occupancy=new OccupancyGrid(map),pushes=new PushSystem(map,occupancy);
  const source:PushActor={id:'knight',alive:true,tileX:2,tileY:2},target:PushActor={id:'bot',alive:true,tileX:3,tileY:2};
  occupancy.occupy(source.id,{x:2,y:2});occupancy.occupy(target.id,{x:3,y:2});
  return {map,occupancy,pushes,source,target};
};
describe('delayed authoritative push intents',()=>{
  it('previews only eight neighbours, up to seven free when the pusher occupies one; never seven tiles away',()=>{
    const {pushes,source,target,occupancy}=setup();source.tileY=1;occupancy.occupy(source.id,{x:2,y:1});
    const preview=pushes.preview(source,target,0)!;
    expect(preview.destinations).toHaveLength(8);expect(preview.destinations.filter(d=>d.ready)).toHaveLength(7);
    expect(preview.destinations.some(d=>d.tile.x===3&&d.tile.y===2)).toBe(false);
    expect(pushes.validate(source,target,{x:10,y:2})).toBe('invalid-destination');
    expect(pushes.validate(source,target,{x:2,y:1})).toBe('blocked');
    preview.destinations[0].tile.x=99;expect(pushes.preview(source,target,0)!.destinations[0].tile.x).not.toBe(99);
    pushes.queue('p','s',source,target,{x:4,y:2},0);
    expect(pushes.preview(source,target,10)!.destinations.every(d=>!d.ready)).toBe(true);expect(pushes.size).toBe(1);
  });
  it('waits a logical second, returns copies and leaves displacement to MovementSystem',()=>{
    const {pushes,source,target,occupancy}=setup();const result=pushes.queue('p','s',source,target,{x:4,y:2},0);
    expect(result.reason).toBe('ok');result.push!.destination.x=10;
    expect(pushes.resolve(999,'s',[source,target])).toEqual([]);
    expect(pushes.resolve(1000,'s',[source,target])).toMatchObject([{reason:'ok',push:{destination:{x:4,y:2}}}]);
    expect(occupancy.positionOf(target.id)).toEqual({x:3,y:2});expect(pushes.size).toBe(0);
  });
  it.each(['moved','dead','moving','source-away','stale','blocked'] as const)('cancels after %s without any orphan reservation',kind=>{
    const {map,pushes,source,target,occupancy}=setup();pushes.queue('p','s',source,target,{x:4,y:2},0);
    if(kind==='moved')target.tileY++;if(kind==='dead')target.alive=false;if(kind==='moving')target.moving=true;
    if(kind==='source-away')source.tileX=8;if(kind==='blocked')map.setBlocked({x:4,y:2},true);
    expect(pushes.resolve(1000,kind==='stale'?'new':'s',[source,target])[0].reason).not.toBe('ok');
    expect(pushes.size).toBe(0);expect(occupancy.reservedEntries()).toEqual([]);
  });
  it('rejects walls, occupancy, reservations, diagonal corner cutting and unpushable targets',()=>{
    const {map,pushes,source,target,occupancy}=setup();
    expect(pushes.validate(source,{...target,pushable:false},{x:4,y:2})).toBe('not-pushable');
    expect(pushes.validate(source,source,{x:2,y:3})).toBe('self-push');
    expect(pushes.validate(source,target,{x:8,y:2})).toBe('invalid-destination');
    occupancy.occupy('third',{x:4,y:2});expect(pushes.validate(source,target,{x:4,y:2})).toBe('blocked');occupancy.release('third');
    occupancy.reserve('third',{x:4,y:2});expect(pushes.validate(source,target,{x:4,y:2})).toBe('blocked');occupancy.cancelReservation('third');
    map.setBlocked({x:4,y:2},true);expect(pushes.validate(source,target,{x:4,y:3})).toBe('blocked');
  });
  it('honours target footprints and never queues spam, stop/reset clear pending work',()=>{
    const {pushes,source,target,occupancy,map}=setup();
    occupancy.occupy(target.id,{x:3,y:2},{width:2,height:1});map.setBlocked({x:5,y:2},true);
    expect(pushes.validate(source,target,{x:4,y:2})).toBe('blocked');map.setBlocked({x:5,y:2},false);
    expect(pushes.queue('p','s',source,target,{x:4,y:2},0).reason).toBe('ok');
    expect(pushes.queue('p2','s',source,target,{x:4,y:2},10).reason).toBe('push-cooldown');
    expect(pushes.cancelSource(source.id)).toHaveLength(1);expect(pushes.size).toBe(0);
    pushes.clear();expect(pushes.queue('p3','new',source,target,{x:4,y:2},0).reason).toBe('ok');
  });
});
