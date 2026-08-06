import {
  abilities,
  abilitiesByVocation,
  defaultAbilityPreferences,
  type AbilityDefinition,
  type AbilityPreferences,
} from '../data/abilities';
import { floors, heroes, HUNT_LAYOUT_CONFIG } from '../data/config';
import type {
  CombatEvent,
  Direction,
  EntitySnapshot,
  HuntResult,
} from '../events/types';
import {
  TILE_SIZE,
  abilityOffsets,
  gridDirectionTo,
  gridToWorld,
} from './tiles';
import { GridMap } from './grid/GridMap';
import { LineOfSightResolver } from './grid/LineOfSightResolver';
import { MovementSystem } from './grid/MovementSystem';
import { OccupancyGrid } from './grid/OccupancyGrid';
import {
  ProjectileSystem,
} from './grid/ProjectileSystem';
import { SpellAreaResolver } from './grid/SpellAreaResolver';
import {
  cloneGridPosition,
  createGridMetrics,
  gridDistance,
  gridKey,
  type GridPosition,
} from './grid/GridTypes';

type SimEntity = EntitySnapshot & {
  alive: boolean;
  cooldowns: Record<string, number>;
  groupCooldowns: Record<string, number>;
  targetId?: string;
  forcedTargetUntil?: number;
  threat: Record<string, number>;
  rewarded?: boolean;
  safeTilePosition: GridPosition;
};

type AbilityTargeting = {
  facing: Direction;
  tiles: GridPosition[];
  targets: SimEntity[];
};

type OffensiveAction = {
  ability: AbilityDefinition;
  targeting: AbilityTargeting;
  score: number;
};

type Hazard = {
  sourceId: string;
  tiles: GridPosition[];
  detonateAt: number;
  floor: number;
  damage: number;
  ability: string;
  element: string;
  castId: string;
};

const clone = <T>(value: T): T => structuredClone(value);
const isHero = (entity: SimEntity) =>
  entity.role === 'knight' ||
  entity.role === 'druid' ||
  entity.role === 'sorcerer';

export class CombatEngine {
  private events: CombatEvent[] = [];
  private now = 0;
  private sequence = 0;
  private damage: Record<string, number> = {
    knight: 0,
    druid: 0,
    sorcerer: 0,
  };
  private healing = 0;
  private damageTaken = 0;
  private xp = 0;
  private gold = 0;
  private kills = 0;
  private bossTokens = 0;
  private loot: Record<string, number> = {};
  private floorTimes: number[] = [];
  private floorStartedAt = 0;
  private castSequence = 0;
  private movementOrder = 0;
  private readonly sessionId: string;
  private readonly gridMap = new GridMap(
    HUNT_LAYOUT_CONFIG.arenaColumns,
    HUNT_LAYOUT_CONFIG.arenaRows,
    {
      minX:HUNT_LAYOUT_CONFIG.walkableBounds.minColumn,
      maxX:HUNT_LAYOUT_CONFIG.walkableBounds.maxColumn,
      minY:HUNT_LAYOUT_CONFIG.walkableBounds.minRow,
      maxY:HUNT_LAYOUT_CONFIG.walkableBounds.maxRow,
    },
    [...HUNT_LAYOUT_CONFIG.blockedTiles],
  );
  private occupancy = new OccupancyGrid(this.gridMap);
  private readonly gridMetrics = createGridMetrics();
  private movement = new MovementSystem(
    this.gridMap,
    this.occupancy,
    this.gridMetrics,
  );
  private lineOfSight = new LineOfSightResolver(this.gridMap, this.occupancy);
  private spellArea = new SpellAreaResolver(this.gridMap, this.lineOfSight);
  private projectiles = new ProjectileSystem(this.lineOfSight, this.gridMetrics);

  constructor(
    private seed = 803,
    private preferences: AbilityPreferences = defaultAbilityPreferences(),
  ) {
    this.sessionId = `hunt-${seed}`;
  }

  private random() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private emit(
    type: CombatEvent['type'],
    floor: number,
    sourceId?: string,
    targetId?: string,
    data?: CombatEvent['data'],
    at = this.now,
  ) {
    this.events.push({
      id: `e${++this.sequence}`,
      time:at,
      type,
      floor,
      sourceId,
      targetId,
      data,
    });
  }

  private entity(snapshot: EntitySnapshot): SimEntity {
    const tilePosition = { x:snapshot.tileX,y:snapshot.tileY };
    return {
      ...clone(snapshot),
      position:gridToWorld(tilePosition),
      alive: true,
      cooldowns: {},
      groupCooldowns: {},
      threat: {},
      safeTilePosition: cloneGridPosition(tilePosition),
    };
  }

  private tileOf(entity: Pick<EntitySnapshot, 'tileX' | 'tileY'>): GridPosition {
    return { x:entity.tileX,y:entity.tileY };
  }

  private setTile(entity: SimEntity, position: GridPosition) {
    entity.tileX = position.x;
    entity.tileY = position.y;
    entity.position = gridToWorld(position);
  }

  private distance(
    left: Pick<EntitySnapshot, 'tileX' | 'tileY'>,
    right: Pick<EntitySnapshot, 'tileX' | 'tileY'>,
  ) {
    return gridDistance(this.tileOf(left), this.tileOf(right));
  }

  private resetGridContext() {
    this.occupancy = new OccupancyGrid(this.gridMap);
    this.movement = new MovementSystem(
      this.gridMap,
      this.occupancy,
      this.gridMetrics,
    );
    this.lineOfSight = new LineOfSightResolver(this.gridMap, this.occupancy);
    this.spellArea = new SpellAreaResolver(this.gridMap, this.lineOfSight);
    this.projectiles = new ProjectileSystem(this.lineOfSight, this.gridMetrics);
  }

  private ability(id: string) {
    return abilities.find((candidate) => candidate.id === id)!;
  }

  private enabled(id: string) {
    return this.preferences[id]?.enabled ?? true;
  }

  private canCast(entity: SimEntity, ability: AbilityDefinition) {
    return (
      this.enabled(ability.id) &&
      entity.mana >= ability.manaCost &&
      (entity.cooldowns[ability.id] ?? 0) <= this.now &&
      (entity.groupCooldowns[ability.group] ?? 0) <= this.now
    );
  }

  private element(ability: AbilityDefinition) {
    if (ability.id.includes('ice') || ability.id === 'eternal_winter') return 'ice';
    if (ability.id.includes('flame')) return 'fire';
    if (ability.vocation === 'sorcerer') return 'energy';
    if (ability.group === 'healing') return 'healing';
    return 'physical';
  }

