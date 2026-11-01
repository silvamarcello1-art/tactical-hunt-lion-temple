import {Application,Assets,Container,Graphics,Sprite,Text,type Texture} from 'pixi.js';
import {SpriteLibrary} from '../game/presentation/SpriteLibrary';
import {spriteId} from '../game/presentation/SpriteDefinition';
import {CombatPresentationSystem} from '../game/presentation/CombatPresentationSystem';
import {assetUrl} from '../game/assetUrl';
import {opaqueCellBounds} from '../game/presentation/cellSpriteFit';
import {pickGroundedBody} from './picking';
import type {CombatEngine} from '../combat/CombatEngine';
import type {CombatEvent,EntitySnapshot} from '../events/types';
import type {Biome} from './model';

export interface Landmark {id:string;name:string;x:number;y:number;kind:'exit'|'lore'|'npc'|'house'}
/** Presentation only: snapshots/events in; picking returns logical tiles. */
export class RogueRenderer {
  readonly app=new Application();readonly presentation=new CombatPresentationSystem();
  private library=new SpriteLibrary();private world=new Container();private ground=new Sprite();private marks=new Graphics();private bars=new Graphics();private fx=new Graphics();
  private actors=new Map<string,Sprite>();private labels=new Map<string,Text>();private numbers=new Map<string,Text>();private textures!:Record<Biome,Texture>;
  private camera={x:0,y:0,scale:1};private observer?:ResizeObserver;private hitUntil=0;private effects:{x:number;y:number;at:number;kind:string}[]=[];
  private blocked:{x:number;y:number}[]=[];
  private biome:Biome='coast';
  private initialized=false;
  private animationStarts=new Map<string,number>();
  setBlocked(tiles:{x:number;y:number}[],biome:Biome){this.biome=biome;this.hitUntil=0;this.animationStarts.clear();this.blocked=biome==='refuge'?[]:tiles.filter(b=>b.x>=11&&b.x<=19&&(b.y===5||b.y===12));}
  async init(host:HTMLElement){
    await this.app.init({resizeTo:host,background:'#061219',antialias:false,resolution:Math.min(2,devicePixelRatio),autoDensity:true});host.append(this.app.canvas);
    this.initialized=true;
    await this.library.load(['knight','druid','sorcerer','lion-guard','lion-oracle','hollow-regent']);
    const [coast,forest,refuge]=await Promise.all(['coast-v1','forest-v1','refuge-v1'].map(id=>Assets.load<Texture>(assetUrl(`/assets/roguelite/v1/${id}.png`))));
    this.textures={coast,forest,refuge};for(const t of Object.values(this.textures))t.source.scaleMode='nearest';
    this.app.stage.addChild(this.world);this.world.addChild(this.ground,this.marks,this.fx,this.bars);this.world.sortableChildren=true;this.ground.zIndex=-100;this.marks.zIndex=-10;this.fx.zIndex=10000;this.bars.zIndex=10001;
    this.observer=new ResizeObserver(()=>this.app.resize());this.observer.observe(host);
  }
  scene(biome:Biome){this.presentation.reset();this.effects=[];for(const s of this.actors.values())s.destroy();for(const t of this.labels.values())t.destroy();for(const t of this.numbers.values())t.destroy();this.actors.clear();this.labels.clear();this.numbers.clear();this.ground.texture=this.textures[biome];this.ground.position.set(-16,-16);this.ground.width=960;this.ground.height=576;}
  event(e:CombatEvent){this.presentation.handle(e);const actor=['damage','heal','death'].includes(e.type)?e.targetId:e.sourceId;if(actor&&['movement_started','basic_attack','cast','damage','heal','death'].includes(e.type))this.animationStarts.set(actor,e.time);if(['damage','heal','cast','death'].includes(e.type)){const v=this.presentation.entities.get(e.targetId??e.sourceId??'');if(v)this.effects.push({x:v.position.x,y:v.position.y,at:e.time,kind:e.type});}if(e.type==='damage'&&e.targetId==='knight')this.hitUntil=e.time+120;}
  tile(clientX:number,clientY:number){const r=this.app.canvas.getBoundingClientRect();return {x:Math.round(((clientX-r.left)*this.app.screen.width/r.width/this.camera.scale+this.camera.x)/32),y:Math.round(((clientY-r.top)*this.app.screen.height/r.height/this.camera.scale+this.camera.y)/32)};}
  pickEnemy(clientX:number,clientY:number,entities:EntitySnapshot[]){
    const r=this.app.canvas.getBoundingClientRect(),point={x:(clientX-r.left)*this.app.screen.width/r.width/this.camera.scale+this.camera.x,y:(clientY-r.top)*this.app.screen.height/r.height/this.camera.scale+this.camera.y};
    const bodies=entities.flatMap(e=>{const v=this.presentation.entities.get(e.id);return v?.alive?[{id:e.id,...opaqueCellBounds(this.library.definition(spriteId(e)),v.position)}]:[];});return pickGroundedBody(point,bodies);
  }
  render(engine:CombatEngine,time:number,landmarks:Landmark[],selected?:string){
    this.presentation.setTime(time);const p=this.presentation.entities.get('knight');const w=this.app.screen.width,h=this.app.screen.height;
    const scale=this.biome==='refuge'?Math.max(w/960,h/576):Math.max(w/800,h/480),vw=w/scale,vh=h/scale;
    this.camera={x:Math.max(-16,Math.min(944-vw,(p?.position.x??448)-vw/2)),y:Math.max(-16,Math.min(560-vh,(p?.position.y??288)-vh/2)),scale};
    if(this.biome==='refuge')this.camera.y=Math.max(-16,Math.min(560-vh,(p?.position.y??320)-352));
    this.world.scale.set(scale);this.world.position.set(-this.camera.x*scale,-this.camera.y*scale);this.marks.clear();this.bars.clear();this.fx.clear();
    this.world.alpha=time<this.hitUntil?.9:1;
    for(const [key,s] of this.actors)if(!key.startsWith('npc-'))s.visible=false;
    for(const b of this.blocked){const x=b.x*32,y=b.y*32;this.marks.poly([x-13,y-6,x-7,y-12,x+10,y-11,x+14,y+4,x+7,y+9,x-11,y+8]).fill(0x3c4840).stroke({color:0x8c9676,width:1,alpha:.6});this.marks.moveTo(x-9,y-7).lineTo(x+7,y-8).lineTo(x+10,y+1).stroke({color:0xa3ae89,width:1,alpha:.55});this.marks.rect(x-10,y+3,9,2).fill({color:0x61916b,alpha:.8});}
    for(const l of landmarks){const pulse=.5+Math.sin(time/450)*.2,color=l.kind==='exit'?0xffd28c:0x91d7c6;this.marks.ellipse(l.x*32,l.y*32,19,7).stroke({color,width:2,alpha:pulse});this.marks.circle(l.x*32,l.y*32-14,2).fill({color,alpha:.9});this.label(`landmark-${l.id}`,l.name,l.x*32,l.y*32-39,0xf3e1b6,11);if(l.kind==='npc'||l.kind==='house'){const id=l.id==='chronicler'?'sorcerer':l.kind==='house'?'knight':'druid';const key=`npc-${l.id}`;let s=this.actors.get(key);if(!s){s=new Sprite();this.actors.set(key,s);this.world.addChild(s);}this.pose(s,id,'idle','south',time);s.position.set(l.x*32,l.y*32);s.zIndex=l.y*32;}}
    for(const snapshot of engine.entities){const v=this.presentation.entities.get(snapshot.id);if(!v)continue;let s=this.actors.get(snapshot.id);if(!s){s=new Sprite();this.actors.set(snapshot.id,s);this.world.addChild(s);}const id=spriteId(snapshot);this.pose(s,id,v.animation,v.facing,time-(this.animationStarts.get(snapshot.id)??0));s.position.set(v.position.x,v.position.y);s.zIndex=v.position.y;s.alpha=v.alive?1:.25;s.visible=v.alive||v.animation==='dying';
      if(!v.alive)continue;this.marks.ellipse(v.position.x,v.position.y-1,9,3).fill({color:0x000b0c,alpha:.5});if(snapshot.id==='knight'||snapshot.id===selected)this.marks.ellipse(v.position.x,v.position.y,12,4).stroke({color:snapshot.id==='knight'?0x9de2d3:0xffac78,width:1.2});
      if(snapshot.id!=='knight'){const width=snapshot.role==='boss'?56:25;this.bars.rect(v.position.x-width/2,v.position.y-38,width,3).fill(0x132023).rect(v.position.x-width/2,v.position.y-38,width*Math.max(0,snapshot.hp/snapshot.maxHp),3).fill(snapshot.role==='boss'?0xe8b26d:0xd16d5d);}
    }
    for(const t of this.presentation.telegraphs.values())for(const tile of t.logicalTiles)this.fx.roundRect(tile.x*32-15,tile.y*32-15,30,30,3).fill({color:0xf06a45,alpha:.12+t.intensity*.3}).stroke({color:0xffaa70,width:1.4,alpha:.6});
    for(const p of this.presentation.projectiles.values())this.fx.circle(p.position.x,p.position.y-12,4).fill(0xffcf7d).circle(p.position.x,p.position.y-12,9).fill({color:0xf98449,alpha:.18});
    this.effects=this.effects.filter(e=>time-e.at<400);for(const e of this.effects){const age=(time-e.at)/400;this.fx.circle(e.x,e.y-10,5+age*21).stroke({color:e.kind==='heal'?0x9de6bb:e.kind==='death'?0xb488e9:0xffd493,width:2*(1-age),alpha:1-age});}
    const active=new Set<string>();for(const f of this.presentation.feedback.values()){active.add(f.id);const v=this.presentation.entities.get(f.targetId);if(!v)continue;let t=this.numbers.get(f.id);if(!t){t=new Text({text:f.kind==='dodge'?'ESQUIVA':String(f.amount??''),style:{fontFamily:'Georgia',fontSize:f.kind==='critical'?18:13,fontWeight:'bold',fill:f.kind==='heal'?0xa9edba:0xffddae,stroke:{color:0x132024,width:3}}});t.anchor.set(.5,1);t.zIndex=12000;this.world.addChild(t);this.numbers.set(f.id,t);}t.position.set(v.position.x,v.position.y-40-(time-f.createdAt)/35-f.stackIndex*12);t.alpha=Math.min(1,(f.expiresAt-time)/160);}
    for(const [id,t] of this.numbers)if(!active.has(id)){t.destroy();this.numbers.delete(id);}
    // Ambient motes use the presentation clock, so pause also freezes atmosphere.
    for(let i=0;i<22;i++){const x=(i*137+Math.sin(time/1900+i)*12)%920,y=50+(i*71+time/100*(i%2?1:-1)+10000)%440;this.fx.circle(x,y,1).fill({color:i%2?0xf4cd88:0x9fdccf,alpha:.3});}
  }
  private pose(s:Sprite,id:string,state:Parameters<SpriteLibrary['texture']>[1],facing:Parameters<SpriteLibrary['texture']>[2],time:number){const d=this.library.definition(id);s.texture=this.library.texture(id,state,facing,time);s.anchor.set(d.footAnchor.x,d.footAnchor.y);s.scale.set(d.visualWidth/d.frameSize*d.scale,d.visualHeight/d.frameSize*d.scale);}
  private label(id:string,value:string,x:number,y:number,color:number,size:number){let t=this.labels.get(id);if(!t){t=new Text({text:value,style:{fontFamily:'Georgia',fontSize:size,fill:color,stroke:{color:0x102026,width:3}}});t.anchor.set(.5,1);t.zIndex=10002;this.world.addChild(t);this.labels.set(id,t);}t.position.set(x,y);}
  destroy(){this.observer?.disconnect();this.library.destroy();if(this.initialized)this.app.destroy(true,{children:true,texture:false,textureSource:false});}
}
