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
        content += `<g transform="translate(${dir*64+32} ${(row+frame)*64+56})"><g transform="scale(${mirror*(profile?.78:1)} 1) translate(${lean} 0) rotate(${death*20}) scale(1 ${1-death*.45})">${art}</g></g>`;
      }
    }
    row += count;
  }
  await mkdir(resolve(root,folder),{recursive:true});
  await writeFile(resolve(root,folder,`${id}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="${row*64}" viewBox="0 0 256 ${row*64}">${content}</svg>\n`);
  definitions.push({id,entityType:boss?'boss':folder==='characters'?'character':'creature',spriteSet:`/assets/original/${folder}/${id}.svg`,frameSize:64,footAnchor:{x:.5,y:.875},visualWidth:64,visualHeight:64,scale:boss?1.15:1,facings,animations,shadowProfile:{width:boss?19:heavy?15:12,height:boss?6:4,alpha:.28},effectAnchors:{head:{x:0,y:-48},hand:{x:15,y:-28},chest:{x:0,y:-28}}});
}
await mkdir(resolve(root,'manifests'),{recursive:true});
await writeFile(resolve(root,'manifests/sprites.json'),JSON.stringify(definitions,null,2)+'\n');
console.log(`Generated ${definitions.length} original SVG blockouts and manifest.`);
await mkdir(resolve(root,'terrain'),{recursive:true});
for (const [id,color,detail] of [
  ['floor-stone','#343b3d','<path d="M 2 2 H 30 V 30 H 2 Z M 3 4 H 27"/>'],
  ['floor-ornate','#44413a','<path d="M 2 2 H 30 V 30 H 2 Z M 6 6 H 26 V 26 H 6 Z"/>'],
  ['floor-gold','#4c4534','<path d="M 2 2 H 30 V 30 H 2 Z M 16 9 L 22 16 16 23 10 16 Z"/>'],
  ['floor-mosaic','#373e40','<path d="M 2 2 H 30 V 30 H 2 Z M 11 20 A 7 7 0 1 1 10 14"/>'],
]) {
  await writeFile(resolve(root,'terrain',`${id}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path fill="${color}" d="M 0 0 H 32 V 32 H 0 Z"/><g fill="none" stroke="#747368" stroke-opacity=".22" stroke-width="1">${detail}</g></svg>\n`);
}
