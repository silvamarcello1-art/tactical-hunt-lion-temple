import {describe,it,expect} from 'vitest';
import {CombatEngine} from '../combat/CombatEngine';
import {AssistanceStore} from '../app/AssistanceStore';
import {actionSlots,bindingForCode,iconMarkup} from '../data/actionBar';
import {HeldInput} from './PlayerInput';
import type {PlayerIntent} from './PlayerCommand';
import {polishedFloors,floors,heroes} from '../data/config';
import {progressFromTotal} from '../combat/Progression';
import {defaultAbilityPreferences} from '../data/abilities';
import {CombatPresentationSystem,interpolatePath} from '../game/presentation/CombatPresentationSystem';
import type {CombatEvent} from '../events/types';
function session(polished=false) {
  const progress=polished?Object.fromEntries(heroes.map(h=>[h.id,progressFromTotal(0)])):undefined;
  const engine=new CombatEngine(803,undefined,undefined,progress,{},false,polished);let sequence=0;
  const send=(intent:PlayerIntent,actorId='sorcerer')=>engine.submit({commandId:`p-${++sequence}`,sequence,actorId,ownerId:'local-player',sessionId:engine.id,logicalTick:engine.time,intent});
  return {engine,send};
}
describe('MVP 2B.1 controls and assist',()=>{
  it.each(['knight','druid','sorcerer'])('binds real stable slots and icon identity for %s',hero=>{
    expect(actionSlots(hero)).toHaveLength(3);
    for(const s of actionSlots(hero)) {
      expect(s.ability.vocation).toBe(hero);expect(bindingForCode(hero,s.code)?.ability.id).toBe(s.abilityId);
      expect(iconMarkup(s.abilityId)).toContain(`${s.abilityId}.svg`);
      expect(bindingForCode(hero,`Numpad${s.key}`)).toBeUndefined();
    }
    expect(bindingForCode(hero,'Digit9')).toBeUndefined();
  });
  it.each([['Numpad7',-1,-1],['Numpad8',0,-1],['Numpad9',1,-1],['Numpad4',-1,0],['Numpad6',1,0],['Numpad1',-1,1],['Numpad2',0,1],['Numpad3',1,1]] as const)('physical %s does not depend on key/NumLock', (code,x,y)=>{
    const held=new HeldInput();expect(held.press(code)).toBe(true);expect(held.direction()).toEqual({x,y});held.release(code);expect(held.direction()).toEqual({x:0,y:0});
  });
  it.each([[false,false],[true,false],[false,true],[true,true]])('assist categories attack=%s spells=%s share one budget and never walk', (autoAttack,autoSpells)=>{
    const {engine,send}=session();
    send({type:'control',mode:'ASSISTED'});send({type:'assistance',autoAttack,autoSpells});send({type:'attack',targetId:'lion-3'});
    const events=engine.advanceTo(0).filter(e=>e.sourceId==='sorcerer');
    const actions=events.filter(e=>e.type==='basic_attack'||e.type==='cast');
    expect(actions.length).toBe(autoAttack||autoSpells?1:0);
    expect(actions[0]?.type).toBe(autoSpells?'cast':autoAttack?'basic_attack':undefined);
    expect(events.some(e=>e.type==='movement_started')).toBe(false);
    expect(engine.assistanceOf('knight')).toEqual({autoAttack:true,autoSpells:true});
    send({type:'move',dx:-1,dy:0});engine.advanceTo(250);
    expect(engine.controlOf('sorcerer').mode).toBe('ASSISTED');
  });
  it('does not engage on preference reload; movement takes over only Auto',()=>{
    const {engine,send}=session();send({type:'control',mode:'ASSISTED'});send({type:'assistance',autoAttack:true,autoSpells:true});
    expect(engine.advanceTo(1000).filter(e=>e.sourceId==='sorcerer'&&['cast','basic_attack','movement_started'].includes(e.type))).toEqual([]);
    send({type:'move',dx:-1,dy:0},'knight');engine.advanceTo(1250);
    expect(engine.controlOf('knight').mode).toBe('MANUAL');expect(engine.controlOf('druid').mode).toBe('AI');
  });
  it('explicit cast wins over assist with one charge and cooldown remaining on the live clock',()=>{
    const {engine,send}=session();send({type:'control',mode:'ASSISTED'});send({type:'attack',targetId:'lion-3'});send({type:'cast',abilityId:'flame_strike',targetId:'lion-3'});
    const events=engine.advanceTo(0);expect(events.filter(e=>e.sourceId==='sorcerer'&&['cast','basic_attack'].includes(e.type))).toHaveLength(1);
    expect(engine.entities.find(e=>e.id==='sorcerer')!.mana).toBe(heroes.find(h=>h.id==='sorcerer')!.mana-20);
    expect(engine.cooldownState('sorcerer','flame_strike')).toEqual({remaining:2000,duration:2000});
    expect(engine.cooldownState('sorcerer','energy_wave')).toEqual({remaining:2000,duration:2000});
  });
  it('coalesces a burst of steps and does not retain a queue after release',()=>{
    const {engine,send}=session();send({type:'control',mode:'MANUAL'},'knight');
    for(let i=0;i<50;i++)send({type:'move',dx:-1,dy:0},'knight');
    engine.advanceTo(500);expect(engine.entities.find(e=>e.id==='knight')).toMatchObject({tileX:7,tileY:9});
    engine.advanceTo(1000);expect(engine.entities.find(e=>e.id==='knight')).toMatchObject({tileX:7,tileY:9});
  });
  it('persists only independent booleans, with no orders or modes',()=>{
    const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
    values.set('tactical-hunt-equipment-v2','keep');const s=new AssistanceStore(storage);
    expect(s.set('druid',{autoAttack:false,autoSpells:true})).toBe(true);
    const restored=new AssistanceStore(storage);expect(restored.get('druid')).toEqual({autoAttack:false,autoSpells:true});expect(restored.get('knight')).toEqual({autoAttack:true,autoSpells:true});
    expect(values.get('tactical-hunt-equipment-v2')).toBe('keep');expect(values.get('tactical-hunt-assistance-v1')).not.toMatch(/target|mode|orders/);
  });
  it('disabling categories stops new actions but preserves an already launched projectile',()=>{
    const {engine,send}=session();send({type:'control',mode:'ASSISTED'});send({type:'attack',targetId:'lion-3'});
    const launch=engine.advanceTo(0).find(e=>e.type==='projectile'&&e.sourceId==='sorcerer')!;expect(launch).toBeDefined();
    send({type:'assistance',autoAttack:false,autoSpells:false});const events=engine.advanceTo(1250);
    expect(events.filter(e=>e.sourceId==='sorcerer'&&['cast','basic_attack'].includes(e.type))).toEqual([]);
    expect(events.some(e=>e.type==='projectile_resolved'&&e.data?.castId===launch.data?.castId)).toBe(true);
  });
  it('target death stops assist until another explicit engage',()=>{
    const {engine,send}=session();send({type:'control',mode:'ASSISTED'});send({type:'attack',targetId:'lion-3'});
    let time=0,dead=false;
    for(;time<20000&&!dead;time+=250)dead=engine.advanceTo(time).some(e=>e.type==='death'&&e.targetId==='lion-3');
    expect(dead).toBe(true);
    expect(engine.advanceTo(time+1000).filter(e=>e.sourceId==='sorcerer'&&['cast','basic_attack','movement_started'].includes(e.type))).toEqual([]);
    const next=engine.entities.find(e=>e.alive&&!['knight','druid','sorcerer'].includes(e.id));expect(next).toBeDefined();
    send({type:'attack',targetId:next!.id});engine.advanceTo(time+1250);expect(engine.controlResults.at(-1)?.accepted).toBe(true);
  });
});
describe('projectile geometry and separate polished ruleset',()=>{
  it.each([[5,0],[0,5],[5,2],[2,5],[-5,2],[5,-2]])('direct line has no supercover elbows (%s,%s)',(dx,dy)=>{
    const path=[{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:1+dx,y:1+dy}];
    for(const t of [.1,.25,.5,.75,1])expect(interpolatePath(path,t)).toEqual({x:32+dx*32*t,y:32+dy*32*t});
  });
  it('freezes projectile geometry on the same time and cleans cancel/reset',()=>{
    const s=new CombatPresentationSystem();const event:CombatEvent={id:'1',type:'projectile',time:0,floor:1,data:{castId:'p',originTile:{x:1,y:1},targetTile:{x:6,y:3},visualOrigin:{x:40,y:8},visualImpact:{x:192,y:78},startedAt:0,impactAt:400,sessionId:'s'}};
    s.handle(event);s.setTime(200);expect(s.projectiles.get('p')?.position).toEqual({x:116,y:43});s.setTime(200);expect(s.projectiles.get('p')?.position).toEqual({x:116,y:43});
    s.handle({...event,id:'2',time:200,type:'projectile_cancelled'});expect(s.projectiles.size).toBe(0);s.reset();expect(s.entities.size+s.projectiles.size+s.telegraphs.size).toBe(0);
  });
  it('adds two bounded compositions without granting additional rewards or mutating legacy roster',()=>{
    expect(floors.map(f=>f.length)).toEqual([4,4,6,3]);expect(polishedFloors.map(f=>f.length)).toEqual([5,5,6,3]);
    expect(polishedFloors.flat().filter(e=>e.rewardSuppressed).map(e=>e.archetype)).toEqual(['protector','artillery']);
    for(const floor of polishedFloors)expect(new Set(floor.map(e=>`${e.tileX}:${e.tileY}`)).size).toBe(floor.length);
    const {engine}=session(true);const result=engine.run();expect(result.victory).toBe(true);expect(result.kills).toBe(19);
    expect(result.events.filter(e=>e.type==='experience'&&e.targetId)).toHaveLength(17);
    expect(result.events.filter(e=>e.type==='experience'&&!e.targetId)).toHaveLength(4);
    expect(result.events.filter(e=>e.type==='experience').reduce((xp,e)=>xp+(e.data?.amount??0),0)).toBe(4240);
    expect(result.events.filter(e=>e.type==='loot'&&['bronze-bastion-1','wandering-ballista-1'].includes(e.sourceId??''))).toEqual([]);
    expect(result.events.some(e=>e.type==='spell_telegraph'&&e.sourceId==='wandering-ballista-1')).toBe(true);
    for(const p of result.events.filter(e=>e.type==='projectile'))expect(p.data?.visualOrigin).toBeDefined();
    expect(result.events.some(e=>e.type==='projectile_cancelled'&&e.data?.reason==='target-moved')).toBe(true);
    for(const damage of result.events.filter(e=>e.type==='damage'&&e.data?.castId)) {
      const launch=result.events.find(e=>e.type==='projectile'&&e.data?.castId===damage.data?.castId);
      if(launch)expect(damage.time).toBe(launch.data?.impactAt);
    }
  });
  it('polished lifecycle scheduling is identical across frame sizes and closes all reservations',()=>{
    const expected=session(true).engine.run();
    for(const delta of [73,1000]) {
      const {engine}=session(true);const events:CombatEvent[]=[];
      for(let time=0;!engine.completed;time+=delta)events.push(...engine.advanceTo(time));
      expect(engine.result).toEqual(expected);expect(events).toEqual(expected.events);
    }
    const reserved=new Set<string>(),pending=new Set<string>();
    for(const e of expected.events){if(e.type==='tile_reserved')reserved.add(e.sourceId!);if(['movement_completed','movement_cancelled'].includes(e.type))reserved.delete(e.sourceId!);if(e.type==='projectile')pending.add(e.data!.castId!);if(['projectile_resolved','projectile_cancelled'].includes(e.type))pending.delete(e.data!.castId!);if(e.type==='floor_complete')expect([reserved.size,pending.size]).toEqual([0,0]);}
  });
  it('three evolving polished hunts retain the party and exact reward budget',()=>{
    let progress=Object.fromEntries(heroes.map(h=>[h.id,progressFromTotal(0)]));
    for(let cycle=1;cycle<=3;cycle++) {
      const engine=new CombatEngine(803,undefined,`polish-cycle-${cycle}`,progress,{},true,true),result=engine.run();
      const deaths=result.events.filter(e=>e.type==='death'&&heroes.some(h=>h.id===e.targetId));
      console.info('Evolving polished cycle',cycle,{duration:result.duration,deaths:deaths.map(e=>({floor:e.floor,source:e.sourceId,target:e.targetId,time:e.time})),hp:engine.entities.filter(e=>heroes.some(h=>h.id===e.id)).map(e=>({id:e.id,hp:e.hp}))});
      expect(result.victory).toBe(true);expect(result.xp).toBe(4240);expect(deaths).toEqual([]);
      progress=engine.progression;
    }
  });
  it('polished stress keeps occupancy and lifecycle valid with both wave settings',()=>{
    const outcomes:Record<string,number>={};
    for(const seed of [803,811,814])for(const wave of [true,false]) {
      const preferences=defaultAbilityPreferences();preferences.energy_wave.enabled=wave;
      const engine=new CombatEngine(seed,preferences,undefined,Object.fromEntries(heroes.map(h=>[h.id,progressFromTotal(0)])),{},true,true);
      const reserved=new Set<string>(),projectiles=new Set<string>(),hazards=new Set<string>();
      for(let t=0;!engine.completed&&t<=250000;t+=173) {
        for(const e of engine.advanceTo(t)) {
          if(e.type==='tile_reserved')reserved.add(e.sourceId!);
          if(['movement_completed','movement_cancelled'].includes(e.type))reserved.delete(e.sourceId!);
          if(e.type==='projectile')projectiles.add(e.data!.castId!);
          if(['projectile_resolved','projectile_cancelled'].includes(e.type))projectiles.delete(e.data!.castId!);
          if(e.type==='spell_telegraph')hazards.add(e.data!.castId!);
          if(['spell_resolved','spell_cancelled'].includes(e.type))hazards.delete(e.data!.castId!);
          if(e.type==='floor_complete')expect([reserved.size,projectiles.size,hazards.size]).toEqual([0,0,0]);
        }
        const alive=engine.entities.filter(e=>e.alive);expect(new Set(alive.map(e=>`${e.tileX}:${e.tileY}`)).size).toBe(alive.length);
        for(const e of alive)expect(e.tileX>=2&&e.tileX<=27&&e.tileY>=2&&e.tileY<=15).toBe(true);
      }
      expect(engine.completed).toBe(true);const reason=engine.result.floorCompletionReasons.at(-1)!;expect(['victory','party_defeated']).toContain(reason);outcomes[reason]=(outcomes[reason]??0)+1;
    }
    console.info('Polished ruleset stress (6 hunts):',outcomes);
  },60000);
});