  private cast(
    entity: SimEntity,
    ability: AbilityDefinition,
    floor: number,
    targetId: string | undefined,
    tiles: GridPosition[],
    facing: Direction,
  ) {
    entity.cooldowns[ability.id] = this.now + ability.cooldown;
    entity.groupCooldowns[ability.group] = this.now + ability.groupCooldown;
    entity.mana = Math.max(0, entity.mana - ability.manaCost);
    const castId = `cast-${++this.castSequence}`;
    this.emit('cast', floor, entity.id, targetId, {
      ability: ability.name,
      abilityId: ability.id,
      words: ability.words,
      mana: entity.mana,
      manaCost: ability.manaCost,
      element: this.element(ability),
      tiles: tiles.map(gridToWorld),
      logicalTiles: clone(tiles),
      tile: this.tileOf(entity),
      facing,
      cooldownEndsAt: entity.cooldowns[ability.id],
      cooldownDuration: ability.cooldown,
      castId,
    });
    return castId;
  }

  private queueProjectile(
    caster: SimEntity,
    target: SimEntity,
    floor: number,
    options: {
      castId: string;
      attackId: string;
      damage: number;
      element: string;
      ability?: string;
      logicalTiles?: GridPosition[];
      collisionPolicy?: 'walls' | 'walls-and-units' | 'none';
      lineOfSightPolicy?: 'required' | 'ignored';
      impactPolicy?: 'original-tile' | 'follow-target';
      travelTime?: number;
    },
  ) {
    const scheduled = this.projectiles.schedule({
      castId:options.castId,
      sessionId:this.sessionId,
      casterId:caster.id,
      targetId:target.id,
      originTile:this.tileOf(caster),
      targetTile:this.tileOf(target),
      startedAt:this.now,
      travelTime:options.travelTime ?? 400,
      damage:options.damage,
      spellId:options.attackId,
      collisionPolicy:options.collisionPolicy ?? 'walls',
      lineOfSightPolicy:options.lineOfSightPolicy ?? 'required',
      targetPolicy:'requires-alive',
      impactPolicy:options.impactPolicy ?? 'follow-target',
      floor,
      ability:options.ability,
      element:options.element,
      logicalTiles:options.logicalTiles ?? [this.tileOf(target)],
      ignoreEntityIds:[caster.id,target.id],
    });
    if (!scheduled.accepted || !scheduled.projectile) {
      this.emit('projectile_cancelled', floor, caster.id, target.id, {
        castId:options.castId,
        abilityId:options.attackId,
        reason:scheduled.reason,
        sessionId:this.sessionId,
      });
      if (options.ability) {
        this.emit('spell_cancelled', floor, caster.id, target.id, {
          castId:options.castId,
          ability:options.ability,
          abilityId:options.attackId,
          logicalTiles:clone(options.logicalTiles ?? []),
          reason:scheduled.reason,
          sessionId:this.sessionId,
        });
      }
      return false;
    }
    const projectile = scheduled.projectile;
    this.emit('projectile', floor, caster.id, target.id, {
      ability:options.ability,
      abilityId:options.attackId,
      element:options.element,
      castId:projectile.castId,
      originTile:projectile.originTile,
      targetTile:projectile.targetTile,
      pathTiles:projectile.pathTiles,
      lineOfSightTiles:projectile.pathTiles,
      startedAt:projectile.startedAt,
      impactAt:projectile.impactAt,
      duration:projectile.impactAt - projectile.startedAt,
      collisionPolicy:projectile.collisionPolicy,
      lineOfSightPolicy:projectile.lineOfSightPolicy,
      sessionId:projectile.sessionId,
    });
    return true;
  }

  private withLogicalTime<T>(time: number, operation: () => T) {
    const current = this.now;
    this.now = time;
    try {
      return operation();
    } finally {
      this.now = current;
    }
  }

  private resolvePendingProjectiles(
    party: SimEntity[],
    enemies: SimEntity[],
  ) {
    const entities = new Map(
      [...party, ...enemies].map((entity) => [entity.id, entity]),
    );
    for (const resolution of this.projectiles.resolveDue(this.now, this.sessionId)) {
      const projectile = resolution.projectile;
      const source = entities.get(projectile.casterId);
      const target = projectile.targetId
        ? entities.get(projectile.targetId)
        : undefined;
      let reason = resolution.reason;
      if (!source?.alive) reason = 'source-dead';
      else if (projectile.targetPolicy === 'requires-alive' && !target?.alive) {
        reason = 'target-dead';
      } else if (
        projectile.impactPolicy === 'original-tile' &&
        target &&
        gridKey(this.tileOf(target)) !== gridKey(projectile.targetTile)
      ) {
        reason = 'target-moved';
      }
      if (resolution.status === 'cancelled' || reason || !source || !target) {
        this.emit('projectile_cancelled', projectile.floor, projectile.casterId, projectile.targetId, {
          castId:projectile.castId,
          abilityId:projectile.spellId,
          originTile:projectile.originTile,
          targetTile:projectile.targetTile,
          pathTiles:projectile.pathTiles,
          impactAt:projectile.impactAt,
          reason:reason ?? 'invalid-target',
          sessionId:projectile.sessionId,
        }, projectile.impactAt);
        if (projectile.ability) {
          this.emit('spell_cancelled', projectile.floor, projectile.casterId, projectile.targetId, {
            castId:projectile.castId,
            ability:projectile.ability,
            abilityId:projectile.spellId,
            logicalTiles:projectile.logicalTiles,
            reason:reason ?? 'invalid-target',
            sessionId:projectile.sessionId,
          }, projectile.impactAt);
        }
        continue;
      }
      this.withLogicalTime(projectile.impactAt, () => {
        this.applyDamage(
          source,
          target,
          projectile.damage,
          projectile.floor,
          projectile.element,
        );
        this.emit('projectile_resolved', projectile.floor, source.id, target.id, {
          castId:projectile.castId,
          abilityId:projectile.spellId,
          originTile:projectile.originTile,
          targetTile:projectile.targetTile,
          pathTiles:projectile.pathTiles,
          impactAt:projectile.impactAt,
          sessionId:projectile.sessionId,
        });
        if (projectile.ability) {
          this.emit('spell_resolved', projectile.floor, source.id, target.id, {
            ability:projectile.ability,
            abilityId:projectile.spellId,
            castId:projectile.castId,
            logicalTiles:projectile.logicalTiles,
            tiles:projectile.logicalTiles.map(gridToWorld),
            targets:[target.id],
            targetCount:1,
            sessionId:projectile.sessionId,
          });
        }
      });
    }
  }

