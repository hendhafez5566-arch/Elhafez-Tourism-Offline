import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const root=fileURLToPath(new URL('../',import.meta.url));
export function discover(dir=root,suffix='-smoke.mjs') {
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!['node_modules','.git'].includes(e.name)?discover(path.join(dir,e.name),suffix):e.isFile()&&e.name.endsWith(suffix)?[path.relative(root,path.join(dir,e.name)).split(path.sep).join('/')]:[]).sort();
}
export function run(command,args){const r=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});return {exit:r.status,signal:r.signal,error:r.error?.code,output:(r.stdout||'')+(r.stderr||'')};}
export function evidence(output){
 let json;try{json=JSON.parse(output.slice(output.indexOf('{'),output.lastIndexOf('}')+1));}catch{}
 let items=Array.isArray(json?.checks)?json.checks.filter(c=>c.pass===false):Array.isArray(json?.results)?json.results.filter(c=>c.pass===false):[];
 if(!items?.length&&json)items=Object.entries(json).filter(([k,v])=>v===false&&k!=='ok');
 if(!items?.length)items=output.split('\n').filter(l=>/^(?:Error:|AssertionError|FAIL\b|✗)/.test(l.trim()));
 const normalized=JSON.stringify(items?.length?items:output.replaceAll(root,'<ROOT>').replace(/:\d+(?::\d+)?/g,':<LINE>').replace(/Node\.js v[^\n]+/g,'Node.js <VERSION>')).replace(/\d{4}-\d{2}-\d{2}/g,'<DATE>');
 return {fingerprint:createHash('sha256').update(normalized).digest('hex'),details:items?.length?items:normalized.slice(0,1200)};
}
export function environment(r){return !!r.error||/ModuleNotFoundError: No module named 'playwright'|Executable doesn't exist|browserType.launch:.*executable|Cannot find (?:module|package) ['"](?:typescript|playwright)/s.test(r.output);}
function main(){
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'docs/refactor/refactor-baseline.json'),'utf8'));
 const files=discover(),browser=discover(root,'-browser-smoke.py');
 let regressions=0,blockers=0;
 if(JSON.stringify(files)!==JSON.stringify(baseline.tests.map(t=>t.file))||JSON.stringify(browser)!==JSON.stringify(baseline.browser.map(t=>t.file))){console.error('NEW REGRESSION: TEST SUITE DRIFT');process.exit(1);}
 for(const [name,args] of [['CLIENT',['-p','tsconfig.json']],['SERVER',['-p','server/tsconfig.json']]]){
  const r=run(process.execPath,['node_modules/typescript/bin/tsc',...args]);
  const status=r.exit===0?'PASS':environment(r)?'ENVIRONMENT BLOCKER':'NEW REGRESSION';
  console.log(`${status}: ${name} BUILD`);if(status==='NEW REGRESSION')regressions++;if(status==='ENVIRONMENT BLOCKER')blockers++;if(r.exit!==0)console.log(r.output);
 }
 const copy=run(process.execPath,['scripts/copy-static.mjs']);if(copy.exit!==0){console.error('NEW REGRESSION: STATIC COPY',copy.output);regressions++;}
 let pass=0;
 for(const t of [...baseline.tests,...baseline.browser]){
  const r=t.file.endsWith('.py')?run('python',[t.file]):run(process.execPath,[t.file]);const e=evidence(r.output);
  let status;
  if(r.exit===0){status=t.status==='PASS'?'PASS':'BASELINE IMPROVEMENT';if(t.file.endsWith('.mjs'))pass++;}
  else if(environment(r)){status='ENVIRONMENT BLOCKER';blockers++;}
  else if(t.status!=='PASS'&&t.status!=='ENVIRONMENT BLOCKER'&&r.exit===t.exit&&e.fingerprint===t.fingerprint){status=t.status;}
  else{status='NEW REGRESSION';regressions++;console.error(r.output);}
  console.log(`${status}: ${t.file}`);
 }
 console.log(JSON.stringify({nodeTotal:files.length,nodePass:pass,newRegressions:regressions,environmentBlockers:blockers,testSuiteDrift:false}));
 // Environmental blockers are reported separately; a gate cannot claim full validation while blocked.
 process.exitCode=regressions?1:blockers?2:0;
}
if(process.argv[1]===fileURLToPath(import.meta.url))main();
