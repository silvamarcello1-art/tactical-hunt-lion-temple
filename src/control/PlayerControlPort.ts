import type { EntitySnapshot } from '../events/types';
import type { CommandResult, ControlOwnership, PlayerCommand } from './PlayerCommand';

/** Browser adapter dependencies; no Pixi implementation or mutable engine. */
export interface PlayerControlPort {
  readonly canvas:HTMLCanvasElement;
  readonly sessionId:string;
  readonly time:number;
  readonly running:boolean;
  readonly entities:readonly Readonly<EntitySnapshot & {alive:boolean}>[];
  readonly results:readonly CommandResult[];
  controlOf(actorId:string):ControlOwnership;
  abilityStatus(actorId:string,abilityId:string,targetId?:string):{ready:boolean;reason:string;remaining:number};
  submit(command:PlayerCommand):CommandResult;
  selectTarget(actorId?:string):void;
  pickEntity?(clientX:number,clientY:number):string|undefined;
  worldPoint?(clientX:number,clientY:number):{x:number;y:number}|undefined;
  showDestination?(tile:{x:number;y:number}):void;
  beforeTick(callback?:() => void):void;
}
