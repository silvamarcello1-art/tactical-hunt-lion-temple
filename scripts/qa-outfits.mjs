import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const [base,sha,label='public']=process.argv.slice(2);
if(!base||!sha)throw new Error('Usage: node scripts/qa-outfits.mjs URL EXPECTED_SHA LABEL');
if(!/^[a-z0-9-]+$/i.test(label))throw new Error('Invalid artifact label');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const url=new URL(base);url.searchParams.set('training','1');url.searchParams.set('v',sha);
  const manifest=new URL('version.json',url);manifest.searchParams.set('check',String(Date.now()));
  const response=await page.request.get(manifest.href,{headers:{'Cache-Control':'no-cache'}});
  expect(response.ok()).toBe(true);expect((await response.json()).commit).toBe(sha);
  await page.goto(url.href);await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#open-outfits').click();
  const catalog=['citizen','warrior','mage','druid','assassin','hunter'];
  for(const id of catalog){
    await page.locator(`[data-outfit="${id}"]`).click();
    for(const level of [0,1,2])await page.locator(`[data-addon="${level}"]`).click();
    await expect(page.locator('.outfit-addons p')).toContainText(' + ');
    await page.locator('[data-color-region="primary"]').selectOption('ocean');await page.locator('[data-apply]').click();
    await expect(page.locator('#outfit-status')).toContainText('Arte pendente');
    await expect(page.locator('#outfit-preview')).toHaveAttribute('data-rendered-sprite','knight');
  }
  await page.locator('[data-outfit="warrior"]').click();await page.locator('[data-addon="2"]').click();
  for(const facing of ['east','north','west','south']){
    await page.locator('[data-rotate="1"]').click();await expect(page.locator('#outfit-preview')).toHaveAttribute('data-facing',facing);
  }
  await page.locator('[data-motion="walk"]').click();
  await mkdir('test-results',{recursive:true});await page.screenshot({path:`test-results/mvp2c-${label}-outfits.png`});
  await page.locator('[data-outfit="original-druid"]').click();await page.locator('[data-apply]').click();await page.keyboard.press('Escape');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#open-outfits').click();await expect(page.locator('[data-outfit="original-druid"]')).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Escape');
  await page.locator('#start').click();await page.locator('#game canvas').focus();await page.keyboard.down('a');await page.waitForTimeout(650);await page.keyboard.up('a');
  await page.locator('#pause').click();
  await expect(page.locator('#game')).toHaveAttribute('data-appearance-sprites',/"knight":"druid"/);
  const snapshot=()=>page.evaluate(()=>({positions:document.querySelector('#game').dataset.logicalPositions,party:document.querySelector('#party').textContent,
    time:document.querySelector('#game').dataset.logicalTime,mode:document.querySelector('#control-mode').value,commands:document.querySelector('#player-controls').dataset.commandCount}));
  const before=await snapshot();await page.locator('#open-outfits').click();await page.locator('[data-outfit="original-sorcerer"]').click();await page.locator('[data-apply]').click();
  expect(await snapshot()).toEqual(before);await page.keyboard.press('Escape');
  await page.screenshot({path:`test-results/mvp2c-${label}-customized.png`});
  await expect(page.locator('#game')).toHaveAttribute('data-logical-overlaps','0');await expect(page.locator('#game')).toHaveAttribute('data-out-of-bounds','0');
  expect(errors).toEqual([]);
  console.log(JSON.stringify({url:url.href,sha,referencesChecked:catalog,referenceArtPending:true,productionSprites:3,paletteMasksPending:true,cosmeticStateUnchanged:true,errors}));
}finally{await browser.close();}
