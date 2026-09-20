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
  submit(command:PlayerCommand):CommandResult;
  selectTarget(actorId?:string):void;
  beforeTick(callback?:() => void):void;
}
