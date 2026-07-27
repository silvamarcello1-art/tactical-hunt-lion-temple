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
  Point,
} from '../events/types';
import {
  TILE_SIZE,
  directionTo,
  pointInTiles,
  stepToward,
  tileDistance,
  worldTiles,
} from './tiles';

type SimEntity = EntitySnapshot & {
  alive: boolean;
  cooldowns: Record<string, number>;
  groupCooldowns: Record<string, number>;
  targetId?: string;
  forcedTargetUntil?: number;
  threat: Record<string, number>;
  rewarded?: boolean;
  safePosition: Point;
};

type AbilityTargeting = {
  facing: Direction;
  tiles: Point[];
  targets: SimEntity[];
};

type OffensiveAction = {
  ability: AbilityDefinition;
  targeting: AbilityTargeting;
  score: number;
};

type Hazard = {
  sourceId: string;
  tiles: Point[];
  detonateAt: number;
  floor: number;
  damage: number;
  ability: string;
  element: string;
};

const clone = <T>(value: T): T => structuredClone(value);
const isHero = (entity: SimEntity) =>
  entity.role === 'knight' ||
  entity.role === 'druid' ||
  entity.role === 'sorcerer';

const defaultHeroPreferencesById = (): Record<string, AbilityPreferences> =>
  Object.fromEntries(
    heroes
      .filter((hero) =>
        hero.role === 'knight' || hero.role === 'druid' || hero.role === 'sorcerer',
      )
      .map((hero) => [hero.id, defaultAbilityPreferences()]),
  );

const isAbilityPreferencesObject = (
  value: unknown,
): value is AbilityPreferences =>
  typeof value === 'object' &&
  value !== null &&
  Object.values(value).every(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'enabled' in entry &&
      'priority' in entry,
  );

