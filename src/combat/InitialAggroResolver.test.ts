import { describe, expect, it } from 'vitest';
import { resolveInitialAggro, type AggroUnit } from './InitialAggroResolver';

const party: AggroUnit[] = [
  { id:'knight',role:'knight',tileX:3,tileY:5 },
  { id:'druid',role:'druid',tileX:10,tileY:3 },
  { id:'sorcerer',role:'sorcerer',tileX:10,tileY:7 },
];

const backlineEnemies = (count: number): AggroUnit[] =>
  Array.from({ length:count }, (_, index) => ({
    id:`enemy-${index + 1}`,
    role:'monster',
    tileX:10 + (index % 2),
    tileY:index % 2 ? 7 : 3,
  }));

const backlineTargets = (count: number) =>
  resolveInitialAggro(backlineEnemies(count), party, 2)
    .filter((assignment) => assignment.targetId !== 'knight')
    .map((assignment) => assignment.enemyId)
    .sort();

describe('initial aggro cap', () => {
  it.each([0, 1, 2])('preserves %i valid backline candidates', (count) => {
    expect(backlineTargets(count)).toHaveLength(count);
  });

  it.each([3, 6])('caps %i backline candidates at two', (count) => {
    const assignments = resolveInitialAggro(backlineEnemies(count), party, 2);
    expect(assignments.filter((assignment) => assignment.targetId !== 'knight'))
      .toHaveLength(2);
    expect(assignments.filter((assignment) => assignment.zone === 'back-capped'))
      .toHaveLength(count - 2);
  });

  it('selects the same two candidates deterministically', () => {
    const enemies = backlineEnemies(6);
    const first = backlineTargets(6);
    const reversed = resolveInitialAggro([...enemies].reverse(), party, 2)
      .filter((assignment) => assignment.targetId !== 'knight')
      .map((assignment) => assignment.enemyId)
      .sort();
    expect(first).toEqual(reversed);
    expect(first).toEqual(['enemy-1','enemy-3']);
  });

  it('classifies Knight ties as neutral and favors the frontline', () => {
    const assignments = resolveInitialAggro([
      { id:'neutral',role:'monster',tileX:6,tileY:5 },
    ], [
      { id:'knight',role:'knight',tileX:3,tileY:5 },
      { id:'druid',role:'druid',tileX:9,tileY:5 },
      { id:'sorcerer',role:'sorcerer',tileX:12,tileY:12 },
    ], 2);
    expect(assignments[0]).toMatchObject({
      enemyId:'neutral',targetId:'knight',zone:'neutral',
    });
  });

  it('applies the cap independently to newly spawned waves', () => {
    const firstWave = resolveInitialAggro(
      backlineEnemies(6),
      party,
      2,
    );
    const secondWave = resolveInitialAggro(
      backlineEnemies(6).map((enemy) => ({ ...enemy,id:`reinforcement-${enemy.id}` })),
      party,
      2,
    );
    for (const assignments of [firstWave,secondWave]) {
      expect(assignments.filter(
        (assignment) => assignment.targetId === 'druid' || assignment.targetId === 'sorcerer',
      )).toHaveLength(2);
    }
  });
});
