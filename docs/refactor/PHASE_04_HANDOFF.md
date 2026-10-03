# Phase 04 — Presentation globals and platform boundaries

PHASE: 4 / 5
BRANCH: phase-4-ui-globals-platform-cleanup-work
START SHA: 4701fc6fd50ee5b69df6d7f18eb36bdfdfe71b5e
FINAL SHA: the containing published commit; the execution report records the exact SHA (a commit cannot embed its own hash).
COMMIT MESSAGE: refactor: clean presentation globals and platform boundaries

PRODUCTION BUSINESS BEHAVIOR INTENTIONALLY CHANGED: NO
ACCOUNTING POLICY CHANGED: NO
DB SCHEMA CHANGED: NO
MIGRATIONS ADDED: NO
UI/UX INTENTIONALLY CHANGED: NO
ANDROID NATIVE BEHAVIOR INTENTIONALLY CHANGED: NO
PWA/OFFLINE BEHAVIOR INTENTIONALLY CHANGED: NO
EXISTING TESTS MODIFIED: NO

## Starting validation

Existing target remote branch was verified at the required start SHA and checked out locally. Before edits: npm ci PASS; application workflow 154 PASS; business differential 1172 assertions / 142 scenarios / 46 successful accounting scenarios PASS; Node 60 total / 43 PASS / 15 known baseline failures / 2 known structural failures / 0 regressions / no suite drift; architecture 426/141/272/68/11/156 = 1074, no new violations. No compatible Chrome/Chromium executable was found. No repeated installation attempt, environment dependency commit or browser-test change.

## Global surface and composition

PHASE_04_GLOBAL_SURFACE.md inventories all starting declarations, platform users, inline/template/delegated consumers and retained patches. All 147 original top-level object declarations and their callable public methods/arities remain compatible. These include configuration/value objects and are not 147 window properties. Top-level lexical runtime definitions are 297 → 310: four individual captured patch bindings were removed, but focused factories/composition/ports add definitions under module:none. No claim that the global-script model or all internal globals are gone. UiBaseMethods replaces the independent UI captures with one private set of functions bound to the same final UI receiver; it does not mirror UI state or register a container.

UI settings/modal members are constructed directly in the existing public object literal. Captured base behavior is represented once and bound explicitly, rather than repeatedly assigning public functions. Existing source-inspection gates require the actual footer and six modal definitions to remain as assignments: they remain visible debt, with original bodies, not synthetic comments or modified tests. The literal shape is also preserved for existing action-integrity/navigation AST consumers.

Auth.enter no longer receives a CommercialUX monkey patch. An explicit auth entry presenter preserves dirty-form cleanup → login/app visibility → UI initialization → save indicator/enhancement/onboarding. Error rendering/rethrow and Arabic markup remain identical. Session expiration clears the existing storage key, invokes an Auth-owned clear/show method and then notifies in the original order.

ARCH004 assignments: 68 → 39. ARCH005: 11 → 10. Retained native ERP_MOBILE publication/method setup and fetch routing preserve branch-specific APIs, credentials/headers and message contracts. The window.print override is removed after inventory proved the only source caller is delegated data-window-print; that caller uses an explicit platform current-print port configured at the original native initialization point. Native print title/error/browser fallback order remains; the title is read at invocation, not configuration. Native Print/sharePdf bridge contracts remain unchanged. External third-party scripts not present in the repository cannot be proven by these tests.

## Presentation/platform seams

