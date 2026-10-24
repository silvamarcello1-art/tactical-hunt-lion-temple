import {describe,it,expect} from 'vitest';
import {worldCamera,viewportPoint,WORLD_VIEW} from './worldViewport';
describe('one square-tile world transform',()=>{
  it.each([[1366,768],[1600,900],[1920,1080]])('round-trips all four visible corners after resize %s×%s',(width,height)=>{
    const map={x:-16,y:-16,width:1152,height:576},camera=worldCamera(width,height,map,{x:600,y:300});
    expect(camera.width/32).toBe(15);expect(camera.height/32).toBe(11);
    for(const dx of [.01,camera.width-.01])for(const dy of [.01,camera.height-.01]){
      const result=viewportPoint({x:23+camera.left+dx*camera.scale,y:41+camera.top+dy*camera.scale},{left:23,top:41,width,height},camera)!;
      expect(result.x).toBeCloseTo(camera.x+dx);expect(result.y).toBeCloseTo(camera.y+dy);
    }
    expect(viewportPoint({x:22,y:41},{left:23,top:41,width,height},camera)).toBeUndefined();
    expect(map).toEqual({x:-16,y:-16,width:1152,height:576});
  });
  it('clamps camera, not logical map, and keeps consistent square scale',()=>{
    const map={x:0,y:0,width:960,height:576},camera=worldCamera(1058,778,map,{x:9999,y:9999});
    expect(camera.x+camera.width).toBe(960);expect(camera.y+camera.height).toBe(576);
    expect(camera.width*camera.scale/15).toBeCloseTo(camera.height*camera.scale/11);
    expect(WORLD_VIEW.characterScale).toBe(.62);
  });
  it('uses fractional CSS dimensions without integer X/Y stretch or DPR double-scaling',()=>{
    const bounds={left:266.734375,top:75,width:832.53125,height:577},camera=worldCamera(bounds.width,bounds.height,{x:-16,y:-16,width:1152,height:576},{x:256,y:288});
    const point={x:camera.x+72.25,y:camera.y+113.75};
    const screen={x:bounds.left+camera.left+(point.x-camera.x)*camera.scale,y:bounds.top+camera.top+(point.y-camera.y)*camera.scale};
    const inverse=viewportPoint(screen,bounds,camera)!;
    expect(inverse.x).toBeCloseTo(point.x,10);expect(inverse.y).toBeCloseTo(point.y,10);
    expect(camera.left*2+camera.width*camera.scale).toBeCloseTo(bounds.width,10);
  });
});
