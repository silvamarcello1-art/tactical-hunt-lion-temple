import { type AbilityPreferences } from '../data/abilities';
import { heroes } from '../data/config';
import { passives, type PartyProgress, type Vocation } from '../data/progression';
import type { EntitySnapshot } from '../events/types';
import {abilityCatalog} from '../data/trainingSpells';
import {assetUrl} from '../game/assetUrl';

import { abilityReasons, iconMarkup, actionSlots } from '../data/actionBar';
// Keep DOM identity and avoid invalidating layout/trace snapshots for values
// that did not change. These helpers never change the update cadence or data.
function text(element:Element,value:string) { if(element.textContent!==value)element.textContent=value; }
function attribute(element:Element,name:string,value:string) { if(element.getAttribute(name)!==value)element.setAttribute(name,value); }
function style(element:HTMLElement,name:string,value:string) { if(element.style.getPropertyValue(name)!==value)element.style.setProperty(name,value); }
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
      card.classList.toggle('defeated',!entity.alive);attribute(card,'data-alive',String(entity.alive));
      style(card.querySelector<HTMLElement>('.hp i')!,'width',`${Math.max(0,entity.hp/entity.maxHp)*100}%`);
      style(card.querySelector<HTMLElement>('.mp i')!,'width',`${Math.max(0,entity.mana/entity.maxMana)*100}%`);
      text(card.querySelector('.hero-vitals')!,`HP ${Math.ceil(entity.hp)}/${entity.maxHp} · MP ${Math.ceil(entity.mana)}/${entity.maxMana}`);
      style(card.querySelector<HTMLElement>('.hp i')!,'background',entity.hp/entity.maxHp<=.3?'#e27765':entity.hp/entity.maxHp<=.6?'#d4ba64':'var(--hp)');
      attribute(card.querySelector('.hp')!,'aria-label',`Vida ${Math.ceil(entity.hp)} de ${entity.maxHp}`);
      attribute(card.querySelector('.mp')!,'aria-label',`Mana ${Math.ceil(entity.mana)} de ${entity.maxMana}`);
      text(card.querySelector('.hero-level')!,`Lv. ${progress[hero.id]?.level??1}`);
      const mode=card.querySelector<HTMLElement>('.hero-mode')!;
      text(mode,entity.alive?({AI:'AUTO',MANUAL:'MANUAL',ASSISTED:'ASSISTIDO'}[modeOf(hero.id)]??'AUTO'):'KO');
      attribute(mode,'title',entity.alive?modeOf(hero.id).replace('AI','AUTO'):'Derrotado');
      attribute(card,'data-control-mode',modeOf(hero.id));
    }
    const current=progress[selected];
    text(document.querySelector('#xp-label')!,current?`Lv. ${current.level} · ${current.xp} / ${current.xpToNextLevel || 'MAX'} XP`:'Lv. 1');
    style(document.querySelector<HTMLElement>('#xp-fill')!,'width',`${current?current.xpToNextLevel?current.xp/current.xpToNextLevel*100:100:0}%`);
    const passive=passives.find(p=>p.vocation===selected)!;
    const unlocked=(current?.level??1)>=passive.unlockLevel;
    text(document.querySelector('#passive-state')!,unlocked?'ATIVA':`Lv. ${passive.unlockLevel}`);
    document.querySelector('#passives')!.classList.toggle('locked',!unlocked);
    if(this.training&&['druid','sorcerer'].includes(selected)){
      const root=document.querySelector<HTMLElement>('#passives')!;root.classList.remove('locked');text(root.querySelector('b')!,'Mana Buffer');text(root.querySelector('small')!,'Dano letal excedente → mana ×8; custo extra de 25% a cada 2s.');text(root.querySelector('#passive-state')!,'TREINO');
    }
  }
  availability(statusOf:(abilityId:string)=>{ready:boolean;reason:string;remaining:number},castingId?:string) {
    document.querySelectorAll<HTMLButtonElement>('#action-bar [data-ability]').forEach(button=>{
      const id=button.dataset.ability!;const state=statusOf(id);
      button.disabled=['not-started','actor-dead','session-ended'].includes(state.reason);
      attribute(button,'data-unavailable-reason',state.reason);button.classList.toggle('casting',id===castingId);
      const a=abilityCatalog(this.training).find(a=>a.id===id)!;
      attribute(button,'title',`${a.name} · ${a.words} · Tecla ${button.dataset.hotkey} · ${abilityReasons[state.reason]??state.reason}${state.remaining>0?` (${Math.ceil(state.remaining/1000)}s)`:''} · ${a.targetRule==='ally-only'?'Outro aliado; nunca você':a.group==='healing'?'Padrão: você; Shift permite aliado':'Alvo selecionado / área'} · Shift + tecla: escolher alvo`);
      text(button.querySelector('.ability-reason')!,state.reason==='ok'?'':abilityReasons[state.reason]??state.reason);
    });
  }
}