  private cancelPendingProjectiles(floor: number, reason: string) {
    for (const resolution of this.projectiles.cancelAll(reason, this.sessionId)) {
      const projectile = resolution.projectile;
      this.emit('projectile_cancelled', floor, projectile.casterId, projectile.targetId, {
        castId:projectile.castId,
        abilityId:projectile.spellId,
        originTile:projectile.originTile,
        targetTile:projectile.targetTile,
        pathTiles:projectile.pathTiles,
        impactAt:projectile.impactAt,
        reason,
        sessionId:projectile.sessionId,
      });
      if (projectile.ability) {
        this.emit('spell_cancelled', floor, projectile.casterId, projectile.targetId, {
          castId:projectile.castId,
          ability:projectile.ability,
          abilityId:projectile.spellId,
          logicalTiles:projectile.logicalTiles,
          reason,
          sessionId:projectile.sessionId,
        });
      }
    }
  }

  private move(
    entity: SimEntity,
    destination: GridPosition,
    floor: number,
    reposition = false,
    goalRange = 0,
  ) {
    const from = this.tileOf(entity);
    const result = this.movement.step({
      entityId:entity.id,
      from,
      destination,
      goalRange,
      now:this.now,
      duration:220,
      sessionId:this.sessionId,
      tacticalPriority:
        entity.role === 'knight'
          ? 30
          : isHero(entity)
            ? 20
            : entity.role === 'boss'
              ? 15
              : 10,
      tickOrder:this.movementOrder++,
      allowBacktrack:true,
    });
    if (result.recalculated) {
      this.emit('path_recalculated', floor, entity.id, undefined, {
        fromTile:from,
        destinationTile:cloneGridPosition(destination),
        path:clone(result.path),
        blockedReason:result.reason,
        sessionId:this.sessionId,
      });
    }
    if (!result.moved) {
      this.emit('movement_blocked', floor, entity.id, undefined, {
        fromTile:from,
        destinationTile:cloneGridPosition(destination),
        blockedReason:result.reason,
        blockingEntityId:result.blockingEntityId,
        sessionId:this.sessionId,
      });
      return false;
    }
    this.emit('tile_reserved', floor, entity.id, undefined, {
      fromTile:from,
      toTile:result.to,
      startedAt:result.pending?.startedAt,
      completesAt:result.pending?.completesAt,
      pathRevision:result.pending?.pathRevision,
      sessionId:this.sessionId,
      duration:220,
    });
    this.emit('movement_started', floor, entity.id, undefined, {
      fromTile:from,
      toTile:result.to,
      destinationTile:cloneGridPosition(destination),
      path:clone(result.path),
      duration:220,
      startedAt:result.pending?.startedAt,
      completesAt:result.pending?.completesAt,
      pathRevision:result.pending?.pathRevision,
      sessionId:this.sessionId,
    });
    this.emit(reposition ? 'reposition' : 'move', floor, entity.id, undefined, {
      position:gridToWorld(result.to),
      tile:cloneGridPosition(result.to),
      fromTile:from,
      toTile:cloneGridPosition(result.to),
      destinationTile:cloneGridPosition(destination),
      path:clone(result.path),
      duration: 220,
      startedAt:result.pending?.startedAt,
      completesAt:result.pending?.completesAt,
      sessionId:this.sessionId,
    });
    return true;
  }

  private resolvePendingMovements(
    party: SimEntity[],
    enemies: SimEntity[],
    floor: number,
  ) {
    const entities = new Map(
      [...party, ...enemies].map((entity) => [entity.id, entity]),
    );
    for (const resolution of this.movement.completeDue(this.now, this.sessionId)) {
      const { movement } = resolution;
      const entity = entities.get(movement.entityId);
      if (resolution.status === 'completed' && entity?.alive) {
        this.setTile(entity, movement.to);
        this.emit('movement_completed', floor, entity.id, undefined, {
          fromTile:movement.from,
          toTile:movement.to,
          destinationTile:movement.destination,
          startedAt:movement.startedAt,
          completesAt:movement.completesAt,
          pathRevision:movement.pathRevision,
          sessionId:movement.sessionId,
        }, movement.completesAt);
      } else {
        this.emit('movement_cancelled', floor, movement.entityId, undefined, {
          fromTile:movement.from,
          toTile:movement.to,
          startedAt:movement.startedAt,
          completesAt:movement.completesAt,
          reason:resolution.reason ?? 'entity-dead',
          sessionId:movement.sessionId,
        });
      }
    }
  }

  private cancelPendingMovements(floor: number, reason: 'floor-complete' | 'reset') {
    for (const resolution of this.movement.cancelAll(reason, this.sessionId)) {
      const movement = resolution.movement;
      this.emit('movement_cancelled', floor, movement.entityId, undefined, {
        fromTile:movement.from,
        toTile:movement.to,
        startedAt:movement.startedAt,
        completesAt:movement.completesAt,
        reason,
        sessionId:movement.sessionId,
      });
    }
  }

  private applyDamage(
    source: SimEntity,
    target: SimEntity,
    rawAmount: number,
    floor: number,
    element = 'physical',
  ) {
    if (!target.alive) return;
    if (this.random() < target.dodge) {
      this.emit('dodge', floor, source.id, target.id);
      return;
    }
    const critical = this.random() < source.crit;
    const amount = Math.max(
      1,
      Math.round((rawAmount - target.defense * 0.35) * (critical ? 1.5 : 1)),
    );
    if (critical) this.emit('critical', floor, source.id, target.id, { amount });
    target.hp = Math.max(0, target.hp - amount);
    this.emit('damage', floor, source.id, target.id, { amount, element });
    if (isHero(source)) {
      this.damage[source.id] += amount;
      target.threat[source.id] =
        (target.threat[source.id] ?? 0) +
        amount * (source.role === 'knight' ? 0.08 : 0.12);
    } else {
      this.damageTaken += amount;
    }
    if (target.hp === 0) {
      target.alive = false;
      const cancelledMovement = this.movement.cancel(target.id, 'entity-dead');
      if (cancelledMovement) {
        const movement = cancelledMovement.movement;
        this.emit('movement_cancelled', floor, target.id, undefined, {
          fromTile:movement.from,
          toTile:movement.to,
          startedAt:movement.startedAt,
          completesAt:movement.completesAt,
          reason:'entity-dead',
          sessionId:movement.sessionId,
        });
      }
      this.occupancy.release(target.id);
      this.emit('death', floor, source.id, target.id);
    }
  }

