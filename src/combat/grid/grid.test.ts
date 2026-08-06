import { describe, expect, it } from 'vitest';
import { gridToWorld, worldToGrid } from '../tiles';
import { GridMap } from './GridMap';
import { LineOfSightResolver } from './LineOfSightResolver';
import { MovementSystem } from './MovementSystem';
import { OccupancyGrid } from './OccupancyGrid';
import { Pathfinder } from './Pathfinder';
import { ProjectileSystem } from './ProjectileSystem';
import { SpellAreaResolver } from './SpellAreaResolver';
import { createGridMetrics, gridKey } from './GridTypes';

const setup = (blocked: Array<{ x: number; y: number }> = []) => {
  const map = new GridMap(
    12,
    10,
    { minX: 1, maxX: 10, minY: 1, maxY: 8 },
    blocked,
  );
  const occupancy = new OccupancyGrid(map);
  return { map, occupancy };
};

describe('authoritative grid systems', () => {
  it('prevents overlap and conflicting reservations', () => {
    const { occupancy } = setup();
    expect(occupancy.occupy('a', { x: 2, y: 2 }).allowed).toBe(true);
    expect(occupancy.occupy('b', { x: 3, y: 2 }).allowed).toBe(true);
    expect(occupancy.reserve('a', { x: 2, y: 3 }).allowed).toBe(true);
    expect(occupancy.reserve('b', { x: 2, y: 3 })).toMatchObject({
      allowed: false,
      reason: 'reserved',
      blockingEntityId: 'a',
    });
    expect(occupancy.reserve('a', { x: 3, y: 2 })).toMatchObject({
      allowed: false,
      reason: 'occupied',
      blockingEntityId: 'b',
    });
  });

  it('finds a deterministic detour and never cuts a blocked corner', () => {
    const { map, occupancy } = setup([
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]);
    occupancy.occupy('hero', { x: 2, y: 2 });
    const path = new Pathfinder(map, occupancy).findPath(
      { x: 2, y: 2 },
      { x: 5, y: 5 },
      { entityId: 'hero' },
    );
    expect(path[0]).toEqual({ x: 2, y: 1 });
    expect(path).not.toContainEqual({ x: 3, y: 3 });

    map.setBlocked({ x: 2, y: 3 }, false);
    const detour = new Pathfinder(map, occupancy).findPath(
      { x: 2, y: 2 },
      { x: 5, y: 5 },
      { entityId: 'hero' },
    );
    expect(detour[0]).toEqual({ x: 2, y: 3 });
    expect(detour.at(-1)).toEqual({ x: 5, y: 5 });
  });

  it('stops inside goal range instead of entering an occupied target tile', () => {
    const { map, occupancy } = setup();
    occupancy.occupy('knight', { x: 2, y: 2 });
    occupancy.occupy('monster', { x: 7, y: 2 });
    const path = new Pathfinder(map, occupancy).findPath(
      { x: 2, y: 2 },
      { x: 7, y: 2 },
      { entityId: 'knight', goalRange: 1 },
    );
    expect(path.at(-1)).toEqual({ x: 6, y: 2 });
  });

  it('resolves line of sight against terrain and optionally units', () => {
    const { map, occupancy } = setup([{ x: 5, y: 4 }]);
    occupancy.occupy('caster', { x: 2, y: 4 });
    occupancy.occupy('blocker', { x: 4, y: 3 });
    const resolver = new LineOfSightResolver(map, occupancy);
    expect(resolver.hasLineOfSight({ x: 2, y: 4 }, { x: 8, y: 4 })).toBe(false);
    expect(resolver.hasLineOfSight({ x: 2, y: 3 }, { x: 8, y: 3 })).toBe(true);
    expect(
      resolver.hasLineOfSight({ x: 2, y: 3 }, { x: 8, y: 3 }, { blockUnits: true }),
    ).toBe(false);
  });

  it('rotates, clips and deduplicates spell masks on logical tiles', () => {
    const { map, occupancy } = setup();
    const area = new SpellAreaResolver(
      map,
      new LineOfSightResolver(map, occupancy),
    );
    const right = area.resolve({ x: 4, y: 4 }, 'strong_ice_wave', 'right');
    const up = area.resolve({ x: 4, y: 4 }, 'strong_ice_wave', 'up');
    expect(right.length).toBeGreaterThan(0);
    expect(new Set(right.map(gridKey)).size).toBe(right.length);
    expect(right.every((tile) => map.isInside(tile))).toBe(true);
    expect(right.some((tile) => tile.x > 4)).toBe(true);
    expect(up.some((tile) => tile.y < 4)).toBe(true);
  });

  it('keeps origin occupied and destination reserved until logical completion', () => {
    const { map, occupancy } = setup();
    const metrics = createGridMetrics();
    occupancy.occupy('hero', { x: 2, y: 2 });
    const movement = new MovementSystem(map, occupancy, metrics);
    const result = movement.step({
      entityId: 'hero',
      from: { x: 2, y: 2 },
      destination: { x: 6, y: 2 },
      now:100,
      duration:220,
      sessionId:'session-a',
    });
    expect(result).toMatchObject({ moved: true, to: { x: 3, y: 2 } });
    expect(result.pending).toMatchObject({ startedAt:100,completesAt:320 });
    expect(occupancy.positionOf('hero')).toEqual({ x: 2, y: 2 });
    expect(occupancy.reservationOf('hero')).toEqual({ x: 3, y: 2 });
    expect(movement.completeDue(319, 'session-a')).toEqual([]);
    expect(occupancy.positionOf('hero')).toEqual({ x: 2, y: 2 });
    expect(movement.completeDue(320, 'session-a')).toMatchObject([
      { status:'completed' },
    ]);
    expect(occupancy.positionOf('hero')).toEqual({ x: 3, y: 2 });
    expect(occupancy.reservationOf('hero')).toBeUndefined();
    expect(metrics.pathRecalculations).toBe(1);
    expect(metrics.totalPathLength).toBe(4);
    expect(metrics.maxPendingMovements).toBe(1);
  });

  it('arbitrates same-tick movement intents deterministically', () => {
    const { map, occupancy } = setup();
    const metrics = createGridMetrics();
    occupancy.occupy('low', { x: 2, y: 2 });
    occupancy.occupy('high', { x: 4, y: 2 });
    const movement = new MovementSystem(map, occupancy, metrics);
    const results = movement.stepBatch([
      {
        entityId:'low',
        from:{ x:2,y:2 },
        destination:{ x:3,y:2 },
        tacticalPriority:10,
        tickOrder:0,
        sessionId:'session-a',
      },
      {
        entityId:'high',
        from:{ x:4,y:2 },
        destination:{ x:3,y:2 },
        tacticalPriority:20,
        tickOrder:1,
        sessionId:'session-a',
      },
    ]);
    expect(results[0]).toMatchObject({ entityId:'high',result:{ moved:true } });
    expect(results[1]).toMatchObject({
      entityId:'low',
      result:{ moved:false,reason:'reserved',blockingEntityId:'high' },
    });
    expect(occupancy.reservedBy({ x:3,y:2 })).toBe('high');
    expect(metrics.reservationConflicts).toBe(1);
  });

  it('blocks head-on swaps while both origins remain occupied', () => {
    const { map, occupancy } = setup();
    const movement = new MovementSystem(map, occupancy, createGridMetrics());
    occupancy.occupy('a', { x:2,y:2 });
    occupancy.occupy('b', { x:3,y:2 });
    expect(movement.step({
      entityId:'a',from:{ x:2,y:2 },destination:{ x:3,y:2 },sessionId:'s',
    })).toMatchObject({ moved:false,reason:'occupied' });
    expect(movement.step({
      entityId:'b',from:{ x:3,y:2 },destination:{ x:2,y:2 },sessionId:'s',
    })).toMatchObject({ moved:false,reason:'occupied' });
    expect(occupancy.positionOf('a')).toEqual({ x:2,y:2 });
    expect(occupancy.positionOf('b')).toEqual({ x:3,y:2 });
  });

  it('cancels movement on death, reset, or stale session without orphan reservations', () => {
    const { map, occupancy } = setup();
    const movement = new MovementSystem(map, occupancy, createGridMetrics());
    occupancy.occupy('hero', { x:2,y:2 });
    movement.step({
      entityId:'hero',from:{ x:2,y:2 },destination:{ x:5,y:2 },
      now:0,duration:220,sessionId:'session-a',
    });
    expect(movement.cancel('hero', 'entity-dead')).toMatchObject({
      status:'cancelled',reason:'entity-dead',
    });
    occupancy.release('hero');
    expect(occupancy.reservedEntries()).toEqual([]);
    expect(occupancy.occupiedEntries()).toEqual([]);

    occupancy.occupy('hero', { x:2,y:2 });
    movement.step({
      entityId:'hero',from:{ x:2,y:2 },destination:{ x:5,y:2 },
      now:300,duration:220,sessionId:'session-a',
    });
    expect(movement.completeDue(520, 'session-b')).toMatchObject([
      { status:'cancelled',reason:'stale-session' },
    ]);
    expect(occupancy.reservedEntries()).toEqual([]);

    movement.step({
      entityId:'hero',from:{ x:2,y:2 },destination:{ x:5,y:2 },
      now:600,duration:220,sessionId:'session-a',
    });
    expect(movement.cancelAll('reset', 'session-a')).toHaveLength(1);
    expect(occupancy.reservedEntries()).toEqual([]);
  });

  it('recovers a colliding spawn on the nearest free tile', () => {
    const { occupancy } = setup();
    occupancy.occupy('first', { x: 5, y: 5 });
    occupancy.occupy('second', { x: 4, y: 5 });
    expect(occupancy.findNearestFree({ x: 5, y: 5 }, 'third')).toEqual({
      x: 5,
      y: 4,
    });
  });

  it('converts logical tiles to visual coordinates without losing integers', () => {
    const logical = { x: 8, y: 9 };
    expect(worldToGrid(gridToWorld(logical))).toEqual(logical);
  });

  it('reports walkable and blocked terrain explicitly', () => {
    const { map } = setup([{ x: 4, y: 4 }]);
    expect(map.tile({ x: 3, y: 4 })).toMatchObject({ walkable: true });
    expect(map.tile({ x: 4, y: 4 })).toMatchObject({ walkable: false });
    expect(map.tile({ x: 0, y: 0 })).toMatchObject({ walkable: false });
  });

  it('releases occupancy and reservations when an entity leaves the grid', () => {
    const { occupancy } = setup();
    occupancy.occupy('monster', { x: 4, y: 4 });
    occupancy.reserve('monster', { x: 5, y: 4 });
    occupancy.release('monster');
    expect(occupancy.occupantAt({ x: 4, y: 4 })).toBeUndefined();
    expect(occupancy.reservedBy({ x: 5, y: 4 })).toBeUndefined();
  });

  it('returns the same direct path for the same inputs', () => {
    const { map, occupancy } = setup();
    occupancy.occupy('hero', { x: 2, y: 2 });
    const pathfinder = new Pathfinder(map, occupancy);
    const first = pathfinder.findPath(
      { x: 2, y: 2 },
      { x: 7, y: 2 },
      { entityId: 'hero' },
    );
    const second = pathfinder.findPath(
      { x: 2, y: 2 },
      { x: 7, y: 2 },
      { entityId: 'hero' },
    );
    expect(first).toEqual(second);
    expect(first).toEqual([
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
      { x: 6, y: 2 },
      { x: 7, y: 2 },
    ]);
  });

  it('rejects occupied and reserved destinations without a valid range', () => {
    const { map, occupancy } = setup();
    occupancy.occupy('hero', { x: 2, y: 2 });
    occupancy.occupy('occupied', { x: 5, y: 2 });
    occupancy.occupy('reserver', { x: 7, y: 3 });
    occupancy.reserve('reserver', { x: 7, y: 2 });
    const pathfinder = new Pathfinder(map, occupancy);
    expect(
      pathfinder.findPath(
        { x: 2, y: 2 },
        { x: 5, y: 2 },
        { entityId: 'hero' },
      ),
    ).toEqual([]);
    expect(
      pathfinder.findPath(
        { x: 2, y: 2 },
        { x: 7, y: 2 },
        { entityId: 'hero' },
      ),
    ).toEqual([]);
  });

  it('finds a casting position at the configured spell range', () => {
    const { map, occupancy } = setup();
    occupancy.occupy('caster', { x: 2, y: 4 });
    occupancy.occupy('target', { x: 9, y: 4 });
    const path = new Pathfinder(map, occupancy).findPath(
      { x: 2, y: 4 },
      { x: 9, y: 4 },
      { entityId: 'caster', goalRange: 4 },
    );
    expect(path.at(-1)).toEqual({ x: 5, y: 4 });
  });

  it('returns a safe empty path when no route exists', () => {
    const { map, occupancy } = setup([
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]);
    occupancy.occupy('hero', { x: 2, y: 2 });
    expect(
      new Pathfinder(map, occupancy).findPath(
        { x: 2, y: 2 },
        { x: 8, y: 8 },
        { entityId: 'hero' },
      ),
    ).toEqual([]);
  });

  it('supports larger footprints without entering partially blocked space', () => {
    const { map, occupancy } = setup([{ x: 5, y: 5 }]);
    expect(
      occupancy.occupy('boss', { x: 4, y: 4 }, { width: 2, height: 2 }),
    ).toMatchObject({ allowed: false, reason: 'blocked-terrain' });
    expect(
      occupancy.occupy('boss', { x: 6, y: 4 }, { width: 2, height: 2 }),
    ).toMatchObject({ allowed: true });
  });

  it('schedules authoritative projectiles with a future single impact', () => {
    const { map, occupancy } = setup();
    const metrics = createGridMetrics();
    occupancy.occupy('caster', { x:2,y:4 });
    occupancy.occupy('target', { x:8,y:4 });
    const projectiles = new ProjectileSystem(
      new LineOfSightResolver(map, occupancy),
      metrics,
    );
    const scheduled = projectiles.schedule({
      castId:'cast-1',sessionId:'session-a',casterId:'caster',targetId:'target',
      originTile:{ x:2,y:4 },targetTile:{ x:8,y:4 },startedAt:100,travelTime:400,
      damage:120,spellId:'test-bolt',collisionPolicy:'walls',
      lineOfSightPolicy:'required',targetPolicy:'requires-alive',
      impactPolicy:'follow-target',floor:1,element:'energy',logicalTiles:[{ x:8,y:4 }],
      ignoreEntityIds:['caster','target'],
    });
    expect(scheduled).toMatchObject({
      accepted:true,
      projectile:{ castId:'cast-1',startedAt:100,impactAt:500 },
    });
    expect(scheduled.projectile?.pathTiles.length).toBeGreaterThan(2);
    expect(projectiles.resolveDue(499, 'session-a')).toEqual([]);
    expect(projectiles.resolveDue(500, 'session-a')).toMatchObject([
      { status:'ready',projectile:{ castId:'cast-1' } },
    ]);
    expect(projectiles.resolveDue(900, 'session-a')).toEqual([]);
    expect(metrics.maxPendingProjectiles).toBe(1);
  });

  it('applies configurable wall and unit collision policies to projectiles', () => {
    const blocked = setup([{ x:5,y:4 }]);
    blocked.occupancy.occupy('caster', { x:2,y:4 });
    blocked.occupancy.occupy('target', { x:8,y:4 });
    const wallSystem = new ProjectileSystem(
      new LineOfSightResolver(blocked.map, blocked.occupancy),
      createGridMetrics(),
    );
    const base = {
      castId:'wall',sessionId:'s',casterId:'caster',targetId:'target',
      originTile:{ x:2,y:4 },targetTile:{ x:8,y:4 },startedAt:0,travelTime:400,
      damage:1,spellId:'bolt',targetPolicy:'requires-alive' as const,
      impactPolicy:'follow-target' as const,floor:1,element:'energy',
      logicalTiles:[{ x:8,y:4 }],ignoreEntityIds:['caster','target'],
    };
    expect(wallSystem.schedule({
      ...base,collisionPolicy:'walls',lineOfSightPolicy:'required',
    })).toMatchObject({ accepted:false,reason:'blocked-line-of-sight' });
    expect(wallSystem.schedule({
      ...base,castId:'wall-pass',collisionPolicy:'none',lineOfSightPolicy:'ignored',
    })).toMatchObject({ accepted:true });

    const units = setup();
    units.occupancy.occupy('caster', { x:2,y:3 });
    units.occupancy.occupy('blocker', { x:5,y:3 });
    units.occupancy.occupy('target', { x:8,y:3 });
    const unitSystem = new ProjectileSystem(
      new LineOfSightResolver(units.map, units.occupancy),
      createGridMetrics(),
    );
    expect(unitSystem.schedule({
      ...base,castId:'unit-block',originTile:{ x:2,y:3 },targetTile:{ x:8,y:3 },
      logicalTiles:[{ x:8,y:3 }],collisionPolicy:'walls-and-units',
      lineOfSightPolicy:'required',
    })).toMatchObject({ accepted:false });
    expect(unitSystem.schedule({
      ...base,castId:'unit-pass',originTile:{ x:2,y:3 },targetTile:{ x:8,y:3 },
      logicalTiles:[{ x:8,y:3 }],collisionPolicy:'walls',lineOfSightPolicy:'required',
    })).toMatchObject({ accepted:true });
  });

  it('cancels pending projectiles on reset and rejects stale-session resolution', () => {
    const { map, occupancy } = setup();
    occupancy.occupy('caster', { x:2,y:4 });
    occupancy.occupy('target', { x:8,y:4 });
    const projectiles = new ProjectileSystem(
      new LineOfSightResolver(map, occupancy),
      createGridMetrics(),
    );
    const request = {
      castId:'cast-reset',sessionId:'session-a',casterId:'caster',targetId:'target',
      originTile:{ x:2,y:4 },targetTile:{ x:8,y:4 },startedAt:0,travelTime:400,
      damage:1,spellId:'bolt',collisionPolicy:'walls' as const,
      lineOfSightPolicy:'required' as const,targetPolicy:'requires-alive' as const,
      impactPolicy:'follow-target' as const,floor:1,element:'energy',
      logicalTiles:[{ x:8,y:4 }],ignoreEntityIds:['caster','target'],
    };
    projectiles.schedule(request);
    expect(projectiles.cancelAll('reset', 'session-a')).toMatchObject([
      { status:'cancelled',reason:'reset' },
    ]);
    expect(projectiles.pendingEntries()).toEqual([]);
    projectiles.schedule({ ...request,castId:'cast-stale' });
    expect(projectiles.resolveDue(400, 'session-b')).toMatchObject([
      { status:'cancelled',reason:'stale-session' },
    ]);
  });
});
