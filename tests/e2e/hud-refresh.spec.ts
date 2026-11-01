import {test,expect} from '@playwright/test';

test('unchanged HUD batches preserve DOM identity and read one final snapshot',async({page})=>{
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  const result=await page.evaluate(async()=>{
    const vitals=[...document.querySelectorAll('.hero-vitals')];
    const nodes=vitals.map(el=>el.firstChild),labels=vitals.map(el=>el.textContent);
    const original=window.structuredClone;let progressionSnapshots=0;
    window.structuredClone=(...args)=>{
      const value=args[0];
      // PlayerControls independently reads entity/result snapshots on hunt-time.
      // The party-progression read belongs to GameplayHUD; count that contract.
      if(value&&typeof value==='object'&&!Array.isArray(value)&&['knight','druid','sorcerer'].every(id=>id in value))progressionSnapshots++;
      return original(...args);
    };
    let mutations=0;
    const observer=new MutationObserver(records=>mutations+=records.filter(r=>r.type==='childList').length);
    observer.observe(document.querySelector('#party')!,{childList:true,subtree:true});
    try{
      for(let i=0;i<20;i++)window.dispatchEvent(new CustomEvent('hunt-time',{detail:0}));
      await Promise.resolve();await Promise.resolve();
      return {progressionSnapshots,mutations,labelsUnchanged:vitals.every((el,i)=>el.textContent===labels[i]),identityPreserved:vitals.every((el,i)=>el.firstChild===nodes[i])};
    }finally{window.structuredClone=original;observer.disconnect();}
  });
  expect(result).toEqual({progressionSnapshots:1,mutations:0,labelsUnchanged:true,identityPreserved:true});
});
