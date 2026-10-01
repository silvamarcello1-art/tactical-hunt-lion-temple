import { Graphics, Rectangle, type Application, type Texture } from 'pixi.js';

/** Original geometric VFX. All frames share a 64px pivot; no external atlas. */
export class OriginalEffects {
  readonly textures:Record<string,Texture> = {};
  create(app:Application) {
    const colors:Record<string,number>={earth:0x92ba72,physical:0xd5c4a1,holy:0xcfb77d,heal:0x8cbd91,ice:0x91cbd4,fire:0xd99657,energy:0xa398d2};
    for(const [key,color] of Object.entries(colors)) for(let frame=0;frame<4;frame++) {
      const g=new Graphics();const r=8+frame*3;
      g.circle(32,32,r).stroke({color,width:1.4,alpha:.7-frame*.1});
      if(key==='fire') g.poly([17,34,29,29,25,21,44,32,30,43,32,36]).fill({color,alpha:.9});
      else if(key==='ice') for(let i=-1;i<=1;i++) g.poly([32+i*11,18,36+i*11,32,32+i*11,41,28+i*11,32]).fill({color,alpha:.85});
      else if(key==='energy') g.moveTo(14,35).lineTo(27,26).lineTo(32,36).lineTo(49,27).stroke({color,width:3});
      else if(key==='heal') g.moveTo(32,21).lineTo(32,43).moveTo(21,32).lineTo(43,32).stroke({color,width:3});
      else g.arc(32,32,r+4,-1.8,.7).stroke({color,width:3});
      g.circle(32,32,3).fill({color:0xfff2cc,alpha:.8});
      this.textures[`${key}-${frame}`]=app.renderer.generateTexture({target:g,frame:new Rectangle(0,0,64,64),resolution:1});g.destroy();
    }
  }
  destroy(){for(const texture of Object.values(this.textures)) texture.destroy(true);}
}
