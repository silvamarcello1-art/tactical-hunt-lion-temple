// Optional artist tool: node scripts/import-pixel-atlas.mjs <hero> <source.png> <sharp module path>
// Produces checked-in runtime PNGs. CI/runtime do not depend on Sharp.
import {createRequire} from 'node:module';
import {mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const [hero,source,modulePath]=process.argv.slice(2);
if(!['knight','druid','sorcerer'].includes(hero)||!source||!modulePath)throw new Error('Expected hero, input PNG and Sharp module path');
const sharp=createRequire(import.meta.url)(modulePath);
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==info.height)throw new Error('Expected a square 4x4 atlas');
const cell=info.width/4,boxes=[];
for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const ox=Math.floor(col*cell),oy=Math.floor(row*cell),cw=Math.floor((col+1)*cell)-ox,ch=Math.floor((row+1)*cell)-oy;
  let left=cw,top=ch,right=0,bottom=0;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[((oy+y)*info.width+ox+x)*4+3]>100){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  if(left>=right||top>=bottom)throw new Error(`Empty frame ${col}:${row}`);
  boxes.push({left:ox+left,top:oy+top,width:right-left+1,height:bottom-top+1});
}
const scale=Math.min(60/Math.max(...boxes.slice(0,4).map(b=>b.height)),72/Math.max(...boxes.map(b=>b.height)),62/Math.max(...boxes.map(b=>b.width)));
const layers=[];
for(let i=0;i<16;i++){
  const b=boxes[i],width=Math.max(1,Math.round(b.width*scale)),height=Math.max(1,Math.round(b.height*scale));
  layers.push({input:await sharp(source).extract(b).resize(width,height,{kernel:'nearest'}).png().toBuffer(),left:i%4*80+Math.round((80-width)/2),top:Math.floor(i/4)*80+74-height});
}
const root=resolve(import.meta.dirname,'..'),output=resolve(root,'public/assets/original/pixel'),original=resolve(root,'art/source/pixel-v1');
await mkdir(output,{recursive:true});await mkdir(original,{recursive:true});
const rawDestination=resolve(original,`${hero}-source.png`);
if(resolve(source).toLowerCase()!==rawDestination.toLowerCase())await copyFile(source,rawDestination);
await sharp({create:{width:320,height:320,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png({palette:true,colors:256}).toFile(resolve(output,`${hero}-v1.png`));
console.log({hero,sourceCells:cell,runtimeCell:80,baseline:74,scale});