  private reward(enemy: SimEntity, floor: number) {
    if (enemy.rewarded) return;
    enemy.rewarded = true;
    this.kills++;
    const boss = enemy.role === 'boss';
    const gainedXp = boss ? 1200 : 160;
    const gainedGold = boss ? 550 : 45 + Math.floor(this.random() * 30);
    this.xp += gainedXp;
    this.gold += gainedGold;
    this.emit('experience', floor, undefined, enemy.id, { amount: gainedXp });
    this.addLoot('Gold coin', gainedGold, floor, enemy.id);
    if (this.random() < (boss ? 1 : 0.35)) {
      this.addLoot(boss ? 'Lion King fragment' : 'Lion fur', 1, floor, enemy.id);
    }
    if (boss) {
      const amount = Number.isFinite(enemy.bossTokenReward ?? 1)
        ? Math.max(1, Math.round(enemy.bossTokenReward ?? 1))
        : 1;
      this.bossTokens += amount;
      this.emit('boss_reward', floor, undefined, enemy.id, {
        amount,
        rewardType:'bossToken',
      });
      if (this.random() < 0.3) this.addLoot('Rare gem', 1, floor, enemy.id);
    }
  }

  private addLoot(item: string, quantity: number, floor: number, sourceId: string) {
    this.loot[item] = (this.loot[item] ?? 0) + quantity;
    this.emit('loot', floor, sourceId, undefined, { item, quantity });
  }

  private nearest(origin: SimEntity, candidates: SimEntity[]) {
    return candidates
      .filter((entity) => entity.alive)
      .sort(
        (left, right) =>
          this.distance(origin, left) - this.distance(origin, right) ||
          Number(right.role === 'knight') - Number(left.role === 'knight'),
      )[0];
  }

  private setTarget(
    enemy: SimEntity,
    target: SimEntity,
    floor: number,
    reason: string,
    forcedUntil?: number,
  ) {
    if (enemy.targetId === target.id && !forcedUntil) return;
    const previousTargetId = enemy.targetId;
    enemy.targetId = target.id;
    if (forcedUntil) enemy.forcedTargetUntil = forcedUntil;
    this.emit('target_change', floor, enemy.id, target.id, {
      reason,
      previousTargetId,
      forcedUntil,
    });
  }

  private spatialThreat(enemy: SimEntity, hero: SimEntity) {
    const proximity = Math.max(1, 160 - this.distance(enemy, hero) * 18);
    return proximity + (hero.role === 'knight' ? 0.01 : 0);
  }

  private initializeSpatialAggro(
    enemies: SimEntity[],
    party: SimEntity[],
    floor: number,
  ) {
    for (const enemy of enemies) {
      for (const hero of party.filter((candidate) => candidate.alive)) {
        enemy.threat[hero.id] = this.spatialThreat(enemy, hero);
      }
      const target = this.highestThreatTarget(enemy, party);
      if (target) this.setTarget(enemy, target, floor, 'spatial');
    }
  }

  private highestThreatTarget(enemy: SimEntity, party: SimEntity[]) {
    return party
      .filter((hero) => hero.alive)
      .sort(
        (left, right) =>
          (enemy.threat[right.id] ?? 0) - (enemy.threat[left.id] ?? 0) ||
          this.distance(enemy, left) - this.distance(enemy, right) ||
          Number(right.role === 'knight') - Number(left.role === 'knight'),
      )[0];
  }

  private monsterTarget(enemy: SimEntity, party: SimEntity[], floor: number) {
    const forced = party.find(
      (hero) =>
        hero.alive &&
        hero.id === enemy.targetId &&
        (enemy.forcedTargetUntil ?? 0) > this.now,
    );
    if (forced) return forced;
    const reason =
      enemy.forcedTargetUntil && enemy.forcedTargetUntil <= this.now
        ? 'forced_expired'
        : 'threat';
    enemy.forcedTargetUntil = undefined;
    const target = this.highestThreatTarget(enemy, party);
    if (target) this.setTarget(enemy, target, floor, reason);
    return target;
  }

  private abilityTargets(
    caster: SimEntity,
    target: SimEntity,
    ability: AbilityDefinition,
    candidates: SimEntity[],
  ) {
    const casterTile = this.tileOf(caster);
    const targetTile = this.tileOf(target);
    const facing = gridDirectionTo(casterTile, targetTile);
    if (ability.shape === 'single') {
      const inRange =
        this.distance(caster, target) <= ability.rangeTiles &&
        this.lineOfSight.hasLineOfSight(casterTile, targetTile, {
          blockUnits:ability.projectileBlocksUnits ?? false,
          ignoreEntityIds:[caster.id,target.id],
        });
      return {
        facing,
        tiles: inRange ? [cloneGridPosition(targetTile)] : [],
        targets: inRange ? [target] : [],
      };
    }
    const tiles = this.spellArea.resolve(casterTile, ability.id, facing, {
      requireLineOfSight:ability.requiresLineOfSight ?? true,
      blockUnits:ability.projectileBlocksUnits ?? false,
      ignoreEntityIds:[caster.id],
    });
    const tileKeys = new Set(tiles.map(gridKey));
    return {
      facing,
      tiles,
      targets: candidates.filter(
        (candidate) => candidate.alive && tileKeys.has(gridKey(this.tileOf(candidate))),
      ),
    };
  }

  private bestTargeting(
    caster: SimEntity,
    ability: AbilityDefinition,
    candidates: SimEntity[],
  ) {
    const alive = candidates.filter((candidate) => candidate.alive);
    if (!alive.length) return undefined;
    const options = alive.map((target) =>
      this.abilityTargets(caster, target, ability, alive),
    );
    return options.sort(
      (left, right) =>
        right.targets.length - left.targets.length ||
        right.tiles.length - left.tiles.length ||
        (left.targets[0] ? this.distance(caster, left.targets[0]) : 0) -
          (right.targets[0] ? this.distance(caster, right.targets[0]) : 0),
    )[0];
  }

