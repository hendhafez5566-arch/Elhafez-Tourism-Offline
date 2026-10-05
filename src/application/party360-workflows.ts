interface PartyRow {
    id: string; no?: string; name?: string; date?: string; createdAt?: string; at?: string; currency?: string; status?: string; amount?: number; total?: number; paymentMethod?: string; method?: string; contractNo?: string; hotelName?: string; airline?: string; provider?: string; serviceName?: string; route?: string; startDate?: string; from?: string; action?: string; summary?: string; details?: string; entity?: string; entityId?: string; entityType?: string; partyId?: string; partyType?: string; kind?: string; supplierId?: string; customerId?: string; agentId?: string; programId?: string; active?: boolean; phone?: string; whatsapp?: string; email?: string; address?: string; persons?: number; type?: string; serviceType?: string; saleAmount?: number; paidAmount?: number; category?: string; fileName?: string; mime?: string; expiryDate?: string; description?: string; hostPONo?: string; hostInvoiceNo?: string; serviceDate?: string; [field: string]: unknown;
}
interface PartyRoot {
    invoices?: PartyRow[]; services?: PartyRow[]; receipts?: PartyRow[]; payments?: PartyRow[]; bookings?: PartyRow[]; umrahBookings?: PartyRow[]; purchaseOrders?: PartyRow[]; commissions?: PartyRow[]; attachments?: PartyRow[]; auditLog?: PartyRow[]; customers?: PartyRow[]; suppliers?: PartyRow[]; agents?: PartyRow[]; programs?: PartyRow[]; umrahPrograms?: PartyRow[]; umrahSupplierCommitments?: PartyRow[]; umrahHotelContracts?: PartyRow[]; umrahFlightBlocks?: PartyRow[]; umrahTransportContracts?: PartyRow[]; umrahVisaContracts?: PartyRow[]; [field: string]: PartyRow[] | undefined;
}
interface TransactionOptions { save?: boolean; render?: boolean; strict?: boolean; waitForSave?: boolean; rollback?: boolean }
interface Party360Deps {
    repository: { root(): PartyRoot; collection(name: string): PartyRow[]; updatedAt(): string | undefined; baseCurrency(): string; auditLog(): PartyRow[] | undefined; setAuditLog(value: PartyRow[]): void };
    persistence: { save(force: boolean): Promise<{ serverAvailable?: boolean; server?: boolean; [field: string]: unknown }> };
    transactions: { atomicAsync<T>(label: string, work: () => T | Promise<T>, options?: TransactionOptions): Promise<T> };
}
const Party360Queries = { root: (d: Party360Deps) => d.repository.root(), collection: (d: Party360Deps, name: string) => d.repository.collection(name), updatedAt: (d: Party360Deps) => d.repository.updatedAt(), baseCurrency: (d: Party360Deps) => d.repository.baseCurrency() };
const Party360Commands = {
    save: (d: Party360Deps, force: boolean) => d.persistence.save(force),
    async removeAttachment(d: Party360Deps, remove: () => unknown): Promise<void> { await d.transactions.atomicAsync('partyAttachmentDelete', remove, { save: true, render: false, strict: true, waitForSave: true, rollback: true }); },
    removeActivity(d: Party360Deps, auditId: string): void { d.repository.setAuditLog((d.repository.auditLog() || []).filter((x: PartyRow) => x.id !== auditId)); d.persistence.save(false).catch((e: unknown) => console.error('[party360] activity save failed', e)); }
};
export { Party360Queries, Party360Commands };
export type { Party360Deps };
