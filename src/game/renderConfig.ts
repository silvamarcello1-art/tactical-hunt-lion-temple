import {TILE_SIZE,MAP_TILES} from '../combat/tiles';
/** Shared framing policy; logical map creation never reads CSS. */
export const WORLD_VIEW={tileSize:TILE_SIZE,columns:15,rows:11,characterScale:.62,trainingColumns:36,trainingRows:18} as const;
export const RENDER_CONFIG = {
  arena:{
    width:MAP_TILES.width*TILE_SIZE,
    height:MAP_TILES.height*TILE_SIZE,
    tileSize:TILE_SIZE,
    maxResolution:2,
    cameraBounds:{ x:0,y:0,width:960,height:576 },
    debugEnabled:false,
  },
  entity:{
    scale:1,
    heroScale:.19,
    monsterScale:1.08,
    bossScale:1.22,
    spawnDuration:240,
    movementDuration:220,
    attackDuration:320,
    castDuration:380,
    hurtDuration:180,
    deathDuration:340,
    floorTransitionDuration:650,
    healthBarOffset:{
      hero:-54,
      monster:-29,
      boss:-38,
    },
    nameOffset:{
      hero:-66,
      monster:-41,
      boss:-51,
    },
  },
  effects:{
    tileDuration:820,
    tileCascadeDelay:42,
    projectileDuration:180,
    aggroDuration:420,
    pulseDuration:160,
    spellLabelDuration:900,
    floatingTextDuration:600,
  },
  vitals:{
    dangerThreshold:.3,
    warningThreshold:.6,
    healthyColor:0x43c965,
    warningColor:0xe2c245,
    dangerColor:0xdf4848,
    manaColor:0x438ce1,
  },
} as const;
