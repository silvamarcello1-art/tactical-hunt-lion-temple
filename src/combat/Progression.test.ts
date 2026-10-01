import { describe, it, expect } from 'vitest';
import { awardXp, progressFromTotal, grownStats, passiveAmount } from './Progression';
import { CombatEngine } from './CombatEngine';
import { heroes } from '../data/config';
import { PROGRESSION } from '../data/progression';
import { ProgressionStore } from '../app/ProgressionStore';
import type { CombatEvent } from '../events/types';

const fresh=()=>Object.fromEntries(heroes.map(hero=>[hero.id,progressFromTotal(0)]));
describe('authoritative hero progression',()=>{
  it('crosses several thresholds deterministically and rejects corrupt XP',()=>{
    expect(awardXp(progressFromTotal(0),1175)).toEqual({level:3,xp:0,totalXp:1175,xpToNextLevel:850});
    for(const n of [NaN,Infinity,-1,1.5]) expect(progressFromTotal(n).level).toBe(1);
    expect(progressFromTotal(100_000_000)).toMatchObject({level:100,xp:0,xpToNextLevel:0});
  });
  it('grows class stats and activates only unlocked passives without modifying base data',()=>{
    const base=structuredClone(heroes);
    const level2=progressFromTotal(500);
    expect(grownStats(heroes[0],level2)).toMatchObject({maxHp:1705,maxMana:732,attack:132,defense:48});
    expect(grownStats(heroes[2],level2).magicPower).toBeCloseTo((152+7)*1.04);
    expect(passiveAmount('druid',1,'healing')).toBe(0);
    expect(passiveAmount('druid',2,'healing')).toBe(.06);
    expect(heroes).toEqual(base);
  });
  it('splits kill, boss and floor XP exactly, emits growth and never refills on level-up',()=>{
    const engine=new CombatEngine(803,undefined,'progression-test',fresh());
    const result=engine.run();
    expect(result.victory).toBe(true);
    expect(result.xp).toBe(16*PROGRESSION.monsterXp+PROGRESSION.bossXp+4*PROGRESSION.floorXp);
    const awards=result.events.filter(e=>e.type==='hero_experience');
    expect(awards.reduce((sum,e)=>sum+e.data!.amount!,0)).toBe(result.xp);
    expect(Object.values(engine.progression).reduce((sum,p)=>sum+p.totalXp,0)).toBe(result.xp);
    expect(result.events.filter(e=>e.type==='floor_complete')).toHaveLength(4);
    const hp=new Map<string,number>();const mana=new Map<string,number>();
    let levels=0;
    for(const event of result.events){
      if(event.type==='spawn' && event.data?.entity){hp.set(event.targetId!,event.data.entity.hp);mana.set(event.targetId!,event.data.entity.mana);}
      if(event.type==='damage' && hp.has(event.targetId!)) hp.set(event.targetId!,Math.max(0,hp.get(event.targetId!)!-(event.data?.amount??0)));
      if(event.type==='heal' && hp.has(event.targetId!)) hp.set(event.targetId!,hp.get(event.targetId!)!+(event.data?.amount??0));
      if(event.type==='cast' && event.data?.mana!==undefined) mana.set(event.sourceId!,event.data.mana);
      if(event.type==='level_up'){
        levels++;const entity=event.data!.entity!;
        expect(entity.hp).toBe(hp.get(entity.id));expect(entity.mana).toBe(mana.get(entity.id));
        expect(entity.level).toBeGreaterThan(event.data!.previousLevel!);
      }
    }
    expect(levels).toBeGreaterThanOrEqual(3);
  });
  it('persists canonical totals and ignores duplicate/stale awards and forged saved stats',()=>{
    let value=JSON.stringify({version:1,heroes:{knight:{totalXp:500,level:99}}});
    const storage={getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;}};
    const store=new ProgressionStore(storage);expect(store.snapshot().knight.level).toBe(2);
    const event={type:'hero_experience',targetId:'knight',data:{progress:progressFromTotal(600)}} as CombatEvent;
    expect(store.apply(event)).toBe(true);expect(store.apply(event)).toBe(false);
    expect(store.apply({...event,data:{progress:progressFromTotal(550)}})).toBe(false);
    expect(new ProgressionStore(storage).snapshot().knight.totalXp).toBe(600);
    value='{broken';expect(new ProgressionStore(storage).snapshot().knight.level).toBe(1);
  });
  it('reports truthful slot availability and only the owning vocation can cast',()=>{
    const engine=new CombatEngine();expect(engine.abilityStatus('druid','heal_friend').reason).toBe('not-started');
    engine.advanceTo(0);
    expect(engine.abilityStatus('knight','heal_friend').reason).toBe('disabled');
    expect(engine.abilityStatus('sorcerer','energy_wave').reason).toBe('no-target');
    expect(engine.abilityStatus('sorcerer','energy_wave','knight').reason).toBe('invalid-target');
    expect(engine.abilityStatus('druid','heal_friend','druid').ready).toBe(true);
    engine.dispose();expect(engine.abilityStatus('druid','heal_friend').reason).toBe('session-ended');
  });
});
