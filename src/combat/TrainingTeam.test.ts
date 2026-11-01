import {describe,it,expect} from 'vitest';
import {CombatEngine} from './CombatEngine';
import {weakestTrainingTarget} from '../data/training';
import type {PlayerIntent} from '../control/PlayerCommand';
import {abilityCatalog} from '../data/trainingSpells';
const setup=(seed=803)=>{
  const engine=new CombatEngine(seed,undefined,'team-test',undefined,{},true,true,true,{singleHeroControl:true,trainingTeam:true});let sequence=0;
  const send=(actorId:string,intent:PlayerIntent)=>engine.submit({commandId:`team-${++sequence}`,sessionId:engine.id,actorId,ownerId:'local-player',sequence,logicalTick:engine.time,intent});
  return {engine,send};
};
describe('three-opponent training and exclusive local control',()=>{
  it('makes every yellow floor tile accessible, including former margins and the widened right edge',()=>{
    const {engine,send}=setup();engine.advanceTo(0);
    expect(engine.arenaView).toMatchObject({columns:36,rows:18,width:1152,x:-16,y:-16});
    send('knight',{type:'move-to',tile:{x:0,y:0}});engine.advanceTo(5000);
    expect(engine.entities.find(e=>e.id==='knight')).toMatchObject({tileX:0,tileY:0});
    expect(engine.runePreview('knight','magic_wall',{x:35,y:17}).reason).toBe('out-of-range');
    expect(engine.runePreview('knight','magic_wall',{x:36,y:17}).reason).toBe('invalid-destination');
    expect(engine.runePreview('knight','magic_wall',{x:1,y:0}).ready).toBe(true);
    send('knight',{type:'rune',runeId:'magic_wall',tile:{x:1,y:0}});engine.advanceTo(5250);
    expect(engine.runeTiles.some(r=>r.tile.x===1&&r.tile.y===0)).toBe(true);
  });
  it('starts with only Knight controlled; selecting and releasing any hero is atomic before or during combat',()=>{
    const {engine,send}=setup();
    expect(['knight','druid','sorcerer'].map(id=>engine.controlOf(id).mode)).toEqual(['MANUAL','AI','AI']);
    send('druid',{type:'control',mode:'ASSISTED'});
    expect(['knight','druid','sorcerer'].map(id=>engine.controlOf(id).mode)).toEqual(['AI','ASSISTED','AI']);
    engine.advanceTo(0);send('sorcerer',{type:'control',mode:'MANUAL'});engine.advanceTo(250);
    expect(['knight','druid','sorcerer'].map(id=>engine.controlOf(id).mode)).toEqual(['AI','AI','MANUAL']);
    send('sorcerer',{type:'control',mode:'AI'});
    expect(['knight','druid','sorcerer'].every(id=>engine.controlOf(id).mode==='AI')).toBe(true);
    expect(engine.time).toBe(250); // Configuration never advances the combat clock.
  });
  it('rejects a queued order for the old actor after a selection in the same decision; never steals control back',()=>{
    const {engine,send}=setup();engine.advanceTo(0);
    send('knight',{type:'move',dx:-1,dy:0});send('druid',{type:'control',mode:'MANUAL'});engine.advanceTo(250);
    expect(engine.controlResults.some(r=>r.reason==='not-selected')).toBe(true);
    expect(engine.controlOf('knight').mode).toBe('AI');expect(engine.controlOf('druid').mode).toBe('MANUAL');
    expect(send('training-sparring',{type:'control',mode:'MANUAL'}).reason).toBe('ownership');
  });
  it('targets lowest health percentage, excludes dead actors and uses deterministic ties',()=>{
    const a={id:'a',hp:200,maxHp:1000,alive:true,tileX:2,tileY:2},b={...a,id:'b',hp:150,maxHp:300,tileX:1};
    expect(weakestTrainingTarget({tileX:0,tileY:0},[b,a])?.id).toBe('a');
    expect(weakestTrainingTarget(a,[{...a,alive:false},b])?.id).toBe('b');
    expect(weakestTrainingTarget(a,[{...a,id:'c'},a])?.id).toBe('a');
  });
  it('uses real spell/rune/projectile pipelines, charges, mana and healing without rewards or ownership leakage',()=>{
    const {engine,send}=setup();send('knight',{type:'control',mode:'AI'});const result=engine.run();
    const bots=result.events.filter(e=>e.type==='spawn'&&e.data?.entity?.trainingVocation).map(e=>e.targetId!);
    expect(bots).toHaveLength(3);
    for(const id of bots){
      expect(result.events.some(e=>e.sourceId===id&&['cast','basic_attack'].includes(e.type))).toBe(true);
      expect(engine.controlOf(id).mode).toBe('AI');
    }
    const botCasts=result.events.filter(e=>e.type==='cast'&&bots.includes(e.sourceId!));expect(botCasts.length).toBeGreaterThan(0);
    for(const cast of botCasts){
      const spell=abilityCatalog(true).find(a=>a.id===cast.data?.abilityId)!;
      expect(spell).toBeDefined();expect(cast.data?.manaCost).toBe(spell.manaCost);
      expect(cast.data?.cooldownDuration).toBe(spell.cooldown);
    }
    expect(result.events.some(e=>e.type==='rune_used'&&bots.includes(e.sourceId!))).toBe(true);
    expect(result.events.some(e=>e.type==='damage'&&bots.includes(e.sourceId!)&&['knight','druid','sorcerer'].includes(e.targetId!))).toBe(true);
    expect(result.events.some(e=>e.type==='heal'&&e.sourceId==='training-warden'&&bots.includes(e.targetId!))).toBe(true);
    expect([result.xp,result.gold,result.bossTokens]).toEqual([0,0,0]);expect(result.loot).toEqual({});
    expect(result.events.some(e=>['boss_reward','equipment_drop','hero_experience'].includes(e.type))).toBe(false);
    expect(engine.entities.every(e=>Number.isFinite(e.hp)&&e.hp>=0&&e.mana>=0)).toBe(true);
    console.log('Team training result',{victory:result.victory,duration:result.duration,casts:botCasts.length,kills:result.kills});
  });
  it('is deterministic across frame sizes and cleans terrain, projectiles, reservations and pushes on dispose',()=>{
    const run=(step:number)=>{const {engine,send}=setup(811);send('knight',{type:'control',mode:'AI'});for(let t=0;!engine.completed&&t<200000;t+=step)engine.advanceTo(t);return engine;};
    const a=run(73),b=run(1000);expect(a.completed&&b.completed).toBe(true);expect(a.result).toEqual(b.result);
    for(const engine of [a,b]){engine.dispose();expect(engine.runeTiles).toEqual([]);expect(engine.pendingPushCount).toBe(0);expect(engine.entities).toEqual([]);}
  });
});
