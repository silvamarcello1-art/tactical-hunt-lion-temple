import { GridMap } from './GridMap';
import { OccupancyGrid } from './OccupancyGrid';
import { gridKey, sameGridPosition, type GridPosition } from './GridTypes';

export interface LineOfSightOptions {
  blockUnits?: boolean;
  ignoreEntityIds?: string[];
}

export class LineOfSightResolver {
  constructor(
    private readonly map: GridMap,
    private readonly occupancy: OccupancyGrid,
  ) {}

  trace(from: GridPosition, to: GridPosition) {
    const points: GridPosition[] = [];
    let x = from.x;
    let y = from.y;
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const stepX = from.x < to.x ? 1 : -1;
    const stepY = from.y < to.y ? 1 : -1;
    let error = dx - dy;

    while (true) {
      points.push({ x, y });
      if (x === to.x && y === to.y) break;
      const doubled = error * 2;
      if (doubled > -dy) {
        error -= dy;
        x += stepX;
      }
      if (doubled < dx) {
        error += dx;
        y += stepY;
      }
    }
    return points;
  }

  hasLineOfSight(
    from: GridPosition,
    to: GridPosition,
    options: LineOfSightOptions = {},
  ) {
    const ignored = new Set(options.ignoreEntityIds ?? []);
    const path = this.trace(from, to);
    for (const tile of path.slice(1, -1)) {
      if (!this.map.isWalkable(tile)) return false;
      if (options.blockUnits) {
        const occupantId = this.occupancy.occupantAt(tile);
        if (occupantId && !ignored.has(occupantId)) return false;
      }
    }
    return true;
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
