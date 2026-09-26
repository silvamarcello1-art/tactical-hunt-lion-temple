import { abilities, abilitiesByVocation } from './abilities';
import type { Vocation } from './progression';
import { assetUrl } from '../game/assetUrl';
export const abilityNames:Record<string,string> = {
  challenge:'Chamado do Ferro',berserk:'Arco de Ferro',groundshaker:'Ruptura',
  heal_friend:'Laço Vital',strong_ice_wave:'Semente Errante',eternal_winter:'Jardim da Vigília',
  flame_strike:'Lança de Brasa',energy_wave:'Frente Astral',rage_skies:'Céu Partido',
};
export const abilityReasons:Record<string,string> = {
  ok:'Pronta',cooldown:'Em recarga',mana:'Mana insuficiente','no-target':'Selecione um alvo',
  'invalid-target':'Alvo inválido','out-of-range':'Fora de alcance','line-of-sight':'Sem linha de visão',
  'not-enough-targets':'Poucos alvos na área',disabled:'Desativada no Helper',
  'not-started':'Inicie a hunt','actor-dead':'Personagem derrotado','session-ended':'Sessão encerrada',
};
export function iconMarkup(abilityId:string) {
  const index=abilities.findIndex(ability=>ability.id===abilityId);
  return `<span class="skill-icon" role="img" aria-label="${abilityNames[abilityId]}" style="background-image:url('${assetUrl('/assets/original/ui/ability-icons.png')}');background-position:${(index%3)*50}% ${Math.floor(index/3)*50}%"></span>`;
}
export const actionSlots = (heroId:string) => abilitiesByVocation(heroId as Vocation).map((ability,index)=>({key:String(index+1),ability}));
