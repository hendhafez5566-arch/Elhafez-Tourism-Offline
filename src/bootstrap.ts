import { EPS, Money, N, S, byId, dateAddMonthsClamped, daysBetween, deep, esc, fmt, formatDate, icon, iid, live, money, now, toast, today } from './core/runtime';
import { BrowserPlatform } from './platform/browser-platform';
import { AdministrationRules } from './commercial/administration-rules';
import { PartyBusinessRules } from './crm/party-business-rules';
import { ActionPolicy } from './core/action-policy';
import { Numbering } from './core/numbering';
import { AdvancedAccounting } from './accounting/advanced';
import { ServerStore } from './persistence/server-store';
import { DB } from './persistence/browser-store';
import { Seed } from './core/seed';
import { BranchScope, Commercial, CommercialSupport } from './commercial/product';
import { Currency, Periods } from './accounting/currency-periods';
import { Accounting, ManualJournal } from './accounting/engine';
import { Invoices, MasterData, Tax } from './accounting/invoices';
import { Approvals, Transactions } from './accounting/transactions';
import { PurchaseOrderFulfillment } from './crm/purchase-order-fulfillment';
import { CRM } from './crm/crm';
import { Auth, License, RolePermissions, Security } from './security/auth';
import { AccessControl } from './security/access-control';
import type { FormDefinitionDeps } from './application/form-definition-workflows';
import type { CleanPageDeps } from './application/clean-page-queries';
import type { AdvancedActionsDeps } from './application/advanced-actions-workflows';
import type { AccountingPageDeps } from './application/accounting-page-queries';
import type { OperationsPageDeps } from './application/operations-page-queries';
import type { AdvancedPageDeps } from './application/advanced-page-queries';
import type { CommercialPageDeps } from './application/commercial-page-queries';
import type { MasterActionsDeps } from './application/master-actions-workflows';
import type { Party360Deps } from './application/party360-workflows';
import type { ReportSettingsDeps } from './application/report-settings-workflows';
import { createParty360Presentation, createUnifiedPartyPresentation } from './ui/party-presentation';
import { Party360 } from './ui/party360';
import { Insights } from './finance/insights';
import { UI } from './ui/ui';
import { Forms } from './ui/forms';
import { UmrahCore_now, UmrahCore_programLabel, UmrahCore_today } from './core/umrah/runtime';
import { UmrahCore_ERP } from './core/umrah/integration';
import { UmrahCore_Bridge, UmrahCore_DB } from './core/umrah/data';
import { UmrahCore_ContractCenter } from './core/umrah/contracts';
import { UmrahCore_Procurement } from './core/umrah/procurement';
import { VendorOwner } from './commercial/vendor-owner';
import { Actions } from './ui/actions';
import { CommercialUX } from './ui/commercial-ux';
import type { DocumentPrintPresentationDeps, UmrahPresentationCommands } from './platform/platform-contracts';
import type { AuthEntryPresentationDeps } from './ui/auth-entry-presentation';
import type { ContactPresentationDeps } from './ui/contact-presentation';
import type { CommercialWorkflowDeps, DocumentWorkflowDeps } from './application/contracts';
import type { ApprovalWorkflowDeps, BranchWorkflowDeps, BusinessClock, BusinessJournalLine, BusinessMoneyPort, BusinessTreasury, CrmWorkflowDeps, ExpenseRecord, ExpenseWorkflowDeps, FinancialQueryDeps, IntegrityReportResult, IntegrityWorkflowDeps, InvoiceRuleDeps, InvoiceWorkflowDeps, JournalRuleDeps, ManualJournalWorkflowDeps, NettingRecord, NettingWorkflowDeps, TourismService, TourismWorkflowDeps, TransferWorkflowDeps, UmrahLifecycleBooking, UmrahLifecycleDeps, UmrahLifecycleProgram, VoucherWorkflowDeps } from './application/business-contracts';
import type { PartyNameRepository } from './crm/party-business-rules';
import type { UnifiedParty } from './crm/unified-party';
import { __set_composeAccountingPageDeps, __set_composeCommercialPageDeps, __set_composeAdvancedPageDeps, __set_composeAdvancedActionsDeps, __set_composeAuthEntryPresentation, __set_composeCleanPageDeps, __set_composeContactPresentation, __set_composeFormDefinitionDeps, __set_composeLegacyActionDeps, __set_composeLegacyApprovalDeps, __set_composeLegacyBranchAccess, __set_composeLegacyBranchDeps, __set_composeLegacyCommercialDeps, __set_composeLegacyCommercialPermissions, __set_composeLegacyCrmDeps, __set_composeLegacyExpenseDeps, __set_composeLegacyFinancialQueries, __set_composeLegacyIntegrityDeps, __set_composeLegacyInvoiceDeps, __set_composeLegacyInvoiceRules, __set_composeLegacyJournalRules, __set_composeLegacyManualJournalDeps, __set_composeLegacyNettingDeps, __set_composeLegacyPartyNames, __set_composeLegacyPhonePolicy, __set_composeLegacyTourismDeps, __set_composeLegacyTransferDeps, __set_composeLegacyUmrahLifecycleDeps, __set_composeLegacyVoucherDeps, __set_composeMasterActionsDeps, __set_composeOperationsPageDeps, __set_composeParty360Deps, __set_composeParty360Presentation, __set_composePrintPresentation, __set_composeReportSettingsDeps, __set_composeUmrahPresentationCommands, __set_composeUnifiedPartyPresentation } from './core/late-bindings';
__set_composeAccountingPageDeps(composeAccountingPageDeps); __set_composeCommercialPageDeps(composeCommercialPageDeps); __set_composeAdvancedPageDeps(composeAdvancedPageDeps); __set_composeAdvancedActionsDeps(composeAdvancedActionsDeps); __set_composeAuthEntryPresentation(composeAuthEntryPresentation); __set_composeCleanPageDeps(composeCleanPageDeps); __set_composeContactPresentation(composeContactPresentation); __set_composeFormDefinitionDeps(composeFormDefinitionDeps); __set_composeLegacyActionDeps(composeLegacyActionDeps); __set_composeLegacyApprovalDeps(composeLegacyApprovalDeps); __set_composeLegacyBranchAccess(composeLegacyBranchAccess); __set_composeLegacyBranchDeps(composeLegacyBranchDeps); __set_composeLegacyCommercialDeps(composeLegacyCommercialDeps); __set_composeLegacyCommercialPermissions(composeLegacyCommercialPermissions); __set_composeLegacyCrmDeps(composeLegacyCrmDeps); __set_composeLegacyExpenseDeps(composeLegacyExpenseDeps); __set_composeLegacyFinancialQueries(composeLegacyFinancialQueries); __set_composeLegacyIntegrityDeps(composeLegacyIntegrityDeps); __set_composeLegacyInvoiceDeps(composeLegacyInvoiceDeps); __set_composeLegacyInvoiceRules(composeLegacyInvoiceRules); __set_composeLegacyJournalRules(composeLegacyJournalRules); __set_composeLegacyManualJournalDeps(composeLegacyManualJournalDeps); __set_composeLegacyNettingDeps(composeLegacyNettingDeps); __set_composeLegacyPartyNames(composeLegacyPartyNames); __set_composeLegacyPhonePolicy(composeLegacyPhonePolicy); __set_composeLegacyTourismDeps(composeLegacyTourismDeps); __set_composeLegacyTransferDeps(composeLegacyTransferDeps); __set_composeLegacyUmrahLifecycleDeps(composeLegacyUmrahLifecycleDeps); __set_composeLegacyVoucherDeps(composeLegacyVoucherDeps); __set_composeMasterActionsDeps(composeMasterActionsDeps); __set_composeOperationsPageDeps(composeOperationsPageDeps); __set_composeParty360Deps(composeParty360Deps); __set_composeParty360Presentation(composeParty360Presentation); __set_composePrintPresentation(composePrintPresentation); __set_composeReportSettingsDeps(composeReportSettingsDeps); __set_composeUmrahPresentationCommands(composeUmrahPresentationCommands); __set_composeUnifiedPartyPresentation(composeUnifiedPartyPresentation);
// Phase 3: legacy infrastructure composition. Live getters survive atomic rollback.
function composeBusinessClock(): BusinessClock {
    return {
        today, now, id: iid, next: (kind, date) => Numbering.next(kind, date), clone: value => deep(value), formatDate
    };
}
function composeBusinessMoney(): BusinessMoneyPort {
    return {
        round: (value, currency) => Money.round(value, currency), rate: (currency, date) => Currency.rate(currency, date), toBase: (amount, currency, date) => Currency.toBase(amount, currency, date), format: (amount, currency) => money(amount, currency)
    };
}
function composeLegacyCrmDeps(policy?: CrmWorkflowDeps['policy']): CrmWorkflowDeps {
    return {
        repository: {
            get leads() {
                return DB.data.leads;
            }, set leads(value) {
                DB.data.leads = value;
            }, get followups() {
                return DB.data.followups;
            }, set followups(value) {
                DB.data.followups = value;
            }, get quotations() {
                return DB.data.quotations;
            }, set quotations(value) {
                DB.data.quotations = value;
            }, get purchaseOrders() {
                return DB.data.purchaseOrders;
            }, set purchaseOrders(value) {
                DB.data.purchaseOrders = value;
            }, get invoices() {
                return DB.data.invoices;
            }, get programs() {
                return DB.data.programs;
            }, baseCurrency: () => DB.data.settings.baseCurrency
        },
        clock: composeBusinessClock(), actor: () => Auth.user, transactions: {
            atomic: (label, work, options) => DB.atomic(label, work, options), atomicAsync: (label, work, options) => DB.atomicAsync(label, work, options), fastAtomic: (label, work, options) => DB.fastAtomic(label, work, options)
        }, persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        },
        invoices: {
            create: input => Invoices.create(input), post: invoice => Invoices.post(invoice)
        }, parties: {
            addCustomer: input => Transactions.addCustomer(input), applyPendingInvoiceAdvances: (invoice, filter) => Transactions.applyPendingInvoiceAdvances(invoice, filter)
        }, policy: policy || {
            requireEditable: (kind, record) => ActionPolicy.requireEditable(kind, record)
        }, fulfillment: {
            normalizeLines: (lines, previous) => PurchaseOrderFulfillment.normalizeLines(lines, previous), receiveAll: order => PurchaseOrderFulfillment.receiveAll(order), record: (order, quantities) => PurchaseOrderFulfillment.record(order, quantities), uninvoicedLines: (order, options) => PurchaseOrderFulfillment.uninvoicedLines(order, options), markInvoiced: (order, lines) => PurchaseOrderFulfillment.markInvoiced(order, lines)
        }, tax: {
            amount: (amount, id) => Tax.amount(amount, id)
        }
    };
}
function composeLegacyVoucherDeps(): VoucherWorkflowDeps {
    return {
        clock: composeBusinessClock(), actor: () => Auth.user, branchId: () => BranchScope.currentId(), transactions: {
            atomic: (label, work, options) => DB.atomic(label, work, options), atomicAsync: (label, work, options) => DB.atomicAsync(label, work, options), fastAtomic: (label, work, options) => DB.fastAtomic(label, work, options)
        }, persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        }, money: composeBusinessMoney(),
        repository: {
            baseCurrency: () => DB.data.settings.baseCurrency, approvalPayments: () => DB.data.settings.approvalPayments, get treasuries() {
                return DB.data.treasuries;
            }, get invoices() {
                return DB.data.invoices;
            }, get receipts() {
                return DB.data.receipts;
            }, get payments() {
                return DB.data.payments;
            }, get cheques() {
                return DB.data.cheques;
            }, get documents() {
                return DB.data.documents;
            }, get commissions() {
                return DB.data.commissions;
            }
        },
        invoices: {
            allocate: (kind, partyId, currency, amount, date, invoiceId) => Invoices.allocate(kind, partyId, currency, amount, date, invoiceId), refresh: invoice => Invoices.refresh(invoice)
        }, accounting: {
            post: input => Accounting.post(input), reverse: (type, id, reason) => Accounting.reverse(type, id, reason), documentStatus: (type, id, status) => Accounting.documentStatus(type, id, status), ensureTreasuryAccount: treasury => Accounting.ensureTreasuryAccount(treasury), validateTreasury: (id, amount) => Accounting.validateTreasury(id, amount), supplierAdvance: id => Accounting.supplierAdvance(id), customerAdvance: (type, id) => Accounting.customerAdvance(type, id)
        },
        approval: {
            create: (type, payload, amount) => Approvals.create(type, payload, amount), requested: approval => {
                toast(`تم إرسال الطلب للاعتماد ${approval.no}`, 'warning');
            }
        }, pendingDraftInvoice: (kind, type, id, currency, invoiceId) => Transactions.pendingDraftInvoice(kind, type, id, currency, invoiceId), onReceipt: receipt => {
            if (typeof UmrahCore_ERP !== 'undefined')
                return UmrahCore_ERP.onReceipt?.(receipt);
        }
    };
}
function composeLegacyCommercialDeps():CommercialWorkflowDeps {
 return {
  authorization:{require:(page,action)=>Auth.require(page,action)},
  transactions:{atomic:(label,work,options)=>DB.atomic(label,work,options),atomicAsync:(label,work,options)=>DB.atomicAsync(label,work,options),fastAtomic:(label,work,options)=>DB.fastAtomic(label,work,options)},
  persistence:{save:render=>render===undefined?DB.save():DB.save(render),log:(action,type,id,detail)=>DB.log(action,type,id,detail)},
  activity:{setRange:range=>{DB.data.settings.activityRange=range;},entries:()=>DB.data.auditLog||[],replace:entries=>{DB.data.auditLog=entries;},trimUmrah:(range,cut)=>{try{if(typeof UmrahCore_DB!=='undefined'&&UmrahCore_DB?.data?.activity)UmrahCore_DB.data.activity=(UmrahCore_DB.data.activity||[]).filter(x=>range!=='all'&&Date.parse(x.at)<cut);}catch(_){}},clearRemote:range=>CommercialSupport.clearAudit(range),warn:error=>console.warn('[audit] cleanup failed',typeof error==='object'&&error!==null&&'message' in error?error.message:undefined)},
  branches:{find:id=>byId(DB.data.branches,id),all:()=>DB.data.branches,create:fields=>Commercial.createBranch(fields),update:(id,fields)=>Commercial.updateBranch(id,fields)},
  users:{find:id=>byId(DB.data.users,id)},audit:{read:()=>CommercialSupport.audit(),userName:id=>byId(DB.data.users,id)?.name},nowMillis:()=>Date.now()
 };
}

