import { GridMap } from './GridMap';
import { OccupancyGrid } from './OccupancyGrid';
import { gridKey, sameGridPosition, type GridPosition } from './GridTypes';

export interface LineOfSightOptions {
  blockUnits?: boolean;
  ignoreEntityIds?: string[];
  blockOrigin?: boolean;
  allowBlockedEndpoint?: boolean;
}

export class LineOfSightResolver {
  constructor(
    private readonly map: GridMap,
    private readonly occupancy: OccupancyGrid,
  ) {}

  trace(from: GridPosition, to: GridPosition) {
    const points: GridPosition[] = [];
    this.visitSupercover(from, to, (tile) => { points.push(tile); return true; });
    return points;
  }

  // Walk the identical ordered supercover, stopping at the first obstruction.
  // Visibility needs no materialized path/Set and never caches mutable grid state.
  private visitSupercover(from: GridPosition, to: GridPosition, visit: (tile: GridPosition) => boolean) {
    let x = from.x;
    let y = from.y;
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const horizontalSteps = Math.abs(deltaX);
    const verticalSteps = Math.abs(deltaY);
    const stepX = Math.sign(deltaX);
    const stepY = Math.sign(deltaY);
    let horizontalProgress = 0;
    let verticalProgress = 0;
    if (!visit({ x,y })) return false;

    while (
      horizontalProgress < horizontalSteps ||
      verticalProgress < verticalSteps
    ) {
      const decision =
        (1 + horizontalProgress * 2) * verticalSteps -
        (1 + verticalProgress * 2) * horizontalSteps;
      if (decision === 0) {
        if (!visit({ x:x + stepX,y }) || !visit({ x,y:y + stepY })) return false;
        x += stepX;
        y += stepY;
        horizontalProgress++;
        verticalProgress++;
        if (!visit({ x,y })) return false;
      } else if (decision < 0) {
        x += stepX;
        horizontalProgress++;
        if (!visit({ x,y })) return false;
      } else {
        y += stepY;
        verticalProgress++;
        if (!visit({ x,y })) return false;
      }
    }
    return true;
  }

  hasLineOfSight(
    from: GridPosition,
    to: GridPosition,
    options: LineOfSightOptions = {},
  ) {
    return this.visitSupercover(from, to, (tile) => {
      const origin = sameGridPosition(tile, from);
      const endpoint = sameGridPosition(tile, to);
      if (origin && !options.blockOrigin) return true;
      if (!(endpoint && options.allowBlockedEndpoint) && !this.map.isWalkable(tile)) {
        return false;
      }
      if (options.blockUnits) {
        const occupantId = this.occupancy.occupantAt(tile);
        if (occupantId && !options.ignoreEntityIds?.includes(occupantId)) return false;
      }
      return true;
    });
  }

  visibleTiles(
    origin: GridPosition,
    candidates: GridPosition[],
    options: LineOfSightOptions = {},
  ) {
    const seen = new Set<string>();
    return candidates.filter((candidate) => {
      const key = gridKey(candidate);
      if (seen.has(key) || sameGridPosition(candidate, origin)) return false;
      seen.add(key);
      return this.hasLineOfSight(origin, candidate, options);
    });
  }
}
