import {heroes} from '../data/config';
import {abilities,type AbilityDefinition} from '../data/abilities';
import type {EntitySnapshot} from '../events/types';
import type {EncounterSetup} from '../combat/EncounterSetup';

export const SAVE_KEY='tactical-hunt-roguelite-v1';
export type Upgrade='edge'|'heart'|'focus';
export type Biome='coast'|'forest'|'refuge';
export interface Run {id:string;seed:number;room:number;hp:number;embers:number;xp:number;cleared:boolean;choice?:Upgrade;upgrades:Upgrade[];elapsed:number}
export interface Chronicle {version:1;embers:number;rank:number;runs:number;victories:number;discoveries:string[];run?:Run;last?:{victory:boolean;earned:number;seconds:number}}
export const fresh=():Chronicle=>({version:1,embers:0,rank:0,runs:0,victories:0,discoveries:[]});
const finite=(n:unknown,max=1e8):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
export function decode(raw:string|null):Chronicle {
  if(!raw)return fresh();
  const d=JSON.parse(raw) as Chronicle;
  if(d.version!==1||!finite(d.embers)||!Number.isInteger(d.rank)||d.rank<0||d.rank>5||!finite(d.runs)||!finite(d.victories)||!Array.isArray(d.discoveries)||d.discoveries.some(x=>typeof x!=='string'))throw new Error('Save incompatível; preservado sem sobrescrever.');
  const r=d.run;
  if(r&&(!r.id||!Number.isInteger(r.seed)||!Number.isInteger(r.room)||r.room<0||r.room>=rooms.length||!finite(r.hp,10000)||r.hp===0||!finite(r.embers)||!finite(r.xp)||!finite(r.elapsed)||typeof r.cleared!=='boolean'||!Array.isArray(r.upgrades)||r.upgrades.some(x=>!['edge','heart','focus'].includes(x))||(r.choice!==undefined&&!['edge','heart','focus'].includes(r.choice))))throw new Error('Checkpoint inválido; original preservado.');
  return structuredClone(d);
}
export const upgradeNames:Record<Upgrade,string>={edge:'Fio da aurora',heart:'Raiz vital',focus:'Fôlego da maré'};
export const upgradeDescriptions:Record<Upgrade,string>={edge:'+18 de ataque nesta run · recupera 600 de vida',heart:'+320 de vida máxima · recupera 1000 de vida',focus:'+2 de mana por tick · recupera 600 de vida'};
export interface Room {id:string;name:string;subtitle:string;biome:Biome;waves:number;count:number;boss?:'mini'|'final';lore?:string}
export const rooms:readonly Room[]=[
  {id:'coast',name:'Costa das Cinzas',subtitle:'Prólogo · algo sobreviveu à maré',biome:'coast',waves:0,count:0,lore:'maré'},
  {id:'grove',name:'O caminho esquecido',subtitle:'Bosque I · avance sob as lanternas',biome:'forest',waves:2,count:3},
  {id:'roots',name:'Entre raízes',subtitle:'Bosque II · nem tudo dorme',biome:'forest',waves:2,count:4},
  {id:'watch',name:'A vigília partida',subtitle:'Bosque III · as pedras observam',biome:'forest',waves:2,count:4},
  {id:'shrine',name:'O altar sem nome',subtitle:'Descoberta · uma história apagada',biome:'forest',waves:0,count:0,lore:'altar'},
  {id:'warden',name:'Guardião das raízes',subtitle:'Miniboss · saia das marcas de impacto',biome:'forest',waves:1,count:2,boss:'mini'},
  {id:'hollow',name:'O bosque oco',subtitle:'Bosque IV · leve a chama adiante',biome:'forest',waves:2,count:4},
  {id:'ashes',name:'Ruínas do primeiro fogo',subtitle:'Ruínas I · os sentinelas retornam',biome:'coast',waves:2,count:4},
  {id:'whispers',name:'O vale dos sussurros',subtitle:'Bosque V · a maré já não alcança',biome:'forest',waves:2,count:4},
  {id:'threshold',name:'O último limiar',subtitle:'Ruínas II · prepare o golpe',biome:'coast',waves:2,count:4},
  {id:'regent',name:'O Regente da Maré',subtitle:'Boss · leia o aviso, mova, contra-ataque',biome:'coast',waves:1,count:2,boss:'final'},
];
export function stats(d:Chronicle){const u=d.run?.upgrades??[];return {maxHp:3500+d.rank*200+u.filter(x=>x==='heart').length*320,attack:110+u.filter(x=>x==='edge').length*18,manaPerTick:3+u.filter(x=>x==='focus').length*2};}
export function startRun(d:Chronicle,seed:number,id:string){if(d.run)return false;d.runs++;d.run={id,seed:seed>>>0,room:d.discoveries.includes('maré')?1:0,hp:stats(d).maxHp,embers:0,xp:0,cleared:false,upgrades:[],elapsed:0};return true;}
export function clearRoom(d:Chronicle){const r=d.run;if(!r||r.cleared)return false;r.cleared=true;r.embers+=rooms[r.room].boss?12:rooms[r.room].waves?8:6;r.xp+=rooms[r.room].boss?100:40;const lore=rooms[r.room].lore;if(lore==='altar'||rooms[r.room].boss==='mini'||rooms[r.room].id==='threshold')r.hp=stats(d).maxHp;if(lore&&!d.discoveries.includes(lore))d.discoveries.push(lore);if(rooms[r.room].boss==='mini'&&!d.discoveries.includes('guardião'))d.discoveries.push('guardião');return true;}
export function choose(d:Chronicle,u:Upgrade){const r=d.run;if(!r?.cleared||r.choice||!rooms[r.room].waves||rooms[r.room].boss==='final')return false;r.choice=u;r.upgrades.push(u);r.hp=Math.min(stats(d).maxHp,r.hp+(u==='heart'?1000:600));return true;}
export function nextRoom(d:Chronicle){const r=d.run;if(!r?.cleared||(rooms[r.room].waves>0&&!r.choice)||r.room>=rooms.length-1)return false;r.room++;r.cleared=false;delete r.choice;return true;}
export function settle(d:Chronicle,victory:boolean){const r=d.run;if(!r)return false;const earned=Math.floor(r.embers*(victory?1:.5));d.embers+=earned;d.victories+=Number(victory);d.last={victory,earned,seconds:Math.round(r.elapsed/1000)};if(victory&&!d.discoveries.includes('regente'))d.discoveries.push('regente');delete d.run;return true;}
export function forge(d:Chronicle){const cost=8+d.rank*12;if(d.run||d.rank>=5||d.embers<cost)return false;d.embers-=cost;d.rank++;return true;}
export function random(seed:number){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function blockedFor(biome:Biome,seed:number){const blocked:{x:number;y:number}[]=[];for(let y=2;y<=15;y++)for(let x=2;x<=27;x++)if((biome==='refuge'&&y<6)||(biome==='coast'&&(x<4||y>13||y<3))||(biome==='forest'&&(x<3||x>26||y<3||y>14)))blocked.push({x,y});
  // Small, seeded solid ruin fragments; the central east-west spine stays open.
  if(biome!=='refuge'){const rng=random(seed);for(const y of [5,12]){const x=11+Math.floor(rng()*8);blocked.push({x,y},{x:x+1,y});}}
  return blocked;
}
export function knight(d:Chronicle):EntitySnapshot{const s=stats(d);return {...structuredClone(heroes[0]),name:'O Retornado',hp:Math.min(d.run?.hp??s.maxHp,s.maxHp),maxHp:s.maxHp,mana:900,maxMana:900,attack:s.attack,defense:52,tileX:7,tileY:9,position:{x:224,y:288}};}
export function runAbilities(d:Chronicle):AbilityDefinition[]{const base=abilities.filter(a=>['berserk','groundshaker'].includes(a.id)).map(a=>({...a}));if(d.rank>0)base.push({...abilities.find(a=>a.id==='heal_friend')!,id:'renewal',name:'Chama interior',words:'Chama interior',vocation:'knight',cooldown:10000,rangeTiles:1,power:2.4});return base;}
export function encounter(d:Chronicle,hub=false):EncounterSetup {
  const r=d.run,room=hub?undefined:rooms[r?.room??0],rng=random((r?.seed??0)+(r?.room??0)*7919),floors:EntitySnapshot[][]=[];
  if(room&&!r?.cleared)for(let wave=0;wave<room.waves;wave++){
    const enemies:EntitySnapshot[]=[];for(let i=0;i<room.count;i++){const x=18+(i%2)*5,y=6+Math.floor(i/2)*5;const hp=650+(r?.room??0)*45+Math.floor(rng()*80);enemies.push({id:`${room.id}-${wave}-${i}`,name:i%3===2?'Vigia da cinza':'Errante do bosque',role:'monster',hp,maxHp:hp,mana:300,maxMana:300,attack:28+(r?.room??0),defense:12,crit:.04,dodge:.02,tileX:x,tileY:y,position:{x:x*32,y:y*32},color:0x79a888,archetype:i%3===2?'caster':'bruiser'});}
    if(room.boss){const hp=room.boss==='mini'?4800:9500;enemies.push({id:room.id,name:room.name,role:'boss',hp,maxHp:hp,mana:800,maxMana:800,attack:room.boss==='mini'?48:45,defense:24,crit:.07,dodge:.02,tileX:24,tileY:9,position:{x:768,y:288},color:0xefb260});}floors.push(enemies);
  }
  const player=knight(d);if(hub){player.tileX=14;player.tileY=10;player.position={x:448,y:320};}
  const blocked=blockedFor(hub?'refuge':room!.biome,r?.seed??0);if(hub)blocked.push({x:7,y:6},{x:14,y:6},{x:23,y:6});
  return {party:[player],floors:floors.length?floors:[[]],blocked,holdOpen:true,abilities:runAbilities(d),manaPerTick:stats(d).manaPerTick};
}
