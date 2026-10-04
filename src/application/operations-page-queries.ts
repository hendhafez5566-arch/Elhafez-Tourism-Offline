interface OperationsPageDeps {
    repository: { collection(name: string): any };
    settings: { baseCurrency(): string };
}
/* Read side of the operations pages: raw live collections read at call time, so the pages keep their original behaviour when a collection is missing. */
const OperationsPageQueries = {
    collection: (d: OperationsPageDeps, name: string) => d.repository.collection(name),
    baseCurrency: (d: OperationsPageDeps) => d.settings.baseCurrency()
};
export { OperationsPageQueries };
export type { OperationsPageDeps };
