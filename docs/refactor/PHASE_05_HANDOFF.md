# Phase 05 handoff — final consolidation and release preparation

START SHA: 0b10995eaf4c1bddeb30c0fcd1ad7c000a6b5b01

Final SHA: the commit containing this document, resolved with `git rev-parse HEAD` on `phase-5-final-consolidation-release-work`. No self-referential commit hash is embedded. One coherent commit; no main merge or release tag.

## Scope and decision

Phase 5 consolidates acceptance into `scripts/release-check.mjs` and provides the complete release audit. No production source is changed. No dead-code deletion or wrapper consolidation was justified strongly enough to meet the no-caller/public/native requirements. Keeping the reviewed Phase 4 implementation is intentional, rather than speculative last-minute restructuring. No Phase 6 is proposed.

Files added:

- `scripts/release-check.mjs`
- `docs/refactor/PHASE_05_HANDOFF.md`
- `docs/refactor/FINAL_REFACTOR_REPORT.md`
- `docs/refactor/RELEASE_READINESS.md`

Files modified: none. Files deleted: none. Safe dead code removed: none. Production duplication consolidated: none. Acceptance orchestration is consolidated into one runner which invokes the existing independent checkers without replacing or weakening them. Existing tests, package/lock files, compiler configuration, architecture checker and baselines remain byte-identical.

## Starting validation

Existing target remote branch and local checkout both resolved to the required start. Before edits: application 154 PASS; business 1172 assertions / 142 scenarios / 46 successful accounting scenarios PASS; presentation 3471 checks / 61 scenarios PASS. Node 60 total / 43 PASS / 15 known baseline / 2 structural failures; new regressions 0, suite drift NO. Client and server builds PASS. Architecture 991, new violations 0. All six browsers were environment-blocked. No client changes were made before or after those baselines.

## Whole-source audit

All 110 ordered TypeScript inputs were parsed and their top-level declarations/immediate reads examined. The source tree, public-surface inventory, architecture findings, legacy call sites and composition functions were reviewed. The counts below are ordered source files and architecture occurrences, not defects or deleted code.

| Area | Ordered files | Architecture findings |
|---|---:|---:|
| `src/application/` | 18 | 0 |
| `src/accounting/` | 14 | 29 |
| `src/finance/` | 2 | 2 |
| `src/crm/` | 8 | 120 |
| `src/commercial/` | 7 | 160 |
| `src/core/` | 29 | 22 |
| `src/persistence/` | 3 | 9 |
| `src/security/` | 1 | 3 |
| `src/platform/` | 3 | 0 |
| `src/ui/` | 17 | 595 |
| `src/reports/` | 1 | 10 |
| `src/documents/` | 2 | 6 |

`src/bootstrap.ts`, `src/mobile.ts` and `src/pwa.ts` were audited individually. Contracts/use cases/domain rules retain their Phase 2/3 boundaries. DB/ServerStore presentation effects, Auth entry/expiration, Party360/UnifiedParty presenters, Forms contact glue, print fallback and PWA ports retain Phase 4 wiring. Remaining Auth templates, report/OutputCenter markup and Umrah UI/forms/print/wizard views stay unchanged; no business rule or markup is duplicated into another version.

No obsolete composition factory was removed: each of the distinct compose* functions has a static source caller and a focused contract. Similar transaction/clock ports are not proof of redundant semantics; their live getters preserve rollback/repository identity. Captured table/UX/ensure functions are used by installed wrappers. Modal compatibility assignments have pinned source consumers. None satisfies the required no-caller deletion test. Public lexical bindings may also be used by generated inline handlers; absence of a simple text hit alone is insufficient.

## Ordered-symbol and startup audit

110 files / 310 top-level definitions / 178 immediate global references / **0 immediate forward lexical reads**. The pass resolves TypeScript symbols, excludes type-only/deferred function bodies, and includes directly invoked function expressions. This does not prove every dynamically invoked branch; compiler checks and the 61 deterministic startup/presentation scenarios cover representative runtime paths. No ordering change was made.

Contracts precede implementations; platform ports precede store/controller consumers; business rules precede workflows; UI precedes data-table wrappers; Forms precedes its definitions; CommercialUX precedes native initialization; mobile precedes PWA; bootstrap remains last. Hoisted compose* declarations may appear after consumers, but early construction captures callbacks rather than executing UI/Auth reads. There is one startup IIFE and no second service locator/container/store. Normal startup remains DB.init → Commercial.afterInit → Auth.init. The DB-failure recovery Auth.init path is intentionally separate. Offline return, credential URL sanitization, optional VendorOwner application and delayed accounting warmup remain intact.

