import {describe,it,expect,vi} from 'vitest';
import {StaticSceneCache} from './StaticSceneCache';

const view={width:960,height:576,scale:1.5,resolution:1};
const fixture=()=>{
  const target={cacheAsTexture:vi.fn(),updateCacheTexture:vi.fn()};
  return {target,cache:new StaticSceneCache(target,{maxDimension:4096,maxPixels:8_388_608})};
};
describe('presentation-only static scene cache',()=>{
  it('caches at effective screen resolution with nearest sampling',()=>{
    const {target,cache}=fixture();cache.sync(view);
    expect(target.cacheAsTexture).toHaveBeenCalledExactlyOnceWith({resolution:1.5,antialias:false,scaleMode:'nearest'});
    expect(cache.allocationPixels).toBe(2048*1024);expect(cache.enabled).toBe(true);
  });
  it('does not rebuild for unchanged views or parent panning',()=>{
    const {target,cache}=fixture();cache.sync(view);
    for(let i=0;i<100;i++)cache.sync({...view});
    expect(target.cacheAsTexture).toHaveBeenCalledTimes(1);expect(target.updateCacheTexture).not.toHaveBeenCalled();expect(cache.rebuilds).toBe(1);
  });
  it('coalesces static content invalidations and updates the existing cache',()=>{
    const {target,cache}=fixture();cache.sync(view);cache.invalidate();cache.invalidate();cache.sync(view);cache.sync(view);
    expect(target.updateCacheTexture).toHaveBeenCalledTimes(1);expect(cache.rebuilds).toBe(2);
  });
  it('releases the old texture before zoom or renderer resolution changes',()=>{
    const {target,cache}=fixture();cache.sync(view);cache.sync({...view,scale:2});cache.sync({...view,scale:1,resolution:2});
    expect(target.cacheAsTexture.mock.calls.map(c=>c[0])).toEqual([
      {resolution:1.5,antialias:false,scaleMode:'nearest'},false,{resolution:2,antialias:false,scaleMode:'nearest'},
    ]);
    expect(cache.rebuilds).toBe(2);
  });
  it('updates after static content bounds change at the same scale',()=>{
    const {target,cache}=fixture();cache.sync(view);cache.sync({...view,width:1000});cache.sync({...view,width:1000});
    expect(target.updateCacheTexture).toHaveBeenCalledTimes(1);expect(cache.rebuilds).toBe(2);
  });
  it('falls back to original drawing instead of lowering oversized resolution',()=>{
    const {target,cache}=fixture();cache.sync(view);cache.sync({...view,resolution:4});
    expect(cache.reason).toBe('budget');expect(cache.enabled).toBe(false);expect(cache.allocationPixels).toBe(0);
    expect(target.cacheAsTexture).toHaveBeenLastCalledWith(false);
    cache.sync(view);expect(cache.enabled).toBe(true);expect(cache.rebuilds).toBe(2);
  });
  it('budgets padded power-of-two area, not only nominal pixels',()=>{
    const {target,cache}=fixture();cache.sync({width:2100,height:2100,scale:1,resolution:1});
    expect(cache.reason).toBe('budget');expect(target.cacheAsTexture).not.toHaveBeenCalled();
  });
  it('rejects empty or nonfinite views without allocating',()=>{
    const {target,cache}=fixture();
    for(const change of [{width:0},{height:-1},{scale:NaN},{resolution:Infinity}])cache.sync({...view,...change});
    expect(cache.reason).toBe('empty');expect(target.cacheAsTexture).not.toHaveBeenCalled();
  });
  it('disables reference drawing idempotently without touching content',()=>{
    const {target,cache}=fixture();cache.sync(view,false);cache.sync(view);cache.sync(view,false);cache.sync(view,false);
    expect(target.cacheAsTexture).toHaveBeenCalledTimes(2);expect(cache.reason).toBe('disabled');
    expect(target.updateCacheTexture).not.toHaveBeenCalled();
  });
  it('releases once on dispose and never allocates after disposal',()=>{
    const {target,cache}=fixture();cache.sync(view);cache.destroy();cache.destroy();cache.invalidate();cache.sync(view);
    expect(target.cacheAsTexture).toHaveBeenCalledTimes(2);expect(target.cacheAsTexture).toHaveBeenLastCalledWith(false);
    expect(cache.reason).toBe('disposed');expect(cache.enabled).toBe(false);expect(cache.allocationPixels).toBe(0);
  });
});
