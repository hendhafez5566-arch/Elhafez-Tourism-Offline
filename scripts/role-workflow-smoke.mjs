import {assertStateChangeAllowed} from '../server/dist/authz.js';

const enabled=()=>true,license={},base={company:{companyId:'C1'},settings:{},integratedModules:{},bookings:[],services:[],invoices:[],receipts:[],payments:[],cheques:[],journals:[],documents:[]};
const clone=x=>structuredClone(x),assertPass=(name,fn)=>{try{fn()}catch(e){throw new Error(`${name}: ${e.message}`)}},assertBlocked=(name,fn)=>{let blocked=false;try{fn()}catch{blocked=true}if(!blocked)throw new Error(`${name}: expected authorization rejection`)};
const cashier={id:'cash-1',role:'cashier'},sales={id:'sales-1',role:'sales'};

const receiptOld=clone(base);receiptOld.invoices=[{id:'INV-1',status:'open',lines:[{qty:1,price:100}],sourceType:'',sourceId:''}];
const receiptNew=clone(receiptOld);receiptNew.invoices[0].status='paid';receiptNew.receipts=[{id:'REC-1',status:'posted',allocations:[{invoiceId:'INV-1',invoiceAmount:100}]}];receiptNew.journals=[{id:'J-1',status:'posted',createdBy:'cash-1',refType:'receipt',refId:'REC-1',lines:[{baseDebit:100},{baseCredit:100}]}];receiptNew.documents=[{id:'D-1',type:'receipt',refId:'REC-1'},{id:'D-2',type:'journal',refId:'J-1'}];
assertPass('cashier receipt workflow',()=>assertStateChangeAllowed(cashier,receiptOld,receiptNew,license,enabled));

const chequeNew=clone(receiptNew);chequeNew.cheques=[{id:'CH-1',direction:'in',voucherId:'REC-1'}];
assertPass('cashier cheque side effect',()=>assertStateChangeAllowed(cashier,receiptOld,chequeNew,license,enabled));

const forgedJournal=clone(receiptOld);forgedJournal.journals=[{id:'J-X',status:'posted',createdBy:'cash-1',refType:'manual',refId:'X',lines:[{baseDebit:100},{baseCredit:100}]}];
assertBlocked('cashier manual journal',()=>assertStateChangeAllowed(cashier,receiptOld,forgedJournal,license,enabled));
const forgedInvoice=clone(receiptNew);forgedInvoice.invoices[0].lines[0].price=1;
assertBlocked('cashier invoice financial edit',()=>assertStateChangeAllowed(cashier,receiptOld,forgedInvoice,license,enabled));
const wrongOwner=clone(receiptNew);wrongOwner.journals[0].createdBy='someone-else';
assertBlocked('cashier forged journal owner',()=>assertStateChangeAllowed(cashier,receiptOld,wrongOwner,license,enabled));

const bookingOld=clone(base),bookingNew=clone(base);bookingNew.bookings=[{id:'B-1',status:'confirmed'}];bookingNew.invoices=[{id:'INV-B',status:'open',sourceType:'booking',sourceId:'B-1',lines:[{qty:1,price:500}]}];bookingNew.journals=[{id:'J-B',status:'posted',createdBy:'sales-1',refType:'invoice',refId:'INV-B',lines:[{baseDebit:500},{baseCredit:500}]}];bookingNew.documents=[{id:'D-B1',type:'invoice',refId:'INV-B'},{id:'D-B2',type:'journal',refId:'J-B'}];
assertPass('sales booking with generated invoice and journal',()=>assertStateChangeAllowed(sales,bookingOld,bookingNew,license,enabled));
const unlinkedInvoice=clone(bookingNew);unlinkedInvoice.invoices[0].sourceId='UNKNOWN';
assertBlocked('sales unlinked invoice',()=>assertStateChangeAllowed(sales,bookingOld,unlinkedInvoice,license,enabled));

console.log(JSON.stringify({ok:true,workflows:['cashier receipt','cashier cheque','sales booking'],blocked:['manual journal','invoice financial edit','foreign journal owner','unlinked invoice']},null,2));