const normalizePreferences = (
  preferences: Record<string, AbilityPreferences> | AbilityPreferences,
): Record<string, AbilityPreferences> => {
  if (typeof preferences !== 'object' || preferences === null) {
    return defaultHeroPreferencesById();
  }

  const heroIds = new Set(
    heroes
      .filter(
        (hero) =>
          hero.role === 'knight' || hero.role === 'druid' || hero.role === 'sorcerer',
      )
      .map((hero) => hero.id),
  );
  const keys = Object.keys(preferences);
  const isHeroMap = keys.length > 0 && keys.every((key) => heroIds.has(key));

  if (isHeroMap) {
    return preferences as Record<string, AbilityPreferences>;
  }

  if (isAbilityPreferencesObject(preferences)) {
    return Object.fromEntries(
      heroes
        .filter(
          (hero) =>
            hero.role === 'knight' || hero.role === 'druid' || hero.role === 'sorcerer',
        )
        .map((hero) => [hero.id, preferences]),
    );
  }

  return defaultHeroPreferencesById();
};

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
  private preferences: Record<string, AbilityPreferences>;

  constructor(
    private seed = 803,
    preferences: Record<string, AbilityPreferences> | AbilityPreferences = defaultHeroPreferencesById(),
  ) {
    this.preferences = normalizePreferences(preferences);
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
  ) {
    this.events.push({
      id: `e${++this.sequence}`,
      time: this.now,
      type,
      floor,
      sourceId,
      targetId,
      data,
    });
  }

  private entity(snapshot: EntitySnapshot): SimEntity {
    return {
      ...clone(snapshot),
      alive: true,
      cooldowns: {},
      groupCooldowns: {},
      threat: {},
      safePosition: clone(snapshot.position),
    };
  }

  private ability(id: string) {
    return abilities.find((candidate) => candidate.id === id)!;
  }

  private heroPreferences(heroId: string): AbilityPreferences {
    return this.preferences[heroId] ?? defaultAbilityPreferences();
  }

  private enabled(id: string, heroId: string) {
    return this.heroPreferences(heroId)[id]?.enabled ?? true;
  }

  private canCast(entity: SimEntity, ability: AbilityDefinition) {
    return (
      this.enabled(ability.id, entity.id) &&
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
    tiles: Point[],
    facing: Direction,
  ) {
    entity.cooldowns[ability.id] = this.now + ability.cooldown;
    entity.groupCooldowns[ability.group] = this.now + ability.groupCooldown;
    entity.mana = Math.max(0, entity.mana - ability.manaCost);
    this.emit('cast', floor, entity.id, targetId, {
      ability: ability.name,
      abilityId: ability.id,
      words: ability.words,
      mana: entity.mana,
      manaCost: ability.manaCost,
      element: this.element(ability),
      tiles: clone(tiles),
      facing,
      cooldownEndsAt: entity.cooldowns[ability.id],
      cooldownDuration: ability.cooldown,
    });
  }

  private move(
    entity: SimEntity,
    destination: Point,
    floor: number,
    reposition = false,
  ) {
    const next = stepToward(entity.position, destination);
    if (next.x === entity.position.x && next.y === entity.position.y) return false;
    entity.position = next;
    this.emit(reposition ? 'reposition' : 'move', floor, entity.id, undefined, {
      position: clone(next),
      duration: 220,
    });
    return true;
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
          tileDistance(origin.position, left.position) -
            tileDistance(origin.position, right.position) ||
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
    const proximity = Math.max(1, 160 - tileDistance(enemy.position, hero.position) * 18);
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
          tileDistance(enemy.position, left.position) -
            tileDistance(enemy.position, right.position) ||
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
    const facing = directionTo(caster.position, target.position);
    if (ability.shape === 'single') {
      const inRange = tileDistance(caster.position, target.position) <= ability.rangeTiles;
      return {
        facing,
        tiles: inRange ? [clone(target.position)] : [],
        targets: inRange ? [target] : [],
      };
    }
    const tiles = worldTiles(caster.position, ability.id, facing);
    return {
      facing,
      tiles,
      targets: candidates.filter(
        (candidate) => candidate.alive && pointInTiles(candidate.position, tiles),
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
        tileDistance(caster.position, left.targets[0]?.position ?? caster.position) -
          tileDistance(caster.position, right.targets[0]?.position ?? caster.position),
    )[0];
  }

  private offensiveActions(
    caster: SimEntity,
    candidates: SimEntity[],
    floor: number,
  ): OffensiveAction[] {
    const preferences = this.heroPreferences(caster.id);
    return abilitiesByVocation(caster.role as AbilityDefinition['vocation'], preferences)
      .filter((ability) => ability.group !== 'healing' && ability.group !== 'support')
      .filter((ability) => this.canCast(caster, ability))
      .filter((ability) => !(ability.reserveForBoss && floor < 4))
      .flatMap((ability) => {
        const targeting = this.bestTargeting(caster, ability, candidates);
        if (!targeting || targeting.targets.length < ability.hardMinTargets) return [];
        const priority = preferences[ability.id]?.priority ?? 99;
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
    this.cast(
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
      this.emit('projectile', floor, caster.id, targeting.targets[0].id, {
        ability: ability.name,
        abilityId: ability.id,
        element: this.element(ability),
      });
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

  private isWalkable(point: Point) {
    const column = point.x / TILE_SIZE;
    const row = point.y / TILE_SIZE;
    const bounds = HUNT_LAYOUT_CONFIG.walkableBounds;
    return (
      column >= bounds.minColumn &&
      column <= bounds.maxColumn &&
      row >= bounds.minRow &&
      row <= bounds.maxRow
    );
  }

  private isOccupied(
    point: Point,
    party: SimEntity[],
    enemies: SimEntity[],
    exceptId?: string,
  ) {
    return [...party, ...enemies].some(
      (entity) =>
        entity.alive &&
        entity.id !== exceptId &&
        tileDistance(entity.position, point) === 0,
    );
  }

  private boxedEnemies(knight: SimEntity, enemies: SimEntity[]) {
    return enemies.filter(
      (enemy) =>
        enemy.alive && tileDistance(knight.position, enemy.position) <= 1,
    );
  }

  private waveScoreAt(
    caster: SimEntity,
    position: Point,
    enemies: SimEntity[],
  ) {
    const waves = abilitiesByVocation(
      caster.role as AbilityDefinition['vocation'],
      this.heroPreferences(caster.id),
    ).filter((ability) => ability.shape === 'wave');
    let score = 0;
    for (const ability of waves) {
      for (const facing of ['up', 'down', 'left', 'right'] as Direction[]) {
        const tiles = worldTiles(position, ability.id, facing);
        score = Math.max(
          score,
          enemies.filter(
            (enemy) => enemy.alive && pointInTiles(enemy.position, tiles),
          ).length,
        );
      }
    }
    return score;
  }

  private bestMagePosition(
    caster: SimEntity,
    knight: SimEntity,
    party: SimEntity[],
    enemies: SimEntity[],
  ) {
    const candidates: Array<{ point: Point; score: number }> = [];
    const bounds = HUNT_LAYOUT_CONFIG.walkableBounds;
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column++) {
      for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
        const point = { x: column * TILE_SIZE, y: row * TILE_SIZE };
        const knightDistance = tileDistance(point, knight.position);
        if (knightDistance < 3 || knightDistance > 7) continue;
        if (this.isOccupied(point, party, enemies, caster.id)) continue;
        const closestEnemy = Math.min(
          ...enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => tileDistance(point, enemy.position)),
        );
        if (closestEnemy <= 1) continue;
        const score =
          this.waveScoreAt(caster, point, enemies) * 100 +
          Math.min(closestEnemy, 6) * 8 -
          tileDistance(caster.position, point);
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
    if (box.length < 2) return false;
    const destination = this.bestMagePosition(caster, knight, party, enemies);
    if (!destination) return false;
    const currentScore = this.waveScoreAt(caster, caster.position, enemies);
    const destinationScore = this.waveScoreAt(caster, destination, enemies);
    const unsafe = enemies.some(
      (enemy) =>
        enemy.alive && tileDistance(caster.position, enemy.position) <= 2,
    );
    if (!unsafe && destinationScore <= currentScore) return false;
    const next = stepToward(caster.position, destination);
    const crossesBox =
      tileDistance(next, knight.position) <= 1 ||
      box.some((enemy) => tileDistance(next, enemy.position) === 0);
    if (
      crossesBox ||
      !this.isWalkable(next) ||
      this.isOccupied(next, party, enemies, caster.id)
    ) {
      return false;
    }
    caster.safePosition = clone(destination);
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
    const candidates: Array<{ point: Point; score: number }> = [];
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column++) {
      for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
        const point = { x: column * TILE_SIZE, y: row * TILE_SIZE };
        if (this.isOccupied(point, party, enemies, knight.id)) continue;
        const captured = backlineTargets.filter(
          (enemy) => tileDistance(point, enemy.position) <= range,
        ).length;
        if (!captured) continue;
        const allInRange = enemies.filter(
          (enemy) =>
            enemy.alive &&
            enemy.role !== 'boss' &&
            tileDistance(point, enemy.position) <= range,
        ).length;
        candidates.push({
          point,
          score:
            captured * 1000 +
            allInRange * 50 -
            tileDistance(knight.position, point),
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
        tileDistance(knight.position, enemy.position) <= challenge.rangeTiles,
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
        tileDistance(knight.position, enemy.position) <= challenge.rangeTiles,
    );
    const tiles = worldTiles(knight.position, challenge.id, 'right');
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
      tiles,
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
      if (target && tileDistance(knight.position, target.position) > 1) {
        this.move(knight, target.position, floor);
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
        tileDistance(druid.position, wounded.position) <= heal.rangeTiles
      ) {
        const facing = directionTo(druid.position, wounded.position);
        this.cast(druid, heal, floor, wounded.id, [clone(wounded.position)], facing);
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
          if (target) this.move(druid, target.position, floor, true);
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
        if (target && tileDistance(sorcerer.position, target.position) <= 7) {
          this.emit('basic_attack', floor, sorcerer.id, target.id);
          this.emit('projectile', floor, sorcerer.id, target.id, {
            element: 'energy',
          });
          this.applyDamage(sorcerer, target, sorcerer.attack * 0.55, floor, 'energy');
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
      if (tileDistance(enemy.position, target.position) > rangeTiles) {
        this.move(enemy, target.position, floor);
        continue;
      }
      const canArea = ranged && turn % (enemy.role === 'boss' ? 14 : 20) === 0;
      if (canArea) {
        const facing = directionTo(enemy.position, target.position);
        const ability = enemy.role === 'boss' ? 'Royal Solar Wave' : 'Sandstorm Wave';
        const abilityId = enemy.role === 'boss' ? 'energy_wave' : 'strong_ice_wave';
        const tiles = worldTiles(enemy.position, abilityId, facing);
        this.emit('area_warning', floor, enemy.id, target.id, {
          tiles,
          duration: 1000,
          ability,
          element: enemy.role === 'boss' ? 'holy' : 'earth',
          facing,
        });
        hazards.push({
          sourceId:enemy.id,
          tiles,
          detonateAt:this.now + 1000,
          floor,
          damage:enemy.attack * (enemy.role === 'boss' ? 1.55 : 1.2),
          ability,
          element:enemy.role === 'boss' ? 'holy' : 'earth',
        });
      } else if (turn % 4 === 0) {
        this.emit('basic_attack', floor, enemy.id, target.id);
        if (ranged) {
          this.emit('projectile', floor, enemy.id, target.id, {
            element: enemy.role === 'boss' ? 'holy' : 'earth',
          });
        }
        this.applyDamage(
          enemy,
          target,
          enemy.attack,
          floor,
          enemy.role === 'boss' ? 'holy' : 'physical',
        );
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
      if (!source?.alive) continue;
      this.emit('monster_aoe', hazard.floor, source.id, undefined, {
        tiles: clone(hazard.tiles),
        ability: hazard.ability,
        element: hazard.element,
      });
      for (const hero of party.filter(
        (entity) => entity.alive && pointInTiles(entity.position, hazard.tiles),
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

  run(): HuntResult {
    const party = heroes.map((hero) => this.entity(hero));
    for (let floorIndex = 0; floorIndex < floors.length; floorIndex++) {
      const floor = floorIndex + 1;
      const start = this.now;
      this.floorStartedAt = start;
      const enemies = floors[floorIndex].map((enemy) => this.entity(enemy));
      for (const hero of party.filter((entity) => entity.alive)) {
        const original = heroes.find((candidate) => candidate.id === hero.id)!;
        hero.position = clone(original.position);
        hero.safePosition = clone(original.position);
        this.emit('spawn', floor, undefined, hero.id, {
          entity: clone(hero),
          position: clone(hero.position),
        });
      }
      for (const enemy of enemies) {
        this.emit(
          enemy.role === 'boss' ? 'boss_spawn' : 'spawn',
          floor,
          undefined,
          enemy.id,
          { entity: clone(enemy), position: clone(enemy.position) },
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
        hazards = this.resolveHazards(hazards, party, enemies);
        this.heroActions(party, enemies, floor, turn);
        for (const enemy of enemies.filter((entity) => !entity.alive)) {
          this.reward(enemy, floor);
        }
        this.monsterActions(enemies, party, hazards, floor, turn);
        this.now += 250;
      }
      hazards = this.resolveHazards(hazards, party, enemies);
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
    };
  }
}

export { TILE_SIZE };
