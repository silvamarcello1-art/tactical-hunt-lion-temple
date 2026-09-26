import type { GridPoint } from '../events/types';

export type ControlMode = 'AI' | 'MANUAL' | 'ASSISTED';
export type InteractionTarget = { kind:'entity'; entityId:string } | { kind:'tile'; tile:GridPoint };
export type PlayerIntent =
  | { type:'control'; mode:ControlMode }
  | { type:'move'; dx:number; dy:number }
  | { type:'move-to'; tile:GridPoint }
  | { type:'attack' | 'follow'; targetId:string }
  | { type:'stop' }
  | { type:'cast'; abilityId:string; targetId:string }
  | { type:'look' | 'interact'; target:InteractionTarget }
  | { type:'use'; itemId:string }
  | { type:'use-with' | 'drop'; itemId:string; target:InteractionTarget };

/** Transport boundary. Domain execution never trusts a renderer position. */
export interface PlayerCommand {
  commandId:string;
  sessionId:string;
  actorId:string;
  ownerId:string;
  sequence:number;
  logicalTick:number;
  intent:PlayerIntent;
}

export interface CommandResult {
  commandId:string;
  accepted:boolean;
  reason:string;
}

export interface ControlOwnership {
  mode:ControlMode;
  ownerId?:string;
}

export function validIntent(intent: PlayerIntent): boolean {
  if (!intent || typeof intent !== 'object') return false;
  const id = (value:unknown) => typeof value === 'string' && value.length > 0 && value.length <= 128;
  const target = (value:InteractionTarget) => value && (
    value.kind === 'entity' ? id(value.entityId) : value.kind === 'tile' &&
    Number.isSafeInteger(value.tile?.x) && Number.isSafeInteger(value.tile?.y));
  switch (intent.type) {
    case 'control': return ['AI','MANUAL','ASSISTED'].includes(intent.mode);
    case 'move': return [intent.dx,intent.dy].every(value => Number.isInteger(value) && Math.abs(value) <= 1) && !!(intent.dx || intent.dy);
    case 'move-to': return Number.isSafeInteger(intent.tile?.x) && Number.isSafeInteger(intent.tile?.y);
    case 'attack': case 'follow': return id(intent.targetId);
    case 'stop': return true;
    case 'cast': return id(intent.abilityId) && id(intent.targetId);
    case 'look': case 'interact': return !!target(intent.target);
    case 'use': return id(intent.itemId);
    case 'use-with': case 'drop': return id(intent.itemId) && !!target(intent.target);
    default: return false;
  }
}