// The existing composition root adapts legacy state and authorization once per action.
// Function declarations are hoisted; returned ports use the live stores, never snapshots.
function composeLegacyActionDeps():DocumentWorkflowDeps {
 return {
  authorization:{require:(page,action)=>Auth.require(page,action)},
  transactions:{atomic:(label,work,options)=>DB.atomic(label,work,options),atomicAsync:(label,work,options)=>DB.atomicAsync(label,work,options),fastAtomic:(label,work,options)=>DB.fastAtomic(label,work,options)},
  persistence:{save:render=>render===undefined?DB.save():DB.save(render),log:(action,type,id,detail)=>DB.log(action,type,id,detail)},
  repository:{invoices:()=>DB.data.invoices,invoice:id=>byId(DB.data.invoices,id),quotation:id=>byId(DB.data.quotations,id),purchaseOrder:id=>byId(DB.data.purchaseOrders,id)},
  domain:{createInvoice:fields=>Invoices.create(fields),postInvoice:invoice=>Invoices.post(invoice),addReceipt:fields=>Transactions.addReceipt(fields),addPayment:fields=>Transactions.addPayment(fields),addQuotation:fields=>CRM.addQuotation(fields),updateQuotation:(id,fields)=>CRM.updateQuotation(id,fields),addPurchaseOrder:fields=>CRM.addPO(fields),updatePurchaseOrder:(id,fields)=>CRM.updatePO(id,fields),receivePurchaseOrder:(id,quantities)=>CRM.receivePOLines(id,quantities),voidPurchaseOrder:(id,reason)=>CRM.voidPO(id,reason),removePurchaseOrder:id=>CRM.removePO(id)},
  operations:{
   removeProgram:(id)=>Transactions.removeProgram(id),
   confirmBooking:(id)=>Transactions.confirmBooking(id),
   completeBooking:(id)=>Transactions.completeBooking(id),
   reopenBooking:(id,reason)=>Transactions.reopenBooking(id,reason),
   cancelBooking:(id,reason)=>Transactions.cancelBooking(id,reason),
   confirmService:(id)=>Transactions.confirmService(id),
   completeService:(id)=>Transactions.completeService(id),
   reopenService:(id,reason)=>Transactions.reopenService(id,reason),
   cancelService:(id,reason)=>Transactions.cancelService(id,reason),
   deleteService:(id)=>Transactions.deleteService(id),
   voidReceipt:(id,reason)=>Transactions.voidReceipt(id,reason),
   voidPayment:(id,reason)=>Transactions.voidPayment(id,reason),
   reverseInvoiceAdjustment:(id,reason)=>Invoices.reverseAdjustment(id,reason),
   cancelInvoice:(id,reason)=>Invoices.cancel(id,reason),
   deleteExpense:(id)=>Transactions.deleteExpense(id),
   voidExpense:(id,reason)=>Transactions.voidExpense(id,reason),
   recognizePrepaid:(id)=>Transactions.recognizePrepaid(id),
   reversePrepaid:(id,reason)=>Transactions.reversePrepaid(id,reason),
   approveCommission:(id)=>Transactions.approveCommission(id),
   rejectCommission:(id,reason)=>Transactions.rejectCommission(id,reason),
   reverseCommission:(id,reason)=>Transactions.reverseCommissionPayment(id,reason),
   toggleTreasury:(id)=>Transactions.toggleTreasury(id),
   removeTreasury:(id)=>Transactions.removeTreasury(id),
   reverseTransfer:(id,reason)=>Transactions.reverseTransfer(id,reason),
   bounceCheque:(id,reason)=>Transactions.bounceCheque(id,reason),
   toggleCurrency:(id)=>Currency.toggle(id),
   removeCurrency:(id)=>Currency.remove(id),
   postManualJournal:(id)=>ManualJournal.postDraft(id),
   removeManualJournal:(id)=>ManualJournal.removeDraft(id),
   reverseManualJournal:(id,reason)=>ManualJournal.reverse(id,reason),
   runRecurringJournal:(id)=>ManualJournal.runRecurring(id),
   toggleRecurringJournal:(id)=>ManualJournal.toggleRecurring(id),
   removeRecurringJournal:(id)=>ManualJournal.removeRecurring(id),
   toggleAccount:(id)=>MasterData.toggleAccount(id),
   removeAccount:(id)=>MasterData.removeAccount(id),
   removeCostCenter:(id)=>MasterData.removeCostCenter(id),
   approveRequest:(id)=>Approvals.approve(id),
   rejectRequest:(id,reason)=>Approvals.reject(id,reason),
   convertLead:(id)=>CRM.convertLead(id),
   removeLead:(id)=>CRM.removeLead(id),
   removeFollowup:(id)=>CRM.removeFollowup(id),
   acceptQuotation:(id)=>CRM.acceptQuotation(id),
   convertQuotation:(id)=>CRM.convertQuotation(id),
   removeQuotation:(id)=>CRM.removeQuotation(id),
   approvePO:(id)=>CRM.approvePO(id),
   convertPO:(id)=>CRM.convertPO(id),
   toggleUser:(id)=>MasterData.toggleUser(id),
  },
  clock:{today:()=>today(),now:()=>now(),formatDate:value=>formatDate(value)},
  text:value=>S(value),isLive:value=>live(value)
 };
}

