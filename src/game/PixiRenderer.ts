import {
  AnimatedSprite,
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Spritesheet,
  Text,
  TextStyle,
  Texture,
  type Ticker,
} from 'pixi.js';
import { CombatEngine } from '../combat/CombatEngine';
import { TILE_SIZE } from '../combat/tiles';
import type { AbilityPreferences } from '../data/abilities';
import { HUNT_LAYOUT_CONFIG } from '../data/config';
import { EventPlayer } from '../events/EventPlayer';
import type {
  CombatEvent,
  EntitySnapshot,
  HuntResult,
  Point,
} from '../events/types';
import { RENDER_CONFIG } from './renderConfig';

export type EntityVisualState =
  | 'idle'
  | 'moving'
  | 'attacking'
  | 'casting'
  | 'healing'
  | 'hurt'
  | 'dead';

type Unit = {
  body: Container;
  sprite: Sprite | AnimatedSprite;
  spriteKey: string;
  facing: DirectionName;
  state: EntityVisualState;
  targetId?: string;
  hp: Graphics;
  mana?: Graphics;
  selection?: Graphics;
  debugLabel?: Text;
  hpWidth: number;
  hpY: number;
  manaY?: number;
  maxHp: number;
  currentHp: number;
  maxMana: number;
  currentMana: number;
  hero: boolean;
};

type DirectionName = 'south' | 'east' | 'north' | 'west';

type Tween = {
  elapsed: number;
  duration: number;
  update: (progress: number) => void;
  done?: () => void;
};

type RendererOptions = {
  debugEnabled?: boolean;
  selectedHeroId?: string;
};

export class PixiRenderer {
  readonly app = new Application();
  readonly result: HuntResult;
  readonly units = new Map<string, Unit>();
  readonly player: EventPlayer;

  private floorText!: Text;
  private bossFill?: Graphics;
  private tweens: Tween[] = [];
  private outfitSheet!: Spritesheet;
  private effectSheet!: Spritesheet;
  private heroAtlas!: Texture;
  private tileTextures = new Map<string, Texture>();
  private parent?: HTMLElement;
  private destroyed = false;
  private selectedHeroId: string;
  private readonly debugEnabled: boolean;
  private readonly tickerHandler = (ticker: Ticker) => {
    if (this.destroyed) return;
    const timelineWasRunning = this.player.isRunning;
    this.player.update(ticker.deltaMS);
    if (timelineWasRunning || this.player.completed) {
      this.updateTweens(ticker.deltaMS);
    }
  };

  constructor(preferences: AbilityPreferences, options: RendererOptions = {}) {
    this.debugEnabled =
      options.debugEnabled ?? RENDER_CONFIG.arena.debugEnabled;
    this.selectedHeroId = options.selectedHeroId ?? 'knight';
    this.result = new CombatEngine(803, preferences).run();
    this.player = new EventPlayer(
      this.result.events,
      (event) => this.applyEvent(event),
      (ms) =>
        window.dispatchEvent(new CustomEvent('hunt-time', { detail: ms })),
    );
  }

  async mount(parent: HTMLElement) {
    this.parent = parent;
    await this.app.init({
      width:RENDER_CONFIG.arena.width,
      height:RENDER_CONFIG.arena.height,
      background:'#111611',
      antialias:false,
      resolution:Math.min(
        window.devicePixelRatio,
        RENDER_CONFIG.arena.maxResolution,
      ),
      autoDensity:true,
    });
    if (this.destroyed) return;
    await this.loadTibiaAssets();
    if (this.destroyed) return;
    parent.replaceChildren(this.app.canvas);
    this.drawArena();
    if (this.debugEnabled) this.drawDebugOverlay();
    this.floorText = this.label('PREPARAÇÃO', 13, '#f0d77a');
    this.floorText.position.set(18, 14);
    this.floorText.zIndex = 60;
    this.app.stage.addChild(this.floorText);
    this.app.stage.sortableChildren = true;
    this.app.ticker.add(this.tickerHandler);
    parent.dataset.debugEnabled = String(this.debugEnabled);
    this.syncDiagnostics();
    window.dispatchEvent(new CustomEvent('hunt-ready', { detail:this.result }));
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.player.dispose();
    this.tweens = [];
    this.units.clear();
    this.bossFill = undefined;
    this.app.ticker?.remove(this.tickerHandler);
    try {
      this.app.destroy(true, { children:true });
    } catch {
      // Pixi may not be fully initialized when a restart interrupts asset loading.
    }
    if (this.parent) {
      this.parent.dataset.unitCount = '0';
      this.parent.dataset.stageChildren = '0';
      this.parent.dataset.tweenCount = '0';
      this.parent.dataset.outOfBounds = '0';
    }
  }

