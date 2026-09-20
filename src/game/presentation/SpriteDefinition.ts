import type { EntitySnapshot } from '../../events/types';
import type { AnimationSet } from './AnimationSet';
import type { VisualAnimationState, VisualFacing } from './CombatPresentationSystem';

export type SpriteAction = 'idle' | 'walk' | 'attack' | 'cast' | 'hit' | 'death';
export type SpriteFacing = VisualFacing | 'north-east' | 'south-east' | 'south-west' | 'north-west';
export interface SpriteDefinition {
  id:string;
  entityType:'character' | 'creature' | 'boss';
  spriteSet:string;
  frameSize:number;
  footAnchor:{x:number;y:number};
  visualWidth:number;
  visualHeight:number;
  scale:number;
  facings:readonly SpriteFacing[];
  animations:AnimationSet;
  shadowProfile:{width:number;height:number;alpha:number};
  effectAnchors:{head:{x:number;y:number};hand:{x:number;y:number};chest:{x:number;y:number}};
}

export const spriteAction = (state:VisualAnimationState):SpriteAction => {
  if (state === 'moving' || state === 'dodging') return 'walk';
  if (state === 'attack_windup' || state === 'attacking' || state === 'attack_recovery') return 'attack';
  if (state === 'cast_windup' || state === 'casting' || state === 'healing') return 'cast';
  if (state === 'hit_reaction') return 'hit';
  if (state === 'dying' || state === 'dead') return 'death';
  return 'idle';
};

/** Compatibility mapping; domain IDs and baseline event names do not change. */
export function spriteId(entity:EntitySnapshot):string {
  if (['knight','druid','sorcerer'].includes(entity.role)) return entity.role;
  if (entity.role === 'boss') return 'hollow-regent';
  return /Mage|Warlock/.test(entity.name) ? 'lion-oracle' : 'lion-guard';
}
