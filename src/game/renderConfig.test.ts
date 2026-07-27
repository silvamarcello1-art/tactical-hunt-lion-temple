import { describe,expect,it } from 'vitest';
import { SESSION_CONFIG } from '../app/sessionConfig';
import { HUNT_LAYOUT_CONFIG } from '../data/config';
import type { Point } from '../events/types';
import { RENDER_CONFIG } from './renderConfig';

const allConfiguredPoints = (): Point[] => [
  ...Object.values(HUNT_LAYOUT_CONFIG.partyPositions),
  ...HUNT_LAYOUT_CONFIG.enemySpawnPositions.flat(),
  ...HUNT_LAYOUT_CONFIG.enemyCombatPositions,
  HUNT_LAYOUT_CONFIG.bossPosition,
];

describe('configuração visual da hunt', () => {
  it('mantém posições configuradas dentro da arena e alinhadas aos tiles', () => {
    const { width,height,tileSize,cameraBounds } = RENDER_CONFIG.arena;
    expect(width).toBe(HUNT_LAYOUT_CONFIG.arenaColumns * tileSize);
    expect(height).toBe(HUNT_LAYOUT_CONFIG.arenaRows * tileSize);
    expect(cameraBounds).toEqual({ x:0,y:0,width,height });

    for (const point of allConfiguredPoints()) {
      expect(point.x).toBeGreaterThanOrEqual(cameraBounds.x);
      expect(point.y).toBeGreaterThanOrEqual(cameraBounds.y);
      expect(point.x).toBeLessThanOrEqual(cameraBounds.width);
      expect(point.y).toBeLessThanOrEqual(cameraBounds.height);
      expect(point.x % tileSize).toBe(0);
      expect(point.y % tileSize).toBe(0);
    }
  });

  it('centraliza escalas e durações obrigatórias com valores válidos', () => {
    expect(RENDER_CONFIG.entity.scale).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.heroScale).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.monsterScale).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.bossScale).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.movementDuration).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.attackDuration).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.castDuration).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.hurtDuration).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.deathDuration).toBeGreaterThan(0);
    expect(RENDER_CONFIG.entity.floorTransitionDuration).toBeGreaterThan(0);
    expect(RENDER_CONFIG.effects.projectileDuration).toBeGreaterThan(0);
    expect(RENDER_CONFIG.effects.floatingTextDuration).toBeGreaterThan(0);
    expect(SESSION_CONFIG.defaultSpeed).toBeGreaterThan(0);
    expect(RENDER_CONFIG.arena.debugEnabled).toBe(false);
  });
});