  selectHero(heroId: string) {
    this.selectedHeroId = heroId;
    for (const [id, unit] of this.units) {
      if (unit.hero && unit.selection) {
        unit.selection.visible = id === heroId;
      }
    }
    if (this.parent) this.parent.dataset.selectedHero = heroId;
  }

  private async loadTibiaAssets() {
    const [outfits, effects, heroAtlas] = await Promise.all([
      Assets.load<Spritesheet>('/assets/tibia/outfits.json'),
      Assets.load<Spritesheet>('/assets/tibia/effects.json'),
      Assets.load<Texture>('/assets/character-atlas.png'),
    ]);
    this.outfitSheet = outfits;
    this.effectSheet = effects;
    this.heroAtlas = heroAtlas;
    const sources: Record<string, string> = {
      floorStone:'/assets/tibia/tiles/floor-stone.png',
      floorOrnate:'/assets/tibia/tiles/floor-ornate.png',
      floorGold:'/assets/tibia/tiles/floor-gold.png',
      floorMosaic:'/assets/tibia/tiles/floor-mosaic.png',
    };
    await Promise.all(
      Object.entries(sources).map(async ([key, source]) => {
        this.tileTextures.set(key, await Assets.load<Texture>(source));
      }),
    );
  }

  private drawArena() {
    const terrain = new Container();
    terrain.zIndex = 0;
    const { walkableBounds,ceremonialPath } = HUNT_LAYOUT_CONFIG;
    for (let y = 0; y < HUNT_LAYOUT_CONFIG.arenaRows; y++) {
      for (let x = 0; x < HUNT_LAYOUT_CONFIG.arenaColumns; x++) {
        const border =
          x < walkableBounds.minColumn ||
          y < walkableBounds.minRow ||
          x > walkableBounds.maxColumn ||
          y > walkableBounds.maxRow;
        const onCeremonialPath =
          x >= ceremonialPath.minColumn &&
          x <= ceremonialPath.maxColumn &&
          y >= walkableBounds.minRow &&
          y <= walkableBounds.maxRow;
        const inCombatMosaic =
          !border &&
          !onCeremonialPath &&
          ((x >= 6 && x <= 11 && y >= 5 && y <= 13) ||
            (x >= 19 && x <= 25 && y >= 4 && y <= 14));
        const key = border
          ? 'floorOrnate'
          : onCeremonialPath
            ? (x + y) % 2 === 0 ? 'floorGold' : 'floorOrnate'
            : inCombatMosaic && (x + y) % 4 === 0
              ? 'floorMosaic'
              : 'floorStone';
        const tileSprite = new Sprite(this.tileTextures.get(key)!);
        tileSprite.anchor.set(.5);
        tileSprite.position.set(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
        );
        tileSprite.width = TILE_SIZE;
        tileSprite.height = TILE_SIZE;
        if (!border && !onCeremonialPath) {
          tileSprite.tint = inCombatMosaic ? 0xb8c4ad : 0xa6bbb5;
          if ((x * 3 + y * 5) % 4 === 0) tileSprite.scale.x *= -1;
          if ((x * 5 + y * 7) % 6 === 0) tileSprite.scale.y *= -1;
        } else if (border) {
          tileSprite.tint = 0x8d7651;
        }
        terrain.addChild(tileSprite);
      }
    }

    const frame = new Graphics()
      .rect(
        5,
        5,
        RENDER_CONFIG.arena.width - 10,
        RENDER_CONFIG.arena.height - 10,
      )
      .stroke({ width:10, color:0x3a2518, alpha:.96 })
      .rect(
        TILE_SIZE - 1,
        TILE_SIZE - 1,
        RENDER_CONFIG.arena.width - (TILE_SIZE - 1) * 2,
        RENDER_CONFIG.arena.height - (TILE_SIZE - 1) * 2,
      )
      .stroke({ width:3, color:0x8b7442, alpha:.85 })
      .rect(
        walkableBounds.minColumn * TILE_SIZE - 1,
        walkableBounds.minRow * TILE_SIZE - 1,
        (walkableBounds.maxColumn - walkableBounds.minColumn + 1) * TILE_SIZE + 2,
        (walkableBounds.maxRow - walkableBounds.minRow + 1) * TILE_SIZE + 2,
      )
      .stroke({ width:1, color:0xd2bd79, alpha:.35 });
    frame.zIndex = 2;

    const grid = new Graphics();
    for (
      let x = walkableBounds.minColumn;
      x <= walkableBounds.maxColumn + 1;
      x++
    ) {
      grid
        .moveTo(x * TILE_SIZE, walkableBounds.minRow * TILE_SIZE)
        .lineTo(x * TILE_SIZE, (walkableBounds.maxRow + 1) * TILE_SIZE)
        .stroke({ width:1, color:0x111714, alpha:.1 });
    }
    for (
      let y = walkableBounds.minRow;
      y <= walkableBounds.maxRow + 1;
      y++
    ) {
      grid
        .moveTo(walkableBounds.minColumn * TILE_SIZE, y * TILE_SIZE)
        .lineTo((walkableBounds.maxColumn + 1) * TILE_SIZE, y * TILE_SIZE)
        .stroke({ width:1, color:0x111714, alpha:.1 });
    }
    grid.zIndex = 2;

    const atmosphere = new Graphics()
      .rect(
        walkableBounds.minColumn * TILE_SIZE,
        walkableBounds.minRow * TILE_SIZE,
        (walkableBounds.maxColumn - walkableBounds.minColumn + 1) * TILE_SIZE,
        (walkableBounds.maxRow - walkableBounds.minRow + 1) * TILE_SIZE,
      )
      .fill({ color:0x10202a, alpha:.08 })
      .rect(
        ceremonialPath.minColumn * TILE_SIZE,
        walkableBounds.minRow * TILE_SIZE,
        (ceremonialPath.maxColumn - ceremonialPath.minColumn + 1) * TILE_SIZE,
        (walkableBounds.maxRow - walkableBounds.minRow + 1) * TILE_SIZE,
      )
      .fill({ color:0xf2c55b, alpha:.045 });
    atmosphere.zIndex = 3;
    this.app.stage.addChild(terrain, frame, grid, atmosphere);
  }

