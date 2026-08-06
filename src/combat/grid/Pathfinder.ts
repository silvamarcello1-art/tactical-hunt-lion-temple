import { GridMap } from './GridMap';
import { OccupancyGrid } from './OccupancyGrid';
import {
  cloneGridPosition,
  gridDistance,
  gridKey,
  sameGridPosition,
  type EntityFootprint,
  type GridPosition,
} from './GridTypes';

export interface PathfindingOptions {
  entityId: string;
  footprint?: EntityFootprint;
  goalRange?: number;
  maxIterations?: number;
}

interface SearchNode {
  position: GridPosition;
  g: number;
  h: number;
  f: number;
  order: number;
}

const movementCost = (from: GridPosition, to: GridPosition) =>
  from.x !== to.x && from.y !== to.y ? 14 : 10;

export class Pathfinder {
  constructor(
    private readonly map: GridMap,
    private readonly occupancy: OccupancyGrid,
  ) {}

  findPath(
    start: GridPosition,
    goal: GridPosition,
    options: PathfindingOptions,
  ): GridPosition[] {
    const footprint = options.footprint ?? { width: 1, height: 1 };
    const goalRange = options.goalRange ?? 0;
    if (gridDistance(start, goal) <= goalRange) return [];

    const open: SearchNode[] = [];
    const closed = new Set<string>();
    const parents = new Map<string, GridPosition>();
    const bestG = new Map<string, number>();
    let order = 0;
    const startH = gridDistance(start, goal) * 10;
    open.push({
      position: cloneGridPosition(start),
      g: 0,
      h: startH,
      f: startH,
      order: order++,
    });
    bestG.set(gridKey(start), 0);

    let iterations = 0;
    while (open.length && iterations++ < (options.maxIterations ?? 4000)) {
      open.sort(
        (left, right) =>
          left.f - right.f ||
          left.h - right.h ||
          left.position.y - right.position.y ||
          left.position.x - right.position.x ||
          left.order - right.order,
      );
      const current = open.shift()!;
      const currentKey = gridKey(current.position);
      if (closed.has(currentKey)) continue;
      closed.add(currentKey);

      if (gridDistance(current.position, goal) <= goalRange) {
        return this.reconstruct(start, current.position, parents);
      }

      for (const neighbor of this.map.neighbors(current.position, footprint)) {
        const key = gridKey(neighbor);
        if (closed.has(key)) continue;
        if (!this.canTraverseDiagonal(current.position, neighbor, options.entityId, footprint)) {
          continue;
        }
        const atGoal = sameGridPosition(neighbor, goal);
        const canEnter = this.occupancy.canEnter(options.entityId, neighbor, footprint);
        if (!canEnter.allowed && !(atGoal && goalRange > 0)) continue;

        const g =
          current.g +
          movementCost(current.position, neighbor) * this.map.tile(neighbor).terrainCost;
        if (g >= (bestG.get(key) ?? Number.POSITIVE_INFINITY)) continue;
        bestG.set(key, g);
        parents.set(key, current.position);
        const h = gridDistance(neighbor, goal) * 10;
        open.push({ position: neighbor, g, h, f: g + h, order: order++ });
      }
    }
    return [];
  }

  private canTraverseDiagonal(
    from: GridPosition,
    to: GridPosition,
    entityId: string,
    footprint: EntityFootprint,
  ) {
    if (from.x === to.x || from.y === to.y) return true;
    return (
      this.occupancy.canEnter(entityId, { x: to.x, y: from.y }, footprint).allowed &&
      this.occupancy.canEnter(entityId, { x: from.x, y: to.y }, footprint).allowed
    );
  }

  private reconstruct(
    start: GridPosition,
    end: GridPosition,
    parents: Map<string, GridPosition>,
  ) {
    const path: GridPosition[] = [];
    let current = cloneGridPosition(end);
    while (!sameGridPosition(current, start)) {
      path.push(cloneGridPosition(current));
      const parent = parents.get(gridKey(current));
      if (!parent) return [];
      current = parent;
    }
    return path.reverse();
  }
}
