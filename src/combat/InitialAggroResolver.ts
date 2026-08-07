import { gridDistance, type GridPosition } from './grid/GridTypes';

export interface AggroUnit {
  id: string;
  role: string;
  tileX: number;
  tileY: number;
}

export interface InitialAggroAssignment {
  enemyId: string;
  targetId: string;
  zone: 'front' | 'back' | 'neutral' | 'back-capped';
}

const tileOf = (unit: AggroUnit): GridPosition => ({ x:unit.tileX,y:unit.tileY });

export function resolveInitialAggro(
  enemies: AggroUnit[],
  party: AggroUnit[],
  maxInitialBacklineAttackers = 2,
) {
  const aliveParty = [...party].sort((left, right) => left.id.localeCompare(right.id));
  const knight = aliveParty.find((hero) => hero.role === 'knight');
  const assignments = enemies.map((enemy): InitialAggroAssignment => {
    const ranked = aliveParty
      .map((hero) => ({
        hero,
        distance:gridDistance(tileOf(enemy), tileOf(hero)),
      }))
      .sort(
        (left, right) =>
          left.distance - right.distance ||
          Number(right.hero.role === 'knight') - Number(left.hero.role === 'knight') ||
          left.hero.id.localeCompare(right.hero.id),
      );
    const selected = ranked[0];
    const tied = ranked.filter((candidate) => candidate.distance === selected.distance);
    return {
      enemyId:enemy.id,
      targetId:selected.hero.id,
      zone:
        selected.hero.role === 'knight'
          ? tied.length > 1
            ? 'neutral'
            : 'front'
          : 'back',
    };
  });

  if (!knight) return assignments;
  const enemyById = new Map(enemies.map((enemy) => [enemy.id, enemy]));
  const heroById = new Map(aliveParty.map((hero) => [hero.id, hero]));
  const allowedBackline = new Set(
    assignments
      .filter((assignment) => assignment.zone === 'back')
      .sort((left, right) => {
        const leftEnemy = enemyById.get(left.enemyId)!;
        const rightEnemy = enemyById.get(right.enemyId)!;
        const leftTarget = heroById.get(left.targetId)!;
        const rightTarget = heroById.get(right.targetId)!;
        return (
          gridDistance(tileOf(leftEnemy), tileOf(leftTarget)) -
            gridDistance(tileOf(rightEnemy), tileOf(rightTarget)) ||
          left.enemyId.localeCompare(right.enemyId)
        );
      })
      .slice(0, Math.max(0, maxInitialBacklineAttackers))
      .map((assignment) => assignment.enemyId),
  );
  return assignments.map((assignment) =>
    assignment.zone === 'back' && !allowedBackline.has(assignment.enemyId)
      ? {
          ...assignment,
          targetId:knight.id,
          zone:'back-capped' as const,
        }
      : assignment,
  );
}
