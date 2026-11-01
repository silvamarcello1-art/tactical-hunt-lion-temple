import {colorRegions,outfitPalettes,type CharacterAppearance} from '../../data/outfits';
/** Infrastructure for reviewed region masks. Mask 0 is PROTECTED (skin/metal/eyes).
 * Current flattened atlases have no reviewed masks, so this is never inferred
 * from hue/position and never applied as a global tint. */
export function swapOutfitPalette(rgba:Uint8ClampedArray,mask:Uint8Array,colors:CharacterAppearance['colors']) {
  if(rgba.length!==mask.length*4)throw new Error('Outfit mask dimensions mismatch');
  const output=new Uint8ClampedArray(rgba);
  for(let pixel=0;pixel<mask.length;pixel++){
    const region=colorRegions[mask[pixel]-1];if(!region)continue;
    const hex=outfitPalettes.find(p=>p.id===colors[region])?.hex;if(!hex)continue;
    const i=pixel*4,shade=Math.max(rgba[i],rgba[i+1],rgba[i+2])/255;
    for(let channel=0;channel<3;channel++)output[i+channel]=Math.round(parseInt(hex.slice(1+channel*2,3+channel*2),16)*shade);
  }
  return output;
}
