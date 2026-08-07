import { GridMap } from './GridMap';
import { OccupancyGrid, type OccupancyBlockReason } from './OccupancyGrid';
import { Pathfinder } from './Pathfinder';
import {
  cloneGridPosition,
  gridDistance,
  gridKey,
  sameGridPosition,
  type EntityFootprint,
  type GridMetrics,
  type GridPosition,
} from './GridTypes';

export type MovementBlockReason =
  | OccupancyBlockReason
  | 'no-route'
  | 'in-range'
  | 'moving'
  | 'destination-cooldown'
  | 'oscillation'
  | 'invalidated'
  | 'entity-dead'
  | 'reset'
  | 'floor-complete'
  | 'stale-session';

export interface MovementRequest {
  entityId: string;
  from: GridPosition;
  destination: GridPosition;
  goalRange?: number;
  footprint?: EntityFootprint;
  now?: number;
  duration?: number;
  sessionId?: string;
  tacticalPriority?: number;
  tickOrder?: number;
  allowBacktrack?: boolean;
}

export interface PendingMovement {
  entityId: string;
  from: GridPosition;
  to: GridPosition;
  destination: GridPosition;
  path: GridPosition[];
  startedAt: number;
  completesAt: number;
  pathRevision: number;
  sessionId: string;
  tacticalPriority: number;
  tickOrder: number;
  allowBacktrack: boolean;
}

export interface MovementResult {
  moved: boolean;
  from: GridPosition;
  to: GridPosition;
  path: GridPosition[];
  destination: GridPosition;
  pending?: PendingMovement;
  reason?: MovementBlockReason;
  blockingEntityId?: string;
  recalculated: boolean;
}

export interface MovementResolution {
  movement: PendingMovement;
  status: 'completed' | 'cancelled';
  reason?: MovementBlockReason;
}

type FailureState = {
  destinationKey: string;
  consecutive: number;
  consecutiveNoRoute: number;
  cooldownUntil: number;
  revision: number;
  reason: MovementBlockReason;
};

type ReachabilityCache = {
  revision: number;
  expiresAt: number;
  tiles: Set<string>;
};

const clonePending = (movement: PendingMovement): PendingMovement => ({
  ...movement,
  from:cloneGridPosition(movement.from),
  to:cloneGridPosition(movement.to),
  destination:cloneGridPosition(movement.destination),
  path:movement.path.map(cloneGridPosition),
});

export class MovementSystem {
  private readonly pathfinder: Pathfinder;
  private readonly pending = new Map<string, PendingMovement>();
  private readonly failures = new Map<string, FailureState>();
  private readonly recentTiles = new Map<string, GridPosition[]>();
  private readonly reachability = new Map<string, ReachabilityCache>();

  constructor(
    private readonly map: GridMap,
    private readonly occupancy: OccupancyGrid,
    private readonly metrics: GridMetrics,
  ) {
    this.pathfinder = new Pathfinder(map, occupancy);
  }

  reachableTiles(
    entityId: string,
    from: GridPosition,
    now = 0,
    footprint: EntityFootprint = { width: 1, height: 1 },
  ) {
    const key = `${entityId}|${gridKey(from)}|${footprint.width}x${footprint.height}`;
    const cached = this.reachability.get(key);
    if (
      cached &&
      cached.revision === this.occupancy.revision &&
      cached.expiresAt >= now
    ) {
      return cached.tiles;
    }
    const tiles = this.pathfinder.reachableTiles(from, { entityId, footprint });
    this.reachability.set(key, {
      revision:this.occupancy.revision,
      expiresAt:now + 250,
      tiles,
    });
    return tiles;
  }

  isDestinationCoolingDown(entityId: string, destination: GridPosition, now = 0) {
    const failure = this.failures.get(entityId);
    if (!failure) return false;
    if (failure.revision !== this.occupancy.revision) {
      this.failures.delete(entityId);
      return false;
    }
    return failure.destinationKey === gridKey(destination) && failure.cooldownUntil > now;
  }