(async()=>{
  // Never leave credentials in the address bar/history, even if an older
  // login form previously fell back to a native GET submission.
  try{
    if(typeof location!=='undefined'&&typeof location.href==='string'&&location.href){
      const url=new URL(location.href);
      if(url.searchParams.has('username')||url.searchParams.has('password')){
        url.searchParams.delete('username');
        url.searchParams.delete('password');
        history.replaceState(null,'',url.pathname+(url.search||'')+(url.hash||''));
      }
    }
  }catch(e){console.error('[bootstrap] failed to sanitize login URL',e)}

  const showOfflineBoot=(title='لا يوجد اتصال بالإنترنت',detail='يحتاج النظام للاتصال بخادم الشركة لحماية ومزامنة البيانات.')=>{
    try{
      document.getElementById('login')?.classList.remove('hidden');
      document.getElementById('app')?.classList.add('hidden');
      document.getElementById('loginForm')?.classList.add('hidden');
      const boot=document.getElementById('authBootBrand'),box=document.getElementById('authBootOffline');
      boot?.classList.remove('hidden');boot?.classList.add('offline');box?.classList.remove('hidden');
      const h=document.getElementById('authBootOfflineTitle'),t=document.getElementById('authBootOfflineText');
      if(h)h.textContent=title;if(t)t.textContent=detail;
    }catch(e){console.error('[bootstrap] offline screen failed',e)}
  };

  const remoteRequired=ServerStore.remoteRequired?.()===true;
  if(remoteRequired&&BrowserPlatform.online()===false){
    showOfflineBoot();
    BrowserPlatform.reloadOnOnline();
    return;
  }

  // Block any native form submission immediately, but do not render a login
  // card until /api/bootstrap tells us whether this is Login or First Setup.
  // This guarantees that refresh/first-run never flashes the wrong auth UI.
  try{
    const loginForm=document.getElementById('loginForm');
    loginForm?.addEventListener('submit',e=>e.preventDefault());
  }catch(e){console.error('[bootstrap] early auth guard failed',e)}

  try{
    await DB.init();
  }catch(e){
    console.error('[bootstrap] DB.init failed',e);
    try{await Auth.init()}catch(authError){console.error('[bootstrap] Auth.init after DB failure failed',authError)}
    if(typeof Auth!=='undefined'&&!Auth.user)Auth.showServerUnavailable?.(e?.message||'تعذر تهيئة بيانات النظام');
    return;
  }

  // Keep the permanent login DOM branded immediately after /api/bootstrap.
  // This avoids a second visual login state during refresh.
  try{UI.applyBrand(true)}catch(e){console.error('[bootstrap] login branding failed',e)}

  // Apply the synchronous commercial data normalization first, but never let
  // auxiliary vendor networking sit in front of authentication/ERP entry.
  try{await Commercial.afterInit()}catch(e){console.error('[bootstrap] Commercial.afterInit failed',e)}
  try{VendorOwner.applyStatus(ServerStore.vendor,false)}catch(e){console.error('[bootstrap] vendor status apply failed',e)}
  try{const w=DB.data.settings?.workspaces?.find(x=>x.id==='admin');if(w){let changed=false;if(!w.pages.includes('backup-center')){w.pages.splice(Math.min(1,w.pages.length),0,'backup-center');changed=true}if(!w.pages.includes('period-archiving')){w.pages.splice(Math.min(2,w.pages.length),0,'period-archiving');changed=true}if(changed){DB.data.meta.dataProtectionV2=true;DB.save(false)}}}catch(e){console.error('[bootstrap] data protection navigation migration failed',e)}

  try{
    await Auth.init();
  }catch(e){
    console.error('[bootstrap] Auth.init failed',e);
    const message='تعذر إكمال تهيئة واجهة النظام بعد التحقق من الجلسة: '+(e?.message||e);
    if(typeof Auth!=='undefined')Auth.showLogin?.(message);
    else if(typeof toast==='function')toast(message,'error');
  }

  // v32.5.64 performance: prebuild the existing read-only accounting index
  // after authentication and outside the critical first-paint path. This does
  // not mutate ERP data; it only avoids making the first customer/supplier
  // page pay the full journal-index construction cost.
  try{
    const warm=()=>{try{Accounting.partyBalanceIndex?.()}catch(e){console.debug('[perf] balance warmup skipped',e)}};
    BrowserPlatform.scheduler.idle(warm,1800,900);
  }catch(e){console.debug('[perf] idle warmup unavailable',e)}

  // Vendor center discovery is optional and must never block login. Run it
  // only after Auth.init has had the opportunity to enter the ERP.
  try{Promise.resolve(VendorOwner.init()).catch(e=>console.error('[bootstrap] VendorOwner.init failed',e))}catch(e){console.error('[bootstrap] VendorOwner.init start failed',e)}
})();

