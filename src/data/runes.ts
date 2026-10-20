/** Local training rules, NOT a claim of complete/live Tibia parity. */
export const runeDefinitions = {
  magic_wall:{id:'magic_wall',name:'Magic Wall',key:'4',code:'Digit4',range:7,cooldown:2000,duration:20000,charges:8,group:'attack',purpose:'Bloqueia um tile livre',target:'tile'},
  fire_field:{id:'fire_field',name:'Fire Field',key:'5',code:'Digit5',range:7,cooldown:2000,duration:15000,charges:12,group:'attack',purpose:'Campo de fogo e burning',target:'tile'},
  sudden_death:{id:'sudden_death',name:'Sudden Death',key:'6',code:'Digit6',range:7,cooldown:2000,duration:0,charges:12,group:'attack',purpose:'Disparo de morte em um inimigo',target:'enemy'},
  destroy_field:{id:'destroy_field',name:'Destroy Field',key:'7',code:'Digit7',range:7,cooldown:2000,duration:0,charges:12,group:'support',purpose:'Remove fogo; não remove Magic Wall nem burning',target:'tile'},
} as const;
export type RuneId = keyof typeof runeDefinitions;
export type TerrainRuneId='magic_wall'|'fire_field';
export const isRuneId = (value:unknown):value is RuneId => typeof value==='string'&&Object.hasOwn(runeDefinitions,value);
export const TRAINING_SD = {baseDamage:160,magicMultiplier:1.8,travelTime:400};
export const TRAINING_FIELD = {entryDamage:20,tickDamage:8,tickMs:1000,burnMs:5000};
