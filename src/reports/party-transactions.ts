import { EPS, N, S, byId, esc, formatDate, money, today } from '../core/runtime';
import { DB } from '../persistence/browser-store';
import { Currency } from '../accounting/currency-periods';
import { DocumentNarrative, PartyFinance } from '../finance/insights';
import { Actions } from '../core/late-bindings';
import { Print } from '../core/late-bindings';
import { Statements } from './statements';
const PartyTransactions={
 programs(){return [...new Map([...(DB.data.programs||[]),...(DB.data.umrahPrograms||[])].map((x)=>[x.id,x])).values()] as any[]},
 bookings(){return [...new Map([...(DB.data.bookings||[]),...(DB.data.umrahBookings||[])].map((x)=>[x.id,x])).values()] as any[]},
 uniqFilters(items:any[]){const out=new Map<string,any>();for(const x of items||[])if(x?.key&&!out.has(x.key))out.set(x.key,x);return [...out.values()]},
 programFilter(id){const x=this.programs().find((p:any)=>p.id===id);return x?{key:`program:${x.id}`,label:`برنامج — ${x.name||x.no||x.id}`,order:10}:null},
 bookingFilter(id){const x=this.bookings().find((b:any)=>b.id===id);return x?{key:`booking:${x.id}`,label:`حجز — ${x.no||x.name||x.id}`,order:20}:null},
 serviceFilter(id){const x=byId(DB.data.services||[],id);if(!x)return null;const detail=S(x.description||x.details?.travelerName||'').trim(),tail=detail?` — ${DocumentNarrative.clip(detail,45)}`:'';return{key:`service:${x.id}`,label:`${x.type||'خدمة'}${x.no?` — ${x.no}`:''}${tail}`,order:30}},
 purchaseOrderFilter(id){const x=byId(DB.data.purchaseOrders||[],id);return x?{key:`purchaseOrder:${x.id}`,label:`أمر شراء — ${x.no||x.id}`,order:40}:null},
 commissionFilter(id){const x=byId(DB.data.commissions||[],id);return x?{key:`commission:${x.id}`,label:`عمولة — ${x.no||x.id}`,order:50}:null},
 invoiceFilter(id){const x=byId(DB.data.invoices||[],id);return x?{key:`invoice:${x.id}`,label:`${x.kind==='supplier'?'فاتورة مورد':'فاتورة مبيعات'} — ${x.no||x.id}`,order:60}:null},
 voucherFilter(type,id){const x=byId(type==='receipt'?DB.data.receipts:DB.data.payments,id);return x?{key:`${type}:${x.id}`,label:`${type==='receipt'?'سند قبض':'سند صرف'} — ${x.no||x.id}`,order:70}:null},
 adjustmentFilter(id){const x=byId(DB.data.invoiceAdjustments||[],id);return x?{key:`invoice-adjustment:${x.id}`,label:`${x.type==='credit'?'إشعار دائن':'إشعار مدين'} — ${x.no||x.id}`,order:80}:null},
 nettingFilter(id){const x=byId(DB.data.partyNettings||[],id);return x?{key:`party-netting:${x.id}`,label:`مقاصة — ${x.no||x.id}`,order:90}:null},
 journalFilter(j){return j?{key:`journal:${j.id}`,label:`حركة — ${j.no||j.id}`,order:100}:null},
 sourceFilters(type,id,depth=0):any[]{
  if(depth>7||!type||!id)return[];
  if(type==='invoice'){
   const x=byId(DB.data.invoices||[],id);if(!x)return[];let out:any[]=[];
   if(x.sourceType&&x.sourceId)out.push(...this.sourceFilters(x.sourceType,x.sourceId,depth+1));
   if(x.bookingId)out.push(this.bookingFilter(x.bookingId));
   if(x.programId)out.push(this.programFilter(x.programId));
   if(!out.filter(Boolean).length)out.push(this.invoiceFilter(x.id));
   return this.uniqFilters(out)
  }
  if(type==='service'){
   const x=byId(DB.data.services||[],id);if(!x)return[];const out:any[]=[this.serviceFilter(x.id)];
   const bookingId=x.bookingId||x.details?.bookingId,programId=x.programId||x.details?.programId;
   if(bookingId){out.push(this.bookingFilter(bookingId));const b=this.bookings().find((v:any)=>v.id===bookingId);if(b?.programId)out.push(this.programFilter(b.programId))}
   if(programId)out.push(this.programFilter(programId));
   return this.uniqFilters(out)
  }
  if(type==='booking'||type==='umrah-booking'){
   const x=this.bookings().find((v:any)=>v.id===id);if(!x)return[];const out:any[]=[this.bookingFilter(x.id)];if(x.programId)out.push(this.programFilter(x.programId));return this.uniqFilters(out)
  }
  if(type==='purchaseOrder'){
   const x=byId(DB.data.purchaseOrders||[],id);if(!x)return[];const out:any[]=[this.purchaseOrderFilter(x.id)];if(x.programId)out.push(this.programFilter(x.programId));return this.uniqFilters(out)
  }
  if(type==='commission'){
   const x=byId(DB.data.commissions||[],id);if(!x)return[];const out:any[]=[this.commissionFilter(x.id)];
   if(x.sourceType&&x.sourceId)out.push(...this.sourceFilters(x.sourceType,x.sourceId,depth+1));else if(x.sourceId)out.push(...this.sourceFilters('service',x.sourceId,depth+1),...this.sourceFilters('booking',x.sourceId,depth+1));
   return this.uniqFilters(out)
  }
  if(type==='receipt'||type==='payment'){
   const arr=type==='receipt'?DB.data.receipts:DB.data.payments,x=byId(arr||[],id);if(!x)return[];const out:any[]=[];
   for(const a of x.allocations||[])if(a.invoiceId)out.push(...this.sourceFilters('invoice',a.invoiceId,depth+1));
   if(x.sourceType&&x.sourceId)out.push(...this.sourceFilters(x.sourceType,x.sourceId,depth+1));
   if(x.commissionId)out.push(...this.sourceFilters('commission',x.commissionId,depth+1));
   if(!out.filter(Boolean).length)out.push(this.voucherFilter(type,x.id));
   return this.uniqFilters(out)
  }
  if(type==='invoice-adjustment'){
   const x=byId(DB.data.invoiceAdjustments||[],id);if(!x)return[];const out=x.invoiceId?this.sourceFilters('invoice',x.invoiceId,depth+1):[];return out.length?out:[this.adjustmentFilter(x.id)].filter(Boolean)
  }
  if(type==='party-netting')return[this.nettingFilter(id)].filter(Boolean);
  if(type==='reversal'){
   const original=byId(DB.data.journals||[],id);return original?this.sourceFilters(original.refType,original.refId,depth+1):[]
  }
  const j=(DB.data.journals||[]).find((x)=>x.refType===type&&x.refId===id);return[this.journalFilter(j)].filter(Boolean)
 },
 lineFilters(line:any){const j=byId(DB.data.journals||[],line.journalId);if(!j)return[];const out=this.sourceFilters(j.refType,j.refId);return out.length?out:[this.journalFilter(j)].filter(Boolean)},
 matches(line:any,key:string){return !key||this.lineFilters(line).some((x:any)=>x.key===key)},
 options(o:any={}){const partyType=S(o.partyType||''),partyId=S(o.partyId||''),from=S(o.from||''),to=S(o.to||today());if(!['customer','supplier','agent'].includes(partyType)||!partyId)return[];const ids=PartyFinance.accountIds(partyType),lines=PartyFinance.lines(partyType,partyId,from,to,ids),map=new Map<string,any>();for(const l of lines)for(const f of this.lineFilters(l))if(f?.key&&!map.has(f.key))map.set(f.key,f);return[...map.values()].sort((a,b)=>N(a.order)-N(b.order)||S(a.label).localeCompare(S(b.label),'ar'))},
 labelFor(o:any,key:string){if(!key)return'كل التعاملات';return this.options({...o,from:'',to:o.to||today()}).find((x:any)=>x.key===key)?.label||'التعامل المحدد'},
 report(o:any={}){
  const partyType=S(o.partyType||''),partyId=S(o.partyId||''),from=S(o.from||''),to=S(o.to||today()),filterKey=S(o.filterKey||''),party=Actions.partyRecord(partyType,partyId);
  if(!party||!['customer','supplier','agent'].includes(partyType))throw new Error('الطرف غير موجود');
  if(!filterKey){if(partyType==='customer')return Statements.customer(partyId,from,to);if(partyType==='supplier')return Statements.supplier(partyId,from,to);return Statements.agent(partyId,from,to)}
  const ids=PartyFinance.accountIds(partyType),prev=Statements.previousDate(from),opening:any={};
  if(from)for(const l of PartyFinance.lines(partyType,partyId,'',prev,ids).filter((x:any)=>this.matches(x,filterKey))){opening[l.currency]??=0;opening[l.currency]+=N(l.debit)-N(l.credit)}
  const running:any={...opening},lines=PartyFinance.lines(partyType,partyId,from,to,ids).filter((x:any)=>this.matches(x,filterKey)).sort((a:any,b:any)=>a.date.localeCompare(b.date)||S(a.journalNo).localeCompare(S(b.journalNo))),rows:string[]=[],dueTotals:any={},creditTotals:any={};
  if(from&&Object.values(opening).some((v:any)=>Math.abs(N(v))>EPS))rows.push(`<tr><td>${formatDate(from)}</td><td>-</td><td><b>رصيد أول المدة</b></td><td>-</td><td>-</td><td>${Object.entries(opening).map(([c,v]:any)=>PartyFinance.balanceHtml(v,c)).join('<br>')}</td></tr>`);
  for(const l of lines){const dr=N(l.debit),cr=N(l.credit),c=l.currency;running[c]=(running[c]||0)+dr-cr;if(dr>EPS)dueTotals[c]=(dueTotals[c]||0)+dr;if(cr>EPS)creditTotals[c]=(creditTotals[c]||0)+cr;rows.push(`<tr><td>${formatDate(l.date)}</td><td>${esc(l.journalNo||'-')}</td><td><span class="statement-description-short">${esc(DocumentNarrative.statementLine(l,'short'))}</span></td><td class="print-party-due">${dr>EPS?money(dr,c):'-'}</td><td class="print-party-credit">${cr>EPS?money(cr,c):'-'}</td><td>${PartyFinance.balanceHtml(running[c],c)}</td></tr>`)}
  const currencies=[...new Set([...Object.keys(dueTotals),...Object.keys(creditTotals),...Object.keys(running)])],totalRows=currencies.map((c:any)=>`<tr><th colspan="3">إجمالي حركة ${c}</th><th class="print-party-due">${money(dueTotals[c]||0,c)}</th><th class="print-party-credit">${money(creditTotals[c]||0,c)}</th><th>${PartyFinance.balanceHtml(running[c]||0,c)}</th></tr>`).join(''),nonZero=currencies.filter((c:any)=>Math.abs(N(running[c]||0))>EPS),breakdown=nonZero.map((c:any)=>{const v=N(running[c]);return `<div class="print-balance-alert ${PartyFinance.tone(v)}"><span>الرصيد النهائي — ${c} — ${PartyFinance.phrase(v)}</span><strong>${money(Math.abs(v),c)}</strong></div>`}).join(''),base=DB.data.settings.baseCurrency,baseNet=nonZero.reduce((sum:number,c:any)=>sum+Currency.toBase(N(running[c]),c,to||today()),0),consolidated=nonZero.length>1?`<div class="print-balance-total">${Print.financialStatus(Math.abs(baseNet)<=EPS?'إجمالي الحساب بالعملة الأساسية':PartyFinance.phrase(baseNet),baseNet,base,Math.abs(baseNet)<=EPS?'neutral':PartyFinance.tone(baseNet),'تجميع العملات لأغراض العرض فقط حسب سعر الصرف حتى تاريخ الكشف')}</div>`:'',summary=nonZero.length?`<div class="print-balance-breakdown">${breakdown}${consolidated}</div>`:'<div class="print-balance-alert neutral"><span>موقف الحساب</span><strong>لا يوجد رصيد مستحق</strong></div>',filterLabel=this.labelFor({partyType,partyId,to},filterKey),title=partyType==='customer'?'كشف حساب عميل':partyType==='supplier'?'كشف حساب مورد':'كشف حساب مندوب';
  return Print.wrap(`${title} — ${filterLabel}`,`<div class="print-meta"><span>الطرف: <b>${esc(party.name)}</b></span><span>الكود: <b>${esc(party.no||party.id)}</b></span><span>الفترة: <b>${from?formatDate(from):'البداية'} — ${to?formatDate(to):'اليوم'}</b></span><span>التعامل: <b>${esc(filterLabel)}</b></span></div>${summary}`,`<table class="print-table"><thead><tr><th>التاريخ</th><th>المستند</th><th>التفاصيل</th><th style="color:#b42318">عليه</th><th style="color:#08785b">له</th><th>الرصيد</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="6">لا توجد حركات لهذا التعامل في الفترة المحددة</td></tr>'}</tbody>${totalRows?`<tfoot>${totalRows}</tfoot>`:''}</table>`)
 }
};
export { PartyTransactions };
