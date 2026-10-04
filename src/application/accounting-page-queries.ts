interface AccountingPageDeps {
    repository: { collection(name: string): any };
    settings: { baseCurrency(): string };
}
/* Read side of the accounting pages: raw live collections read at call time, so the pages keep their original behaviour when a collection is missing. */
const AccountingPageQueries = {
    collection: (d: AccountingPageDeps, name: string) => d.repository.collection(name),
    baseCurrency: (d: AccountingPageDeps) => d.settings.baseCurrency()
};
export { AccountingPageQueries };
export type { AccountingPageDeps };
