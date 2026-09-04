import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const store=new Map(),makeClass=()=>({add(){},remove(){},toggle(){return false},contains(){return false}}),els=new Map();
function el(id=''){if(!els.has(id))els.set(id,{id,classList:makeClass(),style:{cssText:'',setProperty(){}},dataset:{},innerHTML:'',textContent:'',value:'',checked:false,disabled:false,files:[],appendChild(){},remove(){},focus(){},closest(){return null},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},getAttribute(){return null}});return els.get(id)}
Object.assign(globalThis,{document:{documentElement:{classList:makeClass(),style:{setProperty(){}}},body:{classList:makeClass(),dataset:{},style:{}},activeElement:null,getElementById:el,querySelectorAll(){return[]},querySelector(){return null},addEventListener(){},createElement(){return el('created-'+Math.random())}},window:globalThis,matchMedia:()=>({matches:false}),location:{protocol:'file:',reload(){}},innerWidth:1440,localStorage:{getItem:k=>store.get('l:'+k)??null,setItem:(k,v)=>store.set('l:'+k,String(v)),removeItem:k=>store.delete('l:'+k)},sessionStorage:{getItem:k=>store.get('s:'+k)??null,setItem:(k,v)=>store.set('s:'+k,String(v)),removeItem:k=>store.delete('s:'+k)},MutationObserver:class{observe(){} disconnect(){}},confirm:()=>true,alert:()=>{}});
Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:0,userAgent:'ERP-Advanced-Smoke',onLine:false},configurable:true});
Object.defineProperty(globalThis,'screen',{value:{width:1440,height:900},configurable:true});
globalThis.window.addEventListener=()=>{};globalThis.window.open=()=>null;
const code=fs.readFileSync(resolve(root,'dist/app.js'),'utf8')+`\n;globalThis.__erp={DB,Accounting,Invoices,Transactions,Auth,Currency,CRM,AdvancedAccounting};`;
vm.runInThisContext(code,{filename:'app.js'});await new Promise(r=>setTimeout(r,400));
const {DB,Accounting,Invoices,Transactions,Auth,AdvancedAccounting}=globalThis.__erp;
DB.data.meta.setupComplete=true;const admin={id:'admin-advanced-smoke',name:'Advanced Smoke Admin',role:'admin',active:true,permissions:{all:true},approvalLimit:1e12};DB.data.users=[admin];Auth.user=admin;AdvancedAccounting.ensure(DB.data);
const date=new Date().toISOString().slice(0,10),future=(()=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+45);return d.toISOString().slice(0,10)})();
const bank=Transactions.createTreasury({name:'بنك الاختبار المتقدم',type:'bank',currency:'EGP',opening:500000,silent:true,date});
const approx=(a,b,msg)=>{if(Math.abs(Number(a)-Number(b))>.02)throw new Error(`${msg}: ${a} != ${b}`)};

// 1) Tourism supplier cancellation: 2,000 credit; 500 refunded; 1,500 cancellation expense.
const supplier=Transactions.addSupplier({name:'مورد إلغاء متقدم',currency:'EGP'});
const inv=Invoices.create({kind:'supplier',partyId:supplier.id,partyType:'supplier',currency:'EGP',date,description:'حجز فندقي',lines:[{description:'غرفة',qty:1,price:2000,discount:0,taxId:'TAX0',accountId:'5120'}],status:'draft'});Invoices.post(inv);
Transactions.addPayment({partyType:'supplier',partyId:supplier.id,treasuryId:bank.id,amount:2000,currency:'EGP',date,note:'سداد الحجز',paymentMethod:'bank',referenceNo:'PAY-2000'},{ignoreApproval:true});
Invoices.adjust(inv.id,'credit',2000,'إلغاء الحجز',date);
approx(Accounting.supplierAdvance(supplier.id).EGP||0,2000,'Supplier credit did not create supplier receivable');
Transactions.addReceipt({partyType:'supplierAdvance',partyId:supplier.id,treasuryId:bank.id,amount:500,currency:'EGP',date,note:'استرداد جزئي',paymentMethod:'bank',referenceNo:'REF-500'});
approx(Accounting.supplierAdvance(supplier.id).EGP||0,1500,'Supplier refund did not reduce supplier advance');
AdvancedAccounting.supplierCancellation({supplierId:supplier.id,amount:1500,currency:'EGP',date,reason:'رسوم إلغاء الفندق'});
approx(Accounting.supplierAdvance(supplier.id).EGP||0,0,'Supplier cancellation settlement did not clear supplier balance');

