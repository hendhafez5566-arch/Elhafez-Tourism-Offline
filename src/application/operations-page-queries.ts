interface OperationsRecord {
    id: string; no?: string; name?: string; date?: string; endDate?: string; active?: boolean; status?: string; capacity?: number; plannedCost?: number; plannedCostCurrency?: string; currency?: string; priceQuad?: number; customerId?: string; programId?: string; invoiceId?: string; persons?: number; total?: number; bookingId?: string; rooms?: number; roomType?: string; sale?: number; cost?: number; saleCurrency?: string; costCurrency?: string; customerInvoiceId?: string; supplierInvoiceId?: string; commissionId?: string; type?: string; supplierId?: string; amount?: number; paidAmount?: number; branchId?: string; [field: string]: unknown;
}
interface OperationsPageDeps { repository: { collection(name: string): OperationsRecord[] }; settings: { baseCurrency(): string } }
/* Read side of the operations pages: raw live collections read at call time, so the pages keep their original behaviour when a collection is missing. */
const OperationsPageQueries = {
    collection: (d: OperationsPageDeps, name: string) => d.repository.collection(name),
    baseCurrency: (d: OperationsPageDeps) => d.settings.baseCurrency()
};
export { OperationsPageQueries };
export type { OperationsPageDeps };
