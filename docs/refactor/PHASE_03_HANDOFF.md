# Phase 03 — Business Logic Refactor handoff

PHASE: 3 / 5
BRANCH: phase-3-business-logic-refactor-work
START SHA: b6569036062b5b2c775631face10c06dcdc9a2e5
FINAL SHA: the containing published commit (resolve the branch HEAD); the execution report records its exact SHA. A commit cannot embed its own hash.
COMMIT MESSAGE: refactor: isolate business domain workflows

PRODUCTION BUSINESS BEHAVIOR INTENTIONALLY CHANGED: NO
ACCOUNTING POLICY CHANGED: NO
DB SCHEMA CHANGED: NO
MIGRATIONS ADDED: NO
UI/UX INTENTIONALLY CHANGED: NO
EXISTING SMOKE TESTS MODIFIED: NO

## Start validation and domain inspection

The existing remote branch was verified at the required SHA, then checked out locally without creating another remote branch. The clean starting tree and all baseline numbers were confirmed before client edits: application 154 PASS; Node 60/43/15 known baseline failures/2 known structural failures/0 regressions/no suite drift; architecture 430/145/306/68/11/163 = 1123, no new violations. See PHASE_03_DOMAIN_MAP.md for the actual seven-domain source map, status/validation/authorization/persistence/UI/accounting dependencies.

No experimental branch, merge, cherry-pick or replacement framework was used. The Phase 2 contracts, document-actions, commercial-actions and composition strategy remain intact. The original module:none/outFile/manual files order remains; new pure values, contracts, rules and use-case definitions precede consumers. Composition functions are hoisted declarations; the PO fulfillment facade can initialize before bootstrap executes without consuming an undefined rule/clock symbol.

## Domain work and evidence

| Domain | Business boundary introduced | Compatibility and parity evidence |
|---|---|---|
| CRM / Commercial | Lead creation/update/conversion, followup creation/update/removal and lead removal; quotation creation/edit/remove/accept/convert use cases; quotation lifecycle restrictions | CRM facade and original linked-PO patches retained; differential lead/followup and quotation lifecycle/error/record cases |
| Tourism | Service confirmation coordinates sale invoice, external supplier invoice and commission; service/booking complete/reopen rules and use cases | Transactions API, original invoice account choices, transaction label and operation order retained; customer/supplier billing and failed-confirmation rollback parity |
| Procurement / Suppliers | PO create/edit/remove/approve/receive/void/convert use cases; injected fulfillment rules own quantity normalization, received/invoiced status, rollback and linkage; supplier financial paths reuse voucher/invoice/journal rules | CRM/PO public APIs and existing conversion patch timing retained; partial fulfillment, supplier invoice cancellation/reconversion, Umrah void restriction, forced contract advances and supplier cancellation settlement parity |
| Hajj / Umrah | Program and booking status use cases, transition tables, gross pricing, discount policy, new-sale constraints and payment-status rules | Original authorization location preserved: program authorization inside atomic, booking authorization before atomic. Procurement commitment/status hooks and inventory release retain order/options. Program/booking transitions, discount errors and financial payment/contract-advance paths compared |
| Finance / Accounting | Receipt/payment and expense use cases; approval-before-treasury/allocation mutation; pure voucher debit/credit/FX rules; invoice line math/posting and lifecycle coordination; common journal normalization/reversal; manual/recurring journal and transfer use cases; depreciation/prepaid/loan/payroll arithmetic | One journal engine and one rule implementation; no new account policy, schema or numbering. Exact journal objects/lines, tax snapshots, currency/base amounts, references, document states and linked IDs compared for receipt, payment, invoice post/cancel, manual journal/reversal, FX transfer, supplier and tourism financial flows |
| Reports / Control | P&L, aging/overdue, balances, program profit/commitment query rules take explicit ledger/metrics/money ports; integrity rerun/safe repair use cases emit completion events | Existing HTML/PDF/export remains. Differential query results include filters/totals/remaining values; ledger query order retained. Report party naming no longer calls Actions |
| Administration | Branch creation/edit orchestration; allowed branches, last-active/stranded-user rules, cost/discount permissions; approval create/approve/reject use cases; party netting authorization/transaction/persistence boundary and pair/amount rules | Commercial/Approvals/UnifiedParty APIs retained. Authorization denial, self-approval, branch stranding, approval/payment sequencing, netting allocation/reversal and strict transaction failure propagation compared |

