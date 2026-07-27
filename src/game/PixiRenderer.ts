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
  sprite: Sprite | AnimatedSprite;
  spriteKey: string;
  facing: DirectionName;
  hp: Graphics;
  mana?: Graphics;
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
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 30; x++) {
        const border = x < 2 || y < 2 || x > 27 || y > 15;
        const ceremonialPath = x >= 14 && x <= 15 && y >= 2 && y <= 15;
        const key = border
          ? 'floorOrnate'
          : ceremonialPath
            ? (x + y) % 2 === 0 ? 'floorGold' : 'floorOrnate'
            : 'floorStone';
        const tileSprite = new Sprite(this.tileTextures.get(key)!);
        tileSprite.anchor.set(.5);
        tileSprite.position.set(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
        );
        tileSprite.width = TILE_SIZE;
        tileSprite.height = TILE_SIZE;
        if (!border && !ceremonialPath) {
          tileSprite.tint = 0xa6bbb5;
          if ((x * 3 + y * 5) % 4 === 0) tileSprite.scale.x *= -1;
          if ((x * 5 + y * 7) % 6 === 0) tileSprite.scale.y *= -1;
        } else if (border) {
          tileSprite.tint = 0x8d7651;
        }
        terrain.addChild(tileSprite);
      }
    }

    const frame = new Graphics()
      .rect(5, 5, 950, 566)
      .stroke({ width:10, color:0x3a2518, alpha:.96 })
      .rect(31, 31, 898, 514)
      .stroke({ width:3, color:0x8b7442, alpha:.85 })
      .rect(63, 63, 834, 450)
      .stroke({ width:1, color:0xd2bd79, alpha:.35 });
    frame.zIndex = 2;

    const grid = new Graphics();
    for (let x = 2; x <= 28; x++) {
      grid
        .moveTo(x * TILE_SIZE, 2 * TILE_SIZE)
        .lineTo(x * TILE_SIZE, 16 * TILE_SIZE)
        .stroke({ width:1, color:0x111714, alpha:.1 });
    }
    for (let y = 2; y <= 16; y++) {
      grid
        .moveTo(2 * TILE_SIZE, y * TILE_SIZE)
        .lineTo(28 * TILE_SIZE, y * TILE_SIZE)
        .stroke({ width:1, color:0x111714, alpha:.1 });
    }
    grid.zIndex = 2;

    const atmosphere = new Graphics()
      .rect(2 * TILE_SIZE, 2 * TILE_SIZE, 26 * TILE_SIZE, 14 * TILE_SIZE)
      .fill({ color:0x10202a, alpha:.08 })
      .rect(14 * TILE_SIZE, 2 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 14)
      .fill({ color:0xf2c55b, alpha:.045 });
    atmosphere.zIndex = 3;
    this.app.stage.addChild(terrain, frame, grid, atmosphere);
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

    const hero = this.isHero(snapshot);
    const hpWidth = hero || snapshot.role === 'boss' ? 52 : 44;
    const hpY = hero ? -49 : snapshot.role === 'boss' ? -34 : -27;
    const manaY = hero ? -42 : undefined;
    const sprite = this.createSprite(snapshot);
    const name = this.label(snapshot.name, 10, '#f4f5e9');
    name.anchor.set(.5);
    name.position.y = hero ? -59 : snapshot.role === 'boss' ? -44 : -37;
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
    body.addChild(sprite, name, hpBackground, hp);
    if (manaBackground && mana) body.addChild(manaBackground, mana);
    this.app.stage.addChild(body);

    const unit = {
      body,
      sprite,
      spriteKey:this.spriteKey(snapshot),
      facing:'south' as DirectionName,
      hp,
      mana,
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
    this.drawVitals(unit);
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
      hero.scale.set(.17);
      return hero;
    }
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
    if (!(unit.sprite instanceof AnimatedSprite)) return;
    if (unit.facing !== direction) {
      unit.facing = direction;
      unit.sprite.textures = this.directionTextures(unit.spriteKey, direction);
    }
    if (walking) unit.sprite.play();
    else unit.sprite.gotoAndStop(0);
  }

  private animateUnit(unit: Unit) {
    if (unit.sprite instanceof AnimatedSprite) {
      const animated = unit.sprite;
      animated.play();
      this.tween(320, () => undefined, () => animated.gotoAndStop(0));
      return;
    }
    const startY = unit.sprite.y;
    const startRotation = unit.sprite.rotation;
    this.tween(
      320,
      (progress) => {
        unit.sprite.y = startY - Math.sin(progress * Math.PI) * 5;
        unit.sprite.rotation =
          startRotation + Math.sin(progress * Math.PI * 2) * .025;
      },
      () => {
        unit.sprite.y = startY;
        unit.sprite.rotation = startRotation;
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

  private healthColor(ratio: number) {
    if (ratio <= .3) return 0xdf4848;
    if (ratio <= .6) return 0xe2c245;
    return 0x43c965;
  }

  private drawVitals(unit: Unit) {
    const hpRatio = Math.max(0, unit.currentHp / unit.maxHp);
    unit.hp
      .clear()
      .rect(-unit.hpWidth / 2, unit.hpY, unit.hpWidth * hpRatio, 5)
      .fill(this.healthColor(hpRatio));
    if (unit.mana && unit.manaY !== undefined) {
      const manaRatio =
        unit.maxMana > 0 ? Math.max(0, unit.currentMana / unit.maxMana) : 0;
      unit.mana
        .clear()
        .rect(-unit.hpWidth / 2, unit.manaY, unit.hpWidth * manaRatio, 4)
        .fill(0x438ce1);
    }
  }

  private drawBossHp(ratio: number) {
    this.bossFill
      ?.clear()
      .roundRect(268, 40, 424 * Math.max(0, ratio), 9, 2)
      .fill(this.healthColor(ratio));
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
        this.pulse(unit.body);
        this.animateUnit(unit);
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
              820,
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
        820,
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
        unit.currentHp = Math.max(0, unit.currentHp - event.data!.amount!);
        this.drawVitals(unit);
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
        this.drawVitals(unit);
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
          const delay = Math.min(7, distance) * 42;
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
      180,
      (progress) =>
        projectile.position.set(
          start.x + (target.body.x - start.x) * progress,
          start.y + (target.body.y - start.y) * progress,
        ),
      () => projectile.destroy(),
    );
  }

  private pulse(shape: Container) {
    this.tween(160, (progress) => {
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
      900,
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
        420,
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
    delay = 0,
  ) {
    this.tweens.push({ elapsed:-delay, duration, update, done });
  }

  private updateTweens(delta: number) {
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
  }
}
