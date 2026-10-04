import type { ActionAuthorizationPort, ActionPersistencePort, ActionTransactionPort, CommercialBranch } from './contracts';
// Small shared values and ports used by the extracted legacy workflows.
type BusinessNumber = number | string | null | undefined;
interface BusinessActor {
    id?: string;
    name?: string;
    username?: string;
    role?: string;
    active?: boolean;
    permissions?: {
        all?: boolean;
    };
    approvalLimit?: BusinessNumber;
    viewCosts?: boolean;
    maxDiscountPct?: BusinessNumber;
    branchId?: string;
    allowedBranchIds?: string[];
}
interface BusinessClock {
    today(): string;
    now(): string;
    id(): string;
    next(kind: string, date?: string): string;
    clone<T>(value: T): T;
    formatDate(value: string): string;
}
interface BusinessLine {
    id?: string;
    description?: string;
    qty?: BusinessNumber;
    price?: BusinessNumber;
    discount?: BusinessNumber;
    discountMode?: string;
    taxId?: string;
    taxRate?: number;
    taxInputAccount?: string;
    taxOutputAccount?: string;
    accountId?: string;
    costCenterId?: string;
    purchaseOrderLineId?: string;
    receivedQty?: BusinessNumber;
    invoicedQty?: BusinessNumber;
}
interface BusinessJournalLine {
    accountId: string;
    currency?: string;
    debit?: BusinessNumber;
    credit?: BusinessNumber;
    baseDebit?: BusinessNumber;
    baseCredit?: BusinessNumber;
    rate?: BusinessNumber;
    baseOnly?: boolean;
    partyType?: string;
    partyId?: string;
    treasuryId?: string;
    employeeId?: string;
    costCenterId?: string;
    taxId?: string;
    taxDirection?: string;
    sourceInvoiceId?: string;
    sourceLineId?: string;
}
interface BusinessJournalInput {
    date?: string;
    memo?: string;
    refType?: string;
    refId?: string;
    costCenterId?: string;
    branchId?: string;
    lines: BusinessJournalLine[];
    skipPeriod?: boolean;
}
interface BusinessInvoice {
    id: string;
    no: string;
    date: string;
    kind: string;
    partyType?: string;
    partyId: string;
    currency: string;
    status: string;
    baseRate?: number;
    lines: BusinessLine[];
    costCenterId?: string;
    revenueAccountId?: string;
    expenseAccountId?: string;
    recognitionDate?: string;
    revenueDeferred?: boolean;
    costDeferred?: boolean;
    voidReason?: string;
    integrationSourceType?: string;
    integrationSourceId?: string;
}
interface BusinessInvoiceDraft {
    kind: string;
    partyId: string;
    partyType: string;
    currency: string;
    date: string;
    dueDate?: string;
    recognitionDate?: string;
    description: string;
    sourceType: string;
    sourceId: string;
    costCenterId?: string;
    externalNo?: string;
    status: string;
    lines: BusinessLine[];
}
interface BusinessTax {
    id: string;
    rate: number;
    inputAccount: string;
    outputAccount: string;
    active?: boolean;
}
interface BusinessMoneyPort {
    round(value: number, currency?: string): number;
    rate(currency: string, date?: string): number;
    toBase(amount: number, currency: string, date?: string): number;
    format(amount: number, currency: string): string;
}
interface BusinessAccountingPort {
    post(input: BusinessJournalInput): unknown;
    reverse(type: string, id: string, reason: string): unknown;
    documentStatus(type: string, id: string, status: string): unknown;
}
interface BusinessInvoicePort {
    create(input: BusinessInvoiceDraft): BusinessInvoice;
    post(invoice: BusinessInvoice): unknown;
}
interface BusinessProgram {
    id: string;
    costCenterId?: string;
}
interface CrmLead {
    id: string;
    no: string;
    name: string;
    phone: string;
    source: string;
    service: string;
    value: number;
    currency: string;
    status: string;
    agentId: string;
    notes: string;
    customerId: string;
    createdAt: string;
    active: boolean;
    updatedAt?: string;
}
interface CrmLeadFields {
    name?: string;
    phone?: string;
    source?: string;
    service?: string;
    value?: BusinessNumber;
    currency?: string;
    status?: string;
    agentId?: string;
    notes?: string;
}
interface CrmFollowup {
    id: string;
    leadId: string;
    date: string;
    type: string;
    result: string;
    nextDate: string;
    userId: string;
    createdAt: string;
    updatedAt?: string;
}
interface CrmFollowupFields {
    leadId?: string;
    date?: string;
    type?: string;
    result?: string;
    nextDate?: string;
}
interface BusinessQuotation {
    id: string;
    no: string;
    date: string;
    partyId: string;
    currency: string;
    status: string;
    validUntil: string;
    notes: string;
    lines: BusinessLine[];
    sentAt: string;
    acceptedAt: string;
    convertedAt: string;
    rejectedAt: string;
    rejectedReason: string;
    createdAt: string;
    updatedAt?: string;
    invoiceId?: string;
}
interface BusinessQuotationFields {
    date?: string;
    partyId?: string;
    currency?: string;
    validUntil?: string;
    notes?: string;
    lines?: BusinessLine[];
}
interface BusinessPurchaseOrder {
    id: string;
    no: string;
    date: string;
    supplierId: string;
    programId: string;
    costCenterId: string;
    currency: string;
    status: string;
    expectedDate: string;
    externalRef: string;
    notes: string;
    lines: BusinessLine[];
    createdAt: string;
    updatedAt?: string;
    invoiceId?: string;
    invoiceIds?: string[];
    sourceType?: string;
    voidReason?: string;
    voidAt?: string;
    receivedAt?: string;
    integrationSourceType?: string;
    integrationSourceId?: string;
    advancePaymentSourceType?: string;
    advancePaymentSourceId?: string;
}
interface BusinessPurchaseFields {
    date?: string;
    supplierId?: string;
    programId?: string;
    costCenterId?: string;
    currency?: string;
    expectedDate?: string;
    externalRef?: string;
    notes?: string;
    lines?: BusinessLine[];
}
interface CrmRepositoryPort {
    leads: CrmLead[];
    followups: CrmFollowup[];
    quotations: BusinessQuotation[];
    purchaseOrders: BusinessPurchaseOrder[];
    invoices: BusinessInvoice[];
    programs: BusinessProgram[];
    baseCurrency(): string;
}
interface CrmWorkflowDeps {
    repository: CrmRepositoryPort;
    clock: BusinessClock;
    actor(): BusinessActor | undefined;
    transactions: ActionTransactionPort;
    persistence: ActionPersistencePort;
    invoices: BusinessInvoicePort;
    parties: {
        addCustomer(input: {
            name: string;
            phone: string;
            agentId: string;
            notes: string;
        }): {
            id: string;
        };
        applyPendingInvoiceAdvances(invoice: BusinessInvoice, filter: {
            sourceType: string;
            sourceId: string;
        }): unknown;
    };
    policy: {
        requireEditable(kind: string, record: {
            status: string;
        }): unknown;
    };
    fulfillment: {
        normalizeLines(lines: BusinessLine[], previous?: BusinessLine[]): BusinessLine[];
        receiveAll(order: BusinessPurchaseOrder): BusinessPurchaseOrder;
        record(order: BusinessPurchaseOrder, quantities: Record<string, number>): BusinessPurchaseOrder;
        uninvoicedLines(order: BusinessPurchaseOrder, options: {
            legacyFull: boolean;
        }): BusinessLine[];
        markInvoiced(order: BusinessPurchaseOrder, lines: BusinessLine[]): unknown;
    };
    tax: {
        amount(amount: number, id: string): number;
    };
}
interface BusinessTreasury {
    id: string;
    currency: string;
    active?: boolean;
}
interface BusinessAllocation {
    invoiceId: string;
    invoiceAmount: number;
    paymentBase: number;
    realizedFx: number;
}
interface BusinessSettlement {
    amount: number;
    currency: string;
    rate: number;
}
interface BusinessVoucherFields {
    amount?: BusinessNumber;
    partyType?: string;
    partyId?: string;
    date?: string;
    currency?: string;
    paymentMethod?: string;
    referenceNo?: string;
    bankName?: string;
    valueDate?: string;
    treasuryId?: string;
    invoiceId?: string;
    asAdvance?: boolean;
    forceSupplierAdvance?: boolean;
    creditAccountId?: string;
    debitAccountId?: string;
    debitLines?: BusinessJournalLine[];
    employeeId?: string;
    costCenterId?: string;
    note?: string;
    sourceType?: string;
    sourceId?: string;
    sourceScheduleId?: string;
    sourceLabel?: string;
    commissionId?: string;
    agentSettlement?: BusinessSettlement;
}
interface BusinessVoucher {
    id: string;
    no: string;
    date: string;
    partyType: string;
    partyId: string;
    treasuryId: string;
    amount: number;
    currency: string;
    note: string;
    status: string;
    allocations: BusinessAllocation[];
    pendingInvoiceId: string;
    paymentMethod: string;
    referenceNo: string;
    bankName: string;
    valueDate: string;
    createdAt: string;
    branchId?: string;
    sourceType?: string;
    sourceId?: string;
    sourceScheduleId?: string;
    sourceLabel?: string;
    commissionId?: string;
    agentSettlement?: BusinessSettlement;
}
interface BusinessCheque {
    id: string;
    direction: string;
    voucherId: string;
    no: string;
    bankName: string;
    valueDate: string;
    currency: string;
    amount: number;
    carryingBase: number;
    status: string;
    treasuryId: string;
    date: string;
}
interface BusinessDocument {
    id: string;
    no: string;
    date: string;
    type: string;
    refId: string;
    refNo: string;
    title: string;
    status: string;
}
interface BusinessCommission {
    id: string;
    status: string;
    amount: number;
    paidAmount?: number;
    paymentIds?: string[];
}
interface BusinessApproval {
    id: string;
    no: string;
    status: string;
    requestedBy?: string;
    baseAmount?: BusinessNumber;
}
interface VoucherWorkflowDeps {
    clock: BusinessClock;
    actor(): BusinessActor | undefined;
    branchId(): string;
    transactions: ActionTransactionPort;
    persistence: ActionPersistencePort;
    money: BusinessMoneyPort;
    repository: {
        baseCurrency(): string;
        approvalPayments(): boolean;
        treasuries: BusinessTreasury[];
        invoices: BusinessInvoice[];
        receipts: BusinessVoucher[];
        payments: BusinessVoucher[];
        cheques: BusinessCheque[];
        documents: BusinessDocument[];
        commissions: BusinessCommission[];
    };
    invoices: {
        allocate(kind: string, partyId: string, currency: string, amount: number, date: string, invoiceId?: string): {
            allocations: BusinessAllocation[];
            leftBase: number;
        };
        refresh(invoice: BusinessInvoice): unknown;
    };
    accounting: BusinessAccountingPort & {
        ensureTreasuryAccount(treasury: BusinessTreasury): string;
        validateTreasury(id: string, amount: number): unknown;
        supplierAdvance(id: string): Record<string, number>;
        customerAdvance(type: string, id: string): Record<string, number>;
    };
    approval: {
        create(type: string, payload: BusinessVoucherFields, baseAmount: number): BusinessApproval;
        requested(approval: BusinessApproval): void;
    };
    pendingDraftInvoice(kind: string, type: string, id: string, currency: string, invoiceId?: string): BusinessInvoice | undefined;
    onReceipt(receipt: BusinessVoucher): unknown;
}
interface VoucherLineDeps {
    money: BusinessMoneyPort;
    repository: {
        baseCurrency(): string;
        invoices: BusinessInvoice[];
    };
    accounting: {
        ensureTreasuryAccount(treasury: BusinessTreasury): string;
        supplierAdvance(id: string): Record<string, number>;
        customerAdvance(type: string, id: string): Record<string, number>;
    };
}
interface JournalRuleDeps {
    baseCurrency: string;
    validateLine(line: BusinessJournalLine): void;
    rate(currency: string, date: string): number;
    round(value: number, currency: string): number;
    format(value: number): string;
}
interface InvoiceRuleDeps {
    round(value: number, currency: string): number;
    tax: {
        amount(amount: number, id: string, rate: number | null, currency: string): number;
        require(id: string): BusinessTax;
    };
}
interface InvoiceWorkflowDeps {
    repository: {
        suppliers: {
            id: string;
            name: string;
        }[];
        agents: {
            id: string;
            name: string;
        }[];
        customers: {
            id: string;
            name: string;
            creditLimit?: BusinessNumber;
        }[];
        invoices: BusinessInvoice[];
        invoiceAdjustments: {
            invoiceId: string;
            status: string;
            deleted?: boolean;
        }[];
        documents: BusinessDocument[];
        baseCurrency(): string;
    };
    periods: {
        assertOpen(date: string): unknown;
    };
    money: BusinessMoneyPort;
    tax: {
        require(id: string): BusinessTax;
    };
    math: {
        validateLines(invoice: BusinessInvoice): unknown;
        lineCalc(line: BusinessLine, currency: string): {
            net: number;
            tax: number;
        };
        total(invoice: BusinessInvoice): number;
        allocations(id: string): number;
        refresh(invoice: BusinessInvoice): unknown;
    };
    accounting: BusinessAccountingPort & {
        partyReceivable(type: string, id: string): Record<string, number>;
    };
    balanceBase(map: Record<string, number>, positiveOnly: boolean): number;
    persistence: ActionPersistencePort;
    applyPending(invoice: BusinessInvoice): unknown;
    syncService(invoice: BusinessInvoice): unknown;
    deferred: {
        available(): boolean;
        revenue(invoice: BusinessInvoice): unknown;
        cost(invoice: BusinessInvoice): unknown;
    };
}
interface InvoicePostingRuleDeps {
    repository: {
        customers: {
            id: string;
            creditLimit?: BusinessNumber;
        }[];
        baseCurrency(): string;
    };
    math: {
        lineCalc(line: BusinessLine, currency: string): {
            net: number;
            tax: number;
        };
    };
    money: BusinessMoneyPort;
    tax: {
        require(id: string): BusinessTax;
    };
    accounting: {
        partyReceivable(type: string, id: string): Record<string, number>;
    };
    balanceBase(map: Record<string, number>, positiveOnly: boolean): number;
}
interface BusinessBranch extends CommercialBranch {
    createdAt?: string;
}
interface BusinessBranchFields {
    name?: string;
    code?: string;
    address?: string;
    phone?: string;
    active?: boolean;
}
interface BranchWorkflowDeps {
    authorization: ActionAuthorizationPort;
    repository: {
        branches: BusinessBranch[];
        users: BusinessActor[];
    };
    actor(): BusinessActor | undefined;
    branchLimit(): number;
    selection: {
        current(): string;
        store(id: string): void;
    };
    clock: BusinessClock;
    persistence: ActionPersistencePort;
}
interface ExpenseApprovalOptions {
    paymentMethod?: string;
    referenceNo?: string;
    bankName?: string;
    valueDate?: string;
    dueDate?: string;
    _approved?: boolean;
}
interface BusinessApprovalPayload extends BusinessVoucherFields {
    expenseId?: string;
    options?: ExpenseApprovalOptions;
}
interface BusinessApprovalRecord extends BusinessApproval {
    type: string;
    payload: BusinessApprovalPayload;
    baseAmount: number;
    requestedAt: string;
    approvedAt: string;
    approvedBy: string;
    rejectedAt: string;
    rejectedBy: string;
    reason: string;
}
interface ApprovalWorkflowDeps {
    repository: {
        approvals: BusinessApprovalRecord[];
        expenses: {
            id: string;
            status: string;
            approvalId?: string;
        }[];
        commissions: BusinessCommission[];
        allowSelfApproval(): boolean;
        baseCurrency(): string;
    };
    actor(): BusinessActor | undefined;
    clock: BusinessClock;
    money: BusinessMoneyPort;
    persistence: ActionPersistencePort;
    operations: {
        addPayment(payload: BusinessApprovalPayload, options: {
            ignoreApproval: boolean;
        }): unknown;
        postExpense(expense: {
            id: string;
            status: string;
            approvalId?: string;
        }, options: ExpenseApprovalOptions): unknown;
        approveCommission(id: string): unknown;
        rejectCommission(id: string, reason: string): unknown;
    };
}
interface TourismService {
    id: string;
    no: string;
    date: string;
    status: string;
    externalCost?: BusinessNumber;
    supplierId?: string;
    customerId: string;
    agentId?: string;
    billTo?: string;
    sale: number;
    saleCurrency: string;
    costCurrency: string;
    externalCostCurrency?: string;
    dueDate?: string;
    supplierDueDate?: string;
    description?: string;
    type: string;
    costCenterId?: string;
    saleTaxId?: string;
    costTaxId?: string;
    customerInvoiceId?: string;
    supplierInvoiceId?: string;
    billingStatus?: string;
    supplierBillingStatus?: string;
    reopenReason?: string;
}
interface TourismBooking {
    id: string;
    no: string;
    status: string;
    reopenReason?: string;
}
interface TourismWorkflowDeps {
    repository: {
        services: TourismService[];
        bookings: TourismBooking[];
        customers: {
            id: string;
            name: string;
        }[];
        agents: {
            id: string;
        }[];
        suppliers: {
            id: string;
        }[];
    };
    transactions: ActionTransactionPort;
    persistence: ActionPersistencePort;
    invoices: BusinessInvoicePort;
    ensureServiceCommission(service: TourismService): unknown;
}
interface UmrahProgramRuleRecord {
    status: string;
    active?: boolean;
    salesCloseDate?: string;
    pricing?: Record<string, BusinessNumber>;
}
interface UmrahBookingRuleRecord {
    status: string;
    counts?: {
        adults?: BusinessNumber;
        childBed?: BusinessNumber;
        childNoBed?: BusinessNumber;
        infants?: BusinessNumber;
    };
    primaryRoomType?: string;
    discount?: BusinessNumber;
    discountReason?: string;
    hostInvoiceId?: string;
    hostInvoiceNo?: string;
    paymentStatus?: string;
    paymentRemaining?: number | null;
    paymentUpdatedAt?: string;
}
interface UmrahFinanceSnapshot {
    invoiceId?: string;
    invoiceNo?: string;
    paid?: BusinessNumber;
    remaining?: BusinessNumber;
}
interface BusinessLedgerLine extends BusinessJournalLine {
    date: string;
    refType: string;
    costCenterId?: string;
    baseDebit: number;
    baseCredit: number;
    currency: string;
}
interface FinancialQueryDeps {
    money: BusinessMoneyPort;
    today(): string;
    daysBetween(from: string, to: string): number;
    repository: {
        customers: {
            id: string;
        }[];
        agents: {
            id: string;
        }[];
        suppliers: {
            id: string;
        }[];
        treasuries: BusinessTreasury[];
        invoices: (BusinessInvoice & {
            dueDate?: string;
        })[];
        purchaseOrders: BusinessPurchaseOrder[];
    };
    ledger: {
        lines(from?: string, to?: string): BusinessLedgerLine[];
        account(id: string): {
            id: string;
            type: string;
        } | undefined;
        partyReceivable(type: string, id: string): Record<string, number>;
        supplierPayable(id: string): Record<string, number>;
        agentPayable(id: string): Record<string, number>;
        customerAdvance(type: string, id: string, from?: string, to?: string): Record<string, number>;
        supplierAdvance(id: string, from?: string, to?: string): Record<string, number>;
        treasuryBalance(id: string, to?: string): number;
    };
    invoices: {
        listMetrics(invoices: BusinessInvoice[]): Map<string, {
            remaining: number;
        }>;
    };
    lineTotal(line: BusinessLine): number;
}
interface ManualJournalRecord {
    id: string;
    no: string;
    date: string;
    memo: string;
    lines: BusinessJournalLine[];
    status: string;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    journalId?: string;
    postedAt?: string;
    postedBy?: string;
    voidReason?: string;
    voidAt?: string;
}
interface ManualJournalFields {
    date?: string;
    memo?: string;
    lines?: BusinessJournalLine[];
    name?: string;
    frequency?: string;
    nextDate?: string;
}
interface RecurringJournalRecord {
    id: string;
    name: string;
    memo: string;
    frequency: string;
    nextDate: string;
    lines: BusinessJournalLine[];
    active: boolean;
    createdAt: string;
    lastGenerated?: string;
}
interface ManualJournalWorkflowDeps {
    clock: BusinessClock;
    actor(): BusinessActor | undefined;
    repository: {
        manualJournalDrafts: ManualJournalRecord[];
        recurringJournals: RecurringJournalRecord[];
    };
    persistence: ActionPersistencePort;
    accounting: {
        post(input: BusinessJournalInput): {
            id: string;
        };
        reverse(type: string, id: string, reason: string): unknown;
    };
    dateAddMonthsClamped(date: string, months: number): string;
}
interface TransferRecord {
    id: string;
    no: string;
    date: string;
    from: string;
    to: string;
    amount: number;
    sourceCurrency: string;
    received: number;
    targetCurrency: string;
    note: string;
    status: string;
    voidReason?: string;
}
interface TransferFields {
    from?: string;
    to?: string;
    amount?: BusinessNumber;
    date?: string;
    received?: BusinessNumber;
    note?: string;
}
interface TransferWorkflowDeps {
    transactions: ActionTransactionPort;
    clock: BusinessClock;
    repository: {
        treasuries: BusinessTreasury[];
        transfers: TransferRecord[];
        documents: BusinessDocument[];
        baseCurrency(): string;
    };
    money: BusinessMoneyPort & {
        convert(amount: number, from: string, to: string, date: string): number;
    };
    accounting: BusinessAccountingPort & {
        validateTreasury(id: string, amount: number): unknown;
        ensureTreasuryAccount(treasury: BusinessTreasury): string;
    };
}
interface IntegrityReportResult {
    ok: boolean;
}
interface IntegrityWorkflowDeps {
    report(): IntegrityReportResult;
    issues(): {
        fixable?: boolean;
        code: string;
        treasuryId?: string;
    }[];
    treasury(id: string): BusinessTreasury | undefined;
    ensureTreasury(treasury: BusinessTreasury): unknown;
    save(): unknown;
    completed(report: IntegrityReportResult): void;
    repaired(): void;
}
interface UmrahLifecycleProgram extends UmrahProgramRuleRecord {
    id: string;
    no: string;
    statusAt?: string;
}
interface UmrahLifecycleBooking extends UmrahBookingRuleRecord {
    id: string;
    no: string;
    programId: string;
    statusAt?: string;
}
interface UmrahLifecycleDeps {
    transactions: Pick<ActionTransactionPort, 'atomic'>;
    authorization: ActionAuthorizationPort;
    repository: {
        program(id: string): UmrahLifecycleProgram | undefined;
        booking(id: string): UmrahLifecycleBooking | undefined;
        bookings(): UmrahLifecycleBooking[];
    };
    operations: {
        assertProgramOpenReady(id: string): unknown;
        blockers(id: string): {
            travelers: {
                id: string;
            }[];
            total: number;
        };
        financialSetupGaps(id: string): {
            title: string;
        }[];
        resourceBookingStatuses: Set<string>;
        bookingReadiness(booking: UmrahLifecycleBooking): {
            score: number;
        };
    };
    procurement: {
        cancelProgramCommitments(id: string, reason: string): unknown;
        onProgramOpen(program: UmrahLifecycleProgram): unknown;
        onProgramTraveling(program: UmrahLifecycleProgram): unknown;
        onProgramReturned(program: UmrahLifecycleProgram): unknown;
    };
    releaseProgram(id: string): unknown;
    clock: {
        today(): string;
        now(): string;
    };
    programLabel(status: string): string;
    audit(action: string, type: string, id: string, detail: string): unknown;
}
interface NettingComponent {
    type: string;
    partyId: string;
    accountId: string;
    currency: string;
}
interface NettingGroup {
    id: string;
    name?: string;
}
interface NettingAllocation {
    invoiceId: string;
    invoiceNo: string;
    invoiceAmount: number;
    invoiceCurrency: string;
    partyType: string;
    partyId: string;
    accountId: string;
}
interface NettingRecord {
    id: string;
    no: string;
    date: string;
    partyGroupId: string;
    payable: NettingComponent;
    receivable: NettingComponent;
    amount: number;
    currency: string;
    invoiceAllocations: NettingAllocation[];
    note: string;
    status: string;
    createdAt: string;
    createdBy: string;
    journalId?: string;
    reversedAt?: string;
    reverseReason?: string;
}
interface NettingFields {
    pairRef?: string;
    date?: string;
    amount?: BusinessNumber;
    currency?: string;
    note?: string;
}
interface NettingWorkflowDeps {
    authorization: ActionAuthorizationPort;
    actor(): BusinessActor | undefined;
    clock: BusinessClock;
    money: BusinessMoneyPort;
    transactions: ActionTransactionPort;
    repository: {
        nettings(): NettingRecord[];
        documents(): BusinessDocument[];
    };
    queries: {
        groupFor(type: string, id: string): NettingGroup | undefined;
        allRoleEntries(group: NettingGroup): {
            type: string;
            id: string;
        }[];
        componentAvailable(component: NettingComponent, date: string): number;
        allocateInvoices(component: NettingComponent, amount: number): NettingAllocation[];
        refreshNettingInvoices(record: NettingRecord): unknown;
    };
    accounting: {
        post(input: BusinessJournalInput): {
            id: string;
        };
        reverse(type: string, id: string, reason: string): unknown;
        documentStatus(type: string, id: string, status: string): unknown;
    };
    persistence: ActionPersistencePort;
}
interface ExpenseRecord {
    id: string;
    no: string;
    date: string;
    category: string;
    amount: number;
    currency: string;
    mode: string;
    treasuryId: string;
    supplierId: string;
    description: string;
    costCenterId: string;
    status: string;
    months: number;
    expenseAccountId: string;
    taxId: string;
    createdAt: string;
    approvalId?: string;
    paymentId?: string;
    invoiceId?: string;
    voidReason?: string;
}
interface ExpenseFields extends ExpenseApprovalOptions {
    amount?: BusinessNumber;
    currency?: string;
    date?: string;
    status?: string;
    category?: string;
    mode?: string;
    treasuryId?: string;
    supplierId?: string;
    description?: string;
    costCenterId?: string;
    months?: BusinessNumber;
    expenseAccountId?: string;
    taxId?: string;
}
interface PrepaidPart {
    id: string;
    expenseId: string;
    date: string;
    amount: number;
    currency: string;
    status: string;
    journalRef?: boolean;
}
interface ExpenseWorkflowDeps {
    clock: BusinessClock;
    actor(): BusinessActor | undefined;
    transactions: ActionTransactionPort;
    money: BusinessMoneyPort;
    repository: {
        baseCurrency(): string;
        approvalPayments(): boolean;
        expenses: ExpenseRecord[];
        approvals: (BusinessApproval & {
            reason?: string;
            rejectedAt?: string;
            rejectedBy?: string;
        })[];
        invoices: BusinessInvoice[];
        prepaidSchedules: PrepaidPart[];
        documents: BusinessDocument[];
    };
    tax: {
        amount(amount: number, id: string): number;
        require(id: string): BusinessTax;
    };
    approval: {
        create(type: string, payload: BusinessApprovalPayload, amount: number): BusinessApproval;
    };
    vouchers: {
        addPayment(fields: BusinessVoucherFields, options: {
            ignoreApproval: boolean;
        }): {
            id?: string;
            pendingApproval?: boolean;
        };
        voidPayment(id: string, reason: string): unknown;
    };
    invoices: BusinessInvoicePort & {
        allocations(id: string): number;
        cancel(id: string, reason: string): unknown;
    };
    accounting: BusinessAccountingPort;
    persistence: ActionPersistencePort;
    buildPrepaidSchedule(expense: ExpenseRecord): unknown;
}
interface BusinessPaymentMeta {
    paymentMethod: string;
    referenceNo: string;
    bankName: string;
    valueDate: string;
}
export type { ApprovalWorkflowDeps, BranchWorkflowDeps, BusinessActor, BusinessAllocation, BusinessApproval, BusinessApprovalPayload, BusinessBranch, BusinessBranchFields, BusinessClock, BusinessInvoice, BusinessJournalLine, BusinessLine, BusinessMoneyPort, BusinessNumber, BusinessPaymentMeta, BusinessPurchaseFields, BusinessPurchaseOrder, BusinessQuotation, BusinessQuotationFields, BusinessTax, BusinessTreasury, BusinessVoucherFields, CrmFollowupFields, CrmLead, CrmLeadFields, CrmWorkflowDeps, ExpenseApprovalOptions, ExpenseFields, ExpenseRecord, ExpenseWorkflowDeps, FinancialQueryDeps, IntegrityReportResult, IntegrityWorkflowDeps, InvoicePostingRuleDeps, InvoiceRuleDeps, InvoiceWorkflowDeps, JournalRuleDeps, ManualJournalFields, ManualJournalRecord, ManualJournalWorkflowDeps, NettingComponent, NettingFields, NettingRecord, NettingWorkflowDeps, RecurringJournalRecord, TourismBooking, TourismService, TourismWorkflowDeps, TransferFields, TransferWorkflowDeps, UmrahBookingRuleRecord, UmrahFinanceSnapshot, UmrahLifecycleBooking, UmrahLifecycleDeps, UmrahLifecycleProgram, UmrahProgramRuleRecord, VoucherLineDeps, VoucherWorkflowDeps };
