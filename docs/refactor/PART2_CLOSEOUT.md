# Part 2 closeout — modern modules baseline

Scope: tooling, gates and CI only. No business logic, accounting, DB schema, UI/UX or Android behaviour changed.
Late-bindings and compatibility globals are intentionally untouched.

## Commands
| Script | Purpose |
|---|---|
| `npm run typecheck` | client `tsc` (noEmit, ES2020 modules) |
| `npm run build` | typecheck + esbuild bundle (`src/main.ts` -> `dist/app.js`) + static copy + server build |
| `npm run module:check` | module graph from `src/main.ts`: evaluation order, orphans, cycles, duplicate evaluations (esbuild metafile) |
| `npm run architecture:check` | architecture ratchet (must never increase) |
| `npm run test:baseline` | pinned Node inventory vs `refactor-baseline.json` (browser NOT EXECUTED) |
| `npm run release:check` | final aggregate gate (`-- --with-browser` adds the six browser tests) |
| `npm run pins:update` | deliberate re-pin of tests/baselines/gates after a reviewed change |

## Single source of truth
`scripts/lib/build-model.mjs` discovers modules from `src/main.ts`. Every checker uses it; `tsconfig.files` no longer exists.

## Baseline gate semantics (`scripts/refactor-check.mjs`)
* A failing pinned test is accepted only if its exit code matches and **every failing check is already recorded** in the baseline. A strict subset is reported `KNOWN BASELINE FAILURE (REDUCED)`. Any failing check not in the baseline is `NEW REGRESSION`.
* Failure evidence is machine independent (absolute checkout paths are normalised). Previously the fingerprint embedded the recording machine's path, so two structural failures (`mobile-customer/index.html` absent) were reported as new on every other machine.
* Toolchain not as pinned (TypeScript/esbuild version, missing `@types/node`) makes the server build `ENVIRONMENT BLOCKER`, never PASS.

## Statuses
`PASS`, `FAIL`, `ENVIRONMENT BLOCKED`, `NOT EXECUTED`. Blocked/unexecuted steps are never reported as PASS.

## Differential checks (application / business / presentation)
They compare current code with pre-Part-2 commits via `git show <sha>:<file>`. They now read the file list from `build-model.mjs` and exit 3 (`ENVIRONMENT BLOCKED`) when those commits are not in the clone. CI uses `fetch-depth: 0`. Their current-side loader has not been exercised against real history in this closeout.

## Pins
`docs/refactor/part2-pins.json` holds sha256 of the 66 pinned tests, both baselines, the module-order spec and the gates. Silent drift fails `release:check`.
