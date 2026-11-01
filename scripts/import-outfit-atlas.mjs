// Technical alpha crop / nearest-neighbour import only. No generated frames.
// node scripts/import-outfit-atlas.mjs <id> <source.png> <sharp module path>
import {createRequire} from 'node:module';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
const [id,source,modulePath,factorText='1']=process.argv.slice(2);
const factor=Number(factorText);
if(!Number.isFinite(factor)||factor<1||factor>1.4)throw new Error('Reviewed body-scale factor must be 1..1.4');
if(!/^[a-z]+-(base|addon1|addon2|dlc)$/.test(id)||!source||!modulePath)throw new Error('Expected outfit variant ID, source PNG, Sharp module');
const sharp=createRequire(import.meta.url)(modulePath);
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==info.height)throw new Error('Expected square 4x4 atlas');
// Segment connected alpha silhouettes, not mathematical cell boundaries.
// A tilted staff can overlap a neighbouring column's x-projection while the
// two actual figures remain separated by transparent pixels. This also catches
// merged figures / detached large props instead of silently cutting them.
const visited=new Uint8Array(info.width*info.height),queue=new Int32Array(visited.length),components=[];
for(let start=0;start<visited.length;start++){
  if(visited[start]||data[start*4+3]<=100)continue;
  let begin=0,end=1,left=info.width,right=0,top=info.height,bottom=0,area=0;
  queue[0]=start;visited[start]=1;
  while(begin<end){
    const pixel=queue[begin++],x=pixel%info.width,y=Math.floor(pixel/info.width);area++;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const nx=x+dx,ny=y+dy,index=ny*info.width+nx;
      if(nx<0||ny<0||nx>=info.width||ny>=info.height||visited[index]||data[index*4+3]<=100)continue;
      visited[index]=1;queue[end++]=index;
    }
  }
  if(area>Math.max(200,visited.length/1000))components.push({left,top,width:right-left+1,height:bottom-top+1});
}
if(components.length!==16)throw new Error(`Expected 16 separate character silhouettes, found ${components.length}; review merged figures / detached props`);
components.sort((a,b)=>(a.top+a.height/2)-(b.top+b.height/2));
const boxes=[];
for(let row=0;row<4;row++){
  const poses=components.slice(row*4,row*4+4).sort((a,b)=>(a.left+a.width/2)-(b.left+b.width/2));
  const centers=poses.map(b=>b.top+b.height/2);
  if(Math.max(...centers)-Math.min(...centers)>info.height/8)throw new Error('Ambiguous pose row layout');
  for(let col=0;col<4;col++){
    const b=poses[col];
    if(col&&b.left+b.width/2-(poses[col-1].left+poses[col-1].width/2)<info.width/8)throw new Error('Ambiguous facing column layout');
    if(b.left===0||b.top===0||b.left+b.width===info.width||b.top+b.height===info.height)throw new Error('Sprite touches source edge');
    boxes.push(b);
  }
}
const frameSize=112,baseline=104;
const scale=Math.min(68/Math.max(...boxes.map(b=>b.height)),70/Math.max(...boxes.map(b=>b.width)))*factor;
if(boxes.some(b=>Math.round(b.height*scale)>100||Math.round(b.width*scale)>104))throw new Error('Scaled adornments exceed reviewed frame envelope');
const layers=[];
for(let i=0;i<16;i++){
  const b=boxes[i],width=Math.max(1,Math.round(b.width*scale)),height=Math.max(1,Math.round(b.height*scale));
  layers.push({input:await sharp(source).extract(b).resize(width,height,{kernel:'nearest'}).png().toBuffer(),left:i%4*frameSize+Math.round((frameSize-width)/2),top:Math.floor(i/4)*frameSize+baseline-height});
}
const root=resolve(import.meta.dirname,'..'),output=resolve(root,'public/assets/outfits/pixel-v1'),raw=resolve(root,'art/source/outfits-v1');
await mkdir(output,{recursive:true});await mkdir(raw,{recursive:true});
const destination=resolve(raw,`${id}-source.png`);
if(resolve(source).toLowerCase()!==destination.toLowerCase())await copyFile(source,destination);
await sharp({create:{width:448,height:448,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(resolve(output,`${id}.png`));
await writeFile(resolve(raw,`${id}-import.json`),JSON.stringify({generator:'builtin imagegen',sourceFile:basename(source),sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),sourceSize:[info.width,info.height],runtimeSize:[448,448],cell:frameSize,baseline,bodyScaleFactor:factor,visualTop:Math.round(Math.max(...boxes.map(b=>b.height))*scale),scale,boxes},null,2)+'\n');
console.log({id,cells:16,scale,baseline});
