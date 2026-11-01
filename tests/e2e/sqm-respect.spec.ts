import {test,expect} from '@playwright/test';
import {installControlledClock,pauseIdleClock} from './controlled-clock';
import {tilePoint} from './world-point';

test('all native/outfit poses match measured alpha and fit the shared SQM envelope',async({page})=>{
  await page.goto('/?training=1');await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  const checks=await page.evaluate(async()=>{
    const fitPath='/src/game/presentation/cellSpriteFit.ts',pixelPath='/src/game/presentation/pixelSprites.ts',libraryPath='/src/game/presentation/SpriteLibrary.ts',assetsPath='/src/data/outfitSprites.ts';
    const {fitSpriteToCell,SPRITE_OPAQUE_BOUNDS}=await import(fitPath),{pixelDefinition}=await import(pixelPath),{outfitDefinition}=await import(libraryPath),{outfitSpriteAssets}=await import(assetsPath);
    const native=(await(await fetch('/assets/original/manifests/sprites.json')).json()).map(pixelDefinition);
    const definitions=[...native,...outfitSpriteAssets.map((a:any)=>outfitDefinition(native.find((d:any)=>d.id==='knight'),a))],results=[];
    for(const raw of definitions){
      const image=new Image();image.src=raw.spriteSet;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(image,0,0);const pixels=context.getImageData(0,0,image.width,image.height).data;
      const cells=[...new Set<string>(Object.values(raw.animations.clips).flatMap((d:any)=>Object.values(d).flatMap((c:any)=>c.frames)))];
      let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity;
      for(const cell of cells){const[c,row]=cell.split(':').map(Number);for(let y=0;y<raw.frameSize;y++)for(let x=0;x<raw.frameSize;x++)if(pixels[((row*raw.frameSize+y)*image.width+c*raw.frameSize+x)*4+3]>16){l=Math.min(l,x-raw.footAnchor.x*raw.frameSize);r=Math.max(r,x+1-raw.footAnchor.x*raw.frameSize);t=Math.min(t,y-raw.footAnchor.y*raw.frameSize);b=Math.max(b,y+1-raw.footAnchor.y*raw.frameSize);}}
      const d=fitSpriteToCell(raw),sx=d.visualWidth/d.frameSize*d.scale,sy=d.visualHeight/d.frameSize*d.scale;
      results.push({id:d.id,actual:[l,t,r,b],measured:SPRITE_OPAQUE_BOUNDS[d.id],left:l*sx,right:r*sx,height:(b-t)*sy,belowFoot:(raw.footAnchor.y*raw.frameSize+b-d.footAnchor.y*d.frameSize)*sy});
    }return results;
  });
  expect(checks).toHaveLength(48);
  for(const c of checks){expect(c.actual,c.id).toEqual(c.measured);expect(c.left,c.id).toBeGreaterThanOrEqual(-15-1e-7);expect(c.right,c.id).toBeLessThanOrEqual(15+1e-7);expect(c.height,c.id).toBeLessThanOrEqual(30+1e-7);expect(c.belowFoot,c.id).toBeCloseTo(0);}
});

test('empty ground beside a fitted hero is a move destination, not its old oversized hit box',async({page})=>{
  await installControlledClock(page);await page.goto('/?training=1');await pauseIdleClock(page);await page.locator('#start').click();await page.clock.runFor(250);
  // Inside the old 18px body pick, outside the actual 11.2px-wide half envelope.
  // The visible point belongs to free SQM(8,8), not the Knight below it.
  const point=await tilePoint(page,8+15.8/32,9-22/32);await page.mouse.click(point.x,point.y);await page.clock.runFor(750);
  await expect(page.locator('#game')).toHaveAttribute('data-logical-positions',/knight:8:8/);
  await expect(page.locator('#game')).toHaveAttribute('data-body-overlaps','0');
});

test('production diagonal steps claim their transit corners and reset releases every claimed cell',async({page})=>{
  await installControlledClock(page);await page.goto('/?training=1');await pauseIdleClock(page);await page.locator('#start').click();await page.clock.runFor(250);
  await page.keyboard.down('Numpad3');const game=page.locator('#game');
  for(let i=0;i<20&&!(await game.getAttribute('data-unit-states'))?.includes('knight:moving');i++)await page.clock.runFor(25);
  await expect(game).toHaveAttribute('data-unit-states',/knight:moving/);
  expect(Number(await game.getAttribute('data-reserved-cells'))).toBeGreaterThanOrEqual(3);
  await expect(game).toHaveAttribute('data-body-overlaps','0');
  await page.keyboard.up('Numpad3');await page.keyboard.press('Escape');await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  await expect(game).toHaveAttribute('data-reserved-cells','0');await expect(game).toHaveAttribute('data-reservation-count','0');
});

test('real attacks and damage keep visual reactions inside the cell motion budget',async({page})=>{
  await installControlledClock(page);await page.addInitScript(()=>{(window as any).sqmEvents=[];window.addEventListener('hunt-event',e=>(window as any).sqmEvents.push((e as CustomEvent).detail));});
  await page.goto('/?training=1');await pauseIdleClock(page);await page.locator('#start').click();await page.clock.runFor(250);
  await page.locator('[data-battle-target]').first().click();await page.keyboard.press('Digit2');
  for(let i=0;i<80;i++){await page.clock.runFor(50);const bodies=JSON.parse((await page.locator('#game').getAttribute('data-body-envelopes'))!);
    for(const b of bodies){expect(Math.abs(b.offsetX)).toBeLessThanOrEqual(.5+1e-9);expect(Math.abs(b.offsetY)).toBeLessThanOrEqual(.5+1e-9);expect(b.rotation).toBe(0);}
    await expect(page.locator('#game')).toHaveAttribute('data-body-overlaps','0');
  }
  expect(await page.evaluate(()=>(window as any).sqmEvents.some((e:any)=>e.type==='damage'))).toBe(true);
  expect(await page.evaluate(()=>(window as any).sqmEvents.some((e:any)=>e.type==='cast'||e.type==='basic_attack'))).toBe(true);
});

test('manual approach/push and directional holds never overlap living bodies or grid occupants in flight',async({page})=>{
  await installControlledClock(page);await page.goto('/?training=1');await pauseIdleClock(page);
  await page.locator('#start').click();await page.clock.runFor(250);
  const game=page.locator('#game');await expect(game).toHaveAttribute('data-view-columns','19');
  const from=await tilePoint(page,5,12),to=await tilePoint(page,4,12);
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();
  for(let i=0;i<100;i++){await page.clock.runFor(50);await expect(game).toHaveAttribute('data-body-overlaps','0');await expect(game).toHaveAttribute('data-logical-overlaps','0');}
  await expect(game).toHaveAttribute('data-logical-positions',/sorcerer:4:12/);
  for(const key of ['Numpad6','Numpad8','Numpad4','Numpad2','Numpad7','Numpad9','Numpad3','Numpad1']){
    await page.keyboard.down(key);
    for(let i=0;i<6;i++){await page.clock.runFor(50);await expect(game).toHaveAttribute('data-body-overlaps','0');await expect(game).toHaveAttribute('data-logical-overlaps','0');}
    await page.keyboard.up(key);await page.clock.runFor(250);
  }
  await page.keyboard.press('Escape');await page.locator('#restart').click();await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  for(const key of ['reservation-count','reserved-cells','pending-pushes','pending-approaches','active-projectiles','body-overlaps'])await expect(game).toHaveAttribute('data-'+key,'0');
});
