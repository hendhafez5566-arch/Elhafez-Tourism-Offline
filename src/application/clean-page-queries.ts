type Row = any;
interface CleanPageDeps {
    repository: {
        leads(): Row[] | undefined; followups(): Row[] | undefined; quotations(): Row[] | undefined; customers(): Row[] | undefined; suppliers(): Row[] | undefined;
        agents(): Row[] | undefined; commissions(): Row[] | undefined; invoices(): Row[] | undefined; purchaseOrders(): Row[] | undefined; expenses(): Row[] | undefined;
        treasuries(): Row[]; transfers(): Row[] | undefined; bankReconciliations(): Row[] | undefined; vouchers(page: 'receipts' | 'payments'): Row[] | undefined;
    };
    settings: { baseCurrency(): string };
}
/* Read side of the list pages: every method reads the live store at call time (never a snapshot) and keeps the original "|| []" fallbacks. */
const CleanPageQueries = {
    leads: (d: CleanPageDeps) => d.repository.leads() || [],
    followups: (d: CleanPageDeps) => d.repository.followups() || [],
    quotations: (d: CleanPageDeps) => d.repository.quotations() || [],
    customers: (d: CleanPageDeps) => d.repository.customers() || [],
    suppliers: (d: CleanPageDeps) => d.repository.suppliers() || [],
    agents: (d: CleanPageDeps) => d.repository.agents() || [],
    commissions: (d: CleanPageDeps) => d.repository.commissions() || [],
    invoices: (d: CleanPageDeps) => d.repository.invoices() || [],
    purchaseOrders: (d: CleanPageDeps) => d.repository.purchaseOrders() || [],
    expenses: (d: CleanPageDeps) => d.repository.expenses() || [],
    treasuries: (d: CleanPageDeps) => d.repository.treasuries() || [],
    /* no fallback on purpose: the transfer/reconciliation rows looked treasuries up without one */
    treasuriesUnguarded: (d: CleanPageDeps) => d.repository.treasuries(),
    transfers: (d: CleanPageDeps) => d.repository.transfers() || [],
    bankReconciliations: (d: CleanPageDeps) => d.repository.bankReconciliations() || [],
    vouchers: (d: CleanPageDeps, page: 'receipts' | 'payments') => d.repository.vouchers(page) || [],
    baseCurrency: (d: CleanPageDeps) => d.settings.baseCurrency()
};
export { CleanPageQueries };
export type { CleanPageDeps };
