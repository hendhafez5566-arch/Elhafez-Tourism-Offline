# Test Baseline — Node Smoke Suite (B00)

- **Recorded at:** `e97fa6d9cb52acb22b676e1b975c1b2332bc9a13` (v32.5.66), 2026-10-03
- **Runner:** `node scripts/all-node-smokes.mjs` (discovers all `scripts/*-smoke.mjs`)
- **Command used for recording:** `npm ci && node scripts/all-node-smokes.mjs`

## Totals (actual, verified by execution)

| Metric | Value |
|---|---|
| NODE TOTAL | **60** |
| NODE PASS | **43** |
| NODE FAIL | **17** |
| Runner summary line | `Node smoke summary: 43/60 passed` |

## Classification of the 17 failures

### A. Expected pre-existing failures — 15
Functional/assertion failures that exist on `main` before any refactor work. They are
accepted as the baseline; they must neither grow nor change identity. If one later
passes, that is a BASELINE IMPROVEMENT (not a regression).

| # | Test file | Gate key |
|---|---|---|
| 1 | `scripts/android-connectivity-smoke.mjs` | android-connectivity |
| 2 | `scripts/brand-asset-smoke.mjs` | brand-asset |
| 3 | `scripts/commercial-smoke.mjs` | commercial |
| 4 | `scripts/contracts-inventory-smoke.mjs` | contracts-inventory |
| 5 | `scripts/data-protection-smoke.mjs` | data-protection |
| 6 | `scripts/unified-more-cleanup-smoke.mjs` | unified-more-cleanup |
| 7 | `scripts/v32470-regression-smoke.mjs` | v32470-regression |
| 8 | `scripts/v32472-accounting-lifecycle-smoke.mjs` | v32472-accounting-lifecycle |
| 9 | `scripts/v32481-mobile-ux-action-policy-smoke.mjs` | v32481-mobile-ux-action-policy |
| 10 | `scripts/v32483-mobile-refresh-compact-filters-smoke.mjs` | v32483-mobile-refresh-compact-filters |
| 11 | `scripts/v32485-filter-refresh-font-smoke.mjs` | v32485-filter-refresh-font |
| 12 | `scripts/v32510-operations-execution-split-smoke.mjs` | v32510-operations-execution-split |
| 13 | `scripts/v32511-entity-backed-read-smoke.mjs` | v32511-entity-backed-read |
| 14 | `scripts/v32512-entity-backed-write-smoke.mjs` | v32512-entity-backed-write |
| 15 | `scripts/v32565-party-transactions-report-smoke.mjs` | v32565-party-transactions-report |

(Exit codes observed: mostly 1; `brand-asset` exits 9; `v32565-party-transactions-report` exits 3.)

### B. Known structural failures — 2
Both fail with `ENOENT: no such file or directory, open '<root>/mobile-customer/index.html'`
because `mobile-customer/` (the customer-package output tree) does not exist in this
repository snapshot. This is a historical structural inconsistency of the offline copy,
not a code defect introduced by the refactor.

| # | Test file | Gate key | Cause |
|---|---|---|---|
| 1 | `scripts/customer-parity-smoke.mjs` | customer-parity | `mobile-customer/index.html` missing |
| 2 | `scripts/mobile-android-smoke.mjs` | mobile-android | reads `mobile-customer/index.html` for parity check — same missing file |

## Rules for the regression gate (B01B)

1. Failures outside the 17 keys above ⇒ **NEW REGRESSION** ⇒ exit ≠ 0.
2. Total discovered tests ≠ 60 ⇒ **TEST SUITE DRIFT** ⇒ exit ≠ 0.
3. A test listed as expected/known failure now passing ⇒ **BASELINE IMPROVEMENT** (allowed, exit 0, logged).
4. Client build and server build must PASS.
5. Existing tests are never modified to make the gate pass.
