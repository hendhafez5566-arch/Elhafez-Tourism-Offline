# ARCHITECTURE_BOUNDARIES — B02B Architecture Ratchet (Phase 1 Guardrail)

- **Repo:** hendhafez5566-arch/Elhafez-Tourism-Offline
- **Checkpoint SHA (baseline anchor):** `26cb63d6f93e928bbcaaa84bdbda6d3eaf3cb071`
- **Tool:** `scripts/architecture-check.mjs` (`npm run architecture:check`)
- **Baseline file:** `docs/refactor/architecture-baseline.json`

> NOTE ON PROVENANCE: the reference branch
> `architecture-ratchet-batch-b02b-3269c` / commit `9bdcaa11…` was NOT
> fetchable from this workspace (no remote configured, single-commit grafted
> history). The four B02B guardrail files were therefore RE-CREATED here with
> rule semantics calibrated to reproduce the official B02B baseline numbers
> EXACTLY at the start checkpoint. No contaminated-tree content
> (node_modules, .gitignore changes) was transferred.

## Rules (measured over all client TypeScript sources under `src/`, comments stripped)

| Rule | Name | Detection (regex, global) | Scope notes |
|---|---|---|---|
| ARCH001 | DB direct access | `\bDB\.[A-Za-z_$]` occurrences of `DB.` member access on the persistence global | owner file `src/persistence/browser-store.ts` excluded (defines `DB`) |
| ARCH002 | UI presentation coupling | `UI.` / `Pages.` member access + `toast(` calls | cross-cutting presentation globals |
| ARCH003 | Auth coupling | `Auth.require(` / `Auth.can(` authorization-gate invocations | owner file `src/security/auth.ts` excluded (defines `Auth`) |
| ARCH004 | Ambient browser escape | `(window as any)` untyped ambient-surface casts | |
| ARCH005 | Global state mutation | `localStorage` / `sessionStorage` / `document.` direct ambient-state access | owner file `src/persistence/browser-store.ts` excluded for storage plumbing |
| ARCH006 | Untyped escape cast | `as any` type assertions hiding dependencies | |

## Official B02B baseline at checkpoint `26cb63d…`

| Rule | Count |
|---|---|
| ARCH001 | 417 |
| ARCH002 | 243 |
| ARCH003 | 277 |
| ARCH004 | 67 |
| ARCH005 | 274 |
| ARCH006 | 496 |
| **TOTAL** | **1774** |

## Ratchet policy

- Any rule whose current count EXCEEDS its baseline value = NEW ARCHITECTURE
  VIOLATION → gate FAILS (exit 1).
- Reductions are always allowed and are the goal of Phase 2.
- Forbidden reduction techniques: renaming globals to dodge regexes, dynamic
  property access (`DB['data']`), `eval`, or casts that merely hide a real
  dependency. Reductions must be genuine seam introductions.

## Phase 2 boundaries (application seams)

- New layer: `src/application/**` — orchestration/use-case code ONLY.
  - MUST have zero occurrences of: `DB.`, `Auth.`, `UI.`/`toast(`/`Pages.`,
    `window`, `globalThis`, `localStorage`/`sessionStorage`/`document.`, `as any`.
  - Receives every dependency explicitly via contracts
    (`DataPort`, `AuthorizationPort`, `TransactionPort`, result/notification
    contracts in `src/application/contracts.ts`).
- Legacy adapters (the ONLY sanctioned place bridging seams → legacy globals):
  - `src/ui/legacy-action-deps.ts` (client boot wiring; passes `deps` objects
    into application use cases).
- `module: none` + `outFile` manual load order is preserved; new files are
  inserted in tsconfig `files` BEFORE their consumers. No ESM migration, no
  bundler change, no new `window.X = …`/`globalThis.X = …` exports, no new
  monkey patches.
