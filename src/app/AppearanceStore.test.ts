import {describe,it,expect} from 'vitest';
import {AppearanceStore,APPEARANCE_KEY} from './AppearanceStore';
import {activeAddons,defaultAppearance,normalizeAppearance,outfits,resolveOutfit,reviewedSlot} from '../data/outfits';
import {swapOutfitPalette} from '../game/presentation/OutfitPalette';
import {pixelPreviewFrame,pixelDefinition} from '../game/presentation/pixelSprites';
import type {SpriteDefinition,SpriteAction} from '../game/presentation/SpriteDefinition';

const storage=()=>{const data=new Map<string,string>();return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};};
describe('cosmetic appearance contracts',()=>{
  it('keeps the 12 requested references separate from 3 reviewed native sprites',()=>{
    expect(outfits.filter(o=>o.reference)).toHaveLength(12);expect(outfits.filter(o=>o.nativeSprite)).toHaveLength(3);
    for(const outfit of outfits.filter(o=>o.reference)){
      expect(outfit.variants.every(v=>v.slots.length===0)).toBe(true);
      expect(outfit.addons.every(a=>a.slots.length===0)).toBe(true);
    }
  });
  it.each(outfits.filter(o=>o.reference).map(o=>o.id))('addon2 composes addon1 for %s',id=>{
    const a={...defaultAppearance('knight'),outfitId:id,addonLevel:1 as const};
    const first=activeAddons(a).flatMap(a=>a.accessories);
    const complete=activeAddons({...a,addonLevel:2}).flatMap(a=>a.accessories);
    expect(complete).toHaveLength(2);for(const item of first)expect(complete).toContain(item);
    expect(activeAddons({...a,addonLevel:0})).toEqual([]);
  });
  it('persists each hero independently without touching old economic saves',()=>{
    const s=storage();s.setItem('tactical-hunt-equipment-v2','old-economy');
    const store=new AppearanceStore(s),a={...store.get('knight'),outfitId:'citizen',addonLevel:2 as const};
    expect(store.set('knight',a)).toBe(true);a.colors.primary='ember';
    const reload=new AppearanceStore(s);expect(reload.get('knight').outfitId).toBe('citizen');
    expect(reload.get('knight').colors.primary).toBe('original');expect(reload.get('druid')).toEqual(defaultAppearance('druid'));
    expect(s.getItem('tactical-hunt-equipment-v2')).toBe('old-economy');
  });
  it('validates removed outfits, malicious colors, variants and invalid addons',()=>{
    expect(normalizeAppearance({outfitId:'removed'},'druid')).toEqual(defaultAppearance('druid'));
    const a=normalizeAppearance({outfitId:'citizen',addonLevel:99,variantId:'dlc',colors:{primary:'url(evil)',head:'ember'}},'knight');
    expect(a.addonLevel).toBe(0);expect(a.variantId).toBe('base');expect(a.colors.primary).toBe('original');expect(a.colors.head).toBe('ember');
  });
  it('keeps DLC independent of addons',()=>{
    const a=normalizeAppearance({...defaultAppearance('knight'),outfitId:'neymar',addonLevel:2,variantId:'dlc'},'knight');
    expect(a.variantId).toBe('dlc');expect(activeAddons(a)).toHaveLength(2);
  });
  it('old saves need no migration or writes; corrupt/future saves cannot break sprites',()=>{
    const s=storage();expect(new AppearanceStore(s).get('knight')).toEqual(defaultAppearance('knight'));expect(s.data.size).toBe(0);
    s.setItem(APPEARANCE_KEY,'{broken');expect(new AppearanceStore(s).get('druid')).toEqual(defaultAppearance('druid'));
    s.setItem(APPEARANCE_KEY,'{"version":99}');const future=new AppearanceStore(s);
    expect(future.set('knight',defaultAppearance('knight'))).toBe(false);expect(s.getItem(APPEARANCE_KEY)).toBe('{"version":99}');
  });
  it('storage failures leave a usable session and visible warning',()=>{
    const store=new AppearanceStore({getItem:()=>null,setItem:()=>{throw new Error('quota');}});
    expect(store.set('knight',{...defaultAppearance('knight'),outfitId:'mage'})).toBe(false);
    expect(store.get('knight').outfitId).toBe('mage');expect(store.warning).toContain('sessão');
  });
  it('resolves pending reference to actual hero, never fabricating a direction or accessory',()=>{
    expect(resolveOutfit({...defaultAppearance('druid'),outfitId:'citizen',addonLevel:2},'druid').spriteId).toBe('druid');
    const slots=[{facing:'south' as const,actions:['walk' as const],asset:'approved.png',reviewed:true}];
    expect(reviewedSlot(slots,'north','walk')).toBeUndefined();expect(reviewedSlot(slots,'south-east','walk')).toBeUndefined();
    expect(reviewedSlot(slots,'south','cast')).toBeUndefined();expect(reviewedSlot(slots,'south','walk')?.asset).toBe('approved.png');
    expect(reviewedSlot([{...slots[0],reviewed:false}],'south','walk')).toBeUndefined();
  });
  it('masked palette swaps ONLY declared regions and preserves protected pixels, alpha and source',()=>{
    const pixels=new Uint8ClampedArray([220,170,130,255,255,255,255,128,90,90,90,0]);
    const before=pixels.slice(),colors={...defaultAppearance('knight').colors,primary:'ember'};
    const changed=swapOutfitPalette(pixels,new Uint8Array([0,2,0]),colors);
    expect([...changed.slice(0,4)]).toEqual([...pixels.slice(0,4)]);expect([...changed.slice(4,8)]).toEqual([169,78,67,128]);
    expect(changed.slice(8)).toEqual(pixels.slice(8));expect(pixels).toEqual(before);
    expect(()=>swapOutfitPalette(pixels,new Uint8Array(1),colors)).toThrow('dimensions');
  });
  it('preview samples identical cardinal frames to the existing renderer, without mirroring',()=>{
    const base={entityType:'character',id:'knight',footprint:{}} as SpriteDefinition;
    const def=pixelDefinition(base);
    for(const action of ['idle','walk','attack','cast'] as SpriteAction[])for(const facing of ['south','east','north','west'] as const){
      const clip=def.animations.clips[action]![facing]!;
      for(const time of [0,110,330,1000]){
        const index=Math.floor(time/clip.frameDuration),key=clip.frames[clip.loop?index%clip.frames.length:Math.min(index,clip.frames.length-1)];
        const frame=pixelPreviewFrame(action,facing,time);expect(`${frame.x}:${frame.y}`).toBe(key);
      }
    }
  });
});
