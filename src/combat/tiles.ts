import type { Direction, Point } from '../events/types';

export const TILE_SIZE = 32;
export const MAP_TILES = { width: 30, height: 18 };

export const tile = (x: number, y: number): Point => ({
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
});

export const tileKey = (point: Point) => `${point.x}:${point.y}`;

export const tileDistance = (a: Point, b: Point) =>
  Math.max(
    Math.abs(a.x - b.x) / TILE_SIZE,
    Math.abs(a.y - b.y) / TILE_SIZE,
  );

export const snapToTile = (point: Point): Point => ({
  x: Math.round(point.x / TILE_SIZE) * TILE_SIZE,
  y: Math.round(point.y / TILE_SIZE) * TILE_SIZE,
});

export function directionTo(from: Point, to: Point): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

export function stepToward(from: Point, to: Point): Point {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  return {
    x: Math.max(TILE_SIZE, Math.min((MAP_TILES.width - 2) * TILE_SIZE, from.x + dx * TILE_SIZE)),
    y: Math.max(TILE_SIZE * 2, Math.min((MAP_TILES.height - 2) * TILE_SIZE, from.y + dy * TILE_SIZE)),
  };
}

function rotate(offset: Point, facing: Direction): Point {
  if (facing === 'right') return offset;
  if (facing === 'left') return { x: -offset.x, y: -offset.y };
  if (facing === 'down') return { x: -offset.y, y: offset.x };
  return { x: offset.y, y: -offset.x };
}

function waveRows(widths: number[]) {
  const offsets: Point[] = [];
  widths.forEach((width, row) => {
    const half = Math.floor(width / 2);
    for (let cross = -half; cross <= half; cross++) {
      offsets.push({ x: row + 1, y: cross });
    }
  });
  return offsets;
}

function diamond(radius: number, trim = 0) {
  const offsets: Point[] = [];
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      if (Math.abs(x) + Math.abs(y) <= radius + trim) offsets.push({ x, y });
    }
  }
  return offsets;
}

export function abilityOffsets(abilityId: string): Point[] {
  if (abilityId === 'berserk') {
    return Array.from({ length: 9 }, (_, index) => ({
      x: (index % 3) - 1,
      y: Math.floor(index / 3) - 1,
    }));
  }
  if (abilityId === 'strong_ice_wave') return waveRows([1, 1, 3, 3, 5]);
  if (abilityId === 'energy_wave') return waveRows([1, 1, 3, 3, 3]);
  if (abilityId === 'groundshaker') return diamond(3, 1);
  if (abilityId === 'eternal_winter') return diamond(5, 0);
  if (abilityId === 'rage_skies') return diamond(6, 0);
  if (abilityId === 'challenge') return diamond(7, 0);
  return [{ x: 1, y: 0 }];
}

export function worldTiles(
  origin: Point,
  abilityId: string,
  facing: Direction,
): Point[] {
  return abilityOffsets(abilityId)
    .map((offset) => {
      const adjusted = rotate(offset, facing);
      return {
        x: origin.x + adjusted.x * TILE_SIZE,
        y: origin.y + adjusted.y * TILE_SIZE,
      };
    })
    .filter(
      (point) =>
        point.x >= 0 &&
        point.y >= 0 &&
        point.x < MAP_TILES.width * TILE_SIZE &&
        point.y < MAP_TILES.height * TILE_SIZE,
    );
}

export const pointInTiles = (point: Point, tiles: Point[]) => {
  const key = tileKey(snapToTile(point));
  return tiles.some((candidate) => tileKey(candidate) === key);
};
