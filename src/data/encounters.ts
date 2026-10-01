export const monsterProfiles = {
  bruiser:{name:'Custódio da Juba',description:'Guarda pesado que sustenta a linha de frente.',range:1,minRange:1,cadence:4,damage:1.18,color:0xc3a375},
  hunter:{name:'Vigia do Arco Oco',description:'Caçador que recua para preservar sua linha de tiro.',range:6,minRange:3,cadence:4,damage:.85,color:0x82b69c},
  flanker:{name:'Garra do Crepúsculo',description:'Predador ágil que procura brechas na retaguarda.',range:1,minRange:1,cadence:3,damage:.8,color:0xc68c93},
  caster:{name:'Oráculo das Cinzas',description:'Conjurador que alinha rajadas entre os pilares.',range:5,minRange:2,cadence:6,damage:.75,color:0xa79bc9},
} as const;
export const bossSpecial={id:'temple-collapse',name:'Queda da Coroa',requiresTelegraph:true,warningMs:1250,rubbleMs:3000};
export const monsterWave={id:'ash-fan',name:'Sopro de Cinzas',requiresTelegraph:false};