  private drawDebugOverlay() {
    const overlay = new Container();
    overlay.zIndex = 8;
    const { walkableBounds } = HUNT_LAYOUT_CONFIG;
    overlay.addChild(
      new Graphics()
        .rect(
          walkableBounds.minColumn * TILE_SIZE,
          walkableBounds.minRow * TILE_SIZE,
          (walkableBounds.maxColumn - walkableBounds.minColumn + 1) * TILE_SIZE,
          (walkableBounds.maxRow - walkableBounds.minRow + 1) * TILE_SIZE,
        )
        .stroke({ width:2,color:0x70e7ff,alpha:.72 }),
    );

    const addMarker = (
      point: Point,
      color: number,
      text: string,
      radius = 8,
    ) => {
      const marker = new Graphics()
        .circle(point.x, point.y, radius)
        .fill({ color,alpha:.2 })
        .stroke({ width:2,color,alpha:.9 });
      const label = this.label(text, 8, `#${color.toString(16).padStart(6, '0')}`);
      label.position.set(point.x + radius + 2, point.y - radius);
      overlay.addChild(marker, label);
    };

    Object.entries(HUNT_LAYOUT_CONFIG.partyPositions).forEach(([role, point]) =>
      addMarker(point, 0x68e892, `party:${role}`),
    );
    HUNT_LAYOUT_CONFIG.enemySpawnPositions.flat().forEach((point, index) =>
      addMarker(point, 0xf06d5e, `spawn:${index + 1}`, 6),
    );
    HUNT_LAYOUT_CONFIG.enemyCombatPositions.forEach((point, index) =>
      addMarker(point, 0xf0bd57, `combat:${index + 1}`, 5),
    );
    addMarker(HUNT_LAYOUT_CONFIG.bossPosition, 0xd77aff, 'boss', 10);
    this.app.stage.addChild(overlay);
  }

  private label(text: string, size: number, color: string) {
    return new Text({
      text,
      style:new TextStyle({
        fontFamily:'Inter, Arial',
        fontSize:size,
        fill:color,
        letterSpacing:1,
        dropShadow:{ color:'#000000', alpha:.8, blur:2, distance:1 },
      }),
    });
  }

