import type { Vocation } from './progression';

export type EquipmentSlot = 'weapon' | 'armor';
export type ItemStat = 'attack' | 'magicPower' | 'defense' | 'maxHp' | 'maxMana';
export type Modifiers = Partial<Record<ItemStat, number>>;
export interface ItemDefinition {
  id:string; name:string; slot:EquipmentSlot | 'material'; vocations:readonly Vocation[];
  rarity:'common'|'uncommon'|'rare'; icon:string; modifiers:Modifiers;
  improvement:Modifiers; description:string;
}
const all:Vocation[]=['knight','druid','sorcerer'];
export const items:readonly ItemDefinition[] = [
  {id:'iron-edge',name:'Gume da Vigília',slot:'weapon',vocations:['knight'],rarity:'uncommon',icon:'blade',modifiers:{attack:22,defense:-3},improvement:{attack:8},description:'Pressão ofensiva em troca de proteção.'},
  {id:'ward-hammer',name:'Martelo do Bastião',slot:'weapon',vocations:['knight'],rarity:'rare',icon:'hammer',modifiers:{attack:10,defense:9},improvement:{defense:4},description:'Sustenta a linha de frente.'},
  {id:'root-staff',name:'Ramo do Alento',slot:'weapon',vocations:['druid'],rarity:'uncommon',icon:'branch',modifiers:{magicPower:25,defense:-2},improvement:{magicPower:10},description:'Potencializa cura e magia; exige posicionamento.'},
  {id:'moss-focus',name:'Foco de Musgo',slot:'weapon',vocations:['druid'],rarity:'rare',icon:'leaf',modifiers:{magicPower:12,maxMana:100,defense:4},improvement:{magicPower:5,maxMana:30},description:'Reserva de mana para encontros prolongados.'},
  {id:'prism-rod',name:'Vara Prismática',slot:'weapon',vocations:['sorcerer'],rarity:'uncommon',icon:'prism',modifiers:{magicPower:28,defense:-4},improvement:{magicPower:10},description:'Maior impacto mágico, menor resistência.'},
  {id:'echo-focus',name:'Foco do Eco',slot:'weapon',vocations:['sorcerer'],rarity:'rare',icon:'orb',modifiers:{magicPower:14,maxMana:90,defense:3},improvement:{magicPower:5,maxMana:30},description:'Conjuração sustentada e proteção moderada.'},
  {id:'iron-coat',name:'Couraça do Juramento',slot:'armor',vocations:all,rarity:'uncommon',icon:'plate',modifiers:{defense:10,maxHp:80},improvement:{defense:4,maxHp:30},description:'Sobrevivência sem bônus ofensivo.'},
  {id:'woven-mantle',name:'Manto do Horizonte',slot:'armor',vocations:all,rarity:'rare',icon:'robe',modifiers:{magicPower:8,defense:4,maxMana:80},improvement:{magicPower:4,maxMana:30},description:'Alternativa mágica à armadura pesada.'},
  {id:'temple-ember',name:'Brasa do Templo',slot:'material',vocations:all,rarity:'common',icon:'ember',modifiers:{},improvement:{},description:'Uma brasa e 200 ouro reforçam um equipamento até +1.'},
];
export const itemById=(id:string)=>items.find(item=>item.id===id);
export const EQUIPMENT_RULES={capacity:24,materialStack:99,forgeGold:200,forgeMaterial:1} as const;