## Public API and native/PWA audit

Phase 4's 147 original object facades and callable method names/JavaScript arities remain verified by the immutable differential checker. Current lexical runtime definitions stay 310; object declarations stay 148 plus the BrowserPlatform IIFE binding. Required UI/Actions/Forms/Pages/CommercialActions/Auth/DB/Transactions/Invoices/Accounting/ManualJournal/CRM/Party360/UnifiedParty/Print/Reports/Statements/OutputCenter/PWA/UmrahCore_* APIs remain. Inline/template/delegated callers are unchanged; sync and Promise returns, receiver binding, modal/toast/persistence order are exercised by existing parity scenarios.

All repository-owned current-view printing routes were checked: delegated `data-window-print` uses BrowserPlatform.printCurrent; mobile configures native print at the existing initialization point; the title callback evaluates at invocation; exceptions call the captured browser fallback with its original receiver. Document/iframe printing retains its own contracts. Repository compatibility: **VERIFIED** by static caller inspection and deterministic native/current/fallback/error/title scenarios. Unobserved third-party scripts: **NOT PROVABLE**. The removed window.print override is not restored.

ERP_MOBILE, NativeShell, NativePrint, Capacitor, contact callback shapes, session behavior, native fetch routing, native print/share contracts and offline paths remain unchanged. Native contract check PASS means static/source and deterministic bridge coverage, not a device test. REAL DEVICE ACCEPTANCE: NOT EXECUTED; Work has no real Android runtime. No Android/native/manifest/configuration file is changed.

PWA/offline contract checks PASS: native skip, service-worker support, HTTPS/localhost guard, once load listener, `./sw.js`, scope `./`, updateViaCache `none`, 5000ms update and guarded rejection/fallback, plus online reload/idle timing retain their original behavior. Service-worker cache strategy is unchanged. This is deterministic/static evidence; live offline/browser/device acceptance remains pending.

## Remaining patches and global publications

Every remaining ARCH004 occurrence was reviewed; assignments include public state replacement as well as method patches.

| Source | ARCH004 occurrences |
|---|---:|
| `src/documents/attachments-backup.ts` | 1 |
| `src/mobile.ts` | 10 |
| `src/persistence/browser-store.ts` | 1 |
| `src/security/auth.ts` | 3 |
| `src/ui/actions.ts` | 1 |
| `src/ui/commercial-ux.ts` | 10 |
| `src/ui/data-table.ts` | 6 |
| `src/ui/ui.ts` | 7 |

Data-table wrappers preserve lazy table filtering/sorting/export and `this`; CommercialUX wrappers preserve dirty-form navigation/modal guards, notification menus and save state/Promise timing. DB.ensure retains accounting/source repair order. Modal footer/stack/capture assignments remain actual code because pinned clean-ui/unified-more gates require their source form. Native UI.init preserves deferred state restoration. DB.data/user/save-error/state replacements are live synchronization/session operations, not unused code. All 39 remain.

All 10 ARCH005 findings are native/mobile: ERP_MOBILE publication; four offline and four connected branch methods; native fetch routing. External bridge users/branch-specific return shapes make them required compatibility surfaces. No new global publication or hidden alias was introduced.

## Architecture

| Rule | Before | After |
|---|---:|---:|
| ARCH001 | 426 | 426 |
| ARCH002 | 118 | 118 |
| ARCH003 | 266 | 266 |
| ARCH004 | 39 | 39 |
| ARCH005 | 10 | 10 |
| ARCH006 | 132 | 132 |
| TOTAL | 991 | 991 |

NEW ARCHITECTURE VIOLATIONS: 0. The Phase 1 reference remains unchanged. Matching is rule + file + normalized signature with multiplicity; identical normalized occurrences in one file still have identity limitations. No perfect occurrence identity is claimed.

Primary reporting classification (one bucket per occurrence, not a promise that all future changes are safe): ARCH001 → presentation direct DB; remaining mobile findings → platform/native; other ARCH004 → required legacy compatibility; other ARCH003 → structural ambient script debt; remaining ARCH002/ARCH006 → future seam debt. "LOW-RISK FUTURE DEBT" means candidate follow-up review, not proven-safe removal.

