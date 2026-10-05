import { BusinessValues } from '../core/business-values';
interface Row { id: string; name: string; active?: boolean; type?: string; amount?: number; paidAmount?: number; status?: string; agentId?: string; currency?: string; color?: string; icon?: string; pages?: string[]; phone?: string; whatsapp?: string; [field: string]: unknown; }
interface MasterSettings { workspaces?: Row[]; sidebarMode?: string; whatsappCountryCode?: string; [field: string]: unknown }
interface TransactionOptions { save?: boolean; render?: boolean; strict?: boolean; waitForSave?: boolean; rollback?: boolean }
interface MasterActionsDeps {
    repository: {
        customers(): Row[]; suppliers(): Row[]; agents(): Row[]; services(): Row[]; commissions(): Row[]; serviceTypes(): Row[];
        settings(): MasterSettings; setServiceTypes(value: Row[]): void;
    };
    defaults: { workspaces(): Row[] };
    masterData: { toggle(list: string, id: string): unknown; remove(method: string, id: string): unknown };
    persistence: { log(action: string, type: string, id: string, detail: string): void; save(): unknown };
    transactions: { atomic<T>(label: string, work: () => T, options?: TransactionOptions): T };
    authorization: { require(page: string, action: string): void };
    clock: { id(): string };
    numbers: { N(value: unknown): number; EPS: number };
}
const MasterActionsQueries = {
    workspaces: (d: MasterActionsDeps) => d.repository.settings().workspaces || [],
    serviceTypeNameUsed: (d: MasterActionsDeps, name: string) => d.repository.services().some(s => s.type === name),
    serviceTypes: (d: MasterActionsDeps) => d.repository.serviceTypes(),
    serviceType: (d: MasterActionsDeps, id: string) => BusinessValues.find(d.repository.serviceTypes(), id),
    serviceTypeNameTaken: (d: MasterActionsDeps, name: string, exceptId?: string) => d.repository.serviceTypes().some(x => (exceptId === undefined || x.id !== exceptId) && x.name.toLowerCase() === name.toLowerCase()),
    partyRecord: (d: MasterActionsDeps, type: string, id: string) => type === 'customer' ? BusinessValues.find(d.repository.customers(), id) : type === 'supplier' ? BusinessValues.find(d.repository.suppliers(), id) : type === 'agent' ? BusinessValues.find(d.repository.agents(), id) : null,
    payableCommissionOf: (d: MasterActionsDeps, agentId: string) => d.repository.commissions().find(c => c.agentId === agentId && ['approved', 'partial'].includes(c.status || '') && d.numbers.N(c.amount) - d.numbers.N(c.paidAmount) > d.numbers.EPS)
};
/* Write side: the atomic label, the order of checks and the log lines are exactly those of the original handlers. */
const MasterActionsCommands = {
    toggleWorkspace(d: MasterActionsDeps, id: string): void {
        d.transactions.atomic('workspaceToggle', () => {
            const w = (d.repository.settings().workspaces || []).find((x: Row) => x.id === id);
            if (!w)
                throw new Error('القسم غير موجود');
            w.active = w.active === false;
            d.persistence.log(w.active ? 'activate' : 'deactivate', 'workspace', id, w.name);
        });
    },
    moveWorkspace(d: MasterActionsDeps, id: string, dir: unknown): void {
        d.transactions.atomic('workspaceMove', () => {
            const a = d.repository.settings().workspaces || [], i = a.findIndex((x: Row) => x.id === id), j = i + d.numbers.N(dir);
            if (i < 0 || j < 0 || j >= a.length)
                return;
            [a[i], a[j]] = [a[j], a[i]];
        });
    },
    restoreDefaultWorkspaces(d: MasterActionsDeps): void {
        d.transactions.atomic('workspaceDefaults', () => { d.repository.settings().workspaces = d.defaults.workspaces(); });
    },
    addServiceType(d: MasterActionsDeps, name: string): void {
        d.transactions.atomic('addServiceType', () => d.repository.serviceTypes().push({ id: d.clock.id(), name, active: true }));
    },
    renameServiceType(d: MasterActionsDeps, id: string, record: Row, name: string): void {
        d.transactions.atomic('renameServiceType', () => {
            const old = record.name;
            record.name = name;
            d.persistence.log('rename', 'serviceType', id, `${old} → ${name}`);
        });
    },
    removeServiceType(d: MasterActionsDeps, id: string, record: Row): void {
        d.transactions.atomic('removeServiceType', () => {
            d.repository.setServiceTypes(d.repository.serviceTypes().filter(x => x.id !== id));
            d.persistence.log('delete', 'serviceType', id, record.name);
        });
    },
    saveInterface(d: MasterActionsDeps, readMode: () => string, readCountryCode: () => string): void {
        d.authorization.require('settings', 'edit');
        const s = d.repository.settings();
        s.sidebarMode = readMode();
        s.whatsappCountryCode = readCountryCode();
        d.persistence.save();
    },
    toggleMaster(d: MasterActionsDeps, list: string, id: string): void {
        d.transactions.atomic('toggleMaster', () => d.masterData.toggle(list, id));
    },
    removeMaster(d: MasterActionsDeps, method: string, id: string): void {
        d.transactions.atomic('removeMaster', () => d.masterData.remove(method, id));
    }
};
export { MasterActionsCommands, MasterActionsQueries };
export type { MasterActionsDeps };
