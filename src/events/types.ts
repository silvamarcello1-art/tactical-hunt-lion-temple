export type EventType =
  | 'spawn'
  | 'boss_spawn'
  | 'move'
  | 'reposition'
  | 'target_change'
  | 'aggro'
  | 'area_warning'
  | 'monster_aoe'
  | 'basic_attack'
  | 'cast'
  | 'projectile'
  | 'damage'
  | 'heal'
  | 'critical'
  | 'dodge'
  | 'death'
  | 'loot'
  | 'experience'
  | 'boss_reward'
  | 'floor_complete'
  | 'hunt_complete';

export interface Point {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface CombatEvent {
  id: string;
  time: number;
  type: EventType;
  floor: number;
  sourceId?: string;
  targetId?: string;
  data?: {
    amount?: number;
    element?: string;
    position?: Point;
    tiles?: Point[];
    facing?: Direction;
    ability?: string;
    abilityId?: string;
    words?: string;
    mana?: number;
    manaCost?: number;
    item?: string;
    quantity?: number;
    entity?: EntitySnapshot;
    victory?: boolean;
    radius?: number;
    duration?: number;
    targets?: string[];
    pull?: boolean;
    reason?: string;
    previousTargetId?: string;
    forcedUntil?: number;
    targetCount?: number;
    preferredMinTargets?: number;
    hardMinTargets?: number;
    cooldownEndsAt?: number;
    cooldownDuration?: number;
    rewardType?: string;
  };
}

export type Role = 'knight' | 'druid' | 'sorcerer' | 'monster' | 'boss';

export interface EntitySnapshot {
  id: string;
  name: string;
  role: Role;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  crit: number;
  dodge: number;
  position: Point;
  color: number;
  bossTokenReward?: number;
}

export interface HuntResult {
  events: CombatEvent[];
  duration: number;
  victory: boolean;
  xp: number;
  gold: number;
  kills: number;  bosses: number;
  bossTokens: number;  damage: Record<string, number>;
  healing: number;
  damageTaken: number;
  loot: Record<string, number>;
  floorTimes: number[];
}