  private spawn(event: CombatEvent) {
    const snapshot = event.data!.entity!;
    const previous = this.units.get(snapshot.id);
    previous?.body.destroy({ children:true });
    this.units.delete(snapshot.id);
    const position = event.data!.position!;
    const body = new Container();
    body.position.set(position.x, position.y);
    body.alpha = 0;
    body.scale.set(.4 * RENDER_CONFIG.entity.scale);
    body.zIndex = 10 + position.y;

    const hero = this.isHero(snapshot);
    const boss = snapshot.role === 'boss';
    const hpWidth = hero ? 58 : boss ? 56 : 48;
    const hpY = hero
      ? RENDER_CONFIG.entity.healthBarOffset.hero
      : boss
        ? RENDER_CONFIG.entity.healthBarOffset.boss
        : RENDER_CONFIG.entity.healthBarOffset.monster;
    const manaY = hero ? hpY + 8 : undefined;
    const sprite = this.createSprite(snapshot);
    const name = this.label(snapshot.name, hero || boss ? 11 : 10, '#f4f5e9');
    name.anchor.set(.5);
    name.position.y = hero
      ? RENDER_CONFIG.entity.nameOffset.hero
      : boss
        ? RENDER_CONFIG.entity.nameOffset.boss
        : RENDER_CONFIG.entity.nameOffset.monster;
    const hpBackground = new Graphics()
      .rect(-hpWidth / 2 - 1, hpY - 1, hpWidth + 2, 7)
      .fill(0x080a07);
    const hp = new Graphics();
    const manaBackground = hero
      ? new Graphics()
          .rect(-hpWidth / 2 - 1, manaY! - 1, hpWidth + 2, 6)
          .fill(0x080a07)
      : undefined;
    const mana = hero ? new Graphics() : undefined;
    const selection = hero
      ? new Graphics()
          .roundRect(-26, -24, 52, 56, 5)
          .stroke({ width:2,color:0xe4c65a,alpha:.9 })
      : undefined;
    if (selection) selection.visible = snapshot.id === this.selectedHeroId;
    body.addChild(sprite, name, hpBackground, hp);
    if (manaBackground && mana) body.addChild(manaBackground, mana);
    if (selection) body.addChildAt(selection, 0);

    const debugLabel = this.debugEnabled
      ? this.label(`${snapshot.id} • idle`, 8, '#7de9ff')
      : undefined;
    if (debugLabel) {
      debugLabel.anchor.set(.5);
      debugLabel.position.y = 38;
      const hitbox = new Graphics()
        .rect(-24, -44, 48, 76)
        .stroke({ width:1,color:0x7de9ff,alpha:.8 });
      body.addChild(hitbox, debugLabel);
    }

    if (hero) {
      body.eventMode = 'static';
      body.cursor = 'pointer';
      body.hitArea = new Rectangle(-32, -72, 64, 108);
      body.on('pointertap', () => {
        window.dispatchEvent(
          new CustomEvent('hunt-select-character', { detail:snapshot.id }),
        );
      });
    }
    this.app.stage.addChild(body);

    const unit = {
      body,
      sprite,
      spriteKey:this.spriteKey(snapshot),
      facing:'south' as DirectionName,
      state:'idle' as EntityVisualState,
      hp,
      mana,
      selection,
      debugLabel,
      hpWidth,
      hpY,
      manaY,
      maxHp:snapshot.maxHp,
      currentHp:snapshot.hp,
      maxMana:snapshot.maxMana,
      currentMana:snapshot.mana,
      hero,
    };
    this.units.set(snapshot.id, unit);
    this.syncDiagnostics();
    this.drawVitals(unit);
    this.tween(RENDER_CONFIG.entity.spawnDuration, (progress) => {
      body.alpha = progress;
      body.scale.set(
        (.4 + progress * .6) * RENDER_CONFIG.entity.scale,
      );
    });
    if (boss) this.createBossBar(snapshot);
  }

  private spriteKey(snapshot: EntitySnapshot) {
    if (snapshot.role === 'knight') return 'knight';
    if (snapshot.role === 'druid') return 'druid';
    if (snapshot.role === 'sorcerer') return 'sorcerer';
    if (snapshot.role === 'boss') return 'drume';
    return snapshot.name.includes('Mage') || snapshot.name.includes('Warlock')
      ? 'lion-warlock'
      : 'lion-knight';
  }

  private isHero(snapshot: EntitySnapshot) {
    return (
      snapshot.role === 'knight' ||
      snapshot.role === 'druid' ||
      snapshot.role === 'sorcerer'
    );
  }

  private directionTextures(key: string, direction: DirectionName) {
    return Array.from(
      { length:4 },
      (_, frame) => this.outfitSheet.textures[`${key}-${direction}-${frame}`],
    );
  }

  private createSprite(snapshot: EntitySnapshot): Sprite | AnimatedSprite {
    if (this.isHero(snapshot)) {
      const column =
        snapshot.role === 'knight' ? 0 : snapshot.role === 'druid' ? 1 : 2;
      const texture = new Texture({
        source:this.heroAtlas.source,
        frame:new Rectangle(column * 512, 0, 512, 512),
      });
      const hero = new Sprite(texture);
      hero.anchor.set(.5);
      hero.position.y = -5;
      hero.scale.set(RENDER_CONFIG.entity.heroScale);
      return hero;
    }
    const key = this.spriteKey(snapshot);
    const sprite = new AnimatedSprite(this.directionTextures(key, 'south'));
    sprite.anchor.set(.5);
    sprite.position.y = 16;
    sprite.animationSpeed = .16;
    sprite.loop = true;
    sprite.gotoAndStop(0);
    if (snapshot.role === 'boss') {
      sprite.scale.set(RENDER_CONFIG.entity.bossScale);
    } else {
      sprite.scale.set(RENDER_CONFIG.entity.monsterScale);
    }
    return sprite;
  }

  private face(unit: Unit, direction: DirectionName, walking = false) {
    if (!(unit.sprite instanceof AnimatedSprite)) return;
    if (unit.facing !== direction) {
      unit.facing = direction;
      unit.sprite.textures = this.directionTextures(unit.spriteKey, direction);
    }
    if (walking) unit.sprite.play();
    else unit.sprite.gotoAndStop(0);
  }

