import {describe,it,expect} from 'vitest';
import {CombatEngine} from './CombatEngine';
import {GridMap} from './grid/GridMap';
import {OccupancyGrid} from './grid/OccupancyGrid';
import {TemporaryTerrain} from './TemporaryTerrain';
import {MovementSystem} from './grid/MovementSystem';
import {createGridMetrics} from './grid/GridTypes';
import {chooseDirectionalAttack} from './DirectionalTactics';
import {floors} from '../data/config';
import type {PlayerIntent} from '../control/PlayerCommand';

function session(mode:'AI'|'MANUAL'|'ASSISTED') {
  const engine=new CombatEngine();let seq=0;
  const send=(intent:PlayerIntent,actorId='knight')=>engine.submit({intent,actorId,ownerId:'local-player',sessionId:engine.id,commandId:`next-${++seq}`,sequence:seq,logicalTick:engine.time});
  send({type:'control',mode});return {engine,send};
}
describe('mouse-first encounter contracts',()=>{
  it('Auto acquires and rotates without input; look does not take ownership',()=>{
    const {engine,send}=session('AI');send({type:'look',target:{kind:'entity',entityId:'knight'}});
    const events=engine.advanceTo(5000);expect(engine.controlOf('knight').mode).toBe('AI');
    expect(events.some(e=>e.sourceId==='knight'&&e.type==='cast')).toBe(true);
  });
  it.each(['MANUAL','ASSISTED'] as const)('%s waits for engagement and never replaces a dead target',mode=>{
    const {engine,send}=session(mode);
    expect(engine.advanceTo(500).filter(e=>e.sourceId==='knight'&&['cast','basic_attack','movement_started'].includes(e.type))).toHaveLength(0);
    send({type:'attack',targetId:'lion-1'});const events=engine.advanceTo(12000);
    const actions=events.filter(e=>e.sourceId==='knight'&&['cast','basic_attack'].includes(e.type));
    expect(actions.length).toBeGreaterThan(0);
    if(mode==='MANUAL')expect(actions.every(e=>e.type==='basic_attack')).toBe(true);
    const death=events.find(e=>e.type==='death'&&e.targetId==='lion-1');expect(death).toBeDefined();
    expect(events.filter(e=>e.time>death!.time&&e.sourceId==='knight'&&['cast','basic_attack'].includes(e.type))).toHaveLength(0);
  });
  it('latest mouse destination wins without teleport or queued path backlog',()=>{
    const {engine,send}=session('MANUAL');
    send({type:'move-to',tile:{x:3,y:9}});send({type:'move-to',tile:{x:8,y:3}});
    const events=engine.advanceTo(750);
    expect(events.filter(e=>e.sourceId==='knight'&&e.type==='movement_started').every(e=>e.data?.destinationTile?.y===3)).toBe(true);
    expect(engine.entities.find(e=>e.id==='knight')?.tileY).toBe(6);
  });
  it('four roles and original names remain data-driven',()=>{
    expect(new Set(floors.flat().map(e=>e.archetype).filter(Boolean)).size).toBe(4);
  });
  it('directional decisions maximize current hits deterministically',()=>{
    const choose=()=>chooseDirectionalAttack({x:2,y:2},[{x:2,y:2},{x:3,y:2}],
      [{id:'a',tile:{x:4,y:2}},{id:'b',tile:{x:4,y:3}}],'a',(p,f)=>f==='right'?[{x:p.x+1,y:p.y},{x:p.x+1,y:p.y+1}]:[]);
    expect(choose()).toEqual(choose());expect(choose()).toMatchObject({facing:'right',tile:{x:3,y:2},hits:2});
  });
  it('rubble revises navigation, cancels reserved destination, restores without orphan reservation',()=>{
    const map=new GridMap(10,10),occupancy=new OccupancyGrid(map),terrain=new TemporaryTerrain(map,occupancy);
    const movement=new MovementSystem(map,occupancy,createGridMetrics());occupancy.occupy('a',{x:2,y:2});
    movement.step({entityId:'a',from:{x:2,y:2},destination:{x:3,y:2},now:0,duration:220,sessionId:'s'});
    const revision=map.revision;
    expect(terrain.block([{x:2,y:2},{x:3,y:2}],1000)).toEqual([{x:3,y:2}]);
    expect(map.revision).toBeGreaterThan(revision);
    const resolved=movement.completeDue(250,'s');
    expect(resolved.map(r=>r.status)).toEqual(['cancelled']);
    expect(occupancy.reservedEntries()).toHaveLength(0);expect(map.isWalkable({x:2,y:2})).toBe(true);
    expect(terrain.restore(999)).toHaveLength(0);expect(terrain.restore(1000)).toHaveLength(1);expect(terrain.size).toBe(0);
  });
  it('boss danger mutates the real map and is restored at floor boundaries',()=>{
    const engine=new CombatEngine();const result=engine.run();
    expect(result.victory).toBe(true);
    const warning=result.events.find(e=>e.type==='spell_telegraph'&&e.data?.requiresTelegraph);
    const mutation=result.events.find(e=>e.type==='map_changed'&&e.data?.blocked);
    expect(warning).toBeDefined();expect(mutation).toBeDefined();
    expect(mutation!.time).toBeGreaterThan(warning!.time);
    const changes=result.events.filter(e=>e.type==='map_changed');expect(changes.some(e=>e.data?.blocked&&e.data.logicalTiles?.length)).toBe(true);
    const blocked=new Set<string>();for(const e of changes)for(const t of e.data?.logicalTiles??[]){const key=`${t.x}:${t.y}`;if(e.data?.blocked)blocked.add(key);else blocked.delete(key);}
    expect(blocked.size).toBe(0);expect(engine.encounterMetrics.temporaryBlockedTiles).toBe(0);
    expect(result.events.filter(e=>e.type==='spell_telegraph').every(e=>e.data?.requiresTelegraph===true)).toBe(true);
    expect(result.events.some(e=>e.type==='boss_phase')).toBe(true);
    expect(engine.encounterMetrics.monsterDecisionEvaluations).toBeGreaterThan(0);
    expect(engine.encounterMetrics.monsterDecisionEvaluations).toBeLessThan(result.duration/1500*5);
  });
  it('disposing during rubble cancels future map mutation and restores owned tiles',()=>{
    const engine=new CombatEngine();let time=0;
    while(!engine.completed&&!engine.encounterMetrics.temporaryBlockedTiles&&time<100000)engine.advanceTo(time+=250);
    expect(engine.encounterMetrics.temporaryBlockedTiles).toBeGreaterThan(0);
    engine.dispose();expect(engine.encounterMetrics.temporaryBlockedTiles).toBe(0);
    expect(engine.advanceTo(time+10000)).toEqual([]);
  });
  it('hunter retreats and shoots while flanker pressures the backline',()=>{
    const events=new CombatEngine().run().events;
    expect(events.some(e=>e.sourceId==='lion-3'&&e.type==='reposition')).toBe(true);
    expect(events.some(e=>e.sourceId==='lion-3'&&e.type==='projectile')).toBe(true);
    expect(events.some(e=>e.sourceId==='lion-2'&&e.type==='target_change'&&e.targetId==='druid')).toBe(true);
    expect(events.some(e=>e.type==='reposition'&&e.data?.reason==='directional-coverage')).toBe(true);
  });
});
