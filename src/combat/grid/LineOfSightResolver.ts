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
    const seen = new Set<string>();
    const add = (position: GridPosition) => {
      const key = gridKey(position);
      if (seen.has(key)) return;
      seen.add(key);
      points.push(position);
    };
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
    add({ x,y });

    while (
      horizontalProgress < horizontalSteps ||
      verticalProgress < verticalSteps
    ) {
      const decision =
        (1 + horizontalProgress * 2) * verticalSteps -
        (1 + verticalProgress * 2) * horizontalSteps;
      if (decision === 0) {
        add({ x:x + stepX,y });
        add({ x,y:y + stepY });
        x += stepX;
        y += stepY;
        horizontalProgress++;
        verticalProgress++;
        add({ x,y });
      } else if (decision < 0) {
        x += stepX;
        horizontalProgress++;
        add({ x,y });
      } else {
        y += stepY;
        verticalProgress++;
        add({ x,y });
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
    for (const tile of this.trace(from, to)) {
      const origin = sameGridPosition(tile, from);
      const endpoint = sameGridPosition(tile, to);
      if (origin && !options.blockOrigin) continue;
      if (!(endpoint && options.allowBlockedEndpoint) && !this.map.isWalkable(tile)) {
        return false;
      }
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
