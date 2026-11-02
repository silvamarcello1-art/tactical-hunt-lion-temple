import {test,expect,type Page} from '@playwright/test';
import {installControlledClock} from './controlled-clock';

async function boot(page:Page,checkpoint?:unknown){
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  if(checkpoint)await page.addInitScript(d=>localStorage.setItem('tactical-hunt-roguelite-v1',JSON.stringify(d)),checkpoint);
  await installControlledClock(page);await page.goto('/alpha.html');await expect(page.locator('#story')).toBeVisible();await expect(page.locator('#alpha')).not.toHaveAttribute('data-state','loading');
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));return errors;
}
async function walk(page:Page,key:string,ms:number){await page.keyboard.down(key);await page.clock.runFor(ms);await page.keyboard.up(key);}
const base=()=>({version:1,embers:0,rank:0,runs:1,victories:0,discoveries:['maré'],run:{id:'e2e-alpha',seed:803,room:1,hp:3500,embers:16,xp:0,cleared:false,upgrades:[] as string[],elapsed:0}});

test('Alpha coast → real manual encounter → upgrade → checkpoint and lab remain separate',async({page})=>{
  const errors=await boot(page);await page.getByRole('button',{name:'Despertar na costa',exact:true}).click();
  await page.keyboard.press('f');await expect(page.locator('#run-embers')).toHaveText('0');
  await walk(page,'KeyD',1750);await expect(page.locator('#interaction')).toContainText('Vestígio da maré');await page.keyboard.press('f');await expect(page.locator('#dialog-title')).toHaveText('O nome sob a água.');await page.getByRole('button',{name:'Continuar a explorar'}).click();
  await expect(page.locator('#run-embers')).toHaveText('6');await walk(page,'KeyD',4000);await page.keyboard.press('f');await expect(page.locator('#alpha')).toHaveAttribute('data-room','grove');
  // Click the visible upper body, which is above the foot tile's half-cell.
  // The initial spawn is configured at (18,6); no engine state is injected.
  const canvas=(await page.locator('canvas').boundingBox())!,scale=Math.max(canvas.width/800,canvas.height/480),cameraY=Math.max(-16,Math.min(560-canvas.height/scale,288-canvas.height/scale/2));
  await page.mouse.click(canvas.x+(18*32+16)*scale,canvas.y+(6*32-22-cameraY)*scale);await page.clock.runFor(250);await expect(page.locator('#target-banner')).toContainText('Errante do bosque');
  for(let t=0;t<100000;t+=1000){if(await page.locator('#story').isVisible())break;await page.keyboard.press('Space');await page.keyboard.press('q');await page.clock.runFor(250);await page.keyboard.press('e');await page.clock.runFor(750);}
  await expect(page.locator('#dialog-title')).toHaveText('Uma brasa, três caminhos.');await page.getByRole('button',{name:/Fio da aurora/}).click();await page.clock.runFor(100);await expect(page.locator('#objective')).toContainText('Caminho liberado');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tactical-hunt-roguelite-v1')!));expect(saved.run.choice).toBe('edge');expect(saved.run.embers).toBe(14);expect(saved.embers).toBe(0);expect(errors).toEqual([]);
  await page.screenshot({path:'test-results/roguelite-first-clear.png'});
  await page.reload();await expect(page.getByRole('button',{name:'Continuar jornada',exact:true})).toBeVisible();await page.getByRole('button',{name:'Continuar jornada',exact:true}).click();await page.clock.runFor(100);await expect(page.locator('#run-embers')).toHaveText('14');
});

test('Alpha real defeat banks half once, returns home and unlocks manual renewal',async({page})=>{
  const save=base();save.run.hp=1;const errors=await boot(page,save);await page.getByRole('button',{name:'Continuar jornada',exact:true}).click();await page.clock.runFor(15000);await expect(page.locator('#dialog-title')).toHaveText('Você despertou no refúgio.');await page.getByRole('button',{name:'Explorar o refúgio'}).click();await expect(page.locator('#bank-embers')).toHaveText('8');
  await walk(page,'KeyW',1250);await expect(page.locator('#interaction')).toContainText('Brasa');await page.keyboard.press('f');await expect(page.locator('#dialog-title')).toHaveText('O ferro lembra do fogo.');await page.getByRole('button',{name:/Fortalecer · 8 brasas/}).click();await expect(page.locator('#bank-embers')).toHaveText('0');await expect(page.locator('[data-action="renewal"]')).not.toHaveClass(/locked/);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('tactical-hunt-roguelite-v1')!));expect(stored.rank).toBe(1);expect(stored.run).toBeUndefined();expect(stored.last.victory).toBe(false);expect(errors).toEqual([]);
});

test('Alpha hub journal, pause, three sizes and protected incompatible save',async({page})=>{
  const errors=await boot(page,{version:99,doNotOverwrite:true});await page.getByRole('button',{name:'Conhecer o refúgio'}).click();await page.locator('#journal').click();await expect(page.locator('#dialog-title')).toHaveText('Nem toda ruína é uma resposta.');await page.getByRole('button',{name:'Fechar o caderno'}).click();
  for(const [width,height] of [[1366,768],[1600,900],[1920,1080]]){await page.setViewportSize({width,height});await page.clock.runFor(100);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('canvas')).toHaveCount(1);await page.screenshot({path:`test-results/roguelite-refuge-${width}.png`});}
  await page.locator('#pause').click();await page.clock.runFor(3000);await expect(page.locator('#dialog-title')).toHaveText('A chama pode esperar.');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('tactical-hunt-roguelite-v1')!).version)).toBe(99);expect(errors).toEqual([]);
});

test('Alpha final boss uses real combat, then victory returns resources to the hub once',async({page})=>{
  const save=base();save.rank=1;save.run.room=10;save.run.hp=4300;save.run.embers=80;save.run.upgrades=['edge','edge','edge','heart','heart','focus','focus','edge'];
  const errors=await boot(page,save);await page.getByRole('button',{name:'Continuar jornada',exact:true}).click();
  for(let t=0;t<110000;t+=1000){if((await page.locator('#objective').textContent())?.includes('Caminho liberado'))break;if(await page.locator('#story').isVisible())break;await page.keyboard.press('Space');await page.keyboard.press('q');await page.clock.runFor(250);await page.keyboard.press('e');if(t%10000===0)await page.keyboard.press('r');await page.clock.runFor(750);}
  await expect(page.locator('#objective')).toContainText('Caminho liberado');await page.screenshot({path:'test-results/roguelite-regent-defeated.png'});await walk(page,'KeyD',5500);await page.keyboard.press('f');await expect(page.locator('#dialog-title')).toHaveText('O Regente caiu.');await page.getByRole('button',{name:'Explorar o refúgio'}).click();await expect(page.locator('#bank-embers')).toHaveText('92');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('tactical-hunt-roguelite-v1')!));expect(stored.victories).toBe(1);expect(stored.run).toBeUndefined();expect(stored.discoveries).toContain('regente');expect(errors).toEqual([]);
});
