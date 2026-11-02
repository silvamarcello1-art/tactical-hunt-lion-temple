import type {EntitySnapshot} from '../events/types';
import type {AbilityDefinition} from '../data/abilities';
import type {GridPosition} from './grid/GridTypes';

/** Optional encounter data. Legacy Hunt defaults and timeline remain unchanged. */
export interface EncounterSetup {
  party:EntitySnapshot[];
  floors:EntitySnapshot[][];
  blocked:GridPosition[];
  holdOpen?:boolean;
  abilities?:AbilityDefinition[];
  manaPerTick?:number;
}
