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

function square(radius: number) {
  const offsets: Point[] = [];
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      offsets.push({ x, y });
    }
  }
  return offsets;
}

function horizontalRows(widths: number[]) {
  const middle = Math.floor(widths.length / 2);
  return widths.flatMap((width, index) => {
    const half = Math.floor(width / 2);
    return Array.from({ length:width }, (_, cross) => ({
      x:cross - half,
      y:index - middle,
    }));
  });
}

export function abilityOffsets(abilityId: string): Point[] {
  if (abilityId === 'berserk') {
    return Array.from({ length:9 }, (_, index) => ({
      x: (index % 3) - 1,
      y: Math.floor(index / 3) - 1,
    }));
  }
  // A forma revisada em 2026 possui 25 SQMs num cone crescente.
  if (abilityId === 'strong_ice_wave') return waveRows([1, 3, 5, 7, 9]);
  // A wiki descreve explicitamente o cone como 1 / 1 / 3 / 3 / 3.
  if (abilityId === 'energy_wave') return waveRows([1, 1, 3, 3, 3]);
  // Groundshaker: 37 SQMs num padrão 7×7 com cantos aparados.
  if (abilityId === 'groundshaker') return horizontalRows([3, 5, 7, 7, 7, 5, 3]);
  // Eternal Winter: 61 SQMs, construídos como 7×7 + quatro braços de 3 tiles.
  if (abilityId === 'eternal_winter') {
    return [
      ...square(3),
      ...[-1, 0, 1].flatMap((cross) => [
        { x:cross, y:-4 },
        { x:cross, y:4 },
        { x:-4, y:cross },
        { x:4, y:cross },
      ]),
    ];
  }
  // Rage of the Skies: 85 SQMs, um campo 9×9 com quatro extremos cardeais.
  if (abilityId === 'rage_skies') {
    return [
      ...square(4),
      { x:0, y:-5 },
      { x:0, y:5 },
      { x:-5, y:0 },
      { x:5, y:0 },
    ];
  }
  if (abilityId === 'challenge') return square(7);
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
