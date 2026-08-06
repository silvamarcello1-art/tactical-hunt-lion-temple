import { GridMap } from './GridMap';
import { OccupancyGrid, type OccupancyBlockReason } from './OccupancyGrid';
import { Pathfinder } from './Pathfinder';
import {
  cloneGridPosition,
  type EntityFootprint,
  type GridMetrics,
  type GridPosition,
} from './GridTypes';

export interface MovementRequest {
  entityId: string;
  from: GridPosition;
  destination: GridPosition;
  goalRange?: number;
  footprint?: EntityFootprint;
}

export interface MovementResult {
  moved: boolean;
  from: GridPosition;
  to: GridPosition;
  path: GridPosition[];
  destination: GridPosition;
  reason?: OccupancyBlockReason | 'no-route';
  blockingEntityId?: string;
}

export class MovementSystem {
  private readonly pathfinder: Pathfinder;

  constructor(
    map: GridMap,
    private readonly occupancy: OccupancyGrid,
    private readonly metrics: GridMetrics,
  ) {
    this.pathfinder = new Pathfinder(map, occupancy);
  }

  step(request: MovementRequest): MovementResult {
    this.metrics.pathRecalculations++;
    const path = this.pathfinder.findPath(request.from, request.destination, {
      entityId: request.entityId,
      footprint: request.footprint,
      goalRange: request.goalRange,
    });
    if (!path.length) {
      this.metrics.blockedMoves++;
      return {
        moved: false,
        from: cloneGridPosition(request.from),
        to: cloneGridPosition(request.from),
        destination: cloneGridPosition(request.destination),
        path: [],
        reason: 'no-route',
      };
    }

    const next = path[0];
    const reserved = this.occupancy.reserve(
      request.entityId,
      next,
      request.footprint,
    );
    if (!reserved.allowed) {
      this.metrics.blockedMoves++;
      if (reserved.reason === 'reserved') this.metrics.reservationConflicts++;
      return {
        moved: false,
        from: cloneGridPosition(request.from),
        to: cloneGridPosition(request.from),
        destination: cloneGridPosition(request.destination),
        path,
        reason: reserved.reason,
        blockingEntityId: reserved.blockingEntityId,
      };
    }
    this.occupancy.commitReservation(request.entityId);
    this.metrics.totalPathLength += path.length;
    if (path.length === 1) this.metrics.completedPaths++;
    return {
      moved: true,
      from: cloneGridPosition(request.from),
      to: cloneGridPosition(next),
      destination: cloneGridPosition(request.destination),
      path: path.map(cloneGridPosition),
    };
  }
}
