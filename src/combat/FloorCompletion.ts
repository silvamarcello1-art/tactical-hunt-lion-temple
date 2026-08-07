export type FloorCompletionReason =
  | 'victory'
  | 'party_defeated'
  | 'stalemate'
  | 'turn_limit';

export interface FloorCompletionState {
  victory: boolean;
  completionReason: FloorCompletionReason;
}

export const resolveFloorCompletion = (
  partyAlive: boolean,
  enemiesAlive: boolean,
  interruptedByStalemate = false,
  reachedTurnLimit = false,
): FloorCompletionState => {
  if (partyAlive && !enemiesAlive) {
    return { victory:true,completionReason:'victory' };
  }
  if (!partyAlive) {
    return { victory:false,completionReason:'party_defeated' };
  }
  if (interruptedByStalemate) {
    return { victory:false,completionReason:'stalemate' };
  }
  return {
    victory:false,
    completionReason:reachedTurnLimit ? 'turn_limit' : 'stalemate',
  };
};
