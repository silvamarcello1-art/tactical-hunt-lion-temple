import {describe,it,expect} from 'vitest';
import {CombatEngine} from './CombatEngine';
import {GridMap} from './grid/GridMap';
import {OccupancyGrid} from './grid/OccupancyGrid';
import {pushApproach} from './PushApproach';
import type {PlayerIntent} from '../control/PlayerCommand';
import type {EntitySnapshot} from '../events/types';
const setup=()=>{
  const engine=new CombatEngine(803,undefined,'tactical-test',undefined,{},true,true,true,{singleHeroControl:true,trainingTeam:true,tacticalControls:true,trainingColumns:36});let sequence=0;
  const send=(intent:PlayerIntent,actorId='knight')=>engine.submit({commandId:`t-${++sequence}`,sessionId:engine.id,actorId,ownerId:'local-player',sequence,logicalTick:engine.time,intent});
  return {engine,send};
};
/** Stationary domain fixture: isolate push lifecycle from adversary movement. */
const pushFixture=()=>{
  const {engine,send}=setup();engine.advanceTo(0);
  const state=engine as unknown as {enemies:(EntitySnapshot&{alive:boolean})[];gridMap:GridMap;occupancy:OccupancyGrid};
  for(let x=0;x<36;x++)state.gridMap.setBlocked({x,y:14},true);
  for(const [i,e] of state.enemies.entries()){state.occupancy.release(e.id);e.tileX=24+i*2;e.tileY=16;e.position={x:e.tileX*32,y:512};e.attack=0;state.occupancy.occupy(e.id,{x:e.tileX,y:16});}
  return {engine,send,state};
};
describe('explicit tactical party and approach orders',()=>{
  it('rejects malformed tactical payloads before inspecting their intent or mutating focus',()=>{
    const {engine,send}=setup();engine.advanceTo(0);
    expect(send(null as unknown as PlayerIntent).reason).toBe('invalid-command');
    expect(send({} as PlayerIntent).reason).toBe('invalid-command');expect(engine.partyFocusTargetId).toBeUndefined();
  });
  it('the production tactical profile preserves complete autonomous Hunt results and timeline',()=>{
    const run=(tacticalControls:boolean)=>new CombatEngine(803,undefined,'auto-parity',undefined,{},true,true,false,{singleHeroControl:true,tacticalControls}).run();
    expect(run(true)).toEqual(run(false));
  });
  it('Hunt retains the selected Assisted rotation while companions share its explicit focus',()=>{
    const engine=new CombatEngine(803,undefined,'assisted-tactical',undefined,{},true,true,false,{singleHeroControl:true,tacticalControls:true});engine.advanceTo(0);
    let sequence=0;const send=(intent:PlayerIntent)=>engine.submit({commandId:`a-${++sequence}`,sessionId:engine.id,actorId:'sorcerer',ownerId:'local-player',sequence,logicalTick:engine.time,intent});
    send({type:'control',mode:'ASSISTED'});send({type:'attack',targetId:'lion-3'});engine.advanceTo(500);
    expect(engine.controlOf('sorcerer').mode).toBe('ASSISTED');expect(engine.partyFocusTargetId).toBe('lion-3');
    expect(engine.result.events.some(e=>e.type==='cast'&&e.sourceId==='sorcerer')).toBe(true);
  });
  it('training permits only selected Manual; swap retains explicit focus and companions Auto',()=>{
    const {engine,send}=setup();engine.advanceTo(0);
    expect(send({type:'control',mode:'AI'}).reason).toBe('manual-required');
    expect(send({type:'control',mode:'ASSISTED'}).accepted).toBe(false);
    send({type:'attack',targetId:'training-vanguard'});engine.advanceTo(250);
    expect(engine.partyFocusTargetId).toBe('training-vanguard');
    send({type:'control',mode:'MANUAL'},'sorcerer');
    expect(engine.partyFocusTargetId).toBe('training-vanguard');
    expect(['knight','druid','sorcerer'].map(id=>engine.controlOf(id).mode)).toEqual(['AI','AI','MANUAL']);
    send({type:'stop'},'sorcerer');engine.advanceTo(500);expect(engine.partyFocusTargetId).toBeUndefined();
  });
  it('never acquires an offensive target in training without an explicit focus',()=>{
    const {engine}=setup();engine.advanceTo(3000);
    expect(engine.result.events.filter(e=>['knight','druid','sorcerer'].includes(e.sourceId??'')&&['basic_attack','cast'].includes(e.type)&&e.targetId?.startsWith('training-'))).toEqual([]);
    expect(engine.partyFocusTargetId).toBeUndefined();
  });
  it('all companion offensive primary targets match the chosen target, including after takeover',()=>{
    const {engine,send}=setup();engine.advanceTo(0);send({type:'attack',targetId:'training-sparring'});engine.advanceTo(500);
    send({type:'control',mode:'MANUAL'},'sorcerer');engine.advanceTo(3000);
    const attacks=engine.result.events.filter(e=>['knight','druid','sorcerer'].includes(e.sourceId??'')&&['basic_attack','cast'].includes(e.type)&&e.targetId?.startsWith('training-'));
    expect(attacks.length).toBeGreaterThan(0);expect(attacks.every(e=>e.targetId==='training-sparring')).toBe(true);
  });
  it('walks a distant executor, never the target, then pushes once into the indicated neighbour',()=>{
    const {engine,send}=pushFixture();const origin=engine.entities.find(e=>e.id==='druid')!;
    send({type:'push',targetId:'druid',tile:{x:4,y:6}});engine.advanceTo(250);
    expect(engine.pendingApproachCount).toBe(1);expect(engine.entities.find(e=>e.id==='druid')).toMatchObject({tileX:origin.tileX,tileY:origin.tileY});
    engine.advanceTo(5000);expect(engine.entities.find(e=>e.id==='druid')).toMatchObject({tileX:4,tileY:6});
    expect(engine.result.events.filter(e=>e.type==='push_resolved')).toHaveLength(1);expect(engine.pendingPushCount).toBe(0);
    expect(engine.result.events.filter(e=>e.type==='movement_started'&&e.sourceId==='knight').some(e=>e.data?.toTile?.x===4&&e.data.toTile.y===6)).toBe(false);
  });
  it.each<PlayerIntent>([{type:'move',dx:1,dy:0},{type:'move-to',tile:{x:10,y:9}},{type:'cast',abilityId:'berserk',targetId:'training-sparring'},{type:'rune',runeId:'magic_wall',tile:{x:9,y:9}},{type:'stop'},{type:'interrupt'}])('a new $type intent cancels approach immediately without a late push',intent=>{
    const {engine,send}=pushFixture();send({type:'push',targetId:'druid',tile:{x:4,y:6}});engine.advanceTo(250);
    expect(engine.pendingApproachCount).toBe(1);send(intent);expect(engine.pendingApproachCount).toBe(0);
    engine.advanceTo(5000);expect(engine.result.events.some(e=>e.type==='push_resolved')).toBe(false);
    engine.dispose();expect(engine.pendingPushCount).toBe(0);
  });
  it('cancels a moved target snapshot and takeover; old queued movement never resurrects',()=>{
    const {engine,send,state}=pushFixture();send({type:'push',targetId:'druid',tile:{x:4,y:6}});engine.advanceTo(250);
    const party=(engine as unknown as {party:(EntitySnapshot&{alive:boolean})[]}).party,target=party.find(e=>e.id==='druid')!;
    target.tileY=5;state.occupancy.occupy(target.id,{x:5,y:5});engine.advanceTo(500);
    expect(engine.pendingApproachCount).toBe(0);expect(engine.result.events.some(e=>e.type==='push_cancelled'&&e.data?.reason==='target-moved')).toBe(true);
    send({type:'move-to',tile:{x:20,y:2}});send({type:'control',mode:'MANUAL'},'druid');send({type:'control',mode:'MANUAL'});engine.advanceTo(1000);
    expect(engine.result.events.some(e=>e.sourceId==='knight'&&e.data?.destinationTile?.x===20)).toBe(false);
  });
  it('read-only A* excludes the target destination, refuses walls/reservations/no route and has stable ties',()=>{
    const map=new GridMap(12,12),occupancy=new OccupancyGrid(map);occupancy.occupy('a',{x:1,y:1});occupancy.occupy('b',{x:7,y:7});
    const plan=()=>pushApproach(map,occupancy,'a',{x:1,y:1},{x:7,y:7},{x:6,y:6});
    const a=plan();expect(a).toBeDefined();expect(a).toEqual(plan());expect(a!.path.some(p=>p.x===6&&p.y===6)).toBe(false);expect(occupancy.reservedEntries()).toEqual([]);
    for(let x=6;x<=8;x++)for(let y=6;y<=8;y++)if(x!==7||y!==7)map.setBlocked({x,y},true);
    expect(plan()).toBeUndefined();
  });
  it.each(['wall','occupied','reserved','target-dead','source-dead'] as const)('revalidates %s during approach, with no destination reservation or late push',kind=>{
    const {engine,send,state}=pushFixture();send({type:'push',targetId:'druid',tile:{x:4,y:6}});engine.advanceTo(250);
    expect(state.occupancy.reservedEntries().some(e=>e.position.x===4&&e.position.y===6)).toBe(false);
    const party=(engine as unknown as {party:(EntitySnapshot&{alive:boolean})[]}).party;
    if(kind==='wall')state.gridMap.setBlocked({x:4,y:6},true);
    if(kind==='occupied')state.occupancy.occupy('obstruction',{x:4,y:6});
    if(kind==='reserved')state.occupancy.reserve('obstruction',{x:4,y:6});
    if(kind==='target-dead')party.find(e=>e.id==='druid')!.alive=false;
    if(kind==='source-dead')party.find(e=>e.id==='knight')!.alive=false;
    engine.advanceTo(500);expect(engine.pendingApproachCount).toBe(0);engine.advanceTo(3000);
    expect(engine.result.events.some(e=>e.type==='push_resolved')).toBe(false);
    engine.dispose();expect(engine.pendingPushCount).toBe(0);expect(state.occupancy.reservedEntries()).toEqual([]);
  });
  it('latest push replaces its predecessor; cancellation before adjacency spends no cooldown',()=>{
    const {engine,send}=pushFixture();
    send({type:'push',targetId:'druid',tile:{x:4,y:6}});engine.advanceTo(250);send({type:'stop'});
    send({type:'push',targetId:'druid',tile:{x:5,y:5}});engine.advanceTo(5000);
    expect(engine.entities.find(e=>e.id==='druid')).toMatchObject({tileX:5,tileY:5});
    expect(engine.result.events.filter(e=>e.type==='push_queued')).toHaveLength(1);
    expect(engine.result.events.filter(e=>e.type==='push_resolved')).toHaveLength(1);
  });
  it('the same command schedule is deterministic under small or batched frame advances',()=>{
    const run=(step:number)=>{const {engine,send}=pushFixture();send({type:'push',targetId:'druid',tile:{x:4,y:6}});
      for(let time=step;time<=5000;time+=step)engine.advanceTo(time);engine.advanceTo(5000);
      return engine.result.events;};
    expect(run(50)).toEqual(run(1000));
  });
});
