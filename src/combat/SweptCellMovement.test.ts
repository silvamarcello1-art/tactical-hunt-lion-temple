import {describe,it,expect} from 'vitest';
import {GridMap} from './grid/GridMap';
import {OccupancyGrid} from './grid/OccupancyGrid';
import {MovementSystem} from './grid/MovementSystem';
import {createGridMetrics} from './grid/GridTypes';
import {PushSystem} from './PushSystem';
const setup=()=>{const map=new GridMap(8,8),occupancy=new OccupancyGrid(map),movement=new MovementSystem(map,occupancy,createGridMetrics());occupancy.occupy('a',{x:1,y:1});occupancy.occupy('b',{x:3,y:1});return {map,occupancy,movement};};
const diagonal={entityId:'a',from:{x:1,y:1},destination:{x:2,y:2},now:0,duration:250,sessionId:'test',reserveTransit:true,revalidateCorners:true};
describe('diagonal transit cells stay protected until commit',()=>{
  it('reserves both swept corners so another actor cannot step through the moving body',()=>{
    const {occupancy,movement}=setup();expect(movement.step(diagonal).moved).toBe(true);
    expect(occupancy.reservedBy({x:2,y:1})).toBe('a');expect(occupancy.reservedBy({x:1,y:2})).toBe('a');
    const result=movement.step({entityId:'b',from:{x:3,y:1},destination:{x:2,y:1},now:50,duration:220,sessionId:'test'});
    expect(result.moved).toBe(false);expect(result.reason).toBe('reserved');
    expect(occupancy.positionOf('a')).toEqual({x:1,y:1});expect(occupancy.positionOf('b')).toEqual({x:3,y:1});
  });
  it('releases transit corners after a normal commit and allows a later adjacent step',()=>{
    const {occupancy,movement}=setup();movement.step(diagonal);
    expect(movement.completeDue(250,'test')[0].status).toBe('completed');
    expect(occupancy.positionOf('a')).toEqual({x:2,y:2});expect(occupancy.reservedBy({x:2,y:1})).toBeUndefined();expect(occupancy.reservedBy({x:1,y:2})).toBeUndefined();
    expect(movement.step({entityId:'b',from:{x:3,y:1},destination:{x:2,y:1},now:250,duration:220,sessionId:'test'}).moved).toBe(true);
  });
  it('cancels stale or interrupted movement without leaking any transit reservations',()=>{
    for(const stale of [false,true]){const {occupancy,movement}=setup();movement.step(diagonal);
      if(stale)expect(movement.completeDue(250,'other')[0].reason).toBe('stale-session');else movement.cancel('a');
      for(const tile of [{x:2,y:2},{x:2,y:1},{x:1,y:2}])expect(occupancy.reservedBy(tile)).toBeUndefined();
      expect(occupancy.positionOf('a')).toEqual({x:1,y:1});expect(occupancy.reservedEntries()).toEqual([]);
    }
  });
  it('preserves the opt-out legacy reservation contract used by historical timeline fixtures',()=>{
    const {occupancy,movement}=setup();movement.step({...diagonal,reserveTransit:false});
    expect(occupancy.reservedBy({x:2,y:2})).toBe('a');expect(occupancy.reservedBy({x:2,y:1})).toBeUndefined();
  });
  it('rejects a blocked transit claim atomically without losing the prior reservation',()=>{
    const {occupancy}=setup();occupancy.reserve('a',{x:1,y:2});
    expect(occupancy.reserve('a',{x:2,y:2},undefined,[{x:3,y:1}]).allowed).toBe(false);
    expect(occupancy.reservationOf('a')).toEqual({x:1,y:2});expect(occupancy.reservedBy({x:2,y:2})).toBeUndefined();
    occupancy.cancelReservation('a');expect(occupancy.reservedTileEntries()).toEqual([]);
  });
  it('blocks a push into a corner crossed by another committed diagonal',()=>{
    const {map,occupancy,movement}=setup();movement.step(diagonal);
    const push=new PushSystem(map,occupancy);
    expect(push.readiness({id:'c',alive:true,tileX:4,tileY:1},{id:'b',alive:true,tileX:3,tileY:1},{x:2,y:1},50)).toBe('blocked');
  });
});
