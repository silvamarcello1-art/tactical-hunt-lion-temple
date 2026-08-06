import { GridMap } from './GridMap';
import {
  cloneGridPosition,
  gridKey,
  type EntityFootprint,
  type GridPosition,
} from './GridTypes';

export type OccupancyBlockReason =
  | 'outside-map'
  | 'blocked-terrain'
  | 'occupied'
  | 'reserved';

export interface EnterResult {
  allowed: boolean;
  reason?: OccupancyBlockReason;
  blockingEntityId?: string;
}

export class OccupancyGrid {
  private readonly occupiedTiles = new Map<string, string>();
  private readonly reservedTiles = new Map<string, string>();
  private readonly entityPositions = new Map<string, GridPosition>();
  private readonly entityReservations = new Map<string, GridPosition>();
  private readonly footprints = new Map<string, EntityFootprint>();
  private revisionValue = 0;

  constructor(private readonly map: GridMap) {}

  get revision() {
    return this.revisionValue;
  }

  occupy(
    entityId: string,
    position: GridPosition,
    footprint: EntityFootprint = { width: 1, height: 1 },
  ) {
    const result = this.canEnter(entityId, position, footprint);
    if (!result.allowed) return result;
    this.release(entityId);
    this.footprints.set(entityId, footprint);
    this.entityPositions.set(entityId, cloneGridPosition(position));
    for (const tile of this.map.footprintTiles(position, footprint)) {
      this.occupiedTiles.set(gridKey(tile), entityId);
    }
    this.revisionValue++;
    return result;
  }

  release(entityId: string) {
    const hadPosition = this.entityPositions.has(entityId);
    for (const [key, occupantId] of this.occupiedTiles) {
      if (occupantId === entityId) this.occupiedTiles.delete(key);
    }
    this.entityPositions.delete(entityId);
    this.cancelReservation(entityId);
    if (hadPosition) this.revisionValue++;
  }

  reserve(
    entityId: string,
    position: GridPosition,
    footprint = this.footprints.get(entityId) ?? { width: 1, height: 1 },
  ) {
    const result = this.canEnter(entityId, position, footprint);
    if (!result.allowed) return result;
    this.cancelReservation(entityId);
    this.entityReservations.set(entityId, cloneGridPosition(position));
    for (const tile of this.map.footprintTiles(position, footprint)) {
      this.reservedTiles.set(gridKey(tile), entityId);
    }
    this.revisionValue++;
    return result;
  }

  cancelReservation(entityId: string) {
    const hadReservation = this.entityReservations.has(entityId);
    for (const [key, reservationId] of this.reservedTiles) {
      if (reservationId === entityId) this.reservedTiles.delete(key);
    }
    this.entityReservations.delete(entityId);
    if (hadReservation) this.revisionValue++;
  }

  commitReservation(entityId: string) {
    const destination = this.entityReservations.get(entityId);
    if (!destination) return false;
    const footprint = this.footprints.get(entityId) ?? { width: 1, height: 1 };
    this.cancelReservation(entityId);
    this.releaseOccupiedOnly(entityId);
    this.entityPositions.set(entityId, cloneGridPosition(destination));
    for (const tile of this.map.footprintTiles(destination, footprint)) {
      this.occupiedTiles.set(gridKey(tile), entityId);
    }
    this.revisionValue++;
    return true;
  }

  canEnter(
    entityId: string,
    position: GridPosition,
    footprint: EntityFootprint = { width: 1, height: 1 },
  ): EnterResult {
    if (!this.map.isInside(position, footprint)) {
      return { allowed: false, reason: 'outside-map' };
    }
    if (!this.map.isWalkable(position, footprint)) {
      return { allowed: false, reason: 'blocked-terrain' };
    }
    for (const tile of this.map.footprintTiles(position, footprint)) {
      const key = gridKey(tile);
      const occupantId = this.occupiedTiles.get(key);
      if (occupantId && occupantId !== entityId) {
        return {
          allowed: false,
          reason: 'occupied',
          blockingEntityId: occupantId,
        };
      }
      const reservationId = this.reservedTiles.get(key);
      if (reservationId && reservationId !== entityId) {
        return {
          allowed: false,
          reason: 'reserved',
          blockingEntityId: reservationId,
        };
      }
    }
    return { allowed: true };
  }

  occupantAt(position: GridPosition) {
    return this.occupiedTiles.get(gridKey(position));
  }

  reservedBy(position: GridPosition) {
    return this.reservedTiles.get(gridKey(position));
  }

  positionOf(entityId: string) {
    const position = this.entityPositions.get(entityId);
    return position ? cloneGridPosition(position) : undefined;
  }

  reservationOf(entityId: string) {
    const position = this.entityReservations.get(entityId);
    return position ? cloneGridPosition(position) : undefined;
  }

  occupiedEntries() {
    return [...this.entityPositions.entries()].map(([entityId, position]) => ({
      entityId,
      position: cloneGridPosition(position),
    }));
  }

  reservedEntries() {
    return [...this.entityReservations.entries()].map(([entityId, position]) => ({
      entityId,
      position: cloneGridPosition(position),
    }));
  }

  findNearestFree(
    origin: GridPosition,
    entityId: string,
    footprint: EntityFootprint = { width: 1, height: 1 },
  ) {
    const queue = [cloneGridPosition(origin)];
    const visited = new Set([gridKey(origin)]);
    while (queue.length) {
      const candidate = queue.shift()!;
      if (this.canEnter(entityId, candidate, footprint).allowed) return candidate;
      for (const neighbor of this.map.neighbors(candidate, footprint)) {
        const key = gridKey(neighbor);
        if (visited.has(key)) continue;
        visited.add(key);
        queue.push(neighbor);
      }
    }
    return undefined;
  }

  private releaseOccupiedOnly(entityId: string) {
    const hadPosition = this.entityPositions.has(entityId);
    for (const [key, occupantId] of this.occupiedTiles) {
      if (occupantId === entityId) this.occupiedTiles.delete(key);
    }
    this.entityPositions.delete(entityId);
    if (hadPosition) this.revisionValue++;
  }
}
