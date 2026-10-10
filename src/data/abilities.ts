export type AbilityGroup = 'attack' | 'healing' | 'support' | 'focus';
export type AbilityShape = 'single' | 'circle' | 'wave' | 'pull';

export interface AbilityDefinition {
  id: string;
  name: string;
  words: string;
  vocation: 'knight' | 'druid' | 'sorcerer';
  cooldown: number;
  group: AbilityGroup;
  groupCooldown: number;
  shape: AbilityShape;
  rangeTiles: number;
  manaCost: number;
  power: number;
  preferredMinTargets: number;
  hardMinTargets: number;
  reserveForBoss?: boolean;
  requiresLineOfSight?: boolean;
  projectileBlocksUnits?: boolean;
  color: number;
  icon: string;
  requiresTelegraph?: boolean;
}

export interface AbilityPreference {
  enabled: boolean;
  priority: number;
}

export type AbilityPreferences = Record<string, AbilityPreference>;

export const abilities: AbilityDefinition[] = [
  { id:'challenge',name:'Chamado do Ferro',words:'Chamado do Ferro',vocation:'knight',cooldown:2000,group:'support',groupCooldown:2000,shape:'pull',rangeTiles:7,manaCost:80,power:0,preferredMinTargets:1,hardMinTargets:1,color:0xe8b94f,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
  { id:'berserk',name:'Arco de Ferro',words:'Arco de Ferro',vocation:'knight',cooldown:4000,group:'attack',groupCooldown:2000,shape:'circle',rangeTiles:1,manaCost:125,power:1.05,preferredMinTargets:2,hardMinTargets:1,color:0xe8c25a,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
  { id:'groundshaker',name:'Ruptura',words:'Ruptura',vocation:'knight',cooldown:8000,group:'attack',groupCooldown:2000,shape:'circle',rangeTiles:3,manaCost:200,power:.72,preferredMinTargets:3,hardMinTargets:1,color:0xc7a66a,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
  { id:'heal_friend',name:'Laço Vital',words:'Laço Vital',vocation:'druid',cooldown:1000,group:'healing',groupCooldown:1000,shape:'single',rangeTiles:7,manaCost:120,power:2.2,preferredMinTargets:1,hardMinTargets:1,color:0x63d991,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
  { id:'strong_ice_wave',name:'Semente Errante',words:'Semente Errante',vocation:'druid',cooldown:4000,group:'attack',groupCooldown:2000,shape:'single',rangeTiles:7,manaCost:170,power:.95,preferredMinTargets:1,hardMinTargets:1,color:0x75d9ed,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
  { id:'eternal_winter',name:'Jardim da Vigília',words:'Jardim da Vigília',vocation:'druid',cooldown:40000,group:'focus',groupCooldown:4000,shape:'circle',rangeTiles:5,manaCost:1050,power:1.28,preferredMinTargets:4,hardMinTargets:1,reserveForBoss:true,color:0xb8efff,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
  { id:'flame_strike',name:'Lança de Brasa',words:'Lança de Brasa',vocation:'sorcerer',cooldown:2000,group:'attack',groupCooldown:2000,shape:'single',rangeTiles:7,manaCost:20,power:1.05,preferredMinTargets:1,hardMinTargets:1,color:0xff713f,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
  { id:'energy_wave',name:'Frente Astral',words:'Frente Astral',vocation:'sorcerer',cooldown:8000,group:'attack',groupCooldown:2000,shape:'wave',rangeTiles:5,manaCost:170,power:1.12,preferredMinTargets:3,hardMinTargets:1,color:0x9b78ff,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
  { id:'rage_skies',name:'Céu Partido',words:'Céu Partido',vocation:'sorcerer',cooldown:40000,group:'focus',groupCooldown:4000,shape:'circle',rangeTiles:5,manaCost:600,power:1.45,preferredMinTargets:4,hardMinTargets:1,reserveForBoss:true,color:0x806cff,icon:'/assets/original/ui/ability-icons.png',requiresTelegraph:false },
];

// Legacy IDs are stable storage keys only; presentation and art are original.

export const defaultAbilityPreferences = (): AbilityPreferences =>
  Object.fromEntries(
    abilities.map((ability) => [
      ability.id,
      {
        enabled: true,
        priority:
          ability.group === 'focus'
            ? 1
            : ability.shape === 'wave' || ability.id === 'groundshaker'
              ? 2
              : 3,
      },
    ]),
  );

export const abilitiesByVocation = (
  vocation: AbilityDefinition['vocation'],
  preferences?: AbilityPreferences,
) =>
  abilities
    .filter(
      (ability) =>
        ability.vocation === vocation &&
        (preferences?.[ability.id]?.enabled ?? true),
    )
    .sort(
      (left, right) =>
        (preferences?.[left.id]?.priority ?? 99) -
        (preferences?.[right.id]?.priority ?? 99),
    );
