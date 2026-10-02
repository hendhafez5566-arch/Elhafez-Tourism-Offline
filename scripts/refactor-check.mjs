#!/usr/bin/env node
/*
 * refactor-check.mjs — B01B Regression Gate (Batch 01B)
 *
 * Purpose:
 *   Verify that the repository still matches the recorded legacy baseline in
 *   docs/refactor/refactor-baseline.json. This gate is a REFACTOR SAFETY net;
 *   it never modifies source or test code.
 *
 * Checks:
 *   1. Client build        : npm run build            (tsc client + copy-static)
 *   2. Server TS build     : tsc -p server/tsconfig.json --noEmit
 *                            (no-emit so tracked generated artifacts under
 *                             server/dist are not rewritten by the gate)
 *   3. Node smoke suite    : every scripts/*-smoke.mjs executed individually,
 *                            results compared against the baseline.
 *
 * Classification rules (see docs/refactor/TEST_BASELINE.md):
 *   - Failure listed in expectedPreExistingFailures / knownStructuralFailures
 *     and still failing              => KNOWN BASELINE FAILURE (allowed)
 *   - Baseline failure now passing    => BASELINE IMPROVEMENT   (allowed)
 *   - Any other new failing test      => NEW REGRESSION         (fatal)
 *   - Test set differs from baseline  => TEST SUITE DRIFT       (fatal)
 *     (disappeared baseline test OR unexpected extra test)
 *
 * Exit 0 only if: CLIENT PASS && SERVER PASS && NO NEW REGRESSION && NO TEST SUITE DRIFT
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const scriptsDir = path.join(root, 'scripts');

function readBaseline() {
  const p = path.join(root, 'docs', 'refactor', 'refactor-baseline.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function run(label, cmd, args, opts = {}) {
  console.log(`\n===== ${label} =====`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: opts.capture ? 'pipe' : 'inherit', encoding: opts.capture ? 'utf8' : undefined, env: process.env });
  const ok = r.status === 0;
  console.log(`${label}: ${ok ? 'PASS' : 'FAIL'} (exit ${r.status})`);
  return { ok, result: r };
}

// ---- Build checks -----------------------------------------------------------
// Client build: tsc -p tsconfig.json && node scripts/copy-static.mjs
// (same first two steps as `npm run build`; the third step of `npm run build`
//  would re-emit tracked generated artifacts, so the server leg is checked
//  separately with --noEmit instead.)
const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const clientTsc = run('CLIENT BUILD (tsc -p tsconfig.json)', process.execPath, [tscBin, '-p', path.join(root, 'tsconfig.json')]);
const clientStatic = clientTsc.ok ? run('CLIENT STATIC COPY (scripts/copy-static.mjs)', process.execPath, [path.join(scriptsDir, 'copy-static.mjs')]) : { ok: false };
const clientBuild = { ok: clientTsc.ok && clientStatic.ok };

const serverBuild = run('SERVER BUILD (tsc -p server/tsconfig.json --noEmit)', process.execPath, [tscBin, '-p', path.join(root, 'server', 'tsconfig.json'), '--noEmit']);

// ---- Smoke suite ------------------------------------------------------------
const discovered = fs.readdirSync(scriptsDir).filter((x) => x.endsWith('-smoke.mjs')).sort();
const keys = discovered.map((f) => f.replace(/-smoke\.mjs$/, ''));

const baseline = readBaseline();
const expectedFail = new Set(baseline.expectedPreExistingFailures);
const structuralFail = new Map(baseline.knownStructuralFailures.map((k) => [k.key, k.reason]));
const baselineKnown = new Set([...expectedFail, ...structuralFail.keys()]);
const keySet = new Set(keys);

// ---- Drift (computed before running tests) ----------------------------------
// TEST SUITE DRIFT means the discovered CURRENT TEST SET no longer matches the
// full BASELINE nodeTests SET (exact set comparison, not failures-only):
//   - a baseline test disappeared
//   - an unexpected/new test appeared
//   - a test was renamed (surfaces as one missing + one extra)
// Enforced even when the suite count still equals nodeTotal.
// Backwards compatibility: if the baseline predates the full nodeTests record,
// fall back to known-failure membership plus the recorded nodeTotal.
const baselineTests = Array.isArray(baseline.nodeTests) ? [...baseline.nodeTests] : null;
let drift;
if (baselineTests) {
  const baselineTestSet = new Set(baselineTests);
  const missing = baselineTests.filter((k) => !keySet.has(k));
  const extra = keys.filter((k) => !baselineTestSet.has(k));
  drift = [
    ...missing.map((k) => `missing baseline test: ${k}`),
    ...extra.map((k) => `unexpected new test: ${k}`),
  ];
} else {
  const driftMissing = [...baselineKnown].filter((k) => !keySet.has(k));
  const driftExtra = keys.length !== baseline.nodeTotal && driftMissing.length === 0
    ? [`suite size ${keys.length} != baseline nodeTotal ${baseline.nodeTotal}`]
    : [];
  drift = [...driftMissing.map((k) => `missing baseline test: ${k}`), ...driftExtra];
}

const failures = [];
let passCount = 0;
for (const key of keys) {
  const file = path.join(scriptsDir, `${key}-smoke.mjs`);
  const r = spawnSync(process.execPath, [file], { cwd: root, stdio: 'ignore', env: process.env });
  if (r.status === 0) passCount++;
  else failures.push(key);
}

// ---- Classification ---------------------------------------------------------
const regressions = failures.filter((k) => !baselineKnown.has(k));
const improvements = [...baselineKnown].filter((k) => !failures.includes(k) && keySet.has(k));
const knownFailing = failures.filter((k) => expectedFail.has(k));
const structuralFailing = failures.filter((k) => structuralFail.has(k));

// ---- Report -----------------------------------------------------------------
console.log('\n================ REFACTOR CHECK REPORT ================');
console.log(`CLIENT BUILD              : ${clientBuild.ok ? 'PASS' : 'FAIL'}`);
console.log(`SERVER BUILD              : ${serverBuild.ok ? 'PASS' : 'FAIL'}`);
console.log(`NODE TOTAL                : ${keys.length}   (baseline: ${baseline.nodeTotal})`);
console.log(`NODE PASS                 : ${passCount}   (baseline: ${baseline.nodePass})`);
console.log(`KNOWN BASELINE FAILURES   : ${knownFailing.length}/${expectedFail.size}`);
console.log(`KNOWN STRUCTURAL FAILURES : ${structuralFailing.length}/${structuralFail.size}`);
console.log(`NEW REGRESSIONS           : ${regressions.length}${regressions.length ? ' -> ' + regressions.join(', ') : ''}`);
console.log(`BASELINE IMPROVEMENTS     : ${improvements.length}${improvements.length ? ' -> ' + improvements.join(', ') : ''}`);
console.log(`TEST SUITE DRIFT          : ${drift.length ? 'YES -> ' + drift.join('; ') : 'NO'}`);

const clientOk = clientBuild.ok;
const serverOk = serverBuild.ok;
const noRegression = regressions.length === 0;
const noDrift = drift.length === 0;
const exitOk = clientOk && serverOk && noRegression && noDrift;

console.log(`\nGATE VERDICT              : ${exitOk ? 'PASS' : 'FAIL'}`);
console.log('========================================================');
process.exit(exitOk ? 0 : 1);
