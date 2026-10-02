#!/usr/bin/env node
/*
 * architecture-check.mjs — B02B Architecture Ratchet Gate (Phase 1 guardrail)
 *
 * Purpose:
 *   Measure structural coupling debt in the LEGACY client source tree and
 *   ratchet it DOWN only. This gate never modifies source code.
 *
 * Rules (measured over all client TypeScript sources, comments stripped):
 *   ARCH001  DB direct access           : `DB.` member access (persistence global)
 *   ARCH002  UI global coupling         : `UI.` / `toast(` / `Pages.` presentation globals
 *   ARCH003  Auth global coupling       : `Auth.` member access (authorization global)
 *   ARCH004  window/globalThis access   : ambient browser surface escapes
 *   ARCH005  ambient global mutation    : localStorage / sessionStorage / document.* writes & reads
 *   ARCH006  untyped escape casts       : `as any` casts
 *
 * Exclusions:
 *   - src/persistence/browser-store.ts owns the `DB` global definition;
 *     its internal self-references are not counted as external coupling.
 *   - src/security/auth.ts owns the `Auth` global definition likewise.
 *
 * Baseline: docs/refactor/architecture-baseline.json recorded at the Phase 2
 * start checkpoint. Any rule whose current count EXCEEDS its baseline value is
 * a NEW ARCHITECTURE VIOLATION => gate FAILS. Reductions are always allowed.
 *
 * Exit 0 only if every rule is <= baseline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const baselinePath = path.join(root, 'docs', 'refactor', 'architecture-baseline.json');

const RULES = [
  ['ARCH001', 'DB direct access',        /\bDB\.[A-Za-z_$]/g],
  ['ARCH002', 'UI global coupling',      /\bUI\.[A-Za-z_$]|\btoast\s*\(|\bPages\.[A-Za-z_$]/g],
  ['ARCH003', 'Auth global coupling',    /\bAuth\.[A-Za-z_$]/g],
  ['ARCH004', 'window/globalThis access',/\bwindow\b|\bglobalThis\b/g],
  ['ARCH005', 'ambient global mutation', /\blocalStorage\b|\bsessionStorage\b|\bdocument\s*\./g],
  ['ARCH006', 'untyped escape casts',    /\bas\s+any\b/g],
];

function stripComments(src) {
  // Remove block and line comments without touching string contents.
  let out = '', i = 0, quote = null;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') { out += d || ''; i += 2; continue; }
      if (c === quote) quote = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

function collectFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collectFiles(p));
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out.sort();
}

const OWNERS = { ARCH001: 'src/persistence/browser-store.ts', ARCH003: 'src/security/auth.ts' };

const srcDir = path.join(root, 'src');
const files = collectFiles(srcDir);
const counts = Object.fromEntries(RULES.map(([id]) => [id, 0]));
const perFile = {};

for (const abs of files) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  const body = stripComments(fs.readFileSync(abs, 'utf8'));
  for (const [id, , re] of RULES) {
    if (OWNERS[id] === rel) continue; // global owner file excluded for that rule
    const m = body.match(re);
    if (m && m.length) {
      counts[id] += m.length;
      (perFile[rel] ||= {})[id] = (perFile[rel][id] || 0) + m.length;
    }
  }
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

console.log('===== ARCHITECTURE CHECK =====');
console.log(`checkpointSha: ${baseline.checkpointSha}`);
let failures = 0;
for (const [id, label] of RULES) {
  const cur = counts[id], base = baseline.rules[id]?.current ?? 0;
  const delta = cur - base;
  const status = delta > 0 ? 'REGRESSION' : (delta < 0 ? 'IMPROVED' : 'SAME');
  if (delta > 0) failures++;
  console.log(`${id} (${label}): current=${cur} baseline=${base} delta=${delta > 0 ? '+' : ''}${delta} ${status}`);
}
console.log(`TOTAL CURRENT = ${total} (baseline TOTAL = ${baseline.totalCurrent})`);
console.log(`NEW ARCHITECTURE VIOLATIONS: ${failures}`);
if (process.env.ARCH_REPORT) {
  for (const [f, rules] of Object.entries(perFile)) console.log(`  ${f}: ${JSON.stringify(rules)}`);
}
console.log(`ARCHITECTURE CHECK: ${failures === 0 ? 'PASS' : 'FAIL'}`);
process.exit(failures === 0 ? 0 : 1);
