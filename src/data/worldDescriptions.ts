import type { EntitySnapshot, GridPoint } from '../events/types';
import { HUNT_LAYOUT_CONFIG } from './config';
export const worldObjects={
  pillar:{displayName:'Pilar da Vigília',description:'Pedra antiga, marcada pela juba do templo.',type:'landmark',actions:['look']},
  floor:{displayName:'Pátio do Templo Vazio',description:'Lajes gastas por antigas expedições.',type:'terrain',actions:['look']},
};
export function describeWorld(entity?:Readonly<EntitySnapshot>,tile?:GridPoint) {
  if(entity) return `Você vê ${entity.name}. ${entity.description??(entity.role==='monster'?'Sentinela do templo.':'Integrante da expedição.')} HP ${Math.ceil(entity.hp)}/${entity.maxHp}.`;
  const object=HUNT_LAYOUT_CONFIG.blockedTiles.some(p=>p.x===tile?.x&&p.y===tile?.y)?worldObjects.pillar:worldObjects.floor;
  return `Você vê ${object.displayName}. ${object.description}`;
}
