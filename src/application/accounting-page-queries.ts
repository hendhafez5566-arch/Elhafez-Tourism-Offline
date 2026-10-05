/* Fields the accounting pages read with a known type (same assumption the pages made when records were `any`); every other field of a stored record stays `unknown` (no `any`). */
interface CollectionRecord {
    id: string;
    status: string;
    type: string;
    size: number;
    [field: string]: unknown;
}
interface AccountingPageDeps {
    repository: { collection(name: string): CollectionRecord[] };
    settings: { baseCurrency(): string };
}
/* Read side of the accounting pages: raw live collections read at call time, so the pages keep their original behaviour when a collection is missing. */
const AccountingPageQueries = {
    collection: (d: AccountingPageDeps, name: string) => d.repository.collection(name),
    baseCurrency: (d: AccountingPageDeps) => d.settings.baseCurrency()
};
export { AccountingPageQueries };
export type { AccountingPageDeps };
