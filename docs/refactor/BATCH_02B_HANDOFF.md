# BATCH_02B Handoff — Architecture Guardrails (Ratchet)

- Branch: `clean-checkpoint-reconstruction-fa029`
- Baseline checkpoint SHA: `26cb63d6f93e928bbcaaa84bdbda6d3eaf3cb071`
- Scope: guardrails ONLY. **No source behavior changed** (`src/**`,
  `server/src/**`, `tests/**` untouched). No refactor performed.
- Gate: `npm run architecture:check` (read-only ratchet), composed into
  `npm run refactor:full-check`.
- Data: `docs/refactor/architecture-baseline.json` (identity = file path +
  rule id + occurrence count; never line numbers).
- Contract: `docs/refactor/ARCHITECTURE_BOUNDARIES.md`.

## Exact baseline counts (measured at START HEAD, not from old docs)

| Rule | Description | Total occurrences | Files |
|---|---|---|---|
| ARCH001 | Direct DB global access from UI/presentation code | 417 | 10 |
| ARCH002 | UI globals (UI/Pages/toast) from persistence/core/domain/security/support | 243 | 28 |
| ARCH003 | Auth global coupling outside src/security/** and bootstrap | 277 | 24 |
| ARCH004 | Monkey-patching reassignment of UI./DB./Auth. members | 67 | 9 |
| ARCH005 | window/globalThis mutation in src/** | 274 | 17 |
| ARCH006 | Forbidden cross-layer upward dependency hotspots | 496 | 37 |
| **TOTAL** | grandfathered violations | **1774** | |

Measurement notes: comments and string/template bodies (except `${...}`
interpolations) are stripped before matching; assignment forms (`X.y =`) are
excluded from usage rules (they belong to ARCH004/ARCH005).

## Top hotspot files (per rule)

- ARCH001: `src/ui/actions.ts` 195 · `src/ui/forms-definitions.ts` 70 ·
  `src/ui/forms.ts` 51 · `src/ui/pages.ts` 34 · `src/ui/clean-pages.ts` 25
- ARCH002: `src/commercial/actions.ts` 62 · `src/security/auth.ts` 21 ·
  `src/core/umrah/program-wizard.ts` 20 · `src/crm/party360.ts` 18 ·
  `src/commercial/pages.ts` / `src/core/umrah/ui.ts` 14 each
- ARCH003: `src/ui/actions.ts` 108 · `src/ui/clean-pages.ts` 43 ·
  `src/crm/party360.ts` 16 · `src/accounting/transactions.ts` 14 ·
  `src/commercial/product.ts` 12
- ARCH004: `src/ui/ui.ts` 34 · `src/ui/commercial-ux.ts` 11 ·
  `src/mobile.ts` 9 · `src/ui/data-table.ts` 6 · `src/security/auth.ts` 3
- ARCH005: `src/ui/actions.ts` 98 · `src/commercial/actions.ts` 40 ·
  `src/ui/ui.ts` 38 · `src/ui/forms.ts` 32 · `src/crm/party360.ts` /
  `src/crm/unified-party.ts` 15 each
- ARCH006 (upward edges): `src/security/auth.ts` 75 ·
  `src/commercial/actions.ts` 66 · `src/core/umrah/integration.ts` 49 ·
  `src/core/umrah/data.ts` 43 · `src/crm/party360.ts` 34

Aggregate worst files across all rules: `src/ui/actions.ts`,
`src/commercial/actions.ts`, `src/crm/party360.ts`, `src/ui/ui.ts`,
`src/security/auth.ts`.

## What is currently grandfathered

All 1774 recorded occurrences above: legacy globals (`UI`, `DB`, `Auth`,
`Pages`, `toast`), manual script ordering via the tsconfig `files` list,
direct `DB.data` reads/writes inside UI, persistence→UI callbacks
(e.g. `UI.renderCurrent` from browser-store), Auth checks scattered through
features, monkey patches that extend `UI` post-definition, and
`(window as any).*` bridge registrations (Capacitor/NativeShell/ERP_MOBILE).
These are tolerated AS-IS at exactly these per-file counts.

## What future batches are FORBIDDEN to introduce

The ratchet fails the gate on ANY of:

1. A new occurrence of any rule in a file already violating that rule
   (count increase per file/rule).
2. A rule violation appearing in a file that had zero for that rule in the
   baseline (new violating file).
3. New globals, new monkey patches (`UI.x =`, `(UI as any).x =`, `DB.x =`,
   `Auth.x =`), new `window`/`globalThis` mutations.
4. New upward dependencies: persistence→UI, core/domain→presentation,
   feature-domain→security/UI, support→UI/Auth.
5. Re-baselining UPWARD. Only downward re-baselines (after real removals)
   are legitimate.

Refactoring may only reduce counts; every reduction permanently lowers the
ceiling for that file/rule.

## Recommended first extraction target

`src/ui/actions.ts` — it is the single largest hotspot (195 ARCH001 + 108
ARCH003 + 98 ARCH005 occurrences). Natural first slice: extract the
document-action handlers (receipt/payment/invoice/quotation/PO operations)
into an application-layer use-case module with explicit dependencies on a
persistence adapter, keeping `Actions.*` as a thin delegating facade so no
runtime behavior changes. Secondary candidate: `src/commercial/actions.ts`
(modal-rendering logic separated from orchestration).

## Verification summary

- Precheck: HEAD == expected SHA, working tree clean, node_modules untracked.
- Existing regression gate before changes: CLIENT PASS / SERVER PASS /
  NODE TOTAL 60 / PASS 43 / NEW REGRESSIONS 0 / DRIFT NO / EXIT 0.
- Ratchet self-test: injected `UI.__b02bSelfTestMonkeyPatch = ...` and
  `window.__b02bSelfTestGlobal = 1` into `src/ui/work-center.ts` →
  ARCHITECTURE CHECK FAIL (exit 1, flagged both as NEW FILE violations);
  injection reverted fully → PASS again. No test injection left in git.
- Final `npm run refactor:full-check`: all green, EXIT 0.
- Source files changed: NONE. Files added: this doc,
  `ARCHITECTURE_BOUNDARIES.md`, `architecture-baseline.json`,
  `scripts/architecture-check.mjs`; `package.json` gained exactly two scripts.
