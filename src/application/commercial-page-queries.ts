interface CommercialRecord {
    id: string; no?: string; name?: string; code?: string; phone?: string; address?: string; active?: boolean; allowedBranchIds?: string[]; type?: string; date?: string; fileName?: string; added?: number; skipped?: number; branchId?: string; status?: string; role?: string; permissions?: { all?: boolean; [key: string]: unknown }; currency?: string; [field: string]: unknown;
}
interface CommercialCompany { companyId?: string; name?: string; phone?: string; email?: string; logo?: unknown; taxNo?: string; commercialNo?: string; [field: string]: unknown }
interface CommercialSettings { baseCurrency: string; printFooter?: string; [field: string]: unknown }
interface CommercialLicense { edition?: string; status?: string; mode?: string; [field: string]: unknown }
interface CommercialRoot {
    meta?: { lastArchivedThrough?: string }; company?: CommercialCompany; settings: CommercialSettings; license?: CommercialLicense; treasuries?: CommercialRecord[]; umrahPrograms?: CommercialRecord[]; programs?: CommercialRecord[]; users?: CommercialRecord[]; branches?: CommercialRecord[]; auditLog?: CommercialRecord[]; [field: string]: unknown;
}
interface CommercialPageDeps {
    repository: { root(): CommercialRoot; collection(name: string): CommercialRecord[] };
    settings: { baseCurrency(): string };
}
/* Read side of the commercial pages: raw live values read at call time, so the pages keep their original behaviour when a part of the store is missing. */
const CommercialPageQueries = {
    root: (d: CommercialPageDeps) => d.repository.root(),
    collection: (d: CommercialPageDeps, name: string) => d.repository.collection(name),
    baseCurrency: (d: CommercialPageDeps) => d.settings.baseCurrency()
};
export { CommercialPageQueries };
export type { CommercialPageDeps };
