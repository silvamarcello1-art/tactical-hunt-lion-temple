export interface GridPosition {
  x: number;
  y: number;
}

export interface EntityFootprint {
  width: number;
  height: number;
}

export interface GridTile {
  position: GridPosition;
  walkable: boolean;
  terrainCost: number;
}

export interface GridMetrics {
  pathRecalculations: number;
  blockedMoves: number;
  reservationConflicts: number;
  totalPathLength: number;
  completedPaths: number;
  stuckRecoveries: number;
}

export const gridKey = (position: GridPosition) => `${position.x}:${position.y}`;

export const sameGridPosition = (left: GridPosition, right: GridPosition) =>
  left.x === right.x && left.y === right.y;

export const gridDistance = (left: GridPosition, right: GridPosition) =>
  Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y));

export const cloneGridPosition = (position: GridPosition): GridPosition => ({
  x:position.x,
  y:position.y,
});

export const createGridMetrics = (): GridMetrics => ({
  pathRecalculations:0,
  blockedMoves:0,
  reservationConflicts:0,
  totalPathLength:0,
  completedPaths:0,
  stuckRecoveries:0,
});
