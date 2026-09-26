import { progressFromTotal } from '../combat/Progression';
import { heroes } from '../data/config';
import type { PartyProgress } from '../data/progression';
import type { CombatEvent } from '../events/types';

const KEY='tactical-hunt-progression-v1';
export class ProgressionStore {
  private progress:PartyProgress={};
  constructor(private storage:Pick<Storage,'getItem'|'setItem'>=localStorage) {
    let saved:Record<string,{totalXp?:number}>={};
    try {const data=JSON.parse(storage.getItem(KEY)??'{}');if(data.version===1) saved=data.heroes??{};} catch { /* Invalid saves never become domain state. */ }
    for (const hero of heroes) this.progress[hero.id]=progressFromTotal(saved[hero.id]?.totalXp??0);
  }
  snapshot():PartyProgress {return structuredClone(this.progress);}
  apply(event:CombatEvent):boolean {
    if(event.type!=='hero_experience' || !event.targetId || !this.progress[event.targetId] || !event.data?.progress) return false;
    const next=progressFromTotal(event.data.progress.totalXp);
    // Absolute, monotonic snapshots make replay/duplicate events idempotent.
    if(next.totalXp<=this.progress[event.targetId].totalXp) return false;
    this.progress[event.targetId]=next;
    try {this.storage.setItem(KEY,JSON.stringify({version:1,heroes:this.progress}));} catch { /* Gameplay continues when local storage is full. */ }
    return true;
  }
}
