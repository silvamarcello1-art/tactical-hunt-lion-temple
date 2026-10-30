import {describe,it,expect} from 'vitest';
import manifestText from '../../../public/assets/original/manifests/sprites.json?raw';
import {fitSpriteToCell,SPRITE_OPAQUE_BOUNDS,opaqueCellBounds,opaqueBodiesOverlap,cellActionMotion,cellHurtMotion} from './cellSpriteFit';
import {pixelDefinition} from './pixelSprites';
import {outfitDefinition} from './SpriteLibrary';
import {outfitSpriteAssets} from '../../data/outfitSprites';
import type {SpriteDefinition} from './SpriteDefinition';

const native=(JSON.parse(manifestText) as SpriteDefinition[]).map(pixelDefinition);
const definitions=[...native,...outfitSpriteAssets.map(a=>outfitDefinition(native.find(d=>d.id==='knight')!,a))];
describe('stable one-SQM sprite envelopes',()=>{
  it('covers every native, creature, boss and outfit without changing the source definition',()=>{
    expect(definitions).toHaveLength(48);
    for(const raw of definitions){
      const saved=structuredClone(raw),d=fitSpriteToCell(raw),[l,t,r,b]=SPRITE_OPAQUE_BOUNDS[d.id];
      const sx=d.visualWidth/d.frameSize*d.scale,sy=d.visualHeight/d.frameSize*d.scale;
      expect(l*sx).toBeGreaterThanOrEqual(-15-1e-9);expect(r*sx).toBeLessThanOrEqual(15+1e-9);
      expect((b-t)*sy).toBeLessThanOrEqual(30+1e-9);
      expect(d.footAnchor.y).toBeCloseTo(raw.footAnchor.y+b/raw.frameSize);
      expect(d.scale).toBeGreaterThan(0);expect(d.scale).toBeLessThanOrEqual(raw.scale);
      expect(d.footprint.logicalTiles).toEqual({width:1,height:1});expect(raw).toEqual(saved);
      expect(d.animations.footAnchor).toEqual(d.footAnchor);
    }
  });
  it('uses one uniform scale multiplier, not different per-frame or directional fits',()=>{
    for(const raw of definitions){const d=fitSpriteToCell(raw);
      expect((d.visualWidth/d.frameSize*d.scale)/(d.visualHeight/d.frameSize*d.scale)).toBeCloseTo(raw.visualWidth/raw.visualHeight);
      expect(d.animations.clips).toEqual(raw.animations.clips);
    }
  });
  it('does not silently render a new unmeasured atlas outside its cell',()=>{
    expect(()=>fitSpriteToCell({...native[0],id:'unmeasured'})).toThrow('Missing measured sprite bounds');
  });
  it('keeps adjacent living bodies disjoint in horizontal, vertical and diagonal cells',()=>{
    for(const raw of definitions)for(const other of definitions){
      const a=opaqueCellBounds(fitSpriteToCell(raw),{x:0,y:0});
      for(const position of [{x:32,y:0},{x:0,y:32},{x:32,y:32}])expect(opaqueBodiesOverlap(a,opaqueCellBounds(fitSpriteToCell(other),position))).toBe(false);
    }
    const same=opaqueCellBounds(fitSpriteToCell(native[0]),{x:0,y:0});
    expect(opaqueBodiesOverlap(same,same)).toBe(true);
  });
  it('bounds attack/cast/hurt motion absolutely and returns to the grounded origin',()=>{
    for(let i=0;i<=100;i++){const p=i/100;
      for(const attacking of [true,false]){const m=cellActionMotion(p,10,-10,attacking);expect(Math.abs(m.x)).toBeLessThanOrEqual(.5);expect(Math.abs(m.y)).toBeLessThanOrEqual(.5);}
      expect(Math.abs(cellHurtMotion(p))).toBeLessThanOrEqual(.5);
    }
    expect(cellActionMotion(0,1,0,true)).toEqual({x:0,y:0});expect(Math.abs(cellActionMotion(1,1,0,true).x)).toBeLessThan(1e-9);expect(cellHurtMotion(1)).toBeCloseTo(0);
  });
  it('includes reaction offsets in collision diagnostics and retains a gap for adjacent cells',()=>{
    for(const raw of definitions){const d=fitSpriteToCell(raw),a=opaqueCellBounds(d,{x:0,y:0},{x:.5,y:.5});
      expect(opaqueBodiesOverlap(a,opaqueCellBounds(d,{x:32,y:0},{x:-.5,y:0}))).toBe(false);
      expect(opaqueBodiesOverlap(a,opaqueCellBounds(d,{x:0,y:32},{x:0,y:-.5}))).toBe(false);
    }
  });
});
