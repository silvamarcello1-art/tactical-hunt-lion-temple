import { describe,it,expect } from 'vitest';
import { EquipmentStore,EQUIPMENT_KEY,bagSize } from './EquipmentStore';
import { EquipmentDrops } from '../combat/EquipmentDrops';
import { effectiveStats,applyEffectiveStats,type ItemInstance } from '../combat/Equipment';
import { heroes } from '../data/config';
import { progressFromTotal } from '../combat/Progression';
import { ProgressionStore } from './ProgressionStore';
import { CombatEngine } from '../combat/CombatEngine';
import type { CombatEvent } from '../events/types';

const memory=()=>{const data=new Map<string,string>();return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};};
const item=(id='a',definitionId='iron-edge',quantity=1):ItemInstance=>({id,definitionId,quantity,upgrade:0});
const drop=(instance=item(),id=instance.id):CombatEvent=>({id,time:0,floor:1,type:'equipment_drop',data:{equipment:instance}});
const gold=(quantity=500):CombatEvent=>({id:'gold',time:0,floor:1,type:'loot',data:{item:'Gold coin',quantity}});
const fresh=()=>Object.fromEntries(heroes.map(hero=>[hero.id,progressFromTotal(0)]));
describe('equipment domain and persistence',()=>{
  it('deterministic drops have per-session unique IDs and guaranteed boss choices',()=>{
    const a=new EquipmentDrops(803,'session'),b=new EquipmentDrops(803,'session');
    const first=a.forKill('boss',true);expect(first).toEqual(b.forKill('boss',true));
    expect(first).toHaveLength(5);expect(new Set(first.map(i=>i.id)).size).toBe(5);
    expect(new EquipmentDrops(803,'other').forKill('boss',true)[0].id).not.toBe(first[0].id);
    expect(first.at(-1)).toMatchObject({definitionId:'temple-ember',quantity:3});
  });
  it('replay and reload do not duplicate instances or gold, even after spending',()=>{
    const storage=memory(),s=new EquipmentStore(storage);
    expect(s.apply(drop(),'s')).toBe(true);expect(s.apply(drop(),'s')).toBe(false);
    s.apply(gold(),'s');s.apply(drop(item('m','temple-ember',3)),'s');s.forge('a',true);
    const reload=new EquipmentStore(storage);expect(reload.apply(gold(),'s')).toBe(false);
    expect(reload.snapshot().gold).toBe(300);expect(reload.snapshot().items.find(i=>i.id==='a')?.upgrade).toBe(1);
  });
  it('session identity makes every weapon alternative obtainable without changing encounter seed',()=>{
    const obtained=new Set<string>();
    for(let session=0;session<64;session++) {
      const drops=new EquipmentDrops(803,`hunt-${session}`).forKill('boss',true);
      drops.forEach(item=>obtained.add(item.definitionId));
    }
    for(const definition of ['iron-edge','ward-hammer','root-staff','moss-focus','prism-rod','echo-focus']) expect(obtained.has(definition)).toBe(true);
  });
  it('capacity and overflow preserve every reward and equipped items release bag space',()=>{
    const s=new EquipmentStore(memory());for(let i=0;i<26;i++) s.apply(drop(item('item'+i)),'s');
    expect(bagSize(s.snapshot())).toBe(24);expect(s.snapshot().inbox).toHaveLength(2);
    s.equip('knight','item0',true);s.claim();expect(bagSize(s.snapshot())).toBe(24);expect(s.snapshot().inbox).toHaveLength(1);
    expect(s.unequip('knight','weapon',true)).toContain('cheio');
    expect(s.loadout().knight?.weapon?.id).toBe('item0');
    expect(s.snapshot().items.length+s.snapshot().inbox.length).toBe(26);
  });
  it('materials stack to 99 then retain remainder, including overflow',()=>{
    const s=new EquipmentStore(memory());s.apply(drop(item('m1','temple-ember',98)),'s');s.apply(drop(item('m2','temple-ember',5)),'s');
    expect(s.snapshot().items.map(i=>i.quantity)).toEqual([99,4]);
    expect(s.apply(drop(item('m2','temple-ember',5),'new-event-id'),'s')).toBe(false);
    expect(s.snapshot().items.map(i=>i.quantity)).toEqual([99,4]);
    expect(s.apply(drop(item('bad','temple-ember',100)),'s')).toBe(false);
  });
  it('enforces vocation, unique ownership, slots and between-hunt policy',()=>{
    const s=new EquipmentStore(memory());s.apply(drop(),'s');s.apply(drop(item('armor','iron-coat')),'s');
    expect(s.equip('druid','a',true)).toContain('incompatível');
    expect(s.equip('knight','a',false)).toContain('entre hunts');
    s.equip('knight','a',true);expect(s.loadout().knight?.weapon?.id).toBe('a');
    s.equip('druid','armor',true);expect(s.equip('knight','armor',true)).toContain('outro herói');
    s.unequip('druid','armor',true);s.equip('knight','armor',true);expect(s.loadout().knight?.armor?.id).toBe('armor');
  });
  it('swap/repeated equip does not accumulate bonuses; comparisons share canonical calculation',()=>{
    const s=new EquipmentStore(memory());s.apply(drop(),'s');s.apply(drop(item('b','ward-hammer')),'s');
    const base=effectiveStats(heroes[0]);
    for(let i=0;i<15;i++){s.equip('knight','a',true);s.equip('knight','a',true);expect(effectiveStats(heroes[0],undefined,s.loadout()).attack).toBe(base.attack+22);s.unequip('knight','weapon',true);}
    expect(effectiveStats(heroes[0],undefined,s.loadout())).toEqual(base);
    s.equip('knight','a',true);s.equip('knight','b',true);
    expect(effectiveStats(heroes[0],undefined,s.loadout())).toMatchObject({attack:base.attack+10,defense:base.defense+9});
  });
  it('maximum changes never refill HP or mana, and reductions clamp',()=>{
    const entity=structuredClone(heroes[1]);entity.hp=100;entity.mana=100;
    const boosted=effectiveStats(heroes[1],undefined,{druid:{weapon:item('m','moss-focus'),armor:item('a','iron-coat')}});
    for(let i=0;i<20;i++){applyEffectiveStats(entity,boosted);applyEffectiveStats(entity,effectiveStats(heroes[1]));}
    expect(entity.hp).toBe(100);expect(entity.mana).toBe(100);
    entity.hp=boosted.maxHp;entity.mana=boosted.maxMana;applyEffectiveStats(entity,effectiveStats(heroes[1]));
    expect(entity.hp).toBe(heroes[1].maxHp);expect(entity.mana).toBe(heroes[1].maxMana);
  });
  it('forge validates, consumes atomically, caps at +1 and rejects double click',()=>{
    const s=new EquipmentStore(memory());s.apply(drop(),'s');
    expect(s.forge('a',true)).toContain('Ouro');s.apply(gold(),'s');expect(s.forge('a',true)).toContain('Brasa');
    s.apply(drop(item('m','temple-ember',3)),'s');expect(s.forge('a',false)).toContain('entre hunts');
    expect(s.forge('a',true)).toContain('aplicada');const state=s.snapshot();
    expect(s.forge('a',true)).toContain('já aplicada');expect(s.snapshot()).toEqual(state);
    expect(state.gold).toBe(300);expect(state.items.find(i=>i.id==='m')?.quantity).toBe(2);
  });
  it('storage failure rolls back a forge and keeps reward retries exportable',()=>{
    const storage=memory();const s=new EquipmentStore(storage);s.apply(drop(),'s');s.apply(gold(),'s');s.apply(drop(item('m','temple-ember',3)),'s');
    const state=s.snapshot(),write=storage.setItem;storage.setItem=()=>{throw Error('quota');};
    expect(s.forge('a',true)).toContain('Não foi possível');expect(s.snapshot()).toEqual(state);
    s.apply(drop(item('new','iron-coat')),'s');expect(s.pendingCount).toBe(1);expect(s.rawSave()).toContain('new');
    storage.setItem=write;
    expect(s.claim()).toContain('Não foi possível');expect(s.forge('a',true)).toContain('Não foi possível');
    expect(s.snapshot()).toEqual(state);expect(s.pendingCount).toBe(1);
    s.retry();expect(s.pendingCount).toBe(0);expect(s.snapshot().items.some(i=>i.id==='new')).toBe(true);
    s.forge('a',true);expect(s.snapshot().gold).toBe(300);
  });
  it('additive migration preserves XP, levels, preferences and legacy balances',()=>{
    const storage=memory();storage.setItem('tactical-hunt-progression-v1',JSON.stringify({version:1,heroes:{knight:{totalXp:1175}}}));
    storage.setItem('tactical-hunt-currency','{"bossToken":7,"rewardKeys":["old"]}');storage.setItem('tactical-hunt-ability-preferences','{"old":true}');
    const prior=[...storage.data];const s=new EquipmentStore(storage);s.apply(drop(),'s');
    expect(new ProgressionStore(storage).snapshot().knight.level).toBe(3);
    for(const [key,value] of prior) expect(storage.getItem(key)).toBe(value);
  });
  it('corrupt saves are quarantined without overwriting the original',()=>{
    for(const raw of ['{bad',JSON.stringify({version:99}),JSON.stringify({version:2,gold:-1})]) {
      const storage=memory();storage.setItem(EQUIPMENT_KEY,raw);const s=new EquipmentStore(storage);
      expect(s.blocked).toBe(true);expect(s.warning).toContain('Original preservado');s.apply(drop(),'s');expect(storage.getItem(EQUIPMENT_KEY)).toBe(raw);
    }
    const storage=memory();storage.setItem('tactical-hunt-progression-v1','{broken');
    const progress=new ProgressionStore(storage);expect(progress.blocked).toBe(true);expect(progress.warning).toContain('preservado');
    expect(progress.apply({type:'hero_experience',targetId:'knight',data:{progress:progressFromTotal(500)}} as CombatEvent)).toBe(false);
    expect(storage.getItem('tactical-hunt-progression-v1')).toBe('{broken');
  });
  it('rejects forged quantities, IDs and incompatible equipped saves; ignores derived stats',()=>{
    const storage=memory();const s=new EquipmentStore(storage);s.apply(drop(),'s');
    const valid=s.snapshot();(valid.items[0] as any).modifiers={attack:999999};storage.setItem(EQUIPMENT_KEY,JSON.stringify(valid));
    const loaded=new EquipmentStore(storage);expect(loaded.blocked).toBe(false);loaded.equip('knight','a',true);expect(effectiveStats(heroes[0],undefined,loaded.loadout()).attack).toBe(150);
    for(const mutate of [(x:any)=>x.items[0].id='<script>',(x:any)=>x.items[0].quantity=2,(x:any)=>x.items.push(x.items[0]),(x:any)=>x.equipment={druid:{weapon:'a'}},(x:any)=>x.items[0].definitionId='unknown']){
      const copy=structuredClone(valid);mutate(copy);storage.setItem(EQUIPMENT_KEY,JSON.stringify(copy));expect(new EquipmentStore(storage).blocked).toBe(true);
    }
  });
  it('detects another tab before writing over its progress',()=>{
    const storage=memory();const a=new EquipmentStore(storage),b=new EquipmentStore(storage);
    a.apply(drop(),'a');expect(b.apply(gold(),'b')).toBe(false);expect(b.blocked).toBe(true);expect(new EquipmentStore(storage).snapshot().items).toHaveLength(1);
  });
  it('gear changes actual attacks/casts and defense without changing naked baseline',()=>{
    const base=new CombatEngine(803,undefined,'s',fresh());base.advanceTo(2000);
    const loadout={knight:{weapon:item()},druid:{weapon:item('d','root-staff')},sorcerer:{armor:item('a','iron-coat')}};
    const equipped=new CombatEngine(803,undefined,'s',fresh(),loadout,true);equipped.advanceTo(2000);
    const hero=(engine:CombatEngine,id:string)=>engine.entities.find(e=>e.id===id)!;
    expect(hero(equipped,'knight').attack).toBe(hero(base,'knight').attack+22);
    expect(hero(equipped,'druid').magicPower).toBe(hero(base,'druid').magicPower!+25);
    expect(hero(equipped,'sorcerer').defense).toBe(hero(base,'sorcerer').defense+10);
    expect(equipped.result.damage.knight).toBeGreaterThan(base.result.damage.knight);
    expect(equipped.configureLoadout({})).toBe(false);
  });
  it('new reward rolls do not alter combat outcome or random numbers without gear',()=>{
    const a=new CombatEngine(803,undefined,'s',fresh()).run(),b=new CombatEngine(803,undefined,'s',fresh(),{},true).run();
    expect(b.damage).toEqual(a.damage);expect(b.duration).toBe(a.duration);expect(b.gold).toBe(a.gold);expect(b.healing).toBe(a.healing);
    expect(b.events.filter(e=>e.type==='equipment_drop').length).toBeGreaterThanOrEqual(5);
    for(const e of b.events.filter(e=>e.type==='equipment_drop')) expect(b.events.some(d=>d.type==='death'&&d.targetId===e.sourceId&&d.time<=e.time)).toBe(true);
  },15000);
});
