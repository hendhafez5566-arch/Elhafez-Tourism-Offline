interface CleanRecord {
    id: string; no?: string; name?: string; active?: boolean; status: string; date?: string; kind?: string; partyType?: string; partyId?: string; amount?: number; currency?: string; paymentMethod?: string; allocations?: unknown[]; commissionId?: string; supplierId?: string; invoiceId?: string; category?: string; mode?: string; type?: string; sourceCurrency?: string; targetCurrency?: string; from?: string; to?: string; received?: number; treasuryId?: string; system?: number; statement?: number; diff: number; posting?: boolean; control?: boolean; customerId?: string; programId?: string; total?: number; [field: string]: unknown;
}
interface CleanPageDeps {
    repository: {
        leads(): CleanRecord[] | undefined; followups(): CleanRecord[] | undefined; quotations(): CleanRecord[] | undefined; customers(): CleanRecord[] | undefined; suppliers(): CleanRecord[] | undefined;
        agents(): CleanRecord[] | undefined; commissions(): CleanRecord[] | undefined; invoices(): CleanRecord[] | undefined; purchaseOrders(): CleanRecord[] | undefined; expenses(): CleanRecord[] | undefined;
        treasuries(): CleanRecord[]; transfers(): CleanRecord[] | undefined; bankReconciliations(): CleanRecord[] | undefined; vouchers(page: 'receipts' | 'payments'): CleanRecord[] | undefined;
    };
    settings: { baseCurrency(): string };
}
/* Read side of the list pages: every method reads the live store at call time (never a snapshot) and keeps the original "|| []" fallbacks. */
const CleanPageQueries = {
    leads: (d: CleanPageDeps) => d.repository.leads() || [], followups: (d: CleanPageDeps) => d.repository.followups() || [], quotations: (d: CleanPageDeps) => d.repository.quotations() || [], customers: (d: CleanPageDeps) => d.repository.customers() || [], suppliers: (d: CleanPageDeps) => d.repository.suppliers() || [], agents: (d: CleanPageDeps) => d.repository.agents() || [], commissions: (d: CleanPageDeps) => d.repository.commissions() || [], invoices: (d: CleanPageDeps) => d.repository.invoices() || [], purchaseOrders: (d: CleanPageDeps) => d.repository.purchaseOrders() || [], expenses: (d: CleanPageDeps) => d.repository.expenses() || [], treasuries: (d: CleanPageDeps) => d.repository.treasuries() || [],
    treasuriesUnguarded: (d: CleanPageDeps) => d.repository.treasuries(), transfers: (d: CleanPageDeps) => d.repository.transfers() || [], bankReconciliations: (d: CleanPageDeps) => d.repository.bankReconciliations() || [], vouchers: (d: CleanPageDeps, page: 'receipts' | 'payments') => d.repository.vouchers(page) || [], baseCurrency: (d: CleanPageDeps) => d.settings.baseCurrency()
};
export { CleanPageQueries };
export type { CleanPageDeps };