// 2) Line-specific supplier credit note.
const lineInv=Invoices.create({kind:'supplier',partyId:supplier.id,partyType:'supplier',currency:'EGP',date,description:'فاتورة خدمات متعددة',lines:[{description:'فندق',qty:1,price:1000,discount:0,taxId:'TAX0',accountId:'5120'},{description:'نقل',qty:1,price:1000,discount:0,taxId:'TAX0',accountId:'5140'}],status:'draft'});Invoices.post(lineInv);
const hotelLine=lineInv.lines[0];const adjId=Invoices.adjust(lineInv.id,'credit',500,'إلغاء جزء فندقي',date,hotelLine.id);const adjJ=DB.data.journals.find(j=>j.refType==='invoice-adjustment'&&j.refId===adjId);
approx((adjJ.lines||[]).filter(l=>l.accountId==='5120').reduce((z,l)=>z+(l.credit||0),0),500,'Hotel line credit incorrect');
approx((adjJ.lines||[]).filter(l=>l.accountId==='5140').reduce((z,l)=>z+(l.credit||0),0),0,'Transport was incorrectly credited');

// 3) Deferred tourism revenue with cancellation before trip.
const customer=Transactions.addCustomer({name:'عميل إيراد مؤجل',type:'individual'});
const sale=Invoices.create({kind:'customer',partyId:customer.id,partyType:'customer',currency:'EGP',date,recognitionDate:future,description:'برنامج عمرة مستقبلي',lines:[{description:'برنامج عمرة',qty:1,price:3000,discount:0,taxId:'TAX0',accountId:'4200'}],status:'draft'});Invoices.post(sale);
const revSchedule=DB.data.deferredRevenueSchedules.find(x=>x.invoiceId===sale.id);if(!revSchedule)throw new Error('Deferred revenue schedule was not created automatically');approx(revSchedule.total,3000,'Deferred revenue total');
Invoices.adjust(sale.id,'credit',600,'إلغاء جزئي قبل السفر',date);approx(revSchedule.total,2400,'Deferred revenue schedule did not shrink after credit note');
AdvancedAccounting.recognizeDeferredPart(revSchedule.id,revSchedule.parts[0].id);if(revSchedule.parts[0].status!=='posted')throw new Error('Deferred revenue recognition failed');

// 4) Deferred tourism supplier cost.
const futureCost=Invoices.create({kind:'supplier',partyId:supplier.id,partyType:'supplier',currency:'EGP',date,recognitionDate:future,description:'فندق رحلة مستقبلية',lines:[{description:'إقامة مستقبلية',qty:1,price:4000,discount:0,taxId:'TAX0',accountId:'5120'}],status:'draft'});Invoices.post(futureCost);
const costSchedule=DB.data.deferredCostSchedules.find(x=>x.invoiceId===futureCost.id);if(!costSchedule)throw new Error('Deferred cost schedule was not created automatically');approx(costSchedule.total,4000,'Deferred cost total');
Invoices.adjust(futureCost.id,'credit',1000,'إلغاء غرفة قبل السفر',date);approx(costSchedule.total,3000,'Deferred cost schedule did not shrink after credit note');
AdvancedAccounting.recognizeDeferredCostPart(costSchedule.id,costSchedule.parts[0].id);if(costSchedule.parts[0].status!=='posted')throw new Error('Deferred cost recognition failed');

// 5) Fixed asset + depreciation + disposal.
const asset=AdvancedAccounting.addAsset({name:'حاسب اختبار',date,cost:12000,salvage:0,lifeMonths:12,currency:'EGP',assetAccountId:'1540',accumAccountId:'1594',treasuryId:bank.id,fundingAccountId:'cash'});
const dep=AdvancedAccounting.depreciateAsset(asset.id,date);approx(dep.amount,1000,'Monthly depreciation incorrect');
AdvancedAccounting.disposeAsset(asset.id,{date,proceeds:9000,treasuryId:bank.id});if(asset.status!=='disposed')throw new Error('Asset disposal failed');

