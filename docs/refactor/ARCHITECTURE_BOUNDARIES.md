# Architecture Boundaries Contract — B02B Guardrails

Checkpoint baseline SHA: `26cb63d6f93e928bbcaaa84bdbda6d3eaf3cb071`
Machine-readable ratchet data: `docs/refactor/architecture-baseline.json`
Gate command: `npm run architecture:check` (part of `npm run refactor:full-check`)

This document defines the **target** dependency direction and the **ratchet**
policy that keeps legacy debt from growing while incremental refactoring
proceeds. B02B does NOT refactor anything; it only freezes current debt as a
ceiling.

---

## 1. Target Direction

```
UI / feature presentation            (src/ui/**, mobile/pwa shells)
        ↓
Application / Use Cases              (feature orchestration: src/commercial/actions.ts,
        ↓                             src/accounting/transactions.ts, src/crm/**, src/core/umrah/**)
Domain / Business logic              (rules, calculations, policies)
        ↓
Repository Interfaces                (explicit data-access contracts — to be introduced)
        ↓
Persistence / Infrastructure         (src/persistence/**, ServerStore, DataStore, security)
```

Hard rules for NEW code:

- **Persistence must NOT depend upward on UI.** (`src/persistence/**` may not
  reference `UI`, `Pages`, or `toast`.)
- **Domain/core must NOT depend on presentation.** (`src/core/**`, accounting
  and finance logic may not render DOM or call UI globals.)
- **UI should not directly own database persistence logic.** Presentation code
  reaches data through application/use-case layers, not `DB.*` calls.
- **No new globals.** The legacy globals `UI`, `DB`, `Auth`, `Pages`, `toast`
  are transitional debt; new modules must use explicit dependencies/exports.
- **No new monkey patches.** Reassigning `UI.x = ...`, `DB.x = ...`,
  `Auth.x = ...` (or `(UI as any).x = ...`) is frozen at its current count.
- **No new `window`/`globalThis` mutations** inside `src/**`.

The target layering above is aspirational structure; the existing globals and
manual script ordering remain in place until later batches move them.

## 2. Ratchet Policy

`scripts/architecture-check.mjs` compares, per rule and per file, the CURRENT
occurrence count against the BASELINE count recorded in
`architecture-baseline.json`:

| Situation | Verdict |
|---|---|
| current < baseline (any file) | IMPROVEMENT → PASS |
| current == baseline | PASS |
| current > baseline in an existing violating file | NEW ARCHITECTURE VIOLATION → FAIL |
| rule violation appears in a file absent from the baseline | NEW ARCHITECTURE VIOLATION → FAIL |
| violating file disappears entirely | IMPROVEMENT → PASS |

Violation identity is **(file path + normalized rule id + count)**. Line
numbers are never part of the identity, so inserting unrelated lines at the
top of a file cannot register as a new violation.

The checker is strictly read-only; it never modifies source files.

## 3. Rules

| Rule | Meaning | Where measured |
|---|---|---|
| ARCH001 | New direct DB access from UI/presentation code | `src/ui/**`, `src/mobile.ts`, `src/pwa.ts` referencing `DB.{data,ensure,save,persist,atomic,atomicAsync,fastAtomic,log}` |
| ARCH002 | New UI dependency from persistence/core/domain-style code | non-UI layers referencing `UI`, `Pages`, `toast` |
| ARCH003 | New Auth global coupling outside existing baseline locations | any file outside `src/security/**` / `src/bootstrap.ts` referencing `Auth.{can,require,user,...}` |
| ARCH004 | New monkey-patching/reassignment of UI/DB/Auth public members | all of `src/**` |
| ARCH005 | New window/globalThis mutation in `src/**` | assignments to `window.x=` / `globalThis[...] =` incl. `(window as any).X.member=` forms |
| ARCH006 | New forbidden cross-layer dependency hotspot | sum of upward global references per file against the target direction (allowed tolerated downward edges: ui→persistence, ui→security, feature-domain→persistence, support→persistence) |

Notes:
- Comments and string/template-literal bodies (except `${...}`
  interpolations) are stripped before matching, so HTML markup containing the
  word "UI" is not counted.
- ARCH006 documents the *direction* problem; it does not pretend a clean
  architecture already exists. Its grandfathered counts shrink as features
  adopt explicit dependencies.

## 4. Legacy Debt Acknowledgements

- Existing globals (`UI`, `DB`, `Auth`, `Pages`, `toast`) are **transitional
  legacy debt**, grandfathered at baseline counts.
- Manual script ordering via the `tsconfig.json` `files` list (outFile
  `dist/app.js`, `module: none`) stays as-is in this batch.
- No big-bang rewrite is planned or permitted by this gate. Each batch removes
  violations incrementally; every removal permanently lowers the ceiling for
  that file/rule (the ratchet only tightens).
- A feature being refactored must move toward **explicit dependencies**
  (parameters, imports/exports when ESM migration happens, or injected
  adapters) rather than reaching for globals.
- Domain/business code should not own DOM concerns; UI should not own
  database persistence logic. Violations of these today are recorded as
  baseline, never as permission.

## 5. Working With the Gate

```bash
npm run architecture:check      # ratchet only
npm run refactor:full-check     # regression gate + ratchet
```

When you legitimately remove debt, re-baseline DOWNWARD only (never up):

```bash
ARCH_BASELINE_SHA=$(git rev-parse HEAD) node scripts/architecture-check.mjs --generate-baseline \
  > docs/refactor/architecture-baseline.json
```

Any increase in any file's count for any rule fails CI. There is no override
flag by design.
