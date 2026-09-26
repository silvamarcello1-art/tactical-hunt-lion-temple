import { actionSlots, abilityReasons } from '../data/actionBar';
import { heroes } from '../data/config';
import { abilities } from '../data/abilities';
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
  readonly held = new HeldInput();
  readonly interaction = new InteractionController();
  private readonly mouse=new MouseGesture();
  private abort = new AbortController();
  private sequence = 0;
  private pendingStep?:{x:number;y:number};
  private inputAt = 0;
  private maxInputLatency = 0;
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

  constructor(private port:PlayerControlPort, private onSelect:(actorId:string) => void) {
    const signal = this.abort.signal;
    const listen = (target:EventTarget, name:string, callback:EventListener, capture = false) =>
      target.addEventListener(name,callback,{signal,capture});
    this.actorSelect.value = this.actorId;
    this.modeSelect.value = this.mode;
    listen(this.actorSelect,'change',() => {this.selectActor(this.actorSelect.value);this.actorSelect.blur();});
    listen(this.modeSelect,'change',() => {
      this.clear();
      this.mode = this.modeSelect.value as ControlMode;
      this.send({type:'control',mode:this.mode});
      this.sync();
      this.modeSelect.blur();
    });
    listen(window,'keydown',(raw) => {
      const event = raw as KeyboardEvent;
      if (editableTarget(event.target)) return;
      if (event.key === 'Escape') { this.stop(); this.status.textContent = 'Parado.'; return; }
      if (editableTarget(event.target) || !this.port.running || event.ctrlKey || event.metaKey || event.altKey) return;
      const slot=actionSlots(this.actorId).find(slot=>event.code==='Digit'+slot.key || event.code==='Numpad'+slot.key);
      if(slot) {event.preventDefault();if(!event.repeat) this.cast(slot.ability.id,event.shiftKey);return;}
      if (this.held.press(event.code)) {
        event.preventDefault();this.assumeManual();
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
      if (event.type === 'floor_complete' || event.type === 'hunt_complete' ||
        (event.type === 'death' && (event.targetId === this.actorId || (this.target?.kind === 'entity' && this.target.entityId === event.targetId)))) this.clear();
    });
    listen(window,'hunt-time',() => {
      const last = this.port.results.at(-1);
      if (last && last.commandId !== this.lastResultId) {
        this.lastResultId = last.commandId;
        if (!last.accepted && last.reason !== 'blocked') this.status.textContent = this.reasonLabel(last.reason);
      }
      this.sync();
    });
    // Pointerdown only fires for the first pressed mouse button; MouseEvents
    // report each button of a chord. Keep Pixi picking from handling it twice.
    listen(this.port.canvas,'pointerdown',event=>event.stopImmediatePropagation(),true);
    listen(this.port.canvas,'pointerup',event=>event.stopImmediatePropagation(),true);
    listen(this.port.canvas,'mousedown',(raw)=>{
      const event=raw as MouseEvent;
      event.stopImmediatePropagation();
      if(this.mouse.down(event.button,event.buttons)==='look') {
        const target=this.pointerTarget(event);
        if(target) {this.send({type:'look',target});this.status.textContent=describeWorld(target.kind==='entity'?this.port.entities.find(e=>e.id===target.entityId):undefined,target.kind==='tile'?target.tile:undefined);}
      }
    },true);
    listen(window,'mouseup',(raw) => {
      const event = raw as MouseEvent;
      const gesture=this.mouse.up(event.button);
      if(!gesture || event.target!==this.port.canvas) return;
      event.stopImmediatePropagation();
      const target = this.pointerTarget(event);
      if (!target) return;
      if(gesture==='engage') {
        if(target.kind==='entity'&&!heroes.some(h=>h.id===target.entityId)) {
          this.target=target;this.send({type:'attack',targetId:target.entityId});this.sync();
        }
        return;
      }
      const targeting = this.interaction.state.kind === 'spell-targeting' || this.interaction.state.kind === 'use-with';
      const command = this.interaction.target(target);
      if (command) this.send(command);
      if (!targeting && target.kind==='entity' && heroes.some(hero=>hero.id===target.entityId)) {this.selectActor(target.entityId);return;}
      this.target = targeting ? undefined : target;
      if(!targeting&&target.kind==='tile') {
        this.send({type:'move-to',tile:target.tile});
        this.port.showDestination?.(target.tile);
      }
      this.menu.hidden = true;
      this.status.textContent = targeting ? 'Comando enviado.' : this.targetLabel();
      this.sync();
    },true);
    listen(this.port.canvas,'contextmenu',(raw) => {
      const event = raw as MouseEvent;
      event.preventDefault();
      event.stopPropagation();
    });
    listen(this.port.canvas,'pointercancel',() => this.clear());
    this.port.beforeTick(() => {
      if (this.mode === 'AI') return;
      const held=this.held.direction();
      const {x:dx,y:dy}=held.x||held.y?held:this.pendingStep??held;
      this.pendingStep=undefined;
      if (dx || dy) {
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
    const ability = abilities.find(ability => ability.id === abilityId);
    const hero = heroes.find(hero => hero.id === this.actorId);
    if (!ability || ability.vocation !== hero?.role) {
      this.status.textContent = 'Selecione o personagem desta habilidade.';
      return;
    }
    const targetId=ability.group==='healing'||ability.group==='support'?this.actorId:this.target?.kind==='entity'?this.target.entityId:undefined;
    const available=this.port.abilityStatus(this.actorId,abilityId,targetId);
    if(targeting || (!targetId && available.reason==='no-target')) {
      this.held.clear();this.pendingStep=undefined;this.interaction.armSpell(abilityId);
      this.status.textContent='Clique no alvo da habilidade. ESC cancela.';
    } else if(!available.ready) this.status.textContent=abilityReasons[available.reason]??this.reasonLabel(available.reason);
    else this.send({type:'cast',abilityId,targetId:targetId??this.actorId});
    this.sync();
  }
  clear() {
    this.held.clear(); this.mouse.clear();this.pendingStep=undefined; this.inputAt=0; this.interaction.cancel(); this.target = undefined; this.menu.hidden = true;
    this.status.textContent = '';
    this.sync();
  }
  destroy() {
    if (this.abort.signal.aborted) return;
    this.clear(); this.abort.abort(); this.port.beforeTick();
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
    const labels:Record<string,string> = {'ownership':'Assuma o controle Manual deste personagem.', 'session-ended':'A hunt terminou.', 'actor-dead':'Personagem derrotado.', 'invalid-target':'Alvo inválido.', 'out-of-range':'Alvo fora do alcance ou sem linha de visão.', 'ability-unavailable':'Habilidade indisponível: mana, cooldown ou configuração.', 'unsupported-interaction':'Esta interação ainda não está disponível.', 'action-pending':'Aguarde o próximo passo.'};
    return abilityReasons[reason] ?? labels[reason] ?? 'Comando indisponível.';
  }
  private sync() {
    this.port.selectTarget(this.target?.kind === 'entity' ? this.target.entityId : undefined);
    this.panel.dataset.controlMode = this.mode;
    this.panel.dataset.controlledActor = this.actorId;
    this.panel.dataset.interactionState = this.interaction.state.kind;
    this.panel.dataset.heldKeys = String(this.held.size);
    this.panel.dataset.selectedTarget = this.target?.kind === 'entity' ? this.target.entityId : '';
    const target=this.port.entities.find(entity=>entity.id===this.selectedTarget);
    const targetStatus=document.querySelector('#target-status');
    if(targetStatus) targetStatus.textContent=target?`${target.name} · ${target.hp}/${target.maxHp} HP`:'';
    this.port.canvas.style.cursor = this.interaction.state.kind === 'spell-targeting' ? 'crosshair' : '';
  }
}