// 6) Loan + interest installment.
const loan=AdvancedAccounting.addLoan({lender:'بنك تمويل',date,principal:12000,annualRate:12,months:12,currency:'EGP',treasuryId:bank.id});const ls=DB.data.loanSchedules.find(x=>x.loanId===loan.id);AdvancedAccounting.payLoanInstallment(ls.id,{date,treasuryId:bank.id});if(ls.status!=='paid')throw new Error('Loan installment payment failed');

// 7) Doubtful debts, allowance write-off.
const riskCustomer=Transactions.addCustomer({name:'عميل متعثر',type:'company'});const riskInv=Invoices.create({kind:'customer',partyId:riskCustomer.id,partyType:'customer',currency:'EGP',date,description:'مديونية اختبار',lines:[{description:'خدمة',qty:1,price:1000,discount:0,taxId:'TAX0',accountId:'4200'}],status:'draft'});Invoices.post(riskInv);
AdvancedAccounting.createDoubtfulAllowance({date,amount:500,currency:'EGP',description:'مخصص اختبار'});AdvancedAccounting.writeOffFromAllowance({customerId:riskCustomer.id,date,amount:400,currency:'EGP',reason:'شطب من المخصص'});approx(Accounting.partyReceivable('customer',riskCustomer.id).EGP||0,600,'Allowance write-off did not reduce receivable');

// 8) Payroll accrual and payment.
const payroll=AdvancedAccounting.accruePayroll({date,period:date.slice(0,7),gross:1000,deductions:100,currency:'EGP'});AdvancedAccounting.payPayroll(payroll.id,{date,treasuryId:bank.id});if(payroll.status!=='paid')throw new Error('Payroll settlement failed');

// 9) Opening balance, budget, bank statement match.
const openingCustomer=Transactions.addCustomer({name:'عميل رصيد افتتاحي',type:'company'});AdvancedAccounting.postOpeningBalance({date,accountId:'1200',amount:300,currency:'EGP',side:'debit',partyType:'customer',partyId:openingCustomer.id});approx(Accounting.partyReceivable('customer',openingCustomer.id).EGP||0,300,'Opening customer balance failed');
AdvancedAccounting.setBudget({year:Number(date.slice(0,4)),month:Number(date.slice(5,7)),accountId:'5240',amount:5000});if(!AdvancedAccounting.budgetReport(Number(date.slice(0,4)),Number(date.slice(5,7))).length)throw new Error('Budget report failed');
const receiptCustomer=Transactions.addCustomer({name:'عميل مطابقة بنك',type:'company'});Transactions.addReceipt({partyType:'customer',partyId:receiptCustomer.id,treasuryId:bank.id,amount:777,currency:'EGP',date,note:'مطابقة كشف بنك',paymentMethod:'bank',referenceNo:'BANK-777',asAdvance:true});AdvancedAccounting.importBankLines({treasuryId:bank.id,lines:[{date,description:'إيداع عميل',reference:'BANK-777',amount:777}]});const recon=AdvancedAccounting.reconcileBankLines(bank.id,date,date);if(recon.matched<1)throw new Error('Bank transaction matching failed');

const journals=DB.data.journals.filter(j=>j.status!=='void'),imbalanced=journals.filter(j=>Math.abs((j.lines||[]).reduce((z,l)=>z+(Number(l.baseDebit)||0)-(Number(l.baseCredit)||0),0))>.01),critical=Accounting.audit().filter(x=>x.level==='critical');if(imbalanced.length)throw new Error(`Imbalanced journals: ${imbalanced.length}`);if(critical.length)throw new Error(`Critical audit issues: ${critical.map(x=>x.code||x.msg).join(', ')}`);
console.log(JSON.stringify({ok:true,supplierCancellation:{credit:2000,refund:500,cancellationExpense:1500,endingAdvance:Accounting.supplierAdvance(supplier.id).EGP||0},lineCredit:true,deferredRevenue:revSchedule.total,deferredCost:costSchedule.total,asset:{status:asset.status,depreciation:dep.amount},loan:{status:ls.status},badDebtReceivable:Accounting.partyReceivable('customer',riskCustomer.id).EGP||0,payroll:payroll.status,bankMatched:recon.matched,journals:journals.length,imbalanced:imbalanced.length,criticalAudit:critical.length},null,2));
