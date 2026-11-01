import {abilities,type AbilityDefinition} from './abilities';
/** Reference snapshot 2026-10-19. IDs/saves and the normal hunt ruleset remain stable.
 * Names/words and published costs/CDs follow the library. Damage, requirements
 * and unverified masks still use explicit prototype parameters (see docs). */
const identity:Record<string,Pick<AbilityDefinition,'name'|'words'>>={
  challenge:{name:'Chivalrous Challenge',words:'exeta amp res'},
  berserk:{name:'Berserk',words:'exori'},
  groundshaker:{name:'Groundshaker',words:'exori mas'},
  heal_friend:{name:'Heal Friend',words:'exura sio'},
  strong_ice_wave:{name:'Strong Ice Wave',words:'exevo gran frigo hur'},
  eternal_winter:{name:'Eternal Winter',words:'exevo gran mas frigo'},
  flame_strike:{name:'Flame Strike',words:'exori flam'},
  energy_wave:{name:'Energy Wave',words:'exevo vis hur'},
  rage_skies:{name:'Rage of the Skies',words:'exevo gran mas vis'},
};
export const trainingSpells:AbilityDefinition[]=abilities.map(a=>({...a,...identity[a.id],
  ...(['eternal_winter','rage_skies'].includes(a.id)?{group:'attack' as const,groupCooldown:4000,secondaryGroup:'focus' as const,secondaryGroupCooldown:40000}:{}),
  ...(a.id==='heal_friend'?{targetRule:'ally-only' as const}:{}),
  ...(a.id==='strong_ice_wave'?{shape:'wave' as const,preferredMinTargets:2,rangeTiles:5}:{}),
  ...(a.id==='flame_strike'?{rangeTiles:3}:{}),
}));
export const abilityCatalog=(training=false)=>training?trainingSpells:abilities;
