import { EQUIPMENT_RULES, itemById, type EquipmentSlot } from '../data/items';
import type { Vocation } from '../data/progression';
import type { CombatEvent } from '../events/types';
import type { ItemInstance, Loadout } from '../combat/Equipment';

export const EQUIPMENT_KEY='tactical-hunt-equipment-v2';
interface Save {
  version:2; gold:number; items:ItemInstance[]; inbox:ItemInstance[];
  equipment:Partial<Record<Vocation,Partial<Record<EquipmentSlot,string>>>>;
  receipts:string[];
}
type StoragePort={getItem(key:string):string|null;setItem(key:string,value:string):void};
const empty=():Save=>({version:2,gold:0,items:[],inbox:[],equipment:{},receipts:[]});
const integer=(n:unknown)=>typeof n==='number' && Number.isSafeInteger(n) && n>=0;
const roles:Vocation[]=['knight','druid','sorcerer'];
const validId=(id:unknown):id is string=>typeof id==='string' && /^[\w:.-]{1,180}$/.test(id);
const receiptOf=(event:CombatEvent,sessionId:string)=>event.type==='equipment_drop'&&event.data?.equipment?`item:${event.data.equipment.id}`:`${sessionId}:${event.id}`;
function validItem(value:ItemInstance) {
  const def=value && itemById(value.definitionId);
  return def && validId(value.id) && integer(value.quantity) && value.quantity>0 &&
    value.quantity<=(def.slot==='material'?EQUIPMENT_RULES.materialStack:1) &&
    (value.upgrade===0 || value.upgrade===1 && def.slot!=='material');
}
const equippedIds=(save:Save)=>new Set(Object.values(save.equipment).flatMap(slots=>Object.values(slots)));
export const bagSize=(save:Save)=>save.items.filter(item=>!equippedIds(save).has(item.id)).length;

