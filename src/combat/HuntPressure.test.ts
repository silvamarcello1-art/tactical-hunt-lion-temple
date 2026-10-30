import {describe,it,expect} from 'vitest';
import {CombatEngine} from './CombatEngine';
import {progressiveHuntFloors,HUNT_PRESSURE,HUNT_PROFILE_VERSION} from '../data/progressiveHunt';
import {polishedFloors,heroes} from '../data/config';
import {progressFromTotal} from './Progression';
import type {OccupancyGrid} from './grid/OccupancyGrid';
const initialProgress=()=>Object.fromEntries(heroes.map(hero=>[hero.id,progressFromTotal(0)]));
const create=(seed=803,progress=initialProgress())=>new CombatEngine(seed,undefined,`pressure-${seed}`,progress,{},true,true,false,{singleHeroControl:true,tacticalControls:true,progressiveHunt:true,strictCellMovement:true});
const run=(seed=803)=>create(seed).run();
describe('explicit progressive Hunt profile',()=>{
  it('raises wave counts 5→6→8, then boss plus four guards, with unique valid spawn tiles',()=>{
    expect(progressiveHuntFloors.map(f=>f.length)).toEqual(HUNT_PRESSURE.counts);
    expect(progressiveHuntFloors.at(-1)!.filter(e=>e.role==='boss')).toHaveLength(1);
    for(const floor of progressiveHuntFloors){
      expect(new Set(floor.map(e=>e.id)).size).toBe(floor.length);
      expect(new Set(floor.map(e=>`${e.tileX}:${e.tileY}`)).size).toBe(floor.length);
      for(const e of floor){expect(e.tileX).toBeGreaterThanOrEqual(2);expect(e.tileX).toBeLessThanOrEqual(27);expect(e.tileY).toBeGreaterThanOrEqual(2);expect(e.tileY).toBeLessThanOrEqual(15);}
    }
  });
  it('scales existing HP and attack progressively without mutating legacy data or inflating rewards',()=>{
    for(const [i,floor] of polishedFloors.entries())for(const original of floor){
      const actual=progressiveHuntFloors[i].find(e=>e.id===original.id)!;
      expect(actual.maxHp).toBe(Math.round(original.maxHp*HUNT_PRESSURE.hp[i]));
      expect(actual.attack).toBe(Math.round(original.attack*HUNT_PRESSURE.attack[i]));
      expect(actual).not.toBe(original);
    }
    expect(polishedFloors.map(f=>f.length)).toEqual([5,5,6,3]);
    const oldIds=new Set(polishedFloors.flat().map(e=>e.id));
    expect(progressiveHuntFloors.flat().filter(e=>!oldIds.has(e.id)).every(e=>e.rewardSuppressed)).toBe(true);
  });
  it('keeps the fresh production party viable with 24 kills and the existing XP/token budget',()=>{
    const result=run();expect(result.victory,JSON.stringify({kills:result.kills,duration:result.duration,floors:result.events.filter(e=>e.type==='floor_complete').map(e=>e.data),deaths:result.events.filter(e=>e.type==='death'&&['knight','druid','sorcerer'].includes(e.targetId??'')).map(e=>({id:e.targetId,floor:e.floor,time:e.time}))})).toBe(true);expect(result.kills).toBe(24);
    expect(result.xp).toBe(4240);expect(result.bossTokens).toBe(1);
    expect(result.events.filter(e=>e.type==='death'&&heroes.some(h=>h.id===e.targetId))).toEqual([]);
  });
  it('does not apply Hunt pressure to local training',()=>{
    const training=(progressiveHunt:boolean)=>new CombatEngine(803,undefined,'training-pressure',undefined,{},true,true,true,{trainingTeam:true,singleHeroControl:true,tacticalControls:true,progressiveHunt,strictCellMovement:true}).run();
    expect(training(true)).toEqual(training(false));
  });
  it('keeps the complete new-profile timeline deterministic across frame sizes',async()=>{
    const frames=(step:number)=>{const engine=create();for(let t=0;t<=180000&&!engine.completed;t+=step)engine.advanceTo(t);expect(engine.completed).toBe(true);return engine.result;};
    const fine=frames(50),coarse=frames(1000);expect(fine).toEqual(coarse);
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(fine.events)));
    const hash=[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
    expect(HUNT_PROFILE_VERSION).toBe('sqm-pressure-v1');
    expect(hash).toBe('aa8ae5e05b6167e60fb74094859965a73aa645b2ca8dfb45710ddc5e2cd97ff8');
  });
  it.each([803,811,814,821])('stress seed%s never duplicates occupied/reserved SQMs and clears pending movement',seed=>{
    const engine=create(seed),state=engine as unknown as {occupancy:OccupancyGrid};
    for(let t=0;t<=180000&&!engine.completed;t+=250){
      engine.advanceTo(t);
      const occupied=state.occupancy.occupiedEntries(),reserved=state.occupancy.reservedTileEntries();
      expect(new Set(occupied.map(e=>`${e.position.x}:${e.position.y}`)).size).toBe(occupied.length);
      expect(new Set(reserved.map(e=>`${e.position.x}:${e.position.y}`)).size).toBe(reserved.length);
      for(const e of reserved){const occupant=state.occupancy.occupantAt(e.position);expect(!occupant||occupant===e.entityId).toBe(true);}
    }
    expect(engine.completed).toBe(true);expect(state.occupancy.reservedTileEntries()).toEqual([]);
    expect(engine.pendingApproachCount).toBe(0);expect(engine.pendingPushCount).toBe(0);
    engine.dispose();expect(state.occupancy.reservedTileEntries()).toEqual([]);
  });
  it('completes three evolving hunts without losing the party or changing XP/token budgets',()=>{
    let progress=initialProgress();
    for(let loop=0;loop<3;loop++){const engine=create(803,progress),result=engine.run();
      expect(result.victory).toBe(true);expect(result.kills).toBe(24);expect(result.xp).toBe(4240);expect(result.bossTokens).toBe(1);
      expect(result.events.filter(e=>e.type==='death'&&heroes.some(h=>h.id===e.targetId))).toEqual([]);progress=engine.progression;
    }
  });
});
