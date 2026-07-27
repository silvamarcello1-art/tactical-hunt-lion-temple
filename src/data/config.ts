import { tile } from '../combat/tiles';
import type { EntitySnapshot } from '../events/types';

export const heroes: EntitySnapshot[] = [
  { id:'knight',name:'Aldric',role:'knight',hp:1650,maxHp:1650,mana:720,maxMana:720,attack:128,defense:42,crit:.12,dodge:.04,position:tile(8,9),color:0xd8ad51 },
  { id:'druid',name:'Lyra',role:'druid',hp:920,maxHp:920,mana:1600,maxMana:1600,attack:96,defense:17,crit:.1,dodge:.09,position:tile(5,6),color:0x67c891 },
  { id:'sorcerer',name:'Orin',role:'sorcerer',hp:840,maxHp:840,mana:1350,maxMana:1350,attack:152,defense:14,crit:.18,dodge:.08,position:tile(5,12),color:0x8d7ce4 },
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
    lion('lion-1','Lion Warrior',420,58,tile(20,5)),
    lion('lion-2','Lion Warrior',420,58,tile(24,7)),
    lion('lion-3','Lion Warrior',420,58,tile(21,11)),
    lion('lion-4','Lion Warrior',420,58,tile(25,14)),
  ],
  [
    lion('lion-5','Lion Warrior',500,64,tile(20,5)),
    lion('lion-6','Lion Warrior',500,64,tile(24,6)),
    lion('mage-1','Lion Mage',380,80,tile(26,10),true),
    lion('mage-2','Lion Mage',380,80,tile(21,14),true),
  ],
  [
    lion('lion-7','Lion Warrior',560,68,tile(19,4)),
    lion('lion-8','Lion Warrior',560,68,tile(23,5)),
    lion('lion-9','Lion Warrior',560,68,tile(26,8)),
    lion('mage-3','Lion Mage',420,84,tile(26,13),true),
    lion('mage-4','Lion Mage',420,84,tile(22,14),true),
    lion('lion-10','Lion Warrior',560,68,tile(19,10)),
  ],
  [
    lion('guard-1','Royal Guard',620,75,tile(22,5)),
    { id:'lion-king',name:'Lion King',role:'boss',hp:3600,maxHp:3600,mana:800,maxMana:800,attack:105,defense:32,crit:.13,dodge:.06,position:tile(25,9),color:0xe0a62f },
    lion('guard-2','Royal Guard',620,75,tile(22,14)),
  ],
];
