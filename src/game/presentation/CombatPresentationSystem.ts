import { TILE_SIZE } from '../../combat/tiles';
import type { CombatEvent, EntitySnapshot, GridPoint, Point, Role } from '../../events/types';

export type VisualFacing = 'north' | 'east' | 'south' | 'west';
export type VisualAnimationState = 'idle' | 'moving' | 'attack_windup' |
  'attacking' | 'cast_windup' | 'casting' | 'hit_reaction' | 'healing' |
  'stagger' | 'dying' | 'dead';
export type FeedbackKind = 'damage' | 'critical' | 'heal' | 'dodge';

export interface VisualMovement {
  fromTile: GridPoint; toTile: GridPoint; startedAt: number; completesAt: number;
  sessionId?: string;
}
export interface VisualEntityState {
  id: string; role: Role; tile: GridPoint; position: Point;
  facing: VisualFacing; animation: VisualAnimationState; targetId?: string;
  alive: boolean; movement?: VisualMovement; animationUntil?: number;
}
export interface VisualProjectileState {
  castId: string; sourceId?: string; targetId?: string; pathTiles: GridPoint[];
  position: Point; startedAt: number; impactAt: number; cancelled: boolean;
}
export interface VisualTelegraphState {
  castId: string; logicalTiles: GridPoint[]; startedAt: number;
  impactAt: number; intensity: number;
}
export interface VisualFeedback {
  id: string; kind: FeedbackKind; targetId: string; amount?: number;
  createdAt: number; expiresAt: number; stackIndex: number;
}
export interface PresentationMetrics {
  maxVisualSyncError: number; maxActiveProjectiles: number;
  maxActiveTelegraphs: number; maxActiveFeedback: number;
  maxActiveEffects: number; visualOverlapWarnings: number; pooledEffects: number;
}

const cloneTile = (tile: GridPoint): GridPoint => ({ x:tile.x,y:tile.y });
const tileCenter = (tile: GridPoint): Point => ({
  x:tile.x * TILE_SIZE, y:tile.y * TILE_SIZE,
});
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const interpolate = (from: Point, to: Point, progress: number): Point => ({
  x:from.x + (to.x - from.x) * progress,
  y:from.y + (to.y - from.y) * progress,
});

export const facingBetween = (from: Point, to: Point): VisualFacing => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
  return dy >= 0 ? 'south' : 'north';
};

const stableIdOrder = (id: string) => {
  let value = 0;
  for (let index = 0; index < id.length; index++) {
    value = (value * 31 + id.charCodeAt(index)) % 997;
  }
  return value;
};

export const visualSortKey = (tile: GridPoint, entityId: string) =>
  tile.y * 1_000_000 + tile.x * 1_000 + stableIdOrder(entityId);

export const interpolatePath = (pathTiles: GridPoint[], progress: number): Point => {
  if (!pathTiles.length) return { x:0,y:0 };
  if (pathTiles.length === 1) return tileCenter(pathTiles[0]);
  const scaled = clamp01(progress) * (pathTiles.length - 1);
  const index = Math.min(pathTiles.length - 2, Math.floor(scaled));
  return interpolate(
    tileCenter(pathTiles[index]), tileCenter(pathTiles[index + 1]), scaled - index,
  );
};

export class CombatPresentationSystem {
  readonly entities = new Map<string, VisualEntityState>();
  readonly projectiles = new Map<string, VisualProjectileState>();
  readonly telegraphs = new Map<string, VisualTelegraphState>();
  readonly feedback = new Map<string, VisualFeedback>();
  readonly metrics: PresentationMetrics = {
    maxVisualSyncError:0,maxActiveProjectiles:0,maxActiveTelegraphs:0,
    maxActiveFeedback:0,maxActiveEffects:0,visualOverlapWarnings:0,pooledEffects:0,
  };
  private logicalTime = 0;
  private feedbackSequence = 0;
  private sessionId?: string;

  get time() { return this.logicalTime; }

