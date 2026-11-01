// Diagnostic only: run unchanged tests against Git source without checkout/reset.
import {mergeConfig} from 'vitest/config';
import config from '../vitest.config.ts';
import {execFileSync} from 'node:child_process';
import {resolve,relative} from 'node:path';
const root=resolve(import.meta.dirname,'..'),ref='41477b9';
const paths=execFileSync('git',['diff','--diff-filter=M','--name-only',ref,'--','src'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>p.endsWith('.ts'));
const sources=new Map(paths.map(p=>[p,execFileSync('git',['show',`${ref}:${p}`],{cwd:root,encoding:'utf8'})]));
export default mergeConfig(config,{plugins:[{name:'readonly-baseline',enforce:'pre',transform(_code,id){const source=sources.get(relative(root,id.split('?')[0]).replaceAll('\\','/'));if(source!==undefined)return {code:source,map:null};}}]});
