# VERIFICATION_STRATEGY — Refactor Regression Gate (B01B)

- **Repo:** hendhafez5566-arch/Elhafez-Tourism-Offline
- **Gate command:** `npm run refactor:check` → `node scripts/refactor-check.mjs`
- **Baseline record:** `docs/refactor/refactor-baseline.json` (version 1, recorded 2026-10-03 at start SHA `e97fa6d9cb52acb22b676e1b975c1b2332bc9a13`)
- **Detailed failure classification:** `docs/refactor/TEST_BASELINE.md`

## Official baseline numbers

| Metric | Value |
|---|---|
| CLIENT BUILD | PASS |
| SERVER TS BUILD | PASS (after B01A types-only fix in `server/src/server.ts`) |
| NODE TOTAL | 60 (`scripts/*-smoke.mjs`) |
| NODE PASS | 43 |
| Expected pre-existing failures | 15 |
| Known structural failures | 2 (`customer-parity`, `mobile-android` — missing `mobile-customer/index.html`) |

The 15 expected pre-existing failure keys:
android-connectivity, brand-asset, commercial, contracts-inventory,
data-protection, unified-more-cleanup, v32470-regression,
v32472-accounting-lifecycle, v32481-mobile-ux-action-policy,
v32483-mobile-refresh-compact-filters, v32485-filter-refresh-font,
v32510-operations-execution-split, v32511-entity-backed-read,
v32512-entity-backed-write, v32565-party-transactions-report

## What the gate does

1. **Client build** — `tsc -p tsconfig.json` followed by `node scripts/copy-static.mjs` (the client legs of `npm run build`).
2. **Server TypeScript build** — `tsc -p server/tsconfig.json --noEmit`.
   `--noEmit` is deliberate: the server output tree (`server/dist/**`) is currently
   tracked generated output; the gate must type-check without rewriting tracked files.
3. **Node smoke suite** — every `scripts/<key>-smoke.mjs` executed individually (60 tests), exit code 0 = pass.
4. **Comparison against `refactor-baseline.json`.**

## Classification rules

| Situation | Verdict | Effect on exit code |
|---|---|---|
| Baseline-known failure still failing | KNOWN BASELINE FAILURE | none (allowed) |
| Baseline-known failure now passing | **BASELINE IMPROVEMENT** | none (allowed, logged) |
| A test not listed in the baseline fails | **NEW REGRESSION** | exit ≠ 0 |
| A baseline-known test file disappeared | **TEST SUITE DRIFT** | exit ≠ 0 |
| Discovered test count ≠ baseline `nodeTotal` (test added/renamed) | **TEST SUITE DRIFT** | exit ≠ 0 |
| Client or server build fails | GATE FAIL | exit ≠ 0 |

**Exit 0 requires all of:** CLIENT PASS ∧ SERVER PASS ∧ NO NEW REGRESSION ∧ NO TEST SUITE DRIFT.
Known baseline failures alone never fail the gate.

## Invariants

- The gate never modifies source code, tests, or the baseline file.
- Existing tests are never edited to make the gate pass. If a genuine improvement
  makes an expected failure pass, that is recorded as a BASELINE IMPROVEMENT and
  the baseline may only be re-recorded explicitly by the manager (new batch).
- `npm ci` must run cleanly before the gate; `.gitignore` keeps `node_modules/`
  untracked so dependency installation never contaminates the Git working tree.
