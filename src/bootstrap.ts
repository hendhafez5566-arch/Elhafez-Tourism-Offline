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
  if(remoteRequired&&typeof navigator!=='undefined'&&navigator.onLine===false){
    showOfflineBoot();
    window.addEventListener('online',()=>location.reload(),{once:true});
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
    if(typeof requestIdleCallback==='function')requestIdleCallback(warm,{timeout:1800});else setTimeout(warm,900);
  }catch(e){console.debug('[perf] idle warmup unavailable',e)}

  // Vendor center discovery is optional and must never block login. Run it
  // only after Auth.init has had the opportunity to enter the ERP.
  try{Promise.resolve(VendorOwner.init()).catch(e=>console.error('[bootstrap] VendorOwner.init failed',e))}catch(e){console.error('[bootstrap] VendorOwner.init start failed',e)}
})();
