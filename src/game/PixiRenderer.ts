import {
  AnimatedSprite,
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Spritesheet,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import { CombatEngine } from '../combat/CombatEngine';
import { TILE_SIZE } from '../combat/tiles';
import type { AbilityPreferences } from '../data/abilities';
import { EventPlayer } from '../events/EventPlayer';
import type {
  CombatEvent,
  EntitySnapshot,
  HuntResult,
  Point,
} from '../events/types';

type Unit = {
  body: Container;
  shape: Graphics;
  sprite: AnimatedSprite;
  spriteKey: string;
  facing: DirectionName;
  hp: Graphics;
  maxHp: number;
  currentHp: number;
  color: number;
};

type DirectionName = 'south' | 'east' | 'north' | 'west';

type Tween = {
  elapsed: number;
  duration: number;
  update: (progress: number) => void;
  done?: () => void;
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
  private tileTextures = new Map<string, Texture>();

  constructor(preferences: AbilityPreferences) {
    this.result = new CombatEngine(803, preferences).run();
    this.player = new EventPlayer(
      this.result.events,
      (event) => this.applyEvent(event),
      (ms) =>
        window.dispatchEvent(new CustomEvent('hunt-time', { detail: ms })),
    );
  }

  async mount(parent: HTMLElement) {
    await this.app.init({
      width: 960,
      height: 576,
      background:'#111611',
      antialias:false,
      resolution:Math.min(window.devicePixelRatio, 2),
      autoDensity:true,
    });
    await this.loadTibiaAssets();
    parent.replaceChildren(this.app.canvas);
    this.drawArena();
    this.floorText = this.label('PREPARAÇÃO', 13, '#f0d77a');
    this.floorText.position.set(18, 14);
    this.floorText.zIndex = 60;
    this.app.stage.addChild(this.floorText);
    this.app.stage.sortableChildren = true;
    this.app.ticker.add((ticker) => {
      this.player.update(ticker.deltaMS);
      this.updateTweens(ticker.deltaMS);
    });
    window.dispatchEvent(new CustomEvent('hunt-ready', { detail:this.result }));
  }

  destroy() {
    this.app.destroy(true, { children:true });
  }

  private async loadTibiaAssets() {
    [this.outfitSheet, this.effectSheet] = await Promise.all([
      Assets.load<Spritesheet>('/assets/tibia/outfits.json'),
      Assets.load<Spritesheet>('/assets/tibia/effects.json'),
    ]);
    const sources: Record<string, string> = {
      floorStone:'/assets/tibia/tiles/floor-stone.png',
      floorOrnate:'/assets/tibia/tiles/floor-ornate.png',
      floorGold:'/assets/tibia/tiles/floor-gold.png',
      floorMosaic:'/assets/tibia/tiles/floor-mosaic.png',
      wallHorizontal:'/assets/tibia/tiles/wall-horizontal.png',
      wallVertical:'/assets/tibia/tiles/wall-vertical.png',
      wallColumn:'/assets/tibia/tiles/wall-column.png',
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
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 30; x++) {
        const border = x === 0 || y === 0 || x === 29 || y === 17;
        const ceremonialPath = x >= 12 && x <= 17 && y >= 2 && y <= 15;
        const key = border
          ? 'floorStone'
          : ceremonialPath
            ? (x + y) % 3 === 0 ? 'floorGold' : 'floorOrnate'
            : (x + y) % 4 === 0
              ? 'floorMosaic'
              : 'floorOrnate';
        const tileSprite = new Sprite(this.tileTextures.get(key)!);
        tileSprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
        tileSprite.width = TILE_SIZE;
        tileSprite.height = TILE_SIZE;
        terrain.addChild(tileSprite);
      }
    }

    const walls = new Container();
    walls.zIndex = 2;
    for (let x = 0; x < 30; x += 1) {
      for (const y of [0, 17]) {
        const wall = new Sprite(this.tileTextures.get('wallHorizontal')!);
        wall.position.set(x * TILE_SIZE, y * TILE_SIZE);
        wall.width = TILE_SIZE;
        wall.height = TILE_SIZE;
        walls.addChild(wall);
      }
    }
    for (let y = 1; y < 17; y += 1) {
      for (const x of [0, 29]) {
        const wall = new Sprite(this.tileTextures.get('wallVertical')!);
        wall.position.set(x * TILE_SIZE, y * TILE_SIZE);
        wall.width = TILE_SIZE;
        wall.height = TILE_SIZE;
        walls.addChild(wall);
      }
    }
    for (const x of [4, 10, 19, 25]) {
      for (const y of [2, 15]) {
        const column = new Sprite(this.tileTextures.get('wallColumn')!);
        column.anchor.set(.5);
        column.position.set(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
        );
        column.width = TILE_SIZE;
        column.height = TILE_SIZE;
        walls.addChild(column);
      }
    }
    const atmosphere = new Graphics()
      .rect(TILE_SIZE, TILE_SIZE, 28 * TILE_SIZE, 16 * TILE_SIZE)
      .fill({ color:0x10202a, alpha:.11 })
      .rect(14 * TILE_SIZE, 2 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 14)
      .fill({ color:0xf2c55b, alpha:.06 });
    atmosphere.zIndex = 3;
    this.app.stage.addChild(terrain, walls, atmosphere);
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
    this.units.get(snapshot.id)?.body.destroy({ children:true });
    const position = event.data!.position!;
    const body = new Container();
    body.position.set(position.x, position.y);
    body.alpha = 0;
    body.scale.set(.4);
    body.zIndex = 10 + position.y;

    const shadow = new Graphics()
      .ellipse(0, 15, 24, 7)
      .fill({ color:0x000000, alpha:.45 });
    const shape = new Graphics()
      .circle(0, 0, snapshot.role === 'boss' ? 23 : 16)
      .fill({ color:snapshot.color, alpha:.08 })
      .stroke({
        width:2,
        color:snapshot.role === 'boss' ? 0xffd76b : 0xffffff,
        alpha:.32,
      });
    const sprite = this.createSprite(snapshot);
    const name = this.label(snapshot.name, 10, '#f4f5e9');
    name.anchor.set(.5);
    name.position.y = 30;
    const hpBackground = new Graphics().rect(-25, -32, 50, 5).fill(0x080a07);
    const hp = new Graphics();
    body.addChild(shadow, shape, sprite, name, hpBackground, hp);
    this.app.stage.addChild(body);

    const unit = {
      body,
      shape,
      sprite,
      spriteKey:this.spriteKey(snapshot),
      facing:'south' as DirectionName,
      hp,
      maxHp:snapshot.maxHp,
      currentHp:snapshot.hp,
      color:snapshot.role === 'boss' ? 0xe4a536 : 0xd14c46,
    };
    this.units.set(snapshot.id, unit);
    this.drawHp(unit);
    this.tween(220, (progress) => {
      body.alpha = progress;
      body.scale.set(.4 + progress * .6);
    });
    if (snapshot.role === 'boss') this.createBossBar(snapshot);
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

  private directionTextures(key: string, direction: DirectionName) {
    return Array.from(
      { length:4 },
      (_, frame) => this.outfitSheet.textures[`${key}-${direction}-${frame}`],
    );
  }

  private createSprite(snapshot: EntitySnapshot) {
    const key = this.spriteKey(snapshot);
    const sprite = new AnimatedSprite(this.directionTextures(key, 'south'));
    sprite.anchor.set(.5);
    sprite.position.y = 16;
    sprite.animationSpeed = .16;
    sprite.loop = true;
    sprite.gotoAndStop(0);
    if (snapshot.role === 'boss') sprite.scale.set(1.12);
    return sprite;
  }

  private face(unit: Unit, direction: DirectionName, walking = false) {
    if (unit.facing !== direction) {
      unit.facing = direction;
      unit.sprite.textures = this.directionTextures(unit.spriteKey, direction);
    }
    if (walking) unit.sprite.play();
    else unit.sprite.gotoAndStop(0);
  }

  private movementDirection(from: Point, target: Point): DirectionName {
    const deltaX = target.x - from.x;
    const deltaY = target.y - from.y;
    if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX >= 0 ? 'east' : 'west';
    return deltaY >= 0 ? 'south' : 'north';
  }

  private createBossBar(snapshot: EntitySnapshot) {
    const container = new Container();
    container.zIndex = 80;
    container.addChild(
      new Graphics().roundRect(265, 37, 430, 15, 3).fill(0x090b08),
    );
    this.bossFill = new Graphics();
    container.addChild(this.bossFill);
    const title = this.label(snapshot.name.toUpperCase(), 11, '#f2d991');
    title.anchor.set(.5);
    title.position.set(480, 25);
    container.addChild(title);
    this.app.stage.addChild(container);
    this.drawBossHp(1);
  }

  private drawHp(unit: Unit) {
    unit.hp
      .clear()
      .rect(-25, -32, 50 * Math.max(0, unit.currentHp / unit.maxHp), 5)
      .fill(unit.color);
  }

  private drawBossHp(ratio: number) {
    this.bossFill
      ?.clear()
      .roundRect(268, 40, 424 * Math.max(0, ratio), 9, 2)
      .fill(0xe2a62f);
  }

  private applyEvent(event: CombatEvent) {
    if (event.type === 'spawn' || event.type === 'boss_spawn') this.spawn(event);
    if (event.type === 'move' || event.type === 'reposition') {
      const unit = this.units.get(event.sourceId!);
      if (unit && event.data?.position) {
        const from = { x:unit.body.x, y:unit.body.y };
        const target = event.data.position;
        this.face(unit, this.movementDirection(from, target), true);
        this.tween(
          event.data.duration ?? 220,
          (progress) => {
            unit.body.position.set(
              from.x + (target.x - from.x) * progress,
              from.y + (target.y - from.y) * progress,
            );
            unit.body.zIndex = 10 + unit.body.y;
          },
          () => this.face(unit, unit.facing, false),
        );
      }
    }
    if (event.type === 'basic_attack' || event.type === 'cast') {
      const unit = this.units.get(event.sourceId!);
      if (unit) {
        this.pulse(unit.shape);
        unit.sprite.play();
        this.tween(280, () => undefined, () => unit.sprite.gotoAndStop(0));
        if (event.type === 'cast') {
          this.tileEffect(
            event.data?.tiles ?? [],
            this.elementColor(event.data?.element),
            false,
            520,
            this.effectKey(event),
          );
          this.spellLabel(
            unit.body.x,
            unit.body.y - 57,
            event.data?.ability ?? '',
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
        620,
        this.effectKey(event),
      );
    }
    if (event.type === 'projectile') this.projectile(event);
    if (event.type === 'damage') {
      const unit = this.units.get(event.targetId!);
      if (unit) {
        unit.currentHp = Math.max(0, unit.currentHp - event.data!.amount!);
        this.drawHp(unit);
        this.floatingText(event.targetId!, `-${event.data!.amount}`, '#ff746d');
        if (event.targetId === 'lion-king') {
          this.drawBossHp(unit.currentHp / unit.maxHp);
        }
      }
    }
    if (event.type === 'heal') {
      const unit = this.units.get(event.targetId!);
      if (unit) {
        unit.currentHp = Math.min(
          unit.maxHp,
          unit.currentHp + event.data!.amount!,
        );
        this.drawHp(unit);
        this.floatingText(event.targetId!, `+${event.data!.amount}`, '#79eea5');
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
        const rotation = unit.body.rotation;
        this.tween(340, (progress) => {
          unit.body.alpha = 1 - progress;
          unit.body.rotation = rotation + (Math.PI / 2) * progress;
          unit.body.scale.set(1 - progress * .4);
        });
      }
    }
    if (event.type === 'floor_complete') {
      this.floorText.text = `ANDAR ${event.floor} CONCLUÍDO`;
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
    duration = 430,
    effectKey?: string,
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
        .fill({ color, alpha:warning ? .16 : .42 })
        .stroke({ width:warning ? 2 : 1, color, alpha:.88 });
    }
    graphics.zIndex = warning ? 5 : 45;
    this.app.stage.addChild(graphics);
    const effects: AnimatedSprite[] = [];
    if (!warning && effectKey) {
      const textures = Array.from(
        { length:4 },
        (_, frame) => this.effectSheet.textures[`${effectKey}-${frame}`],
      ).filter(Boolean);
      if (textures.length) {
        for (const point of tiles) {
          const effect = new AnimatedSprite(textures);
          effect.anchor.set(.5);
          effect.position.set(point.x, point.y);
          effect.animationSpeed = .24;
          effect.loop = false;
          effect.zIndex = 46;
          effect.play();
          effects.push(effect);
          this.app.stage.addChild(effect);
        }
      }
    }
    this.tween(
      duration,
      (progress) => {
        graphics.alpha = warning
          ? .35 + Math.abs(Math.sin(progress * Math.PI * 6)) * .65
          : 1 - progress;
      },
      () => {
        graphics.destroy();
        effects.forEach((effect) => effect.destroy());
      },
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
      180,
      (progress) =>
        projectile.position.set(
          start.x + (target.body.x - start.x) * progress,
          start.y + (target.body.y - start.y) * progress,
        ),
      () => projectile.destroy(),
    );
  }

  private pulse(shape: Graphics) {
    this.tween(160, (progress) => {
      const scale =
        progress < .5 ? 1 + progress * .5 : 1.25 - (progress - .5) * .5;
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
      650,
      (progress) => {
        text.y = y - progress * 18;
        text.alpha = 1 - progress;
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
    this.tileEffect(event.data?.tiles ?? [], 0xf0b84d, true, 420);
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
      this.tween(
        340,
        (progress) => {
          line.alpha = 1 - progress;
        },
        () => line.destroy(),
      );
    }
  }

  private floatingText(id: string, value: string, color: string) {
    const unit = this.units.get(id);
    if (!unit) return;
    const text = this.label(value, 14, color);
    text.style.fontWeight = '700';
    text.anchor.set(.5);
    text.position.set(unit.body.x, unit.body.y - 44);
    text.zIndex = 100;
    this.app.stage.addChild(text);
    const startY = text.y;
    this.tween(
      600,
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
  ) {
    this.tweens.push({ elapsed:0, duration, update, done });
  }

  private updateTweens(delta: number) {
    const active: Tween[] = [];
    for (const tween of this.tweens) {
      tween.elapsed += delta * this.player.speed;
      const progress = Math.min(1, tween.elapsed / tween.duration);
      tween.update(progress);
      if (progress === 1) tween.done?.();
      else active.push(tween);
    }
    this.tweens = active;
  }
}
