import {test,expect,type Page} from '@playwright/test';
async function tilePoint(page:Page,x:number,y:number) {
  const b=(await page.locator('#game canvas').boundingBox())!,s=Math.min(b.width/960,b.height/576);
  return {x:b.x+(b.width-960*s)/2+x*32*s,y:b.y+(b.height-576*s)/2+y*32*s};
}
async function boot(page:Page,mode='MANUAL') {
  await page.addInitScript(()=>{(window as any).events=[];window.addEventListener('hunt-event',e=>(window as any).events.push((e as CustomEvent).detail));});
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await page.locator('#loop-toggle').click();await page.locator('#control-mode').selectOption(mode);await page.locator('#start').click();
}
test('mouse destinations, chord consumption, HUD ownership and native menu boundary',async({page})=>{
  await boot(page);await page.locator('#pause').click();
  const controls=page.locator('#player-controls');
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1000,height:700}]) {
    await page.setViewportSize(size);
    const p=await tilePoint(page,8,4);await page.mouse.click(p.x,p.y);
    await expect(controls).toHaveAttribute('data-last-intent','move-to');
    const count=await controls.getAttribute('data-command-count');
    await page.locator('#card-knight').click();expect(await controls.getAttribute('data-command-count')).toBe(count);
    const q=await tilePoint(page,12,5);await page.mouse.move(q.x,q.y);
    await page.mouse.down({button:'right'});await page.mouse.down({button:'left'});await page.mouse.up({button:'left'});await page.mouse.up({button:'right'});
    await expect(controls).toHaveAttribute('data-last-intent','look');
    expect(Number(await controls.getAttribute('data-command-count'))).toBe(Number(count)+1);
    await expect(page.locator('#interaction-status')).toContainText('Pilar da Vigília');
  }
  const boundary=await page.evaluate(()=>{
    const canvas=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.querySelector('canvas')!.dispatchEvent(canvas);
    const hud=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.querySelector('#party')!.dispatchEvent(hud);
    return {canvas:canvas.defaultPrevented,hud:hud.defaultPrevented};
  });expect(boundary).toEqual({canvas:true,hud:false});
  const old=await tilePoint(page,3,9),fresh=await tilePoint(page,8,3);
  await page.mouse.click(old.x,old.y);await page.mouse.click(fresh.x,fresh.y);await page.locator('#pause').click();
  await expect.poll(()=>page.evaluate(()=>(window as any).events.filter((e:any)=>e.sourceId==='knight'&&e.type==='movement_started').at(-1)?.data.destinationTile)).toEqual({x:8,y:3});
  await expect(page.locator('#game')).toHaveAttribute('data-logical-overlaps','0');
});
test('Assisted only rotates after right-click and stops when selected enemy dies',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await boot(page,'ASSISTED');
  await page.waitForTimeout(400);
  expect(await page.evaluate(()=>(window as any).events.filter((e:any)=>e.sourceId==='knight'&&['cast','basic_attack'].includes(e.type)).length)).toBe(0);
  await page.locator('#pause').click();
  const position=(await page.locator('#game').getAttribute('data-logical-positions'))!.split(',').find(s=>s.startsWith('lion-1:'))!.split(':');
  const p=await tilePoint(page,Number(position[1]),Number(position[2]));await page.mouse.click(p.x,p.y,{button:'right'});
  await expect(page.locator('#player-controls')).toHaveAttribute('data-last-intent','attack');
  await page.locator('#pause').click();
  await expect.poll(()=>page.evaluate(()=>(window as any).events.some((e:any)=>e.sourceId==='knight'&&e.type==='cast'))).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).events.some((e:any)=>e.type==='death'&&e.targetId==='lion-1'))).toBe(true);
  await page.waitForTimeout(600);await page.locator('#pause').click();
  expect(await page.evaluate(()=>{const es=(window as any).events;const death=es.find((e:any)=>e.type==='death'&&e.targetId==='lion-1');return es.filter((e:any)=>e.time>death.time&&e.sourceId==='knight'&&['basic_attack','cast'].includes(e.type)).length;})).toBe(0);
  expect(errors).toEqual([]);
});
