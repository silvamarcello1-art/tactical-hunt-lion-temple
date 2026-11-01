/** Only imported and visually reviewed 4x4 RGBA atlases belong here.
 * Each atlas contains S/E/N/W columns and idle/left-step/right-step/attack rows.
 * Addon atlases are baked composites: level 2 must retain level 1 accessories.
 * This does not pretend that independently drawn images are separable layers.
 */
export interface OutfitSpriteAsset {
  outfitId:string;
  addonLevel:0|1|2;
  variantId:'base'|'dlc';
  spriteId:string;
  path:string;
  /** Room above the unchanged footpoint for hats, plumes, staffs and flags. */
  visualTop?:number;
}
export const outfitFrameSize=112;
export const outfitFootBaseline=104;
export const outfitSpriteAssets:readonly OutfitSpriteAsset[]=[
  {outfitId:'citizen',addonLevel:0,variantId:'base',spriteId:'outfit-citizen-base',path:'/assets/outfits/pixel-v1/citizen-base.png'},
  {outfitId:'citizen',addonLevel:1,variantId:'base',spriteId:'outfit-citizen-addon1',path:'/assets/outfits/pixel-v1/citizen-addon1.png'},
  {outfitId:'citizen',addonLevel:2,variantId:'base',spriteId:'outfit-citizen-addon2',path:'/assets/outfits/pixel-v1/citizen-addon2.png',visualTop:96},
  {outfitId:'warrior',addonLevel:0,variantId:'base',spriteId:'outfit-warrior-base',path:'/assets/outfits/pixel-v1/warrior-base.png'},
  {outfitId:'warrior',addonLevel:1,variantId:'base',spriteId:'outfit-warrior-addon1',path:'/assets/outfits/pixel-v1/warrior-addon1.png'},
  {outfitId:'warrior',addonLevel:2,variantId:'base',spriteId:'outfit-warrior-addon2',path:'/assets/outfits/pixel-v1/warrior-addon2.png',visualTop:79},
  {outfitId:'druid',addonLevel:0,variantId:'base',spriteId:'outfit-druid-base',path:'/assets/outfits/pixel-v1/druid-base.png'},
  {outfitId:'druid',addonLevel:1,variantId:'base',spriteId:'outfit-druid-addon1',path:'/assets/outfits/pixel-v1/druid-addon1.png'},
  {outfitId:'druid',addonLevel:2,variantId:'base',spriteId:'outfit-druid-addon2',path:'/assets/outfits/pixel-v1/druid-addon2.png'},
  {outfitId:'mage',addonLevel:0,variantId:'base',spriteId:'outfit-mage-base',path:'/assets/outfits/pixel-v1/mage-base.png'},
  {outfitId:'mage',addonLevel:1,variantId:'base',spriteId:'outfit-mage-addon1',path:'/assets/outfits/pixel-v1/mage-addon1.png',visualTop:75},
  {outfitId:'mage',addonLevel:2,variantId:'base',spriteId:'outfit-mage-addon2',path:'/assets/outfits/pixel-v1/mage-addon2.png',visualTop:96},
  {outfitId:'assassin',addonLevel:0,variantId:'base',spriteId:'outfit-assassin-base',path:'/assets/outfits/pixel-v1/assassin-base.png'},
  {outfitId:'assassin',addonLevel:1,variantId:'base',spriteId:'outfit-assassin-addon1',path:'/assets/outfits/pixel-v1/assassin-addon1.png'},
  {outfitId:'assassin',addonLevel:2,variantId:'base',spriteId:'outfit-assassin-addon2',path:'/assets/outfits/pixel-v1/assassin-addon2.png'},
  {outfitId:'hunter',addonLevel:0,variantId:'base',spriteId:'outfit-hunter-base',path:'/assets/outfits/pixel-v1/hunter-base.png'},
  {outfitId:'hunter',addonLevel:1,variantId:'base',spriteId:'outfit-hunter-addon1',path:'/assets/outfits/pixel-v1/hunter-addon1.png'},
  {outfitId:'hunter',addonLevel:2,variantId:'base',spriteId:'outfit-hunter-addon2',path:'/assets/outfits/pixel-v1/hunter-addon2.png'},
  {outfitId:'bolsonaro',addonLevel:0,variantId:'base',spriteId:'outfit-bolsonaro-base',path:'/assets/outfits/pixel-v1/bolsonaro-base.png'},
  {outfitId:'bolsonaro',addonLevel:1,variantId:'base',spriteId:'outfit-bolsonaro-addon1',path:'/assets/outfits/pixel-v1/bolsonaro-addon1.png'},
  {outfitId:'bolsonaro',addonLevel:2,variantId:'base',spriteId:'outfit-bolsonaro-addon2',path:'/assets/outfits/pixel-v1/bolsonaro-addon2.png'},
  {outfitId:'lula',addonLevel:0,variantId:'base',spriteId:'outfit-lula-base',path:'/assets/outfits/pixel-v1/lula-base.png'},
  {outfitId:'lula',addonLevel:1,variantId:'base',spriteId:'outfit-lula-addon1',path:'/assets/outfits/pixel-v1/lula-addon1.png'},
  {outfitId:'lula',addonLevel:2,variantId:'base',spriteId:'outfit-lula-addon2',path:'/assets/outfits/pixel-v1/lula-addon2.png'},
  {outfitId:'pope',addonLevel:0,variantId:'base',spriteId:'outfit-pope-base',path:'/assets/outfits/pixel-v1/pope-base.png'},
  {outfitId:'pope',addonLevel:1,variantId:'base',spriteId:'outfit-pope-addon1',path:'/assets/outfits/pixel-v1/pope-addon1.png',visualTop:75},
  {outfitId:'pope',addonLevel:2,variantId:'base',spriteId:'outfit-pope-addon2',path:'/assets/outfits/pixel-v1/pope-addon2.png',visualTop:85},
  {outfitId:'trump',addonLevel:0,variantId:'base',spriteId:'outfit-trump-base',path:'/assets/outfits/pixel-v1/trump-base.png'},
  {outfitId:'trump',addonLevel:1,variantId:'base',spriteId:'outfit-trump-addon1',path:'/assets/outfits/pixel-v1/trump-addon1.png',visualTop:72},
  {outfitId:'trump',addonLevel:2,variantId:'base',spriteId:'outfit-trump-addon2',path:'/assets/outfits/pixel-v1/trump-addon2.png',visualTop:75},
  {outfitId:'neymar',addonLevel:0,variantId:'base',spriteId:'outfit-neymar-base',path:'/assets/outfits/pixel-v1/neymar-base.png'},
  {outfitId:'neymar',addonLevel:1,variantId:'base',spriteId:'outfit-neymar-addon1',path:'/assets/outfits/pixel-v1/neymar-addon1.png'},
  {outfitId:'neymar',addonLevel:2,variantId:'base',spriteId:'outfit-neymar-addon2',path:'/assets/outfits/pixel-v1/neymar-addon2.png'},
  {outfitId:'neymar',addonLevel:0,variantId:'dlc',spriteId:'outfit-neymar-dlc',path:'/assets/outfits/pixel-v1/neymar-dlc.png'},
  {outfitId:'mbappe',addonLevel:0,variantId:'base',spriteId:'outfit-mbappe-base',path:'/assets/outfits/pixel-v1/mbappe-base.png'},
  {outfitId:'mbappe',addonLevel:1,variantId:'base',spriteId:'outfit-mbappe-addon1',path:'/assets/outfits/pixel-v1/mbappe-addon1.png'},
  {outfitId:'mbappe',addonLevel:2,variantId:'base',spriteId:'outfit-mbappe-addon2',path:'/assets/outfits/pixel-v1/mbappe-addon2.png'},
  {outfitId:'mbappe',addonLevel:0,variantId:'dlc',spriteId:'outfit-mbappe-dlc',path:'/assets/outfits/pixel-v1/mbappe-dlc.png',visualTop:79},
];

export function outfitSpriteAsset(outfitId:string,addonLevel:number,variantId:string) {
  return outfitSpriteAssets.find(asset=>asset.outfitId===outfitId&&asset.variantId===variantId&&(variantId==='dlc'||asset.addonLevel===addonLevel));
}