| Remaining debt category | Occurrences |
|---|---:|
| PRESENTATION DIRECT-DB DEBT | 426 |
| LOW-RISK FUTURE DEBT | 250 |
| STRUCTURAL MODULE:NONE DEBT | 251 |
| PLATFORM/NATIVE COMPATIBILITY | 35 |
| REQUIRED LEGACY COMPATIBILITY | 29 |

## Verification and limitations

Final required runs: application 154 PASS; business 1172/142/46 PASS with exact accounting-journal parity for the changed Phase 3 workflows; presentation 3471/61 PASS; release audit PASS; client/server builds PASS; Node 60/43/15/2, new regressions 0, no drift; architecture 991, new 0. Existing checker files were not changed. The release runner additionally verifies pinned inventories, source/gate immutability, public facades, composition/order, native/PWA/print contracts and repository invariants. It is an audit orchestrator, not a replacement framework. It does not turn baseline smoke failures into PASS.

Known unchanged smoke failures:

- `scripts/android-connectivity-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/brand-asset-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/commercial-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/contracts-inventory-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/customer-parity-smoke.mjs` — KNOWN STRUCTURAL FAILURE
- `scripts/data-protection-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/mobile-android-smoke.mjs` — KNOWN STRUCTURAL FAILURE
- `scripts/unified-more-cleanup-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32470-regression-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32472-accounting-lifecycle-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32481-mobile-ux-action-policy-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32483-mobile-refresh-compact-filters-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32485-filter-refresh-font-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32510-operations-execution-split-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32511-entity-backed-read-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32512-entity-backed-write-smoke.mjs` — KNOWN BASELINE FAILURE
- `scripts/v32565-party-transactions-report-smoke.mjs` — KNOWN BASELINE FAILURE

Browser: **ENVIRONMENT BLOCKER**. Fresh executable scan found no Chromium/Chrome in PATH, common /usr/bin, /opt/google/chrome or Playwright cache locations. The environment initially had no Python Playwright; one prerequisite install succeeded (Playwright 1.63.0). One Chromium installation command then failed downloading Chrome for Testing 153.0.8010.12 / Playwright chromium v1243: ZIP extraction reported "End of central directory record signature not found. Either not a zip file, or file is truncated." No repeated manual installation attempts. The final six original browser scripts fail before functional execution because the Chromium executable is absent. No browser functional/visual PASS or baseline functional failure is claimed. No test was changed. Packages/binaries are environment-only and untracked.

## Generated artifacts and hygiene

Generated release artifacts: **RESTORED**. Authoritative client/server TypeScript compilation and official static copy succeeded for validation. Tracked outputs were restored afterward. The policy requires explicit Android synchronization and parity for an intentional generated-output release; unavailable browser/device acceptance makes this a source release-preparation review, not a distribution release. Existing tracked generated artifacts are not represented as synchronized with the refactored source. Before distributing, build official outputs, explicitly sync Android, and verify parity in a capable environment. No hand-edited dist or generated churn is committed.

After the final test/build command, root/server node_modules are removed, both absent, tracked count 0. Exact seven-line .gitignore is preserved. No credentials, browser downloads, debug/coverage/backup artifacts, schema/migrations or smoke edits are committed. Final review compares the entire change against START; remote verification compares the target remote tree/HEAD with the local commit. Main/tag are untouched.

## Integration recommendation

CODE REFACTOR READY; BROWSER RELEASE ACCEPTANCE PENDING; REAL DEVICE ACCEPTANCE NOT EXECUTED. Review this branch before any main merge. Obtain the six browser runs and native/offline acceptance, then synchronize official generated/Android release artifacts before production deployment. Do not treat source parity as full release approval.

PRODUCTION BUSINESS BEHAVIOR INTENTIONALLY CHANGED: NO
ACCOUNTING POLICY CHANGED: NO
DB SCHEMA CHANGED: NO
MIGRATIONS ADDED: NO
UI/UX INTENTIONALLY CHANGED: NO
ANDROID NATIVE BEHAVIOR INTENTIONALLY CHANGED: NO
PWA/OFFLINE BEHAVIOR INTENTIONALLY CHANGED: NO

## Retained occurrence audit

Samples are normalized and truncated by the unchanged checker. Duplicate signatures are shown as separate occurrences; their distinct original identity is not guaranteed.

