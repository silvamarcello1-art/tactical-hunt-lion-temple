import type { Direction } from '../events/types';
import { gridDistance,gridKey,type GridPosition } from './grid/GridTypes';

/** Bounded, deterministic look-ahead. Only current authoritative positions are inputs. */
export function chooseDirectionalAttack(origin:GridPosition,candidates:GridPosition[],
  heroes:{id:string;tile:GridPosition}[],targetId:string|undefined,
  mask:(tile:GridPosition,facing:Direction)=>GridPosition[]) {
  const choices=candidates.flatMap(tile=>(['up','right','down','left'] as Direction[]).map(facing=>{
    const tiles=mask(tile,facing);const keys=new Set(tiles.map(gridKey));
    const hits=heroes.filter(hero=>keys.has(gridKey(hero.tile)));
    return {tile,facing,tiles,hits:hits.length,score:hits.length*100+Number(hits.some(h=>h.id===targetId))*10-gridDistance(origin,tile)*12};
  }));
  return choices.sort((a,b)=>b.score-a.score)[0];
}