| Area | Change | Retained scope / limits |
|---|---|---|
| Party360 / UnifiedParty | Typed modal presenters own More opening, role linking, netting selection/submission and reversal prompts. Query/use-case callbacks are explicit. Exact Arabic HTML, close/toast/deferred reopening order preserved. | Heavy model/query/render sections and remaining legacy operations stay at their original locations. No netting/business implementation duplicated. PARTIAL cleanup. |
| Forms | Native contact availability/picking/listener through focused bridge/DOM/notification ports. FormData, fields, names, ordering and submit handlers remain presentation. | Definitions and Phase 2 prepareFormSubmission/submitOnce/fast/strict paths untouched. Both sync and Promise form submissions compared. PARTIAL cleanup. |
| Pages / Actions / navigation | UI settings/modal construction, private base captures, preserved public/delegated mappings; current-print action calls platform boundary. | Remaining Pages/Actions/table/CommercialUX global consumers are retained; no layout/navigation redesign. PARTIAL cleanup. |
| Auth | Entry screen/effects and infrastructure session-expiration callback separated from authentication/permission decisions. | Login/setup/recovery/credential/session rules unchanged; remaining auth templates stay legacy. PARTIAL cleanup. |
| Reports / print / output | Native bridge lookup and fallback iframe/font-ready/printing mechanics use typed platform ports. Exact A4 native call stays in Print for existing public/static contracts. | Canonical payload, report queries, filters, rendering and OutputCenter markup unchanged; representative exact HTML checked. PARTIAL cleanup. |
| Persistence reverse calls | DB owns explicit render/notification/scheduling effects; ServerStore session expiration uses explicit effects. | Same save/transaction/rollback policy, synchronous render guards, notifications and promise flow. No universal event bus or business extraction. |
| Umrah presentation bridge | Page/form/party-action/attachment calls use narrow injected compatibility commands. | Existing authorization remains at its original point. Umrah UI-pages/forms/contracts/actions-print/wizard templates and business rules unchanged. PARTIAL cleanup. |
| Bootstrap | One composition root retained. Duplicate Phase 3 comment removed. Focused render/entry/contact/party/print/Umrah effects composed using live callbacks. Online reload and idle scheduling go to BrowserPlatform. | Authentication/startup sequence remains; broader startup and wiring stays in bootstrap. PARTIAL cleanup. |
| PWA / mobile | PWA native/host/protocol/load/registration/update mechanics behind port; native current-view printing no longer mutates window.print. | PRESERVED: registration path/scope/updateViaCache, once listener, 5000ms update, fetch routing, offline handling, native navigation/state and bridge contract. Zero Android/native/manifest/sw changes. |

New contracts are focused and actually consumed. BrowserPlatform centralizes DOM/form lookup, contact bridge/events, print frame/font readiness, PWA detection/registration, frame/idle/timers, session-key removal and online reload. New window/document/native/storage access is confined to the browser adapter; new presentation controllers receive typed inputs. Existing residual platform users are honestly inventoried, not relocated into exemptions.

## Architecture

| Rule | Before | After |
|---|---:|---:|
| ARCH001 | 426 | 426 |
| ARCH002 | 141 | 118 |
| ARCH003 | 272 | 266 |
| ARCH004 | 68 | 39 |
| ARCH005 | 11 | 10 |
| ARCH006 | 156 | 132 |
| TOTAL | 1074 | 991 |

83 fewer findings (7.7%), no rule increase, NEW ARCHITECTURE VIOLATIONS = 0. Direct presentation DB debt did not decrease and is not claimed fixed. The reduction comes from explicit effects, moved presentation implementations and one-time facade construction. Checker and Phase 1 baseline remain byte-identical. The new checker also runs the exact existing scanner against approved Phase 3 source and compares rule/file/normalized-signature multisets, so it cannot resurrect older baseline debt. Identical normalized occurrences inside one file retain the documented identity limitation.

## Timing and verification

