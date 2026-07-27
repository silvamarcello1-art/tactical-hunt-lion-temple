import {
  abilities,
  abilitiesByVocation,
  defaultAbilityPreferences,
  type AbilityDefinition,
  type AbilityPreferences,
} from '../data/abilities';
import { floors, heroes } from '../data/config';
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
  aggroUntil?: number;
  rewarded?: boolean;
  safePosition: Point;
  returnToSafe?: boolean;
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
  private loot: Record<string, number> = {};
  private floorTimes: number[] = [];

  constructor(
    private seed = 803,
    private preferences: AbilityPreferences = defaultAbilityPreferences(),
  ) {}

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
      safePosition: clone(snapshot.position),
    };
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
    if (isHero(source)) this.damage[source.id] += amount;
    else this.damageTaken += amount;
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
      this.addLoot('Boss token', 1, floor, enemy.id);
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
          tileDistance(origin.position, right.position),
      )[0];
  }

  private returnToAnchor(entity: SimEntity, floor: number) {
    if (!entity.returnToSafe) return false;
    if (tileDistance(entity.position, entity.safePosition) === 0) {
      entity.returnToSafe = false;
      return false;
    }
    this.move(entity, entity.safePosition, floor, true);
    return true;
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

  private tryOffensiveAbility(
    caster: SimEntity,
    ability: AbilityDefinition,
    candidates: SimEntity[],
    floor: number,
  ) {
    if (!this.canCast(caster, ability)) return false;
    const target = this.nearest(caster, candidates);
    if (!target) return false;
    const targeting = this.abilityTargets(caster, target, ability, candidates);
    if (!targeting.targets.length) {
      this.move(caster, target.position, floor, caster.role !== 'knight');
      return true;
    }
    this.cast(
      caster,
      ability,
      floor,
      targeting.targets[0].id,
      targeting.tiles,
      targeting.facing,
    );
    if (
      caster.role !== 'knight' &&
      tileDistance(caster.position, caster.safePosition) > 0
    ) {
      caster.returnToSafe = true;
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

    const challenge = this.ability('challenge');
    if (knight.alive && this.canCast(knight, challenge)) {
      const tiles = worldTiles(knight.position, challenge.id, 'right');
      const taunted = aliveEnemies
        .filter(
          (enemy) =>
            enemy.role !== 'boss' &&
            enemy.name.includes('Mage') &&
            tileDistance(knight.position, enemy.position) > 1 &&
            pointInTiles(enemy.position, tiles),
        )
        .sort(
          (left, right) =>
            tileDistance(knight.position, left.position) -
            tileDistance(knight.position, right.position),
        )
        .slice(0, 4);
      if (taunted.length) {
        this.cast(knight, challenge, floor, undefined, tiles, 'right');
        const pullOffsets = [
          { x:1, y:0 },
          { x:1, y:-1 },
          { x:0, y:-1 },
          { x:-1, y:-1 },
        ];
        for (const enemy of taunted) {
          enemy.targetId = knight.id;
          enemy.aggroUntil = this.now + 6000;
        }
        this.emit('aggro', floor, knight.id, undefined, {
          tiles,
          duration: 6000,
          targets: taunted.map((enemy) => enemy.id),
        });
        taunted.forEach((enemy, index) => {
          const offset = pullOffsets[index];
          enemy.position = {
            x:knight.position.x + offset.x * TILE_SIZE,
            y:knight.position.y + offset.y * TILE_SIZE,
          };
          this.emit('reposition', floor, enemy.id, knight.id, {
            position:clone(enemy.position),
            duration:420,
            pull:true,
          });
        });
      }
    }

    if (knight.alive) {
      const target = this.nearest(knight, aliveEnemies);
      if (target && tileDistance(knight.position, target.position) > 1) {
        this.move(knight, target.position, floor);
      } else {
        const options = abilitiesByVocation('knight', this.preferences).filter(
          (ability) => ability.group === 'attack',
        );
        const acted = options.some((ability) =>
          this.tryOffensiveAbility(knight, ability, aliveEnemies, floor),
        );
        if (!acted && target && turn % 3 === 0) {
          this.emit('basic_attack', floor, knight.id, target.id);
          this.applyDamage(knight, target, knight.attack * 0.82, floor);
        }
      }
    }

    if (druid.alive) {
      if (!this.returnToAnchor(druid, floor)) {
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
        } else {
          abilitiesByVocation('druid', this.preferences)
            .filter((ability) => ability.group !== 'healing')
            .some((ability) =>
              this.tryOffensiveAbility(druid, ability, aliveEnemies, floor),
            );
        }
      }
    }

    if (sorcerer.alive && !this.returnToAnchor(sorcerer, floor)) {
      const acted = abilitiesByVocation('sorcerer', this.preferences).some(
        (ability) =>
          this.tryOffensiveAbility(sorcerer, ability, aliveEnemies, floor),
      );
      if (!acted && turn % 4 === 0) {
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
      const forced =
        enemy.aggroUntil && enemy.aggroUntil > this.now
          ? party.find((hero) => hero.id === enemy.targetId && hero.alive)
          : undefined;
      const target = forced ?? this.nearest(enemy, aliveParty);
      if (!target) continue;
      enemy.targetId = target.id;
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
      const enemies = floors[floorIndex].map((enemy) => this.entity(enemy));
      for (const hero of party.filter((entity) => entity.alive)) {
        const original = heroes.find((candidate) => candidate.id === hero.id)!;
        hero.position = clone(original.position);
        hero.safePosition = clone(original.position);
        hero.returnToSafe = false;
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
      damage:this.damage,
      healing:this.healing,
      damageTaken:this.damageTaken,
      loot:this.loot,
      floorTimes:this.floorTimes,
    };
  }
}

export { TILE_SIZE };
