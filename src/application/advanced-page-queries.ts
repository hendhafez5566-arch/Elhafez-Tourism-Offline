interface AdvancedPart { status?: string; amount?: number }
interface AdvancedPageRecord {
    id: string; no?: string; date?: string; type?: string; supplierId?: string; customerId?: string; programId?: string; amount?: number; currency?: string; expenseAccountId?: string; revenueAccountId?: string; status?: string; invoiceId?: string; parts?: AdvancedPart[]; total?: number; period?: string; gross?: number; deductions?: number; net?: number; name?: string; assetAccountId?: string; purchaseDate?: string; cost?: number; depreciated?: number; netBookValue?: number; usefulLifeMonths?: number; lender?: string; principal?: number; annualRate?: number; paidPrincipal?: number; loanId?: string; dueDate?: string; used?: number; year?: number; account?: { id?: string; name?: string }; accountId?: string; costCenterId?: string; actual?: number; variance?: number; partyId?: string; partyType?: string; active?: boolean; [field: string]: unknown;
}
interface AdvancedPageDeps { repository: { collection(name: string): AdvancedPageRecord[] } }
/* Read side of the advanced accounting pages: raw live collections read at call time, so the pages keep their original behaviour when a collection is missing. */
const AdvancedPageQueries = { collection: (d: AdvancedPageDeps, name: string) => d.repository.collection(name) };
export { AdvancedPageQueries };
export type { AdvancedPageDeps };
