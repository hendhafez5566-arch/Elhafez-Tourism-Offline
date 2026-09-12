import fs from 'node:fs';import vm from 'node:vm';
const store=new Map(),makeClass=()=>({add(){},remove(){},toggle(){return false},contains(){return false}}),els=new Map();
function el(id=''){if(!els.has(id))els.set(id,{id,classList:makeClass(),style:{cssText:'',setProperty(){}},dataset:{},innerHTML:'',textContent:'',value:'',checked:false,disabled:false,files:[],appendChild(){},remove(){},focus(){},closest(){return null},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},getAttribute(){return null}});return els.get(id)}
Object.assign(globalThis,{document:{documentElement:{classList:makeClass(),style:{setProperty(){}}},body:{classList:makeClass(),dataset:{},style:{}},activeElement:null,getElementById:el,querySelectorAll(){return[]},querySelector(){return null},addEventListener(){},createElement(){return el('x')}},window:globalThis,matchMedia:()=>({matches:false}),location:{protocol:'file:',reload(){}},innerWidth:1440,localStorage:{getItem:k=>store.get('l:'+k)??null,setItem:(k,v)=>store.set('l:'+k,String(v)),removeItem:k=>store.delete('l:'+k)},sessionStorage:{getItem:k=>store.get('s:'+k)??null,setItem:(k,v)=>store.set('s:'+k,String(v)),removeItem:k=>store.delete('s:'+k)},MutationObserver:class{observe(){} disconnect(){}},confirm:()=>true,alert:()=>{}});
Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:0,userAgent:'ERP-Smoke-Test',onLine:false},configurable:true});Object.defineProperty(globalThis,'screen',{value:{width:1440,height:900},configurable:true});window.addEventListener=()=>{};window.open=()=>null;
const code=fs.readFileSync('dist/app.js','utf8')+`\n;globalThis.__erp={DB,Accounting,Transactions,Auth,Currency,CRM,Reports,Statements};`;vm.runInThisContext(code,{filename:'app.js'});await new Promise(r=>setTimeout(r,250));
const {DB,Accounting,Transactions,Auth,Currency,CRM,Reports,Statements}=globalThis.__erp;DB.data.meta.setupComplete=true;const admin={id:'admin-r',name:'Admin',role:'admin',active:true,permissions:{all:true},approvalLimit:1e12};DB.data.users=[admin];Auth.user=admin;
const date=new Date().toISOString().slice(0,10);if(!Currency.rate('SAR',date)){DB.data.fxRates.unshift({id:'test-sar',code:'SAR',date,rate:13.25})}
const supplier=Transactions.addSupplier({name:'مورد اختبار ديناميكي',currency:'SAR'}),customer=Transactions.addCustomer({name:'عميل اختبار',type:'individual'}),program=Transactions.addProgram({name:'عمرة سبتمبر اختبار',capacity:20,currency:'EGP',date,endDate:date});
const po=CRM.addPO({date,supplierId:supplier.id,programId:program.id,currency:'EGP',lines:[{description:'تأشيرات برنامج سبتمبر',qty:2,price:1000,taxId:'TAX0',accountId:'5100'}]});CRM.approvePO(po.id);CRM.convertPO(po.id);
const st=DB.data.serviceTypes.find(x=>x.active!==false)?.name||'تأشيرة';const srv=Transactions.addService({date,type:st,customerId:customer.id,supplierId:supplier.id,sale:1500,saleCurrency:'EGP',externalCost:600,cost:600,externalCostCurrency:'SAR',costCurrency:'SAR',inventoryMode:'external',status:'confirmed',description:'تأشيرة فردية بالريال'});
const opts=Reports.partyTransactionOptions({partyType:'supplier',partyId:supplier.id,from:date,to:date});
const programOpt=opts.find(x=>x.key===`program:${program.id}`),serviceOpt=opts.find(x=>x.key===`service:${srv.id}`);
const all=Reports.partyTransactions({partyType:'supplier',partyId:supplier.id,from:date,to:date,filterKey:''});
const original=Statements.supplier(supplier.id,date,date);
const programHtml=Reports.partyTransactions({partyType:'supplier',partyId:supplier.id,from:date,to:date,filterKey:programOpt?.key||''});
const serviceHtml=Reports.partyTransactions({partyType:'supplier',partyId:supplier.id,from:date,to:date,filterKey:serviceOpt?.key||''});
const actionsSrc=fs.readFileSync('src/ui/actions.ts','utf8');
const checks={
 dynamicProgram:!!programOpt&&programOpt.label.includes('عمرة سبتمبر اختبار'),
 dynamicService:!!serviceOpt&&serviceOpt.label.includes(st),
 noInventedStaticScopes:!actionsSrc.includes('<option value="program">برامج العمرة</option>')&&!actionsSrc.includes('<option value="individual">شغل فردي</option>'),
 allEqualsOriginal:all===original,
 serviceKeepsSAR:serviceHtml.includes('SAR')&&serviceHtml.includes('600')&&!serviceHtml.includes('إجمالي مدين'),
 statementLanguage:serviceHtml.includes('>عليه<')&&serviceHtml.includes('>له<')&&serviceHtml.includes('>الرصيد<'),
 serviceExcludesProgram:!serviceHtml.includes('تأشيرات برنامج سبتمبر'),
 programExcludesService:!programHtml.includes('تأشيرة فردية بالريال'),
 programHasProgram:programHtml.includes('عمرة سبتمبر اختبار'),
 accountingCritical:Accounting.audit().filter(x=>x.level==='critical').length
};
console.log(JSON.stringify({options:opts.map(x=>({key:x.key,label:x.label})),checks},null,2));
if(!Object.entries(checks).every(([k,v])=>k==='accountingCritical'?v===0:!!v))process.exit(3);
