import type {Page} from '@playwright/test';
/** Tests use the same exposed camera contract, not a hard-coded whole-map fit. */
export async function worldPoint(page:Page,x:number,y:number){
  const camera=JSON.parse((await page.locator('#game').getAttribute('data-camera'))!);
  const b=(await page.locator('#game canvas').boundingBox())!;
  return {x:b.x+camera.left+(x-camera.x)*camera.scale,y:b.y+camera.top+(y-camera.y)*camera.scale};
}
export const tilePoint=async(page:Page,x:number,y:number)=>worldPoint(page,x*32,y*32);
