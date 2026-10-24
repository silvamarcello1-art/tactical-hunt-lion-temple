import {describe,it,expect} from 'vitest';
import {outfitSpriteAssets} from '../../data/outfitSprites';
import manifestText from '../../../public/assets/original/manifests/sprites.json?raw';
import {outfitDefinition} from './SpriteLibrary';
import {pixelDefinition} from './pixelSprites';
import type {SpriteDefinition} from './SpriteDefinition';
// Test-only typed Node boundary; the browser project intentionally has no
// @types/node dependency. Nothing from this module enters the runtime bundle.
const filesystem='node:fs';
const {readFileSync,existsSync}=await import(filesystem) as {
  readFileSync(path:URL):Uint8Array;existsSync(path:URL):boolean;
};
const file=(path:string)=>new URL(`../../../${path}`,import.meta.url);

describe('reviewed outfit assets on disk',()=>{
  it('shares native animation clocks/clips while preserving logical footprint and the enlarged grounded atlas contract',()=>{
    const source=(JSON.parse(manifestText) as SpriteDefinition[]).find(d=>d.id==='knight')!,template=pixelDefinition(source);
    for(const asset of outfitSpriteAssets){
      const definition=outfitDefinition(template,asset);
      expect(definition.id).toBe(asset.spriteId);expect(definition.spriteSet).toBe(asset.path);
      expect(definition.frameSize).toBe(112);expect(definition.footAnchor).toEqual({x:.5,y:104/112});
      expect(definition.animations.footAnchor).toEqual(definition.footAnchor);expect(definition.animations.id).toBe(asset.spriteId);
      expect(definition.animations.clips).toBe(template.animations.clips);
      expect(definition.footprint.logicalTiles).toEqual({width:1,height:1});expect(definition.shadowProfile).toEqual(template.shadowProfile);
      expect(definition.effectAnchors.head.y).toBe(-(asset.visualTop??68));
    }
    expect(template.id).toBe('knight');expect(template.frameSize).toBe(80);
  });
  it('every registered sprite has a distinct transparent 448x448 PNG and retained source/import record',()=>{
    for(const asset of outfitSpriteAssets){
      const bytes=readFileSync(file(`public${asset.path}`)),header=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
      expect(new TextDecoder().decode(bytes.subarray(1,4))).toBe('PNG');
      expect(header.getUint32(16)).toBe(448);expect(header.getUint32(20)).toBe(448);
      expect(bytes[25]).toBe(6); // RGBA, not an opaque reference illustration.
      const id=asset.path.split('/').at(-1)!.replace('.png','');
      expect(existsSync(file(`art/source/outfits-v1/${id}-source.png`))).toBe(true);
      const record=JSON.parse(new TextDecoder().decode(readFileSync(file(`art/source/outfits-v1/${id}-import.json`))));
      expect(record.boxes).toHaveLength(16);expect(record.baseline).toBe(104);
      expect(record.runtimeSize).toEqual([448,448]);expect(record.visualTop).toBeLessThanOrEqual(asset.visualTop??68);
    }
  });
});
