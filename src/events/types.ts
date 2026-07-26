export type EventType =
  | 'spawn'
  | 'boss_spawn'
  | 'move'
  | 'reposition'
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
    item?: string;
    quantity?: number;
    entity?: EntitySnapshot;
    victory?: boolean;
    radius?: number;
    duration?: number;
    targets?: string[];
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
}

export interface HuntResult {
  events: CombatEvent[];
  duration: number;
  victory: boolean;
  xp: number;
  gold: number;
  kills: number;
  damage: Record<string, number>;
  healing: number;
  damageTaken: number;
  loot: Record<string, number>;
  floorTimes: number[];
}