  private offensiveActions(
    caster: SimEntity,
    candidates: SimEntity[],
    floor: number,
  ): OffensiveAction[] {
    return abilitiesByVocation(caster.role as AbilityDefinition['vocation'], this.preferences)
      .filter((ability) => ability.group !== 'healing' && ability.group !== 'support')
      .filter((ability) => this.canCast(caster, ability))
      .filter((ability) => !(ability.reserveForBoss && floor < 4))
      .flatMap((ability) => {
        const targeting = this.bestTargeting(caster, ability, candidates);
        if (!targeting || targeting.targets.length < ability.hardMinTargets) return [];
        const priority = this.preferences[ability.id]?.priority ?? 99;
        const preferred = targeting.targets.length >= ability.preferredMinTargets;
        return [{
          ability,
          targeting,
          score:
            1000 -
            priority * 100 +
            targeting.targets.length * 35 +
            (preferred ? 180 : 0) +
            ability.power * 10,
        }];
      })
      .sort((left, right) => right.score - left.score);
  }

  private performOffensiveAction(
    caster: SimEntity,
    action: OffensiveAction,
    floor: number,
  ) {
    const { ability, targeting } = action;
    const castId = this.cast(
      caster,
      ability,
      floor,
      targeting.targets[0].id,
      targeting.tiles,
      targeting.facing,
    );
    const castEvent = this.events.at(-1);
    if (castEvent?.type === 'cast' && castEvent.data) {
      castEvent.data.targetCount = targeting.targets.length;
      castEvent.data.preferredMinTargets = ability.preferredMinTargets;
      castEvent.data.hardMinTargets = ability.hardMinTargets;
    }
    if (ability.shape === 'single') {
      this.queueProjectile(caster, targeting.targets[0], floor, {
        castId,
        attackId:ability.id,
        damage:caster.attack * ability.power,
        element:this.element(ability),
        ability:ability.name,
        logicalTiles:targeting.tiles,
        collisionPolicy:ability.projectileBlocksUnits
          ? 'walls-and-units'
          : 'walls',
        lineOfSightPolicy:ability.requiresLineOfSight === false
          ? 'ignored'
          : 'required',
        impactPolicy:'follow-target',
      });
      return;
    }
    for (const affected of targeting.targets) {
      this.applyDamage(
        caster,
        affected,
        caster.attack * ability.power,
        floor,
        this.element(ability),
      );
    }
    this.emit('spell_resolved', floor, caster.id, targeting.targets[0]?.id, {
      ability:ability.name,
      abilityId:ability.id,
      castId,
      logicalTiles:clone(targeting.tiles),
      tiles:targeting.tiles.map(gridToWorld),
      targets:targeting.targets.map((target) => target.id),
      targetCount:targeting.targets.length,
    });
  }

  private tryBestOffensiveAction(
    caster: SimEntity,
    candidates: SimEntity[],
    floor: number,
  ) {
    const action = this.offensiveActions(caster, candidates, floor)[0];
    if (!action) return false;
    this.performOffensiveAction(caster, action, floor);
    return true;
  }

  private isWalkable(position: GridPosition) {
    return this.gridMap.isWalkable(position);
  }

  private isOccupied(
    position: GridPosition,
    _party: SimEntity[],
    _enemies: SimEntity[],
    exceptId?: string,
  ) {
    const occupantId = this.occupancy.occupantAt(position);
    const reservationId = this.occupancy.reservedBy(position);
    return (
      (!!occupantId && occupantId !== exceptId) ||
      (!!reservationId && reservationId !== exceptId)
    );
  }

  private boxedEnemies(knight: SimEntity, enemies: SimEntity[]) {
    return enemies.filter(
      (enemy) =>
        enemy.alive && this.distance(knight, enemy) <= 1,
    );
  }

  private waveScoreAt(
    caster: SimEntity,
    position: GridPosition,
    enemies: SimEntity[],
  ) {
    const waves = abilitiesByVocation(
      caster.role as AbilityDefinition['vocation'],
      this.preferences,
    ).filter((ability) => ability.shape === 'wave');
    let score = 0;
    for (const ability of waves) {
      for (const facing of ['up', 'down', 'left', 'right'] as Direction[]) {
        const tiles = this.spellArea.resolve(position, ability.id, facing, {
          requireLineOfSight:ability.requiresLineOfSight ?? true,
          ignoreEntityIds:[caster.id],
        });
        const tileKeys = new Set(tiles.map(gridKey));
        score = Math.max(
          score,
          enemies.filter(
            (enemy) => enemy.alive && tileKeys.has(gridKey(this.tileOf(enemy))),
          ).length,
        );
      }
    }
    return score;
  }

  private waveGeometryAt(caster: SimEntity, position: GridPosition) {
    const waves = abilitiesByVocation(
      caster.role as AbilityDefinition['vocation'],
      this.preferences,
    ).filter((ability) => ability.shape === 'wave');
    let best = 0;
    for (const ability of waves) {
      for (const facing of ['up', 'down', 'left', 'right'] as Direction[]) {
        best = Math.max(
          best,
          this.spellArea.resolve(position, ability.id, facing, {
            requireLineOfSight:ability.requiresLineOfSight ?? true,
            ignoreEntityIds:[caster.id],
          }).length,
        );
      }
    }
    return best;
  }

  private fullWaveScoreAt(
    caster: SimEntity,
    position: GridPosition,
    enemies: SimEntity[],
  ) {
    let best = 0;
    for (const ability of abilitiesByVocation(
      caster.role as AbilityDefinition['vocation'],
      this.preferences,
    ).filter((candidate) => candidate.shape === 'wave')) {
      const fullGeometry = abilityOffsets(ability.id).length;
      for (const target of enemies.filter((candidate) => candidate.alive)) {
        const facing = gridDirectionTo(position, this.tileOf(target));
        const tiles = this.spellArea.resolve(position, ability.id, facing, {
          requireLineOfSight:ability.requiresLineOfSight ?? true,
          ignoreEntityIds:[caster.id],
        });
        if (tiles.length < fullGeometry) continue;
        const keys = new Set(tiles.map(gridKey));
        const hits = enemies.filter(
          (enemy) => enemy.alive && keys.has(gridKey(this.tileOf(enemy))),
        ).length;
        if (hits >= ability.hardMinTargets) best = Math.max(best, hits);
      }
    }
    return best;
  }

