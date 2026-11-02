/** Presentation-only policy. Never lower resolution to make a cache fit. */
export type StaticCacheOptions = {resolution:number;antialias:false;scaleMode:'nearest'};
type CacheTarget = {
  cacheAsTexture(value:false|StaticCacheOptions):void;
  updateCacheTexture():void;
};
type Limits = {maxDimension:number;maxPixels:number};
export type StaticCacheView = {width:number;height:number;scale:number;resolution:number};
export class StaticSceneCache {
  private revision=0;
  private appliedRevision=-1;
  private activeResolution=0;
  private appliedWidth=0;
  private appliedHeight=0;
  private disposed=false;
  enabled=false;
  rebuilds=0;
  allocationPixels=0;
  reason:'empty'|'disabled'|'budget'|'cached'|'disposed'='empty';

  constructor(private readonly target:CacheTarget,private readonly limits:Limits) {}

  invalidate(){if(!this.disposed)this.revision++;}

  sync(view:StaticCacheView,allowed=true) {
    if(this.disposed)return;
    const resolution=view.scale*view.resolution;
    if(!allowed){this.disable('disabled');return;}
    if(![view.width,view.height,view.scale,view.resolution,resolution].every(v=>Number.isFinite(v)&&v>0)){
      this.disable('empty');return;
    }
    // Pixi's cache uses power-of-two backing textures. Budget the allocation,
    // not just the content rectangle (and reject unsafe/oversized dimensions).
    const width=2**Math.ceil(Math.log2(Math.ceil(view.width*resolution)));
    const height=2**Math.ceil(Math.log2(Math.ceil(view.height*resolution)));
    if(width>this.limits.maxDimension||height>this.limits.maxDimension||width*height>this.limits.maxPixels){
      this.disable('budget');return;
    }
    if(!this.enabled||resolution!==this.activeResolution){
      if(this.enabled)this.target.cacheAsTexture(false);
      this.target.cacheAsTexture({resolution,antialias:false,scaleMode:'nearest'});
      this.enabled=true;this.activeResolution=resolution;this.appliedRevision=this.revision;this.rebuilds++;
    }else if(this.appliedRevision!==this.revision||this.appliedWidth!==view.width||this.appliedHeight!==view.height){
      this.target.updateCacheTexture();this.appliedRevision=this.revision;this.rebuilds++;
    }
    this.appliedWidth=view.width;this.appliedHeight=view.height;
    this.allocationPixels=width*height;this.reason='cached';
  }

  destroy(){if(this.disposed)return;this.disable('disposed');this.disposed=true;}

  private disable(reason:StaticSceneCache['reason']){
    if(this.enabled)this.target.cacheAsTexture(false);
    this.enabled=false;this.activeResolution=0;this.appliedRevision=-1;this.allocationPixels=0;this.reason=reason;
  }
}
