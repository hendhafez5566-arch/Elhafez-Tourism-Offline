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
function composeLegacyPurchaseFulfillment() {
    return createPurchaseFulfillmentRules({
        id: iid, now
    }, (action, type, id, detail) => DB.log(action, type, id, detail));
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

function composeStorePresentation(): StorePresentationEffects {
    return {
        canRender: () => typeof UI !== 'undefined' && !!UI?.renderCurrent,
        render: () => UI.renderCurrent(), notify: (message, kind) => toast(message, kind),
        schedule: work => BrowserPlatform.renderFrame(work)
    };
}
function composeSessionPresentation(): SessionPresentationEffects {
    return {
        clear: key => BrowserPlatform.clearSession(key),
        expired: message => { if (typeof Auth !== 'undefined') Auth.expirePresentation(); if (typeof toast === 'function') toast(message, 'error'); }
    };
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
