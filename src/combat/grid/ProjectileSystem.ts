import { LineOfSightResolver } from './LineOfSightResolver';
import {
  cloneGridPosition,
  type GridMetrics,
  type GridPosition,
} from './GridTypes';

export type ProjectileCollisionPolicy = 'walls' | 'walls-and-units' | 'none';
export type ProjectileLineOfSightPolicy = 'required' | 'ignored';
export type ProjectileTargetPolicy = 'requires-alive' | 'none';
export type ProjectileImpactPolicy = 'original-tile' | 'follow-target';

export interface PendingProjectile {
  castId: string;
  sessionId: string;
  casterId: string;
  targetId?: string;
  originTile: GridPosition;
  targetTile: GridPosition;
  pathTiles: GridPosition[];
  startedAt: number;
  impactAt: number;
  damage: number;
  spellId: string;
  collisionPolicy: ProjectileCollisionPolicy;
  lineOfSightPolicy: ProjectileLineOfSightPolicy;
  targetPolicy: ProjectileTargetPolicy;
  impactPolicy: ProjectileImpactPolicy;
  resolved: boolean;
  cancelled: boolean;
  floor: number;
  ability?: string;
  element: string;
  logicalTiles: GridPosition[];
}

export interface ProjectileRequest
  extends Omit<PendingProjectile, 'pathTiles' | 'impactAt' | 'resolved' | 'cancelled'> {
  travelTime: number;
  ignoreEntityIds?: string[];
}

export interface ProjectileScheduleResult {
  accepted: boolean;
  projectile?: PendingProjectile;
  reason?: 'blocked-line-of-sight' | 'duplicate-cast';
}

export interface ProjectileResolution {
  projectile: PendingProjectile;
  status: 'ready' | 'cancelled';
  reason?: string;
}

const cloneProjectile = (projectile: PendingProjectile): PendingProjectile => ({
  ...projectile,
  originTile:cloneGridPosition(projectile.originTile),
  targetTile:cloneGridPosition(projectile.targetTile),
  pathTiles:projectile.pathTiles.map(cloneGridPosition),
  logicalTiles:projectile.logicalTiles.map(cloneGridPosition),
});

export class ProjectileSystem {
  private readonly pending = new Map<string, PendingProjectile>();

  constructor(
    private readonly lineOfSight: LineOfSightResolver,
    private readonly metrics: GridMetrics,
  ) {}

  schedule(request: ProjectileRequest): ProjectileScheduleResult {
    if (this.pending.has(request.castId)) {
      return { accepted:false,reason:'duplicate-cast' };
    }
    const blockUnits = request.collisionPolicy === 'walls-and-units';
    if (
      request.lineOfSightPolicy === 'required' &&
      !this.lineOfSight.hasLineOfSight(request.originTile, request.targetTile, {
        blockUnits,
        ignoreEntityIds:request.ignoreEntityIds,
      })
    ) {
      return { accepted:false,reason:'blocked-line-of-sight' };
    }
    const projectile: PendingProjectile = {
      ...request,
      originTile:cloneGridPosition(request.originTile),
      targetTile:cloneGridPosition(request.targetTile),
      pathTiles:this.lineOfSight.trace(request.originTile, request.targetTile),
      logicalTiles:request.logicalTiles.map(cloneGridPosition),
      impactAt:request.startedAt + Math.max(1, request.travelTime),
      resolved:false,
      cancelled:false,
    };
    this.pending.set(projectile.castId, projectile);
    this.metrics.maxPendingProjectiles = Math.max(
      this.metrics.maxPendingProjectiles,
      this.pending.size,
    );
    return { accepted:true,projectile:cloneProjectile(projectile) };
  }

  resolveDue(now: number, sessionId: string): ProjectileResolution[] {
    const due = [...this.pending.values()]
      .filter((projectile) => projectile.impactAt <= now)
      .sort(
        (left, right) =>
          left.impactAt - right.impactAt || left.castId.localeCompare(right.castId),
      );
    return due.map((projectile) => {
      this.pending.delete(projectile.castId);
      if (projectile.sessionId !== sessionId) {
        projectile.cancelled = true;
        return {
          projectile:cloneProjectile(projectile),
          status:'cancelled' as const,
          reason:'stale-session',
        };
      }
      projectile.resolved = true;
      return { projectile:cloneProjectile(projectile),status:'ready' as const };
    });
  }

  cancel(castId: string, reason = 'cancelled'): ProjectileResolution | undefined {
    const projectile = this.pending.get(castId);
    if (!projectile) return undefined;
    this.pending.delete(castId);
    projectile.cancelled = true;
    return {
      projectile:cloneProjectile(projectile),
      status:'cancelled',
      reason,
    };
  }

  cancelAll(reason: string, sessionId?: string) {
    return [...this.pending.values()]
      .filter((projectile) => !sessionId || projectile.sessionId === sessionId)
      .map((projectile) => this.cancel(projectile.castId, reason)!)
      .filter(Boolean);
  }

  pendingEntries() {
    return [...this.pending.values()].map(cloneProjectile);
  }
}