function composeLegacyJournalRules(accounting: {
    validateLine(line: BusinessJournalLine): void;
}): JournalRuleDeps {
    return {
        baseCurrency: DB.data.settings.baseCurrency, validateLine: line => accounting.validateLine(line), rate: (currency, date) => Currency.rate(currency, date), round: (value, currency) => Money.round(value, currency), format: value => fmt(value)
    };
}
function composeLegacyInvoiceRules(): InvoiceRuleDeps {
    return {
        round: (value, currency) => Money.round(value, currency), tax: {
            amount: (amount, id, rate, currency) => Tax.amount(amount, id, rate, currency), require: id => Tax.require(id)
        }
    };
}
function composeLegacyInvoiceDeps(math: InvoiceWorkflowDeps['math']): InvoiceWorkflowDeps {
    return {
        repository: {
            get suppliers() {
                return DB.data.suppliers;
            }, get agents() {
                return DB.data.agents;
            }, get customers() {
                return DB.data.customers;
            }, get invoices() {
                return DB.data.invoices;
            }, get invoiceAdjustments() {
                return DB.data.invoiceAdjustments;
            }, get documents() {
                return DB.data.documents;
            }, baseCurrency: () => DB.data.settings.baseCurrency
        }, periods: {
            assertOpen: date => Periods.assertOpen(date)
        }, money: composeBusinessMoney(), tax: {
            require: id => Tax.require(id)
        }, math: {
            validateLines: invoice => math.validateLines(invoice), lineCalc: (line, currency) => math.lineCalc(line, currency), total: invoice => math.total(invoice), allocations: id => math.allocations(id), refresh: invoice => math.refresh(invoice)
        }, accounting: {
            post: input => Accounting.post(input), reverse: (type, id, reason) => Accounting.reverse(type, id, reason), documentStatus: (type, id, status) => Accounting.documentStatus(type, id, status), partyReceivable: (type, id) => Accounting.partyReceivable(type, id)
        }, balanceBase: (map, positiveOnly) => Insights.balanceBase(map, positiveOnly), persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        }, applyPending: invoice => {
            if (typeof Transactions !== 'undefined')
                return Transactions.applyPendingInvoiceAdvances(invoice);
        }, syncService: invoice => {
            if (typeof Transactions !== 'undefined')
                return Transactions.syncServiceBillingByInvoice(invoice);
        }, deferred: {
            available: () => typeof AdvancedAccounting !== 'undefined', revenue: invoice => AdvancedAccounting.deferInvoiceRevenue({
                invoiceId: invoice.id, date: invoice.date, recognitionDate: invoice.recognitionDate, months: 1
            }), cost: invoice => AdvancedAccounting.deferSupplierCost({
                invoiceId: invoice.id, date: invoice.date, recognitionDate: invoice.recognitionDate, months: 1
            })
        }
    };
}
function composeLegacyBranchDeps(): BranchWorkflowDeps {
    return {
        authorization: {
            require: (page, action) => Auth.require(page, action)
        }, repository: {
            get branches() {
                return DB.data.branches;
            }, get users() {
                return DB.data.users;
            }
        }, actor: () => Auth.user, branchLimit: () => License.maxBranches(), selection: {
            current: () => BranchScope.currentId(), store: id => localStorage.setItem(BranchScope.storageKey(), id)
        }, clock: composeBusinessClock(), persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        }
    };
}
function composeLegacyBranchAccess(): string[] {
    return AdministrationRules.allowedBranchIds(DB.data.branches, typeof Auth !== 'undefined' ? Auth.user : null);
}
function composeLegacyCommercialPermissions() {
    return {
        get viewCosts() {
            return AdministrationRules.canViewCosts(Auth.user);
        }, get maxDiscountPct() {
            return AdministrationRules.maxDiscountPct(Auth.user);
        }
    };
}
function composeLegacyApprovalDeps(): ApprovalWorkflowDeps {
    return {
        repository: {
            get approvals() {
                return DB.data.approvals;
            }, get expenses() {
                return DB.data.expenses;
            }, get commissions() {
                return DB.data.commissions;
            }, allowSelfApproval: () => DB.data.settings.allowSelfApproval, baseCurrency: () => DB.data.settings.baseCurrency
        }, actor: () => Auth.user, clock: composeBusinessClock(), money: composeBusinessMoney(), persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        }, operations: {
            addPayment: (payload, options) => Transactions.addPayment(payload, options), postExpense: (expense, options) => Transactions.postExpense(expense, options), approveCommission: id => Transactions.approveCommission(id), rejectCommission: (id, reason) => Transactions.rejectCommission(id, reason)
        }
    };
}
function composeLegacyTourismDeps(operations: {
    ensureServiceCommission(service: TourismService): unknown;
}): TourismWorkflowDeps {
    return {
        repository: {
            get services() {
                return DB.data.services;
            }, get bookings() {
                return DB.data.bookings;
            }, get customers() {
                return DB.data.customers;
            }, get agents() {
                return DB.data.agents;
            }, get suppliers() {
                return DB.data.suppliers;
            }
        }, transactions: {
            atomic: (label, work, options) => DB.atomic(label, work, options), atomicAsync: (label, work, options) => DB.atomicAsync(label, work, options), fastAtomic: (label, work, options) => DB.fastAtomic(label, work, options)
        }, persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        }, invoices: {
            create: input => Invoices.create(input), post: invoice => Invoices.post(invoice)
        }, ensureServiceCommission: service => operations.ensureServiceCommission(service)
    };
}
function composeLegacyFinancialQueries(): FinancialQueryDeps {
    return {
        money: composeBusinessMoney(), today, daysBetween, repository: {
            get customers() {
                return DB.data.customers;
            }, get agents() {
                return DB.data.agents;
            }, get suppliers() {
                return DB.data.suppliers;
            }, get treasuries() {
                return DB.data.treasuries;
            }, get invoices() {
                return DB.data.invoices;
            }, get purchaseOrders() {
                return DB.data.purchaseOrders;
            }
        }, ledger: {
            lines: (from, to) => Accounting.lines(from, to), account: id => Accounting.account(id), partyReceivable: (type, id) => Accounting.partyReceivable(type, id), supplierPayable: id => Accounting.supplierPayable(id), agentPayable: id => Accounting.agentPayable(id), customerAdvance: (type, id, from, to) => Accounting.customerAdvance(type, id, from, to), supplierAdvance: (id, from, to) => Accounting.supplierAdvance(id, from, to), treasuryBalance: (id, to) => Accounting.treasuryBalance(id, to)
        }, invoices: {
            listMetrics: invoices => Invoices.listMetrics(invoices)
        }, lineTotal: line => CRM.lineTotal(line)
    };
}
function composeLegacyManualJournalDeps(): ManualJournalWorkflowDeps {
    return {
        clock: composeBusinessClock(), actor: () => Auth.user, repository: {
            get manualJournalDrafts() {
                return DB.data.manualJournalDrafts;
            }, set manualJournalDrafts(value) {
                DB.data.manualJournalDrafts = value;
            }, get recurringJournals() {
                return DB.data.recurringJournals;
            }, set recurringJournals(value) {
                DB.data.recurringJournals = value;
            }
        }, persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        }, accounting: {
            post: input => Accounting.post(input), reverse: (type, id, reason) => Accounting.reverse(type, id, reason)
        }, dateAddMonthsClamped
    };
}
function composeLegacyTransferDeps(): TransferWorkflowDeps {
    return {
        transactions: {
            atomic: (label, work, options) => DB.atomic(label, work, options), atomicAsync: (label, work, options) => DB.atomicAsync(label, work, options), fastAtomic: (label, work, options) => DB.fastAtomic(label, work, options)
        }, clock: composeBusinessClock(), repository: {
            get treasuries() {
                return DB.data.treasuries;
            }, get transfers() {
                return DB.data.transfers;
            }, get documents() {
                return DB.data.documents;
            }, baseCurrency: () => DB.data.settings.baseCurrency
        }, money: {
            ...composeBusinessMoney(), convert: (amount, from, to, date) => Currency.convert(amount, from, to, date)
        }, accounting: {
            post: input => Accounting.post(input), reverse: (type, id, reason) => Accounting.reverse(type, id, reason), documentStatus: (type, id, status) => Accounting.documentStatus(type, id, status), validateTreasury: (id, amount) => Accounting.validateTreasury(id, amount), ensureTreasuryAccount: treasury => Accounting.ensureTreasuryAccount(treasury)
        }
    };
}
function composeLegacyIntegrityDeps(accounting: {
    integrityReport(): IntegrityReportResult;
    audit(): {
        fixable?: boolean;
        code: string;
        treasuryId?: string;
    }[];
    ensureTreasuryAccount(treasury: BusinessTreasury): unknown;
}): IntegrityWorkflowDeps {
    return {
        report: () => accounting.integrityReport(), issues: () => accounting.audit(), treasury: id => byId(DB.data.treasuries, id), ensureTreasury: treasury => accounting.ensureTreasuryAccount(treasury), save: () => DB.save(), completed: report => {
            UI.renderCurrent();
            toast(report.ok ? 'اكتمل الفحص: لا توجد أخطاء حرجة' : 'اكتمل الفحص وظهرت نقاط تحتاج مراجعة', report.ok ? 'success' : 'warning');
        }, repaired: () => {
            toast('تم تنفيذ الإصلاحات الآمنة فقط');
        }
    };
}
function composeLegacyUmrahLifecycleDeps(operations: UmrahLifecycleDeps['operations'] & {
    program(id: string): UmrahLifecycleProgram | undefined;
    booking(id: string): UmrahLifecycleBooking | undefined;
}): UmrahLifecycleDeps {
    return {
        transactions: {
            atomic: (label, work, options) => UmrahCore_DB.atomic(label, work, options)
        }, authorization: {
            require: (page, action) => UmrahCore_Bridge.require(page, action)
        }, repository: {
            program: id => operations.program(id), booking: id => operations.booking(id), bookings: () => UmrahCore_DB.data.bookings
        }, operations: {
            assertProgramOpenReady: id => operations.assertProgramOpenReady(id), blockers: id => operations.blockers(id), financialSetupGaps: id => operations.financialSetupGaps(id), get resourceBookingStatuses() {
                return operations.resourceBookingStatuses;
            }, bookingReadiness: booking => operations.bookingReadiness(booking)
        }, procurement: {
            cancelProgramCommitments: (id, reason) => UmrahCore_Procurement.cancelProgramCommitments(id, reason), onProgramOpen: program => UmrahCore_Procurement.onProgramOpen(program), onProgramTraveling: program => UmrahCore_Procurement.onProgramTraveling(program), onProgramReturned: program => UmrahCore_Procurement.onProgramReturned(program)
        }, releaseProgram: id => UmrahCore_ContractCenter.releaseProgram(id), clock: {
            today: UmrahCore_today, now: UmrahCore_now
        }, programLabel: UmrahCore_programLabel, audit: (action, type, id, detail) => UmrahCore_Bridge.audit(action, type, id, detail)
    };
}
function composeLegacyNettingDeps(queries: NettingWorkflowDeps['queries'] & {
    ensureData(): {
        partyNettings: NettingRecord[];
    };
}): NettingWorkflowDeps {
    return {
        authorization: {
            require: (page, action) => Auth.require(page, action)
        }, actor: () => Auth.user, clock: composeBusinessClock(), money: composeBusinessMoney(), transactions: {
            atomic: (label, work, options) => DB.atomic(label, work, options), atomicAsync: (label, work, options) => DB.atomicAsync(label, work, options), fastAtomic: (label, work, options) => DB.fastAtomic(label, work, options)
        }, repository: {
            nettings: () => queries.ensureData().partyNettings, documents: () => DB.data.documents
        }, queries: {
            groupFor: (type, id) => queries.groupFor(type, id), allRoleEntries: group => queries.allRoleEntries(group), componentAvailable: (component, date) => queries.componentAvailable(component, date), allocateInvoices: (component, amount) => queries.allocateInvoices(component, amount), refreshNettingInvoices: record => queries.refreshNettingInvoices(record)
        }, accounting: {
            post: input => Accounting.post(input), reverse: (type, id, reason) => Accounting.reverse(type, id, reason), documentStatus: (type, id, status) => Accounting.documentStatus(type, id, status)
        }, persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        }
    };
}
function composeLegacyPartyNames(): PartyNameRepository {
    return {
        get customers() {
            return DB.data.customers;
        }, get suppliers() {
            return DB.data.suppliers;
        }, get agents() {
            return DB.data.agents;
        }
    };
}
// Live ports for the master-data form definitions (read and write); nothing is cached.
function composeFormDefinitionDeps():FormDefinitionDeps {
 return {
  repository:{treasuries:()=>DB.data.treasuries,customers:()=>DB.data.customers,suppliers:()=>DB.data.suppliers,agents:()=>DB.data.agents,programs:()=>DB.data.programs,umrahPrograms:()=>DB.data.umrahPrograms,costCenters:()=>DB.data.costCenters,accounts:()=>DB.data.accounts,users:()=>DB.data.users,branches:()=>DB.data.branches,leads:()=>DB.data.leads,followups:()=>DB.data.followups,invoices:()=>DB.data.invoices,travelers:()=>DB.data.travelers,expenses:()=>DB.data.expenses,taxCodes:()=>DB.data.taxCodes,serviceTypes:()=>DB.data.serviceTypes,bookings:()=>DB.data.bookings,services:()=>DB.data.services,commissions:()=>DB.data.commissions,manualJournalDrafts:()=>DB.data.manualJournalDrafts,roomAllocations:()=>DB.data.roomAllocations,purchaseOrders:()=>DB.data.purchaseOrders,quotations:()=>DB.data.quotations},
  settings:{baseCurrency:()=>DB.data.settings.baseCurrency,passwordMin:()=>DB.data.settings.passwordMin},
  persistence:{log:(action,type,id,detail)=>DB.log(action,type,id,detail),save:()=>DB.save()},
  transactions:{atomic:(label,work,options)=>DB.atomic(label,work,options)},
  authorization:{require:(page,action)=>AccessControl.require(page,action)},
  domain:{addBooking:o=>Transactions.addBooking(o),updateBooking:(id,o)=>Transactions.updateBooking(id,o),addService:o=>Transactions.addService(o),updateService:(id,o,options)=>Transactions.updateService(id,o,options),createJournalDraft:o=>ManualJournal.createDraft(o),updateJournalDraft:(id,o)=>ManualJournal.updateDraft(id,o),addRecurringJournal:o=>ManualJournal.addRecurring(o),postJournalDraft:id=>ManualJournal.postDraft(id)},
  clock:{id:()=>iid(),nextCostCenterNo:()=>Numbering.next('costCenter')},
  branch:{currentId:()=>BranchScope.currentId()},
  security:{validateUserAdd:()=>License.validateUserAdd(),permissionsFor:role=>deep(RolePermissions[role]||{}),setPassword:(user,password)=>Security.setPassword(user,password)},
  actor:{user:()=>AccessControl.currentUser()}
 };
}

