import type { GridPoint, Point } from '../events/types';

const directions:Record<string,Point> = {
  KeyW:{x:0,y:-1}, ArrowUp:{x:0,y:-1}, KeyS:{x:0,y:1}, ArrowDown:{x:0,y:1},
  KeyA:{x:-1,y:0}, ArrowLeft:{x:-1,y:0}, KeyD:{x:1,y:0}, ArrowRight:{x:1,y:0},
};

/** OS repeats only update a set; one step is sampled per domain tick. */
export class HeldInput {
  private keys = new Set<string>();
  press(code:string) { if (!(code in directions)) return false; this.keys.add(code); return true; }
  release(code:string) { return this.keys.delete(code); }
  clear() { this.keys.clear(); }
  get size() { return this.keys.size; }
  direction():Point {
    const values = [...this.keys].map(code => directions[code]);
    // W + Up is one north direction, even while S is also pressed.
    return {
      x:Number(values.some(d => d.x === 1)) - Number(values.some(d => d.x === -1)),
      y:Number(values.some(d => d.y === 1)) - Number(values.some(d => d.y === -1)),
    };
  }
}

export function editableTarget(target:EventTarget | null) {
  return target instanceof Element && !!target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),dialog[open]');
}

export interface CameraTransform { x:number; y:number; zoom:number }
export function screenToTile(
  point:Point, bounds:{left:number;top:number;width:number;height:number},
  viewport:{width:number;height:number}, camera:CameraTransform = {x:0,y:0,zoom:1},
):GridPoint | undefined {
  if (bounds.width <= 0 || bounds.height <= 0 || !Number.isFinite(camera.zoom) || camera.zoom <= 0 ||
    point.x < bounds.left || point.y < bounds.top || point.x >= bounds.left + bounds.width || point.y >= bounds.top + bounds.height) return;
  const x = ((point.x-bounds.left)*viewport.width/bounds.width)/camera.zoom + camera.x;
  const y = ((point.y-bounds.top)*viewport.height/bounds.height)/camera.zoom + camera.y;
  // Existing map convention: integer tile coordinates denote footpoint centers.
  return {x:Math.round(x/32), y:Math.round(y/32)};
}
