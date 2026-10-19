/** Local training rules, NOT a claim of complete/live Tibia parity. */
export const runeDefinitions = {
  magic_wall:{id:'magic_wall',name:'Magic Wall',key:'4',code:'Digit4',range:7,cooldown:2000,duration:20000,charges:8},
  fire_field:{id:'fire_field',name:'Fire Field',key:'5',code:'Digit5',range:7,cooldown:2000,duration:15000,charges:12},
} as const;
export type RuneId = keyof typeof runeDefinitions;
export const isRuneId = (value:unknown):value is RuneId => value==='magic_wall'||value==='fire_field';
export const TRAINING_FIELD = {entryDamage:20,tickDamage:8,tickMs:1000,burnMs:5000};
