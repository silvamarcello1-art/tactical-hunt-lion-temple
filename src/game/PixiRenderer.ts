import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
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
  hp: Graphics;
  maxHp: number;
  currentHp: number;
  color: number;
};

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
  private atlasTexture!: Texture;
  private monsterTextures = new Map<string, Texture>();

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
    this.atlasTexture = await Assets.load<Texture>('/assets/character-atlas.png');
    await this.loadTemporaryMonsterTextures();
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

  private async loadTemporaryMonsterTextures() {
    const sources: Record<string, string> = {
      warrior:'/assets/wiki/ancient-lion-knight.png',
      mage:'/assets/wiki/ancient-lion-warlock.png',
      boss:'/assets/wiki/drume.png',
    };
    await Promise.all(
      Object.entries(sources).map(async ([key, source]) => {
        try {
          this.monsterTextures.set(key, await Assets.load<Texture>(source));
        } catch {
          // The original atlas remains the explicit offline fallback.
        }
      }),
    );
  }

  private drawArena() {
    const terrain = new Graphics();
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 30; x++) {
        const border = x === 0 || y === 0 || x === 29 || y === 17;
        const path = x >= 3 && x <= 27 && y >= 2 && y <= 15;
        const alternate = (x + y) % 2 === 0;
        const color = border
          ? 0x3b2b1f
          : path
            ? alternate
              ? 0x62624b
              : 0x575a45
            : alternate
              ? 0x243522
              : 0x2b3d28;
        terrain
          .rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
          .fill(color)
          .stroke({ width:1, color:0x111811, alpha:.24 });
      }
    }
    terrain.zIndex = 0;

    const ornament = new Graphics();
    for (let x = 3; x <= 27; x += 4) {
      ornament
        .circle(x * TILE_SIZE, TILE_SIZE * 2, 10)
        .fill({ color:0x44673a, alpha:.85 })
        .circle(x * TILE_SIZE, TILE_SIZE * 15, 10)
        .fill({ color:0x44673a, alpha:.85 });
    }
    ornament
      .rect(14 * TILE_SIZE, 2 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 14)
      .fill({ color:0x2b3328, alpha:.18 });
    ornament.zIndex = 1;
    this.app.stage.addChild(terrain, ornament);
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
      .ellipse(0, 14, 25, 8)
      .fill({ color:0x000000, alpha:.45 });
    const shape = new Graphics()
      .circle(0, 0, snapshot.role === 'boss' ? 25 : 19)
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

  private createSprite(snapshot: EntitySnapshot) {
    const official =
      snapshot.role === 'boss'
        ? this.monsterTextures.get('boss')
        : snapshot.role === 'monster'
          ? this.monsterTextures.get(snapshot.name.includes('Mage') ? 'mage' : 'warrior')
          : undefined;
    if (official) {
      const sprite = new Sprite(official);
      sprite.anchor.set(.5);
      sprite.scale.set(snapshot.role === 'boss' ? 1.2 : 1);
      sprite.position.y = snapshot.role === 'boss' ? -8 : -5;
      return sprite;
    }

    let column = 0;
    let row = 0;
    if (snapshot.role === 'druid') column = 1;
    if (snapshot.role === 'sorcerer') column = 2;
    if (snapshot.role === 'monster') {
      row = 1;
      column = snapshot.name.includes('Mage') ? 1 : 0;
    }
    if (snapshot.role === 'boss') {
      row = 1;
      column = 2;
    }
    const texture = new Texture({
      source:this.atlasTexture.source,
      frame:new Rectangle(column * 512, row * 512, 512, 512),
    });
    const sprite = new Sprite(texture);
    sprite.anchor.set(.5);
    sprite.scale.set(snapshot.role === 'boss' ? .2 : .15);
    sprite.position.y = snapshot.role === 'boss' ? -12 : -8;
    return sprite;
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
        this.tween(event.data.duration ?? 220, (progress) => {
          unit.body.position.set(
            from.x + (target.x - from.x) * progress,
            from.y + (target.y - from.y) * progress,
          );
          unit.body.zIndex = 10 + unit.body.y;
        });
      }
    }
    if (event.type === 'basic_attack' || event.type === 'cast') {
      const unit = this.units.get(event.sourceId!);
      if (unit) {
        this.pulse(unit.shape);
        if (event.type === 'cast') {
          this.tileEffect(
            event.data?.tiles ?? [],
            this.elementColor(event.data?.element),
            false,
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
    this.tween(
      duration,
      (progress) => {
        graphics.alpha = warning
          ? .35 + Math.abs(Math.sin(progress * Math.PI * 6)) * .65
          : 1 - progress;
      },
      () => graphics.destroy(),
    );
  }

  private projectile(event: CombatEvent) {
    const source = this.units.get(event.sourceId!);
    const target = this.units.get(event.targetId!);
    if (!source || !target) return;
    const projectile = new Graphics()
      .circle(0, 0, 6)
      .fill(this.elementColor(event.data?.element));
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