  private setUnitState(
    unit: Unit,
    state: EntityVisualState,
    targetId?: string,
  ) {
    if (unit.state === 'dead' && state !== 'dead') return;
    unit.state = state;
    unit.targetId = targetId;
    if (unit.debugLabel) {
      unit.debugLabel.text =
        `${this.unitId(unit)} • ${state}${targetId ? ` • →${targetId}` : ''}`;
    }
    this.syncDiagnostics();
  }

  private unitId(unit: Unit) {
    for (const [id, candidate] of this.units) {
      if (candidate === unit) return id;
    }
    return 'unknown';
  }

  private animateUnit(unit: Unit, state: 'attacking' | 'casting' | 'healing') {
    this.setUnitState(unit, state, unit.targetId);
    const duration =
      state === 'attacking'
        ? RENDER_CONFIG.entity.attackDuration
        : RENDER_CONFIG.entity.castDuration;
    if (unit.sprite instanceof AnimatedSprite) {
      const animated = unit.sprite;
      animated.play();
      this.tween(
        duration,
        () => undefined,
        () => {
          animated.gotoAndStop(0);
          this.setUnitState(unit, 'idle');
        },
      );
      return;
    }
    const startY = unit.sprite.y;
    const startRotation = unit.sprite.rotation;
    this.tween(
      duration,
      (progress) => {
        unit.sprite.y = startY - Math.sin(progress * Math.PI) * 5;
        unit.sprite.rotation =
          startRotation + Math.sin(progress * Math.PI * 2) * .025;
      },
      () => {
        unit.sprite.y = startY;
        unit.sprite.rotation = startRotation;
        this.setUnitState(unit, 'idle');
      },
    );
  }

  private animateHurt(unit: Unit) {
    if (unit.state === 'dead') return;
    this.setUnitState(unit, 'hurt', unit.targetId);
    const startX = unit.sprite.x;
    this.tween(
      RENDER_CONFIG.entity.hurtDuration,
      (progress) => {
        unit.sprite.x =
          startX + Math.sin(progress * Math.PI * 5) * (1 - progress) * 5;
        unit.sprite.alpha = .55 + Math.abs(Math.sin(progress * Math.PI)) * .45;
      },
      () => {
        unit.sprite.x = startX;
        unit.sprite.alpha = 1;
        this.setUnitState(unit, 'idle');
      },
    );
  }

  private movementDirection(from: Point, target: Point): DirectionName {
    const deltaX = target.x - from.x;
    const deltaY = target.y - from.y;
    if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX >= 0 ? 'east' : 'west';
    return deltaY >= 0 ? 'south' : 'north';
  }

  private createBossBar(snapshot: EntitySnapshot) {
    const barWidth = 430;
    const barX = (RENDER_CONFIG.arena.width - barWidth) / 2;
    const container = new Container();
    container.zIndex = 80;
    container.addChild(
      new Graphics().roundRect(barX, 37, barWidth, 15, 3).fill(0x090b08),
    );
    this.bossFill = new Graphics();
    container.addChild(this.bossFill);
    const title = this.label(snapshot.name.toUpperCase(), 11, '#f2d991');
    title.anchor.set(.5);
    title.position.set(RENDER_CONFIG.arena.width / 2, 25);
    container.addChild(title);
    this.app.stage.addChild(container);
    this.drawBossHp(1);
  }

  private healthColor(ratio: number) {
    if (ratio <= RENDER_CONFIG.vitals.dangerThreshold) {
      return RENDER_CONFIG.vitals.dangerColor;
    }
    if (ratio <= RENDER_CONFIG.vitals.warningThreshold) {
      return RENDER_CONFIG.vitals.warningColor;
    }
    return RENDER_CONFIG.vitals.healthyColor;
  }

  private drawVitals(unit: Unit) {
    const hpRatio = this.ratio(unit.currentHp, unit.maxHp);
    unit.hp
      .clear()
      .rect(-unit.hpWidth / 2, unit.hpY, unit.hpWidth * hpRatio, 5)
      .fill(this.healthColor(hpRatio));
    if (unit.mana && unit.manaY !== undefined) {
      const manaRatio = this.ratio(unit.currentMana, unit.maxMana);
      unit.mana
        .clear()
        .rect(-unit.hpWidth / 2, unit.manaY, unit.hpWidth * manaRatio, 4)
        .fill(RENDER_CONFIG.vitals.manaColor);
    }
  }

  private drawBossHp(ratio: number) {
    const barWidth = 424;
    const barX = (RENDER_CONFIG.arena.width - barWidth) / 2;
    this.bossFill
      ?.clear()
      .roundRect(barX, 40, barWidth * this.ratio(ratio, 1), 9, 2)
      .fill(this.healthColor(this.ratio(ratio, 1)));
  }

