import type { Direction } from '../../events/types';
import { abilityOffsets } from '../tiles';
import { GridMap } from './GridMap';
import { LineOfSightResolver } from './LineOfSightResolver';
import { gridKey, type GridPosition } from './GridTypes';

export interface SpellAreaOptions {
  requireLineOfSight?: boolean;
  blockUnits?: boolean;
  ignoreEntityIds?: string[];
}

const rotate = (offset: GridPosition, facing: Direction): GridPosition => {
  if (facing === 'right') return offset;
  if (facing === 'left') return { x: -offset.x, y: -offset.y };
  if (facing === 'down') return { x: -offset.y, y: offset.x };
  return { x: offset.y, y: -offset.x };
};

export class SpellAreaResolver {
  constructor(
    private readonly map: GridMap,
    private readonly lineOfSight: LineOfSightResolver,
  ) {}

  resolve(
    origin: GridPosition,
    abilityId: string,
    facing: Direction,
    options: SpellAreaOptions = {},
  ) {
    const seen = new Set<string>();
    return abilityOffsets(abilityId)
      .map((offset) => rotate(offset, facing))
      .map((offset) => ({ x: origin.x + offset.x, y: origin.y + offset.y }))
      .filter((position) => this.map.isInside(position))
      .filter((position) => {
        const key = gridKey(position);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .filter(
        (position) =>
          !options.requireLineOfSight ||
          this.lineOfSight.hasLineOfSight(origin, position, {
            blockUnits: options.blockUnits,
            ignoreEntityIds: options.ignoreEntityIds,
          }),
      );
  }
}
