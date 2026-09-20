import { heroes } from '../data/config';
import { abilities } from '../data/abilities';
import type { CombatEvent } from '../events/types';
import type { PixiRenderer } from '../game/PixiRenderer';
import { RENDER_CONFIG } from '../game/renderConfig';
import { HeldInput, editableTarget, screenToTile } from './PlayerInput';
import { InteractionController } from './InteractionState';
import type { ControlMode, InteractionTarget, PlayerIntent } from './PlayerCommand';

/** DOM adapter: captures input and submits commands, never edits actor state. */
export class PlayerControls {
  readonly held = new HeldInput();
  readonly interaction = new InteractionController();
  private abort = new AbortController();
  private sequence = 0;
  private actorId = 'knight';
  private mode:ControlMode = 'AI';
  private target?:InteractionTarget;
  private lastResultId?:string;
  private readonly panel = document.querySelector<HTMLElement>('#player-controls')!;
  private readonly actorSelect = document.querySelector<HTMLSelectElement>('#controlled-actor')!;
  private readonly modeSelect = document.querySelector<HTMLSelectElement>('#control-mode')!;
  private readonly status = document.querySelector<HTMLElement>('#interaction-status')!;
  private readonly menu = document.querySelector<HTMLElement>('#interaction-menu')!;

  constructor(private renderer:PixiRenderer, private onSelect:(actorId:string) => void) {
    const signal = this.abort.signal;
    const listen = (target:EventTarget, name:string, callback:EventListener, capture = false) =>
      target.addEventListener(name,callback,{signal,capture});
    this.actorSelect.value = this.actorId;
    this.modeSelect.value = this.mode;
    listen(this.actorSelect,'change',() => this.selectActor(this.actorSelect.value));
    listen(this.modeSelect,'change',() => {
      this.clear();
      this.mode = this.modeSelect.value as ControlMode;
      this.send({type:'control',mode:this.mode});
      this.sync();
    });
    listen(document.querySelector('#player-stop')!,'click',() => this.stop());
    listen(document.querySelector('#player-attack')!,'click',() => this.order('attack'));
    listen(document.querySelector('#player-follow')!,'click',() => this.order('follow'));
    listen(this.menu,'click',(raw) => {
      const action = (raw.target as Element).closest<HTMLElement>('[data-interaction]')?.dataset.interaction;
      if (action === 'attack' || action === 'follow') this.order(action);
      if (action === 'look' && this.target) {
        this.send({type:'look',target:this.target});
        if (this.target.kind === 'entity') {
          const id = this.target.entityId;
          const entity = this.renderer.engine.entities.find(entity => entity.id === id);
          if (entity) this.status.textContent = `${entity.name} • HP ${entity.hp}/${entity.maxHp} • tile ${entity.tileX}, ${entity.tileY}`;
        } else this.status.textContent = `Tile ${this.target.tile.x}, ${this.target.tile.y}`;
      }
      this.menu.hidden = true;
    });
    listen(window,'keydown',(raw) => {
      const event = raw as KeyboardEvent;
      if (event.key === 'Escape') { this.clear(); this.status.textContent = 'Interação cancelada.'; return; }
      if (this.mode === 'AI' || editableTarget(event.target) || !this.renderer.player.isRunning || event.ctrlKey || event.metaKey || event.altKey) return;
      if (this.held.press(event.code)) { event.preventDefault(); this.sync(); }
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
      const last = this.renderer.engine.controlResults.at(-1);
      if (last && last.commandId !== this.lastResultId) {
        this.lastResultId = last.commandId;
        if (!last.accepted && last.reason !== 'blocked') this.status.textContent = this.reasonLabel(last.reason);
      }
      this.sync();
    });
    listen(this.renderer.app.canvas,'pointerup',(raw) => {
      if (this.mode === 'AI') return;
      const event = raw as PointerEvent;
      event.stopImmediatePropagation();
      if (event.button !== 0) return;
      const target = this.pointerTarget(event);
      if (!target) return;
      const targeting = this.interaction.state.kind === 'spell-targeting' || this.interaction.state.kind === 'use-with';
      const command = this.interaction.target(target);
      if (command) this.send(command);
      this.target = targeting ? undefined : target;
      this.menu.hidden = true;
      this.status.textContent = targeting ? 'Comando enviado.' : this.targetLabel();
      this.sync();
    },true);
    listen(this.renderer.app.canvas,'contextmenu',(raw) => {
      if (this.mode === 'AI') return;
      const event = raw as MouseEvent;
      event.preventDefault();
      this.target = this.pointerTarget(event);
      if (!this.target) return;
      this.interaction.select(this.target);
      this.menu.hidden = false;
      this.status.textContent = this.targetLabel();
      this.sync();
    });
    listen(this.renderer.app.canvas,'pointercancel',() => this.clear());
    listen(document.querySelector('#action-bar')!,'contextmenu',(raw) => {
      if (this.mode === 'AI') return;
      const button = (raw.target as Element).closest<HTMLElement>('[data-ability]');
      if (!button?.dataset.ability) return;
      raw.preventDefault();
      this.cast(button.dataset.ability, true);
    });
    this.renderer.beforeTick = () => {
      if (this.mode === 'AI') return;
      const {x:dx,y:dy} = this.held.direction();
      if (dx || dy) this.send({type:'move',dx,dy});
    };
    this.clear();
    this.onSelect(this.actorId);
  }

