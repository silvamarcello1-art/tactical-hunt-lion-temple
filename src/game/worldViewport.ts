import type {Point} from '../events/types';
import {WORLD_VIEW} from './renderConfig';
export {WORLD_VIEW} from './renderConfig';
/** Logical geometry is independent of CSS/device resolution. */
export interface WorldBounds {x:number;y:number;width:number;height:number}
export interface WorldCamera extends WorldBounds {scale:number;left:number;top:number}
export function worldCamera(width:number,height:number,map:WorldBounds,focus:Point):WorldCamera {
  const w=Math.min(map.width,WORLD_VIEW.columns*WORLD_VIEW.tileSize),h=Math.min(map.height,WORLD_VIEW.rows*WORLD_VIEW.tileSize);
  const scale=Math.min(width/w,height/h);
  const x=Math.max(map.x,Math.min(map.x+map.width-w,focus.x-w/2));
  const y=Math.max(map.y,Math.min(map.y+map.height-h,focus.y-h/2));
  return {x,y,width:w,height:h,scale,left:(width-w*scale)/2,top:(height-h*scale)/2};
}
export function viewportPoint(point:Point,bounds:{left:number;top:number;width:number;height:number},camera:WorldCamera):Point|undefined {
  const x=point.x-bounds.left-camera.left,y=point.y-bounds.top-camera.top;
  if(camera.scale<=0||x<0||y<0||x>=camera.width*camera.scale||y>=camera.height*camera.scale)return;
  return {x:x/camera.scale+camera.x,y:y/camera.scale+camera.y};
}
