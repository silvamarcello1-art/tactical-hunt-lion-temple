import type { CombatEvent } from './types';
export class EventPlayer {
  private index=0; private elapsed=0; private running=false; speed=1;
  constructor(private events:CombatEvent[],private onEvent:(e:CombatEvent)=>void,private onTime:(ms:number)=>void){}
  play(){this.running=true} pause(){this.running=false} reset(){this.index=0;this.elapsed=0;this.running=false}
  get paused(){return !this.running} get time(){return this.elapsed}
  update(delta:number){
    if(!this.running)return;this.elapsed+=delta*this.speed;this.onTime(this.elapsed);
    while(this.index<this.events.length&&this.events[this.index].time<=this.elapsed)this.onEvent(this.events[this.index++]);
    if(this.index>=this.events.length)this.running=false;
  }
}
