# Dependency Hotspots (B00)

Recorded at `e97fa6d9` (v32.5.66). Descriptive only — no code changed in B00.

## 1. Why the graph is order-dependent

Root `tsconfig.json` uses `"module": "none"` + `"outFile": "dist/app.js"` with a manual
`"files"` array of **68 client files**. Every top-level `const`/`let`/`function` is a
shared global across all files; load order = dependency order. There are no import
edges on the client side, so any reorder can silently break runtime references.

Load order facts: `src/core/runtime.ts` first … `src/bootstrap.ts` last.

## 2. Global usage hotspots (client)

| Global | Kind | Refs | Files using it | Risk if touched |
|---|---|---|---|---|
| `DB` (`src/persistence/browser-store.ts`) | state store object | 723 | 57 / 68 | Extreme — de-facto root dependency of every module |
| `Auth.` (`src/security/auth.ts`) | auth namespace | 162 | 29 | High |
| `UmrahCore_*` namespaces (`core/umrah/*`) | ~dozens of namespace consts | pervasive | umrah tree | High — merged via Object.assign across files |
| `window as any` casts | untyped browser access | 24 | UI/mobile files | Medium |
| `localStorage` direct | persistence side-channel | 20 | 8 files | Medium — bypasses DataStore abstraction |
| `sessionStorage` direct | UI-state persistence | 11 | incl. UmrahCore_LocalUI | Low/Medium |
| `indexedDB` direct | binary stores | 2 files | attachments-backup, browser-store | Medium |

## 3. Monkey-patching hotspots

1. **Namespace extension by `Object.assign`** (56 occurrences in `src`). Examples:
   - `src/core/umrah/operations-execution.ts:76` → `Object.assign(UmrahCore_Ops, UmrahCore_OperationsExecution)`
   - `src/core/umrah/contracts-management.ts:192` → `Object.assign(UmrahCore_ContractCenter, UmrahCore_ContractManagement)`
   - `src/core/umrah/program-wizard-view.ts:28`, `forms-contracts.ts:51`, `workflow.ts:46`
   - Also in `ui/forms*.ts`, `ui/navigation.ts`, `accounting/*.ts`, `commercial/*.ts`, `crm/crm.ts`.
   Constraint: the base namespace file MUST precede the extension file in tsconfig `files`.
2. **Method wrapping (classic monkey patch)**: `src/crm/crm.ts:10-11` captures
   `CRMConvertPOLifecycleBase = CRM.convertPO.bind(CRM)` then reassigns `CRM.convertPO`.
3. **Property proxying**: `src/core/umrah/data.ts:14` installs `Object.defineProperty`
   getters/setters that map logical view keys onto live `DB.data[root]` slots.

## 4. Server dependency shape

- `server/src/server.ts` imports from 12 sibling modules (`context`, `migrations`,
  `license`, `session`, `state`, `state-patch`, `entity-mirror`, `authz`,
  `auth-recovery`, `archives`, `backups`, `vendor`). ESM (`"type":"module"`, NodeNext),
  strict TS. External deps: `pg` only (+ @types).
- Known type gap (fixed types-only in B01A): `pool.query({text:'select 1',query_timeout:3000})`
  at `server/src/server.ts:55` — pg runtime honors per-query `query_timeout`, but
  `@types/pg` `QueryConfig` does not declare it (it exists on `ClientConfig`).

## 5. Generated/copied trees that mirror source (drift risk)

- `dist/**` ← `npm run build` (tsc outFile + copy-static.mjs)
- `server/dist/**` ← server tsc
- `android/app/src/main/assets/public/**` ← `cap sync` / mobile:sync
- Tests read both source AND generated copies (e.g. `mobile-android-smoke.mjs` reads
  `dist`-mirrored android assets and `src/*.ts` directly), so stale generated trees can
  cause failures independent of source changes.

## 6. Repo-root clutter coupling

`RELEASE_MANIFEST_*` / `RELEASE_REPORT_*` / one-off QA txt files: verified zero
references from package.json, scripts/**, src/**, server/**, android/**, .github/**,
Dockerfiles. Pure documentation artifacts → safe archive candidates (B02A).
`UPDATE_DELETE_MANIFEST.txt`, `UPDATE_ONLY_README_AR.txt`, `CUSTOMER_PACKAGE.txt` ARE
referenced by `scripts/install-update.ps1` / Windows update flow → explicitly out of scope.