  step(request: MovementRequest): MovementResult {
    const now = request.now ?? 0;
    const duration = Math.max(1, request.duration ?? 220);
    const sessionId = request.sessionId ?? 'default';
    if (this.pending.has(request.entityId)) {
      return this.blocked(request, 'moving');
    }
    if (gridDistance(request.from, request.destination) <= (request.goalRange ?? 0)) {
      return this.blocked(request, 'in-range', false);
    }
    if (this.isDestinationCoolingDown(request.entityId, request.destination, now)) {
      return this.blocked(request, 'destination-cooldown', false);
    }
    if ((request.goalRange ?? 0) === 0) {
      const reserver = this.occupancy.reservedBy(request.destination);
      if (reserver && reserver !== request.entityId) {
        this.metrics.reservationConflicts++;
        this.recordFailure(request.entityId, request.destination, now, 'reserved');
        return this.blocked(request, 'reserved', true, reserver);
      }
      const occupant = this.occupancy.occupantAt(request.destination);
      if (occupant && occupant !== request.entityId) {
        this.recordFailure(request.entityId, request.destination, now, 'occupied');
        return this.blocked(request, 'occupied', true, occupant);
      }
    }

    this.metrics.pathRecalculations++;
    const path = this.pathfinder.findPath(request.from, request.destination, {
      entityId: request.entityId,
      footprint: request.footprint,
      goalRange: request.goalRange,
    });
    if (!path.length) {
      this.recordFailure(request.entityId, request.destination, now, 'no-route');
      return this.blocked(request, 'no-route', true, undefined, [], true);
    }

    const next = path[0];
    if (!request.allowBacktrack && this.isImmediateBacktrack(request.entityId, request.from, next)) {
      this.metrics.oscillationPrevented++;
      this.recordFailure(request.entityId, request.destination, now, 'oscillation');
      return this.blocked(request, 'oscillation', true, undefined, path, true);
    }

    const reserved = this.occupancy.reserve(
      request.entityId,
      next,
      request.footprint,
    );
    if (!reserved.allowed) {
      if (reserved.reason === 'reserved') this.metrics.reservationConflicts++;
      this.recordFailure(
        request.entityId,
        request.destination,
        now,
        reserved.reason ?? 'invalidated',
      );
      return this.blocked(
        request,
        reserved.reason ?? 'invalidated',
        true,
        reserved.blockingEntityId,
        path,
        true,
      );
    }

    const movement: PendingMovement = {
      entityId:request.entityId,
      from:cloneGridPosition(request.from),
      to:cloneGridPosition(next),
      destination:cloneGridPosition(request.destination),
      path:path.map(cloneGridPosition),
      startedAt:now,
      completesAt:now + duration,
      pathRevision:this.occupancy.revision,
      sessionId,
      tacticalPriority:request.tacticalPriority ?? 0,
      tickOrder:request.tickOrder ?? 0,
      allowBacktrack:request.allowBacktrack ?? false,
    };
    this.pending.set(request.entityId, movement);
    this.metrics.maxPendingMovements = Math.max(
      this.metrics.maxPendingMovements,
      this.pending.size,
    );
    this.metrics.totalPathLength += path.length;
    if (path.length === 1) this.metrics.completedPaths++;
    this.failures.delete(request.entityId);
    return {
      moved:true,
      from:cloneGridPosition(request.from),
      to:cloneGridPosition(next),
      destination:cloneGridPosition(request.destination),
      path:path.map(cloneGridPosition),
      pending:clonePending(movement),
      recalculated:true,
    };
  }

  stepBatch(requests: MovementRequest[]) {
    return [...requests]
      .sort(
        (left, right) =>
          (right.tacticalPriority ?? 0) - (left.tacticalPriority ?? 0) ||
          (left.tickOrder ?? 0) - (right.tickOrder ?? 0) ||
          left.entityId.localeCompare(right.entityId),
      )
      .map((request) => ({ entityId:request.entityId,result:this.step(request) }));
  }

