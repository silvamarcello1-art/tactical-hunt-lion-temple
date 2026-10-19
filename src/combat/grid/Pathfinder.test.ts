import {describe,it,expect} from 'vitest';
import {GridMap} from './GridMap';
import {OccupancyGrid} from './OccupancyGrid';
import {Pathfinder} from './Pathfinder';
describe('deterministic A* priority ordering',()=>{
  it('keeps the same route through a detour under repeated searches',()=>{
    const map=new GridMap(20,16,undefined,Array.from({length:13},(_,y)=>({x:8,y}))),occupancy=new OccupancyGrid(map);
    occupancy.occupy('a',{x:2,y:6});const p=new Pathfinder(map,occupancy);
    const path=p.findPath({x:2,y:6},{x:17,y:6},{entityId:'a'});
    // Captured from the unchanged sort/shift implementation before the queue optimization.
    expect(path).toEqual([[3,7],[4,8],[5,9],[6,10],[7,11],[7,12],[7,13],[8,13],[9,13],[10,13],[11,12],[12,11],[13,10],[14,9],[15,8],[16,7],[17,6]].map(([x,y])=>({x,y})));
    expect(path.at(-1)).toEqual({x:17,y:6});expect(path.some(tile=>tile.y===13)).toBe(true);
    const start=performance.now();
    for(let i=0;i<200;i++)expect(p.findPath({x:2,y:6},{x:17,y:6},{entityId:'a'})).toEqual(path);
    console.info('A* detour fixture / 200 searches',{ms:performance.now()-start,path});
  });
});
