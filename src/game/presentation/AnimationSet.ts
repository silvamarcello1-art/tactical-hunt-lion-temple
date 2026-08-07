import type { VisualAnimationState, VisualFacing } from './CombatPresentationSystem';

export interface AnimationClipDefinition {
  frames: string[];
  frameDuration: number;
  loop: boolean;
}

export type DirectionalAnimationClips = Partial<Record<VisualFacing, AnimationClipDefinition>>;

/**
 * Asset-agnostic contract for the original sprite sheets that will replace the
 * current placeholders. Gameplay code only names a state and a facing; atlas
 * frame names and timing remain presentation data.
 */
export interface AnimationSet {
  id: string;
  clips: Partial<Record<VisualAnimationState, DirectionalAnimationClips>>;
  footAnchor: { x: number; y: number };
  visualOffset: { x: number; y: number };
}

export const placeholderAnimationSet = (id: string): AnimationSet => ({
  id,
  clips:{},
  footAnchor:{ x:.5,y:1 },
  visualOffset:{ x:0,y:0 },
});
