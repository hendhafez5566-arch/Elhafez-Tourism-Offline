# Phase 01 handoff

PHASE: 1 / 5
BASE: main
START SHA: e97fa6d9cb52acb22b676e1b975c1b2332bc9a13
BRANCH: phase-1-foundation-work
FINAL SHA: resolve `git rev-parse phase-1-foundation-work` after publication; exact SHA appears in the execution final report. A commit cannot embed its own final hash without changing that hash. This handoff belongs to the single foundation commit.
COMMIT MESSAGE: refactor: establish phase 1 safety foundation
WORK GITHUB WRITE TEST: PASSED

PRODUCTION BUSINESS BEHAVIOR CHANGED: NO
Production source edit: server/src/server.ts, approved pg ClientConfig/QueryConfig type intersection around unchanged select 1 / query_timeout 3000 health check. No any/suppression added. No client/UI/schema/migration/accounting/workflow/permission/offline/native changes. Existing tests unchanged. Generated server output restored after validation.

## Added files

- `docs/refactor/ARCHITECTURE_BOUNDARIES.md`
- `docs/refactor/BASELINE.md`
- `docs/refactor/DEPENDENCY_HOTSPOTS.md`
- `docs/refactor/GENERATED_ARTIFACT_POLICY.md`
- `docs/refactor/PHASE_01_HANDOFF.md`
- `docs/refactor/REPOSITORY_CLASSIFICATION.md`
- `docs/refactor/TEST_BASELINE.md`
- `docs/refactor/VERIFICATION_STRATEGY.md`
- `docs/refactor/architecture-baseline.json`
- `docs/refactor/refactor-baseline.json`
- `scripts/architecture-check.mjs`
- `scripts/refactor-check.mjs`

## Modified files

- package.json: three additional scripts; existing scripts preserved.
- server/src/server.ts: approved health-query annotation only.

.gitignore already exactly matched the seven required lines, unchanged. Historical manifests/reports retained because original checksum/path references remain meaningful.

## Actual validation

npm ci succeeded: 115 packages installed. Unmodified client build PASS; unmodified server --noEmit TS2769; server build after annotation PASS.

npm run refactor:full-check exits 2 solely because six browser scripts cannot launch Chromium. Client build PASS, server build PASS. NODE TOTAL 60; PASS 43; KNOWN BASELINE FAILURE 15; KNOWN STRUCTURAL FAILURE 2; NEW REGRESSIONS 0; TEST SUITE DRIFT NO. No baseline improvements. TEST_BASELINE.md and refactor-baseline.json contain exact failures and evidence.

Because && short-circuits on blockers, npm run architecture:check also ran independently: PASS, no additions or reductions.

Architecture counts:

- ARCH001: 493
- ARCH002: 151
- ARCH003: 363
- ARCH004: 68
- ARCH005: 11
- ARCH006: 169
- TOTAL: 1255

Source self-test: temporary new presentation source with UI reassignment, DB access and window mutation correctly rejected; fully removed; rescan PASS. Unexpected temporary smoke script rejected as test suite drift; fully removed.

Top hotspots: src/ui/actions.ts 310, src/commercial/actions.ts 136, src/crm/party360.ts 108, src/ui/pages.ts 97, src/ui/clean-pages.ts 76. See DEPENDENCY_HOTSPOTS.md. Limitations: syntax-only named global graph; no module-none import graph; mixed file classification, aliases/shadowing, conservative state-member assignment findings. Signatures match per rule/file with multiplicity; same-count new occurrences fail. Exact limitations in ARCHITECTURE_BOUNDARIES.md.

Generated dist/server-dist/Android assets remain temporarily tracked; restored after verification. Policy in GENERATED_ARTIFACT_POLICY.md. Dependency directories physically removed after final successful npm architecture check; no subsequent npm invocation. Tracked dependency count verified zero before publication.

## Remaining verification

ENVIRONMENT BLOCKERS: six browser smoke scripts, missing Chromium executable after failed browser-download retries. Browser runtime, live database and native device behavior are not claimed as tested. Foundation implementation can be reviewed, but the full gate remains BLOCKED pending browser prerequisites. Remote SHA and compare are verified in the execution final report. No main merge. No Phase 2 work.

## Final corrective pass only

CURRENT HEAD BEFORE FIX: ba4511a56ec181ad89e802256e48e7a8ba13c807
CORRECTIVE COMMIT MESSAGE: fix: harden phase 1 architecture guardrails
FINAL HEAD: resolve branch HEAD after publication; exact hash in final execution report (cannot embed the enclosing commit hash in that same commit).

Before: ARCH001 493 / ARCH002 23 / ARCH003 363 / ARCH004 170 / ARCH005 11 / ARCH006 27 / TOTAL 1087.
After: ARCH001 493 / ARCH002 151 / ARCH003 363 / ARCH004 68 / ARCH005 11 / ARCH006 169 / TOTAL 1255.
CRM and Commercial are domain-core except presentation files. Direct-root member detection strips casts/parentheses; nested state writes and nested helper receivers excluded from ARCH004. Other rule definitions unchanged. Signature identity limitation for identical normalized occurrences is documented.

Architecture baseline regenerated solely to correct Phase 1 measurement on unchanged src/** (verified against original start). No production source modifications in this commit. Temporary CRM source self-test verified seven direct monkey patches count, nested writes/helpers do not, ARCH002 and ARCH006 catch upward references, negative ratchet rejects, and clean ratchet passes after removal. No temporary source committed.

Python playwright installed outside repository, version 1.63.0. Chromium full install and alternate headless-only install failed after retries: invalid/truncated ZIP, End of central directory record signature not found. All six existing browser scripts attempted: missing Chromium executable at launch, zero executed functional tests. Browser baseline evidence refreshed only for actual environment results; all Node baseline entries unchanged. No Python/browser packages committed. No dependency-system installation needed: downloads failed before launch/dependency validation.

Required verification: npm ci succeeds; refactor:check exit 2 (only browser blockers), 0 new Node regressions, no test suite drift; architecture:check PASS and 0 new violations. Browser prerequisites unavailable so conditional full-check not repeated. Dependency directories removed after final verification commands; no npm afterward. Final status BLOCKED solely for browser runtime. No main merge, no Phase 2.
