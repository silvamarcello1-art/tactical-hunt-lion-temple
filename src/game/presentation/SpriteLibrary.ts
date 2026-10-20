import { assetUrl } from '../assetUrl';
import { Assets, Rectangle, Texture } from 'pixi.js';
import type { AnimationClipDefinition } from './AnimationSet';
import { spriteAction, type SpriteDefinition } from './SpriteDefinition';
import type { VisualAnimationState, VisualFacing } from './CombatPresentationSystem';
import {pixelDefinition} from './pixelSprites';
import {outfitSpriteAssets,outfitFrameSize,outfitFootBaseline,type OutfitSpriteAsset} from '../../data/outfitSprites';

export function outfitDefinition(template:SpriteDefinition,asset:OutfitSpriteAsset):SpriteDefinition {
  const footAnchor={x:.5,y:outfitFootBaseline/outfitFrameSize};
  return {...template,id:asset.spriteId,spriteSet:asset.path,
    frameSize:outfitFrameSize,visualWidth:outfitFrameSize,visualHeight:outfitFrameSize,footAnchor,
    animations:{...template.animations,id:asset.spriteId,footAnchor},
    footprint:{...template.footprint,maxUpwardOverflow:outfitFootBaseline},
    effectAnchors:{...template.effectAnchors,head:{x:0,y:-(asset.visualTop??68)}},
  };
}

export function clipFrame(clip:AnimationClipDefinition,elapsed:number):string {
  const index = Math.floor(Math.max(0,elapsed)/clip.frameDuration);
  return clip.frames[clip.loop ? index % clip.frames.length : Math.min(index,clip.frames.length-1)];
}

/** Assets and frame cache only; animation is sampled by the existing logical clock. */
export class SpriteLibrary {
  private disposed = false;
  private definitions = new Map<string,SpriteDefinition>();
  private frames = new Map<string,Texture>();
  async load() {
    const definitions = await Assets.load<SpriteDefinition[]>(assetUrl('/assets/original/manifests/sprites.json'));
    const native=definitions.map(pixelDefinition);
    const template=native.find(d=>d.id==='knight')!;
    const outfits=outfitSpriteAssets.map(asset=>outfitDefinition(template,asset));
    await Promise.all([...native,...outfits].map(async definition => {
      const sheet = await Assets.load<Texture>(assetUrl(definition.spriteSet));
      if (this.disposed) return;
      sheet.source.scaleMode = 'nearest';
      this.definitions.set(definition.id,definition);
      for (const directions of Object.values(definition.animations.clips)) {
        for (const clip of Object.values(directions ?? {})) {
          for (const key of clip.frames) {
            const cacheKey = `${definition.id}/${key}`;
            if (this.frames.has(cacheKey)) continue;
            const [x,y] = key.split(':').map(Number);
            this.frames.set(cacheKey,new Texture({source:sheet.source,frame:new Rectangle(x*definition.frameSize,y*definition.frameSize,definition.frameSize,definition.frameSize)}));
          }
        }
      }
    }));
  }
  definition(id:string) {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`Missing sprite definition: ${id}`);
    return definition;
  }
  texture(id:string,state:VisualAnimationState,facing:VisualFacing,elapsed:number) {
    const definition = this.definition(id);
    const clip = definition.animations.clips[spriteAction(state)]?.[facing] ?? definition.animations.clips.idle?.[facing];
    if (!clip) throw new Error(`Missing cardinal clip: ${id}/${state}/${facing}`);
    return this.frames.get(`${id}/${clipFrame(clip,elapsed)}`)!;
  }
  destroy() {
    this.disposed = true;
    for (const texture of this.frames.values()) texture.destroy(false);
    this.frames.clear(); this.definitions.clear();
  }
}
