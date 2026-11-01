import { type AbilityPreferences } from '../data/abilities';
import { heroes } from '../data/config';
import { passives, type PartyProgress, type Vocation } from '../data/progression';
import type { EntitySnapshot } from '../events/types';
import {abilityCatalog} from '../data/trainingSpells';
import {assetUrl} from '../game/assetUrl';

import { abilityReasons, iconMarkup, actionSlots } from '../data/actionBar';
/** Screen-space DOM only. No renderer, transforms or entity display objects. */
export class GameplayHUD {
  constructor(private training=false){}
  renderParty(selected:string) {
    document.querySelector('#party')!.innerHTML=heroes.map(hero=>`<button class="hero-card ${hero.id===selected?'selected':''}" id="card-${hero.id}" data-hero-id="${hero.id}" aria-pressed="${hero.id===selected}" aria-label="Selecionar ${hero.name}">
      <span class="portrait vocation-mark" style="background-image:url('${assetUrl(`/assets/original/pixel/${hero.id}-v1.png`)}')" aria-hidden="true"></span>
      <span class="hero-title"><b>${hero.name}</b><small class="hero-level">Lv. 1</small></span>
      <span class="vocation">${hero.role}</span><span class="hero-mode">AUTO</span>
      <span class="bar hp"><i></i></span><span class="bar mp"><i></i></span>
      <span class="hero-vitals"></span></button>`).join('');
  }
  renderActions(selected:string,preferences:AbilityPreferences) {
    const hero=heroes.find(hero=>hero.id===selected)!;
    document.querySelector('#selected-hero-name')!.textContent=hero.name;
    document.querySelector('#selected-hero-vocation')!.textContent=hero.role;
    document.querySelector('#action-bar')!.innerHTML=actionSlots(selected,this.training).map(({key,ability})=>`<button class="action" data-ability="${ability.id}" data-hotkey="${key}" data-action-slot="${key}" data-category="spell" data-hero="${selected}" aria-label="${ability.name}" title="${ability.name}">
      ${iconMarkup(ability.id,this.training)}<kbd>${key}</kbd><span class="ability-name">${ability.name}</span>
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
      card.querySelector('.hero-vitals')!.textContent=`HP ${Math.ceil(entity.hp)}/${entity.maxHp} · MP ${Math.ceil(entity.mana)}/${entity.maxMana}`;
      card.querySelector<HTMLElement>('.hp i')!.style.background=entity.hp/entity.maxHp<=.3?'#e27765':entity.hp/entity.maxHp<=.6?'#d4ba64':'var(--hp)';
      card.querySelector('.hp')!.setAttribute('aria-label',`Vida ${Math.ceil(entity.hp)} de ${entity.maxHp}`);
      card.querySelector('.mp')!.setAttribute('aria-label',`Mana ${Math.ceil(entity.mana)} de ${entity.maxMana}`);
      card.querySelector('.hero-level')!.textContent=`Lv. ${progress[hero.id]?.level??1}`;
      const mode=card.querySelector<HTMLElement>('.hero-mode')!;
      mode.textContent=entity.alive?({AI:'AUTO',MANUAL:'MANUAL',ASSISTED:'ASSISTIDO'}[modeOf(hero.id)]??'AUTO'):'KO';
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
    if(this.training&&['druid','sorcerer'].includes(selected)){
      const root=document.querySelector<HTMLElement>('#passives')!;root.classList.remove('locked');root.querySelector('b')!.textContent='Mana Buffer';root.querySelector('small')!.textContent='Dano letal excedente → mana ×8; custo extra de 25% a cada 2s.';root.querySelector('#passive-state')!.textContent='TREINO';
    }
  }
  availability(statusOf:(abilityId:string)=>{ready:boolean;reason:string;remaining:number},castingId?:string) {
    document.querySelectorAll<HTMLButtonElement>('#action-bar [data-ability]').forEach(button=>{
      const id=button.dataset.ability!;const state=statusOf(id);
      button.disabled=['not-started','actor-dead','session-ended'].includes(state.reason);
      button.dataset.unavailableReason=state.reason;button.classList.toggle('casting',id===castingId);
      const a=abilityCatalog(this.training).find(a=>a.id===id)!;
      button.title=`${a.name} · ${a.words} · Tecla ${button.dataset.hotkey} · ${abilityReasons[state.reason]??state.reason}${state.remaining>0?` (${Math.ceil(state.remaining/1000)}s)`:''} · ${a.targetRule==='ally-only'?'Outro aliado; nunca você':a.group==='healing'?'Padrão: você; Shift permite aliado':'Alvo selecionado / área'} · Shift + tecla: escolher alvo`;
      button.querySelector('.ability-reason')!.textContent=state.reason==='ok'?'':abilityReasons[state.reason]??state.reason;
    });
  }
}
