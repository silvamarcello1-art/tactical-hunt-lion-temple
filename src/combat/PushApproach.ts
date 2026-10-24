import {Pathfinder} from './grid/Pathfinder';
import {GridMap} from './grid/GridMap';
import {OccupancyGrid} from './grid/OccupancyGrid';
import {gridDistance,sameGridPosition,type GridPosition} from './grid/GridTypes';
/** Read-only synchronous A* plan; never reserves target's destination. */
export function pushApproach(map:GridMap,occupancy:OccupancyGrid,sourceId:string,from:GridPosition,target:GridPosition,destination:GridPosition){
  const finder=new Pathfinder(map,occupancy);
  const choices=[];
  for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)if(x||y){
    const tile={x:target.x+x,y:target.y+y};
    if(sameGridPosition(tile,destination)||!occupancy.canEnter(sourceId,tile).allowed)continue;
    const path=finder.findPath(from,tile,{entityId:sourceId,forbidden:[target,destination]});
    if(path.length||sameGridPosition(from,tile))choices.push({tile,path,cost:path.reduce((sum,p,i)=>sum+(i?gridDistance(path[i-1],p):gridDistance(from,p)),0)});
  }
  return choices.sort((a,b)=>a.cost-b.cost||a.tile.y-b.tile.y||a.tile.x-b.tile.x)[0];
}
