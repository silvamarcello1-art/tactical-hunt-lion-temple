import { bindingForCode, abilityReasons } from '../data/actionBar';
import { AssistanceStore } from '../app/AssistanceStore';
import { heroes } from '../data/config';
import {abilityCatalog} from '../data/trainingSpells';
import {runeDefinitions,type RuneId} from '../data/runes';
import type { CombatEvent } from '../events/types';
import type { PlayerControlPort } from './PlayerControlPort';
import { RENDER_CONFIG } from '../game/renderConfig';
import { HeldInput, editableTarget, screenToTile } from './PlayerInput';
import { InteractionController } from './InteractionState';
import { MouseGesture } from './MouseGesture';
import { describeWorld } from '../data/worldDescriptions';
import type { ControlMode, InteractionTarget, PlayerIntent } from './PlayerCommand';

/** DOM adapter: captures input and submits commands, never edits actor state. */
export class PlayerControls {
  readonly held:HeldInput;
  readonly interaction = new InteractionController();
  private readonly mouse=new MouseGesture();
  private dragActor?:{id:string;x:number;y:number};
  private abort = new AbortController();
  private sequence = 0;
  private pendingStep?:{x:number;y:number};
  private inputAt = 0;
  private maxInputLatency = 0;
  private readonly assistanceStore=new AssistanceStore(localStorage);
  focusGame(){this.port.canvas.focus({preventScroll:true});}
  private assumeMovement() {if(this.mode==='AI')this.assumeManual();}
  get selectedActor() { return this.actorId; }
  get selectedTarget() { return this.target?.kind==='entity'?this.target.entityId:undefined; }
  assumeManual() {
    if (this.mode==='MANUAL') return;
    this.mode='MANUAL';this.modeSelect.value=this.mode;
    this.send({type:'control',mode:'MANUAL'});this.sync();
  }
  returnAuto() {
    this.clear();this.mode='AI';this.modeSelect.value='AI';
    this.send({type:'control',mode:'AI'});this.sync();
  }
  private actorId = 'knight';
  private mode:ControlMode = 'AI';
  private target?:InteractionTarget;
  private lastResultId?:string;
  private readonly panel = document.querySelector<HTMLElement>('#player-controls')!;
  private readonly actorSelect = document.querySelector<HTMLSelectElement>('#controlled-actor')!;
  private readonly modeSelect = document.querySelector<HTMLSelectElement>('#control-mode')!;
  private readonly status = document.querySelector<HTMLElement>('#interaction-status')!;
  private readonly menu = document.querySelector<HTMLElement>('#interaction-menu')!;
  private readonly debug = new URLSearchParams(location.search).get('debug')==='1' ? document.createElement('output') : undefined;

