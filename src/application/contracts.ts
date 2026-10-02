// Explicit contracts for the existing action boundary; no alternate state store.
interface ActionAuthorizationPort { require(page:string,action:string):unknown; }
interface ActionTransactionOptions {save?:boolean;render?:boolean;strict?:boolean;waitForSave?:boolean;rollback?:boolean;}
interface ActionTransactionPort {
 atomic<T>(label:string,work:()=>T,options?:ActionTransactionOptions):T;
 atomicAsync<T>(label:string,work:()=>T|Promise<T>,options?:ActionTransactionOptions):Promise<T>;
 fastAtomic<T>(label:string,work:()=>T,options?:ActionTransactionOptions):T;
}
interface ActionPersistencePort { save(render?:boolean):unknown; log(action:string,type:string,id:string,detail:string):unknown; }
type ApplicationFields=Record<string,unknown>;
interface WorkflowInvoice { id:string;kind:string;partyId:string;externalNo?:unknown;status:string;active?:boolean; }
interface WorkflowQuotation {id:string;no:string;status:string;validUntil?:string;sentAt?:string;}
interface WorkflowPurchaseOrder {id:string;lines?:{id:string}[];}
interface InvoiceDraftFields extends ApplicationFields {kind:string;partyId:string;partyType:string;externalNo:unknown;}
interface DocumentRepositoryPort {
 invoices():WorkflowInvoice[];
 invoice(id:string):WorkflowInvoice|undefined;
 quotation(id:string):WorkflowQuotation|undefined;
 purchaseOrder(id:string):WorkflowPurchaseOrder|undefined;
}
interface DocumentDomainPort {
 createInvoice(fields:ApplicationFields):WorkflowInvoice;
 postInvoice(invoice:WorkflowInvoice|undefined):unknown;
 addReceipt(fields:ApplicationFields):unknown;
 addPayment(fields:ApplicationFields):unknown;
 addQuotation(fields:ApplicationFields):unknown;
 updateQuotation(id:string,fields:ApplicationFields):unknown;
 addPurchaseOrder(fields:ApplicationFields):unknown;
 updatePurchaseOrder(id:string,fields:ApplicationFields):unknown;
 receivePurchaseOrder(id:string,quantities:Record<string,number>):unknown;
 voidPurchaseOrder(id:string,reason:string):unknown;
 removePurchaseOrder(id:string):unknown;
}
interface ActionClockPort {today():string;now():string;formatDate(value:string):string;}
interface DocumentOperationPort {
 removeProgram(id:string):unknown;
 confirmBooking(id:string):unknown;
 completeBooking(id:string):unknown;
 reopenBooking(id:string,reason:string):unknown;
 cancelBooking(id:string,reason:string):unknown;
 confirmService(id:string):unknown;
 completeService(id:string):unknown;
 reopenService(id:string,reason:string):unknown;
 cancelService(id:string,reason:string):unknown;
 deleteService(id:string):unknown;
 voidReceipt(id:string,reason:string):unknown;
 voidPayment(id:string,reason:string):unknown;
 reverseInvoiceAdjustment(id:string,reason:string):unknown;
 cancelInvoice(id:string,reason:string):unknown;
 deleteExpense(id:string):unknown;
 voidExpense(id:string,reason:string):unknown;
 recognizePrepaid(id:string):unknown;
 reversePrepaid(id:string,reason:string):unknown;
 approveCommission(id:string):unknown;
 rejectCommission(id:string,reason:string):unknown;
 reverseCommission(id:string,reason:string):unknown;
 toggleTreasury(id:string):unknown;
 removeTreasury(id:string):unknown;
 reverseTransfer(id:string,reason:string):unknown;
 bounceCheque(id:string,reason:string):unknown;
 toggleCurrency(id:string):unknown;
 removeCurrency(id:string):unknown;
 postManualJournal(id:string):unknown;
 removeManualJournal(id:string):unknown;
 reverseManualJournal(id:string,reason:string):unknown;
 runRecurringJournal(id:string):unknown;
 toggleRecurringJournal(id:string):unknown;
 removeRecurringJournal(id:string):unknown;
 toggleAccount(id:string):unknown;
 removeAccount(id:string):unknown;
 removeCostCenter(id:string):unknown;
 approveRequest(id:string):unknown;
 rejectRequest(id:string,reason:string):unknown;
 convertLead(id:string):unknown;
 removeLead(id:string):unknown;
 removeFollowup(id:string):unknown;
 acceptQuotation(id:string):unknown;
 convertQuotation(id:string):unknown;
 removeQuotation(id:string):unknown;
 approvePO(id:string):unknown;
 convertPO(id:string):unknown;
 toggleUser(id:string):unknown;
}
interface DocumentWorkflowDeps {
 authorization:ActionAuthorizationPort;
 transactions:ActionTransactionPort;
 persistence:ActionPersistencePort;
 repository:DocumentRepositoryPort;
 domain:DocumentDomainPort;
 operations:DocumentOperationPort;
 clock:ActionClockPort;
 text(value:unknown):string;
 isLive(value:WorkflowInvoice):boolean;
}
interface CommercialAuditEntry {date:string;}
interface CommercialBranch {id:string;active?:boolean;code?:string;name:string;phone?:string;address?:string;}
interface CommercialUser {id:string;name:string;role:string;allowedBranchIds?:string[];branchId?:string;}
interface CommercialWorkflowDeps {
 authorization:ActionAuthorizationPort;
 transactions:ActionTransactionPort;
 persistence:ActionPersistencePort;
 activity:{setRange(range:string):void;entries():CommercialAuditEntry[];replace(entries:CommercialAuditEntry[]):void;trimUmrah(range:string,cut:number):void;clearRemote(range:string):Promise<unknown>;warn(error:unknown):void;};
 branches:{find(id:string):CommercialBranch|undefined;all():CommercialBranch[];create(fields:ApplicationFields):unknown;update(id:string,fields:ApplicationFields):unknown;};
 users:{find(id:string):CommercialUser|undefined;};
 audit:{read():Promise<{items?:ServerAuditEntry[]}>;userName(id:string):string|undefined;};
 nowMillis():number;
}

interface ServerAuditEntry {created_at:string;user_id?:string;action:string;ip_address?:string;user_agent?:string;changes?:unknown;}
interface ServerAuditPresentationEntry extends ServerAuditEntry {userName:string;}
