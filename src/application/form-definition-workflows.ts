import { BusinessValues } from '../core/business-values';
interface JournalLine { id?: string; description?: string; accountId?: FormDataEntryValue; debit?: string | number; credit?: string | number; currency?: FormDataEntryValue; costCenterId?: FormDataEntryValue }
interface Row {
    id: string; name?: string; no?: string; nameAr?: string; nameEn?: string; active?: boolean; type?: string; amount?: number; status?: string; posting?: boolean; control?: boolean; system?: boolean; currency?: string; bookingId?: string; partyId?: string; partyType?: string; kind?: string; revenueDeferred?: boolean; costDeferred?: boolean; username?: string; role?: string; approvalLimit?: number; maxDiscountPct?: number; viewCosts?: boolean; branchId?: string; allowedBranchIds?: string[]; budget?: number; description?: string; manager?: string; parentId?: string; nature?: string; mustChangePassword?: boolean; contractId?: string; lines?: JournalLine[]; permissions?: Record<string, unknown>;
    source?: string; service?: string; value?: string | number; result?: string; nextDate?: string; rate?: number; programType?: string; departureDate?: string; total?: number; inventorySource?: { contractId?: string }; billTo?: string; sale?: number; saleCurrency?: string; saleTaxId?: string; dueDate?: string; externalCost?: number; cost?: number; externalCostCurrency?: string; costCurrency?: string; costTaxId?: string; supplierDueDate?: string; billingStatus?: string; customerInvoiceId?: string; externalNo?: string; memo?: string;
    phone?: string; whatsapp?: string; email?: string; nationality?: string; birthDate?: string; gender?: string; nationalId?: string; passport?: string; passportIssue?: string; passportExpiry?: string; issuePlace?: string; taxNo?: string; creditLimit?: number; creditDays?: number; paymentTerms?: string; agentId?: string; address?: string; notes?: string; contactPerson?: string; bankName?: string; accountNo?: string; iban?: string; commissionMode?: string; commissionValue?: number; commissionCurrency?: string; note?: string; groupNo?: string; date?: string; endDate?: string; capacity?: number; singleRooms?: number; doubleRooms?: number; tripleRooms?: number; quadRooms?: number; priceQuad?: number; priceTriple?: number; priceDouble?: number; priceSingle?: number; childPrice?: number; makkahHotel?: string; makkahNights?: number; madinahHotel?: string; madinahNights?: number; airline?: string; outFlight?: string; returnFlight?: string; transport?: string; plannedCost?: number; plannedCostCurrency?: string; itinerary?: string; supplierNotes?: string; visaStatus?: string; roomType?: string; category?: string; mode?: string; expenseAccountId?: string; taxId?: string; treasuryId?: string; supplierId?: string; months?: number; costCenterId?: string; custodian?: string; branch?: string; minBalance?: number; customerId?: string; programId?: string; invoiceId?: string; persons?: number; paymentMethod?: string; recognitionDate?: string; referenceNo?: string; valueDate?: string; fundingMode?: string; inventoryMode?: string; leadId?: string; commissionId?: string; lineId?: string;
}
interface InvoiceRow extends Row { kind: string; partyId: string; status: string }
interface FormInput { id?: string; name?: string; description?: string; posting?: string; type?: string; nature?: string; parentId?: string; budget?: unknown; manager?: string; password?: string; confirmPassword?: string; username?: string; role?: string; approvalLimit?: unknown; maxDiscountPct?: unknown; viewCosts?: string | boolean; branchId?: string; [field: string]: unknown }
interface IdentifiedRow extends Row { id: string }
interface TransactionOptions { save?: boolean; render?: boolean; strict?: boolean; waitForSave?: boolean; rollback?: boolean }
interface FormDefinitionDeps {
    repository: {
        treasuries(): Row[]; customers(): Row[]; suppliers(): Row[]; agents(): Row[]; programs(): Row[]; umrahPrograms(): Row[] | undefined; costCenters(): Row[]; accounts(): Row[];
        users(): Row[]; branches(): Row[] | undefined; leads(): Row[]; followups(): Row[]; invoices(): InvoiceRow[]; travelers(): Row[]; expenses(): Row[];
        taxCodes(): Row[]; serviceTypes(): Row[]; bookings(): Row[]; services(): Row[]; commissions(): Row[]; manualJournalDrafts(): Row[]; roomAllocations(): Row[]; purchaseOrders(): Row[]; quotations(): Row[];
    };
    settings: { baseCurrency(): string; passwordMin(): number };
    persistence: { log(action: string, type: string, id: string, detail: string): void; save(): unknown };
    transactions: { atomic<T>(label: string, work: () => T, options?: TransactionOptions): T };
    authorization: { require(page: string, action: string): void };
    domain: {
        addBooking(o: FormInput): unknown; updateBooking(id: string, o: FormInput): unknown; addService(o: FormInput): unknown; updateService(id: string, o: FormInput, options: { financial: boolean }): unknown;
        createJournalDraft(o: Record<string, unknown>): IdentifiedRow; updateJournalDraft(id: string, o: Record<string, unknown>): IdentifiedRow; addRecurringJournal(o: Record<string, unknown>): unknown; postJournalDraft(id: string): unknown;
    };
    clock: { id(): string; nextCostCenterNo(): string };
    branch: { currentId(): string };
    security: { validateUserAdd(): void; permissionsFor(role: string): Record<string, unknown>; setPassword(user: object, password: string): Promise<unknown> };
    actor: { user(): { id?: string; mustChangePassword?: boolean } };
}
const active = (x: Row) => x.active !== false;
/* Read side of the master-data forms: every method returns ready data from the live stores (never a snapshot). */
const FormDefinitionQueries = {
    baseCurrency: (d: FormDefinitionDeps) => d.settings.baseCurrency(),
    passwordMin: (d: FormDefinitionDeps) => d.settings.passwordMin(),
    activeTreasuries: (d: FormDefinitionDeps) => d.repository.treasuries().filter(active),
    activeTreasuriesOfType: (d: FormDefinitionDeps, type: string) => d.repository.treasuries().filter(x => x.active !== false && x.type === type),
    activeCustomers: (d: FormDefinitionDeps) => d.repository.customers().filter(active),
    activeSuppliers: (d: FormDefinitionDeps) => d.repository.suppliers().filter(active),
    activeAgents: (d: FormDefinitionDeps) => d.repository.agents().filter(active),
    activeCostCenters: (d: FormDefinitionDeps) => d.repository.costCenters().filter(active),
    activeLeads: (d: FormDefinitionDeps) => d.repository.leads().filter(active),
    activeBranches: (d: FormDefinitionDeps) => (d.repository.branches() || []).filter(active),
    activePrograms: (d: FormDefinitionDeps) => [...d.repository.programs().filter(active), ...(d.repository.umrahPrograms() || []).filter(active)],
    allCustomers: (d: FormDefinitionDeps) => d.repository.customers(),
    allSuppliers: (d: FormDefinitionDeps) => d.repository.suppliers(),
    allAgents: (d: FormDefinitionDeps) => d.repository.agents(),
    accountsExcept: (d: FormDefinitionDeps, id: string | undefined) => d.repository.accounts().filter(x => x.id !== id),
    costCentersExcept: (d: FormDefinitionDeps, id: string | undefined) => d.repository.costCenters().filter(x => x.id !== id),
    customer: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.customers(), id),
    supplier: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.suppliers(), id),
    agent: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.agents(), id),
    program: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.umrahPrograms() || [], id) || BusinessValues.find(d.repository.programs(), id),
    treasury: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.treasuries(), id),
    costCenter: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.costCenters(), id),
    user: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.users(), id),
    traveler: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.travelers(), id),
    lead: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.leads(), id),
    followup: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.followups(), id),
    expense: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.expenses(), id),
    invoice: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.invoices(), id)!,
    activeStandardPrograms: (d: FormDefinitionDeps) => d.repository.programs().filter(active),
    activeUmrahPrograms: (d: FormDefinitionDeps) => (d.repository.umrahPrograms() || []).filter(active),
    activeTaxCodes: (d: FormDefinitionDeps) => d.repository.taxCodes().filter(active),
    taxCodesFor: (d: FormDefinitionDeps, kind: string) => d.repository.taxCodes().filter(x => x.active !== false && (x.type === 'both' || x.type === kind)),
    activeServiceTypes: (d: FormDefinitionDeps) => d.repository.serviceTypes().filter(active),
    postingAccounts: (d: FormDefinitionDeps, filter: (x: Row) => unknown) => d.repository.accounts().filter(x => x.posting !== false && x.active !== false && filter(x)),
    activeTreasuriesOfCurrency: (d: FormDefinitionDeps, currency: string) => d.repository.treasuries().filter(x => x.active !== false && x.currency === currency),
    draftCustomerInvoices: (d: FormDefinitionDeps, partyId: string, partyType: string) => d.repository.invoices().filter(x => BusinessValues.live(x as { status: string; deleted?: boolean }) && x.status === 'draft' && x.kind === 'customer' && x.partyId === partyId && (x.partyType || 'customer') === partyType),
    draftSupplierInvoices: (d: FormDefinitionDeps, partyId: string) => d.repository.invoices().filter(x => BusinessValues.live(x as { status: string; deleted?: boolean }) && x.status === 'draft' && x.kind === 'supplier' && x.partyId === partyId),
    booking: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.bookings(), id),
    service: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.services(), id),
    commission: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.commissions(), id),
    manualJournalDraft: (d: FormDefinitionDeps, id: string) => BusinessValues.find(d.repository.manualJournalDrafts(), id),
    roomAllocationsOf: (d: FormDefinitionDeps, bookingId: string) => d.repository.roomAllocations().filter(r => r.bookingId === bookingId),
    activeTravelersOf: (d: FormDefinitionDeps, bookingId: string) => d.repository.travelers().filter(t => t.bookingId === bookingId && t.active !== false),
    documentRecords: (d: FormDefinitionDeps, isPurchaseOrder: boolean) => isPurchaseOrder ? d.repository.purchaseOrders() : d.repository.quotations(),
    revenueInvoicesForAdjustment: (d: FormDefinitionDeps) => d.repository.invoices().filter(x => BusinessValues.live(x as { status: string; deleted?: boolean }) && x.kind === 'customer' && x.status !== 'draft' && !x.revenueDeferred),
    costInvoicesForAdjustment: (d: FormDefinitionDeps) => d.repository.invoices().filter(x => BusinessValues.live(x as { status: string; deleted?: boolean }) && x.kind === 'supplier' && x.status !== 'draft' && !x.costDeferred)
};
/* Write side: same statements, same order and same errors as the former inline submit handlers. */
const FormDefinitionCommands = {
    createAccount(d: FormDefinitionDeps, o: FormInput): void {
        const id=o.id||'',name=o.name||'';if(d.repository.accounts().some(x=>x.id===id))throw new Error('كود الحساب مستخدم');const posting=o.posting!=='false',type=posting?(o.type||''):'group';d.repository.accounts().push({id,name,description:o.description||'',type,nature:o.nature||'',parentId:o.parentId||'',posting,system:false,active:true});d.persistence.log('create','account',id,name)
    },
    createCostCenter(d: FormDefinitionDeps, o: FormInput): void {
        const x={id:d.clock.id(),no:d.clock.nextCostCenterNo(),name:o.name||'',description:o.description||'',parentId:o.parentId||'',budget:Math.max(0,BusinessValues.number(o.budget)),manager:o.manager||'',active:true,system:false};if(x.parentId&&!BusinessValues.find(d.repository.costCenters(),x.parentId))throw new Error('المركز الأب غير موجود');d.repository.costCenters().push(x);d.persistence.log('create','costcenter',x.id,x.name)
    },
    async createUser(d: FormDefinitionDeps, o: FormInput): Promise<void> {
        d.security.validateUserAdd();if(BusinessValues.text(o.password).length<d.settings.passwordMin())throw new Error('كلمة المرور قصيرة');const username=BusinessValues.text(o.username).trim();if(!username)throw new Error('اسم المستخدم مطلوب');if(d.repository.users().some(x=>BusinessValues.text(x.username).trim().toLowerCase()===username.toLowerCase()))throw new Error('اسم المستخدم مستخدم');const nu={id:d.clock.id(),no:`US${String(d.repository.users().length+1).padStart(3,'0')}`,name:BusinessValues.text(o.name).trim(),username,role:o.role,approvalLimit:BusinessValues.number(o.approvalLimit),maxDiscountPct:Math.max(0,Math.min(100,BusinessValues.number(o.maxDiscountPct))),viewCosts:o.viewCosts==='true',active:true,mustChangePassword:false,permissions:d.security.permissionsFor(o.role||''),customPermissions:false,branchId:o.branchId||d.branch.currentId(),allowedBranchIds:[o.branchId||d.branch.currentId()].filter(Boolean),lastLogin:''};await d.security.setPassword(nu,o.password||'');d.repository.users().push(nu)
    },
    /* Booking form: transaction without auto-save; the caller closes the modal and then calls commit(), as before. */
    saveBooking(d: FormDefinitionDeps, booking: Row | undefined | null | false | '', o: FormInput): void {
        d.transactions.atomic('bookingForm', () => booking ? d.domain.updateBooking(booking.id, o) : d.domain.addBooking(o), { save: false });
    },
    saveService(d: FormDefinitionDeps, service: Row | undefined | null | false | '', o: FormInput, financialLocked: boolean): void {
        d.transactions.atomic('serviceForm', () => service ? d.domain.updateService(service.id, o, { financial: !financialLocked }) : d.domain.addService(o), { save: false });
    },
    commit(d: FormDefinitionDeps): void {
        d.persistence.save();
    },
    saveManualJournalDraft(d: FormDefinitionDeps, draft: Row | undefined | null | false | '', fd: { get(name: string): FormDataEntryValue | null }, lines: JournalLine[]): void {
        d.transactions.atomic('manualJournalDraft', () => {
            const x = draft ? d.domain.updateJournalDraft(draft.id, { date: fd.get('date'), memo: fd.get('memo'), lines }) : d.domain.createJournalDraft({ date: fd.get('date'), memo: fd.get('memo'), lines });
            if (fd.get('recurring'))
                d.domain.addRecurringJournal({ name: fd.get('memo'), memo: fd.get('memo'), frequency: fd.get('recurring'), nextDate: fd.get('nextDate') || fd.get('date'), lines });
            if (fd.get('saveMode') === 'posted') {
                d.authorization.require('journal', 'approve');
                d.domain.postJournalDraft(x.id);
            }
        });
    },
    async changeOwnPassword(d: FormDefinitionDeps, o: FormInput): Promise<void> {
        if((o.password||'')!==(o.confirmPassword||''))throw new Error('كلمتا المرور غير متطابقتين');if(BusinessValues.text(o.password).length<d.settings.passwordMin())throw new Error('كلمة المرور قصيرة');await d.security.setPassword(d.actor.user(),o.password||'');d.actor.user().mustChangePassword=false;d.persistence.log('security','user',d.actor.user().id||'','تغيير كلمة المرور')
    }
};
export { FormDefinitionCommands, FormDefinitionQueries };
export type { FormDefinitionDeps };
