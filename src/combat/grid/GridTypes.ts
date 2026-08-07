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
  consecutiveNoRoute: number;
  movementFailures: number;
  consecutiveMovementFailures: number;
  firingPositionRecoveries: number;
  destinationCooldowns: number;
  oscillationPrevented: number;
  maxPendingMovements: number;
  maxPendingProjectiles: number;
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
  consecutiveNoRoute:0,
  movementFailures:0,
  consecutiveMovementFailures:0,
  firingPositionRecoveries:0,
  destinationCooldowns:0,
  oscillationPrevented:0,
  maxPendingMovements:0,
  maxPendingProjectiles:0,
});
