import { abilities } from './abilities';
import { assetUrl } from '../game/assetUrl';
import {abilityCatalog} from './trainingSpells';
export const abilityNames:Record<string,string> = Object.fromEntries(abilities.map(a=>[a.id,a.name]));
export const abilityReasons:Record<string,string> = {
  'ally-required':'Escolha outro aliado',
  ok:'Pronta',cooldown:'Em recarga',mana:'Mana insuficiente','no-target':'Selecione um alvo',
  'invalid-target':'Alvo inválido','out-of-range':'Fora de alcance','line-of-sight':'Sem linha de visão',
  'not-enough-targets':'Poucos alvos na área',disabled:'Desativada no Helper',
  'not-started':'Inicie a hunt','actor-dead':'Personagem derrotado','session-ended':'Sessão encerrada',
};
export function iconMarkup(abilityId:string,training=false) {
  const binding=Object.values(actionBindings).flat().find(b=>b.abilityId===abilityId);
  if(!binding) return '';
  return `<span class="skill-icon" role="img" aria-label="${abilityCatalog(training).find(a=>a.id===abilityId)?.name}" data-icon-id="${abilityId}" style="background-image:url('${assetUrl(`/assets/original/ui/${training&&['strong_ice_wave','eternal_winter'].includes(abilityId)?'training-':''}${abilityId}.svg`)}');background-size:100% 100%"></span>`;
}
/** Stable slot/atlas metadata: independent of array order and Helper priority. */
export const actionBindings = {
  knight:[{key:'1',abilityId:'challenge',icon:[0,0]},{key:'2',abilityId:'berserk',icon:[1,0]},{key:'3',abilityId:'groundshaker',icon:[2,0]}],
  druid:[{key:'1',abilityId:'heal_friend',icon:[0,1]},{key:'2',abilityId:'strong_ice_wave',icon:[1,1]},{key:'3',abilityId:'eternal_winter',icon:[2,1]}],
  sorcerer:[{key:'1',abilityId:'flame_strike',icon:[0,2]},{key:'2',abilityId:'energy_wave',icon:[1,2]},{key:'3',abilityId:'rage_skies',icon:[2,2]}],
} as const;
export const actionSlots = (heroId:string,training=false) => (actionBindings[heroId as keyof typeof actionBindings]??[]).map(binding=>({...binding,code:`Digit${binding.key}`,ability:abilityCatalog(training).find(a=>a.id===binding.abilityId)!}));
export const bindingForCode=(heroId:string,code:string)=>/^Digit[1-9]$/.test(code)?actionSlots(heroId).find(slot=>slot.code===code):undefined;
