import { GridMap } from './GridMap';
import { OccupancyGrid } from './OccupancyGrid';
import {
  gridDistance,
  gridKey,
  type GridPosition,
} from './GridTypes';

export interface FiringPositionRequest {
  entityId: string;
  origin: GridPosition;
  reachableTiles: Set<string>;
  map: GridMap;
  occupancy: OccupancyGrid;
  isValidFiringTile: (position: GridPosition) => boolean;
  tacticalScore?: (position: GridPosition) => number;
  isCandidateAllowed?: (position: GridPosition) => boolean;
}

export const findReachableFiringTile = (
  request: FiringPositionRequest,
): GridPosition | undefined => {
  const candidates = [...request.reachableTiles]
    .map((key) => {
      const [x,y] = key.split(':').map(Number);
      return { x,y };
    })
    .filter((position) => gridKey(position) !== gridKey(request.origin))
    .filter((position) => request.map.isWalkable(position))
    .filter((position) => request.occupancy.canEnter(request.entityId, position).allowed)
    .filter((position) => request.isCandidateAllowed?.(position) ?? true)
    .filter(request.isValidFiringTile)
    .map((position) => ({
      position,
      pathCost:gridDistance(request.origin, position),
      tacticalScore:request.tacticalScore?.(position) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.tacticalScore - left.tacticalScore ||
        left.pathCost - right.pathCost ||
        left.position.y - right.position.y ||
        left.position.x - right.position.x,
    );

  return candidates[0]?.position;
};