## Ports and adapters

business-contracts.ts contains explicit record shapes and the ports actually consumed: live repositories, clock/identity/numbering, actor and authorization, transactions, money/tax/ledger, invoice/voucher/procurement operations, branch selection and completion events. No new explicit or implicit any or suppressions in new seams. A standalone TypeScript noImplicitAny check and forbidden-ambient identifier/any/suppression AST checks are part of the business checker.

src/bootstrap.ts remains the single explicitly documented legacy composition point. Existing globals are adapted there using typed closures and live getters; no alternate DB, mirrored state, new global registration or monkey patch. Captured repositories read DB.data after replacement/rollback rather than retaining its old arrays. Adapter-only presentation notifications (payment approval, integrity completion) are effects, not business decisions. Branch preference persistence stays infrastructure. Existing modified legacy modules remain compatibility facades/adapters for their unextracted internals; they are not claimed globally clean.

The historical CRM source-presence smoke requires its actual edit policy call to remain in crm.ts. Quotation/PO facade closures therefore supply the original typed policy call to the use case; it is executed once after record lookup, before field validation, at its original point. No test or baseline was changed to satisfy this requirement.

## Semantic timing review

Synchronous receipt/payment/expense/journal/transfer/Umrah paths remain synchronous; netting async facades retain Promise behavior. Approval checks remain before mutation and retain lazy actor/setting/amount evaluation. Form modal-close/save sequencing and the Phase 2 fast path are untouched. Invoice tax snapshots, credit-limit check, post, status, pending advances, refresh, optional deferral, document and audit remain in original order. Reversal still marks the source before reverse posting where legacy did. The original rollback/strict/waitForSave options and labels are retained. Business comparisons capture state/effects before the first await as well as final results, rejection messages and ordered calls.

## Architecture measurement

| Rule | Before | After |
|---|---:|---:|
| ARCH001 | 430 | 426 |
| ARCH002 | 145 | 141 |
| ARCH003 | 306 | 272 |
| ARCH004 | 68 | 68 |
| ARCH005 | 11 | 11 |
| ARCH006 | 163 | 156 |
| TOTAL | 1123 | 1074 |

49 fewer ratchet findings (4.4%); NEW ARCHITECTURE VIOLATIONS = 0. No checker change and no baseline reset. Rule/file/normalized-signature matching and its identical-occurrence identity limitations remain unchanged.

The ratchet does not count domain DB reads as ARCH001 (presentation-only), so the actual extraction is larger than that metric: across the ten changed legacy business files, syntactic reference counts are DB 696 → 510 (186 fewer), Auth 44 → 10 (34 fewer), Actions 4 → 1, UI 12 → 11, toast 10 → 7. New seams have no ambient dependencies. These are syntactic references, not unique runtime calls, and exclude the explicitly designated composition root. Remaining presentation debt is visible, not reclassified. Transactions, CRM, journal engine, commercial product, unified party and financial query hotspots were reduced; advanced accounting uses extracted shared posting rules without a broad rewrite of its remaining coordinators.

## Verification

- npm ci: PASS.
- application-workflow-check.mjs: PASS 154, existing file unchanged.
- business-workflow-check.mjs: PASS 1172 assertions / 142 scenarios / 46 successful accounting scenarios. It reads approved Phase 2 source directly using git show, executes it and current code in separate VM contexts, and compares return/error, sync/Promise behavior, immediate/final state, ordered authorization/persistence/transactions and complete journal/record shapes. Successful cases must actually succeed; matching unexpected fixture errors cannot be counted as PASS.
- Accounting parity: PASS for the representative cases above, including realized FX, base-only reversal, tax/discount/rounding matrices, supplier contract advance, tourism sale/supplier billing, and netting. All posting paths (including advanced deferrals/accruals/provisions/assets/loans/payroll/opening balances) share JournalRules. The checks do not assert exhaustive accounting policy coverage for every remaining legacy coordinator.
- Client and server TypeScript builds: PASS. New seam noImplicitAny diagnostics: 0.
- refactor:check: Node TOTAL 60 / PASS 43 / known baseline failures 15 / structural failures 2 / NEW REGRESSIONS 0 / TEST SUITE DRIFT NO. Relevant accounting, advanced accounting, constitution, cancellation, unified-party and Umrah domain smokes are included in this unchanged pinned suite. No baseline improvement was claimed.
- architecture:check: PASS, counts above, no new violations.
- Browser: ENVIRONMENT BLOCKER. Compatible Chrome/Chromium executable scan found none; the six existing browser scripts still fail at launch because Playwright's Chromium executable is absent. No installation retries, packages, binaries, environment files or browser-test changes in this phase. No browser functional PASS claimed.