  private bestMagePosition(
    caster: SimEntity,
    knight: SimEntity,
    party: SimEntity[],
    enemies: SimEntity[],
  ) {
    const candidates: Array<{ point: GridPosition; score: number }> = [];
    const reachable = this.movement.reachableTiles(
      caster.id,
      this.tileOf(caster),
      this.now,
    );
    const bounds = HUNT_LAYOUT_CONFIG.walkableBounds;
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column++) {
      for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
        const point = { x:column,y:row };
        if (!reachable.has(gridKey(point))) continue;
        if (this.movement.isDestinationCoolingDown(caster.id, point, this.now)) {
          continue;
        }
        const knightDistance = gridDistance(point, this.tileOf(knight));
        if (knightDistance < 3 || knightDistance > 7) continue;
        if (this.isOccupied(point, party, enemies, caster.id)) continue;
        const closestEnemy = Math.min(
          ...enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => gridDistance(point, this.tileOf(enemy))),
        );
        if (closestEnemy <= 1) continue;
        const fullWaveScore = this.fullWaveScoreAt(caster, point, enemies);
        if (!fullWaveScore) continue;
        const geometry = this.waveGeometryAt(caster, point);
        const score =
          fullWaveScore * 1000 +
          geometry * 10 +
          Math.min(closestEnemy, 6) * 8 -
          gridDistance(this.tileOf(caster), point);
        candidates.push({ point, score });
      }
    }
    return candidates.sort((left, right) => right.score - left.score)[0]?.point;
  }

  private maybeRepositionMage(
    caster: SimEntity,
    knight: SimEntity,
    party: SimEntity[],
    enemies: SimEntity[],
    floor: number,
  ) {
    const box = this.boxedEnemies(knight, enemies);
    const currentScore = this.waveScoreAt(caster, this.tileOf(caster), enemies);
    if (
      box.length < 2 &&
      currentScore > 0 &&
      this.fullWaveScoreAt(caster, this.tileOf(caster), enemies) > 0
    ) {
      return false;
    }
    const destination = this.bestMagePosition(caster, knight, party, enemies);
    if (!destination) return false;
    const destinationScore = this.waveScoreAt(caster, destination, enemies);
    const unsafe = enemies.some(
      (enemy) =>
        enemy.alive && this.distance(caster, enemy) <= 2,
    );
    if (!unsafe && destinationScore <= currentScore) return false;
    if (!this.isWalkable(destination) || this.isOccupied(destination, party, enemies, caster.id)) {
      return false;
    }
    caster.safeTilePosition = cloneGridPosition(destination);
    return this.move(caster, destination, floor, true);
  }

  private bestChallengePosition(
    knight: SimEntity,
    backlineTargets: SimEntity[],
    party: SimEntity[],
    enemies: SimEntity[],
    range: number,
  ) {
    const bounds = HUNT_LAYOUT_CONFIG.walkableBounds;
    const candidates: Array<{ point: GridPosition; score: number }> = [];
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column++) {
      for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
        const point = { x:column,y:row };
        if (this.isOccupied(point, party, enemies, knight.id)) continue;
        const captured = backlineTargets.filter(
          (enemy) => gridDistance(point, this.tileOf(enemy)) <= range,
        ).length;
        if (!captured) continue;
        const allInRange = enemies.filter(
          (enemy) =>
            enemy.alive &&
            enemy.role !== 'boss' &&
            gridDistance(point, this.tileOf(enemy)) <= range,
        ).length;
        candidates.push({
          point,
          score:
            captured * 1000 +
            allInRange * 50 -
            gridDistance(this.tileOf(knight), point),
        });
      }
    }
    return candidates.sort((left, right) => right.score - left.score)[0]?.point;
  }

  private tryChallenge(
    knight: SimEntity,
    party: SimEntity[],
    enemies: SimEntity[],
    floor: number,
  ) {
    const challenge = this.ability('challenge');
    if (
      !knight.alive ||
      this.now - this.floorStartedAt < 2000 ||
      !this.canCast(knight, challenge)
    ) {
      return false;
    }
    const backlineTargets = enemies.filter(
      (enemy) =>
        enemy.alive &&
        enemy.role !== 'boss' &&
        enemy.targetId !== knight.id,
    );
    if (!backlineTargets.length) return false;
    const threatenedInRange = backlineTargets.filter(
      (enemy) =>
        this.distance(knight, enemy) <= challenge.rangeTiles,
    );
    if (!threatenedInRange.length) {
      const destination = this.bestChallengePosition(
        knight,
        backlineTargets,
        party,
        enemies,
        challenge.rangeTiles,
      );
      return destination ? this.move(knight, destination, floor, true) : false;
    }
    const affected = enemies.filter(
      (enemy) =>
        enemy.alive &&
        enemy.role !== 'boss' &&
        this.distance(knight, enemy) <= challenge.rangeTiles,
    );
    const tiles = this.spellArea.resolve(
      this.tileOf(knight),
      challenge.id,
      'right',
      { requireLineOfSight:false },
    );
    this.cast(knight, challenge, floor, undefined, tiles, 'right');
    const castEvent = this.events.at(-1);
    const forcedUntil = this.now + 6000;
    for (const enemy of affected) {
      this.setTarget(enemy, knight, floor, 'challenge', forcedUntil);
    }
    if (castEvent?.data) {
      castEvent.data.targetCount = affected.length;
      castEvent.data.preferredMinTargets = challenge.preferredMinTargets;
      castEvent.data.hardMinTargets = challenge.hardMinTargets;
    }
    this.emit('aggro', floor, knight.id, undefined, {
      tiles:tiles.map(gridToWorld),
      logicalTiles:clone(tiles),
      tile:this.tileOf(knight),
      duration: 6000,
      targets: affected.map((enemy) => enemy.id),
      forcedUntil,
    });
    return true;
  }

  private heroActions(
    party: SimEntity[],
    enemies: SimEntity[],
    floor: number,
    turn: number,
  ) {
    const aliveEnemies = enemies.filter((enemy) => enemy.alive);
    if (!aliveEnemies.length) return;
    const knight = party.find((hero) => hero.id === 'knight')!;
    const druid = party.find((hero) => hero.id === 'druid')!;
    const sorcerer = party.find((hero) => hero.id === 'sorcerer')!;

    const challenged = this.tryChallenge(knight, party, aliveEnemies, floor);

    if (knight.alive && !challenged) {
      const target = this.nearest(knight, aliveEnemies);
      if (target && this.distance(knight, target) > 1) {
        this.move(knight, this.tileOf(target), floor, false, 1);
      } else {
        const acted = this.tryBestOffensiveAction(
          knight,
          aliveEnemies,
          floor,
        );
        if (!acted && target && turn % 3 === 0) {
          this.emit('basic_attack', floor, knight.id, target.id);
          this.applyDamage(knight, target, knight.attack * 0.82, floor);
        }
      }
    }

    if (druid.alive) {
      const wounded = party
        .filter((hero) => hero.alive && hero.hp / hero.maxHp < 0.58)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      const heal = this.ability('heal_friend');
      if (
        wounded &&
        this.canCast(druid, heal) &&
        this.distance(druid, wounded) <= heal.rangeTiles &&
        this.lineOfSight.hasLineOfSight(this.tileOf(druid), this.tileOf(wounded), {
          ignoreEntityIds:[druid.id,wounded.id],
        })
      ) {
        const facing = gridDirectionTo(this.tileOf(druid), this.tileOf(wounded));
        this.cast(
          druid,
          heal,
          floor,
          wounded.id,
          [cloneGridPosition(this.tileOf(wounded))],
          facing,
        );
        const amount = Math.min(
          wounded.maxHp - wounded.hp,
          Math.round(170 + druid.attack * heal.power),
        );
        wounded.hp += amount;
        this.healing += amount;
        this.emit('heal', floor, druid.id, wounded.id, {
          amount,
          element: 'healing',
        });
        for (const enemy of aliveEnemies) {
          enemy.threat[druid.id] = (enemy.threat[druid.id] ?? 0) + amount * 0.02;
        }
      } else if (
        !this.maybeRepositionMage(druid, knight, party, aliveEnemies, floor)
      ) {
        const acted = this.tryBestOffensiveAction(druid, aliveEnemies, floor);
        if (!acted) {
          const target = this.nearest(druid, aliveEnemies);
          if (target) {
            this.move(druid, this.tileOf(target), floor, true, 5);
          }
        }
      }
    }

    if (sorcerer.alive) {
      const repositioned = this.maybeRepositionMage(
        sorcerer,
        knight,
        party,
        aliveEnemies,
        floor,
      );
      const acted =
        !repositioned &&
        this.tryBestOffensiveAction(sorcerer, aliveEnemies, floor);
      if (!repositioned && !acted && turn % 4 === 0) {
        const target = this.nearest(sorcerer, aliveEnemies);
        if (
          target &&
          this.distance(sorcerer, target) <= 7 &&
          this.lineOfSight.hasLineOfSight(
            this.tileOf(sorcerer),
            this.tileOf(target),
            { ignoreEntityIds:[sorcerer.id,target.id] },
          )
        ) {
          this.emit('basic_attack', floor, sorcerer.id, target.id);
          this.queueProjectile(sorcerer, target, floor, {
            castId:`cast-${++this.castSequence}`,
            attackId:'sorcerer-basic',
            damage:sorcerer.attack * 0.55,
            element:'energy',
            collisionPolicy:'walls',
            lineOfSightPolicy:'required',
            impactPolicy:'follow-target',
          });
        }
      }
    }
  }

  private monsterActions(
    enemies: SimEntity[],
    party: SimEntity[],
    hazards: Hazard[],
    floor: number,
    turn: number,
  ) {
    const aliveParty = party.filter((hero) => hero.alive);
    for (const enemy of enemies.filter((entity) => entity.alive)) {
      if (!aliveParty.length) break;
      const target = this.monsterTarget(enemy, aliveParty, floor);
      if (!target) continue;
      const ranged = enemy.name.includes('Mage') || enemy.role === 'boss';
      const rangeTiles = ranged ? 6 : 1;
      if (this.distance(enemy, target) > rangeTiles) {
        this.move(enemy, this.tileOf(target), floor, false, rangeTiles);
        continue;
      }
      const canArea = ranged && turn % (enemy.role === 'boss' ? 14 : 20) === 0;
      if (canArea) {
        const facing = gridDirectionTo(this.tileOf(enemy), this.tileOf(target));
        const ability = enemy.role === 'boss' ? 'Royal Solar Wave' : 'Sandstorm Wave';
        const abilityId = enemy.role === 'boss' ? 'energy_wave' : 'strong_ice_wave';
        const tiles = this.spellArea.resolve(this.tileOf(enemy), abilityId, facing, {
          requireLineOfSight:true,
          ignoreEntityIds:[enemy.id],
        });
        const castId = `cast-${++this.castSequence}`;
        this.emit('area_warning', floor, enemy.id, target.id, {
          tiles:tiles.map(gridToWorld),
          logicalTiles:clone(tiles),
          tile:this.tileOf(enemy),
          duration: 1000,
          ability,
          element: enemy.role === 'boss' ? 'holy' : 'earth',
          facing,
          castId,
          impactAt:this.now + 1000,
        });
        this.emit('spell_telegraph', floor, enemy.id, target.id, {
          tiles:tiles.map(gridToWorld),
          logicalTiles:clone(tiles),
          tile:this.tileOf(enemy),
          duration:1000,
          ability,
          abilityId,
          element:enemy.role === 'boss' ? 'holy' : 'earth',
          facing,
          castId,
          impactAt:this.now + 1000,
        });
        hazards.push({
          sourceId:enemy.id,
          tiles,
          detonateAt:this.now + 1000,
          floor,
          damage:enemy.attack * (enemy.role === 'boss' ? 1.55 : 1.2),
          ability,
          element:enemy.role === 'boss' ? 'holy' : 'earth',
          castId,
        });
      } else if (turn % 4 === 0) {
        this.emit('basic_attack', floor, enemy.id, target.id);
        if (ranged) {
          this.queueProjectile(enemy, target, floor, {
            castId:`cast-${++this.castSequence}`,
            attackId:enemy.role === 'boss' ? 'boss-basic' : 'monster-ranged-basic',
            damage:enemy.attack,
            element:enemy.role === 'boss' ? 'holy' : 'earth',
            collisionPolicy:'walls',
            lineOfSightPolicy:'required',
            impactPolicy:'follow-target',
          });
        } else {
          this.applyDamage(enemy, target, enemy.attack, floor, 'physical');
        }
      }
    }
  }

  private resolveHazards(
    hazards: Hazard[],
    party: SimEntity[],
    enemies: SimEntity[],
  ) {
    for (const hazard of hazards.filter((item) => item.detonateAt <= this.now)) {
      const source = enemies.find((enemy) => enemy.id === hazard.sourceId);
      if (!source) continue;
      if (!source.alive) {
        this.emit('spell_cancelled', hazard.floor, source.id, undefined, {
          tiles:hazard.tiles.map(gridToWorld),
          logicalTiles:clone(hazard.tiles),
          ability:hazard.ability,
          element:hazard.element,
          castId:hazard.castId,
          targets:[],
          reason:'source_dead',
          sessionId:this.sessionId,
        });
        continue;
      }
      this.emit('monster_aoe', hazard.floor, source.id, undefined, {
        tiles: hazard.tiles.map(gridToWorld),
        logicalTiles:clone(hazard.tiles),
        ability: hazard.ability,
        element: hazard.element,
        castId:hazard.castId,
      });
      this.emit('spell_resolved', hazard.floor, source.id, undefined, {
        tiles:hazard.tiles.map(gridToWorld),
        logicalTiles:clone(hazard.tiles),
        ability:hazard.ability,
        element:hazard.element,
        castId:hazard.castId,
        sessionId:this.sessionId,
        targets:party
          .filter(
            (entity) =>
              entity.alive &&
              hazard.tiles.some(
                (tile) => gridKey(tile) === gridKey(this.tileOf(entity)),
              ),
          )
          .map((entity) => entity.id),
      });
      for (const hero of party.filter(
        (entity) =>
          entity.alive &&
          hazard.tiles.some(
            (tile) => gridKey(tile) === gridKey(this.tileOf(entity)),
          ),
      )) {
        this.applyDamage(
          source,
          hero,
          hazard.damage,
          hazard.floor,
          hazard.element,
        );
      }
    }
    return hazards.filter((item) => item.detonateAt > this.now);
  }

  private cancelHazards(hazards: Hazard[], reason: string) {
    for (const hazard of hazards) {
      this.emit('spell_cancelled', hazard.floor, hazard.sourceId, undefined, {
        tiles:hazard.tiles.map(gridToWorld),
        logicalTiles:clone(hazard.tiles),
        ability:hazard.ability,
        element:hazard.element,
        castId:hazard.castId,
        impactAt:hazard.detonateAt,
        targets:[],
        reason,
        sessionId:this.sessionId,
      });
    }
    return [] as Hazard[];
  }

  run(): HuntResult {
    const party = heroes.map((hero) => this.entity(hero));
    for (let floorIndex = 0; floorIndex < floors.length; floorIndex++) {
      this.resetGridContext();
      const floor = floorIndex + 1;
      const start = this.now;
      this.floorStartedAt = start;
      const enemies = floors[floorIndex].map((enemy) => this.entity(enemy));
      for (const hero of party.filter((entity) => entity.alive)) {
        const original = heroes.find((candidate) => candidate.id === hero.id)!;
        const requestedTile = this.tileOf(original);
        this.setTile(hero, requestedTile);
        hero.safeTilePosition = cloneGridPosition(requestedTile);
        const occupied = this.occupancy.occupy(hero.id, requestedTile);
        if (!occupied.allowed) {
          const recovered = this.occupancy.findNearestFree(requestedTile, hero.id);
          if (!recovered) throw new Error(`No free spawn tile for ${hero.id}`);
          this.gridMetrics.stuckRecoveries++;
          this.setTile(hero, recovered);
          this.occupancy.occupy(hero.id, recovered);
        }
        this.emit('spawn', floor, undefined, hero.id, {
          entity: clone(hero),
          position: clone(hero.position),
          tile:this.tileOf(hero),
        });
      }
      for (const enemy of enemies) {
        const requestedTile = this.tileOf(enemy);
        const occupied = this.occupancy.occupy(enemy.id, requestedTile);
        if (!occupied.allowed) {
          const recovered = this.occupancy.findNearestFree(requestedTile, enemy.id);
          if (!recovered) throw new Error(`No free spawn tile for ${enemy.id}`);
          this.gridMetrics.stuckRecoveries++;
          this.setTile(enemy, recovered);
          this.occupancy.occupy(enemy.id, recovered);
        }
        this.emit(
          enemy.role === 'boss' ? 'boss_spawn' : 'spawn',
          floor,
          undefined,
          enemy.id,
          {
            entity: clone(enemy),
            position: clone(enemy.position),
            tile:this.tileOf(enemy),
          },
        );
      }
      this.initializeSpatialAggro(enemies, party, floor);
      let hazards: Hazard[] = [];
      let turn = 0;
      while (
        enemies.some((enemy) => enemy.alive) &&
        party.some((hero) => hero.alive) &&
        turn++ < 700
      ) {
        this.resolvePendingMovements(party, enemies, floor);
        this.resolvePendingProjectiles(party, enemies);
        hazards = this.resolveHazards(hazards, party, enemies);
        this.heroActions(party, enemies, floor, turn);
        for (const enemy of enemies.filter((entity) => !entity.alive)) {
          this.reward(enemy, floor);
        }
        this.monsterActions(enemies, party, hazards, floor, turn);
        this.now += 250;
      }
      this.resolvePendingMovements(party, enemies, floor);
      this.cancelPendingMovements(floor, 'floor-complete');
      this.resolvePendingProjectiles(party, enemies);
      this.cancelPendingProjectiles(floor, 'floor-complete');
      hazards = this.resolveHazards(hazards, party, enemies);
      hazards = this.cancelHazards(hazards, 'floor-complete');
      for (const enemy of enemies.filter((entity) => !entity.alive)) {
        this.reward(enemy, floor);
      }
      this.now += 650;
      this.floorTimes.push(this.now - start);
      this.emit('floor_complete', floor, undefined, undefined, {
        victory: party.some((hero) => hero.alive),
      });
      for (const hero of party) {
        if (hero.alive) {
          hero.hp = Math.min(hero.maxHp, hero.hp + Math.round(hero.maxHp * 0.4));
          hero.mana = hero.maxMana;
        }
      }
    }
    const victory = this.events.some(
      (event) => event.type === 'death' && event.targetId === 'lion-king',
    );
    this.emit('hunt_complete', 4, undefined, undefined, { victory });
    return {
      events:this.events,
      duration:this.now,
      victory,
      xp:this.xp,
      gold:this.gold,
      kills:this.kills,
      bosses:this.events.filter((event) => event.type === 'death' && event.targetId === 'lion-king').length,
      bossTokens:this.bossTokens,
      damage:this.damage,
      healing:this.healing,
      damageTaken:this.damageTaken,
      loot:this.loot,
      floorTimes:this.floorTimes,
      gridMetrics:clone(this.gridMetrics),
    };
  }
}

export { TILE_SIZE };
