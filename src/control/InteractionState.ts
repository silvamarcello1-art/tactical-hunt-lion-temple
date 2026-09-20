import type { Point } from '../events/types';
import type { InteractionTarget, PlayerIntent } from './PlayerCommand';

export type InteractionState =
  | {kind:'idle'}
  | {kind:'selected'; target:InteractionTarget}
  | {kind:'spell-targeting'; abilityId:string}
  | {kind:'use-with'; itemId:string}
  | {kind:'pressed' | 'dragging'; itemId:string; pointerId:number; origin:Point; position:Point};

/** Pointer state has no inventory authority. A drop is a command for the domain. */
export class InteractionController {
  state:InteractionState = {kind:'idle'};
  cancel() { this.state = {kind:'idle'}; }
  select(target:InteractionTarget) { this.state = {kind:'selected',target}; }
  armSpell(abilityId:string) { this.state = {kind:'spell-targeting',abilityId}; }
  armItem(itemId:string) { this.state = {kind:'use-with',itemId}; }
  press(itemId:string, pointerId:number, position:Point) {
    this.state = {kind:'pressed',itemId,pointerId,origin:{...position},position:{...position}};
  }
  move(pointerId:number, position:Point) {
    const state = this.state;
    if ((state.kind !== 'pressed' && state.kind !== 'dragging') || state.pointerId !== pointerId) return;
    this.state = {...state, position:{...position}, kind:Math.hypot(position.x-state.origin.x,position.y-state.origin.y) >= 6 || state.kind === 'dragging' ? 'dragging' : 'pressed'};
  }
  drop(pointerId:number, target:InteractionTarget):PlayerIntent | undefined {
    const state = this.state;
    if ((state.kind !== 'pressed' && state.kind !== 'dragging') || state.pointerId !== pointerId) return;
    this.cancel();
    // The domain rejects this until a real inventory can validate an atomic drop.
    return state.kind === 'dragging' ? {type:'drop',itemId:state.itemId,target} : undefined;
  }
  target(target:InteractionTarget):PlayerIntent | undefined {
    const state = this.state;
    this.cancel();
    if (state.kind === 'use-with') return {type:'use-with',itemId:state.itemId,target};
    if (state.kind === 'spell-targeting' && target.kind === 'entity') return {type:'cast',abilityId:state.abilityId,targetId:target.entityId};
    this.select(target);
    return;
  }
}
