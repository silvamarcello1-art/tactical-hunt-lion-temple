import type {SpriteDefinition,SpriteAction} from './SpriteDefinition';
import type {VisualFacing} from './CombatPresentationSystem';
import {WORLD_VIEW} from '../worldViewport';
const facings=['south','east','north','west'] as const;
const rows:Record<SpriteAction,number[]>={idle:[0],walk:[0,1,0,2],attack:[0,3,0],cast:[0,3,0],hit:[0],death:[0,0,0,0]};
const durations:Record<SpriteAction,number>={idle:500,walk:110,attack:105,cast:125,hit:180,death:90};
/** Shared with the atelier: sample the exact same validated native atlas clips. */
export function pixelPreviewFrame(action:SpriteAction,facing:VisualFacing,elapsed:number){
  const frames=rows[action],index=Math.floor(Math.max(0,elapsed)/durations[action]);
  return {x:facings.indexOf(facing),y:frames[action==='walk'||action==='idle'?index%frames.length:Math.min(index,frames.length-1)]};
}
/** Pixel atlases replace artwork only: stable actor IDs, tiles and animation clock. */
export function pixelDefinition(base:SpriteDefinition):SpriteDefinition {
  if(base.entityType!=='character')return base;
  return {...base,spriteSet:`/assets/original/pixel/${base.id}-v1.png`,frameSize:80,footAnchor:{x:.5,y:74/80},visualWidth:80,visualHeight:80,scale:WORLD_VIEW.characterScale,
    effectAnchors:{head:{x:0,y:-64},hand:{x:13,y:-32},chest:{x:0,y:-30}},
    footprint:{...base.footprint,maxUpwardOverflow:74},
    animations:{...base.animations,footAnchor:{x:.5,y:74/80},clips:Object.fromEntries(Object.entries(rows).map(([action,frames])=>[action,Object.fromEntries(facings.map((facing:VisualFacing,col)=>[facing,{frames:frames.map(row=>`${col}:${row}`),frameCount:frames.length,frameDuration:durations[action as SpriteAction],frameRate:1000/durations[action as SpriteAction],loop:action==='walk'||action==='idle'}]))]))},
  };
}
