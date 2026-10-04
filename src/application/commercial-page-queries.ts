interface CommercialPageDeps {
    repository: {
        /* The live store root, read at call time (it can be null/undefined, so callers keep their own optional chaining). */
        root(): any;
        collection(name: string): any;
    };
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
