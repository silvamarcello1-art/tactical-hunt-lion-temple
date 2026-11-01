// Authorized one-off diagnostic, NOT an acceptance gate or a gameplay change.
import {chromium,expect as baseExpect} from '@playwright/test';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,createWriteStream} from 'node:fs';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {cpus,totalmem,platform,release} from 'node:os';
import {performance} from 'node:perf_hooks';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createGzip} from 'node:zlib';

const save=promisify(writeFile),makeDirectory=promisify(mkdir);
const expect=baseExpect.configure({timeout:10_000}); // Same existing assertions budget.
const runtime='ec42a20bbf11ccaa507818c6a5c1cc0f6827e942';
const label=process.argv[2]??'windows-profile';
if(!/^[a-z0-9-]+$/.test(label))throw new Error('Invalid artifact label');
const output=resolve('test-results',label);
const base='http://127.0.0.1:4183/';
await makeDirectory(output,{recursive:true});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
// Refuse to profile a silently changed game or altered validation contract.
git('diff','--exit-code',runtime,'HEAD','--','src','public','package.json','pnpm-lock.yaml','tests','playwright.config.ts','vitest.config.ts','.github/workflows/preview.yml');
git('diff','--exit-code','--','src','public','package.json','pnpm-lock.yaml','tests','playwright.config.ts','vitest.config.ts','.github/workflows/preview.yml');
const metadata={runtime,checkout:git('rev-parse','HEAD'),platform:platform(),release:release(),node:process.version,cpu:cpus()[0]?.model,cpuCount:cpus().length,totalMemory:totalmem(),ci:!!process.env.CI,scope:'One-off profiling only; existing tests/deadlines/workflow unchanged. Samples do not approve a release.'};
await save(resolve(output,'metadata.json'),JSON.stringify(metadata,null,2));
const server=spawn(process.execPath,[resolve('node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','4183','--strictPort'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let serverLog='';server.stdout.on('data',b=>serverLog+=b);server.stderr.on('data',b=>serverLog+=b);
const results=[];
const write=(name,data)=>save(resolve(output,name),JSON.stringify(data,null,2));

function summarizeProfile(profile){
 const nodes=new Map(profile.nodes.map(n=>[n.id,n.callFrame])),costs=new Map();
 for(let i=0;i<(profile.samples??[]).length;i++){const id=profile.samples[i];costs.set(id,(costs.get(id)??0)+(profile.timeDeltas[i]??0));}
 return [...costs].sort((a,b)=>b[1]-a[1]).slice(0,80).map(([id,us])=>({selfMs:us/1000,...nodes.get(id)}));
}
async function sample(name,{controlled=false,timeline=false,snapshots=false,budget=220_000},workload){
 const browser=await chromium.launch({channel:'msedge'});
 const context=await browser.newContext({viewport:{width:1366,height:768}});
 const page=await context.newPage();page.setDefaultTimeout(0);
 const result={name,controlled,timeline,snapshots,budget,errors:[],warnings:[],actions:[],status:'running'};
 const cdp=await context.newCDPSession(page);let cpuRunning=false,tracing=false,traceDone,stopPromise,baselineMetrics,snapshotTracing=false,root,baselineProcesses;
 const start=performance.now();
 page.on('pageerror',e=>result.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning')result.warnings.push(m.text());if(m.type()==='error')result.errors.push(m.text());});
 const action=async(label,fn)=>{const started=performance.now();try{return await fn();}finally{result.actions.push({label,startMs:started-start,wallMs:performance.now()-started});}};
 const captureMetrics=async()=>{
  const after=await cdp.send('Performance.getMetrics'),previous=new Map(baselineMetrics.metrics.map(m=>[m.name,m.value]));
  result.metrics=after.metrics.map(m=>({name:m.name,value:m.value,delta:m.value-(previous.get(m.name)??0)}));
  if(baselineProcesses)try{
   const afterProcesses=await root.send('SystemInfo.getProcessInfo'),prior=new Map(baselineProcesses.processInfo.map(p=>[p.id,p.cpuTime]));
   result.processCpu=afterProcesses.processInfo.map(p=>({...p,deltaSeconds:p.cpuTime-(prior.get(p.id)??0)}));
  }catch(e){result.processCpuError=String(e);}
 };
 const stop=()=>stopPromise??=(async()=>{
  if(baselineMetrics&&!result.metrics)try{await captureMetrics();}catch(e){result.metricsError=String(e);}
  if(cpuRunning){cpuRunning=false;try{const {profile}=await cdp.send('Profiler.stop');result.cpuTop=summarizeProfile(profile);await write(`${name}.cpuprofile`,profile);}catch(e){result.profileError=String(e);}}
  if(tracing){tracing=false;try{
   await cdp.send('Tracing.end');const {stream,dataLossOccurred}=await traceDone;result.traceDataLoss=dataLossOccurred;
   async function* chunks(){for(;;){const part=await cdp.send('IO.read',{handle:stream,size:1024*1024});yield Buffer.from(part.data,part.base64Encoded?'base64':'utf8');if(part.eof)break;}await cdp.send('IO.close',{handle:stream});}
   await pipeline(Readable.from(chunks()),createGzip(),createWriteStream(resolve(output,`${name}-timeline.json.gz`)));
  }catch(e){result.timelineError=String(e);}}
  if(snapshotTracing){snapshotTracing=false;try{await context.tracing.stop({path:resolve(output,`${name}-playwright.zip`)});}catch(e){result.snapshotTraceError=String(e);}}
 })();
 // Preserve the same total scenario budgets; timeout artifacts do not turn it green.
 const watchdog=setTimeout(()=>{result.status='timed-out';void stop().finally(()=>context.close());},budget);
 try{
  root=await browser.newBrowserCDPSession();
  if(snapshots){await context.tracing.start({screenshots:false,snapshots:true,sources:true});snapshotTracing=true;}
  result.browser=await root.send('Browser.getVersion');
  try{result.system=await root.send('SystemInfo.getInfo');}catch(e){result.systemError=String(e);}
  if(controlled)await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
  await action('load',()=>page.goto(base));await expect(page.locator('html')).toHaveAttribute('data-session-state','idle');
  result.webgl=await page.locator('#game canvas').evaluate(canvas=>{
   const gl=canvas.getContext('webgl2')??canvas.getContext('webgl');if(!gl)return {available:false};
   const info=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:gl.getParameter(gl.VENDOR),renderer:gl.getParameter(gl.RENDERER),unmaskedVendor:info?gl.getParameter(info.UNMASKED_VENDOR_WEBGL):null,unmaskedRenderer:info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):null};
  });
  if(controlled)await action('pauseIdleClock',()=>page.clock.pauseAt(new Date('2026-01-01T01:00:00Z')));
  await cdp.send('Performance.enable');await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval',{interval:1000});
  baselineMetrics=await cdp.send('Performance.getMetrics');
  try{baselineProcesses=await root.send('SystemInfo.getProcessInfo');}catch(e){result.processCpuError=String(e);}
  await cdp.send('Profiler.start');cpuRunning=true;
  if(timeline){
   result.traceConfig={recordMode:'recordContinuously',traceBufferSizeInKb:16384,includedCategories:['devtools.timeline','v8','blink.user_timing']};
   traceDone=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
   await cdp.send('Tracing.start',{traceConfig:result.traceConfig,transferMode:'ReturnAsStream'});tracing=true;
  }
  result.workloadStartMs=performance.now()-start;
  await workload(page,action,result);
  result.workloadEndMs=performance.now()-start;clearTimeout(watchdog);await captureMetrics();
  result.final=await page.locator('html').evaluate(el=>({state:el.dataset.sessionState,cycles:el.dataset.completedCycles,events:el.dataset.processedEvents,game:{...document.querySelector('#game')?.dataset}}));
  if(result.status!=='timed-out')result.status='completed';
  await stop();
  await page.screenshot({path:resolve(output,`${name}.png`),timeout:5000});
 }catch(error){result.error=String(error);if(result.status!=='timed-out')result.status='failed';}
 finally{
  clearTimeout(watchdog);await stop();result.wallMs=performance.now()-start;
  await write(`${name}.json`,result);results.push(result);
  console.log(JSON.stringify({name,status:result.status,wallMs:result.wallMs,webgl:result.webgl,metrics:result.metrics?.filter(m=>/ScriptDuration|LayoutDuration|TaskDuration|ThreadTime|ProcessTime/.test(m.name)),processCpu:result.processCpu,cpuTop:result.cpuTop?.slice(0,8),lastActions:result.actions.slice(-4),error:result.error}));
  await context.close().catch(()=>{});await browser.close();
 }
}

try{
 const readyStart=performance.now();for(;;){if(server.exitCode!==null)throw new Error('Vite exited');try{if((await fetch(base)).ok)break;}catch{}if(performance.now()-readyStart>30_000)throw new Error('Local server readiness failed');await new Promise(r=>setTimeout(r,100));}
 const shortControlled=async(page,action)=>{
  await page.locator('#loop-toggle').click();await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
  for(let i=0;i<40;i++)await action(`clock250-${i}`,async()=>{await page.locator('html').getAttribute('data-session-state');await page.clock.runFor(250);});
 };
 await sample('controlled-short',{controlled:true,budget:360_000},shortControlled);
 await sample('controlled-short-snapshots',{controlled:true,snapshots:true,budget:360_000},shortControlled);
 await sample('controlled-three-loops',{controlled:true,timeline:true,snapshots:true,budget:360_000},async(page,action,result)=>{
  await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
  for(let elapsed=0;elapsed<=120_000;elapsed+=250){result.cycles=await page.locator('html').getAttribute('data-completed-cycles');if(result.cycles==='3')break;await action(`clock250-${elapsed}`,()=>page.clock.runFor(250));}
  await expect(page.locator('html')).toHaveAttribute('data-completed-cycles','3');
 });
 await sample('real-clock',{timeline:true,budget:220_000},async(page,action)=>{
  await page.locator('#loop-toggle').click();await page.locator('[data-speed="4"]').click();await page.locator('#start').click();
  await action('real10000',()=>page.waitForTimeout(10_000));
 });
 await sample('inventory',{timeline:true,snapshots:true,budget:220_000},async(page,action)=>{
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]){
   await action(`viewport-${size.width}`,()=>page.setViewportSize(size));await action('open-inventory',()=>page.locator('#open-equipment').click());
   await expect(page.locator('#equipment-drawer')).toBeVisible();await action('inspect-sorcerer',()=>page.locator('[data-equipment-hero="sorcerer"]').click());
   await expect(page.locator('#equipment-content h2')).toHaveText('Equipamento · Orin');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await action('close-inventory',()=>page.locator('#close-equipment').click());
  }
  for(const mode of ['AI','MANUAL','ASSISTED']){
   await action(`mode-${mode}`,()=>page.locator('#control-mode').selectOption(mode));const commands=await page.locator('#player-controls').getAttribute('data-command-count');
   await action('open-inventory',()=>page.locator('#open-equipment').click());await expect(page.locator('#equipment-content h2')).toHaveText('Equipamento · Aldric');
   for(const [hero,label]of[['druid','Lyra'],['sorcerer','Orin'],['knight','Aldric']]){
    await action(`inspect-${hero}`,()=>page.locator(`[data-equipment-hero="${hero}"]`).click());await expect(page.locator('#equipment-content h2')).toHaveText(`Equipamento · ${label}`);
    await expect(page.locator('html')).toHaveAttribute('data-selected-hero','knight');await expect(page.locator('#control-mode')).toHaveValue(mode);await expect(page.locator('#player-controls')).toHaveAttribute('data-command-count',commands);
   }
   await action('close-inventory',()=>page.locator('#close-equipment').click());await expect(page.locator('#game canvas')).toBeFocused();
  }
 });
 await write('summary.json',{metadata,samples:results});
 if(results.some(r=>r.status!=='completed'||r.errors.length||r.profileError||r.timelineError||r.snapshotTraceError||r.metricsError))process.exitCode=1;
}finally{server.kill();await save(resolve(output,'server.log'),serverLog);}
