interface AdvancedRow {
    id: string; no?: string; name?: string; active?: boolean; status?: string; kind?: string; partyId?: string; partyType?: string; invoiceId?: string; total?: number; amount?: number; currency?: string; recognitionDate?: string; date?: string; type?: string; treasuryId?: string; period?: string; net?: number; used?: number; parts?: Array<{ id: string; date?: string; amount?: number; status?: string }>; [field: string]: unknown;
}
interface ReconcileResult { matched: number; unmatched: number; [field: string]: unknown }
interface TransactionOptions { save?: boolean; render?: boolean; strict?: boolean; waitForSave?: boolean; rollback?: boolean }
interface AdvancedActionsDeps {
    repository: { collection(name: string): AdvancedRow[] };
    ledger: {
        reverseSettlement(kind: string, id: string, reason: string): unknown;
        recognizeDeferredPart(id: string, partId: string): unknown;
        reverseDeferredPart(id: string, partId: string, reason: string): unknown;
        recognizeDeferredCostPart(id: string, partId: string): unknown;
        reverseDeferredCostPart(id: string, partId: string, reason: string): unknown;
        reconcileBankLines(treasuryId: string): ReconcileResult;
    };
    transactions: {
        atomic<T>(label: string, work: () => T, options?: TransactionOptions): T;
        atomicAsync<T>(label: string, work: () => T | Promise<T>, options?: TransactionOptions): Promise<T>;
    };
}
/* Read side: raw live collections, so the callers keep their original behaviour when a collection is missing. */
const AdvancedActionsQueries = {
    collection: (d: AdvancedActionsDeps, name: string) => d.repository.collection(name)
};
/* Write side: same atomic labels and options as the original handlers; prompts, toasts and re-rendering stay in the UI. */
const AdvancedActionsCommands = {
    submitForm: (d: AdvancedActionsDeps, work: () => unknown | Promise<unknown>): Promise<unknown> => d.transactions.atomicAsync('advanced-accounting', work, { save: true, strict: true }),
    reverseSettlement: (d: AdvancedActionsDeps, kind: string, id: string, reason: string): void => { d.transactions.atomic('reverseAdvancedSettlement', () => d.ledger.reverseSettlement(kind, id, reason)); },
    recognizeDeferred: (d: AdvancedActionsDeps, id: string, partId: string): void => { d.transactions.atomic('recognizeDeferred', () => d.ledger.recognizeDeferredPart(id, partId)); },
    reverseDeferred: (d: AdvancedActionsDeps, id: string, partId: string, reason: string): void => { d.transactions.atomic('reverseDeferred', () => d.ledger.reverseDeferredPart(id, partId, reason)); },
    recognizeDeferredCost: (d: AdvancedActionsDeps, id: string, partId: string): void => { d.transactions.atomic('recognizeDeferredCost', () => d.ledger.recognizeDeferredCostPart(id, partId)); },
    reverseDeferredCost: (d: AdvancedActionsDeps, id: string, partId: string, reason: string): void => { d.transactions.atomic('reverseDeferredCost', () => d.ledger.reverseDeferredCostPart(id, partId, reason)); },
    /* onResult runs inside the transaction, exactly where the original toast was. */
    reconcileImportedBank: (d: AdvancedActionsDeps, treasuryId: string, onResult: (result: ReconcileResult) => void): void => { d.transactions.atomic('bank-auto-reconcile', () => { onResult(d.ledger.reconcileBankLines(treasuryId)); }); }
};
export { AdvancedActionsQueries, AdvancedActionsCommands };
export type { AdvancedActionsDeps };
