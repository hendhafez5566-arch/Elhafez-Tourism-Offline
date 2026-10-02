# BATCH_00_HANDOFF — Baseline Documentation

- **Batch:** B00 (docs-only)
- **Repo:** hendhafez5566-arch/Elhafez-Tourism-Offline
- **Branch:** `qwen-code-404f5502-fda0-4972-b967-266e06cc7db2` (Task branch managed by Qwen UI; no manual branch created)
- **Start SHA:** `e97fa6d9cb52acb22b676e1b975c1b2332bc9a13` (= main, v32.5.66)
- **Pre-checks executed before any edit:** `git status` (clean), `git rev-parse HEAD`, `git log --oneline -3` — all matched EXPECTED START.

## Deliverables (this batch)

| File | Content |
|---|---|
| `docs/refactor/BASELINE.md` | TS file counts (68 client / 15 server / 83 total), smoke inventory (60), DB/UI/Auth global usage, monkey-patching hotspots, tsconfig manual ordering (68-entry `files`), largest TS files, generated directories (`dist`, `server/dist`, android assets public), RELEASE_* clutter, baseline build/test state |
| `docs/refactor/TEST_BASELINE.md` | Executed suite result: **43/60 pass**, 15 expected pre-existing failures + 2 known structural failures (missing `mobile-customer/index.html`) |
| `docs/refactor/DEPENDENCY_HOTSPOTS.md` | module:none global graph, Object.assign namespace patches (56), CRM method wrap, UmrahCore property proxying, server import shape, generated-tree drift risks |

## Evidence commands (reproducible)

```bash
npm ci
node scripts/all-node-smokes.mjs        # → "Node smoke summary: 43/60 passed"
ls scripts/*-smoke.mjs | wc -l          # → 60
find src -name '*.ts' ! -name '*.d.ts' | wc -l           # → 68
find server/src -name '*.ts' ! -name '*.d.ts' | wc -l    # → 15
tsc -p tsconfig.json                    # → PASS
tsc -p server/tsconfig.json             # → FAIL TS2769 query_timeout (pre-B01A)
```

## Constraints honored

- No source code modified in B00 (only new files under `docs/refactor/`).
- No existing tests changed.
- Counts recorded from actual execution at the start SHA, not assumed.

## Handoff to B01A

Server build currently fails with a types-only error:
`server/src/server.ts(55,80): TS2769 'query_timeout' does not exist in type 'QueryConfig<any[]>'`.
B01A must apply the narrow intersection-type fix
(`QueryConfig & Pick<ClientConfig, 'query_timeout'>`) with no runtime/SQL/behavior change.
