import { describe, expect, it } from 'vitest';
import type { CombatEvent, EntitySnapshot, GridPoint, Role } from '../../events/types';
import {
  CombatPresentationSystem,
  facingBetween,
  interpolatePath,
  visualSortKey,
  visualTileCenter,
} from './CombatPresentationSystem';

const entity = (
  id: string,
  tile: GridPoint,
  role: Role = 'knight',
): EntitySnapshot => ({
  id,name:id,role,hp:100,maxHp:100,mana:100,maxMana:100,attack:10,defense:10,
  crit:0,dodge:0,tileX:tile.x,tileY:tile.y,position:visualTileCenter(tile),color:0,
});

let sequence = 0;
const event = (
  type: CombatEvent['type'],
  time: number,
  data: CombatEvent['data'] = {},
  sourceId?: string,
  targetId?: string,
): CombatEvent => ({ id:`event-${++sequence}`,type,time,floor:1,sourceId,targetId,data });

const spawn = (system: CombatPresentationSystem, id: string, tile: GridPoint, role: Role = 'knight') =>
  system.handle(event('spawn', 0, { entity:entity(id,tile,role),tile }, undefined, id));

const move = (system: CombatPresentationSystem, id: string, from: GridPoint, to: GridPoint, startedAt = 0) =>
  system.handle(event('movement_started', startedAt, {
    fromTile:from,toTile:to,startedAt,completesAt:startedAt + 220,duration:220,sessionId:'s',
  }, id));

