import { progressFromTotal } from '../combat/Progression';
import { heroes } from '../data/config';
import type { PartyProgress } from '../data/progression';
import type { CombatEvent } from '../events/types';

const KEY='tactical-hunt-progression-v1';
export class ProgressionStore {
  private progress:PartyProgress={};
  warning='';
  blocked=false;
  constructor(private storage:Pick<Storage,'getItem'|'setItem'>=localStorage) {
    let saved:Record<string,{totalXp?:number}>={};
    try {
      const raw=storage.getItem(KEY);
      if(raw) {
        const data=JSON.parse(raw);
        if(data.version!==1 || !data.heroes || typeof data.heroes!=='object') throw Error('invalid version');
        for(const hero of heroes) {
          const xp=data.heroes[hero.id]?.totalXp;
          if(xp!==undefined && (!Number.isSafeInteger(xp)||xp<0)) throw Error('invalid XP');
        }
        saved=data.heroes;
      }
    } catch {this.blocked=true;this.warning='Progresso inválido ou inacessível. Save original preservado; recupere-o antes de iniciar outra hunt.';}
    for (const hero of heroes) this.progress[hero.id]=progressFromTotal(saved[hero.id]?.totalXp??0);
  }
  snapshot():PartyProgress {return structuredClone(this.progress);}
  apply(event:CombatEvent):boolean {
    if(this.blocked) return false;
    if(event.type!=='hero_experience' || !event.targetId || !this.progress[event.targetId] || !event.data?.progress) return false;
    const next=progressFromTotal(event.data.progress.totalXp);
    // Absolute, monotonic snapshots make replay/duplicate events idempotent.
    if(next.totalXp<=this.progress[event.targetId].totalXp) return false;
    this.progress[event.targetId]=next;
    try {this.storage.setItem(KEY,JSON.stringify({version:1,heroes:this.progress}));} catch { /* Gameplay continues when local storage is full. */ }
    return true;
  }
}
