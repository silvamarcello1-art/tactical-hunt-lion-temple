import { GridMap } from './grid/GridMap';
import { OccupancyGrid } from './grid/OccupancyGrid';
import { gridKey,type GridPosition } from './grid/GridTypes';

/** Owns ONLY newly blocked tiles. Never blocks occupied footprints or erases original walls. */
export class TemporaryTerrain {
  private tiles=new Map<string,{tile:GridPosition;until:number}>();
  constructor(private map:GridMap,private occupancy:OccupancyGrid){}
  block(candidates:GridPosition[],until:number) {
    const added:GridPosition[]=[];
    for(const tile of candidates) {
      // Reservations may be invalidated; occupied origins must remain legal.
      if(!this.map.isWalkable(tile)||this.occupancy.canEnter('__terrain__',tile).reason==='occupied') continue;
      this.map.setBlocked(tile,true);this.tiles.set(gridKey(tile),{tile:{...tile},until});added.push({...tile});
    }
    return added;
  }
  restore(now=Infinity) {
    const removed:GridPosition[]=[];
    for(const [key,value] of this.tiles) if(value.until<=now) {
      this.map.setBlocked(value.tile,false);this.tiles.delete(key);removed.push(value.tile);
    }
    return removed;
  }
  get size(){return this.tiles.size;}
}
