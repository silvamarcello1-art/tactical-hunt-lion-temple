import {describe,expect,it} from 'vitest';
import {GridMap} from './GridMap';
import {OccupancyGrid} from './OccupancyGrid';
import {LineOfSightResolver} from './LineOfSightResolver';

describe('streamed supercover visibility',()=>{
  it('returns independent traces and retains directional corner order',()=>{
    const map=new GridMap(30,20),los=new LineOfSightResolver(map,new OccupancyGrid(map));
    const from={x:2,y:2},to={x:4,y:4};
    const expected=[{x:2,y:2},{x:3,y:2},{x:2,y:3},{x:3,y:3},{x:4,y:3},{x:3,y:4},{x:4,y:4}];
    const trace=los.trace(from,to);expect(trace).toEqual(expected);
    trace[0].x=99;trace.pop();expect(los.trace(from,to)).toEqual(expected);
    expect(los.trace(to,from)[0]).toEqual(to);
    // Repeated queries never mutate the returned geometry.
    for(let x=0;x<30;x++)for(let y=0;y<20;y++)los.trace(from,{x,y});
    expect(los.trace(from,to)).toEqual(expected);
  });
  it('revalidates walls, units and call options without retaining grid state',()=>{
    const map=new GridMap(10,10),occupancy=new OccupancyGrid(map),los=new LineOfSightResolver(map,occupancy);
    const from={x:2,y:2},to={x:5,y:2},middle={x:3,y:2};
    expect(los.hasLineOfSight(from,to)).toBe(true);
    map.setBlocked(middle,true);expect(los.hasLineOfSight(from,to)).toBe(false);
    map.setBlocked(middle,false);expect(los.hasLineOfSight(from,to)).toBe(true);
    occupancy.occupy('bot',middle);
    expect(los.hasLineOfSight(from,to,{blockUnits:true})).toBe(false);
    expect(los.hasLineOfSight(from,to,{blockUnits:true,ignoreEntityIds:['bot']})).toBe(true);
    expect(los.hasLineOfSight(from,to)).toBe(true);
    occupancy.release('bot');expect(los.hasLineOfSight(from,to,{blockUnits:true})).toBe(true);
    map.setBlocked(to,true);expect(los.hasLineOfSight(from,to)).toBe(false);
    expect(los.hasLineOfSight(from,to,{allowBlockedEndpoint:true})).toBe(true);
    map.setBlocked(from,true);expect(los.hasLineOfSight(from,to,{allowBlockedEndpoint:true,blockOrigin:true})).toBe(false);
  });
});
