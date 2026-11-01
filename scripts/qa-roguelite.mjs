// Real-clock, black-box smoke. No save fixtures, clock overrides or combat cheats.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const [base='http://127.0.0.1:4180/',expectedSha='',label='alpha-local']=process.argv.slice(2);
const sha=expectedSha==='-'?'':expectedSha;
if(sha&&!/^[a-f0-9]{40}$/.test(sha))throw new Error('Expected full commit SHA, or - for an explicitly unstamped working-tree check');
if(!/^[a-zA-Z0-9-]+$/.test(label))throw new Error('Invalid evidence label');
const output=resolve(import.meta.dirname,'../test-results');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
let page;const errors=[],warnings=[];
try{
  page=await browser.newPage({viewport:{width:1600,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  const url=new URL('alpha.html',base);if(sha)url.searchParams.set('v',sha);
  if(sha){const response=await page.request.get(new URL(`version.json?v=${sha}`,base).href);expect(response.ok()).toBe(true);expect((await response.json()).commit).toBe(sha);}
  await page.goto(url.href);await expect(page.getByRole('button',{name:'Despertar na costa',exact:true})).toBeVisible();await page.getByRole('button',{name:'Despertar na costa',exact:true}).click();
  const walk=async(key,ms)=>{await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);};
  await walk('KeyD',1750);await expect(page.locator('#interaction')).toContainText('Vestígio da maré');await page.keyboard.press('f');await expect(page.locator('#dialog-title')).toHaveText('O nome sob a água.');await page.getByRole('button',{name:'Continuar a explorar'}).click();await expect(page.locator('#run-embers')).toHaveText('6');
  await page.screenshot({path:resolve(output,`${label}-coast.png`)});await walk('KeyD',4500);await page.keyboard.press('f');await expect(page.locator('#alpha')).toHaveAttribute('data-room','grove');
  for(let room=1;room<=2;room++){
    const started=Date.now();for(;Date.now()-started<110000;){if(await page.locator('#story').isVisible())break;await page.keyboard.press('Space');await page.keyboard.press('q');await page.waitForTimeout(250);await page.keyboard.press('e');await page.waitForTimeout(750);}
    await expect(page.locator('#dialog-title')).toHaveText('Uma brasa, três caminhos.');await page.getByRole('button',{name:/Fio da aurora/}).click();await expect(page.locator('#objective')).toContainText('Caminho liberado');await page.screenshot({path:resolve(output,`${label}-forest-${room}.png`)});
    if(room===1){await walk('KeyD',5500);await page.keyboard.press('f');await expect(page.locator('#alpha')).toHaveAttribute('data-room','roots');}
  }
  await expect(page.locator('#run-embers')).toHaveText('22');await page.locator('#pause').click();const health=await page.locator('#health-text').textContent();await page.waitForTimeout(300);expect(await page.locator('#health-text').textContent()).toBe(health);await page.getByRole('button',{name:/Retornar ao refúgio/}).click();await expect(page.locator('#dialog-title')).toHaveText('Você despertou no refúgio.');await page.getByRole('button',{name:'Explorar o refúgio'}).click();await expect(page.locator('#bank-embers')).toHaveText('11');
  await walk('KeyW',1250);await page.keyboard.press('f');await expect(page.locator('#dialog-title')).toHaveText('O ferro lembra do fogo.');await page.getByRole('button',{name:/Fortalecer · 8 brasas/}).click();await expect(page.locator('#bank-embers')).toHaveText('3');await expect(page.locator('[data-action="renewal"]')).not.toHaveClass(/locked/);
  await page.locator('#journal').click();await expect(page.locator('#dialog-body')).toContainText('maré');await page.getByRole('button',{name:'Fechar o caderno'}).click();await page.screenshot({path:resolve(output,`${label}-refuge.png`)});
  await expect(page.locator('canvas')).toHaveCount(1);expect(errors).toEqual([]);expect(warnings).toEqual([]);
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('tactical-hunt-roguelite-v1')));expect(save.run).toBeUndefined();expect(save.rank).toBe(1);expect(save.embers).toBe(3);
  const evidence={url:url.href,sha,errors,warnings,save,scope:'Fresh coast, two real encounters/upgrades, withdrawal, permanent forge, chronicle, pause. Not a full human victory run.'};await writeFile(resolve(output,`${label}.json`),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}catch(error){
  // Diagnostics must not swallow or replace the smoke failure.
  if(page)await page.screenshot({path:resolve(output,`${label}-failure.png`)}).catch(()=>{});
  console.error(JSON.stringify({sha,label,errors,warnings}));throw error;
}finally{await browser.close();}