function composeReportSettingsDeps():ReportSettingsDeps {
 return {
  repository:{customers:()=>DB.data.customers,suppliers:()=>DB.data.suppliers,agents:()=>DB.data.agents,accounts:()=>DB.data.accounts,documents:()=>DB.data.documents,journals:()=>DB.data.journals,periods:()=>DB.data.periods,currencies:()=>DB.data.currencies,company:()=>DB.data.company,settings:()=>DB.data.settings,ensureNotificationPrefs:()=>DB.data.notificationPrefs||(DB.data.notificationPrefs={})},
  calendar:{reset:()=>{DB.data.fiscalYears=[];DB.data.periods=[]},ensureDate:date=>Periods.ensureDate(date)},
  clock:{today:()=>today()},
  numbers:{N:value=>N(value)},
  persistence:{save:()=>DB.save(),importBackup:file=>DB.import(file)},
  authorization:{require:(page,action)=>AccessControl.require(page,action)}
 };
}

function composeMasterActionsDeps():MasterActionsDeps {
 return {
  repository:{customers:()=>DB.data.customers,suppliers:()=>DB.data.suppliers,agents:()=>DB.data.agents,services:()=>DB.data.services,commissions:()=>DB.data.commissions,serviceTypes:()=>DB.data.serviceTypes,settings:()=>DB.data.settings,setServiceTypes:value=>{DB.data.serviceTypes=value}},
  defaults:{workspaces:()=>deep(Seed.settings.workspaces)},
  masterData:{toggle:(list,id)=>MasterData.toggle(list,id),remove:(method,id)=>(MasterData as any)[method](id)},
  persistence:{log:(action,type,id,detail)=>DB.log(action,type,id,detail),save:()=>DB.save()},
  transactions:{atomic:(label,work,options)=>DB.atomic(label,work,options)},
  authorization:{require:(page,action)=>AccessControl.require(page,action)},
  clock:{id:()=>iid()},
  numbers:{N:value=>N(value),EPS}
 };
}

