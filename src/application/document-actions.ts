const DocumentWorkflows={
 prepareRemoveProgram(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('programs','delete');
  return ()=>deps.transactions.atomic('removeProgram',()=>deps.operations.removeProgram(id));
 },
 prepareConfirmBooking(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('bookings','edit');
  return ()=>deps.transactions.atomic('confirmBooking',()=>deps.operations.confirmBooking(id));
 },
 prepareCompleteBooking(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('bookings','edit');
  return ()=>deps.transactions.atomic('completeBooking',()=>deps.operations.completeBooking(id));
 },
 prepareReopenBooking(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('bookings','approve');
  return (reason:string)=>deps.transactions.atomic('reopenBooking',()=>deps.operations.reopenBooking(id,reason));
 },
 prepareCancelBooking(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('bookings','void');
  return (reason:string)=>deps.transactions.atomic('cancelBooking',()=>deps.operations.cancelBooking(id,reason));
 },
 prepareConfirmService(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('services','approve');
  return ()=>deps.transactions.atomic('confirmService',()=>deps.operations.confirmService(id));
 },
 prepareCompleteService(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('services','edit');
  return ()=>deps.transactions.atomic('completeService',()=>deps.operations.completeService(id));
 },
 prepareReopenService(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('services','approve');
  return (reason:string)=>deps.transactions.atomic('reopenService',()=>deps.operations.reopenService(id,reason));
 },
 prepareCancelService(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('services','void');
  return (reason:string)=>deps.transactions.atomic('cancelService',()=>deps.operations.cancelService(id,reason));
 },
 prepareDeleteService(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('services','delete');
  return ()=>deps.transactions.atomic('deleteService',()=>deps.operations.deleteService(id));
 },
 prepareVoidReceipt(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('receipts','void');
  return (reason:string)=>deps.transactions.atomic('voidReceipt',()=>deps.operations.voidReceipt(id,reason));
 },
 prepareVoidPayment(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('payments','void');
  return (reason:string)=>deps.transactions.atomic('voidPayment',()=>deps.operations.voidPayment(id,reason));
 },
 prepareReverseInvoiceAdjustment(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('invoices','void');
  return (reason:string)=>deps.transactions.atomic('reverseInvoiceAdjustment',()=>deps.operations.reverseInvoiceAdjustment(id,reason));
 },
 prepareCancelInvoice(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('invoices','void');
  return (reason:string)=>deps.transactions.atomic('cancelInvoice',()=>deps.operations.cancelInvoice(id,reason));
 },
 prepareDeleteExpense(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('expenses','delete');
  return ()=>deps.transactions.atomic('deleteExpense',()=>deps.operations.deleteExpense(id));
 },
 prepareVoidExpense(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('expenses','void');
  return (reason:string)=>deps.transactions.atomic('voidExpense',()=>deps.operations.voidExpense(id,reason));
 },
 prepareRecognizePrepaid(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('expenses','edit');
  return ()=>deps.transactions.atomic('prepaid',()=>deps.operations.recognizePrepaid(id));
 },
 prepareReversePrepaid(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('expenses','void');
  return (reason:string)=>deps.transactions.atomic('reversePrepaid',()=>deps.operations.reversePrepaid(id,reason));
 },
 prepareApproveCommission(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('agents','approve');
  return ()=>deps.transactions.atomic('approveCommission',()=>deps.operations.approveCommission(id));
 },
 prepareRejectCommission(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('agents','approve');
  return (reason:string)=>deps.transactions.atomic('rejectCommission',()=>deps.operations.rejectCommission(id,reason));
 },
 prepareReverseCommission(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('agents','void');
  return (reason:string)=>deps.transactions.atomic('reverseCommission',()=>deps.operations.reverseCommission(id,reason));
 },
 prepareToggleTreasury(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('treasury','edit');
  return ()=>deps.transactions.atomic('toggleTreasury',()=>deps.operations.toggleTreasury(id));
 },
 prepareRemoveTreasury(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('treasury','delete');
  return ()=>deps.transactions.atomic('removeTreasury',()=>deps.operations.removeTreasury(id));
 },
 prepareReverseTransfer(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('treasury','void');
  return (reason:string)=>deps.transactions.atomic('reverseTransfer',()=>deps.operations.reverseTransfer(id,reason));
 },
 prepareBounceCheque(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('treasury','approve');
  return (reason:string)=>deps.transactions.atomic('bounceCheque',()=>deps.operations.bounceCheque(id,reason));
 },
 prepareToggleCurrency(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('currencies','edit');
  return ()=>deps.transactions.atomic('toggleCurrency',()=>deps.operations.toggleCurrency(id));
 },
 prepareRemoveCurrency(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('currencies','delete');
  return ()=>deps.transactions.atomic('removeCurrency',()=>deps.operations.removeCurrency(id));
 },
 preparePostManualJournal(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('journal','approve');
  return ()=>deps.transactions.atomic('postManualJournal',()=>deps.operations.postManualJournal(id));
 },
 prepareRemoveManualJournal(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('journal','delete');
  return ()=>deps.transactions.atomic('removeManualJournal',()=>deps.operations.removeManualJournal(id));
 },
 prepareReverseManualJournal(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('journal','void');
  return (reason:string)=>deps.transactions.atomic('reverseManualJournal',()=>deps.operations.reverseManualJournal(id,reason));
 },
 prepareRunRecurringJournal(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('journal','edit');
  return ()=>deps.transactions.atomic('runRecurringJournal',()=>deps.operations.runRecurringJournal(id));
 },
 prepareToggleRecurringJournal(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('journal','edit');
  return ()=>deps.transactions.atomic('toggleRecurringJournal',()=>deps.operations.toggleRecurringJournal(id));
 },
 prepareRemoveRecurringJournal(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('journal','edit');
  return ()=>deps.transactions.atomic('removeRecurringJournal',()=>deps.operations.removeRecurringJournal(id));
 },
 prepareToggleAccount(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('accounts','edit');
  return ()=>deps.transactions.atomic('toggleAccount',()=>deps.operations.toggleAccount(id));
 },
 prepareRemoveAccount(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('accounts','delete');
  return ()=>deps.transactions.atomic('removeAccount',()=>deps.operations.removeAccount(id));
 },
 prepareRemoveCostCenter(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('costcenters','delete');
  return ()=>deps.transactions.atomic('removeCC',()=>deps.operations.removeCostCenter(id));
 },
 prepareApproveRequest(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('approvals','approve');
  return ()=>deps.transactions.atomic('approveRequest',()=>deps.operations.approveRequest(id));
 },
 prepareRejectRequest(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('approvals','approve');
  return (reason:string)=>deps.transactions.atomic('rejectRequest',()=>deps.operations.rejectRequest(id,reason));
 },
 prepareConvertLead(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('crm','edit');
  return ()=>deps.transactions.atomic('convertLead',()=>deps.operations.convertLead(id));
 },
 prepareRemoveLead(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('crm','delete');
  return ()=>deps.transactions.atomic('removeLead',()=>deps.operations.removeLead(id));
 },
 prepareRemoveFollowup(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('crm','delete');
  return ()=>deps.transactions.atomic('removeFollowup',()=>deps.operations.removeFollowup(id));
 },
 prepareAcceptQuotation(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('quotations','approve');
  return ()=>deps.transactions.atomic('acceptQuotation',()=>deps.operations.acceptQuotation(id));
 },
 prepareConvertQuotation(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('quotations','approve');
  return ()=>deps.transactions.atomic('convertQuotation',()=>deps.operations.convertQuotation(id));
 },
 prepareRemoveQuotation(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('quotations','delete');
  return ()=>deps.transactions.atomic('removeQuotation',()=>deps.operations.removeQuotation(id));
 },
 prepareApprovePO(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('purchaseorders','approve');
  return ()=>deps.transactions.atomic('approvePO',()=>deps.operations.approvePO(id));
 },
 prepareConvertPO(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('purchaseorders','approve');
  return ()=>deps.transactions.atomic('convertPO',()=>deps.operations.convertPO(id));
 },
 prepareToggleUser(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('users','edit');
  return ()=>deps.transactions.atomic('toggleUser',()=>deps.operations.toggleUser(id));
 },
 preparePostInvoice(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('invoices','edit');
  return ()=>deps.transactions.atomic('postInvoice',()=>deps.domain.postInvoice(deps.repository.invoice(id)));
 },
 sendQuotation(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('quotations','edit');
  const q=deps.repository.quotation(id);
  if(!q||q.status!=='draft')throw new Error('العرض غير متاح');
  if(q.validUntil&&q.validUntil<deps.clock.today())throw new Error(`انتهت صلاحية العرض في ${deps.clock.formatDate(q.validUntil)}؛ عدّل الصلاحية قبل الإرسال`);
  q.status='sent';q.sentAt=deps.clock.now();
  deps.persistence.log('send','quotation',q.id,`إرسال ${q.no}`);
  deps.persistence.save();
 },
 prepareReceivePurchaseOrder(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('purchaseorders','edit');
  const order=deps.repository.purchaseOrder(id);
  if(!order)throw new Error('أمر الشراء غير موجود');
  return {order,execute:(quantities:Record<string,number>)=>deps.transactions.atomicAsync('receivePOLines',()=>deps.domain.receivePurchaseOrder(id,quantities),{save:true,render:true,strict:true,waitForSave:true,rollback:true})};
 },
 prepareVoidPurchaseOrder(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('purchaseorders','delete');
  if(!deps.repository.purchaseOrder(id))throw new Error('أمر الشراء غير موجود');
  return (reason:string)=>deps.transactions.atomicAsync('voidPO',()=>deps.domain.voidPurchaseOrder(id,reason),{save:true,render:true,strict:true,waitForSave:true,rollback:true});
 },
 prepareRemovePurchaseOrder(deps:DocumentWorkflowDeps,id:string){
  deps.authorization.require('purchaseorders','delete');
  return ()=>deps.transactions.atomicAsync('removePO',()=>deps.domain.removePurchaseOrder(id),{save:true,render:true,strict:true,waitForSave:true,rollback:true});
 },
 prepareInvoiceSave(deps:DocumentWorkflowDeps,edit:WorkflowInvoice|null){
  deps.authorization.require('invoices',edit?'edit':'add');
  return (fields:InvoiceDraftFields,posted:boolean)=>{
   if(fields.kind==='supplier'){
    const external=deps.text(fields.externalNo).trim();
    if(deps.repository.invoices().some(x=>x.id!==edit?.id&&x.kind==='supplier'&&x.partyId===fields.partyId&&deps.text(x.externalNo).toLowerCase()===external.toLowerCase()&&deps.isLive(x)))throw new Error('رقم فاتورة المورد مكرر');
   }
   deps.transactions.atomic('invoiceForm',()=>{
    let invoice=edit;
    if(!invoice)invoice=deps.domain.createInvoice({...fields,status:'draft',description:'فاتورة مستقلة'});
    else {const {kind,...updates}=fields;Object.assign(invoice,updates);}
    if(posted)deps.domain.postInvoice(invoice);
   },{save:false});
   // Presentation closes the modal before the existing persistence trigger.
   return {persist:()=>deps.persistence.save()};
  };
 },
 prepareCommercialDocumentSave(deps:DocumentWorkflowDeps,isPurchaseOrder:boolean,editId:string|undefined){
  deps.authorization.require(isPurchaseOrder?'purchaseorders':'quotations',editId?'edit':'add');
  return (fields:ApplicationFields)=>{
   if(isPurchaseOrder){if(editId)deps.domain.updatePurchaseOrder(editId,fields);else deps.domain.addPurchaseOrder(fields);}
   else {if(editId)deps.domain.updateQuotation(editId,fields);else deps.domain.addQuotation(fields);}
   return {persist:()=>deps.persistence.save()};
  };
 },
 prepareFormSubmission(deps:DocumentWorkflowDeps,type:string,page:string,action:string,asyncSubmit:boolean){
  deps.authorization.require(page,action);
  const strictTypes=new Set(['receipt','payment','expense','commissionPay','transfer','cashCount','bankReconcile','invoiceAdjust','supplierCancellation','customerWriteOff','customerCancellation','revenueDeferral','costDeferral','accruedRevenue','fixedAsset','loan','provision','doubtfulAllowance','allowanceWriteOff','payroll','openingBalance','budget','bankStatement','changePassword','user']);
  return (submit:()=>unknown|Promise<unknown>)=>{
   if(asyncSubmit||strictTypes.has(type))return deps.transactions.atomicAsync(type,async()=>{if(asyncSubmit)await submit();else submit();},{save:true,strict:true});
   else deps.transactions.fastAtomic(type,submit,{save:true,render:true});
  };
 },
 createReceipt(deps:DocumentWorkflowDeps,fields:ApplicationFields){
  const [partyType,partyId]=deps.text(fields.partyRef).split('|');
  deps.domain.addReceipt({...fields,partyType,partyId});
 },
 createPayment(deps:DocumentWorkflowDeps,fields:ApplicationFields,context:ApplicationFields){
  const [partyType,partyId]=deps.text(fields.partyRef).split('|');
  deps.domain.addPayment({...fields,partyType,partyId,forceSupplierAdvance:context.forceSupplierAdvance===true,sourceType:context.sourceType||'',sourceId:context.sourceId||'',sourceScheduleId:context.sourceScheduleId||'',sourceLabel:context.sourceLabel||''});
 }
};
