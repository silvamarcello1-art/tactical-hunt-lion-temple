import { describe, expect, it } from 'vitest';
import { CombatEngine } from '../combat/CombatEngine';
import { heroes, HUNT_LAYOUT_CONFIG } from '../data/config';
import { defaultAbilityPreferences } from '../data/abilities';
import { LiveEventPlayer } from '../events/LiveEventPlayer';
import type { CombatEvent } from '../events/types';
import { HeldInput, screenToTile } from './PlayerInput';
import { InteractionController } from './InteractionState';
import type { PlayerIntent, PlayerCommand } from './PlayerCommand';

function session() {
  const engine = new CombatEngine();
  let sequence = 0;
  const command = (intent:PlayerIntent, actorId = 'knight'):PlayerCommand => ({
    commandId:`test-${++sequence}`, sequence, actorId, ownerId:'local-player', sessionId:engine.id, logicalTick:engine.time, intent,
  });
  const send = (intent:PlayerIntent, actorId = 'knight') => engine.submit(command(intent,actorId));
  return {engine,send,command};
}
const actor = (engine:CombatEngine,id = 'knight') => engine.entities.find(entity => entity.id === id)!;

describe('shared live engine and player commands', () => {
  it('streams exactly the same Auto timeline independently of frame size', () => {
    const expected = new CombatEngine().run();
    for (const delta of [73,1000]) {
      const engine = new CombatEngine();
      const events:CombatEvent[] = [];
      for (let time = 0; !engine.completed; time += delta) events.push(...engine.advanceTo(time));
      expect(engine.result).toEqual(expected);
      expect(events).toEqual(expected.events);
    }
  });

  it('Manual owns one actor; other heroes continue AI; switching does not recreate actors', () => {
    const {engine,send} = session();
    send({type:'control',mode:'MANUAL'});
    const events = engine.advanceTo(500);
    expect(actor(engine)).toMatchObject({tileX:8,tileY:9,mana:720});
    expect(events.filter(event => event.sourceId === 'knight' && ['movement_started','cast','basic_attack'].includes(event.type))).toEqual([]);
    expect(events.some(event => event.sourceId === 'sorcerer' && event.type === 'movement_started')).toBe(true);
    const before = actor(engine);
    send({type:'control',mode:'AI'});
    expect(actor(engine)).toEqual(before); // Input only queues; no direct mutation.
    const resumed = engine.advanceTo(750);
    expect(engine.controlOf('knight')).toEqual({mode:'AI',ownerId:undefined});
    expect(resumed.some(event => event.type === 'spawn')).toBe(false);
    expect(actor(engine).hp).toBeLessThanOrEqual(before.hp);
  });

  it('held keys sample one direction per logical tick and stop on release', () => {
    const {engine,send} = session();
    const held = new HeldInput();
    send({type:'control',mode:'MANUAL'});
    for (let n = 0; n < 50; n++) held.press('KeyA');
    engine.advanceTo(500,() => { const {x:dx,y:dy} = held.direction(); if (dx || dy) send({type:'move',dx,dy}); });
    expect(actor(engine)).toMatchObject({tileX:6,tileY:9});
    held.clear();
    engine.advanceTo(750);
    expect(actor(engine)).toMatchObject({tileX:5,tileY:9});
    engine.advanceTo(1000);
    expect(actor(engine)).toMatchObject({tileX:5,tileY:9});
  });

  it('direct diagonal input cannot detour around a corner or reserve occupied terrain', () => {
    const original = {...heroes[0]};
    try {
      Object.assign(heroes[0],{tileX:11,tileY:6});
      const {engine,send} = session();
      send({type:'control',mode:'MANUAL'});
      send({type:'move',dx:1,dy:1}); // (12,7) free; (12,6) blocked.
      const events = engine.advanceTo(0);
      expect(actor(engine)).toMatchObject({tileX:11,tileY:6});
      expect(engine.controlResults.at(-1)?.reason).toBe('blocked');
      expect(events.some(event => event.sourceId === 'knight' && event.type === 'tile_reserved')).toBe(false);
      send({type:'move',dx:0,dy:1});
      engine.advanceTo(500);
      expect(actor(engine)).toMatchObject({tileX:11,tileY:7});
    } finally { Object.assign(heroes[0],original); }
  });

  it('validates authority, malformed commands, stale sessions and duplicate sequences', () => {
    const {engine,command} = session();
    const first = command({type:'control',mode:'MANUAL'});
    expect(engine.submit({...first,sessionId:'old'}).reason).toBe('stale-session');
    expect(engine.submit({...first,ownerId:'another-player'}).reason).toBe('ownership');
    expect(engine.submit({...first,intent:{type:'move',dx:100,dy:0}}).reason).toBe('invalid-command');
    expect(engine.submit(first).accepted).toBe(true);
    expect(engine.submit(first).reason).toBe('sequence');
    const second = command({type:'move',dx:-1,dy:0});
    engine.submit(second);
    second.intent = {type:'move',dx:1,dy:0}; // Queue owns a copy.
    engine.advanceTo(250);
    expect(actor(engine)).toMatchObject({tileX:7,tileY:9});
  });

  it('attack chases and uses the existing damage pipeline; Stop releases the order', () => {
    const {engine,send} = session();
    send({type:'control',mode:'MANUAL'});
    send({type:'attack',targetId:'lion-1'});
    const events = engine.advanceTo(1000);
    expect(events.some(event => event.sourceId === 'knight' && event.type === 'basic_attack')).toBe(true);
    expect(events.some(event => event.sourceId === 'knight' && ['damage','dodge'].includes(event.type))).toBe(true);
    send({type:'stop'});
    const stopped = engine.advanceTo(2500);
    expect(actor(engine).targetId).toBeUndefined();
    expect(stopped.some(event => event.sourceId === 'knight' && ['basic_attack','movement_started','cast'].includes(event.type))).toBe(false);
  });

  it('Follow moves without attacking; move overrides Follow; invalid targets fail', () => {
    const {engine,send} = session();
    send({type:'control',mode:'MANUAL'});
    send({type:'follow',targetId:'sorcerer'});
    const events = engine.advanceTo(500);
    expect(events.some(event => event.sourceId === 'knight' && event.type === 'movement_started')).toBe(true);
    expect(events.some(event => event.sourceId === 'knight' && event.type === 'basic_attack')).toBe(false);
    send({type:'attack',targetId:'sorcerer'});
    engine.advanceTo(750);
    expect(engine.controlResults.at(-1)?.reason).toBe('invalid-target');
    send({type:'stop'});
    engine.advanceTo(1000);
    send({type:'move',dx:-1,dy:0});
    engine.advanceTo(1500);
    const position = actor(engine);
    engine.advanceTo(2000);
    expect(actor(engine)).toMatchObject({tileX:position.tileX,tileY:position.tileY});
  });

  it('player casts reuse masks and cooldowns and reject a repeated cast', () => {
    const originalY = heroes[2].tileY;
    heroes[2].tileY = 13; // Cardinal alignment with lion-3, inside the real wave mask.
    try {
    const {engine,send} = session();
    send({type:'control',mode:'MANUAL'},'sorcerer');
    send({type:'cast',abilityId:'energy_wave',targetId:'lion-3'},'sorcerer');
    const events = engine.advanceTo(0);
    const cast = events.find(event => event.type === 'cast' && event.sourceId === 'sorcerer');
    expect(cast?.data?.logicalTiles?.length).toBeGreaterThan(0);
    expect(events.find(event => event.type === 'spell_resolved' && event.data?.castId === cast?.data?.castId)?.data?.logicalTiles).toEqual(cast?.data?.logicalTiles);
    const mana = actor(engine,'sorcerer').mana;
    send({type:'cast',abilityId:'energy_wave',targetId:'lion-3'},'sorcerer');
    engine.advanceTo(250);
    expect(engine.controlResults.at(-1)?.reason).toBe('cooldown');
    expect(actor(engine,'sorcerer').mana).toBe(mana);
    } finally { heroes[2].tileY = originalY; }
  });

  it('ranged manual attacks never apply damage before authoritative impact', () => {
    const {engine,send} = session();
    send({type:'control',mode:'MANUAL'},'sorcerer');
    send({type:'attack',targetId:'lion-3'},'sorcerer');
    const initial = engine.advanceTo(0);
    const projectile = initial.find(event => event.type === 'projectile' && event.sourceId === 'sorcerer')!;
    expect(projectile).toBeDefined();
    expect(initial.some(event => event.type === 'damage' && event.sourceId === 'sorcerer')).toBe(false);
    const later = engine.advanceTo(750);
    for (const event of later.filter(event => event.type === 'damage' && event.data?.castId === projectile.data?.castId)) expect(event.time).toBeGreaterThanOrEqual(projectile.data!.impactAt!);
    expect(later.some(event => event.type === 'projectile_resolved' && event.data?.castId === projectile.data?.castId)).toBe(true);
  });

  it('unsupported inventory interactions reject without mutating gameplay', () => {
    const {engine,send} = session();
    send({type:'control',mode:'MANUAL'});
    send({type:'use-with',itemId:'not-an-item',target:{kind:'entity',entityId:'knight'}});
    engine.advanceTo(0);
    expect(engine.controlResults.at(-1)?.reason).toBe('unsupported-interaction');
    expect(actor(engine)).toMatchObject({mana:720,tileX:8,tileY:9});
  });

  it('Assisted gives a blocked player step priority and waits for explicit engage', () => {
    const original = {...heroes[0]};
    try {
      Object.assign(heroes[0],{tileX:11,tileY:6});
      const {engine,send} = session();
      send({type:'control',mode:'ASSISTED'});
      send({type:'follow',targetId:'sorcerer'});
      send({type:'move',dx:1,dy:1});
      const blocked = engine.advanceTo(0);
      expect(engine.controlResults.at(-1)?.reason).toBe('blocked');
      expect(blocked.some(event => event.sourceId === 'knight' && ['movement_started','basic_attack','cast'].includes(event.type))).toBe(false);
      expect(engine.advanceTo(1000).some(event => event.sourceId === 'knight' && ['movement_started','basic_attack','cast'].includes(event.type))).toBe(false);
    } finally { Object.assign(heroes[0],original); }
  });

  it('switching Manual to Auto cannot bypass the basic attack cooldown', () => {
    const {engine,send} = session();
    send({type:'control',mode:'MANUAL'});
    send({type:'attack',targetId:'lion-1'});
    const events = engine.advanceTo(250);
    send({type:'control',mode:'AI'});
    events.push(...engine.advanceTo(1500));
    const attacks = events.filter(event => event.sourceId === 'knight' && event.type === 'basic_attack');
    expect(attacks.length).toBeGreaterThan(0);
    for (let index=1; index<attacks.length; index++) expect(attacks[index].time-attacks[index-1].time).toBeGreaterThanOrEqual(750);
  });

  it('manual casters are never repositioned by AI recovery during a full session', () => {
    const {engine,send} = session();
    send({type:'control',mode:'MANUAL'},'sorcerer');
    const result = engine.run();
    expect(result.events.filter(event => event.sourceId === 'sorcerer' && ['movement_started','basic_attack','cast'].includes(event.type))).toEqual([]);
    engine.dispose();
    expect(engine.entities).toEqual([]);
    expect(() => engine.run()).toThrow('disposed');
  });

  it.each([1,2,4])('pause and disposal stop the shared clock at %dx', speed => {
    const {engine,send} = session();
    const events:CombatEvent[] = [];
    const player = new LiveEventPlayer(engine,event => events.push(event),() => {});
    player.speed = speed;
    send({type:'control',mode:'MANUAL'});
    player.play(); player.update(250);
    expect(player.time).toBe(250*speed);
    player.pause();
    const before = engine.entities;
    player.update(1000);
    expect(engine.entities).toEqual(before);
    player.dispose();
    expect(send({type:'move',dx:-1,dy:0}).reason).toBe('session-ended');
    expect(player.play()).toBe(false);
  });

  it('stress: 24 mixed-control hunts preserve tiles, reservations and cast lifecycle', () => {
    const outcomes:Record<string,number> = {};
    for (let seed = 803; seed <= 814; seed++) for (const wave of [true,false]) {
      const preferences = defaultAbilityPreferences(); preferences.energy_wave.enabled = wave;
      const engine = new CombatEngine(seed,preferences);
      let sequence = 0;
      const send = (intent:PlayerIntent) => engine.submit({commandId:`stress-${++sequence}`,sequence,sessionId:engine.id,actorId:'knight',ownerId:'local-player',logicalTick:engine.time,intent});
      const reservations = new Set<string>();
      const projectiles = new Set<string>();
      const hazards = new Set<string>();
      for (let time = 0; !engine.completed && time <= 200000; time += 250) {
        if (time === 0) {send({type:'control',mode:'MANUAL'}); send({type:'move',dx:-1,dy:0});}
        if (time === 500) send({type:'follow',targetId:'lion-1'});
        if (time === 1000) send({type:'attack',targetId:'lion-1'});
        if (time === 2000) send({type:'stop'});
        if (time === 2250) send({type:'control',mode:'AI'});
        for (const event of engine.advanceTo(time)) {
          if (event.type === 'tile_reserved') reservations.add(event.sourceId!);
          if (['movement_completed','movement_cancelled'].includes(event.type)) reservations.delete(event.sourceId!);
          if (event.type === 'projectile') projectiles.add(event.data!.castId!);
          if (['projectile_resolved','projectile_cancelled'].includes(event.type)) projectiles.delete(event.data!.castId!);
          if (event.type === 'spell_telegraph') hazards.add(event.data!.castId!);
          if (['spell_resolved','spell_cancelled'].includes(event.type)) hazards.delete(event.data!.castId!);
          if (event.type === 'floor_complete') expect([reservations.size,projectiles.size,hazards.size]).toEqual([0,0,0]);
        }
        const alive = engine.entities.filter(entity => entity.alive);
        const tiles = alive.map(entity => `${entity.tileX}:${entity.tileY}`);
        expect(new Set(tiles).size).toBe(tiles.length);
        for (const entity of alive) {
          expect(Number.isInteger(entity.tileX) && Number.isInteger(entity.tileY)).toBe(true);
          expect(entity.tileX >= 2 && entity.tileX <= 27 && entity.tileY >= 2 && entity.tileY <= 15).toBe(true);
          expect(HUNT_LAYOUT_CONFIG.blockedTiles.some(tile => tile.x === entity.tileX && tile.y === entity.tileY)).toBe(false);
        }
      }
      expect(engine.completed,`seed ${seed}, wave ${wave}`).toBe(true);
      expect(['victory','party_defeated']).toContain(engine.result.floorCompletionReasons.at(-1));
      if (!engine.result.victory) expect(engine.entities.filter(entity => ['knight','druid','sorcerer'].includes(entity.id)).every(entity => entity.hp === 0)).toBe(true);
      const outcome = engine.result.floorCompletionReasons.at(-1)!;
      outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
    }
    console.info('Mixed-control stress (24 hunts):',outcomes);
  },60000);
});

