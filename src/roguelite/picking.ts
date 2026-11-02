import type {Point} from '../events/types';
export interface GroundedBody {id:string;left:number;right:number;top:number;bottom:number}
/** Visual picking only. The returned ID is revalidated by PlayerCommand. */
export function pickGroundedBody(point:Point,bodies:readonly GroundedBody[]):string|undefined {
  return [...bodies].sort((a,b)=>b.bottom-a.bottom||a.id.localeCompare(b.id)).find(b=>point.x>=b.left&&point.x<=b.right&&point.y>=b.top&&point.y<=b.bottom)?.id;
}
