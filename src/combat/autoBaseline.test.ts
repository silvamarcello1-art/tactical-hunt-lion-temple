import {expect,it} from 'vitest';
import {defaultAbilityPreferences} from '../data/abilities';
import {CombatEngine} from './CombatEngine';
// New roster intentionally changes results. Historical hashes remain in Git.
it('24 Auto encounters are deterministic and end without stalemate or orphan terrain',async()=>{
  const summaries=[];
  for(let seed=803;seed<=814;seed++)for(const wave of [true,false]) {
    const prefs=defaultAbilityPreferences();prefs.energy_wave.enabled=wave;
    const engine=new CombatEngine(seed,prefs),result=engine.run();
    expect(result).toEqual(new CombatEngine(seed,prefs).run());
    expect(result.floorCompletionReasons.every(reason=>reason==='victory'||reason==='party_defeated')).toBe(true);
    expect(engine.encounterMetrics.temporaryBlockedTiles).toBe(0);
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(result)));
    const timelineHash=Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
    summaries.push({seed,wave,timelineHash,victory:result.victory,turns:result.floorTurns,kills:result.kills,xp:result.xp,healing:result.healing});
  }
  expect(summaries).toMatchSnapshot();
},120000);
