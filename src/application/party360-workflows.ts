type Row = any;
interface Party360Deps {
    repository: {
        /* The live store root: callers that scan across awaits keep the same root they started with, as the original `const d = DB.data` did. */
        root(): any;
        collection(name: string): any;
        updatedAt(): string | undefined;
        baseCurrency(): string;
        auditLog(): Row[] | undefined;
        setAuditLog(value: Row[]): void;
    };
    persistence: { save(force: boolean): Promise<any> };
    transactions: { atomicAsync(label: string, work: () => any, options?: any): Promise<any> };
}
/* Read side of the "More" center. Every method reads the live store at call time and returns the raw value, so the callers keep their original "|| []" fallbacks. */
const Party360Queries = {
    root: (d: Party360Deps) => d.repository.root(),
    collection: (d: Party360Deps, name: string) => d.repository.collection(name),
    updatedAt: (d: Party360Deps) => d.repository.updatedAt(),
    baseCurrency: (d: Party360Deps) => d.repository.baseCurrency()
};
/* Write side: same atomic label, same options and same log line as the original handlers. */
const Party360Commands = {
    save: (d: Party360Deps, force: boolean) => d.persistence.save(force),
    async removeAttachment(d: Party360Deps, remove: () => unknown): Promise<void> {
        await d.transactions.atomicAsync('partyAttachmentDelete', remove, { save: true, render: false, strict: true, waitForSave: true, rollback: true });
    },
    removeActivity(d: Party360Deps, auditId: string): void {
        d.repository.setAuditLog((d.repository.auditLog() || []).filter((x: Row) => x.id !== auditId));
        d.persistence.save(false).catch((e: unknown) => console.error('[party360] activity save failed', e));
    }
};
export { Party360Queries, Party360Commands };
export type { Party360Deps };
