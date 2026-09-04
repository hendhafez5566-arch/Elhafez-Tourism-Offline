import {assertRecordLifecycle,assertFinancialImmutability} from '../server/dist/authz.js';
import {readFile} from 'node:fs/promises';

const base=()=>({customers:[],suppliers:[],agents:[],accounts:[],costCenters:[],treasuries:[],currencies:[],taxCodes:[],invoices:[],invoiceAdjustments:[],receipts:[],payments:[],bookings:[],services:[],programs:[],purchaseOrders:[],quotations:[],journals:[],documents:[],expenses:[],manualJournalDrafts:[],transfers:[],cheques:[],cashCounts:[],fxRevaluations:[],commissions:[],umrahPrograms:[],umrahBookings:[],umrahSupplierCommitments:[]});
const clone=x=>structuredClone(x),blocked=(fn)=>{try{fn();return false}catch(e){return Number(e?.statusCode)===409}};
const checks=[];
{
 const old=base();old.customers=[{id:'C1',name:'عميل مستخدم'}];old.invoices=[{id:'I1',no:'SI-1',partyType:'customer',partyId:'C1',status:'posted'}];const neu=clone(old);neu.customers=[];
 checks.push(['used customer cannot be deleted',blocked(()=>assertRecordLifecycle(old,neu))]);
}
{
 const old=base();old.customers=[{id:'C2',name:'عميل غير مستخدم'}];const neu=clone(old);neu.customers=[];
 let ok=true;try{assertRecordLifecycle(old,neu)}catch{ok=false}checks.push(['unused customer can be deleted',ok]);
}
{
 const old=base();old.accounts=[{id:'4100',name:'إيرادات'}];old.journals=[{id:'J1',status:'posted',lines:[{accountId:'4100',baseCredit:100}]}];const neu=clone(old);neu.accounts=[];
 checks.push(['posted account cannot be deleted',blocked(()=>assertRecordLifecycle(old,neu))]);
}
{
 const old=base();old.invoices=[{id:'I2',no:'SI-2',status:'draft'}];old.documents=[{id:'D1',type:'invoice',refId:'I2'}];const neu=clone(old);neu.invoices=[];
 checks.push(['linked draft invoice cannot be deleted',blocked(()=>assertRecordLifecycle(old,neu))]);
}
{
 const old=base();old.receipts=[{id:'R1',no:'R-1',status:'void',amount:100,currency:'EGP',allocations:[]}];const neu=clone(old);neu.receipts[0].amount=200;
 checks.push(['void receipt is financially immutable',blocked(()=>assertFinancialImmutability(old,neu))]);
}
{
 const old=base();old.umrahBookings=[{id:'UB1',no:'UB-1',status:'cancelled',programId:'P1',customerId:'C1',counts:{adults:1},persons:1,total:1000,currency:'EGP'}];const neu=clone(old);neu.umrahBookings[0].total=1;
 checks.push(['cancelled Umrah booking is financially immutable',blocked(()=>assertFinancialImmutability(old,neu))]);
}
{
 const old=base();old.purchaseOrders=[{id:'PO-U1',no:'PO-1',status:'approved',sourceType:'umrah-procurement',supplierId:'S1',date:'2026-08-29',currency:'EGP',expectedDate:'2026-09-10',programId:'UP1',costCenterId:'CC-U1',lines:[{description:'فندق',qty:1,price:5000,taxId:'TAX0',accountId:'5110'}]}];const neu=clone(old);neu.purchaseOrders[0].status='void';neu.purchaseOrders[0].lines[0].costCenterId='CC-U1';neu.purchaseOrders[0].lines[0].printDescription='بيان طباعة فقط';
 let ok=true;try{assertFinancialImmutability(old,neu)}catch{ok=false}checks.push(['Umrah PO cancellation tolerates equivalent legacy line metadata',ok]);
}
{
 const old=base();old.purchaseOrders=[{id:'PO-U2',no:'PO-2',status:'approved',sourceType:'umrah-procurement',supplierId:'S1',date:'2026-08-29',currency:'EGP',expectedDate:'2026-09-10',programId:'UP1',costCenterId:'CC-U1',lines:[{description:'فندق',qty:1,price:5000,taxId:'TAX0',accountId:'5110',costCenterId:'CC-U1'}]}];const neu=clone(old);neu.purchaseOrders[0].lines[0].price=1;
 checks.push(['approved Umrah PO still blocks real financial line edits',blocked(()=>assertFinancialImmutability(old,neu))]);
}
{
 const server=await readFile(new URL('../server/src/server.ts',import.meta.url),'utf8');
 checks.push(['technical activity cleanup retains critical financial audit',server.includes('CRITICAL_AUDIT_COLLECTIONS')&&server.includes('retainedCritical')&&server.includes('jsonb_array_elements')]);
}
const failed=checks.filter(([,ok])=>!ok);console.log(JSON.stringify({ok:!failed.length,checks:checks.map(([name,pass])=>({name,pass}))},null,2));if(failed.length)process.exit(9);