  constructor(private port:PlayerControlPort, private onSelect:(actorId:string) => void) {
    this.held=new HeldInput(!!port.training);
    if(this.debug){this.debug.id='control-debug';this.debug.style.cssText='display:block;font:10px monospace;white-space:normal;color:#bfd6da';this.panel.append(this.debug);}
    this.port.canvas.tabIndex=0;
    const signal = this.abort.signal;
    const listen = (target:EventTarget, name:string, callback:EventListener, capture = false) =>
      target.addEventListener(name,callback,{signal,capture});
    this.actorSelect.value = this.actorId;
    this.modeSelect.value = this.mode;
    for(const id of ['knight','druid','sorcerer']) {
      const o=this.assistanceStore.get(id);const sequence=++this.sequence;
      this.port.submit({commandId:`player-${sequence}`,sessionId:this.port.sessionId,actorId:id,ownerId:'local-player',sequence,logicalTick:this.port.time,intent:{type:'assistance',...o}});
    }
    for(const category of ['autoAttack','autoSpells'] as const) {
      const toggle=document.querySelector<HTMLButtonElement>(`[data-assistance="${category}"]`)!;
      listen(toggle,'click',()=>{
        const o=this.assistanceStore.get(this.actorId);o[category]=!o[category];
        const saved=this.assistanceStore.set(this.actorId,o);this.send({type:'assistance',...o});
        this.sync();if(!saved)this.status.textContent='Preferência aplicada nesta sessão; não foi possível salvar.';
        this.focusGame();
      });
    }
    listen(this.actorSelect,'change',() => {this.selectActor(this.actorSelect.value);this.actorSelect.blur();});
    listen(this.modeSelect,'change',() => {
      this.clear();
      this.mode = this.modeSelect.value as ControlMode;
      this.send({type:'control',mode:this.mode});
      this.sync();
      this.modeSelect.blur();
      this.focusGame();
    });
    listen(window,'keydown',(raw) => {
      const event = raw as KeyboardEvent;
      if(document.querySelector('.drawer:not([hidden]),dialog[open]')) {this.clear();return;}
      if (editableTarget(event.target)) return;
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if(['spell-targeting','use-with','rune-targeting','push-targeting'].includes(this.interaction.state.kind)) {this.interaction.cancel();this.status.textContent='Escolha de alvo cancelada.';this.sync();return;}
        this.stop();this.status.textContent='Parado.';return;
      }
      if (editableTarget(event.target) || !this.port.running || event.ctrlKey || event.metaKey || event.altKey) return;
      const rune=Object.values(runeDefinitions).find(r=>r.code===event.code);
      if(this.port.training&&rune){event.preventDefault();if(!event.repeat)this.armRune(rune.id);return;}
      if(this.port.training&&event.code==='Digit8'){event.preventDefault();if(!event.repeat)this.armPush();return;}
      if(this.port.training&&event.code==='Digit9'){event.preventDefault();if(!event.repeat)this.stop();return;}
      const slot=bindingForCode(this.actorId,event.code);
      if(slot) {event.preventDefault();if(!event.repeat) {this.panel.dataset.resolvedBinding=`${event.code}:${this.actorId}:${slot.ability.id}`;this.cast(slot.ability.id,event.shiftKey);}return;}
      if(event.code==='Numpad5') {event.preventDefault();if(!event.repeat)this.stop();return;}
      if (this.held.press(event.code)) {
        event.preventDefault();this.assumeMovement();
        if(!event.repeat) {this.pendingStep=this.held.direction();this.inputAt=performance.now();}
        this.sync();
      }
    });
    listen(window,'keyup',(raw) => { this.held.release((raw as KeyboardEvent).code); this.sync(); });
    listen(window,'blur',() => this.clear());
    listen(document,'visibilitychange',() => { if (document.hidden) this.clear(); });
    listen(document,'focusin',(event) => { if (editableTarget(event.target)) this.clear(); });
    listen(window,'hunt-event',(raw) => {
      const event = (raw as CustomEvent<CombatEvent>).detail;
      if(event.type==='push_cancelled'&&event.sourceId===this.actorId)this.status.textContent=this.reasonLabel(event.data?.reason??'blocked');
      if (event.type === 'floor_complete' || event.type === 'hunt_complete' ||
        (event.type === 'death' && (event.targetId === this.actorId || (this.target?.kind === 'entity' && this.target.entityId === event.targetId)))) this.clear();
    });
    listen(window,'hunt-time',() => {
      const last = this.port.results.at(-1);
      if (last && last.commandId !== this.lastResultId) {
        this.lastResultId = last.commandId;
        this.panel.dataset.lastCommandResult=last.reason;
        this.status.textContent=last.accepted?'Ação aceita.':this.reasonLabel(last.reason);
      }
      this.sync();
    });
    // Pointerdown only fires for the first pressed mouse button; MouseEvents
    // report each button of a chord. Keep Pixi picking from handling it twice.
    listen(this.port.canvas,'pointerdown',event=>event.stopImmediatePropagation(),true);
    listen(this.port.canvas,'pointerup',event=>event.stopImmediatePropagation(),true);
    listen(this.port.canvas,'mousedown',(raw)=>{
      if(document.querySelector('#equipment-drawer:not([hidden])')) return;
      const event=raw as MouseEvent;
      this.focusGame();
      if(this.port.training&&event.button===0&&!['rune-targeting','spell-targeting','push-targeting','use-with'].includes(this.interaction.state.kind)){
        const target=this.pointerTarget(event);if(target?.kind==='entity'&&target.entityId!==this.actorId)this.dragActor={id:target.entityId,x:event.clientX,y:event.clientY};
      }
      event.stopImmediatePropagation();
      if(this.mouse.down(event.button,event.buttons)==='look') {
        const target=this.pointerTarget(event);
        if(target) {this.send({type:'look',target});this.status.textContent=describeWorld(target.kind==='entity'?this.port.entities.find(e=>e.id===target.entityId):undefined,target.kind==='tile'?target.tile:undefined);}
      }
    },true);
    listen(this.port.canvas,'mousemove',(raw)=>{
      const event=raw as MouseEvent,point=this.port.worldPoint?.(event.clientX,event.clientY);
      const state=this.interaction.state;
      if(!point||!['rune-targeting','push-targeting'].includes(state.kind)){this.port.showAim?.();return;}
      const pickedId=state.kind==='rune-targeting'&&state.runeId==='sudden_death'?this.port.pickEntity?.(event.clientX,event.clientY):undefined;
      const picked=pickedId?this.port.entities.find(e=>e.id===pickedId):undefined;
      const tile=picked?{x:picked.tileX,y:picked.tileY}:{x:Math.round(point.x/32),y:Math.round(point.y/32)};
      const preview=state.kind==='rune-targeting'?this.port.runePreview?.(this.actorId,state.runeId,tile):undefined;
      this.port.showAim?.(tile,preview?.ready??true);
      if(preview)this.status.textContent=`${runeDefinitions[(state as {runeId:RuneId}).runeId].name} · tile ${tile.x},${tile.y} · ${preview.ready?'clique para usar':this.reasonLabel(preview.reason)}`;
    });
    listen(this.port.canvas,'mouseleave',()=>this.port.showAim?.());
    listen(window,'mouseup',(raw) => {
      if(document.querySelector('#equipment-drawer:not([hidden])')) {this.mouse.clear();return;}
      const event = raw as MouseEvent;
      const gesture=this.mouse.up(event.button);
      const drag=this.dragActor;this.dragActor=undefined;
      if(gesture==='select'&&drag&&event.target===this.port.canvas&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>=6){
        const point=this.port.worldPoint?.(event.clientX,event.clientY);
        if(point)this.send({type:'push',targetId:drag.id,tile:{x:Math.round(point.x/32),y:Math.round(point.y/32)}});
        this.interaction.cancel();this.sync();return;
      }
      if(!gesture || event.target!==this.port.canvas) return;
      event.stopImmediatePropagation();
      let target = this.pointerTarget(event);
      if (!target) return;
      // Terrain targeting always uses the pointed tile, not the taller sprite's hitbox.
      const state=this.interaction.state;
      if(state.kind==='rune-targeting'||state.kind==='push-targeting'&&state.targetId){
        const point=this.port.worldPoint?.(event.clientX,event.clientY);
        const pickedId=target.kind==='entity'?target.entityId:undefined;
        const entity=state.kind==='rune-targeting'&&state.runeId==='sudden_death'&&pickedId?this.port.entities.find(e=>e.id===pickedId):undefined;
        if(entity)target={kind:'tile',tile:{x:entity.tileX,y:entity.tileY}};
        else if(point)target={kind:'tile',tile:{x:Math.round(point.x/32),y:Math.round(point.y/32)}};
      }
      if(gesture==='engage') {
        if(target.kind==='entity'&&!heroes.some(h=>h.id===target.entityId)) {
          this.target=target;this.send({type:'attack',targetId:target.entityId});this.sync();
        }
        return;
      }
      const targeting = ['spell-targeting','use-with','rune-targeting','push-targeting'].includes(this.interaction.state.kind);
      const command = this.interaction.target(target);
      if (command) this.send(command);
      if (!targeting && target.kind==='entity' && heroes.some(hero=>hero.id===target.entityId)) {this.selectActor(target.entityId);return;}
      this.target = targeting ? undefined : target;
      if(!targeting&&target.kind==='tile') {
        this.assumeMovement();
        this.send({type:'move-to',tile:target.tile});
        this.port.showDestination?.(target.tile);
      }
      this.menu.hidden = true;
      this.status.textContent = this.interaction.state.kind==='push-targeting'?'Agora clique no tile de destino, ao lado do alvo.':targeting ? 'Comando enviado.' : this.targetLabel();
      this.sync();
    },true);
    listen(this.port.canvas,'contextmenu',(raw) => {
      const event = raw as MouseEvent;
      event.preventDefault();
      event.stopPropagation();
    });
    listen(this.port.canvas,'pointercancel',() => this.clear());
    this.port.beforeTick(() => {
      if(document.querySelector('.drawer:not([hidden]),dialog[open]')) {this.clear();return;}
      if (this.mode === 'AI') return;
      const held=this.held.direction();
      const {x:dx,y:dy}=held.x||held.y?held:this.pendingStep??held;
      this.pendingStep=undefined;
      if ((dx || dy) && this.port.entities.find(e=>e.id===this.actorId)?.alive) {
        this.send({type:'move',dx,dy});
        if(this.inputAt) {
          const latency=performance.now()-this.inputAt;this.maxInputLatency=Math.max(this.maxInputLatency,latency);
          this.panel.dataset.inputLatencyMs=latency.toFixed(1);this.panel.dataset.maxInputLatencyMs=this.maxInputLatency.toFixed(1);this.inputAt=0;
        }
      }
    });
    this.clear();
    this.onSelect(this.actorId);
  }

  get manual() { return this.mode !== 'AI'; }
  armPush(){if(!this.port.training||!this.port.running)return;this.held.clear();this.pendingStep=undefined;this.interaction.armPush();this.status.textContent='Empurrar: clique numa criatura/personagem adjacente e depois no tile de destino. Ou arraste o alvo.';this.sync();this.focusGame();}
  stopAction(){this.stop();this.focusGame();}
  armRune(runeId:RuneId){
    if(!this.port.training||!this.port.running)return;
    this.held.clear();this.pendingStep=undefined;this.interaction.armRune(runeId);
    this.status.textContent=`${runeDefinitions[runeId].name}: ${runeDefinitions[runeId].target==='enemy'?'clique no inimigo':'clique no tile'} (até ${runeDefinitions[runeId].range} tiles). ESC cancela.`;this.sync();this.focusGame();
  }
  selectActor(actorId:string) {
    if (!heroes.some(hero => hero.id === actorId)) return;
    this.clear();
    this.actorId = actorId;
    this.actorSelect.value = actorId;
    this.mode = this.port.controlOf(actorId).mode;
    this.modeSelect.value = this.mode;
    this.onSelect(actorId);
    this.sync();
  }
  cast(abilityId:string, targeting = false) {
    const ability = abilityCatalog(!!this.port.training).find(ability => ability.id === abilityId);
    const hero = heroes.find(hero => hero.id === this.actorId);
    if (!ability || ability.vocation !== hero?.role) {
      this.status.textContent = 'Selecione o personagem desta habilidade.';
      return;
    }
    const targetId=ability.group==='healing'||ability.group==='support'?this.actorId:this.target?.kind==='entity'?this.target.entityId:undefined;
    const available=this.port.abilityStatus(this.actorId,abilityId,targetId);
    if(targeting || available.reason==='ally-required' || (!targetId && available.reason==='no-target')) {
      this.held.clear();this.pendingStep=undefined;this.interaction.armSpell(abilityId);
      this.status.textContent=ability.targetRule==='ally-only'?'Heal Friend: escolha outro aliado; não funciona em você. ESC cancela.':'Clique no alvo da habilidade. ESC cancela.';
    } else if(!available.ready) this.status.textContent=abilityReasons[available.reason]??this.reasonLabel(available.reason);
    else {this.send({type:'cast',abilityId,targetId:targetId??this.actorId});this.status.textContent=`${ability.name}: solicitada.`;}
    this.sync();
  }
  clear() {
    this.held.clear(); this.mouse.clear();this.dragActor=undefined;this.pendingStep=undefined; this.inputAt=0; this.interaction.cancel(); this.target = undefined; this.menu.hidden = true;
    this.status.textContent = '';
    this.sync();
  }
  destroy() {
    if (this.abort.signal.aborted) return;
    this.clear(); this.debug?.remove(); this.abort.abort(); this.port.beforeTick();
  }
  private send(intent:PlayerIntent) {
    this.panel.dataset.lastIntent=intent.type;
    this.panel.dataset.commandCount=String(Number(this.panel.dataset.commandCount??0)+1);
    const sequence = ++this.sequence;
    const result = this.port.submit({
      commandId:`player-${sequence}`,sessionId:this.port.sessionId,actorId:this.actorId,
      ownerId:'local-player',sequence,logicalTick:this.port.time,intent,
    });
    if (!result.accepted) this.status.textContent = this.reasonLabel(result.reason);
    return result;
  }
  private stop() { this.clear();if(this.mode==='AI')this.assumeManual();this.send({type:'stop'}); }
  private pointerTarget(event:MouseEvent):InteractionTarget | undefined {
    const point=this.port.worldPoint?.(event.clientX,event.clientY);
    const tile = this.port.worldPoint ? point?{x:Math.round(point.x/32),y:Math.round(point.y/32)}:undefined : screenToTile({x:event.clientX,y:event.clientY},this.port.canvas.getBoundingClientRect(),RENDER_CONFIG.arena);
    if (!tile) return;
    const hit=this.port.pickEntity?.(event.clientX,event.clientY);
    const entity = this.port.entities.find(entity => entity.alive && (hit?entity.id===hit:entity.tileX === tile.x && entity.tileY === tile.y));
    return entity ? {kind:'entity',entityId:entity.id} : {kind:'tile',tile};
  }
  private targetLabel() {
    return this.target?.kind === 'entity' ? `Alvo: ${this.target.entityId}` : this.target?.kind === 'tile' ? `Tile ${this.target.tile.x}, ${this.target.tile.y}` : 'Selecione um alvo.';
  }
  private reasonLabel(reason:string) {
    const tactical:Record<string,string>={'no-field':'Nenhum campo removível neste tile. Magic Wall não é removível.','not-pushable':'Esta criatura não pode ser empurrada.','self-push':'Use movimento para deslocar seu próprio herói.','push-cooldown':'Aguarde a recarga do empurrão.','push-pending':'Já existe um empurrão pendente.','target-moved':'O alvo se moveu; empurrão cancelado.'};if(tactical[reason])return tactical[reason];
    const labels:Record<string,string> = {'training-only':'Runas disponíveis no treino local.','no-charges':'Sem cargas neste kit de treino.','ownership':'Assuma o controle Manual deste personagem.', 'session-ended':'A hunt terminou.', 'actor-dead':'Personagem derrotado.', 'invalid-target':'Alvo inválido.', 'out-of-range':'Alvo fora do alcance.', 'blocked':'Destino bloqueado por parede, criatura ou reserva.', 'invalid-destination':'Destino fora da arena.', 'ability-unavailable':'Habilidade indisponível: mana, cooldown ou configuração.', 'unsupported-interaction':'Esta interação ainda não está disponível.', 'action-pending':'Aguarde o próximo passo.'};
    return abilityReasons[reason] ?? labels[reason] ?? 'Comando indisponível.';
  }
  private sync() {
    const options=this.assistanceStore.get(this.actorId);
    for(const category of ['autoAttack','autoSpells'] as const) {
      const button=document.querySelector<HTMLButtonElement>(`[data-assistance="${category}"]`);
      if(button) {button.hidden=this.mode!=='ASSISTED';button.setAttribute('aria-pressed',String(options[category]));button.textContent=`${category==='autoAttack'?'Auto Attack':'Auto Magias'} ${options[category]?'ON':'OFF'}`;}
    }
    this.panel.dataset.autoAttack=String(options.autoAttack);this.panel.dataset.autoSpells=String(options.autoSpells);
    this.port.selectTarget(this.target?.kind === 'entity' ? this.target.entityId : undefined);
    this.panel.dataset.controlMode = this.mode;
    this.panel.dataset.controlledActor = this.actorId;
    this.panel.dataset.interactionState = this.interaction.state.kind;
    this.panel.dataset.heldKeys = String(this.held.size);
    this.panel.dataset.selectedTarget = this.target?.kind === 'entity' ? this.target.entityId : '';
    const target=this.port.entities.find(entity=>entity.id===this.selectedTarget);
    const targetStatus=document.querySelector('#target-status');
    if(targetStatus) targetStatus.textContent=target?`${target.name} · ${target.hp}/${target.maxHp} HP`:'';
    const aiming=['spell-targeting','rune-targeting','push-targeting'].includes(this.interaction.state.kind);
    this.port.canvas.style.cursor = aiming ? 'crosshair' : '';
    if(!aiming)this.port.showAim?.();
    if(this.debug)this.debug.textContent=`${this.actorId} ${this.mode} | ${this.panel.dataset.resolvedBinding??'-'} | ${this.panel.dataset.lastIntent??'-'}:${this.panel.dataset.lastCommandResult??'-'} | attack:${options.autoAttack} spells:${options.autoSpells} | t:${this.port.time.toFixed(0)}ms input:${this.panel.dataset.inputLatencyMs??'-'}ms`;
  }
}
