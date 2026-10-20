import type { EntitySnapshot } from '../events/types';
import type { AssistanceOptions, CommandResult, ControlOwnership, PlayerCommand } from './PlayerCommand';

/** Browser adapter dependencies; no Pixi implementation or mutable engine. */
export interface PlayerControlPort {
  readonly canvas:HTMLCanvasElement;
  readonly sessionId:string;
  readonly time:number;
  readonly running:boolean;
  readonly training?:boolean;
  readonly singleHeroControl?:boolean;
  readonly entities:readonly Readonly<EntitySnapshot & {alive:boolean}>[];
  readonly results:readonly CommandResult[];
  controlOf(actorId:string):ControlOwnership;
  assistanceOf?(actorId:string):AssistanceOptions;
  abilityStatus(actorId:string,abilityId:string,targetId?:string):{ready:boolean;reason:string;remaining:number};
  submit(command:PlayerCommand):CommandResult;
  selectTarget(actorId?:string):void;
  pickEntity?(clientX:number,clientY:number):string|undefined;
  worldPoint?(clientX:number,clientY:number):{x:number;y:number}|undefined;
  showDestination?(tile:{x:number;y:number}):void;
  showAim?(tile?:{x:number;y:number},ready?:boolean):void;
  runePreview?(actorId:string,runeId:import('../data/runes').RuneId,tile:{x:number;y:number}):{ready:boolean;reason:string};
  pushPreview?(actorId:string,targetId:string):import('../combat/PushSystem').PushPreview|undefined;
  showPushPreview?(preview?:import('../combat/PushSystem').PushPreview):void;
  beforeTick(callback?:() => void):void;
}