| Source | Signature prefix | Reviewed retained operation |
|---|---|---|
| src/documents/attachments-backup.ts | `6e87fdde92ea` | DB.data = d |
| src/mobile.ts | `0e94e0b42e79` | DB.syncBlocked = false |
| src/mobile.ts | `0e94e0b42e79` | DB.syncBlocked = false |
| src/mobile.ts | `0e94e0b42e79` | DB.syncBlocked = false |
| src/mobile.ts | `160f5f453504` | DB.lastSaveError = '' |
| src/mobile.ts | `160f5f453504` | DB.lastSaveError = '' |
| src/mobile.ts | `160f5f453504` | DB.lastSaveError = '' |
| src/mobile.ts | `1eb18e03f7f1` | Auth.user = byId(DB.data.users \|\| [], uid) \|\| Auth.user |
| src/mobile.ts | `73b8cf777e08` | UI.navHistory = Array.isArray(state.history) ? state.history.slice(-30) : [] |
| src/mobile.ts | `b4877eb7c2e3` | DB.data = remote.data |
| src/mobile.ts | `db23bb824836` | UI.init = function (...args: any[]) { const result = initUi(...args); setTimeout(restoreNativeUiState, 0); return result; } |
| src/persistence/browser-store.ts | `b1ea0fe54863` | DB.ensure = function () { const legacyAppearance = this.data?.settings?.appearance, result = DBEnsureAccountingLifecycleBase(); if (this.data.meta.v32473AccountingSourceRepair !==  |
| src/security/auth.ts | `655f7b88b26d` | DB.data = data |
| src/security/auth.ts | `655f7b88b26d` | DB.data = data |
| src/security/auth.ts | `b4877eb7c2e3` | DB.data = remote.data |
| src/ui/actions.ts | `24a933991d86` | UI.workspaceId = '' |
| src/ui/commercial-ux.ts | `366621e2037b` | UI.backHome = function (opts = {}) { if (!CommercialUX.canLeave()) return false; return uxHome(opts); } |
| src/ui/commercial-ux.ts | `50a883ee9e4d` | UI.renderCurrent = function () { uxRender(); CommercialUX.enhance(document); } |
| src/ui/commercial-ux.ts | `512385cc8bdd` | UI.openWorkspace = function (id, opts = {}) { if (!CommercialUX.canLeave()) return false; return uxWorkspace(id, opts); } |
| src/ui/commercial-ux.ts | `52264b0819bc` | UI.updateTopbar = function () { uxTopbar(); const all = Commercial.notifications(), read = CommercialUX.readSet(), unread = all.filter(a => !read.has(CommercialUX.notificationId(a) |
| src/ui/commercial-ux.ts | `69f75be80e6c` | DB.save = function (render = true, options: any = {}) { const silent = options?.silentUi === true, background = options?.background === true; if (silent) return uxSave(render, opti |
| src/ui/commercial-ux.ts | `8b7a7ada8ba2` | UI.toggleNotifications = function (e) { e?.stopPropagation(); const p = document.getElementById('notificationPanel'), open = p.classList.contains('hidden'); this.closeMenus(); if ( |
| src/ui/commercial-ux.ts | `c09e73f4276b` | UI.closeModal = function (force = false) { if (!force && !CommercialUX.canLeave()) return false; const modal = document.getElementById('modal'); if (modal?.dataset?.onboarding ===  |
| src/ui/commercial-ux.ts | `c3a0bfdb83fa` | (UI as any).renderNotificationPanel = function (p) { if (!p) return; const all = Commercial.notifications(), read = CommercialUX.readSet(), filter = CommercialUX.notificationFilter |
| src/ui/commercial-ux.ts | `f213508febb4` | UI.openPage = function (page, id = '', opts = {}) { if (page !== this.current && !CommercialUX.canLeave()) return false; return uxOpen(page, id, opts); } |
| src/ui/commercial-ux.ts | `fc8bb392498d` | UI.toggleUserMenu = function (e) { uxUserMenu(e); const p = document.getElementById('userMenu'); if (!p \|\| p.classList.contains('hidden') \|\| p.querySelector('[data-training-link]') |
| src/ui/data-table.ts | `301a86fd4ff3` | UI.sortTable = function (th, index) { if (th.dataset.export === '0') return; const card = th.closest('.table-card'), key = card?.dataset?.lazyTable, rec = key ? this._lazyTables.ge |
| src/ui/data-table.ts | `3a047174264e` | UI.renderTablePage = function (key, card) { const rec = this._lazyTables.get(key); if (!rec \|\| rec.kind !== 'data') return _dataTableRenderBase(key, card); if (!card) return false; |
| src/ui/data-table.ts | `870a8ec41c75` | (UI as any).dataTable = function (headers, items, rowRenderer, empty = 'لا توجد بيانات', opts: any = {}) { const list = Array.isArray(items) ? items : [], noSort = h => /إجراء\|الإج |
| src/ui/data-table.ts | `98b9136532c9` | UI.filterTable = function (input) { const card = input.closest('.table-card'), q = this.searchNormalize(input.value), key = card?.dataset?.lazyTable, rec = key ? this._lazyTables.g |
| src/ui/data-table.ts | `98f16d59d396` | UI.exportTable = function (btn) { const card = btn.closest('.table-card'), key = card?.dataset?.lazyTable, rec = key ? this._lazyTables.get(key) : null; if (!rec \|\| rec.kind !== 'd |
| src/ui/data-table.ts | `becf2d0ec4bc` | (UI as any).dataTableSearchValue = function (rec, item) { if (rec.searchText) { try { return this.searchNormalize(rec.searchText(item)); } catch { return ''; } } return this.search |
| src/ui/ui.ts | `34807646bc07` | UI.restoreModalControls = function (f, items = []) { if (!f \|\| !items?.length) return; const els = [...f.querySelectorAll('input,select,textarea')]; for (const x of items) { let el |
| src/ui/ui.ts | `686e952c7aba` | UI._modalStack = [] |
| src/ui/ui.ts | `6b8487bf35ed` | UI.captureModalControls = function (f) { if (!f) return []; return [...f.querySelectorAll('input,select,textarea')].map((el, index) => ({ index, name: el.name \|\| '', id: el.id \|\| ' |
| src/ui/ui.ts | `75ad52a23d4a` | UI.resetModalFooter = function (label = 'حفظ البيانات', { danger = false, hideSubmit = false, cancel = 'إلغاء' } = {}) { const foot = UIDocument.getElementById('modalFoot'); if (!f |
| src/ui/ui.ts | `92086baa85d7` | UI.installGlobalModalStack = function () { if (this._modalStackInstalled) return; const m = UIDocument.getElementById('modal'), f = UIDocument.getElementById('modalForm'), title =  |
| src/ui/ui.ts | `b39379db740d` | UI.restoreModal = function (s) { if (!s) return false; const m = UIDocument.getElementById('modal'), f = UIDocument.getElementById('modalForm'), body = UIDocument.getElementById('m |
| src/ui/ui.ts | `ff49e2ae12a1` | UI.captureModal = function () { const m = UIDocument.getElementById('modal'), f = UIDocument.getElementById('modalForm'), body = UIDocument.getElementById('modalBody'), foot = UIDo |
| src/mobile.ts | `6b034af9873e` | (window as any).ERP_MOBILE.checkConnection = () => checkServerHealth('manual') |
| src/mobile.ts | `6b70097b8f8b` | (window as any).ERP_MOBILE.checkConnection = async () => true |
| src/mobile.ts | `9b02fb4abcb8` | (window as any).ERP_MOBILE.applyPendingRelease = applyPendingRelease |
| src/mobile.ts | `b84d2c1c87ae` | (window as any).ERP_MOBILE.checkAppRelease = () => checkLiveRelease('manual') |
| src/mobile.ts | `bcbea0cd0519` | (window as any).ERP_MOBILE = { apiBase: API_BASE, clearSession: () => { }, isNative: true, shell: shellNative ? 'native-shell' : 'capacitor' } |
| src/mobile.ts | `c55265d078e1` | (window as any).ERP_MOBILE.refresh = () => refreshFromServer('api') |
| src/mobile.ts | `db0b01164c72` | (window as any).ERP_MOBILE.applyPendingRelease = () => false |
| src/mobile.ts | `f1f9a01268d0` | (window as any).ERP_MOBILE.checkAppRelease = async () => false |
| src/mobile.ts | `fc6bdc2edff9` | window.fetch = (async (input: any, init: any = {}) => { const target = apiUrl(input); if (!target) return nativeFetch(input, init); const options: any = { ...init, headers: mergeHe |
| src/mobile.ts | `ff4907d0ddbe` | (window as any).ERP_MOBILE.refresh = async () => { try { await DataStore.localPut(DB.data); UI?.renderCurrent?.(); CommercialUX?.saveState?.('saved', 'محفوظ على الجهاز'); if (typeo |
