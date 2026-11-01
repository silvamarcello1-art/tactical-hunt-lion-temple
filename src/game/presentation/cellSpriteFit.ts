import {WORLD_VIEW} from '../renderConfig';
import type {SpriteDefinition} from './SpriteDefinition';

/** Alpha>16 union of all exported poses, relative to the original foot anchor.
 * Measured from the existing atlases, not from their transparent frame sizes.
 * One constant fit per atlas prevents breathing/scale changes between poses.
 */
export const SPRITE_OPAQUE_BOUNDS:Readonly<Record<string,readonly [number,number,number,number]>>={
  knight:[-25,-67,25,0],druid:[-28,-68,28,0],sorcerer:[-29,-60,30,0],
  'lion-guard':[-32,-52,32,4],'lion-oracle':[-32,-56,32,8],
  'lion-hunter':[-32,-56,32,8],'lion-flanker':[-32,-56,32,8],
  'bronze-bastion':[-32,-51,32,4],'wandering-ballista':[-32,-56,32,8],
  'hollow-regent':[-32,-55,32,4],
  'outfit-citizen-base':[-28,-68,28,0],'outfit-citizen-addon1':[-28,-68,28,0],
  'outfit-citizen-addon2':[-39,-95,39,0],
  'outfit-warrior-base':[-27,-68,27,0],'outfit-warrior-addon1':[-27,-68,28,0],
  'outfit-warrior-addon2':[-31,-78,31,0],
  'outfit-druid-base':[-32,-68,32,0],'outfit-druid-addon1':[-33,-68,33,0],
  'outfit-druid-addon2':[-32,-68,32,0],
  'outfit-mage-base':[-29,-68,29,0],'outfit-mage-addon1':[-33,-75,34,0],
  'outfit-mage-addon2':[-45,-95,46,0],
  'outfit-assassin-base':[-28,-68,28,0],'outfit-assassin-addon1':[-31,-68,31,0],
  'outfit-assassin-addon2':[-35,-67,35,0],
  'outfit-hunter-base':[-33,-68,34,0],'outfit-hunter-addon1':[-34,-68,34,0],
  'outfit-hunter-addon2':[-34,-68,35,0],
  'outfit-bolsonaro-base':[-29,-68,30,0],'outfit-bolsonaro-addon1':[-30,-68,30,0],
  'outfit-bolsonaro-addon2':[-30,-68,30,0],
  'outfit-lula-base':[-29,-68,30,0],'outfit-lula-addon1':[-29,-68,30,0],
  'outfit-lula-addon2':[-29,-68,30,0],
  'outfit-pope-base':[-26,-68,27,0],'outfit-pope-addon1':[-38,-75,38,0],
  'outfit-pope-addon2':[-44,-77,44,0],
  'outfit-trump-base':[-32,-68,32,0],'outfit-trump-addon1':[-32,-71,33,0],
  'outfit-trump-addon2':[-38,-70,39,0],
  'outfit-neymar-base':[-28,-68,28,0],'outfit-neymar-addon1':[-28,-68,28,0],
  'outfit-neymar-addon2':[-28,-68,29,0],'outfit-neymar-dlc':[-28,-68,28,0],
  'outfit-mbappe-base':[-32,-68,33,0],'outfit-mbappe-addon1':[-32,-68,33,0],
  'outfit-mbappe-addon2':[-35,-64,35,0],'outfit-mbappe-dlc':[-36,-78,36,0],
};

export function fitSpriteToCell(definition:SpriteDefinition):SpriteDefinition {
  const bounds=SPRITE_OPAQUE_BOUNDS[definition.id];
  if(!bounds)throw new Error(`Missing measured sprite bounds: ${definition.id}`);
  const [left,top,right,bottom]=bounds;
  const sx=definition.visualWidth/definition.frameSize*definition.scale;
  const sy=definition.visualHeight/definition.frameSize*definition.scale;
  const factor=Math.min(1,WORLD_VIEW.cellSpriteWidth/(2*Math.max(-left,right)*sx),WORLD_VIEW.cellSpriteHeight/((bottom-top)*sy));
  const footAnchor={...definition.footAnchor,y:definition.footAnchor.y+bottom/definition.frameSize};
  const shift=(point:{x:number;y:number})=>({...point,y:point.y-bottom});
  return {...definition,scale:definition.scale*factor,footAnchor,
    animations:{...definition.animations,footAnchor},
    effectAnchors:{head:shift(definition.effectAnchors.head),hand:shift(definition.effectAnchors.hand),chest:shift(definition.effectAnchors.chest)},
    shadowProfile:{...definition.shadowProfile,width:Math.min(14,definition.shadowProfile.width),height:Math.min(4,definition.shadowProfile.height)},
  };
}

export function opaqueCellBounds(definition:SpriteDefinition,position:{x:number;y:number},offset={x:0,y:0}){
  const [left,top,right,bottom]=SPRITE_OPAQUE_BOUNDS[definition.id];
  const sx=definition.visualWidth/definition.frameSize*definition.scale;
  const sy=definition.visualHeight/definition.frameSize*definition.scale;
  return {left:position.x+offset.x+left*sx,right:position.x+offset.x+right*sx,top:position.y+offset.y+(top-bottom)*sy,bottom:position.y+offset.y};
}
export function opaqueBodiesOverlap(a:ReturnType<typeof opaqueCellBounds>,b:ReturnType<typeof opaqueCellBounds>){
  return a.left<b.right-1e-7&&a.right>b.left+1e-7&&a.top<b.bottom-1e-7&&a.bottom>b.top+1e-7;
}

/** Absolute bounded offsets: overlapping reactions never accumulate displacement. */
export function cellActionMotion(progress:number,dx:number,dy:number,attacking:boolean){
  const p=Math.max(0,Math.min(1,progress)),arc=Math.sin(p*Math.PI);
  const distance=Math.max(1,Math.hypot(dx,dy)),amount=WORLD_VIEW.cellSpriteMotion*(attacking?1:.5);
  return {x:dx/distance*amount*arc,y:dy/distance*amount*arc};
}
export function cellHurtMotion(progress:number){
  const p=Math.max(0,Math.min(1,progress));
  return Math.sin(p*Math.PI*5)*(1-p)*WORLD_VIEW.cellSpriteMotion;
}
