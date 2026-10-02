# Measured dependency hotspots

Counts are rule findings, not unique runtime dependencies; a reference may legitimately count under more than one rule.

| File | Findings |
|---|---:|
| `src/ui/actions.ts` | 335 |
| `src/ui/pages.ts` | 97 |
| `src/ui/clean-pages.ts` | 77 |
| `src/ui/forms-definitions.ts` | 77 |
| `src/ui/ui.ts` | 66 |
| `src/ui/forms.ts` | 65 |
| `src/mobile.ts` | 36 |
| `src/ui/commercial-ux.ts` | 32 |
| `src/accounting/transactions.ts` | 26 |
| `src/core/umrah/data.ts` | 26 |
| `src/persistence/browser-store.ts` | 23 |
| `src/commercial/product.ts` | 22 |
| `src/accounting/advanced-pages.ts` | 18 |
| `src/commercial/pages.ts` | 18 |
| `src/crm/party360.ts` | 18 |

Examples inspected: DB.save couples persistence to Commercial.beforeSave/UI.scheduleRender/toast; ServerStore._requireLogin invokes Auth; Accounting.rerunIntegrity renders UI and emits toast. Umrah integration and browser-store patch public globals. Pages and forms directly access DB and Auth. Preserve manual tsconfig ordering until Phase 2 establishes explicit boundaries.
