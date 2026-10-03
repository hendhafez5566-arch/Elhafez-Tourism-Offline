# Phase 02 — Core Decoupling handoff

PHASE: 2 / 5
BRANCH: phase-2-core-decoupling-work (already existing; no alternate branch created)
START SHA: 4b188965931d396f40b0b545b486e97da12462b8
FINAL COMMIT SHA: resolve the published branch HEAD; the exact hash is in the execution final report. The containing commit cannot embed its own SHA without changing that SHA.
IMPLEMENTATION COMMIT MESSAGE: refactor: decouple core application workflows
FINAL CORRECTIVE COMMIT MESSAGE: fix: preserve synchronous form submission timing

PRODUCTION BUSINESS BEHAVIOR INTENTIONALLY CHANGED: NO
DB SCHEMA CHANGED: NO
MIGRATIONS ADDED: NO
UI/UX INTENTIONALLY CHANGED: NO
EXISTING TESTS MODIFIED: NO

## Start and scope evidence

GitHub branch HEAD was verified against the expected SHA before editing. Local clean tree checked. Only the current Phase 1 source was used; no experimental branch copied/merged/cherry-picked. Phase 1 architecture gate passed at exactly 1255 findings. Node gate before modification measured exactly 60 / 43 PASS / 15 baseline failure / 2 structural failure, no new regressions, no suite drift, six browser environment blockers.

Both target files were read in full: ui/actions.ts (57 lines, 75,214 bytes) and commercial/actions.ts (40 lines, 22,197 bytes). Source inspection showed receipts/payments are submitted via forms.ts/forms-definitions.ts, not standalone create methods in Actions; invoice and quotation/PO creation/edit are also in those form callbacks. The supporting form changes remove their actual transaction/persistence decisions into the application boundary instead of inventing unrelated Actions APIs.

## Added files

- `src/application/contracts.ts`
- `src/application/document-actions.ts`
- `src/application/commercial-actions.ts`
- `src/ui/commercial-action-views.ts`
- `scripts/application-workflow-check.mjs`
- `docs/refactor/PHASE_02_HANDOFF.md`

## Modified files

- `src/bootstrap.ts`
- `src/ui/actions.ts`
- `src/ui/forms.ts`
- `src/ui/forms-definitions.ts`
- `src/commercial/actions.ts`
- `tsconfig.json`
- `scripts/architecture-check.mjs`
- `docs/refactor/ARCHITECTURE_BOUNDARIES.md`

## Seams and extracted orchestration

application/contracts.ts defines actual authorization, atomic/async/fast transaction, persistence/audit, document repositories, named domain-operation, clock and commercial activity/branch/user ports. Field payloads use Record<string,unknown>; no new any, suppression, eval or ambient-global references in application code. Ports reference the existing live model, not a duplicate database.

The sole legacy composition location is existing src/bootstrap.ts: composeLegacyActionDeps and composeLegacyCommercialDeps. This intentionally remains the global wiring boundary and is not counted as a domain/presentation global consumer. Factories use existing DB/Auth/domain objects through explicit typed ports and preserve method receivers via closures. They never mutate/register a public global, create another state store or copy business implementations. Factories are hoisted declarations; application files initialize after runtime.ts and before consumers in the manual module-none tsconfig order. bootstrap's original boot sequence follows unchanged. These factories create lightweight adapters on demand so rollback/replacement of DB.data is read live on the next operation.

48 public document facade operations now prepare authorization and deferred/synchronous transactions through DocumentWorkflows (47 straightforward named commands plus invoice posting). Authorization still occurs before opening confirmation/reason dialogs, not after user confirmation. The prepared closures retain original transaction labels, targets, arguments and the legacy callback timing. Nonpresentation business implementations remain in Transactions/Invoices/CRM/etc; they were not copied or redesigned.

Named commands extracted:

removeProgram, confirmBooking, completeBooking, reopenBooking, cancelBooking, confirmService, completeService, reopenService, cancelService, deleteService, voidReceipt, voidPayment, reverseInvoiceAdjustment, cancelInvoice, deleteExpense, voidExpense, recognizePrepaid, reversePrepaid, approveCommission, rejectCommission, reverseCommission, toggleTreasury, removeTreasury, reverseTransfer, bounceCheque, toggleCurrency, removeCurrency, postManualJournal, removeManualJournal, reverseManualJournal, runRecurringJournal, toggleRecurringJournal, removeRecurringJournal, toggleAccount, removeAccount, removeCostCenter, approveRequest, rejectRequest, convertLead, removeLead, removeFollowup, acceptQuotation, convertQuotation, removeQuotation, approvePO, convertPO, toggleUser, postInvoice.

Additional use cases: sendQuotation draft/expiry validation, status/time/audit/save ordering; PO execution/void/delete with original strict wait-for-save rollback options; invoice create/edit/post with supplier duplicate external-number validation and atomic save:false before closing the dialog/persisting; quotation/PO create/edit dispatch and deferred persistence; receipt/payment party parsing and source metadata; generic form strict/fast transaction selection without moving DOM or FormData into application.

CommercialWorkflows coordinates activity filtering/Umrah trimming/local-save/remote cleanup with identical failure warning behavior; branch authorization/load/atomic save; user branch validation/update/audit/save; server audit read/user-name resolution. CommercialActionViews owns only presentation: unchanged read-only ArchiveViewer, activity navigation/toast, and audit modal/table rendering. No DB/Auth reads were moved into this presentation file. Existing CommercialActions and Actions APIs and assignments are preserved.

## Final review timing correction

