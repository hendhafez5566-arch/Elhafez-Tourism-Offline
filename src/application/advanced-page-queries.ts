interface AdvancedPageDeps {
    repository: { collection(name: string): any };
}
/* Read side of the advanced accounting pages: raw live collections read at call time, so the pages keep their original behaviour when a collection is missing. */
const AdvancedPageQueries = {
    collection: (d: AdvancedPageDeps, name: string) => d.repository.collection(name)
};
export { AdvancedPageQueries };
export type { AdvancedPageDeps };