  private applyEvent(event: CombatEvent) {
    if (event.type === 'spawn' || event.type === 'boss_spawn') this.spawn(event);
    if (event.type === 'move' || event.type === 'reposition') {
      const unit = this.units.get(event.sourceId!);
      if (unit && event.data?.position) {
        const from = { x:unit.body.x, y:unit.body.y };
        const target = event.data.position;
        this.setUnitState(unit, 'moving', event.targetId);
        this.face(unit, this.movementDirection(from, target), true);
        this.tween(
          event.data.duration ?? RENDER_CONFIG.entity.movementDuration,
          (progress) => {
            unit.body.position.set(
              from.x + (target.x - from.x) * progress,
              from.y + (target.y - from.y) * progress,
            );
            unit.body.zIndex = 10 + unit.body.y;
          },
          () => {
            this.face(unit, unit.facing, false);
            this.setUnitState(unit, 'idle');
          },
        );
      }
    }
    if (event.type === 'basic_attack' || event.type === 'cast') {
      const unit = this.units.get(event.sourceId!);
      if (unit) {
        unit.targetId = event.targetId;
        this.pulse(unit.body);
        this.animateUnit(
          unit,
          event.type === 'basic_attack'
            ? 'attacking'
            : event.data?.element === 'healing'
              ? 'healing'
              : 'casting',
        );
        if (event.type === 'cast') {
          if (event.data?.mana !== undefined) {
            unit.currentMana = event.data.mana;
            this.drawVitals(unit);
          }
          if (event.data?.abilityId !== 'challenge') {
            this.tileEffect(
              event.data?.tiles ?? [],
              this.elementColor(event.data?.element),
              false,
              RENDER_CONFIG.effects.tileDuration,
              this.effectKey(event),
              { x:unit.body.x, y:unit.body.y },
            );
          }
          this.spellLabel(
            unit.body.x,
            unit.body.y - (unit.hero ? 72 : 52),
            event.data?.words ?? event.data?.ability ?? '',
          );
        }
      }
    }
    if (event.type === 'aggro') this.aggroEffect(event);
    if (event.type === 'area_warning') {
      this.tileEffect(event.data?.tiles ?? [], 0xf36b53, true, event.data?.duration);
    }
    if (event.type === 'monster_aoe') {
      this.tileEffect(
        event.data?.tiles ?? [],
        this.elementColor(event.data?.element),
        false,
        RENDER_CONFIG.effects.tileDuration,
        this.effectKey(event),
        event.sourceId
          ? {
              x:this.units.get(event.sourceId)?.body.x ?? 0,
              y:this.units.get(event.sourceId)?.body.y ?? 0,
            }
          : undefined,
      );
    }
    if (event.type === 'projectile') this.projectile(event);
    if (event.type === 'damage') {
      const unit = this.units.get(event.targetId!);
      if (unit) {
        const amount = this.safeAmount(event.data?.amount);
        unit.currentHp = Math.max(0, unit.currentHp - amount);
        this.drawVitals(unit);
        this.animateHurt(unit);
        this.floatingText(event.targetId!, `-${amount}`, '#ff746d');
        if (event.targetId === 'lion-king') {
          this.drawBossHp(this.ratio(unit.currentHp, unit.maxHp));
        }
      }
    }
    if (event.type === 'heal') {
      const unit = this.units.get(event.targetId!);
      if (unit) {
        const amount = this.safeAmount(event.data?.amount);
        unit.currentHp = Math.min(
          unit.maxHp,
          unit.currentHp + amount,
        );
        this.drawVitals(unit);
        this.floatingText(event.targetId!, `+${amount}`, '#79eea5');
      }
    }
    if (event.type === 'critical') {
      this.floatingText(event.targetId!, 'CRITICAL!', '#ffd45b');
    }
    if (event.type === 'dodge') {
      this.floatingText(event.targetId!, 'DODGE', '#d7d7ff');
    }
    if (event.type === 'death') {
      const unit = this.units.get(event.targetId!);
      if (unit) {
        this.setUnitState(unit, 'dead', event.sourceId);
        const rotation = unit.body.rotation;
        this.tween(
          RENDER_CONFIG.entity.deathDuration,
          (progress) => {
            unit.body.alpha = 1 - progress;
            unit.body.rotation = rotation + (Math.PI / 2) * progress;
            unit.body.scale.set(1 - progress * .4);
          },
          () => {
            if (this.units.get(event.targetId!) === unit) {
              this.units.delete(event.targetId!);
              unit.body.destroy({ children:true });
              this.syncDiagnostics();
            }
          },
        );
      }
    }
    if (event.type === 'floor_complete') {
      this.floorText.text = `ANDAR ${event.floor} CONCLUÍDO`;
      this.tween(
        RENDER_CONFIG.entity.floorTransitionDuration,
        (progress) => {
          this.floorText.alpha =
            .55 + Math.abs(Math.sin(progress * Math.PI * 2)) * .45;
        },
        () => {
          this.floorText.alpha = 1;
        },
      );
      window.dispatchEvent(new CustomEvent('hunt-floor', { detail:event.floor }));
    }
    if (event.type === 'hunt_complete') {
      window.dispatchEvent(new CustomEvent('hunt-complete', { detail:this.result }));
    }
    window.dispatchEvent(new CustomEvent('hunt-event', { detail:event }));
  }

