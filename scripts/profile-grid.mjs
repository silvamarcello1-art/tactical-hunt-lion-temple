// Read-only A/B diagnostic. Vite loads old source from Git in memory, never resets the worktree.
import {createServer} from 'vite';
import {execFileSync} from 'node:child_process';
import {relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),ref=process.argv[2]??'41477b9';
const changed=execFileSync('git',['diff','--diff-filter=M','--name-only',ref,'--','src'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>p.endsWith('.ts'));
const sources=new Map(changed.map(p=>[p,execFileSync('git',['show',`${ref}:${p}`],{cwd:root,encoding:'utf8'})]));
let expectedHash;
for(const baseline of [true,false]){
  const server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:false},plugins:baseline?[{
    name:'readonly-git-baseline',enforce:'pre',transform(_code,id){const source=sources.get(relative(root,id.split('?')[0]).replaceAll('\\','/'));if(source!==undefined)return {code:source,map:null};},
  }]:[]});
  try{
    const {CombatEngine}=await server.ssrLoadModule('/src/combat/CombatEngine.ts');
    const {heroes}=await server.ssrLoadModule('/src/data/config.ts');
    const {progressFromTotal}=await server.ssrLoadModule('/src/combat/Progression.ts');
    const progress=Object.fromEntries(heroes.map(h=>[h.id,progressFromTotal(0)]));
    const sample=[];
    for(const mode of ['warmup','batch',73,1000]){
      const engine=new CombatEngine(803,undefined,undefined,progress,{},false,true),start=performance.now();
      if(typeof mode==='string')engine.run();else for(let time=0;!engine.completed;time+=mode)engine.advanceTo(time);
      const ms=performance.now()-start,result=engine.result;
      const hash=createHash('sha256').update(JSON.stringify(result)).digest('hex');
      expectedHash??=hash;if(hash!==expectedHash)throw new Error(`Result changed for ${baseline?'baseline':'current'} ${mode}`);
      sample.push({mode,ms,events:result.events.length,hash});
    }
    console.log(JSON.stringify({source:baseline?ref:'worktree',sample}));
  }finally{await server.close();}
}