describe('input and interaction foundation', () => {
  it('combines WASD/arrows, cancels opposite directions and clears focus state', () => {
    const held = new HeldInput(); held.press('KeyW'); held.press('ArrowUp'); held.press('KeyD');
    expect(held.direction()).toEqual({x:1,y:-1});
    held.press('KeyS'); expect(held.direction()).toEqual({x:1,y:0});
    held.release('KeyD'); expect(held.direction()).toEqual({x:0,y:0});
    held.clear(); expect(held.size).toBe(0);
  });
  it('transforms scaled screen coordinates through camera and tile centers', () => {
    const bounds = {left:100,top:50,width:480,height:288};
    expect(screenToTile({x:228,y:194},bounds,{width:960,height:576})).toEqual({x:8,y:9});
    expect(screenToTile({x:228,y:194},bounds,{width:960,height:576},{x:32,y:64,zoom:2})).toEqual({x:5,y:7});
    expect(screenToTile({x:99,y:50},bounds,{width:960,height:576})).toBeUndefined();
  });
  it('targeting returns one command and cancellation clears spell/use-with/drag', () => {
    const input = new InteractionController();
    input.armItem('real-item-id');
    expect(input.target({kind:'entity',entityId:'knight'})).toEqual({type:'use-with',itemId:'real-item-id',target:{kind:'entity',entityId:'knight'}});
    expect(input.state.kind).toBe('idle');
    input.armSpell('energy_wave'); input.cancel(); expect(input.state.kind).toBe('idle');
    input.press('real-item-id',1,{x:0,y:0}); input.move(2,{x:10,y:0}); expect(input.state.kind).toBe('pressed');
    input.move(1,{x:5,y:0}); expect(input.state.kind).toBe('pressed');
    input.move(1,{x:7,y:0}); expect(input.state.kind).toBe('dragging');
    expect(input.drop(2,{kind:'tile',tile:{x:2,y:2}})).toBeUndefined();
    input.cancel(); expect(input.drop(1,{kind:'tile',tile:{x:2,y:2}})).toBeUndefined();
    input.press('real-item-id',1,{x:0,y:0}); input.move(1,{x:7,y:0});
    expect(input.drop(1,{kind:'tile',tile:{x:2,y:2}})?.type).toBe('drop');
    expect(input.state.kind).toBe('idle');
  });
});
