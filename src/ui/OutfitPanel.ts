import {AppearanceStore} from '../app/AppearanceStore';
import {activeAddons,colorRegions,outfitById,outfitPalettes,outfits,resolveOutfit,type CharacterAppearance} from '../data/outfits';
import {heroes} from '../data/config';
import {assetUrl} from '../game/assetUrl';
import type {SpriteAction} from '../game/presentation/SpriteDefinition';
import {pixelPreviewFrame} from '../game/presentation/pixelSprites';
import {outfitSpriteAssets,outfitFrameSize} from '../data/outfitSprites';

const directions=['south','east','north','west'] as const;
const regions={head:'Cabeça',primary:'Principal',secondary:'Secundária',legs:'Pernas',detail:'Detalhes'};
/** Draft-only inspector: its hero tabs must NEVER call combat selection. */
export class OutfitPanel {
  readonly dialog=document.createElement('dialog');
  private hero='knight';
  private draft!:CharacterAppearance;
  private direction=0;
  private action:SpriteAction='idle';
  private frame=0;
  private startedAt=0;
  private lastDraw=0;
  private images=new Map<string,HTMLImageElement>();
  private returnFocus?:HTMLElement;
  private message='';
  constructor(private store:AppearanceStore,private apply:(hero:string)=>void){
    this.dialog.id='outfit-dialog';this.dialog.setAttribute('aria-labelledby','outfit-title');
    document.body.append(this.dialog);
    this.dialog.addEventListener('close',()=>{cancelAnimationFrame(this.frame);this.returnFocus?.focus();});
    this.dialog.addEventListener('keydown',e=>e.stopPropagation());
    this.dialog.addEventListener('click',e=>{
      const button=(e.target as Element).closest<HTMLButtonElement>('button');if(!button)return;
      if(button.dataset.outfitHero){this.hero=button.dataset.outfitHero;this.draft=store.get(this.hero);this.message='';}
      if(button.dataset.outfit){this.draft.outfitId=button.dataset.outfit;this.draft.variantId='base';this.draft.addonLevel=0;}
      if(button.dataset.addon)this.draft.addonLevel=Number(button.dataset.addon) as 0|1|2;
      if(button.dataset.rotate)this.direction=(this.direction+Number(button.dataset.rotate)+4)%4;
      if(button.dataset.motion){this.action=button.dataset.motion as SpriteAction;this.startedAt=performance.now();}
      if(button.dataset.variant)this.draft.variantId=button.dataset.variant as 'base'|'dlc';
      if(button.dataset.close!==undefined){this.dialog.close();return;}
      if(button.dataset.apply!==undefined){
        store.set(this.hero,this.draft);this.apply(this.hero);
        this.message=store.warning||'Preferências salvas. '+(resolveOutfit(this.draft,this.hero).fallback?'Arte pendente: sprite original mantido.':'Sprite aplicado ao mundo.');
      }
      this.render();
      const marker=button.dataset;
      const focusSelector=marker.rotate?'[data-rotate="'+marker.rotate+'"]':marker.addon?'[data-addon="'+marker.addon+'"]':marker.outfit?'[data-outfit="'+marker.outfit+'"]':marker.apply!==undefined?'[data-apply]':undefined;
      if(focusSelector)this.dialog.querySelector<HTMLButtonElement>(focusSelector)?.focus();
    });
    this.dialog.addEventListener('change',e=>{
      const select=e.target as HTMLSelectElement;
      if(select.dataset.colorRegion){this.draft.colors[select.dataset.colorRegion as keyof CharacterAppearance['colors']]=select.value;this.render();this.dialog.querySelector<HTMLSelectElement>(`[data-color-region="${select.dataset.colorRegion}"]`)?.focus();}
    });
  }
  open(hero:string){
    this.hero=hero;this.draft=this.store.get(hero);this.message='';this.returnFocus=document.activeElement as HTMLElement;
    this.render();this.dialog.showModal();this.startedAt=performance.now();this.lastDraw=0;
    this.frame=requestAnimationFrame(this.animate);
  }
  private render(){
    const resolved=resolveOutfit(this.draft,this.hero),def=resolved.definition,reference=def.reference;
    const addon=activeAddons(this.draft).flatMap(a=>a.accessories);
    // The source illustration stays intact. CSS presents a labelled front-only
    // reference, NEVER a runtime atlas or fabricated back/diagonal production art.
    const variantCol=this.draft.variantId==='dlc'?3:this.draft.addonLevel;
    const compact=reference?.column===1&&reference.row>=4;
    const cropX=reference?(reference.column===0?[148,277,411][variantCol]:compact?[690,794,896,1000][variantCol]:[703,832,963][variantCol]):0;
    const cropY=reference?[94,330,574,810,1040,1254][reference.row]:0;
    const cropHeight=reference?[184,196,188,180,160,140][reference.row]:160;
    this.dialog.innerHTML=`<header><div><small>ATELIER · COSMÉTICOS</small><h2 id="outfit-title">Outfits</h2></div><button data-close aria-label="Fechar outfits">×</button></header>
      <nav class="outfit-heroes" aria-label="Personagem inspecionado">${heroes.map(h=>`<button data-outfit-hero="${h.id}" aria-pressed="${h.id===this.hero}">${h.name}</button>`).join('')}</nav>
      <div class="outfit-columns"><nav class="outfit-list" aria-label="Catálogo de outfits">${outfits.map(o=>`<button data-outfit="${o.id}" aria-pressed="${o.id===def.id}"><span>${o.name}</span><small>${o.nativeSprite||outfitSpriteAssets.some(a=>a.outfitId===o.id)?'Sprite disponível':'Referência · arte pendente'}</small></button>`).join('')}</nav>
      <section class="outfit-studio"><h3>${def.name}</h3><div class="outfit-stages">
      ${reference?`<figure><div class="outfit-reference" role="img" aria-label="Referência frontal ${def.name}, ${this.draft.variantId==='dlc'?'DLC':'Addon '+this.draft.addonLevel}" style="width:${compact?106:reference.column===0?138:150}px;height:${cropHeight}px;background-image:url('${assetUrl('/assets/outfits/reference-atlas.png')}');background-position:-${cropX}px -${cropY}px"></div><figcaption>Ilustração frontal · não animada</figcaption></figure>`:''}
      <figure><canvas id="outfit-preview" width="160" height="160" aria-label="Sprite animado ${resolved.spriteId}" data-rendered-sprite="${resolved.spriteId}" data-facing="${directions[this.direction]}" data-motion="${this.action}"></canvas><figcaption>${resolved.fallback?'Fallback no mundo':'Sprite no mundo'} · <span>${directions[this.direction]}</span></figcaption></figure></div>
      <div class="outfit-toolbar"><button data-rotate="-1" aria-label="Girar à esquerda">←</button><span>4 direções · sem diagonais</span><button data-rotate="1" aria-label="Girar à direita">→</button></div>
      <div class="outfit-toolbar">${(['idle','walk','attack','cast'] as const).map(a=>`<button data-motion="${a}" aria-pressed="${this.action===a}">${a}</button>`).join('')}</div>
      <p class="outfit-limit">${resolved.fallback?'Frames desta combinação ainda pendentes. O mundo mantém o sprite original do herói; girar anima apenas esse fallback.':resolved.asset?'Sprite deste traje aplicado no mundo: quatro direções, passos e ataque/conjuração. Addons usam atlas compostos; cores aguardam máscaras revisadas.':'Atlas original existente: idle/walk/attack/cast cardinais. Addons de referência não são aplicados a este sprite.'}</p>
      </section></div>
      <section class="outfit-addons"><h3>Addons</h3><div>${[0,1,2].map(a=>`<button data-addon="${a}" aria-pressed="${this.draft.addonLevel===a}" ${a>0&&!def.addons.length?'disabled':''}>${a?'Addon '+a:'Base'}</button>`).join('')}${def.variants.length>1?def.variants.map(v=>`<button data-variant="${v.id}" aria-pressed="${this.draft.variantId===v.id}">${v.label}</button>`).join(''):''}</div><p>${this.draft.variantId==='dlc'?'DLC: traje independente; addons da base preservados como preferência.':(addon.join(' + ')||'Sem acessórios adicionais')}${resolved.fallback?' · slots aguardando arte validada':''}</p></section>
      <section class="outfit-colors"><h3>Paleta planejada</h3><div>${colorRegions.map(region=>`<label>${regions[region]}<select data-color-region="${region}">${outfitPalettes.map(p=>`<option value="${p.id}" ${this.draft.colors[region]===p.id?'selected':''}>${p.label}</option>`).join('')}</select><i style="background:${outfitPalettes.find(p=>p.id===this.draft.colors[region])!.hex||'#8a806b'}"></i></label>`).join('')}</div><small>Paleta salva para futura arte com máscaras. Sem máscaras revisadas: nenhuma recoloração visual; pele, olhos e metais intactos.</small></section>
      <footer><p id="outfit-status" role="status">${this.message||this.store.warning||'Prévia local. Aplicar salva somente a aparência deste personagem; não altera combate.'}</p><button data-apply>${resolved.fallback?'Salvar com fallback':'Aplicar'}</button></footer>`;
    this.draw(performance.now());
  }
  private animate=(time:number)=>{
    if(!this.dialog.open)return;
    if(time-this.lastDraw>=80){this.draw(time);this.lastDraw=time;}
    this.frame=requestAnimationFrame(this.animate);
  };
  private draw(time:number){
    const canvas=this.dialog.querySelector<HTMLCanvasElement>('#outfit-preview');if(!canvas)return;
    const resolved=resolveOutfit(this.draft,this.hero),id=resolved.spriteId;
    let image=this.images.get(id);
    if(!image){
      if(this.images.size>=8)this.images.delete(this.images.keys().next().value!);
      image=new Image();image.src=assetUrl(resolved.asset?.path??`/assets/original/pixel/${id}-v1.png`);this.images.set(id,image);
    }
    const ctx=canvas.getContext('2d');if(!ctx||!image.complete||!image.naturalWidth)return;
    const frame=pixelPreviewFrame(this.action,directions[this.direction],time-this.startedAt);
    ctx.clearRect(0,0,160,160);ctx.imageSmoothingEnabled=false;
    const cell=resolved.asset?outfitFrameSize:80;
    ctx.drawImage(image,frame.x*cell,frame.y*cell,cell,cell,0,0,160,160);
    canvas.dataset.frame=`${frame.x}:${frame.y}`;
  }
}
