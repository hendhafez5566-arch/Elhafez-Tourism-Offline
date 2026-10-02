# Measured dependency hotspots

Counts are rule findings, not unique runtime dependencies; a reference may legitimately count under more than one rule.

| File | Findings |
|---|---:|
| `src/ui/actions.ts` | 310 |
| `src/commercial/actions.ts` | 136 |
| `src/crm/party360.ts` | 108 |
| `src/ui/pages.ts` | 97 |
| `src/ui/clean-pages.ts` | 76 |
| `src/ui/forms-definitions.ts` | 76 |
| `src/ui/ui.ts` | 66 |
| `src/ui/forms.ts` | 65 |
| `src/crm/unified-party.ts` | 39 |
| `src/mobile.ts` | 36 |
| `src/ui/commercial-ux.ts` | 30 |
| `src/persistence/browser-store.ts` | 23 |
| `src/commercial/product.ts` | 22 |
| `src/core/umrah/data.ts` | 20 |
| `src/accounting/advanced-pages.ts` | 18 |

Examples inspected: DB.save couples persistence to Commercial.beforeSave/UI.scheduleRender/toast; ServerStore._requireLogin invokes Auth; Accounting.rerunIntegrity renders UI and emits toast. Umrah integration and browser-store patch public globals. Pages and forms directly access DB and Auth. Preserve manual tsconfig ordering until Phase 2 establishes explicit boundaries.

Corrected domain classification includes CRM/commercial; ARCH004 counts direct API-member mutations only. Counts: {"ARCH001": 493, "ARCH002": 151, "ARCH003": 363, "ARCH004": 68, "ARCH005": 11, "ARCH006": 169, "TOTAL": 1255}.
