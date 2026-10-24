import type { Vocation } from './progression';
import type { SpriteAction, SpriteFacing } from '../game/presentation/SpriteDefinition';
import {outfitSpriteAsset} from './outfitSprites';

export type AddonLevel = 0 | 1 | 2;
export const colorRegions = ['head','primary','secondary','legs','detail'] as const;
export type ColorRegion = typeof colorRegions[number];
export interface OutfitPalette { id:string; label:string; hex:string }
export const outfitPalettes:readonly OutfitPalette[] = [
  {id:'original',label:'Original',hex:''}, {id:'ember',label:'Brasa',hex:'#a94e43'},
  {id:'moss',label:'Musgo',hex:'#617747'}, {id:'ocean',label:'Oceano',hex:'#456c9b'},
  {id:'violet',label:'Ametista',hex:'#80618e'}, {id:'gold',label:'Ocre',hex:'#b48a43'},
  {id:'ivory',label:'Marfim',hex:'#c8bda1'}, {id:'coal',label:'Carvão',hex:'#424750'},
];
export interface CharacterAppearance {
  outfitId:string;
  addonLevel:AddonLevel;
  variantId:'base'|'dlc';
  colors:Record<ColorRegion,string>;
}
/** Only reviewed production assets may populate these slots. No implicit mirroring. */
export interface OutfitAssetSlot {
  facing:SpriteFacing; actions:readonly SpriteAction[]; asset:string; reviewed:boolean;
}
export interface OutfitAddonDefinition {
  id:string; level:1|2; accessories:readonly string[]; slots:readonly OutfitAssetSlot[];
}
export interface OutfitVariant {
  id:'base'|'dlc'; label:string; slots:readonly OutfitAssetSlot[];
}
export interface OutfitDefinition {
  id:string; name:string; nativeSprite?:Vocation;
  reference?:{row:number; column:0|1};
  addons:readonly OutfitAddonDefinition[];
  variants:readonly OutfitVariant[];
  recolorableRegions:readonly ColorRegion[];
  unlock:{source:'test'|'quest'|'boss'|'achievement'|'dlc'; availableForTest:boolean};
}
const references = [
  ['citizen','Citizen',0,0,'Mochila','Chapéu com pena'],
  ['warrior','Warrior',1,0,'Espinhos nos ombros','Capacete e espada nas costas'],
  ['mage','Mage',2,0,'Cajado','Chapéu'],
  ['assassin','Assassin',3,0,'Duas adagas','Capuz e capa'],
  ['druid','Druid',4,0,'Patas e garras de urso','Cabeça de lobo'],
  ['hunter','Hunter',5,0,'Luvas com garras','Capuz ampliado'],
  ['bolsonaro','Bolsonaro',0,1,'Faixa','Faixa completa'],
  ['lula','Lula',1,1,'Faixa','Faixa completa'],
  ['pope','Pope',2,1,'Cajado','Capa'],
  ['trump','Trump',3,1,'Boné','Bandeira dos EUA'],
  ['neymar','Neymar',4,1,'Faixa na cabeça','Gola levantada'],
  ['mbappe','Mbappé',5,1,'Gola levantada','Capa'],
] as const;
export const outfits:readonly OutfitDefinition[] = [
  ...(['knight','druid','sorcerer'] as const).map((sprite,i):OutfitDefinition=>({
    id:`original-${sprite}`,name:['Guardião original','Vigia original','Arcanista original'][i],nativeSprite:sprite,
    addons:[],variants:[{id:'base',label:'Original',slots:[]}],recolorableRegions:[],
    unlock:{source:'test',availableForTest:true},
  })),
  ...references.map(([id,name,row,column,first,second]):OutfitDefinition=>({
    id,name,reference:{row,column},
    addons:[{id:`${id}-1`,level:1,accessories:[first],slots:[]},{id:`${id}-2`,level:2,accessories:[second],slots:[]}],
    variants:[{id:'base',label:'Base',slots:[]},...(['neymar','mbappe'].includes(id)?[{id:'dlc' as const,label:outfitSpriteAsset(id,0,'dlc')?'DLC':'DLC · referência',slots:[]}]:[])],
    recolorableRegions:[],unlock:{source:'test',availableForTest:true},
  })),
];
export const outfitById=(id:string)=>outfits.find(o=>o.id===id);
export const defaultAppearance=(hero:string):CharacterAppearance=>({
  outfitId:`original-${['knight','druid','sorcerer'].includes(hero)?hero:'knight'}`,addonLevel:0,variantId:'base',
  colors:{head:'original',primary:'original',secondary:'original',legs:'original',detail:'original'},
});
export function normalizeAppearance(value:unknown,hero:string):CharacterAppearance {
  const fallback=defaultAppearance(hero);
  if(!value||typeof value!=='object')return fallback;
  const v=value as Partial<CharacterAppearance>,def=typeof v.outfitId==='string'?outfitById(v.outfitId):undefined;
  if(!def)return fallback;
  return {outfitId:def.id,addonLevel:def.addons.length&&(v.addonLevel===1||v.addonLevel===2)?v.addonLevel:0,
    variantId:v.variantId==='dlc'&&def.variants.some(v=>v.id==='dlc')?'dlc':'base',
    colors:Object.fromEntries(colorRegions.map(region=>[region,outfitPalettes.some(p=>p.id===v.colors?.[region])?v.colors![region]:'original'])) as CharacterAppearance['colors']};
}
/** Level 2 composes BOTH accessory groups; DLC does not rewrite addon state. */
export const activeAddons=(appearance:CharacterAppearance)=>outfitById(appearance.outfitId)!.addons.filter(a=>a.level<=appearance.addonLevel);
export function resolveOutfit(appearance:CharacterAppearance,hero:string) {
  const safe=normalizeAppearance(appearance,hero),def=outfitById(safe.outfitId)!;
  const asset=outfitSpriteAsset(def.id,safe.addonLevel,safe.variantId);
  return {spriteId:asset?.spriteId??def.nativeSprite??hero,fallback:!asset&&!def.nativeSprite,asset,definition:def,appearance:safe};
}
export function reviewedSlot(slots:readonly OutfitAssetSlot[],facing:SpriteFacing,action:SpriteAction) {
  // Missing north/diagonal means missing, not a mirrored asymmetric front frame.
  return slots.find(s=>s.reviewed&&s.facing===facing&&s.actions.includes(action));
}