  handle(event: CombatEvent) {
    const eventSession = event.data?.sessionId;
    if (eventSession && this.sessionId && eventSession !== this.sessionId) return;
    if (eventSession) this.sessionId = eventSession;
    this.logicalTime = Math.max(this.logicalTime, event.time);
    if ((event.type === 'spawn' || event.type === 'boss_spawn') && event.data?.entity) {
      this.spawn(event.data.entity, event.data.tile);
    }
    if (event.type === 'target_change' && event.sourceId) {
      const entity = this.entities.get(event.sourceId);
      if (entity?.alive) {
        entity.targetId = event.targetId;
        const target = event.targetId ? this.entities.get(event.targetId) : undefined;
        if (!entity.movement && target) entity.facing = facingBetween(entity.position, target.position);
      }
    }
    if (event.type === 'movement_started' && event.sourceId) this.startMovement(event.sourceId, event);
    if (event.type === 'movement_completed' && event.sourceId && event.data?.toTile) {
      this.completeMovement(event.sourceId, event.data.toTile);
    }
    if (event.type === 'movement_cancelled' && event.sourceId) {
      this.cancelMovement(event.sourceId, event.data?.fromTile);
    }
    if ((event.type === 'basic_attack' || event.type === 'cast') && event.sourceId) {
      this.startAction(event.sourceId, event);
    }
    if (event.type === 'projectile') this.startProjectile(event);
    if (event.type === 'projectile_cancelled' && event.data?.castId) this.cancelProjectile(event.data.castId);
    if (event.type === 'projectile_resolved' && event.data?.castId) this.resolveProjectile(event.data.castId);
    if (event.type === 'spell_telegraph') this.startTelegraph(event);
    if ((event.type === 'spell_resolved' || event.type === 'spell_cancelled') && event.data?.castId) {
      this.telegraphs.delete(event.data.castId);
    }
    if (event.type === 'damage' && event.targetId) this.hit(event.targetId, 'damage', event.data?.amount);
    if (event.type === 'critical' && event.targetId) this.hit(event.targetId, 'critical', event.data?.amount);
    if (event.type === 'heal' && event.targetId) this.hit(event.targetId, 'heal', event.data?.amount);
    if (event.type === 'dodge' && event.targetId) this.hit(event.targetId, 'dodge');
    if (event.type === 'death' && event.targetId) this.die(event.targetId);
    this.updateMetrics();
  }

  setTime(logicalTime: number) {
    if (!Number.isFinite(logicalTime) || logicalTime < this.logicalTime) return;
    this.logicalTime = logicalTime;
    for (const entity of this.entities.values()) this.updateEntity(entity);
    for (const projectile of this.projectiles.values()) {
      const duration = Math.max(1, projectile.impactAt - projectile.startedAt);
      projectile.position = interpolatePath(projectile.pathTiles, (logicalTime - projectile.startedAt) / duration);
    }
    for (const telegraph of this.telegraphs.values()) {
      const duration = Math.max(1, telegraph.impactAt - telegraph.startedAt);
      telegraph.intensity = clamp01((logicalTime - telegraph.startedAt) / duration);
    }
    for (const [id,item] of this.feedback) if (logicalTime >= item.expiresAt) this.feedback.delete(id);
    this.updateMetrics();
  }

  reset() {
    this.entities.clear(); this.projectiles.clear(); this.telegraphs.clear(); this.feedback.clear();
    this.logicalTime = 0; this.feedbackSequence = 0; this.sessionId = undefined;
  }

  syncError(entityId: string) {
    const entity = this.entities.get(entityId);
    if (!entity || entity.movement) return 0;
    const expected = tileCenter(entity.tile);
    const error = Math.hypot(entity.position.x - expected.x, entity.position.y - expected.y);
    this.metrics.maxVisualSyncError = Math.max(this.metrics.maxVisualSyncError, error);
    return error;
  }

  private spawn(snapshot: EntitySnapshot, eventTile?: GridPoint) {
    const tile = cloneTile(eventTile ?? { x:snapshot.tileX,y:snapshot.tileY });
    this.entities.set(snapshot.id, {
      id:snapshot.id,role:snapshot.role,tile,position:tileCenter(tile),
      facing:'south',animation:'idle',alive:true,
    });
  }

  private startMovement(entityId: string, event: CombatEvent) {
    const entity = this.entities.get(entityId);
    const fromTile = event.data?.fromTile;
    const toTile = event.data?.toTile;
    if (!entity?.alive || !fromTile || !toTile) return;
    entity.movement = {
      fromTile:cloneTile(fromTile),toTile:cloneTile(toTile),
      startedAt:event.data?.startedAt ?? event.time,
      completesAt:event.data?.completesAt ?? event.time + Math.max(1, event.data?.duration ?? 220),
      sessionId:event.data?.sessionId,
    };
    entity.position = tileCenter(fromTile);
    entity.facing = facingBetween(tileCenter(fromTile), tileCenter(toTile));
    entity.animation = 'moving';
  }

  private completeMovement(entityId: string, toTile: GridPoint) {
    const entity = this.entities.get(entityId);
    if (!entity?.alive) return;
    entity.tile = cloneTile(toTile); entity.position = tileCenter(toTile);
    entity.movement = undefined; entity.animation = 'idle'; this.syncError(entityId);
  }

  private cancelMovement(entityId: string, fallback?: GridPoint) {
    const entity = this.entities.get(entityId);
    if (!entity?.alive) return;
    const tile = fallback ?? entity.movement?.fromTile ?? entity.tile;
    entity.tile = cloneTile(tile); entity.position = tileCenter(tile);
    entity.movement = undefined; entity.animation = 'idle'; this.syncError(entityId);
  }