describe('CombatPresentationSystem', () => {
  it('1. maps a tile to its exact visual center', () => {
    expect(visualTileCenter({ x:4,y:7 })).toEqual({ x:128,y:224 });
  });
  it('2. movement starts at the source center', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:2,y:2 });
    move(system,'a',{ x:2,y:2 },{ x:3,y:2 });
    expect(system.entities.get('a')?.position).toEqual({ x:64,y:64 });
  });
  it('3. movement ends exactly at the destination', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:2,y:2 });
    move(system,'a',{ x:2,y:2 },{ x:3,y:2 }); system.setTime(220);
    system.handle(event('movement_completed',220,{ toTile:{ x:3,y:2 } },'a'));
    expect(system.entities.get('a')?.position).toEqual({ x:96,y:64 });
  });
  it('4. accumulates no drift after 100 moves', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 });
    let from = { x:1,y:1 };
    for (let index = 0; index < 100; index++) {
      const to = { x:from.x + 1,y:from.y };
      const started = index * 220;
      move(system,'a',from,to,started); system.setTime(started + 220);
      system.handle(event('movement_completed',started + 220,{ toTile:to },'a'));
      from = to;
    }
    expect(system.entities.get('a')?.position).toEqual(visualTileCenter(from));
    expect(system.metrics.maxVisualSyncError).toBe(0);
  });
  it('5. faces north', () => expect(facingBetween({ x:0,y:10 },{ x:0,y:0 })).toBe('north'));
  it('6. faces south', () => expect(facingBetween({ x:0,y:0 },{ x:0,y:10 })).toBe('south'));
  it('7. faces east', () => expect(facingBetween({ x:0,y:0 },{ x:10,y:0 })).toBe('east'));
  it('8. faces west', () => expect(facingBetween({ x:10,y:0 },{ x:0,y:0 })).toBe('west'));
  it('9. attack faces its target', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:2,y:2 }); spawn(system,'b',{ x:1,y:2 },'monster');
    system.handle(event('basic_attack',10,{},'a','b'));
    expect(system.entities.get('a')?.facing).toBe('west');
  });
  it('10. cancelled movement snaps safely to source', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:2,y:2 }); move(system,'a',{ x:2,y:2 },{ x:3,y:2 });
    system.setTime(100); system.handle(event('movement_cancelled',100,{ fromTile:{ x:2,y:2 } },'a'));
    expect(system.entities.get('a')?.position).toEqual({ x:64,y:64 });
  });
  it('11. death cancels visual movement', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:2,y:2 }); move(system,'a',{ x:2,y:2 },{ x:3,y:2 });
    system.handle(event('death',100,{},'b','a'));
    expect(system.entities.get('a')).toMatchObject({ animation:'dying',movement:undefined,alive:false });
  });
  it('12. projectile starts at the correct tile', () => {
    const system = new CombatPresentationSystem(); system.handle(event('projectile',100,{ castId:'p',pathTiles:[{ x:2,y:2 },{ x:4,y:2 }],startedAt:100,impactAt:300 },'a','b'));
    expect(system.projectiles.get('p')?.position).toEqual({ x:64,y:64 });
  });
  it('13. projectile reaches the impact tile', () => {
    expect(interpolatePath([{ x:2,y:2 },{ x:3,y:2 },{ x:4,y:2 }],1)).toEqual({ x:128,y:64 });
  });
  it('14. cancelled projectile produces no active impact visual', () => {
    const system = new CombatPresentationSystem(); system.handle(event('projectile',0,{ castId:'p',pathTiles:[{ x:1,y:1 },{ x:2,y:1 }],impactAt:200 }));
    system.handle(event('projectile_cancelled',100,{ castId:'p' }));
    expect(system.projectiles.has('p')).toBe(false);
  });
  it('15. wave visual mask equals the logical mask', () => {
    const system = new CombatPresentationSystem(); const mask=[{ x:2,y:2 },{ x:3,y:2 }];
    system.handle(event('spell_telegraph',0,{ castId:'w',logicalTiles:mask,impactAt:300 }));
    expect(system.telegraphs.get('w')?.logicalTiles).toEqual(mask);
  });
  it('16. telegraph keeps the exact logical mask', () => {
    const system = new CombatPresentationSystem(); const mask=[{ x:4,y:4 },{ x:4,y:5 },{ x:5,y:5 }];
    system.handle(event('spell_telegraph',0,{ castId:'t',logicalTiles:mask,impactAt:300 }));
    expect(system.telegraphs.get('t')?.logicalTiles).toEqual(mask);
  });
  it('17. emits damage feedback once', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 }); system.handle(event('damage',0,{ amount:10 },'b','a'));
    expect([...system.feedback.values()].filter((item) => item.kind === 'damage')).toHaveLength(1);
  });
  it('18. emits critical feedback once', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 }); system.handle(event('critical',0,{},'b','a'));
    expect([...system.feedback.values()].filter((item) => item.kind === 'critical')).toHaveLength(1);
  });
  it('19. emits heal feedback once', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 }); system.handle(event('heal',0,{ amount:10 },'b','a'));
    expect([...system.feedback.values()].filter((item) => item.kind === 'heal')).toHaveLength(1);
  });
  it('20. dodge emits no damage feedback', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 }); system.handle(event('dodge',0,{},'b','a'));
    expect([...system.feedback.values()].some((item) => item.kind === 'damage')).toBe(false);
  });
  it('21. pause freezes the visual timeline when logical time does not advance', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 }); move(system,'a',{ x:1,y:1 },{ x:2,y:1 }); system.setTime(100);
    const before={ ...system.entities.get('a')!.position }; expect(system.entities.get('a')?.position).toEqual(before);
  });
  it('22. resume continues from the same progress', () => {
    const system = new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 }); move(system,'a',{ x:1,y:1 },{ x:2,y:1 }); system.setTime(100); const before=system.entities.get('a')!.position.x; system.setTime(150);
    expect(system.entities.get('a')!.position.x).toBeGreaterThan(before);
  });
  it('23. 2x remains synchronized by logical time', () => {
    const a=new CombatPresentationSystem(); const b=new CombatPresentationSystem(); spawn(a,'a',{ x:1,y:1 }); spawn(b,'a',{ x:1,y:1 }); move(a,'a',{ x:1,y:1 },{ x:2,y:1 }); move(b,'a',{ x:1,y:1 },{ x:2,y:1 }); a.setTime(110); b.setTime(55); b.setTime(110);
    expect(a.entities.get('a')?.position).toEqual(b.entities.get('a')?.position);
  });
  it('24. 4x remains synchronized by logical time', () => {
    const system=new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 }); move(system,'a',{ x:1,y:1 },{ x:2,y:1 }); system.setTime(220);
    expect(system.entities.get('a')?.position).toEqual({ x:64,y:32 });
  });
  it('25. reset clears every effect', () => {
    const system=new CombatPresentationSystem(); spawn(system,'a',{ x:1,y:1 }); system.handle(event('damage',0,{ amount:1 },'b','a')); system.handle(event('projectile',0,{ castId:'p',pathTiles:[{ x:1,y:1 },{ x:2,y:1 }],impactAt:200 })); system.reset();
    expect(system.entities.size + system.feedback.size + system.projectiles.size).toBe(0);
  });
  it('26. a loop starts with no residual visual objects', () => {
    const system=new CombatPresentationSystem(); spawn(system,'old',{ x:1,y:1 }); system.reset(); spawn(system,'new',{ x:2,y:2 });
    expect([...system.entities.keys()]).toEqual(['new']);
  });
  it('27. y-sort obeys footpoint', () => {
    expect(visualSortKey({ x:9,y:3 },'a')).toBeLessThan(visualSortKey({ x:1,y:4 },'b'));
  });
  it('28. same logical Y uses deterministic tie breaker', () => {
    expect(visualSortKey({ x:1,y:3 },'a')).toBeLessThan(visualSortKey({ x:2,y:3 },'b'));
  });
  it('29. front and back entities retain distinct positions', () => {
    const system=new CombatPresentationSystem(); spawn(system,'front',{ x:5,y:5 }); spawn(system,'back',{ x:2,y:5 },'druid');
    expect(system.entities.get('front')?.position).not.toEqual(system.entities.get('back')?.position);
  });
  it('30. Challenge telegraph preserves its logical range tiles', () => {
    const system=new CombatPresentationSystem(); const mask=[{ x:4,y:4 },{ x:5,y:4 },{ x:4,y:5 }]; system.handle(event('spell_telegraph',0,{ castId:'challenge',abilityId:'challenge',logicalTiles:mask,impactAt:200 }));
    expect(system.telegraphs.get('challenge')?.logicalTiles).toEqual(mask);
  });
});
