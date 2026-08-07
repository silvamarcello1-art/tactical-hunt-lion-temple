import { describe, expect, it } from 'vitest';
import { resolveFloorCompletion } from './FloorCompletion';

describe('resolveFloorCompletion', () => {
  it('reports victory only when the party lives and every enemy is dead', () => {
    expect(resolveFloorCompletion(true, false)).toEqual({
      victory:true,completionReason:'victory',
    });
  });

  it('reports party defeat instead of a false victory', () => {
    expect(resolveFloorCompletion(false, true)).toEqual({
      victory:false,completionReason:'party_defeated',
    });
  });

  it('reports an explicit stalemate while enemies remain alive', () => {
    expect(resolveFloorCompletion(true, true, true)).toEqual({
      victory:false,completionReason:'stalemate',
    });
  });

  it('reports the turn limit without claiming victory', () => {
    expect(resolveFloorCompletion(true, true, false, true)).toEqual({
      victory:false,completionReason:'turn_limit',
    });
  });
});
