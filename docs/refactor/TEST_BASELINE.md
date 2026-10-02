# Actual test baseline

Node v24.19.0; npm ci succeeded. Initial unmodified client offline build succeeded. Initial server --noEmit failed with TS2769 query_timeout. After the approved typing-only fix server build is required to pass.

Node: 60 total, 43 PASS, 15 KNOWN BASELINE FAILURE, 2 KNOWN STRUCTURAL FAILURE. Exact paths, exit codes and failed-check fingerprints are in refactor-baseline.json. The first measurement was taken before source changes; fingerprint capture was repeated after the approved server type annotation only, with the same 43/60 result.

| Test | Classification | Evidence |
|---|---|---|
| `scripts/android-connectivity-smoke.mjs` | KNOWN BASELINE FAILURE | ["Error: connectivity check failed: Android release header is current"] |
| `scripts/brand-asset-smoke.mjs` | KNOWN BASELINE FAILURE | ["FAIL dist login identity 512 is versioned"] |
| `scripts/commercial-smoke.mjs` | KNOWN BASELINE FAILURE | [["freshNamespace", false]] |
| `scripts/contracts-inventory-smoke.mjs` | KNOWN BASELINE FAILURE | ["Error: العقد غير مؤكد/فعال"] |
| `scripts/customer-parity-smoke.mjs` | KNOWN STRUCTURAL FAILURE | ["Error: ENOENT: no such file or directory, open '/workspace/scratch/bd26b2259f60/repo/mobile-customer/index.html'"] |
| `scripts/data-protection-smoke.mjs` | KNOWN BASELINE FAILURE | ["AssertionError [ERR_ASSERTION]: erpbackup extension missing"] |
| `scripts/mobile-android-smoke.mjs` | KNOWN STRUCTURAL FAILURE | ["Error: ENOENT: no such file or directory, open '/workspace/scratch/bd26b2259f60/repo/mobile-customer/index.html'"] |
| `scripts/unified-more-cleanup-smoke.mjs` | KNOWN BASELINE FAILURE | [{"name": "print font selection follows settings with safe local fallback", "pass": false, "detail": ""}] |
| `scripts/v32470-regression-smoke.mjs` | KNOWN BASELINE FAILURE | [{"name": "release is current and runtime-aligned", "pass": false}] |
| `scripts/v32472-accounting-lifecycle-smoke.mjs` | KNOWN BASELINE FAILURE | ["Error: تم إغلاق البيع للبرنامج بتاريخ 2026-09-10"] |
| `scripts/v32481-mobile-ux-action-policy-smoke.mjs` | KNOWN BASELINE FAILURE | ["✗ Web/mobile live version header matches package release"] |
| `scripts/v32483-mobile-refresh-compact-filters-smoke.mjs` | KNOWN BASELINE FAILURE | ["FAIL root/server release versions are identical", "FAIL Android header current"] |
| `scripts/v32485-filter-refresh-font-smoke.mjs` | KNOWN BASELINE FAILURE | ["FAIL release aligned"] |
| `scripts/v32510-operations-execution-split-smoke.mjs` | KNOWN BASELINE FAILURE | [{"name": "server package version matches", "pass": false}, {"name": "mobile header version matches", "pass": false}] |
| `scripts/v32511-entity-backed-read-smoke.mjs` | KNOWN BASELINE FAILURE | [{"name": "release remains newer than the 32.5.11 read-source milestone", "pass": false}] |
| `scripts/v32512-entity-backed-write-smoke.mjs` | KNOWN BASELINE FAILURE | [{"name": "release remains at least 32.5.12", "pass": false}] |
| `scripts/v32565-party-transactions-report-smoke.mjs` | KNOWN BASELINE FAILURE | [["individualExcludesProgram", false]] |

Both structural failures require absent mobile-customer/index.html. This is absent in the starting tree, not a new missing file. Other failures include stale release/version assertions, print/font and asset checks, contract/lifecycle fixture behavior, and legacy transaction-report assertions. Existing tests were not changed.

Corrective pass installed Python Playwright 1.63.0 outside the repository. Full Chromium and headless-shell downloads each failed with invalid/truncated ZIP files (End of central directory record signature not found). All six existing browser scripts were attempted and fail at BrowserType.launch because the Chromium executable does not exist. ENVIRONMENT BLOCKER; no functional assertions executed. No Chromium workflow was validated. Database/real device/live server integration were not executed.

Corrective npm ci PASS; npm run refactor:check: client/server build PASS, 60 Node tests / 43 PASS / 15 known baseline / 2 known structural / 0 new regressions / no test suite drift; exit 2 solely for six browser blockers. npm run architecture:check: PASS / 0 new findings. Full-check is not rerun because browser runtime prerequisites remain unavailable. Existing tests and client production source unchanged.
