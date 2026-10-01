import { EquipmentStore, bagSize } from '../app/EquipmentStore';
import { effectiveStats, itemModifiers, statKeys, type ItemInstance } from '../combat/Equipment';
import { heroes } from '../data/config';
import { itemById, EQUIPMENT_RULES, type ItemStat, type EquipmentSlot } from '../data/items';
import type { PartyProgress, Vocation } from '../data/progression';
import { itemIcon } from './ItemIcons';

const labels:Record<ItemStat,string>={attack:'Ataque',magicPower:'Poder mágico / cura',defense:'Defesa',maxHp:'HP máximo',maxMana:'Mana máxima'};
const rarity={common:'Comum',uncommon:'Incomum',rare:'Raro'};
export const itemName=(item:ItemInstance)=>`${itemById(item.definitionId)!.name}${item.upgrade?' +1':''}`;
export class EquipmentPanel {
  private selected?:string;
  private hero:Vocation='knight';
  private message='';
  constructor(private root:HTMLElement,private store:EquipmentStore,private context:()=>{hero:Vocation;progress:PartyProgress;allowed:boolean},private onHero:(hero:Vocation)=>void,private onChange:()=>void) {
    root.addEventListener('click',event=>{
      const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button || button.disabled) return;
      const {allowed}=this.context();
      if(button.dataset.equipmentHero) {this.onHero(button.dataset.equipmentHero as Vocation);return;}
      if(button.dataset.itemId) this.selected=button.dataset.itemId;
      if(button.dataset.unequip) this.message=store.unequip(this.hero,button.dataset.unequip as EquipmentSlot,allowed);
      if(button.dataset.action==='equip' && this.selected) this.message=store.equip(this.hero,this.selected,allowed);
      if(button.dataset.action==='forge' && this.selected) this.message=store.forge(this.selected,allowed);
      if(button.dataset.action==='claim') this.message=store.claim();
      if(button.dataset.action==='retry') {store.retry();this.message=store.warning||'Recompensas salvas.';}
      if(button.dataset.action==='export') {
        const blob=new Blob([store.rawSave()??'{}'],{type:'application/json'});const url=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=url;a.download='tactical-hunt-equipment-recovery.json';a.click();URL.revokeObjectURL(url);
      }
      this.onChange();this.render();
    });
  }
  focusItem(id?:string){this.selected=id;this.render();}
  render() {
    const context=this.context();this.hero=context.hero;
    const state=this.store.snapshot(),loadout=this.store.loadout();const hero=heroes.find(hero=>hero.id===this.hero)!;
    const stats=effectiveStats(hero,context.progress[this.hero],loadout);
    const selected=state.items.find(item=>item.id===this.selected);
    const def=selected && itemById(selected.definitionId)!;
    const equippedBy=(id:string)=>Object.entries(state.equipment).find(([,slots])=>Object.values(slots).includes(id))?.[0];
    const canEquip=def && def.slot!=='material' && def.vocations.includes(this.hero) && !equippedBy(selected!.id);
    let comparison='Selecione um item para comparar e forjar.';
    if(selected && def) {
      const current=def.slot==='material'?undefined:loadout[this.hero]?.[def.slot];
      const candidate=structuredClone(loadout);
      if(def.slot!=='material') (candidate[this.hero]??={})[def.slot]=selected;
      const projected=effectiveStats(hero,context.progress[this.hero],candidate);
      const quote=this.store.forgeQuote(selected.id,context.allowed);
      comparison=`<h3>${itemName(selected)}</h3><p>${def.description}</p><p>Atual: ${current?itemName(current):'Sem item neste slot'}</p>
        <div class="comparison-stats">${statKeys.map(stat=>{const delta=projected[stat]-stats[stat];return `<span>${labels[stat]}</span><b>${stats[stat].toFixed(0)} → ${projected[stat].toFixed(0)}</b><em class="${delta<0?'loss':'gain'}">${delta>0?'+':''}${delta.toFixed(0)}</em>`;}).join('')}</div>
        <p>${def.vocations.includes(this.hero)?equippedBy(selected.id)?'Equipado: '+equippedBy(selected.id):'Compatível com '+hero.name:'Restrito a '+def.vocations.join(', ')}</p>
        <button data-action="equip" ${context.allowed&&canEquip&&!this.store.blocked?'':'disabled'}>Equipar em ${hero.name}</button>
        <section class="forge-preview"><h3>Forja +1 · sem falha</h3><p>${quote.gold} ouro · ${quote.required} Brasa (disponível: ${quote.material})</p>
        <p>Ganho da melhoria: ${Object.entries(quote.improvement).map(([key,n])=>`+${n} ${labels[key as ItemStat]}`).join(' · ')||'Não aplicável'}</p>
        <button data-action="forge" ${quote.reason?'disabled':''}>Forjar +1</button><small>${quote.reason||'Consumo e melhoria salvos juntos. Efeito na próxima hunt.'}</small></section>`;
    }
    this.root.innerHTML=`<h2>Equipamento · ${hero.name}</h2><div class="equipment-heroes">${heroes.map(hero=>`<button data-equipment-hero="${hero.id}" aria-pressed="${hero.id===this.hero}">${hero.name}</button>`).join('')}</div>
      <p class="equipment-policy">${context.allowed?'Entre hunts: compare, equipe e melhore.':'Somente consulta. Termine a hunt e desligue Loop para alterar.'}</p>
      <p class="equipment-warning" role="status">${this.store.warning||this.message}</p>${this.store.warning?'<button data-action="export">Exportar save original e pendências</button><button data-action="retry">Tentar salvar novamente</button>':''}
      <div class="equipment-slots">${(['weapon','armor'] as const).map(slot=>{const item=loadout[this.hero]?.[slot];return `<section><small>${slot==='weapon'?'ARMA':'ARMADURA'}</small><b>${item?itemName(item):'Sem equipamento'}</b>${item?`<button data-unequip="${slot}" ${context.allowed?'':'disabled'}>Desequipar ${slot==='weapon'?'arma':'armadura'}</button>`:''}</section>`;}).join('')}</div>
      <details open><summary>Stats efetivos · próxima hunt</summary><dl class="effective-stats">${statKeys.map(stat=>`<div><dt>${labels[stat]}</dt><dd data-stat="${stat}">${stats[stat].toFixed(0)}</dd></div>`).join('')}</dl></details>
      <header class="bag-heading"><h3>Inventário <small>${bagSize(state)} / ${EQUIPMENT_RULES.capacity}</small></h3><b id="inventory-gold">${state.gold} ouro</b></header>
      <p>Materiais: pilhas de ${EQUIPMENT_RULES.materialStack}. Equipados não ocupam a mochila.</p>
      <div class="item-list">${state.items.map(item=>{const def=itemById(item.definitionId)!;return `<button class="item-row ${item.id===this.selected?'selected':''} ${def.rarity}" data-item-id="${item.id}" data-definition="${item.definitionId}">${itemIcon(def.icon)}<span><b>${itemName(item)}</b><small>${rarity[def.rarity]} · ${def.slot==='material'?'Material ×'+item.quantity:def.vocations.join(' / ')}</small><small>${Object.entries(itemModifiers(item)).filter(([,n])=>n).map(([key,n])=>`${n!>0?'+':''}${n} ${labels[key as ItemStat]}`).join(' · ')}</small></span>${equippedBy(item.id)?'<em>Equipado</em>':''}</button>`;}).join('')||'<p class="empty-inventory">Derrote o Regente para obter armas, armadura e brasas.</p>'}</div>
      <details ${state.inbox.length?'open':''}><summary>Reserva de recompensas · ${state.inbox.length}</summary><p>Inventário cheio: nada é descartado. Equipe itens para liberar espaço.</p>${state.inbox.map(item=>`<p>${item.quantity}× ${itemName(item)}</p>`).join('')}<button data-action="claim" ${state.inbox.length?'':'disabled'}>Receber reserva</button></details>
      <section id="item-comparison" aria-label="Comparação e forja">${comparison}</section>`;
  }
}
