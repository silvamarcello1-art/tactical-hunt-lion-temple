import {describe,it,expect} from 'vitest';
import {RenderInvalidation} from './RenderInvalidation';
describe('presentation draw invalidation',()=>{
  it('draws initially, then sleeps until a visual change',()=>{
    const r=new RenderInvalidation();expect(r.pending).toBe(true);
    expect(r.consume()).toBe(true);expect(r.consume()).toBe(false);
    r.invalidate();expect(r.consume()).toBe(true);expect(r.pending).toBe(false);
  });
  it('coalesces changes without limiting continuous animation',()=>{
    const r=new RenderInvalidation();r.consume();r.invalidate();r.invalidate();
    expect(r.consume()).toBe(true);expect(r.consume()).toBe(false);
    for(let i=0;i<120;i++)expect(r.consume(true)).toBe(true);
    expect(r.consume()).toBe(false);
  });
  it('retains invalidation between ticker calls and draws the final animation frame',()=>{
    const r=new RenderInvalidation();r.consume();
    r.invalidate();expect(r.pending).toBe(true);expect(r.pending).toBe(true);
    expect(r.consume()).toBe(true);expect(r.consume()).toBe(false);
  });
});