function composeCleanPageDeps():CleanPageDeps {
 return {
  repository:{leads:()=>DB.data.leads,followups:()=>DB.data.followups,quotations:()=>DB.data.quotations,customers:()=>DB.data.customers,suppliers:()=>DB.data.suppliers,agents:()=>DB.data.agents,commissions:()=>DB.data.commissions,invoices:()=>DB.data.invoices,purchaseOrders:()=>DB.data.purchaseOrders,expenses:()=>DB.data.expenses,treasuries:()=>DB.data.treasuries,transfers:()=>DB.data.transfers,bankReconciliations:()=>DB.data.bankReconciliations,vouchers:page=>DB.data[page]},
  settings:{baseCurrency:()=>DB.data.settings.baseCurrency}
 };
}

function composeParty360Deps():Party360Deps {
 return {
  repository:{root:()=>DB.data,collection:name=>DB.data[name],updatedAt:()=>DB.data?.meta?.updatedAt,baseCurrency:()=>DB.data.settings.baseCurrency,auditLog:()=>DB.data.auditLog,setAuditLog:value=>{DB.data.auditLog=value}},
  persistence:{save:force=>DB.save(force)},
  transactions:{atomicAsync:(label,work,options)=>DB.atomicAsync(label,work,options)}
 };
}

