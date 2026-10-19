import {describe,it,expect} from 'vitest';
import {RuneSystem,type RuneTile} from './RuneSystem';
import {GridMap} from './grid/GridMap';
import {OccupancyGrid} from './grid/OccupancyGrid';
import {MovementSystem} from './grid/MovementSystem';
import {LineOfSightResolver} from './grid/LineOfSightResolver';
import {createGridMetrics} from './grid/GridTypes';
import {CombatEngine} from './CombatEngine';
import {HeldInput} from '../control/PlayerInput';
import {InteractionController} from '../control/InteractionState';
import {validIntent,type PlayerIntent} from '../control/PlayerCommand';
const setup=()=>{
  const map=new GridMap(20,18),occupancy=new OccupancyGrid(map);
  return {map,occupancy,runes:new RuneSystem(map,occupancy),movement:new MovementSystem(map,occupancy,createGridMetrics())};
};
const wall=(x=3,y=2):RuneTile=>({id:`wall-${x}-${y}`,runeId:'magic_wall',sourceId:'knight',sessionId:'s',tile:{x,y},startedAt:0,expiresAt:20000});
const session=(training=true)=>{
  const engine=new CombatEngine(803,undefined,'training-test',undefined,{},true,true,training);let sequence=0;
  const send=(intent:PlayerIntent,actorId='knight')=>engine.submit({commandId:`test-${++sequence}`,sessionId:engine.id,ownerId:'local-player',sequence,logicalTick:engine.time,actorId,intent});
  return {engine,send};
};
describe('owned rune terrain and field conditions',()=>{
  it('blocks walking and LoS until the exact logical expiry, returning immutable snapshots',()=>{
    const {map,occupancy,runes}=setup(),los=new LineOfSightResolver(map,occupancy);
    expect(runes.place(wall())).toBe(true);expect(map.isWalkable({x:3,y:2})).toBe(false);
    expect(los.hasLineOfSight({x:2,y:2},{x:4,y:2})).toBe(false);
    runes.tiles[0].tile.x=18;expect(runes.tiles[0].tile.x).toBe(3);
    expect(runes.expire(19999)).toEqual([]);expect(runes.expire(20000)).toHaveLength(1);
    expect(los.hasLineOfSight({x:2,y:2},{x:4,y:2})).toBe(true);expect(runes.tiles).toEqual([]);
  });
  it('never overwrites static walls, occupied origins, or an existing rune',()=>{
    const {map,occupancy,runes}=setup();map.setBlocked({x:5,y:5},true);occupancy.occupy('a',{x:2,y:2});
    expect(runes.place(wall(5,5))).toBe(false);expect(runes.place(wall(2,2))).toBe(false);
    expect(runes.place(wall())).toBe(true);expect(runes.place(wall())).toBe(false);
    runes.clear();expect(map.isWalkable({x:5,y:5})).toBe(false);expect(occupancy.positionOf('a')).toEqual({x:2,y:2});
  });
  it('invalidates a reserved endpoint without moving the origin or orphaning a reservation',()=>{
    const {map,occupancy,runes,movement}=setup();occupancy.occupy('a',{x:2,y:2});
    expect(movement.step({entityId:'a',from:{x:2,y:2},destination:{x:3,y:2},now:0,sessionId:'s'}).moved).toBe(true);
    expect(runes.place(wall())).toBe(true);
    expect(movement.completeDue(220,'s')).toMatchObject([{status:'cancelled',reason:'invalidated'}]);
    expect(occupancy.positionOf('a')).toEqual({x:2,y:2});expect(occupancy.reservedEntries()).toEqual([]);expect(map.isWalkable({x:2,y:2})).toBe(true);
  });
  it('revalidates both sides of a committed reactive diagonal, but accepts a distant revision',()=>{
    for(const block of [{x:3,y:2},{x:2,y:3},{x:10,y:10}]){
      const {occupancy,runes,movement}=setup();occupancy.occupy('a',{x:2,y:2});
      movement.step({entityId:'a',from:{x:2,y:2},destination:{x:3,y:3},now:0,sessionId:'s',revalidateCorners:true});
      runes.place(wall(block.x,block.y));
      expect(movement.completeDue(220,'s')[0].status).toBe(block.x===10?'completed':'cancelled');
      expect(occupancy.positionOf('a')).toEqual(block.x===10?{x:3,y:3}:{x:2,y:2});expect(occupancy.reservedEntries()).toEqual([]);
    }
  });
  it('keeps fire walkable, damages only hostile actors, and continues a non-stacking burn after leaving',()=>{
    const {map,runes}=setup();const field={...wall(3,2),runeId:'fire_field' as const,expiresAt:15000};
    runes.place(field);const actors=[{id:'knight',role:'knight',tileX:3,tileY:2,alive:true},{id:'bot',role:'monster',tileX:3,tileY:2,alive:true}];
    expect(map.isWalkable(field.tile)).toBe(true);expect(runes.resolve(0,actors)).toEqual([{sourceId:'knight',targetId:'bot',amount:20,castId:field.id}]);
    expect(runes.resolve(500,actors)).toEqual([]);actors[1].tileX=4;
    expect(runes.resolve(1000,actors)).toEqual([{sourceId:'knight',targetId:'bot',amount:8,castId:field.id}]);
    actors[0].alive=false;expect(runes.resolve(2000,actors)).toHaveLength(1);
    runes.resolve(5500,actors);expect(runes.conditionCount).toBe(0);
    runes.clear();expect(runes.tiles).toEqual([]);expect(runes.resolve(9000,actors)).toEqual([]);
  });
});
describe('training commands reuse the authoritative engine',()=>{
  it('validates rune IDs, integer tiles, explicit ground targeting and cancellation',()=>{
    expect(validIntent({type:'rune',runeId:'magic_wall',tile:{x:2,y:3}})).toBe(true);
    expect(validIntent({type:'rune',runeId:'bad',tile:{x:2,y:3}} as unknown as PlayerIntent)).toBe(false);
    expect(validIntent({type:'rune',runeId:'magic_wall',tile:{x:2.1,y:3}})).toBe(false);
    const c=new InteractionController();c.armRune('fire_field');expect(c.target({kind:'tile',tile:{x:3,y:4}})).toEqual({type:'rune',runeId:'fire_field',tile:{x:3,y:4}});
    c.armRune('magic_wall');c.cancel();expect(c.target({kind:'tile',tile:{x:2,y:2}})).toBeUndefined();
  });
  it('spends one charge, no fabrication mana, and shares attack exhaustion with explicit spells',()=>{
    const {engine,send}=session();engine.advanceTo(0);
    const mana=engine.entities.find(e=>e.id==='knight')!.mana;
    send({type:'rune',runeId:'magic_wall',tile:{x:7,y:9}});send({type:'rune',runeId:'fire_field',tile:{x:7,y:8}});
    const events=engine.advanceTo(250);expect(events.filter(e=>e.type==='rune_placed')).toHaveLength(1);
    expect(engine.controlResults.slice(-2).map(r=>r.reason)).toEqual(['ok','action-pending']);
    expect(engine.runeStatus('knight','magic_wall')).toMatchObject({charges:7,reason:'cooldown',remaining:2000});
    expect(engine.cooldownState('knight','berserk').remaining).toBe(2000);expect(engine.entities.find(e=>e.id==='knight')!.mana).toBe(mana);
    engine.dispose();expect(engine.runeTiles).toEqual([]);expect(engine.runeConditionCount).toBe(0);
  });
  it('rejects occupied/range/stale requests without consuming a charge',()=>{
    const {engine,send}=session();engine.advanceTo(0);
    for(const tile of [{x:8,y:9},{x:27,y:15}]){send({type:'rune',runeId:'magic_wall',tile});engine.advanceTo(engine.time+250);}
    expect(engine.controlResults.slice(-2).every(r=>!r.accepted)).toBe(true);expect(engine.runeStatus('knight','magic_wall').charges).toBe(8);
    expect(engine.submit({commandId:'old',sessionId:'other',ownerId:'local-player',sequence:100,logicalTick:engine.time,actorId:'knight',intent:{type:'rune',runeId:'magic_wall',tile:{x:7,y:8}}}).reason).toBe('stale-session');
  });
  it('does not enable training runes in hunts, or grant any training rewards',()=>{
    const hunt=session(false);hunt.engine.advanceTo(0);hunt.send({type:'rune',runeId:'magic_wall',tile:{x:7,y:9}});hunt.engine.advanceTo(250);
    expect(hunt.engine.controlResults.at(-1)?.reason).toBe('training-only');
    const {engine,send}=session();for(const hero of ['knight','druid','sorcerer'])send({type:'control',mode:'AI'},hero);
    const result=engine.run();expect(result.victory).toBe(true);expect(result.kills).toBe(1);expect([result.xp,result.gold,result.bossTokens,result.bosses]).toEqual([0,0,0,0]);expect(result.loot).toEqual({});
    expect(result.events.some(e=>['equipment_drop','hero_experience','boss_reward'].includes(e.type))).toBe(false);
    expect(engine.runeTiles).toEqual([]);expect(engine.runeConditionCount).toBe(0);
  });
  it('retains fast reversals in training without OS-repeat changes or a movement queue',()=>{
    const keys=new HeldInput(true);keys.press('KeyA');keys.press('KeyD');keys.press('KeyA');expect(keys.direction()).toEqual({x:1,y:0});
    keys.release('KeyD');expect(keys.direction()).toEqual({x:-1,y:0});keys.press('Numpad8');expect(keys.direction()).toEqual({x:-1,y:-1});keys.clear();expect(keys.direction()).toEqual({x:0,y:0});
    const legacy=new HeldInput();legacy.press('KeyA');legacy.press('KeyD');expect(legacy.direction()).toEqual({x:0,y:0});
  });
  it('preserves rune deadlines and the complete event stream across frame sizes',()=>{
    const play=(frame:number)=>{
      const {engine,send}=session();
      const before=(tick:number)=>{
        if(tick===0)send({type:'rune',runeId:'fire_field',tile:{x:15,y:9}});
        if(tick===2000)send({type:'rune',runeId:'magic_wall',tile:{x:7,y:7}},'druid');
      };
      for(let time=0;time<30000;time+=frame)engine.advanceTo(time,before);
      engine.advanceTo(30000,before);return engine.result.events;
    };
    const a=play(73),b=play(1000);expect(a).toEqual(b);
    expect(a.filter(e=>e.type==='rune_placed').map(e=>e.time)).toEqual([0,2000]);
    expect(a.filter(e=>e.type==='rune_removed').map(e=>e.time)).toEqual([15000,22000]);
    const hits=a.filter(e=>e.type==='damage'&&e.data?.castId?.startsWith('rune-'));
    expect(hits[0]?.time).toBe(0);expect(hits[1]?.time).toBe(1000);
  });
  it('batch drain preserves the live stream and never exposes live snapshot mutations',()=>{
    const a=session(),b=session();
    for(const s of [a,b])for(const hero of ['knight','druid','sorcerer'])s.send({type:'control',mode:'AI'},hero);
    const copy=b.engine.advanceTo(250);const spawn=copy.find(e=>e.type==='spawn'&&e.data?.entity)!;
    spawn.data!.entity!.hp=0;
    expect(b.engine.entities.find(e=>e.id===spawn.targetId)!.hp).toBeGreaterThan(0);
    expect(b.engine.run()).toEqual(a.engine.run());expect(b.engine.advanceTo(b.engine.time+1000)).toEqual([]);
  });
});