/** Versioned local transaction boundary. A failed write never mutates the live save. */
export class EquipmentStore {
  private state=empty();
  private persisted:string|null=null;
  private pending=new Map<string,{event:CombatEvent;sessionId:string}>();
  warning='';
  blocked=false;
  constructor(private storage:StoragePort) {
    try {
      this.persisted=storage.getItem(EQUIPMENT_KEY);
      if(!this.persisted) return; // Additive migration: existing XP/preferences/Boss Tokens stay untouched.
      const data=JSON.parse(this.persisted) as Save;
      if(data.version!==2 || !integer(data.gold) || !Array.isArray(data.items) || !Array.isArray(data.inbox) ||
        !Array.isArray(data.receipts) || !data.receipts.every(validId) || !data.equipment ||
        ![...data.items,...data.inbox].every(validItem)) throw Error('invalid save');
      const ids=[...data.items,...data.inbox].map(item=>item.id);
      if(new Set(ids).size!==ids.length) throw Error('duplicate IDs');
      const assigned:string[]=[];
      for(const [role,slots] of Object.entries(data.equipment)) {
        if(!roles.includes(role as Vocation) || !slots || typeof slots!=='object') throw Error('invalid vocation');
        for(const [slot,id] of Object.entries(slots)) {
          const item=data.items.find(item=>item.id===id);const def=item && itemById(item.definitionId);
          if(!def || def.slot==='material' || def.slot!==slot || !def.vocations.includes(role as Vocation)) throw Error('invalid equipment');
          assigned.push(id);
        }
      }
      if(new Set(assigned).size!==assigned.length || bagSize(data)>EQUIPMENT_RULES.capacity) throw Error('invalid capacity');
      // Strip derived/unrecognized item properties instead of trusting saved modifiers.
      this.state={version:2,gold:data.gold,items:data.items.map(this.canonical),inbox:data.inbox.map(this.canonical),equipment:structuredClone(data.equipment),receipts:[...new Set(data.receipts)]};
    } catch {
      this.blocked=true;this.warning='Save de equipamento inválido ou inacessível. Original preservado; não iniciaremos novas hunts. Exporte o save para recuperação.';
    }
  }
  private canonical(item:ItemInstance):ItemInstance {return {id:item.id,definitionId:item.definitionId,quantity:item.quantity,upgrade:item.upgrade};}
  snapshot(){return structuredClone(this.state);}
  rawSave(){return JSON.stringify({original:this.persisted,pending:[...this.pending.values()]});}
  get pendingCount(){return this.pending.size;}
  loadout():Loadout {
    const result:Loadout={};
    for(const role of roles) for(const slot of ['weapon','armor'] as const) {
      const item=this.state.items.find(item=>item.id===this.state.equipment[role]?.[slot]);
      if(item) (result[role]??={})[slot]=structuredClone(item);
    }
    return result;
  }
  private commit(next:Save) {
    if(this.blocked) return false;
    try {
      if(this.storage.getItem(EQUIPMENT_KEY)!==this.persisted) {
        this.blocked=true;this.warning='Save alterado em outra aba. Recarregue antes de continuar.';return false;
      }
      const raw=JSON.stringify(next);this.storage.setItem(EQUIPMENT_KEY,raw);
      this.persisted=raw;this.state=next;this.warning='';return true;
    } catch {this.warning='Não foi possível salvar. Operação não aplicada; libere espaço e tente novamente.';return false;}
  }
  private deposit(save:Save,item:ItemInstance) {
    const def=itemById(item.definitionId)!;
    if(def.slot==='material') {
      for(const stack of save.items.filter(stack=>stack.definitionId===item.definitionId)) {
        const amount=Math.min(EQUIPMENT_RULES.materialStack-stack.quantity,item.quantity);
        stack.quantity+=amount;item.quantity-=amount;
      }
    }
    if(item.quantity) (bagSize(save)<EQUIPMENT_RULES.capacity?save.items:save.inbox).push(item);
  }
  apply(event:CombatEvent,sessionId:string) {
    if(event.type!=='equipment_drop' && !(event.type==='loot'&&event.data?.item==='Gold coin')) return false;
    const receipt=receiptOf(event,sessionId);
    if(this.state.receipts.includes(receipt)) return false;
    this.pending.set(receipt,{event:structuredClone(event),sessionId});
    return this.retry();
  }
  retry() {
    if(this.blocked) return false;
    let changed=false;
    for(const [id,{event,sessionId}] of this.pending) {
      if(this.applyNow(event,sessionId)) {changed=true;this.pending.delete(id);}
      else if(this.warning) break;
      else this.pending.delete(id); // Invalid/replayed event does not become a reward.
    }
    return changed;
  }
  private applyNow(event:CombatEvent,sessionId:string) {
    const gold=event.type==='loot' && event.data?.item==='Gold coin'?event.data.quantity:undefined;
    const drop=event.type==='equipment_drop'?event.data?.equipment:undefined;
    if(gold===undefined && !drop) return false;
    if(gold!==undefined && (!integer(gold)||gold<=0) || drop && !validItem(drop)) return false;
    const receipt=receiptOf(event,sessionId);
    if(!validId(receipt) || this.state.receipts.includes(receipt) || drop && [...this.state.items,...this.state.inbox].some(item=>item.id===drop.id)) return false;
    const next=this.snapshot();
    if(gold!==undefined) {if(!Number.isSafeInteger(next.gold+gold)) return false;next.gold+=gold;}
    if(drop) this.deposit(next,this.canonical(drop));
    next.receipts.push(receipt);return this.commit(next);
  }
  equip(hero:Vocation,id:string,allowed:boolean):string {
    if(this.blocked || this.pending.size) return this.warning || 'Salve as recompensas pendentes primeiro.';
    if(!allowed) return 'Equipamento só pode mudar entre hunts, com Loop OFF.';
    if(!roles.includes(hero)) return 'Herói inválido.';
    const item=this.state.items.find(item=>item.id===id);const def=item && itemById(item.definitionId);
    if(!def || def.slot==='material' || !def.vocations.includes(hero)) return 'Vocação incompatível ou item indisponível.';
    const next=this.snapshot();const current=next.equipment[hero]?.[def.slot];
    if(current===id) return 'Já equipado.';
    if(equippedIds(next).has(id)) return 'Equipado por outro herói; desequipe primeiro.';
    (next.equipment[hero]??={})[def.slot]=id;
    return this.commit(next)?'Equipado. Efeito na próxima hunt.':this.warning;
  }
  unequip(hero:Vocation,slot:EquipmentSlot,allowed:boolean):string {
    if(this.blocked || this.pending.size) return this.warning || 'Salve as recompensas pendentes primeiro.';
    if(!allowed) return 'Equipamento só pode mudar entre hunts, com Loop OFF.';
    if(!this.state.equipment[hero]?.[slot]) return 'Slot vazio.';
    if(bagSize(this.state)>=EQUIPMENT_RULES.capacity) return 'Inventário cheio; o item continua equipado.';
    const next=this.snapshot();delete next.equipment[hero]![slot];
    return this.commit(next)?'Desequipado.':this.warning;
  }
  forgeQuote(id:string,allowed:boolean) {
    const item=this.state.items.find(item=>item.id===id);const def=item && itemById(item.definitionId);
    const material=this.state.items.filter(i=>i.definitionId==='temple-ember').reduce((n,i)=>n+i.quantity,0);
    const reason=this.blocked||this.pending.size?this.warning:!allowed?'Forja somente entre hunts, com Loop OFF.':!def||def.slot==='material'?'Escolha um equipamento.':item!.upgrade===1?'Melhoria +1 já aplicada.':this.state.gold<EQUIPMENT_RULES.forgeGold?'Ouro insuficiente.':material<EQUIPMENT_RULES.forgeMaterial?'Brasa insuficiente.':'';
    return {reason,gold:EQUIPMENT_RULES.forgeGold,material,required:EQUIPMENT_RULES.forgeMaterial,improvement:def?.improvement??{}};
  }
  forge(id:string,allowed:boolean):string {
    if(this.blocked || this.pending.size) return this.warning || 'Salve as recompensas pendentes primeiro.';
    const quote=this.forgeQuote(id,allowed);if(quote.reason) return quote.reason;
    const next=this.snapshot();next.gold-=quote.gold;
    const stack=next.items.find(i=>i.definitionId==='temple-ember')!;stack.quantity-=quote.required;
    next.items=next.items.filter(i=>i.quantity>0);next.items.find(i=>i.id===id)!.upgrade=1;
    // Upgrade is the persistent idempotency guard: retry cannot charge a +1 twice.
    return this.commit(next)?'Melhoria +1 aplicada.':this.warning;
  }
  claim():string {
    if(this.blocked || this.pending.size) return this.warning || 'Salve as recompensas pendentes primeiro.';
    const next=this.snapshot();const pending=next.inbox;next.inbox=[];
    for(const item of pending) this.deposit(next,item);
    return this.commit(next)?`${pending.length-next.inbox.length} recompensas recebidas; ${next.inbox.length} em reserva.`:this.warning;
  }
}
