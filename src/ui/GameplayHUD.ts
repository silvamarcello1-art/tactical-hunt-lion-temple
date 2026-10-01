import { abilities, abilitiesByVocation, type AbilityPreferences } from '../data/abilities';
import { heroes } from '../data/config';
import { passives, type PartyProgress, type Vocation } from '../data/progression';
import type { EntitySnapshot } from '../events/types';
import { assetUrl } from '../game/assetUrl';

import { abilityNames, abilityReasons, iconMarkup, actionSlots } from '../data/actionBar';
/** Screen-space DOM only. No renderer, transforms or entity display objects. */
export class GameplayHUD {
  renderParty(selected:string) {
    document.querySelector('#party')!.innerHTML=heroes.map((hero,index)=>`<button class="hero-card ${hero.id===selected?'selected':''}" id="card-${hero.id}" data-hero-id="${hero.id}" aria-pressed="${hero.id===selected}" aria-label="Selecionar ${hero.name}">
      <span class="portrait vocation-mark" aria-hidden="true">${['♜','❧','✦'][index]}</span>
      <span class="hero-title"><b>${hero.name}</b><small class="hero-level">Lv. 1</small></span>
      <span class="vocation">${hero.role}</span><span class="hero-mode">AUTO</span>
      <span class="bar hp"><i></i></span><span class="bar mp"><i></i></span>
      <span class="hero-vitals"></span></button>`).join('');
  }
  renderActions(selected:string,preferences:AbilityPreferences) {
    const hero=heroes.find(hero=>hero.id===selected)!;
    document.querySelector('#selected-hero-name')!.textContent=hero.name;
    document.querySelector('#selected-hero-vocation')!.textContent=hero.role;
    document.querySelector('#action-bar')!.innerHTML=actionSlots(selected).map(({key,ability})=>`<button class="action" data-ability="${ability.id}" data-hotkey="${key}" data-hero="${selected}" aria-label="${abilityNames[ability.id]}" title="${abilityNames[ability.id]}">
      ${iconMarkup(ability.id)}<kbd>${key}</kbd><span class="ability-name">${abilityNames[ability.id]}</span>
      <em>${ability.manaCost} MP</em><span class="cooldown-mask" aria-hidden="true"></span><strong class="cooldown-number"></strong>
      <span class="ability-reason">${preferences[ability.id]?.enabled===false?'Desativada':''}</span></button>`).join('');
    const passive=passives.find(passive=>passive.vocation===selected)!;
    document.querySelector('#passives')!.innerHTML=`<span class="passive-mark" aria-hidden="true">◇</span><span><b>${passive.name}</b><small>${passive.description}</small></span><span id="passive-state">Lv. ${passive.unlockLevel}</span>`;
  }
  update(entities:readonly (EntitySnapshot & {alive:boolean})[],progress:PartyProgress,modeOf:(id:string)=>string,selected:string) {
    for(const hero of heroes) {
      const entity=entities.find(entity=>entity.id===hero.id)??{...hero,alive:true};
      const card=document.querySelector<HTMLElement>(`#card-${hero.id}`)!;
      card.classList.toggle('defeated',!entity.alive);card.dataset.alive=String(entity.alive);
      card.querySelector<HTMLElement>('.hp i')!.style.width=`${Math.max(0,entity.hp/entity.maxHp)*100}%`;
      card.querySelector<HTMLElement>('.mp i')!.style.width=`${Math.max(0,entity.mana/entity.maxMana)*100}%`;
      card.querySelector('.hero-vitals')!.textContent=`${Math.ceil(entity.hp)} / ${entity.maxHp}`;
      card.querySelector('.hero-level')!.textContent=`Lv. ${progress[hero.id]?.level??1}`;
      const mode=card.querySelector<HTMLElement>('.hero-mode')!;
      mode.textContent=entity.alive?({AI:'A',MANUAL:'M',ASSISTED:'S'}[modeOf(hero.id)]??'A'):'×';
      mode.title=entity.alive?modeOf(hero.id).replace('AI','AUTO'):'Derrotado';
      card.dataset.controlMode=modeOf(hero.id);
    }
    const current=progress[selected];
    document.querySelector('#xp-label')!.textContent=current?`Lv. ${current.level} · ${current.xp} / ${current.xpToNextLevel || 'MAX'} XP`:'Lv. 1';
    document.querySelector<HTMLElement>('#xp-fill')!.style.width=`${current?current.xpToNextLevel?current.xp/current.xpToNextLevel*100:100:0}%`;
    const passive=passives.find(p=>p.vocation===selected)!;
    const unlocked=(current?.level??1)>=passive.unlockLevel;
    document.querySelector('#passive-state')!.textContent=unlocked?'ATIVA':`Lv. ${passive.unlockLevel}`;
    document.querySelector('#passives')!.classList.toggle('locked',!unlocked);
  }
  availability(statusOf:(abilityId:string)=>{ready:boolean;reason:string;remaining:number},castingId?:string) {
    document.querySelectorAll<HTMLButtonElement>('#action-bar [data-ability]').forEach(button=>{
      const id=button.dataset.ability!;const state=statusOf(id);
      button.disabled=!state.ready && state.reason!=='no-target';
      button.dataset.unavailableReason=state.reason;button.classList.toggle('casting',id===castingId);
      button.title=`${abilityNames[id]} · ${abilityReasons[state.reason]??state.reason}${state.remaining>0?` (${Math.ceil(state.remaining/1000)}s)`:''} · ${abilities.find(a=>a.id===id)!.group==='healing'?'Aliado / você':'Inimigo / área'} · Shift + tecla: escolher alvo`;
      button.querySelector('.ability-reason')!.textContent=state.reason==='ok'?'':abilityReasons[state.reason]??state.reason;
    });
  }
}
