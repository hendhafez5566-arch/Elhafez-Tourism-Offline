// Differential boundary checks against the approved Phase 1 source, with injected fakes.
// Not a smoke-suite rename/addition: run independently alongside the pinned 60 tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
import {bundleForVm} from './lib/vm-module-bundle.mjs';
const start='4b188965931d396f40b0b545b486e97da12462b8';
// Differential checks need the pre-Part-2 git history (the `original()` oracle). Without it they are ENVIRONMENT BLOCKED (exit 3) - never PASS.
{const have=(sha)=>{try{execFileSync('git',['cat-file','-e',`${sha}^{commit}`],{stdio:'ignore'});return true;}catch{return false;}};
 if(!have(start)){console.error('ENVIRONMENT BLOCKED: original git history (Phase 1 start) is not available in this checkout; run with a full clone (fetch-depth: 0).');process.exit(3);}}

const read=p=>fs.readFileSync(p,'utf8');
const original=p=>execFileSync('git',['show',`${start}:${p}`],{encoding:'utf8'});
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None}}).outputText;
const currentBundle=await bundleForVm(`
 import {Actions} from './src/ui/actions.ts';
 import {CommercialActions} from './src/commercial/actions.ts';
 import {DocumentWorkflows} from './src/application/document-actions.ts';
 import {CommercialWorkflows} from './src/application/commercial-actions.ts';
 import {composeLegacyActionDeps,composeLegacyCommercialDeps} from './src/bootstrap.ts';
 import {DB} from './src/persistence/browser-store.ts'; import {Auth} from './src/security/auth.ts'; import {UI} from './src/ui/ui.ts';
 import {Transactions} from './src/accounting/transactions.ts'; import {CRM} from './src/crm/crm.ts'; import {Invoices,MasterData} from './src/accounting/invoices.ts';
 import {ManualJournal} from './src/accounting/engine.ts'; import {Approvals} from './src/accounting/transactions.ts'; import {Currency} from './src/accounting/currency-periods.ts';
 import {Commercial,CommercialSupport} from './src/commercial/product.ts'; import {UmrahCore_DB} from './src/core/umrah/data.ts';
 globalThis.__current={Actions,CommercialActions,DocumentWorkflows,CommercialWorkflows,composeLegacyActionDeps,composeLegacyCommercialDeps,DB,Auth,UI,Transactions,CRM,Invoices,MasterData,ManualJournal,Approvals,Currency,Commercial,CommercialSupport,UmrahCore_DB};
`,{suppressBootstrap:true});
function setup(current){
 const trace=[],pending=[];let denied=false;
 const data={invoices:[{id:'I',kind:'customer',partyId:'C',status:'draft',no:'I'}],quotations:[{id:'Q',no:'Q-1',status:'draft',validUntil:'2099-01-01'}],purchaseOrders:[{id:'P',lines:[]}],auditLog:[{date:'2020-01-01'},{date:'2099-01-01'}],branches:[{id:'B',active:true,name:'Branch'}],users:[{id:'U',name:'User',role:'staff',branchId:'B',allowedBranchIds:['B']}],settings:{}};
 const operation=object=>new Proxy({}, {get:(_,name)=>(...args)=>{trace.push([object+'.'+String(name),...args]);return undefined;}});
 const DB={data,save:(...a)=>{trace.push(['save',...a]);return Promise.resolve();},log:(...a)=>trace.push(['log',...a]),atomic:(label,work,options)=>{trace.push(['atomic',label,options]);return work();},atomicAsync:async(label,work,options)=>{trace.push(['atomicAsync',label,options]);return await work();},fastAtomic:(label,work,options)=>{trace.push(['fastAtomic',label,options]);return work();}};
 const Auth={require:(...args)=>{trace.push(['authorization',...args]);if(denied)throw Error('denied');},user:{role:'admin',permissions:{all:true}}};
 const UI={confirmAction:(...a)=>{trace.push(['confirm',a[0],a[1],a[3]]);pending.push(a[2]);},reasonAction:(...a)=>{trace.push(['reason',a[0],a[1]]);pending.push(a[2]);},openPage:(...a)=>trace.push(['openPage',...a])};
	 const toastNode={set textContent(v){this._text=v;trace.push(['toast',v])},set className(v){this._class=v}};
	 const document={documentElement:{classList:{toggle(){}}},getElementById:id=>id==='toast'?toastNode:null};
	 const sandbox={console,Date,DB,Auth,UI,document,matchMedia:()=>({matches:false}),navigator:{maxTouchPoints:0,userAgent:''},screen:{width:1200,height:800},setTimeout:()=>0,clearTimeout:()=>{},window:{addEventListener(){}},Transactions:operation('Transactions'),CRM:operation('CRM'),Invoices:operation('Invoices'),ManualJournal:operation('ManualJournal'),MasterData:operation('MasterData'),Approvals:operation('Approvals'),Currency:operation('Currency'),Commercial:operation('Commercial'),CommercialSupport:{clearAudit:async range=>trace.push(['clearRemote',range])},UmrahCore_DB:{data:{activity:[]}},byId:(arr,id)=>arr.find(x=>x.id===id),S:x=>String(x??''),N:x=>Number(x)||0,today:()=> '2026-10-02',now:()=> '2026-10-02T00:00:00Z',formatDate:x=>'date:'+x,live:x=>x.active!==false&&x.status!=='void',toast:(...a)=>trace.push(['toast',...a]),confirm:()=>true};
 const ctx=vm.createContext(sandbox);
	 if(current){
	  vm.runInContext(currentBundle,ctx);const x=sandbox.__current;const portNames=['Transactions','CRM','Invoices','ManualJournal','MasterData','Approvals','Currency','Commercial'];const fakes=Object.fromEntries(portNames.map(name=>[name,sandbox[name]]));Object.assign(x.DB,DB);Object.assign(x.Auth,Auth);Object.assign(x.UI,UI);for(const name of portNames)for(const method of Object.keys(x[name]))if(typeof x[name][method]==='function')x[name][method]=(...args)=>fakes[name][method](...args);Object.assign(x.CommercialSupport,sandbox.CommercialSupport);x.UmrahCore_DB.data=sandbox.UmrahCore_DB.data;Object.assign(sandbox,x);
	  vm.runInContext('const CommercialActionViews={activityRangeChanged(){UI.openPage("activity","",{skipHistory:true,keepWorkspace:true})},activityCleaned(){toast("تم تنظيف سجل النشاط");this.activityRangeChanged()}};',ctx);
	 }
	 if(!current){vm.runInContext(compile(original('src/ui/actions.ts')),ctx);vm.runInContext(compile(original('src/commercial/actions.ts')),ctx);}
 const api=vm.runInContext('({Actions,CommercialActions'+(current?',DocumentWorkflows,CommercialWorkflows,composeLegacyActionDeps,composeLegacyCommercialDeps':'')+'})',ctx);
 return {api,trace,pending,data,DB,setDenied:v=>{denied=v;}};
}
// Derive supported prepared commands from explicit port methods, no runtime dispatch in production.
const names=[...read('src/application/document-actions.ts').matchAll(/ prepare([A-Z]\w+)\(deps:DocumentWorkflowDeps,id:string\)/g)].map(m=>m[1][0].toLowerCase()+m[1].slice(1)).filter(x=>!['receivePurchaseOrder','voidPurchaseOrder','removePurchaseOrder'].includes(x));
let checks=0;
for(const name of names){
 const before=setup(false),after=setup(true);before.api.Actions[name]('I');after.api.Actions[name]('I');
 assert.deepEqual(JSON.parse(JSON.stringify(after.trace)),JSON.parse(JSON.stringify(before.trace)),name+' immediate sequencing');
 if(before.pending.length){before.pending[0]('because');after.pending[0]('because');assert.deepEqual(JSON.parse(JSON.stringify(after.trace)),JSON.parse(JSON.stringify(before.trace)),name+' deferred transaction');}
 const deniedBefore=setup(false),deniedAfter=setup(true);deniedBefore.setDenied(true);deniedAfter.setDenied(true);deniedBefore.api.Actions[name]('I');deniedAfter.api.Actions[name]('I');assert.deepEqual(JSON.parse(JSON.stringify(deniedAfter.trace)),JSON.parse(JSON.stringify(deniedBefore.trace)),name+' denied before mutation');checks+=3;
}
for(const name of ['sendQuotation','setActivityRange','clearActivity']){
 const before=setup(false),after=setup(true),arg=name==='sendQuotation'?'Q':'all';
 await before.api.Actions[name](arg);await after.api.Actions[name](arg);
 assert.deepEqual(JSON.parse(JSON.stringify(after.trace)),JSON.parse(JSON.stringify(before.trace)),name+' persistence sequence');assert.deepEqual(after.data,before.data);checks++;
}
const x=setup(true),deps=x.api.composeLegacyActionDeps();
const save=x.api.DocumentWorkflows.prepareInvoiceSave(deps,x.data.invoices[0]);x.trace.length=0;
const completion=save({kind:'customer',partyId:'C',partyType:'customer',externalNo:'',currency:'EGP'},true);
assert.equal(x.trace[0][0],'atomic');assert.equal(x.trace[0][1],'invoiceForm');assert.equal(x.trace[0][2].save,false);assert(!x.trace.some(e=>e[0]==='save'));completion.persist();assert.equal(x.trace.at(-1)[0],'save');checks++;
const user=x.api.CommercialWorkflows.prepareUserBranches(x.api.composeLegacyCommercialDeps(),'U');x.data.branches=[{id:'NEW',name:'New'}];assert.equal(user.branches()[0].id,'NEW');assert.throws(()=>user.save([]),/اختر فرعًا/);checks++;
const submit=x.api.DocumentWorkflows.prepareFormSubmission(deps,'receipt','receipts','add',false);x.trace.length=0;await submit(()=>x.api.DocumentWorkflows.createReceipt(deps,{partyRef:'customer|C',amount:10}));assert.equal(x.trace[0][0],'atomicAsync');assert.equal(x.trace[0][2].strict,true);assert.equal(x.trace[1][0],'Transactions.addReceipt');assert.equal(x.trace[1][1].partyId,'C');checks++;
const fastObject=x.api.DocumentWorkflows.prepareFormSubmission(deps,'customer','customers','add',false);x.trace.length=0;const fastObjectResult=fastObject(()=>({ok:true}));assert.equal(fastObjectResult,undefined);assert.equal(x.trace[0][0],'fastAtomic');checks++;
const fastPromise=x.api.DocumentWorkflows.prepareFormSubmission(deps,'customer','customers','add',false);x.trace.length=0;const callbackPromise=Promise.resolve('later');const fastPromiseResult=fastPromise(()=>callbackPromise);assert.equal(fastPromiseResult,undefined);assert.equal(x.trace[0][0],'fastAtomic');checks++;
const strictFailure=Error('strict submit failed');const strictSubmit=x.api.DocumentWorkflows.prepareFormSubmission(deps,'receipt','receipts','add',false);const strictResult=strictSubmit(()=>{throw strictFailure});assert.equal(typeof strictResult?.then,'function');await assert.rejects(strictResult,e=>e===strictFailure);checks++;
const failure=Error('save failed');const rejecting={...deps,transactions:{...deps.transactions,atomicAsync:async()=>{throw failure;}}};await assert.rejects(x.api.DocumentWorkflows.prepareReceivePurchaseOrder(rejecting,'P').execute({}),e=>e===failure);checks++;
console.log(`PASS ${checks} application/legacy differential boundary checks; ${names.length} document facades, denied/deferred sequencing, save barrier, strict submission, synchronous fast-path timing, live repository and error propagation`);
