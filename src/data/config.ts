import { tile } from '../combat/tiles';
import type { EntitySnapshot } from '../events/types';

export const HUNT_LAYOUT_CONFIG = {
  arenaColumns:30,
  arenaRows:18,
  walkableBounds:{
    minColumn:2,
    maxColumn:27,
    minRow:2,
    maxRow:15,
  },
  ceremonialPath:{
    minColumn:14,
    maxColumn:15,
  },
  partyPositions:{
    knight:tile(8,9),
    druid:tile(5,6),
    sorcerer:tile(5,12),
  },
  enemySpawnPositions:[
    [tile(20,5),tile(24,7),tile(21,11),tile(25,14)],
    [tile(20,5),tile(24,6),tile(26,10),tile(21,14)],
    [
      tile(19,4),
      tile(23,5),
      tile(26,8),
      tile(26,13),
      tile(22,14),
      tile(19,10),
    ],
    [tile(22,5),tile(25,9),tile(22,14)],
  ],
  enemyCombatPositions:[
    tile(11,7),
    tile(12,8),
    tile(12,9),
    tile(12,10),
    tile(11,11),
    tile(11,12),
  ],
  bossPosition:tile(25,9),
} as const;

export const heroes: EntitySnapshot[] = [
  { id:'knight',name:'Aldric',role:'knight',hp:1650,maxHp:1650,mana:720,maxMana:720,attack:128,defense:42,crit:.12,dodge:.04,position:HUNT_LAYOUT_CONFIG.partyPositions.knight,color:0xd8ad51 },
  { id:'druid',name:'Lyra',role:'druid',hp:920,maxHp:920,mana:1600,maxMana:1600,attack:96,defense:17,crit:.1,dodge:.09,position:HUNT_LAYOUT_CONFIG.partyPositions.druid,color:0x67c891 },
  { id:'sorcerer',name:'Orin',role:'sorcerer',hp:840,maxHp:840,mana:1350,maxMana:1350,attack:152,defense:14,crit:.18,dodge:.08,position:HUNT_LAYOUT_CONFIG.partyPositions.sorcerer,color:0x8d7ce4 },
];

const lion = (
  id: string,
  name: string,
  hp: number,
  attack: number,
  position: { x: number; y: number },
  mage = false,
): EntitySnapshot => ({
  id,
  name,
  role:'monster',
  hp,
  maxHp:hp,
  mana:mage ? 300 : 0,
  maxMana:mage ? 300 : 0,
  attack,
  defense:mage ? 12 : 20,
  crit:.05,
  dodge:.04,
  position,
  color:mage ? 0xb46fc4 : 0xb8843f,
});

export const floors: EntitySnapshot[][] = [
  [
    lion('lion-1','Lion Warrior',420,58,HUNT_LAYOUT_CONFIG.enemySpawnPositions[0][0]),
    lion('lion-2','Lion Warrior',420,58,HUNT_LAYOUT_CONFIG.enemySpawnPositions[0][1]),
    lion('lion-3','Lion Warrior',420,58,HUNT_LAYOUT_CONFIG.enemySpawnPositions[0][2]),
    lion('lion-4','Lion Warrior',420,58,HUNT_LAYOUT_CONFIG.enemySpawnPositions[0][3]),
  ],
  [
    lion('lion-5','Lion Warrior',500,64,HUNT_LAYOUT_CONFIG.enemySpawnPositions[1][0]),
    lion('lion-6','Lion Warrior',500,64,HUNT_LAYOUT_CONFIG.enemySpawnPositions[1][1]),
    lion('mage-1','Lion Mage',380,80,HUNT_LAYOUT_CONFIG.enemySpawnPositions[1][2],true),
    lion('mage-2','Lion Mage',380,80,HUNT_LAYOUT_CONFIG.enemySpawnPositions[1][3],true),
  ],
  [
    lion('lion-7','Lion Warrior',560,68,HUNT_LAYOUT_CONFIG.enemySpawnPositions[2][0]),
    lion('lion-8','Lion Warrior',560,68,HUNT_LAYOUT_CONFIG.enemySpawnPositions[2][1]),
    lion('lion-9','Lion Warrior',560,68,HUNT_LAYOUT_CONFIG.enemySpawnPositions[2][2]),
    lion('mage-3','Lion Mage',420,84,HUNT_LAYOUT_CONFIG.enemySpawnPositions[2][3],true),
    lion('mage-4','Lion Mage',420,84,HUNT_LAYOUT_CONFIG.enemySpawnPositions[2][4],true),
    lion('lion-10','Lion Warrior',560,68,HUNT_LAYOUT_CONFIG.enemySpawnPositions[2][5]),
  ],
  [
    lion('guard-1','Royal Guard',620,75,HUNT_LAYOUT_CONFIG.enemySpawnPositions[3][0]),
    { id:'lion-king',name:'Lion King',role:'boss',hp:3600,maxHp:3600,mana:800,maxMana:800,attack:105,defense:32,crit:.13,dodge:.06,position:HUNT_LAYOUT_CONFIG.bossPosition,color:0xe0a62f },
    lion('guard-2','Royal Guard',620,75,HUNT_LAYOUT_CONFIG.enemySpawnPositions[3][2]),
  ],
];
