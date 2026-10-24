import {test,expect} from '@playwright/test';
import {installControlledClock,pauseIdleClock} from './controlled-clock';

test.use({deviceScaleFactor:2});
test('DPR2 camera inverse picks all four visible corners after resize; neutral rails reject input',async({page})=>{
  await installControlledClock(page);await page.goto('/?training=1');await pauseIdleClock(page);
  await page.locator('#start').click();await page.clock.runFor(250);
  const game=page.locator('#game');
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]){
    await page.setViewportSize(size);await page.clock.runFor(32);await page.keyboard.press('Digit4');
    const camera=JSON.parse((await game.getAttribute('data-camera'))!),bounds=(await page.locator('#game canvas').boundingBox())!;
    // Browser pointer coordinates are quantized; stay one logical pixel inside.
    for(const dx of [1,camera.width-1])for(const dy of [1,camera.height-1]){
      await page.mouse.move(bounds.x+camera.left+dx*camera.scale,bounds.y+camera.top+dy*camera.scale);
      await expect(game).toHaveAttribute('data-aim-tile',new RegExp(`^${Math.round((camera.x+dx)/32)}:${Math.round((camera.y+dy)/32)}:`));
    }
    const commands=await page.locator('#player-controls').getAttribute('data-command-count');
    await page.locator('.tactical-rail header').click();expect(await page.locator('#player-controls').getAttribute('data-command-count')).toBe(commands);
    await expect(page.locator('[data-rune="magic_wall"]')).toHaveAttribute('data-charges','8');
    await expect(game).toHaveAttribute('data-arena-width','1152');await expect(game).toHaveAttribute('data-arena-height','576');
    const buffer=await page.locator('#game canvas').evaluate(c=>(c as HTMLCanvasElement).width);expect(Math.abs(buffer-bounds.width*2)).toBeLessThan(3);
    await page.keyboard.press('Escape');await page.clock.runFor(250);
  }
  await expect(game).toHaveAttribute('data-logical-overlaps','0');await expect(game).toHaveAttribute('data-out-of-bounds','0');
});