  private startAction(entityId: string, event: CombatEvent) {
    const entity = this.entities.get(entityId);
    if (!entity?.alive) return;
    entity.targetId = event.targetId;
    const target = event.targetId ? this.entities.get(event.targetId) : undefined;
    if (target) entity.facing = facingBetween(entity.position, target.position);
    const casting = event.type === 'cast';
    entity.animation = event.data?.element === 'healing' ? 'healing' : casting ? 'cast_windup' : 'attack_windup';
    entity.animationUntil = event.time + Math.max(1, event.data?.duration ?? (casting ? 380 : 320));
  }

  private startProjectile(event: CombatEvent) {
    const castId = event.data?.castId ?? event.id;
    const origin = event.data?.originTile;
    const target = event.data?.targetTile;
    const path = event.data?.pathTiles?.length ? event.data.pathTiles : origin && target ? [origin,target] : [];
    if (!path.length) return;
    const startedAt = event.data?.startedAt ?? event.time;
    const impactAt = event.data?.impactAt ?? startedAt + Math.max(1, event.data?.duration ?? 180);
    this.projectiles.set(castId, {
      castId,sourceId:event.sourceId,targetId:event.targetId,pathTiles:path.map(cloneTile),
      position:tileCenter(path[0]),startedAt,impactAt,cancelled:false,
    });
  }

  private cancelProjectile(castId: string) {
    const projectile = this.projectiles.get(castId);
    if (projectile) projectile.cancelled = true;
    this.projectiles.delete(castId);
  }
  private resolveProjectile(castId: string) {
    const projectile = this.projectiles.get(castId);
    if (projectile) projectile.position = interpolatePath(projectile.pathTiles, 1);
    this.projectiles.delete(castId);
  }
  private startTelegraph(event: CombatEvent) {
    const castId = event.data?.castId;
    if (!castId || !event.data?.logicalTiles?.length) return;
    this.telegraphs.set(castId, {
      castId,logicalTiles:event.data.logicalTiles.map(cloneTile),
      startedAt:event.data.startedAt ?? event.time,
      impactAt:event.data.impactAt ?? event.time + Math.max(1, event.data.duration ?? 500),intensity:0,
    });
  }

  private hit(targetId: string, kind: FeedbackKind, amount?: number) {
    const target = this.entities.get(targetId);
    if (!target?.alive) return;
    if (kind === 'damage') { target.animation = 'hit_reaction'; target.animationUntil = this.logicalTime + 180; }
    else if (kind === 'dodge') { target.animation = 'stagger'; target.animationUntil = this.logicalTime + 140; }
    else if (kind === 'heal') { target.animation = 'healing'; target.animationUntil = this.logicalTime + 260; }
    const stackIndex = [...this.feedback.values()].filter((item) => item.targetId === targetId).length;
    const id = `feedback-${++this.feedbackSequence}`;
    this.feedback.set(id, { id,kind,targetId,amount,createdAt:this.logicalTime,expiresAt:this.logicalTime + 600,stackIndex });
  }
  private die(entityId: string) {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    entity.alive = false; entity.movement = undefined; entity.animation = 'dying';
    entity.animationUntil = this.logicalTime + 340;
  }

  private updateEntity(entity: VisualEntityState) {
    if (entity.movement && entity.alive) {
      const duration = Math.max(1, entity.movement.completesAt - entity.movement.startedAt);
      const progress = clamp01((this.logicalTime - entity.movement.startedAt) / duration);
      entity.position = interpolate(tileCenter(entity.movement.fromTile), tileCenter(entity.movement.toTile), progress);
    }
    if (entity.animationUntil && this.logicalTime >= entity.animationUntil) {
      if (entity.animation === 'dying') entity.animation = 'dead';
      else if (entity.alive && !entity.movement) entity.animation = 'idle';
      entity.animationUntil = undefined;
    } else if (entity.animation === 'attack_windup' && entity.animationUntil !== undefined && entity.animationUntil - this.logicalTime <= 210) {
      entity.animation = 'attacking';
    } else if (entity.animation === 'cast_windup' && entity.animationUntil !== undefined && entity.animationUntil - this.logicalTime <= 250) {
      entity.animation = 'casting';
    }
  }

  private updateMetrics() {
    this.metrics.maxActiveProjectiles = Math.max(this.metrics.maxActiveProjectiles, this.projectiles.size);
    this.metrics.maxActiveTelegraphs = Math.max(this.metrics.maxActiveTelegraphs, this.telegraphs.size);
    this.metrics.maxActiveFeedback = Math.max(this.metrics.maxActiveFeedback, this.feedback.size);
    this.metrics.maxActiveEffects = Math.max(this.metrics.maxActiveEffects, this.projectiles.size + this.telegraphs.size + this.feedback.size);
    const footpoints = [...this.entities.values()].filter((entity) => entity.alive)
      .map((entity) => `${Math.round(entity.position.x)}:${Math.round(entity.position.y)}`);
    if (new Set(footpoints).size !== footpoints.length) this.metrics.visualOverlapWarnings++;
    for (const entity of this.entities.values()) this.syncError(entity.id);
  }
}

export const visualTileCenter = tileCenter;