## Review, generated artifacts and cleanup

Entire changed-file set and extracted method boundaries reviewed. Existing HTML/template literals, CSS, Android/native code, server schema/migrations, pinned smoke sources, package/lock, Phase 1 architecture and refactor baselines and .gitignore are unchanged. No duplicate business implementation or Phase 4 cleanup campaign. dist/app.js and server/dist/server.js generated for validation are restored under GENERATED_ARTIFACT_POLICY.md; this commit is not a generated distribution/Android release. Build before running the source changes.

After the last npm/test command, node_modules and server/node_modules are deleted and absence/tracked-zero verified. No npm afterward. The coherent commit is published only to the existing Phase 3 branch and remote commit/tree/diff is verified against the start SHA.

## Limits and Phase 4 debt

Browser/native behavior was preserved by source scope, unchanged tests and Node gates; real-browser acceptance remains blocked. Differential execution uses deterministic clocks and fake transaction/infrastructure services; it is not a live server/database rollback test. Remaining legacy workflows and optional ERP integrations continue through the same infrastructure adapters; no claim that every legacy god-object/global has disappeared. Advanced coordinator internals, party relationship/query adapters, detailed capacity/inventory implementation and report rendering remain legacy behind the tested shared boundaries. No intentional business-policy change.

Phase 4 entry points: presentation glue in Party360/UnifiedParty, remaining UI/global consumers and monkey patches, bootstrap wiring/platform cleanup, Forms/Pages and report rendering boundaries. Preserve the extracted business/use-case ports and all three gates. No Phase 4 implementation begun.

## Added files

- `docs/refactor/PHASE_03_DOMAIN_MAP.md`
- `scripts/business-workflow-check.mjs`
- `src/accounting/advanced-rules.ts`
- `src/accounting/expense-rules.ts`
- `src/accounting/invoice-rules.ts`
- `src/accounting/journal-rules.ts`
- `src/accounting/manual-journal-rules.ts`
- `src/accounting/voucher-rules.ts`
- `src/application/approval-workflows.ts`
- `src/application/branch-workflows.ts`
- `src/application/business-contracts.ts`
- `src/application/crm-leads.ts`
- `src/application/expense-workflows.ts`
- `src/application/integrity-workflows.ts`
- `src/application/invoice-workflows.ts`
- `src/application/manual-journal-workflows.ts`
- `src/application/netting-workflows.ts`
- `src/application/purchase-workflows.ts`
- `src/application/quotation-workflows.ts`
- `src/application/tourism-workflows.ts`
- `src/application/transfer-workflows.ts`
- `src/application/umrah-lifecycle-workflows.ts`
- `src/application/voucher-workflows.ts`
- `src/commercial/administration-rules.ts`
- `src/commercial/branch-rules.ts`
- `src/core/business-values.ts`
- `src/core/tourism-rules.ts`
- `src/core/umrah/business-rules.ts`
- `src/crm/commercial-lifecycle-rules.ts`
- `src/crm/lead-rules.ts`
- `src/crm/party-business-rules.ts`
- `src/crm/purchase-fulfillment-rules.ts`
- `src/finance/query-rules.ts`
- `docs/refactor/PHASE_03_HANDOFF.md`

## Modified files

- `src/accounting/advanced.ts`
- `src/accounting/engine.ts`
- `src/accounting/invoices.ts`
- `src/accounting/transactions.ts`
- `src/bootstrap.ts`
- `src/commercial/product.ts`
- `src/core/umrah/operations.ts`
- `src/crm/crm.ts`
- `src/crm/purchase-order-fulfillment.ts`
- `src/crm/unified-party.ts`
- `src/finance/insights.ts`
- `src/ui/actions.ts`
- `tsconfig.json`
- `docs/refactor/ARCHITECTURE_BOUNDARIES.md`

FINAL STATUS: PHASE 3 READY FOR REVIEW, with the documented browser environment blocker.