  completeDue(now: number, sessionId: string): MovementResolution[] {
    const due = [...this.pending.values()]
      .filter((movement) => movement.completesAt <= now)
      .sort(
        (left, right) =>
          left.completesAt - right.completesAt ||
          right.tacticalPriority - left.tacticalPriority ||
          left.tickOrder - right.tickOrder ||
          left.entityId.localeCompare(right.entityId),
      );
    const resolved: MovementResolution[] = [];
    for (const movement of due) {
      if (movement.sessionId !== sessionId) {
        resolved.push(this.cancel(movement.entityId, 'stale-session')!);
        continue;
      }
      const origin = this.occupancy.positionOf(movement.entityId);
      const reservation = this.occupancy.reservationOf(movement.entityId);
      if (
        !origin ||
        !reservation ||
        !sameGridPosition(origin, movement.from) ||
        !sameGridPosition(reservation, movement.to)
      ) {
        resolved.push(this.cancel(movement.entityId, 'invalidated')!);
        continue;
      }
      if (!this.occupancy.commitReservation(movement.entityId)) {
        resolved.push(this.cancel(movement.entityId, 'invalidated')!);
        continue;
      }
      this.pending.delete(movement.entityId);
      this.recordTile(movement.entityId, movement.from);
      this.recordTile(movement.entityId, movement.to);
      resolved.push({ movement:clonePending(movement),status:'completed' });
    }
    return resolved;
  }

  cancel(entityId: string, reason: MovementBlockReason = 'reset') {
    const movement = this.pending.get(entityId);
    if (!movement) return undefined;
    this.pending.delete(entityId);
    this.occupancy.cancelReservation(entityId);
    return {
      movement:clonePending(movement),
      status:'cancelled' as const,
      reason,
    };
  }

  cancelAll(reason: MovementBlockReason = 'reset', sessionId?: string) {
    return [...this.pending.values()]
      .filter((movement) => !sessionId || movement.sessionId === sessionId)
      .map((movement) => this.cancel(movement.entityId, reason)!)
      .filter(Boolean);
  }

  pendingEntries() {
    return [...this.pending.values()].map(clonePending);
  }

  clearFailure(entityId: string) {
    this.failures.delete(entityId);
  }

  private blocked(
    request: MovementRequest,
    reason: MovementBlockReason,
    count = true,
    blockingEntityId?: string,
    path: GridPosition[] = [],
    recalculated = false,
  ): MovementResult {
    if (count) this.metrics.blockedMoves++;
    return {
      moved:false,
      from:cloneGridPosition(request.from),
      to:cloneGridPosition(request.from),
      destination:cloneGridPosition(request.destination),
      path:path.map(cloneGridPosition),
      reason,
      blockingEntityId,
      recalculated,
    };
  }

  private recordFailure(
    entityId: string,
    destination: GridPosition,
    now: number,
    reason: MovementBlockReason,
  ) {
    const destinationKey = gridKey(destination);
    const previous = this.failures.get(entityId);
    const sameDestination = previous?.destinationKey === destinationKey;
    const consecutive = sameDestination
      ? previous.consecutive + 1
      : 1;
    const consecutiveNoRoute = reason === 'no-route'
      ? sameDestination && previous?.reason === 'no-route'
        ? previous.consecutiveNoRoute + 1
        : 1
      : 0;
    const cooldownUntil = now + (consecutive >= 3 ? 1000 : 500);
    this.failures.set(entityId, {
      destinationKey,
      consecutive,
      consecutiveNoRoute,
      cooldownUntil,
      revision:this.occupancy.revision,
      reason,
    });
    this.metrics.movementFailures++;
    this.metrics.consecutiveMovementFailures = Math.max(
      this.metrics.consecutiveMovementFailures,
      consecutive,
    );
    if (reason === 'no-route') {
      this.metrics.consecutiveNoRoute = Math.max(
        this.metrics.consecutiveNoRoute,
        consecutiveNoRoute,
      );
    }
    this.metrics.destinationCooldowns++;
    if (consecutive === 3) this.metrics.stuckRecoveries++;
  }

  private isImmediateBacktrack(
    entityId: string,
    from: GridPosition,
    next: GridPosition,
  ) {
    const history = this.recentTiles.get(entityId) ?? [];
    if (history.length < 2) return false;
    return (
      sameGridPosition(history.at(-1)!, from) &&
      sameGridPosition(history.at(-2)!, next)
    );
  }

  private recordTile(entityId: string, position: GridPosition) {
    const history = this.recentTiles.get(entityId) ?? [];
    if (!history.length || !sameGridPosition(history.at(-1)!, position)) {
      history.push(cloneGridPosition(position));
    }
    this.recentTiles.set(entityId, history.slice(-4));
  }
}