function composeAdvancedActionsDeps():AdvancedActionsDeps {
 return {
  repository:{collection:name=>DB.data[name]},
  ledger:{reverseSettlement:(kind,id,reason)=>AdvancedAccounting.reverseSettlement(kind,id,reason),recognizeDeferredPart:(id,partId)=>AdvancedAccounting.recognizeDeferredPart(id,partId),reverseDeferredPart:(id,partId,reason)=>AdvancedAccounting.reverseDeferredPart(id,partId,reason),recognizeDeferredCostPart:(id,partId)=>AdvancedAccounting.recognizeDeferredCostPart(id,partId),reverseDeferredCostPart:(id,partId,reason)=>AdvancedAccounting.reverseDeferredCostPart(id,partId,reason),reconcileBankLines:treasuryId=>AdvancedAccounting.reconcileBankLines(treasuryId)},
  transactions:{atomic:(label,work,options)=>DB.atomic(label,work,options),atomicAsync:(label,work,options)=>DB.atomicAsync(label,work,options)}
 };
}

function composeAccountingPageDeps():AccountingPageDeps {
 return {
  repository:{collection:name=>DB.data[name]},
  settings:{baseCurrency:()=>DB.data.settings.baseCurrency}
 };
}

function composeOperationsPageDeps():OperationsPageDeps {
 return {
  repository:{collection:name=>DB.data[name]},
  settings:{baseCurrency:()=>DB.data.settings.baseCurrency}
 };
}

function composeAdvancedPageDeps():AdvancedPageDeps {
 return {
  repository:{collection:name=>DB.data[name]}
 };
}

function composeCommercialPageDeps():CommercialPageDeps {
 return {
  repository:{root:()=>DB.data,collection:name=>DB.data[name]},
  settings:{baseCurrency:()=>DB.data.settings.baseCurrency}
 };
}

