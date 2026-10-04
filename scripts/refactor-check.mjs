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
// Failure evidence must not depend on the machine: absolute checkout paths (any machine, including the one that recorded the baseline) are normalised.
export function normalizeText(text){return String(text).replaceAll(root.replace(/\/$/,''),'<ROOT>').replace(/\/workspace\/scratch\/[^/'"\s]+\/repo/g,'<ROOT>').replace(/[A-Za-z]:\\[^'"\s]*?(?=[\\\/]mobile-customer)/g,'<ROOT>');}
export function failureNames(items){return (items||[]).map(i=>Array.isArray(i)?String(i[0]):typeof i==='string'?normalizeText(i):normalizeText(i.name??JSON.stringify(i)));}
export function evidence(output){
 let json;try{json=JSON.parse(output.slice(output.indexOf('{'),output.lastIndexOf('}')+1));}catch{}
 let items=Array.isArray(json?.checks)?json.checks.filter(c=>c.pass===false):Array.isArray(json?.results)?json.results.filter(c=>c.pass===false):[];
 if(!items?.length&&json)items=Object.entries(json).filter(([k,v])=>v===false&&k!=='ok');
 if(!items?.length)items=output.split('\n').filter(l=>/^(?:Error:|AssertionError|FAIL\b|✗)/.test(l.trim()));
 const normalized=JSON.stringify(items?.length?items:output.replaceAll(root,'<ROOT>').replace(/:\d+(?::\d+)?/g,':<LINE>').replace(/Node\.js v[^\n]+/g,'Node.js <VERSION>')).replace(/\d{4}-\d{2}-\d{2}/g,'<DATE>');
 const names=items?.length?failureNames(items):[];
 return {fingerprint:createHash('sha256').update(normalized).digest('hex'),pathFreeFingerprint:createHash('sha256').update(normalizeText(normalized)).digest('hex'),names,details:items?.length?items:normalized.slice(0,1200)};
}
// Known-failure matching (no weakening): the test must still fail with the SAME exit code and every failing check must already be a recorded baseline failure.
// A strict subset is reported as KNOWN (REDUCED) - fewer failures than the baseline - while any failing check that is not in the baseline is a NEW REGRESSION.
export function matchesBaseline(r,e,t){
 if(r.exit!==t.exit)return null;
 if(e.fingerprint===t.fingerprint)return 'KNOWN BASELINE FAILURE';
 const recorded=failureNames(t.details);
 if(e.names.length&&recorded.length){
  if(e.names.every(n=>recorded.includes(n)))return e.names.length<recorded.length?'KNOWN BASELINE FAILURE (REDUCED)':'KNOWN BASELINE FAILURE';
  return null;
 }
 const recordedFp=createHash('sha256').update(normalizeText(JSON.stringify(t.details??'')).replace(/\d{4}-\d{2}-\d{2}/g,'<DATE>')).digest('hex');
 return e.pathFreeFingerprint===recordedFp?'KNOWN BASELINE FAILURE':null;
}
export function toolchainProblems(){
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));const problems=[];
 for(const name of ['typescript','esbuild']){
  const want=pkg.devDependencies?.[name];let have;try{have=JSON.parse(fs.readFileSync(path.join(root,'node_modules',name,'package.json'),'utf8')).version;}catch{have='MISSING';}
  if(want&&have!==want)problems.push(`${name}: installed ${have}, pinned ${want}`);
 }
 if(!fs.existsSync(path.join(root,'node_modules/@types/node'))&&!fs.existsSync(path.join(root,'server/node_modules/@types/node')))problems.push('@types/node: not installed (server build needs it)');
 return problems;
}
export function environment(r){return !!r.error||/ModuleNotFoundError: No module named 'playwright'|Executable doesn't exist|browserType.launch:.*executable|Cannot find (?:module|package) ['"](?:typescript|playwright)/s.test(r.output);}
function main(){
 const skipBrowser=process.argv.includes('--skip-browser');
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'docs/refactor/refactor-baseline.json'),'utf8'));
 const files=discover(),browser=discover(root,'-browser-smoke.py');
 let regressions=0,blockers=0;
 if(JSON.stringify(files)!==JSON.stringify(baseline.tests.map(t=>t.file))||JSON.stringify(browser)!==JSON.stringify(baseline.browser.map(t=>t.file))){console.error('NEW REGRESSION: TEST SUITE DRIFT');process.exit(1);}
 const toolchain=toolchainProblems();if(toolchain.length)console.log('TOOLCHAIN NOT AS PINNED: '+toolchain.join('; '));
 for(const [name,args] of [['CLIENT',['-p','tsconfig.json']],['SERVER',['-p','server/tsconfig.json']]]){
  const r=run(process.execPath,['node_modules/typescript/bin/tsc',...args]);
  const status=r.exit===0?'PASS':(environment(r)||toolchain.length)?'ENVIRONMENT BLOCKER':'NEW REGRESSION';
  console.log(`${status}: ${name} BUILD`);if(status==='NEW REGRESSION')regressions++;if(status==='ENVIRONMENT BLOCKER')blockers++;if(r.exit!==0)console.log(r.output);
 }
 const bundle=run(process.execPath,['scripts/bundle-app.mjs']);console.log(`${bundle.exit===0?'PASS':'NEW REGRESSION'}: CLIENT BUNDLE (esbuild)`);if(bundle.exit!==0){console.log(bundle.output);regressions++;}
 const copy=run(process.execPath,['scripts/copy-static.mjs']);if(copy.exit!==0){console.error('NEW REGRESSION: STATIC COPY',copy.output);regressions++;}
 let pass=0,known=0,improvements=0;
 for(const t of [...baseline.tests,...baseline.browser]){
  if(skipBrowser&&t.file.endsWith('.py')){console.log(`NOT EXECUTED: ${t.file}`);continue;}
  const r=t.file.endsWith('.py')?run('python',[t.file]):run(process.execPath,[t.file]);const e=evidence(r.output);
  let status;
  if(r.exit===0){status=t.status==='PASS'?'PASS':'BASELINE IMPROVEMENT';if(t.file.endsWith('.mjs')){pass++;if(status==='BASELINE IMPROVEMENT')improvements++;}else if(status==='BASELINE IMPROVEMENT')improvements++;}
  else if(environment(r)){status='ENVIRONMENT BLOCKER';blockers++;}
  else if(t.status!=='PASS'&&t.status!=='ENVIRONMENT BLOCKER'&&matchesBaseline(r,e,t)){status=matchesBaseline(r,e,t);}
  else{status='NEW REGRESSION';regressions++;console.error(r.output);}
  if(status.startsWith('KNOWN'))known++;
  console.log(`${status}: ${t.file}`);
 }
 console.log(JSON.stringify({nodeTotal:files.length,nodePass:pass,knownBaselineFailures:known,baselineImprovements:improvements,newRegressions:regressions,environmentBlockers:blockers,browserSkipped:skipBrowser,testSuiteDrift:false}));
 // Environmental blockers are reported separately; a gate cannot claim full validation while blocked.
 process.exitCode=regressions?1:blockers?2:0;
}
if(process.argv[1]===fileURLToPath(import.meta.url))main();
