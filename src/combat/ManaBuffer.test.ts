import {describe,it,expect} from 'vitest';
import {manaBuffer} from './ManaBuffer';
import {abilityCatalog} from '../data/trainingSpells';
import {CombatEngine} from './CombatEngine';
import {heroes} from '../data/config';
describe('selected training mage mechanics',()=>{
  it('runs the buffer through authoritative damage events and reports actual HP separately',()=>{
    // Isolated low-HP spawn fixture; restore shared source data even on assertion failure.
    const druid=heroes.find(h=>h.id==='druid')!,saved=structuredClone(druid);
    const result=(()=>{try{Object.assign(druid,{hp:1,dodge:0,tileX:14,tileY:9});return new CombatEngine(803,undefined,'buffer-test',undefined,{},true,true,true).run();}finally{Object.assign(druid,saved);}})();
    const buffers=result.events.filter(e=>e.type==='mana_buffer');expect(buffers.length).toBeGreaterThan(0);
    expect(buffers.some(e=>e.data?.entity?.hp===1&&e.data.entity.mana>0)).toBe(true);
    for(const event of buffers){expect(['druid','sorcerer']).toContain(event.targetId);expect(event.data?.entity?.mana).toBeGreaterThanOrEqual(0);}
    for(const e of result.events.filter(e=>e.type==='damage'&&e.data?.healthDamage!==undefined))expect(e.data!.healthDamage!).toBeLessThanOrEqual(e.data!.amount!);
    expect(result.victory).toBe(false);expect(result.bossTokens).toBe(0);
  });
  it('keeps ordinary damage and existing hunt identities untouched',()=>{
    expect(manaBuffer(100,500,1000,40,0)).toMatchObject({hp:60,mana:500,activated:false});
    expect(abilityCatalog(false).find(a=>a.id==='strong_ice_wave')!.shape).toBe('single');
    expect(abilityCatalog(true).map(a=>a.id)).toEqual(abilityCatalog(false).map(a=>a.id));
    expect(abilityCatalog(true).find(a=>a.id==='heal_friend')!.targetRule).toBe('ally-only');
    expect(abilityCatalog(true).find(a=>a.id==='strong_ice_wave')).toMatchObject({shape:'wave',cooldown:4000,words:'exevo gran frigo hur'});
  });
  it('absorbs overkill at 8 mana per HP and charges the quarter-mana surcharge only once per two seconds',()=>{
    const first=manaBuffer(100,1000,1000,110,0);expect(first).toMatchObject({hp:1,mana:670,manaSpent:330,surchargeUntil:2000});
    expect(manaBuffer(1,670,1000,11,1000,first.surchargeUntil)).toMatchObject({hp:1,mana:590,manaSpent:80});
    expect(manaBuffer(1,590,1000,11,2000,first.surchargeUntil)).toMatchObject({hp:1,mana:260,manaSpent:330,surchargeUntil:4000});
  });
  it('does not invent mana or survival when the cost exhausts mana; exact HP damage is not overkill',()=>{
    expect(manaBuffer(100,330,1000,110,0)).toMatchObject({hp:0,mana:0,activated:true});
    expect(manaBuffer(100,0,1000,110,0)).toMatchObject({hp:0,mana:0});
    expect(manaBuffer(100,1000,1000,100,0)).toMatchObject({hp:0,mana:1000,activated:false});
  });
});
