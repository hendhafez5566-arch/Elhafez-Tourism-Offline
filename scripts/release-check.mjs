import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {discover} from './refactor-check.mjs';
import {scan, counts} from './architecture-check.mjs';

// Final source acceptance is separate from live browser/device acceptance.
const root=fileURLToPath(new URL('../',import.meta.url));
const start='0b10995eaf4c1bddeb30c0fcd1ad7c000a6b5b01';
const phaseOne='4b188965931d396f40b0b545b486e97da12462b8';
const expected={ARCH001:426,ARCH002:118,ARCH003:266,ARCH004:39,ARCH005:10,ARCH006:132,TOTAL:991};
let checks=0;
function check(condition,label){assert.ok(condition,label);checks++;}
function run(command,args){
 const r=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:300000,maxBuffer:32*1024*1024});
 assert.equal(r.error,undefined,`${command} ${args.join(' ')}: ${r.error?.message}`);
 return r;
}
function git(...args){const r=run('git',args);assert.equal(r.status,0,r.stderr);return r.stdout;}
function read(file){return fs.readFileSync(path.join(root,file),'utf8');}
function original(file,ref=start){return git('show',`${ref}:${file}`);}
function same(file,ref=start){check(read(file)===original(file,ref),`Immutable source/gate: ${file}`);}
const tracked=git('ls-files','-z').split('\0').filter(Boolean);
const baseline=JSON.parse(read('docs/refactor/refactor-baseline.json'));
check(JSON.stringify(discover())===JSON.stringify(baseline.tests.map(t=>t.file)),'Pinned Node inventory');
check(baseline.tests.length===60,'Exactly 60 pinned Node tests');
check(JSON.stringify(discover(root,'-browser-smoke.py'))===JSON.stringify(baseline.browser.map(t=>t.file)),'Pinned browser inventory');
check(baseline.browser.length===6,'Exactly six original browser tests');
check(read('.gitignore')==='node_modules/\n.env\n.env.*\n!.env.example\n*SECRETS*.txt\n*.log\n.DS_Store\n','Exact .gitignore');
check(!tracked.some(f=>/(^|\/)node_modules\//.test(f)||/(^|\/)\.env(?:\.|$)/.test(f)&&!f.endsWith('.env.example')||/SECRETS.*\.txt$/i.test(f)),'No tracked dependencies/credential files');
for(const file of ['scripts/application-workflow-check.mjs','scripts/business-workflow-check.mjs','scripts/presentation-platform-check.mjs','scripts/architecture-check.mjs','scripts/refactor-check.mjs','docs/refactor/architecture-baseline.json','docs/refactor/refactor-baseline.json','package.json','package-lock.json','.gitignore','tsconfig.json','server/tsconfig.json'])same(file);
for(const test of [...baseline.tests,...baseline.browser])same(test.file);
// This phase deliberately ships audit/tooling/documentation only. Build outputs
// may differ during validation, but no client/server implementation is changed.
for(const file of tracked.filter(f=>/^(src\/|server\/src\/|android\/)/.test(f)))same(file);
for(const file of tracked.filter(f=>/\.(?:html|css|svg|png|jpe?g|webp|ico|woff2?|ttf)$/.test(f)&&! /^(dist\/|server\/dist\/)/.test(f))) {
 const current=fs.readFileSync(path.join(root,file));
 const r=spawnSync('git',['show',`${start}:${file}`],{cwd:root,maxBuffer:32*1024*1024});
 check(r.status===0&&current.equals(r.stdout),`Visual/native asset unchanged: ${file}`);
}
const changes=[...git('diff','--name-only',start).trim().split('\n'),...git('ls-files','--others','--exclude-standard').trim().split('\n')].filter(Boolean);
check(!changes.some(f=>/(?:schema|migration)/i.test(f)),'No schema/migration changes');
check(changes.every(f=>f==='scripts/release-check.mjs'||f.startsWith('docs/refactor/')||f.startsWith('dist/')||f.startsWith('server/dist/')),'Phase 5 scope: release audit/docs and temporary official build output only');
for(const f of tracked.filter(f=>/^(src\/|server\/src\/).*\.ts$/.test(f)))check(!/@ts-(?:ignore|expect-error)/.test(read(f)),`No type suppressions: ${f}`);
check(!changes.some(f=>f.endsWith('.ts')),'No new TypeScript files/types or unsafe type escapes in Phase 5');
const config=JSON.parse(read('tsconfig.json'));
check(config.compilerOptions.target==='ES2020'&&config.compilerOptions.module==='none'&&config.compilerOptions.outFile==='dist/app.js','Legacy client build model');
check(new Set(config.files).size===config.files.length,'No duplicate script files');
// Parse EVERY ordered input. Immutable order plus full VM startup execution
// checks preserve the reviewed initialization graph; this is not a proof of
// arbitrary third-party execution or every branch of dynamically invoked code.
for(const file of config.files){const sf=ts.createSourceFile(file,read(file),ts.ScriptTarget.ES2020,true);check(sf.parseDiagnostics.length===0,`Ordered input parses: ${file}`);}
// Full ordered-symbol pass: inspect immediate top-level reads, including IIFEs,
// while excluding deferred function/method bodies and type-only references.
const program=ts.createProgram(config.files,{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None,skipLibCheck:true});
const symbols=program.getTypeChecker(),definitions=new Map(),forwardReads=[];
let immediateReads=0;
config.files.forEach((file,index)=>{
 const source=program.getSourceFile(file);
 for(const statement of source.statements){
  if(ts.isVariableStatement(statement))for(const declaration of statement.declarationList.declarations)if(ts.isIdentifier(declaration.name))definitions.set(symbols.getSymbolAtLocation(declaration.name),{index,pos:declaration.pos,hoisted:false,name:declaration.name.text,file});
  if(ts.isFunctionDeclaration(statement)&&statement.name)definitions.set(symbols.getSymbolAtLocation(statement.name),{index,pos:statement.pos,hoisted:true,name:statement.name.text,file});
 }
});
config.files.forEach((file,index)=>{
 const source=program.getSourceFile(file);
 function visit(node){
  if(ts.isTypeNode(node))return;
  if(ts.isFunctionLike(node)){
   const parent=node.parent;
   const invoked=(ts.isParenthesizedExpression(parent)&&ts.isCallExpression(parent.parent)&&parent.parent.expression===parent)||(ts.isCallExpression(parent)&&parent.expression===node);
   if(!invoked)return;
  }
  if(ts.isIdentifier(node)){
   const definition=definitions.get(symbols.getSymbolAtLocation(node));
   if(definition&&node.parent.name!==node){
    immediateReads++;
    if(!definition.hoisted&&(definition.index>index||definition.index===index&&definition.pos>node.pos))forwardReads.push({file,name:definition.name,definedIn:definition.file});
   }
  }
  ts.forEachChild(node,visit);
 }
 for(const statement of source.statements)visit(statement);
});
check(forwardReads.length===0,`No immediate forward lexical reads: ${JSON.stringify(forwardReads)}`);
console.log(JSON.stringify({scriptOrder:{files:config.files.length,definitions:definitions.size,immediateReads,forwardReads:forwardReads.length},limit:'Deferred/cross-function paths are covered by pinned VM scenarios, not universal static proof'}));
for(const [contract,consumer] of [['src/platform/platform-contracts.ts','src/platform/browser-platform.ts'],['src/platform/browser-platform.ts','src/persistence/browser-store.ts'],['src/application/contracts.ts','src/application/document-actions.ts'],['src/application/business-contracts.ts','src/application/voucher-workflows.ts'],['src/ui/presentation-contracts.ts','src/ui/party-presentation.ts'],['src/ui/party-presentation.ts','src/crm/party360.ts'],['src/ui/print-presentation.ts','src/reports/printing.ts'],['src/ui/ui.ts','src/ui/data-table.ts'],['src/ui/forms.ts','src/ui/forms-definitions.ts'],['src/ui/commercial-ux.ts','src/mobile.ts'],['src/mobile.ts','src/pwa.ts'],['src/pwa.ts','src/bootstrap.ts']])check(config.files.indexOf(contract)<config.files.indexOf(consumer),`Runtime ordering: ${contract} -> ${consumer}`);
const bootstrap=read('src/bootstrap.ts');
check((bootstrap.match(/\(async\(\)=>\{/g)||[]).length===1,'One startup composition root');
check(bootstrap.indexOf('await DB.init()')<bootstrap.indexOf('await Commercial.afterInit()')&&bootstrap.indexOf('await Commercial.afterInit()')<bootstrap.lastIndexOf('await Auth.init()'),'Normal startup DB -> Commercial -> Auth');
const sf=ts.createSourceFile('bootstrap.ts',bootstrap,ts.ScriptTarget.ES2020,true);
const composers=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text.startsWith('compose')).map(n=>n.name.text);
check(new Set(composers).size===composers.length,'No duplicate composition function definitions');
const allSource=config.files.map(read).join('\n');
for(const name of composers)check((allSource.match(new RegExp(`\\b${name}\\s*\\(`,'g'))||[]).length>1,`Composition factory has a source caller: ${name}`);
// Public method names, JavaScript arity, synchronous/Promise timing, inline and
// delegated routes are also exercised by the immutable presentation checker.
for(const name of ['UI','Actions','Forms','Pages','CommercialActions','Auth','DB','Transactions','Invoices','Accounting','ManualJournal','CRM','Party360','UnifiedParty','Print','Reports','Statements','OutputCenter','PWA'])check(new RegExp(`\\b(?:const|let|var)\\s+${name}\\b`).test(allSource),`Required public facade: ${name}`);
const platform=read('src/platform/browser-platform.ts'),pwa=read('src/platform/pwa-registration.ts'),mobile=read('src/mobile.ts');
check(!/window\.print\s*=/.test(allSource),'No current-view window.print override');
check(read('src/ui/delegated-actions.ts').includes('BrowserPlatform.printCurrent()'),'Delegated current-view printing');
check(platform.includes('native.printCurrent(title())')&&platform.includes('window.print.bind(window)')&&platform.includes('fallback();'),'Live title and native error/browser print fallback');
check(platform.includes("register('./sw.js', { scope: './', updateViaCache: 'none' })")&&platform.includes("addEventListener('load', work, { once: true })"),'PWA registration/scope/cache/load contract');
check(pwa.includes('5000')&&pwa.includes("'https:'")&&pwa.includes('port.native()')&&pwa.includes('localhost'),'PWA update delay and secure/native guards');
for(const token of ['ERP_MOBILE','NativeShell','NativePrint','window.fetch','checkAppRelease','applyPendingRelease'])check(mobile.includes(token),`Native compatibility contract: ${token}`);
// Full five-phase preservation evidence for pinned inputs and native/visual code.
for(const file of ['index.html','src/styles.css','src/integrated/bridge.ts'])same(file,phaseOne);
const actual=counts(scan());for(const rule of Object.keys(expected))check(actual[rule]<=expected[rule],`Architecture does not increase: ${rule}`);
for(const [file,pattern] of [['application-workflow-check.mjs',/PASS 154 /],['business-workflow-check.mjs',/PASS 1172 .*142 scenarios \(46 successful accounting scenarios\)/],['presentation-platform-check.mjs',/PASS 3471 .*61 deterministic scenarios/],['architecture-check.mjs',/PASS architecture ratchet/]]){
 const r=run(process.execPath,[`scripts/${file}`]);process.stdout.write(r.stdout);process.stderr.write(r.stderr);check(r.status===0&&pattern.test(r.stdout),`Required gate: ${file}`);
}
for(const [label,configFile] of [['CLIENT','tsconfig.json'],['SERVER','server/tsconfig.json']]){
 const r=run(process.execPath,['node_modules/typescript/bin/tsc','-p',configFile]);if(r.status!==0)process.stderr.write(r.stdout+r.stderr);check(r.status===0,`${label} BUILD`);console.log(`PASS ${label} BUILD`);
}
console.log(JSON.stringify({releaseCheck:'PASS',staticChecks:checks,architecture:actual,nodeInventory:60,browserInventory:6,publicApi:'PRESERVED',nativeContract:'PASS',realDevice:'NOT EXECUTED',browser:'SEPARATE ACCEPTANCE REQUIRED',generatedOutputs:'TEMPORARY BUILD OUTPUT; RESTORE BEFORE COMMIT'}));