  get manual() { return this.mode !== 'AI'; }
  selectActor(actorId:string) {
    if (!heroes.some(hero => hero.id === actorId)) return;
    this.clear();
    this.actorId = actorId;
    this.actorSelect.value = actorId;
    this.mode = this.renderer.engine.controlOf(actorId).mode;
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
    if (!targeting && (this.target?.kind === 'entity' || ability.group === 'support')) {
      this.send({type:'cast',abilityId,targetId:this.target?.kind === 'entity' ? this.target.entityId : this.actorId});
    } else {
      this.held.clear();
      this.interaction.armSpell(abilityId);
      this.status.textContent = `${ability.name}: clique no alvo. ESC cancela.`;
    }
    this.sync();
  }
  clear() {
    this.held.clear(); this.interaction.cancel(); this.target = undefined; this.menu.hidden = true;
    this.status.textContent = 'WASD / setas • clique seleciona • botão direito abre ações';
    this.sync();
  }
  destroy() {
    if (this.abort.signal.aborted) return;
    this.clear(); this.abort.abort(); this.renderer.beforeTick = undefined;
  }
  private send(intent:PlayerIntent) {
    const sequence = ++this.sequence;
    const result = this.renderer.engine.submit({
      commandId:`player-${sequence}`,sessionId:this.renderer.engine.id,actorId:this.actorId,
      ownerId:'local-player',sequence,logicalTick:this.renderer.engine.time,intent,
    });
    if (!result.accepted) this.status.textContent = this.reasonLabel(result.reason);
    return result;
  }
  private order(type:'attack' | 'follow') {
    if (this.target?.kind !== 'entity') { this.status.textContent = 'Selecione uma entidade no mapa.'; return; }
    this.send({type,targetId:this.target.entityId});
  }
  private stop() { this.clear(); if (this.manual) this.send({type:'stop'}); }
  private pointerTarget(event:MouseEvent):InteractionTarget | undefined {
    const tile = screenToTile({x:event.clientX,y:event.clientY},this.renderer.app.canvas.getBoundingClientRect(),RENDER_CONFIG.arena);
    if (!tile) return;
    const entity = this.renderer.engine.entities.find(entity => entity.alive && entity.tileX === tile.x && entity.tileY === tile.y);
    return entity ? {kind:'entity',entityId:entity.id} : {kind:'tile',tile};
  }
  private targetLabel() {
    return this.target?.kind === 'entity' ? `Alvo: ${this.target.entityId}` : this.target?.kind === 'tile' ? `Tile ${this.target.tile.x}, ${this.target.tile.y}` : 'Selecione um alvo.';
  }
  private reasonLabel(reason:string) {
    const labels:Record<string,string> = {'ownership':'Assuma o controle Manual deste personagem.', 'session-ended':'A hunt terminou.', 'actor-dead':'Personagem derrotado.', 'invalid-target':'Alvo inválido.', 'out-of-range':'Alvo fora do alcance ou sem linha de visão.', 'ability-unavailable':'Habilidade indisponível: mana, cooldown ou configuração.', 'unsupported-interaction':'Esta interação ainda não está disponível.', 'action-pending':'Aguarde o próximo passo.'};
    return labels[reason] ?? 'Comando indisponível.';
  }
  private sync() {
    this.renderer.selectTarget(this.target?.kind === 'entity' ? this.target.entityId : undefined);
    this.panel.dataset.controlMode = this.mode;
    this.panel.dataset.controlledActor = this.actorId;
    this.panel.dataset.interactionState = this.interaction.state.kind;
    this.panel.dataset.heldKeys = String(this.held.size);
    this.panel.dataset.selectedTarget = this.target?.kind === 'entity' ? this.target.entityId : '';
    for (const id of ['player-attack','player-follow','player-stop']) {
      document.querySelector<HTMLButtonElement>(`#${id}`)!.disabled = this.mode === 'AI';
    }
    this.renderer.app.canvas.style.cursor = this.interaction.state.kind === 'spell-targeting' ? 'crosshair' : '';
  }
}
