import {
  cloneGridPosition,
  gridKey,
  type EntityFootprint,
  type GridPosition,
  type GridTile,
} from './GridTypes';

export class GridMap {
  private readonly blocked = new Set<string>();
  private readonly terrainCosts = new Map<string, number>();
  private revisionValue = 0;

  constructor(
    readonly width: number,
    readonly height: number,
    readonly bounds = { minX:0, maxX:width - 1, minY:0, maxY:height - 1 },
    blocked: GridPosition[] = [],
  ) {
    for (const position of blocked) this.setBlocked(position, true);
  }

  get revision() {
    return this.revisionValue;
  }

  isInside(position: GridPosition, footprint: EntityFootprint = { width:1, height:1 }) {
    return (
      Number.isInteger(position.x) &&
      Number.isInteger(position.y) &&
      position.x >= this.bounds.minX &&
      position.y >= this.bounds.minY &&
      position.x + footprint.width - 1 <= this.bounds.maxX &&
      position.y + footprint.height - 1 <= this.bounds.maxY
    );
  }

  footprintTiles(position: GridPosition, footprint: EntityFootprint = { width:1, height:1 }) {
    const tiles: GridPosition[] = [];
    for (let x = 0; x < footprint.width; x++) {
      for (let y = 0; y < footprint.height; y++) {
        tiles.push({ x:position.x + x, y:position.y + y });
      }
    }
    return tiles;
  }

  isWalkable(position: GridPosition, footprint: EntityFootprint = { width:1, height:1 }) {
    return (
      this.isInside(position, footprint) &&
      this.footprintTiles(position, footprint).every(
        (tile) => !this.blocked.has(gridKey(tile)),
      )
    );
  }

  setBlocked(position: GridPosition, blocked: boolean) {
    const key = gridKey(position);
    const changed = blocked ? !this.blocked.has(key) : this.blocked.has(key);
    if (!changed) return;
    if (blocked) this.blocked.add(key);
    else this.blocked.delete(key);
    this.revisionValue++;
  }

  setTerrainCost(position: GridPosition, cost: number) {
    const key = gridKey(position);
    const normalized = Math.max(1, Math.round(cost));
    if ((this.terrainCosts.get(key) ?? 1) === normalized) return;
    this.terrainCosts.set(key, normalized);
    this.revisionValue++;
  }

  tile(position: GridPosition): GridTile {
    return {
      position:cloneGridPosition(position),
      walkable:this.isWalkable(position),
      terrainCost:this.terrainCosts.get(gridKey(position)) ?? 1,
    };
  }

  blockedTiles() {
    return [...this.blocked].map((key) => {
      const [x,y] = key.split(':').map(Number);
      return { x,y };
    });
  }

  neighbors(position: GridPosition, footprint: EntityFootprint = { width:1, height:1 }) {
    const directions = [
      { x:0,y:-1 }, { x:-1,y:0 }, { x:1,y:0 }, { x:0,y:1 },
      { x:-1,y:-1 }, { x:1,y:-1 }, { x:-1,y:1 }, { x:1,y:1 },
    ];
    return directions
      .map((direction) => ({
        x:position.x + direction.x,
        y:position.y + direction.y,
      }))
      .filter((candidate) => this.isWalkable(candidate, footprint))
      .filter((candidate) => {
        const diagonal = candidate.x !== position.x && candidate.y !== position.y;
        if (!diagonal) return true;
        return (
          this.isWalkable({ x:candidate.x,y:position.y }, footprint) &&
          this.isWalkable({ x:position.x,y:candidate.y }, footprint)
        );
      });
  }
}