  private tileEffect(
    tiles: Point[],
    color: number,
    warning = false,
    duration: number = RENDER_CONFIG.effects.tileDuration,
    effectKey?: string,
    origin?: Point,
  ) {
    if (!tiles.length) return;
    const graphics = new Graphics();
    for (const point of tiles) {
      graphics
        .rect(
          point.x - TILE_SIZE / 2 + 1,
          point.y - TILE_SIZE / 2 + 1,
          TILE_SIZE - 2,
          TILE_SIZE - 2,
        )
        .fill({ color, alpha:warning ? .16 : .08 })
        .stroke({ width:warning ? 2 : 1, color, alpha:warning ? .88 : .25 });
    }
    graphics.zIndex = warning ? 5 : 45;
    this.app.stage.addChild(graphics);

    if (warning) {
      this.tween(
        duration,
        (progress) => {
          graphics.alpha = .35 + Math.abs(Math.sin(progress * Math.PI * 6)) * .65;
        },
        () => graphics.destroy(),
      );
      return;
    }

    let maxDelay = 0;
    if (!warning && effectKey) {
      const textures = Array.from(
        { length:4 },
        (_, frame) => this.effectSheet.textures[`${effectKey}-${frame}`],
      ).filter(Boolean);
      if (textures.length) {
        for (const point of tiles) {
          const distance = origin
            ? Math.max(
                Math.abs(point.x - origin.x),
                Math.abs(point.y - origin.y),
              ) / TILE_SIZE
            : 0;
          const delay =
            Math.min(7, distance) * RENDER_CONFIG.effects.tileCascadeDelay;
          maxDelay = Math.max(maxDelay, delay);
          const effect = new AnimatedSprite(textures);
          effect.anchor.set(.5);
          effect.position.set(point.x, point.y);
          effect.animationSpeed = .18;
          effect.loop = false;
          effect.zIndex = 46;
          effect.alpha = 0;
          effect.scale.set(.72);
          effect.gotoAndStop(0);
          this.app.stage.addChild(effect);
          let started = false;
          this.tween(
            duration,
            (progress) => {
              if (!started) {
                started = true;
                effect.gotoAndPlay(0);
              }
              effect.alpha =
                progress < .16
                  ? progress / .16
                  : Math.max(0, 1 - (progress - .62) / .38);
              const swell = Math.sin(progress * Math.PI);
              effect.scale.set(.72 + swell * .38);
              effect.y = point.y + 5 - swell * 8;
            },
            () => effect.destroy(),
            delay,
          );
        }
      }
    }
    this.tween(
      duration + maxDelay,
      (progress) => {
        graphics.alpha = 1 - progress;
      },
      () => graphics.destroy(),
    );
  }

  private effectKey(event: CombatEvent) {
    const abilityMap: Record<string, string> = {
      challenge:'holy',
      berserk:'physical',
      groundshaker:'physical',
      heal_friend:'heal',
      strong_ice_wave:'ice',
      eternal_winter:'ice',
      flame_strike:'fire',
      energy_wave:'energy',
      rage_skies:'energy',
    };
    return (
      abilityMap[event.data?.abilityId ?? ''] ??
      (event.data?.element === 'healing' ? 'heal' : event.data?.element) ??
      'physical'
    );
  }

  private projectile(event: CombatEvent) {
    const source = this.units.get(event.sourceId!);
    const target = this.units.get(event.targetId!);
    if (!source || !target) return;
    const key = this.effectKey(event);
    const projectile = new AnimatedSprite(
      Array.from(
        { length:4 },
        (_, frame) => this.effectSheet.textures[`${key}-${frame}`],
      ),
    );
    projectile.anchor.set(.5);
    projectile.scale.set(.52);
    projectile.animationSpeed = .26;
    projectile.play();
    projectile.position.copyFrom(source.body.position);
    projectile.zIndex = 50;
    this.app.stage.addChild(projectile);
    const start = { x:projectile.x, y:projectile.y };
    this.tween(
      RENDER_CONFIG.effects.projectileDuration,
      (progress) =>
        projectile.position.set(
          start.x + (target.body.x - start.x) * progress,
          start.y + (target.body.y - start.y) * progress,
        ),
      () => projectile.destroy(),
    );
  }

  private pulse(shape: Container) {
    this.tween(RENDER_CONFIG.effects.pulseDuration, (progress) => {
      const scale =
        progress < .5 ? 1 + progress * .12 : 1.06 - (progress - .5) * .12;
      shape.scale.set(scale);
    });
  }