function composeLegacyPhonePolicy(phone: string): string {
    return PartyBusinessRules.normalizePhone(phone, DB.data.settings.whatsappCountryCode);
}
function composeLegacyExpenseDeps(operations: {
    buildPrepaidSchedule(expense: ExpenseRecord): unknown;
}): ExpenseWorkflowDeps {
    return {
        clock: composeBusinessClock(), actor: () => Auth.user, transactions: {
            atomic: (label, work, options) => DB.atomic(label, work, options), atomicAsync: (label, work, options) => DB.atomicAsync(label, work, options), fastAtomic: (label, work, options) => DB.fastAtomic(label, work, options)
        }, money: composeBusinessMoney(), repository: {
            baseCurrency: () => DB.data.settings.baseCurrency, approvalPayments: () => DB.data.settings.approvalPayments, get expenses() {
                return DB.data.expenses;
            }, set expenses(value) {
                DB.data.expenses = value;
            }, get approvals() {
                return DB.data.approvals;
            }, get invoices() {
                return DB.data.invoices;
            }, get prepaidSchedules() {
                return DB.data.prepaidSchedules;
            }, get documents() {
                return DB.data.documents;
            }
        }, tax: {
            amount: (amount, id) => Tax.amount(amount, id), require: id => Tax.require(id)
        }, approval: {
            create: (type, payload, amount) => Approvals.create(type, payload, amount)
        }, vouchers: {
            addPayment: (fields, options) => Transactions.addPayment(fields, options), voidPayment: (id, reason) => Transactions.voidPayment(id, reason)
        }, invoices: {
            create: fields => Invoices.create(fields), post: invoice => Invoices.post(invoice), allocations: id => Invoices.allocations(id), cancel: (id, reason) => Invoices.cancel(id, reason)
        }, accounting: {
            post: input => Accounting.post(input), reverse: (type, id, reason) => Accounting.reverse(type, id, reason), documentStatus: (type, id, status) => Accounting.documentStatus(type, id, status)
        }, persistence: {
            log: (action, type, id, detail) => DB.log(action, type, id, detail), save: render => DB.save(render)
        }, buildPrepaidSchedule: expense => operations.buildPrepaidSchedule(expense)
    };
}

function composeAuthEntryPresentation(): AuthEntryPresentationDeps {
    return {
        dom: BrowserPlatform.dom, initialize: () => UI.init(), escape: value => esc(value),
        failed: error => console.error('[auth] UI.init failed after successful authentication', error),
        before: () => { if (CommercialUX.dirtyForm) CommercialUX.dirtyForm.dataset.clean = '1'; CommercialUX.dirtyForm = null; },
        after: () => { CommercialUX.ensureSaveIndicator(); CommercialUX.enhance(document); CommercialUX.maybeOnboard(); }
    };
}
function composeContactPresentation(): ContactPresentationDeps {
    return { dom: BrowserPlatform.dom, bridge: BrowserPlatform.contacts, notification: { notify: (message, kind) => toast(message, kind) } };
}
function composeParty360Presentation(queries: Pick<typeof Party360, 'base' | 'shell' | 'loadTab'>) {
    return createParty360Presentation({
        dom: BrowserPlatform.dom, icon: name => icon(name), close: () => UI.closeModal(true),
        base: (type, id) => queries.base(type, id), shell: (type, id) => queries.shell(type, id),
        loadTab: (type, id, tab) => queries.loadTab(type, id, tab)
    });
}
function composeUnifiedPartyPresentation(operations: Pick<typeof UnifiedParty, 'linkCandidates' | 'roleLabel' | 'nettingPairs' | 'linkRole' | 'postNetting' | 'reverseNetting' | 'ensureData' | 'roleConfig'>) {
    return createUnifiedPartyPresentation({
        dom: BrowserPlatform.dom, scheduler: BrowserPlatform.scheduler,
        close: () => UI.closeModal(true), icon: name => icon(name), notify: (message, kind) => toast(message, kind),
        reopen: (type, id) => Party360.open(type, id), child: work => Party360.child(work),
        confirm: (title, message, work, options) => UI.confirmAction(title, message, work, options),
        escape: value => esc(value), money: (value, currency) => money(value, currency), today,
        roleIcon: type => operations.roleConfig[type]?.label === 'مورد' ? 'suppliers' : type === 'agent' ? 'agents' : 'customers',
        roleLabel: type => operations.roleLabel(type), linkCandidates: (type, id, target) => operations.linkCandidates(type, id, target),
        linkRole: (type, id, target, targetId) => operations.linkRole(type, id, target, targetId),
        nettingPairs: (type, id) => operations.nettingPairs(type, id),
        postNetting: (type, id, fields) => operations.postNetting(type, id, fields),
        reverseNetting: (id, reason) => operations.reverseNetting(id, reason),
        netting: id => byId(operations.ensureData().partyNettings, id)
    });
}

function composePrintPresentation(): DocumentPrintPresentationDeps {
    return { frame: BrowserPlatform.documents.frame, scheduler: BrowserPlatform.scheduler };
}

function composeUmrahPresentationCommands(): UmrahPresentationCommands {
    return { openPage: page => UI.openPage(page), openForm: (type, context) => Forms.open(type, context), openPartyActions: (type, id) => Actions.openPartyActions(type, id) };
}
export { composeAccountingPageDeps, composeCommercialPageDeps, composeAdvancedPageDeps, composeAdvancedActionsDeps, composeAuthEntryPresentation, composeBusinessClock, composeBusinessMoney, composeCleanPageDeps, composeContactPresentation, composeFormDefinitionDeps, composeLegacyActionDeps, composeLegacyApprovalDeps, composeLegacyBranchAccess, composeLegacyBranchDeps, composeLegacyCommercialDeps, composeLegacyCommercialPermissions, composeLegacyCrmDeps, composeLegacyExpenseDeps, composeLegacyFinancialQueries, composeLegacyIntegrityDeps, composeLegacyInvoiceDeps, composeLegacyInvoiceRules, composeLegacyJournalRules, composeLegacyManualJournalDeps, composeLegacyNettingDeps, composeLegacyPartyNames, composeLegacyPhonePolicy, composeLegacyTourismDeps, composeLegacyTransferDeps, composeLegacyUmrahLifecycleDeps, composeLegacyVoucherDeps, composeMasterActionsDeps, composeOperationsPageDeps, composeParty360Deps, composeParty360Presentation, composePrintPresentation, composeReportSettingsDeps, composeUmrahPresentationCommands, composeUnifiedPartyPresentation };