- Application checker: 154 PASS, byte-identical.
- Business checker: 1172 assertions / 142 scenarios / 46 accounting scenarios PASS, byte-identical.
- Presentation/platform checker: 3471 PASS checks across 61 deterministic scenarios (separate from the pinned 60 smoke scripts). Actual approved Phase 3 source and current source execute in isolated VMs. Compares original public method names/arities, synchronous vs Promise returns, immediate/final/scheduled effects, HTML, notifications, storage, navigation/delegation, contact events, print fallback/native calls, PWA load/update guards, persistence rollback/rendering, form submissions and bootstrap success/offline/failure/credential-URL paths. Tests require intended success/rejection, not merely matching unexpected errors.
- The checker validates immutable compiler/order, static HTML/CSS, both earlier checkers, architecture checker/baselines and .gitignore; new seam noImplicitAny/forbidden-ambient/any/suppression checks PASS.
- refactor:check: client/server builds PASS; Node TOTAL 60, PASS 43, known baseline failures 15, known structural failures 2, NEW REGRESSIONS 0, TEST SUITE DRIFT NO. No baseline reclassification/improvement claimed.
- architecture:check: PASS, counts above.
- Browser: ENVIRONMENT BLOCKER, all six original browser scripts cannot launch the missing Playwright Chromium executable. No browser visual/pixel parity PASS claimed.

Sync paths remain sync. Auth entry, modal close/base capture and native contacts do not gain awaits. Existing async form/netting/print payload paths keep their Promise behavior. Save, rollback rendering and toast order are compared before and after awaits. Frame/idle fallback choices, once listeners, PWA update timing, font-ready 40/80ms printing and native restore timers are retained. No CSS/static HTML/assets/icons change; moved party markup and representative canonical report/output HTML are compared exactly. VM evidence is not live browser/native/server integration evidence.

## Review / generated output / cleanup

The full source diff, added controllers/contracts and compatibility bodies were reviewed. No business/application/domain rule changes, accounting policy, schema/migrations, CSS/assets, native/Capacitor/manifest/service-worker cache strategy, package/lock or existing test changes. No baseline reset/checker weakening, new any/suppressions, DB/Auth/UI aliases, dynamic dispatch, duplicate business rules or second state/container. target ES2020/module:none/outFile/manual order retained; adapters/contracts/controllers precede consumers; hoisted composition functions only capture late services and do not read them during early DB construction.

Generated dist/app.js and server/dist/server.js are restored after validation under GENERATED_ARTIFACT_POLICY.md. This is not a release. After the final npm/test command, node_modules and server/node_modules are removed and absence/tracked-zero verified; no npm afterward. Publish only one coherent commit to the existing Phase 4 branch; verify GitHub commit/tree/compare against the start. Do not merge main.

## Remaining Phase 5 debt

Consolidation must review remaining public patch chains (table/UX/native init/DB save/ensure), legacy presentation DB/Auth consumers, auth/templates/report/Umrah presentation internals, lexical script ordering and optional integrations. Some actual assignment forms are retained because pinned static gates require them; those tests were not weakened. Browser/native acceptance remains blocked and must be obtained in a capable environment before release. No claim of complete removal of all globals or exhaustive pixel/workflow validation. Phase 5 implementation has NOT started.

## Files added

- `docs/refactor/PHASE_04_GLOBAL_SURFACE.md`
- `docs/refactor/PHASE_04_HANDOFF.md`
- `scripts/presentation-platform-check.mjs`
- `src/platform/browser-platform.ts`
- `src/platform/platform-contracts.ts`
- `src/platform/pwa-registration.ts`
- `src/ui/auth-entry-presentation.ts`
- `src/ui/contact-presentation.ts`
- `src/ui/party-presentation.ts`
- `src/ui/presentation-contracts.ts`
- `src/ui/print-presentation.ts`

## Files modified

- `src/bootstrap.ts`
- `src/core/umrah/data.ts`
- `src/crm/party360.ts`
- `src/crm/unified-party.ts`
- `src/mobile.ts`
- `src/persistence/browser-store.ts`
- `src/persistence/server-store.ts`
- `src/pwa.ts`
- `src/reports/printing.ts`
- `src/security/auth.ts`
- `src/ui/commercial-ux.ts`
- `src/ui/delegated-actions.ts`
- `src/ui/forms.ts`
- `src/ui/ui.ts`
- `tsconfig.json`

FINAL STATUS: PHASE 4 READY FOR REVIEW, with the recorded browser blocker and retained legacy debt.
