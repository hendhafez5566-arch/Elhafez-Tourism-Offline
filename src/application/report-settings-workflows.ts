import { BusinessValues } from '../core/business-values';
interface ReportRecord { id: string; name?: string; active?: boolean; posting?: boolean; status?: string; type?: string; refId?: string; code?: string; base?: boolean; [field: string]: unknown }
interface CompanyRecord { name?: string; logo?: unknown; phone?: string; email?: string; taxNo?: string; commercialNo?: string; address?: string; [field: string]: unknown }
interface SettingsRecord { baseCurrency: string; fiscalYearStartMonth?: number; passwordMin?: number; preventNegativeTreasury?: boolean; approvalPayments?: boolean; allowSelfApproval?: boolean; activityRetentionDays?: number; prefixes: Record<string, string>; appearance?: unknown; accentColor?: unknown; animations?: unknown; fontScale?: unknown; fontFamily?: unknown; printAmountWords?: unknown; printSignatures?: unknown; printFooter?: string; printPaper?: unknown; printOrientation?: unknown; [field: string]: unknown }
interface NotificationPrefs { passportDays?: number; invoiceDueDays?: number; programDays?: number; lowTreasuryAmount?: number; [field: string]: unknown }
interface AppearanceInput { appearance?: unknown; accentColor?: unknown; animations?: unknown; fontScale?: unknown; fontFamily?: unknown; printAmountWords?: unknown; printSignatures?: unknown; printFooter?: string; printPaper?: unknown; printOrientation?: unknown }
interface ReportSettingsDeps {
    repository: {
        customers(): ReportRecord[] | undefined; suppliers(): ReportRecord[] | undefined; agents(): ReportRecord[] | undefined; accounts(): ReportRecord[]; documents(): ReportRecord[];
        journals(): ReportRecord[]; periods(): ReportRecord[]; currencies(): ReportRecord[]; company(): CompanyRecord; settings(): SettingsRecord; ensureNotificationPrefs(): NotificationPrefs;
    };
    calendar: { reset(): void; ensureDate(date: string): unknown };
    clock: { today(): string };
    numbers: { N(value: unknown): number };
    persistence: { save(): unknown; importBackup(file: unknown): Promise<unknown> };
    authorization: { require(page: string, action: string): void };
}
type Fail = { ok: false; error: string };
type Done = { ok: true };
/* Read side of the reports/settings handlers: ready data from the live stores (never a snapshot). */
const ReportSettingsQueries = {
    partyLists: (d: ReportSettingsDeps) => ({ customers: d.repository.customers() || [], suppliers: d.repository.suppliers() || [], agents: d.repository.agents() || [] }),
    trialBalanceAccounts: (d: ReportSettingsDeps) => d.repository.accounts().filter(a => a.posting !== false),
    baseCurrency: (d: ReportSettingsDeps) => d.repository.settings().baseCurrency,
    document: (d: ReportSettingsDeps, id: string) => BusinessValues.find(d.repository.documents(), id)
};
/* Write side. Each command keeps the order of the original handler: permission first, then the (lazy) form read, then validation, then mutation, then save. */
const ReportSettingsCommands = {
    setLogo(d: ReportSettingsDeps, logo: unknown): void {
        d.repository.company().logo = logo;
        d.persistence.save();
    },
    clearLogo(d: ReportSettingsDeps): void {
        d.authorization.require('settings', 'edit');
        d.repository.company().logo = '';
        d.persistence.save();
    },
    saveCompany(d: ReportSettingsDeps, read: () => { name: string; phone: string; email: string; taxNo: string; commercialNo: string; address: string }): void {
        d.authorization.require('settings', 'edit');
        const c = d.repository.company(), f = read();
        c.name = f.name || c.name;
        c.phone = f.phone;
        c.email = f.email;
        c.taxNo = f.taxNo;
        c.commercialNo = f.commercialNo;
        c.address = f.address;
        d.persistence.save();
    },
    savePolicies(d: ReportSettingsDeps, readHead: () => { baseCurrency: string; fiscalMonth: number }, readTail: () => { passwordMin: number; preventNegativeTreasury: boolean; approvalPayments: boolean; allowSelfApproval: boolean }): Fail | Done {
        d.authorization.require('settings', 'edit');
        const { baseCurrency: b, fiscalMonth: sm } = readHead(), s = d.repository.settings();
        if (d.repository.journals().length && b !== s.baseCurrency)
            return { ok: false, error: 'لا يمكن تغيير العملة الأساسية بعد وجود قيود' };
        if (d.repository.periods().some(p => p.status === 'closed') && sm !== d.numbers.N(s.fiscalYearStartMonth))
            return { ok: false, error: 'لا يمكن تغيير بداية السنة بعد إغلاق فترات' };
        s.baseCurrency = b;
        const fiscalChanged = sm !== d.numbers.N(s.fiscalYearStartMonth);
        s.fiscalYearStartMonth = sm;
        if (fiscalChanged && !d.repository.journals().length && !d.repository.periods().some(p => p.status === 'closed')) {
            d.calendar.reset();
            d.calendar.ensureDate(d.clock.today());
        }
        const t = readTail();
        s.passwordMin = t.passwordMin;
        s.preventNegativeTreasury = t.preventNegativeTreasury;
        s.approvalPayments = t.approvalPayments;
        s.allowSelfApproval = t.allowSelfApproval;
        for (const c of d.repository.currencies())
            c.base = c.code === b;
        d.persistence.save();
        return { ok: true };
    },
    saveNotificationPrefs(d: ReportSettingsDeps, read: () => { passportDays: number; invoiceDueDays: number; programDays: number; lowTreasuryAmount: number; activityRetentionDays: number }): void {
        d.authorization.require('settings', 'edit');
        const p = d.repository.ensureNotificationPrefs(), v = read();
        p.passportDays = v.passportDays;
        p.invoiceDueDays = v.invoiceDueDays;
        p.programDays = v.programDays;
        p.lowTreasuryAmount = v.lowTreasuryAmount;
        d.repository.settings().activityRetentionDays = v.activityRetentionDays;
        d.persistence.save();
    },
    saveNumbering(d: ReportSettingsDeps, read: () => Array<[string, string]>): void {
        d.authorization.require('settings', 'edit');
        for (const [prefix, value] of read())
            d.repository.settings().prefixes[prefix] = value;
        d.persistence.save();
    },
    saveAppearancePrint(d: ReportSettingsDeps, read: () => AppearanceInput): void {
        d.authorization.require('settings', 'edit');
        const s = d.repository.settings(), v = read();
        s.appearance = v.appearance;
        s.accentColor = v.accentColor;
        s.animations = v.animations;
        s.fontScale = v.fontScale;
        s.fontFamily = v.fontFamily;
        s.printAmountWords = v.printAmountWords;
        s.printSignatures = v.printSignatures;
        s.printFooter = v.printFooter;
        s.printPaper = v.printPaper;
        s.printOrientation = v.printOrientation;
        d.persistence.save();
    },
    async importBackup(d: ReportSettingsDeps, file: unknown): Promise<void> {
        d.authorization.require('settings', 'edit');
        await d.persistence.importBackup(file);
    }
};
export { ReportSettingsCommands, ReportSettingsQueries };
export type { ReportSettingsDeps };
