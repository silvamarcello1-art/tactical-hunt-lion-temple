// Original vector blockouts, authored for Tactical Hunt. No external artwork input.
// Regenerate checked-in SVG sheets and their metadata with pnpm art:generate.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../public/assets/original');
const facings = ['south','east','north','west'];
const clips = {idle:[1,500,true],walk:[4,110,true],attack:[3,105,false],cast:[3,125,false],hit:[1,180,false],death:[4,90,false]};
const actors = [
  ['knight','characters','#656c70','#602d39','#b49957',true,false],
  ['druid','characters','#4b5946','#343e32','#b59a64',false,false],
  ['sorcerer','characters','#3d3f50','#45365a','#9ea7ba',false,false],
  ['lion-guard','creatures','#89764c','#3f4445','#c0a363',true,true],
  ['lion-oracle','creatures','#605a47','#4c5963','#b4ced0',false,true],
  ['lion-hunter','creatures','#586450','#344e46','#82b69c',false,true],
  ['lion-flanker','creatures','#644b52','#392e3d','#c68c93',false,true],
  ['bronze-bastion','creatures','#7e693b','#443b2f','#d0ae64',true,false],
  ['wandering-ballista','creatures','#4d6169','#2f3942','#97c7d6',false,false],
  ['hollow-regent','bosses','#615e53','#572c38','#b59b58',true,true],
];
const definitions = [];
const poly = (points,fill) => `<path d="${points}" fill="${fill}" stroke="#181b1c" stroke-width="1.2" stroke-linejoin="round"/>`;
for (const [id,folder,metal,cloth,accent,heavy,feline] of actors) {
  const boss = folder === 'bosses';
  const width = boss ? 15 : heavy ? 12 : 9;
  let content = ''; let row = 0;
  const animations = {id,clips:{},footAnchor:{x:.5,y:.875},visualOffset:{x:0,y:0}};
  for (const [action,[count,duration,loop]] of Object.entries(clips)) {
    animations.clips[action] = {};
    for (let dir = 0; dir < 4; dir++) {
      animations.clips[action][facings[dir]] = {frames:Array.from({length:count},(_,i) => `${dir}:${row+i}`),frameCount:count,frameDuration:duration,frameRate:1000/duration,loop};
      for (let frame = 0; frame < count; frame++) {
        const profile = dir === 1 || dir === 3; const back = dir === 2;
        const step = action === 'walk' ? [0,2,0,-2][frame] : 0;
        const lean = action === 'hit' ? -3 : action === 'attack' ? [0,3,0][frame] : 0;
        const death = action === 'death' ? frame/3 : 0;
        const mirror = dir === 3 ? -1 : 1;
        let art = '';
        // Boots meet the common footpoint; robes stop above them.
        art += poly(`M ${-7+step} -12 h 6 v 11 h -8 Z`,'#333330');
        art += poly(`M ${2-step} -12 h 6 l 2 11 h -8 Z`,'#333330');
        art += poly(`M ${-width+2} -36 Q 0 -43 ${width-2} -36 L ${width+2} -6 Q 0 -1 ${-width-2} -6 Z`,cloth);
        art += poly(`M ${-width} -35 L -6 -42 H 6 L ${width} -35 L ${width-2} -20 H ${-width+2} Z`,metal);
        if (heavy) {
          art += poly(`M ${-width-3} -35 l 8 -4 3 10 -11 1 Z`,metal);
          art += poly(`M ${width+3} -35 l -8 -4 -3 10 11 1 Z`,metal);
          art += `<path d="M -8 -31 L 0 -26 8 -31 M -8 -23 H 8" fill="none" stroke="${accent}" stroke-width="1.5"/>`;
        } else {
          art += poly('M -10 -36 L 0 -45 10 -36 0 -29 Z',cloth);
          art += `<path d="M -5 -23 L 0 -28 5 -23 0 -18 Z" fill="none" stroke="${accent}" stroke-width="1.5"/>`;
        }
        if (feline) art += poly('M -10 -44 L -11 -51 -5 -48 Q 0 -53 5 -48 L 11 -51 10 -41 5 -35 -5 -35 Z','#695039');
        art += poly(profile ? 'M -5 -47 L 5 -49 9 -44 11 -40 6 -37 -5 -39 Z' : 'M -7 -47 Q 0 -52 7 -47 L 7 -40 3 -36 -3 -36 -7 -40 Z',feline ? '#ad8f58' : heavy ? '#818786' : '#a8987d');
        if (back) art += poly('M -8 -47 Q 0 -53 8 -47 L 9 -36 -9 -36 Z',feline ? '#695039' : heavy ? metal : cloth);
        else art += `<path d="${profile ? 'M 4 -43 h 4' : 'M -5 -43 h 3 M 2 -43 h 3'}" stroke="#171d1e" stroke-width="2"/>`;
        if (back) art += `<path d="M -4 -26 a 5 5 0 1 1 8 0" stroke="${accent}" stroke-width="1.4" fill="none"/>`;
        if (boss) art += poly('M -10 -47 L -12 -53 -4 -51 0 -54 4 -51 12 -53 10 -47 Z',accent);
        const weaponAngle = action === 'attack' ? [-15,-65,10][frame] : 0;
        art += `<g transform="rotate(${weaponAngle} 14 -26)">`;
        if (heavy) art += poly(boss ? 'M 14 -7 V -35 H 8 V -45 H 23 V -35 H 18 V -7 Z' : 'M 15 -10 V -36 L 18 -43 20 -36 V -10 Z',boss ? '#7b7970' : '#b6bdb5');
        else {
          art += '<path d="M 15 -6 L 15 -44" stroke="#a48d66" stroke-width="3"/>';
          art += poly('M 15 -51 L 20 -45 15 -39 10 -45 Z',id === 'druid' ? '#91a572' : '#9892bd');
          if (action === 'cast') art += `<circle cx="15" cy="-45" r="${7+frame*2}" stroke="${accent}" opacity="${.8-frame*.2}" fill="none"/>`;
        }
        art += '</g>';
        if (heavy && !back) art += poly('M -18 -30 L -8 -33 -6 -17 -13 -12 -19 -19 Z',cloth);
        if(id==='lion-hunter')art+='<path d="M -17 -40 Q -32 -26 -17 -10 L -17 -40" stroke="#bfa874" stroke-width="2" fill="none"/>';
        if(id==='lion-flanker')art+=poly('M -16 -28 L -23 -38 -21 -21 -13 -17 Z','#c7b2b4');
        if(id==='bronze-bastion')art+=poly('M -22 -45 L -6 -45 -6 -8 -14 -4 -23 -12 Z','#b19453')+poly('M -20 -41 L -10 -41 -10 -16 -16 -12 -20 -18 Z','#574b32');
        if(id==='wandering-ballista')art+='<path d="M -20 -31 L 20 -31 M -18 -44 Q -26 -31 -18 -18 M 18 -44 Q 26 -31 18 -18 M -11 -4 L -21 2 M 11 -4 L 21 2" fill="none" stroke="#b7cbd0" stroke-width="3"/>';
        content += `<g transform="translate(${dir*64+32} ${(row+frame)*64+56})"><g transform="scale(${mirror*(profile?.78:1)} 1) translate(${lean} 0) rotate(${death*20}) scale(1 ${1-death*.45})">${art}</g></g>`;
      }
    }
    row += count;
  }
  await mkdir(resolve(root,folder),{recursive:true});
  await writeFile(resolve(root,folder,`${id}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="${row*64}" viewBox="0 0 256 ${row*64}">${content}</svg>\n`);
  definitions.push({id,entityType:boss?'boss':folder==='characters'?'character':'creature',spriteSet:`/assets/original/${folder}/${id}.svg`,frameSize:64,footAnchor:{x:.5,y:.875},visualWidth:boss?45:48,visualHeight:64,scale:boss?1.08:1,footprint:{logicalTiles:{width:1,height:1},safeHorizontalBounds:{left:-15,right:15},maxUpwardOverflow:boss?60:56,shadowBounds:{width:28,height:8},visualCollisionEnvelope:{x:-11,y:-15,width:22,height:16}},facings,animations,shadowProfile:{width:14,height:4,alpha:.28},effectAnchors:{head:{x:0,y:-48},hand:{x:15,y:-28},chest:{x:0,y:-28}}});
}
await mkdir(resolve(root,'manifests'),{recursive:true});
await writeFile(resolve(root,'manifests/sprites.json'),JSON.stringify(definitions,null,2)+'\n');
console.log(`Generated ${definitions.length} original SVG blockouts and manifest.`);
const skillArt={
  challenge:['#c7a566','<path d="M 12 29 Q 24 7 36 29 M 6 35 Q 24 0 42 35"/><circle cx="24" cy="31" r="4"/>'],
  berserk:['#d7c29b','<path d="M 9 37 L 34 12 38 9 36 17 14 39 M 7 32 L 17 42 M 5 9 Q 38 0 43 32"/>'],
  groundshaker:['#bca47b','<path d="M 25 5 L 18 21 29 29 20 43 M 12 13 L 6 23 14 32 M 39 16 L 33 29 42 40"/>'],
  heal_friend:['#9ccc95','<path d="M 24 12 V 36 M 12 24 H 36"/><circle cx="24" cy="24" r="19"/>'],
  strong_ice_wave:['#91b475','<path d="M 10 38 Q 19 32 25 17 M 24 25 Q 10 27 15 13 Q 26 9 24 25 M 26 19 Q 30 7 39 9 Q 41 24 26 19 M 8 14 L 4 10 M 12 7 L 9 3"/>'],
  eternal_winter:['#b4c481','<path d="M 7 37 H 41 M 14 37 V 20 M 25 37 V 13 M 35 37 V 20"/><circle cx="14" cy="16" r="5"/><circle cx="25" cy="9" r="5"/><circle cx="35" cy="16" r="5"/>'],
  flame_strike:['#e7a36c','<path d="M 5 39 L 38 8 M 27 5 L 43 5 43 21 M 6 30 L 12 39 M 15 20 L 22 28"/>'],
  energy_wave:['#b7a6d2','<path d="M 7 24 Q 17 14 27 24 Q 36 34 43 24 M 12 12 Q 23 4 33 12 M 12 36 Q 23 44 33 36"/>'],
  rage_skies:['#bba2dc','<path d="M 7 15 Q 5 7 16 7 Q 23 0 31 9 Q 43 5 43 18 H 7 M 21 20 L 14 30 24 29 20 42 M 36 22 L 31 34"/>'],
};
await mkdir(resolve(root,'ui'),{recursive:true});
for(const [id,[color,art]] of Object.entries(skillArt)) await writeFile(resolve(root,'ui',`${id}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="3" fill="#18211d"/><g fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${art}</g></svg>\n`);
await mkdir(resolve(root,'terrain'),{recursive:true});
for (const [id,color,detail] of [
  ['floor-stone','#343b3d','<path d="M 2 2 H 30 V 30 H 2 Z M 3 4 H 27"/>'],
  ['floor-ornate','#44413a','<path d="M 2 2 H 30 V 30 H 2 Z M 6 6 H 26 V 26 H 6 Z"/>'],
  ['floor-gold','#4c4534','<path d="M 2 2 H 30 V 30 H 2 Z M 16 9 L 22 16 16 23 10 16 Z"/>'],
  ['floor-mosaic','#373e40','<path d="M 2 2 H 30 V 30 H 2 Z M 11 20 A 7 7 0 1 1 10 14"/>'],
]) {
  await writeFile(resolve(root,'terrain',`${id}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path fill="${color}" d="M 0 0 H 32 V 32 H 0 Z"/><g fill="none" stroke="#747368" stroke-opacity=".22" stroke-width="1">${detail}</g></svg>\n`);
}