  private spellLabel(x: number, y: number, value: string) {
    const text = this.label(value, 10, '#fff0aa');
    text.anchor.set(.5);
    text.position.set(x, y);
    text.zIndex = 90;
    this.app.stage.addChild(text);
    this.tween(
      RENDER_CONFIG.effects.spellLabelDuration,
      (progress) => {
        text.y = y - progress * 14;
        text.alpha =
          progress < .18 ? progress / .18 : Math.max(0, 1 - (progress - .65) / .35);
      },
      () => text.destroy(),
    );
  }

  private elementColor(element?: string) {
    if (element === 'fire') return 0xff713f;
    if (element === 'ice') return 0x76dff2;
    if (element === 'earth') return 0x78ba5b;
    if (element === 'holy') return 0xffdf70;
    if (element === 'healing') return 0x63d991;
    if (element === 'physical') return 0xe8c25a;
    return 0x9277ff;
  }

  private aggroEffect(event: CombatEvent) {
    const knight = this.units.get(event.sourceId!);
    if (!knight) return;
    for (const targetId of event.data?.targets ?? []) {
      const target = this.units.get(targetId);
      if (!target) continue;
      const line = new Graphics()
        .moveTo(knight.body.x, knight.body.y)
        .lineTo(target.body.x, target.body.y)
        .stroke({ width:2, color:0xe9a947, alpha:.65 });
      line.zIndex = 44;
      this.app.stage.addChild(line);
      const chain = new Graphics()
        .circle(0, 0, 4)
        .fill({ color:0xf2c45b, alpha:.95 })
        .stroke({ width:1, color:0xffefaa, alpha:.9 });
      chain.position.set(target.body.x, target.body.y);
      chain.zIndex = 45;
      this.app.stage.addChild(chain);
      const start = { x:target.body.x, y:target.body.y };
      this.tween(
        RENDER_CONFIG.effects.aggroDuration,
        (progress) => {
          line.alpha = 1 - progress;
          chain.position.set(
            start.x + (knight.body.x - start.x) * progress,
            start.y + (knight.body.y - start.y) * progress,
          );
          chain.alpha = 1 - progress;
        },
        () => {
          line.destroy();
          chain.destroy();
        },
      );
    }
  }

  private floatingText(id: string, value: string, color: string) {
    const unit = this.units.get(id);
    if (!unit) return;
    const text = this.label(value, 14, color);
    text.style.fontWeight = '700';
    text.anchor.set(.5);
    text.position.set(unit.body.x, unit.body.y - (unit.hero ? 76 : 44));
    text.zIndex = 100;
    this.app.stage.addChild(text);
    const startY = text.y;
    this.tween(
      RENDER_CONFIG.effects.floatingTextDuration,
      (progress) => {
        text.y = startY - progress * 31;
        text.alpha = 1 - progress;
      },
      () => text.destroy(),
    );
  }

  private tween(
    duration: number,
    update: Tween['update'],
    done?: Tween['done'],
    delay = 0,
  ) {
    if (this.destroyed) return;
    this.tweens.push({ elapsed:-delay, duration, update, done });
    this.syncDiagnostics();
  }

  private updateTweens(delta: number) {
    if (!Number.isFinite(delta) || delta < 0 || this.destroyed) return;
    const active: Tween[] = [];
    for (const tween of this.tweens) {
      tween.elapsed += delta * this.player.speed;
      if (tween.elapsed < 0) {
        active.push(tween);
        continue;
      }
      const progress = Math.min(1, tween.elapsed / tween.duration);
      tween.update(progress);
      if (progress === 1) tween.done?.();
      else active.push(tween);
    }
    this.tweens = active;
    this.syncDiagnostics();
  }

  private safeAmount(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : 0;
  }

  private ratio(value: number, maximum: number) {
    if (
      !Number.isFinite(value) ||
      !Number.isFinite(maximum) ||
      maximum <= 0
    ) {
      return 0;
    }
    return Math.max(0, Math.min(1, value / maximum));
  }

  private syncDiagnostics() {
    if (!this.parent || this.destroyed) return;
    const bounds = RENDER_CONFIG.arena.cameraBounds;
    const outOfBounds = [...this.units.values()].filter(
      (unit) =>
        unit.body.x < bounds.x ||
        unit.body.y < bounds.y ||
        unit.body.x > bounds.x + bounds.width ||
        unit.body.y > bounds.y + bounds.height,
    ).length;
    this.parent.dataset.unitCount = String(this.units.size);
    this.parent.dataset.stageChildren = String(this.app.stage.children.length);
    this.parent.dataset.tweenCount = String(this.tweens.length);
    this.parent.dataset.outOfBounds = String(outOfBounds);
    this.parent.dataset.selectedHero = this.selectedHeroId;
    this.parent.dataset.unitStates = [...this.units.entries()]
      .map(([id, unit]) => `${id}:${unit.state}`)
      .join(',');
  }
}