The first Phase 2 implementation allowed the generic non-strict fast form path to return the value produced by `fastAtomic`. Because `Forms.open` conditionally awaits a truthy returned value, a callback returning an object or Promise could introduce an await/microtask that did not exist in the Phase 1 implementation. The final review correction keeps authorization and strict/async decisions inside the application layer but deliberately discards the `fastAtomic` return value and returns `undefined` for the normal fast path. Strict/async paths still return the `atomicAsync` Promise and preserve rejection propagation. No UI code, business output, schema, API, or smoke baseline was changed for this correction.

## Intentionally retained presentation and legacy scope

DOM reading, FormData conversion, form validation, labels, templates, colors, modal callbacks, toast handling, navigation, printing and dialog confirmation stay in presentation facades. No CSS/index/PWA/native changes. Existing backup/reset/license and advanced accounting/domain routines remain intact; removing every global in the system is not claimed. Existing settings rendering, domain globals and legacy monkey patches remain for later phases. The standalone read-only archive renderer was moved without markup/behavior redesign. One legacy meta:any annotation traveled unchanged with that renderer; no new any was introduced into the application seams or composition.

## Architecture before / after

| Rule | Phase 1 baseline | Phase 2 |
|---|---:|---:|
| ARCH001 | 493 | 430 |
| ARCH002 | 151 | 145 |
| ARCH003 | 363 | 306 |
| ARCH004 | 68 | 68 |
| ARCH005 | 11 | 11 |
| ARCH006 | 169 | 163 |
| TOTAL | 1255 | 1123 |

132 fewer findings (10.5%); NEW ARCHITECTURE VIOLATIONS: 0. Primary actions hotspot 310 → 201; commercial/actions 136 → 122; forms 65 → 56; form definitions 76 unchanged. Counts can overlap rules and are not unique runtime references.

Phase 1 architecture-baseline.json and refactor-baseline.json are unchanged. Narrow checker enhancement: src/application/** is explicitly classified and any direct forbidden DB/Auth/UI/Pages/Forms/toast/window/globalThis/document/localStorage/sessionStorage identifier reference is rejected under ARCH006. No existing rule or layer exemption changed. Temporary forbidden-global application source was rejected, removed entirely, and clean ratchet passed. Multiset signature matching limitations remain, including identical normalized occurrences in the same file.

## Tests and browser status

npm ci: PASS (115 packages).
Before-source refactor:check: exit 2 only for six browser blockers, all Node baseline results confirmed.
After-source refactor:check and refactor:full-check: exit 2 only for the same six browser blockers. Client/server builds PASS; Node total 60, PASS 43, known baseline failures 15, known structural failures 2, baseline improvements 0, NEW REGRESSIONS 0, TEST SUITE DRIFT NO.
architecture:check run independently because && short-circuits on browser blockers: PASS, no new findings.
application-workflow-check.mjs: PASS 154 differential boundary checks over 48 document facades using original approved-start source and injected fakes: authorization denial, immediate/deferred order, labels/domain args/messages, quotation/activity persistence sequences, invoice close/save barrier, strict receipt submission, live user branch queries, synchronous fast-path return/timing compatibility, and transaction rejection propagation. These checks isolate seams, not real-browser layout or live database behavior. The new check is outside the exact pinned *-smoke.mjs set.

BROWSER BASELINE BEFORE SOURCE CHANGE: ENVIRONMENT BLOCKER. Python Playwright remains installed externally. playwright install --with-deps chromium failed with apt setgroups/setegid/seteuid permission failures and exit 100. Compatible executable scan found no installed Chromium/Chrome. Clean headless-shell retry failed repeatedly with invalid/truncated ZIP (End of central directory record signature not found). The six original browser scripts were attempted in the unmodified baseline gate before source edits and again after; all fail at launch because the executable does not exist. No functional browser PASS claimed and no browser tests/packages/binaries/environment files committed. Authorized fallback to Node + architecture gates used for Phase 2.

## Generated artifacts and final safety

Builds temporarily regenerate dist/app.js and server/dist/server.js for verification. Restore those tracked generated files before committing under Phase 1's temporary-output policy: no release/Android asset synchronization in Phase 2. npm build is required to run the new source artifact; the tracked generated distribution is intentionally not a Phase 2 release. No manual generated edits.

After final npm/test commands, node_modules and server/node_modules physically removed, verified absent, no subsequent npm commands. .gitignore unchanged and exact; tracked dependencies zero. Final diff reviewed for no existing test changes, no schema/migration/native/style changes, no baseline resets. Remote commit/tree/diff verified separately after publishing. No merge to main. No Phase 3 begun.

## Known limits and recommended Phase 3 entry points

Browser acceptance remains an environment gap, not a refactor regression; review source/test evidence before release. Core/domain still uses legacy globals behind the adapter, intentionally. Ports reflect live mutable legacy records; this phase does not invent aggregate immutability or change synchronization rules. Prepared command authorization retains historical timing even if user/session changes while a dialog remains open. Accounting arithmetic, numbering, procurement and validation internals were not extracted.

Phase 3 can start from the named domain operation contracts and inspect Transactions receipt/payment posting, invoice lifecycle and CRM quotation/PO domain rules; remove their remaining presentation-global dependencies behind explicit services. Do not change accounting outputs or reset guardrail debt. Deferred GUI/advanced-accounting/backup/license consumers remain visible debt, not silently treated as complete decoupling.

FINAL STATUS: PHASE 2 READY FOR FINAL REVIEW with the documented browser environment blocker; browser release validation remains blocked.
