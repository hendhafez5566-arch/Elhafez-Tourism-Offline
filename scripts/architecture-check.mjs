#!/usr/bin/env node
/*
 * architecture-check.mjs — B02B Architecture Ratchet (Batch 02B)
 *
 * Purpose:
 *   Prevent NEW architectural entanglement from being introduced while the
 *   legacy system is refactored incrementally. This gate is a RATCHET:
 *
 *     CURRENT < BASELINE  => IMPROVEMENT (allowed, PASS)
 *     CURRENT == BASELINE => PASS
 *     CURRENT > BASELINE in any baseline file        => NEW ARCHITECTURE VIOLATION (FAIL)
 *     Baseline rule violation appears in a NEW file  => NEW ARCHITECTURE VIOLATION (FAIL)
 *     A violating file disappears entirely           => IMPROVEMENT (allowed, PASS)
 *
 * Identity model:
 *   Violations are identified by (file path, normalized rule id, occurrence
 *   count). Line numbers are NEVER part of the identity, so inserting an
 *   unrelated line at the top of a file does not register as a new violation.
 *
 * This checker is strictly READ-ONLY. It never writes to src/** or any file.
 *
 * Rules (see docs/refactor/ARCHITECTURE_BOUNDARIES.md):
 *   ARCH001  Direct DB global persistence access from UI/presentation code.
 *   ARCH002  UI-layer globals (UI / Pages / toast) used from persistence,
 *            core, feature-domain, security or support code (reverse edge).
 *   ARCH003  Auth global coupling outside the designated auth module
 *            (src/security/**) and bootstrap entry points.
 *   ARCH004  Monkey-patching: reassignment of UI./DB./Auth. public members
 *            (including `(UI as any).x = ...` forms).
 *   ARCH005  window/globalThis mutation inside src/**.
 *   ARCH006  Forbidden cross-layer dependency hotspots (upward edges against
 *            the target layering: UI -> application -> domain -> persistence).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const BASELINE_PATH = path.join(root, 'docs', 'refactor', 'architecture-baseline.json');

// ---- Layer classification ----------------------------------------------------
function layerOf(rel) {
  if (rel.startsWith('src/ui/') || rel === 'src/mobile.ts' || rel === 'src/pwa.ts') return 'ui';
  if (rel.startsWith('src/persistence/')) return 'persistence';
  if (rel.startsWith('src/security/')) return 'security';
  if (rel.startsWith('src/core/')) return 'core';
  if (rel.startsWith('src/accounting/') || rel.startsWith('src/finance/') ||
      rel.startsWith('src/crm/') || rel.startsWith('src/commercial/')) return 'feature-domain';
  return 'support'; // src/app.ts, src/bootstrap.ts, reports, documents, integrated...
}

// ---- Source normalization ----------------------------------------------------
// Strip comments and string/template literal contents (so HTML produced for
// the DOM is not mistaken for real global usage), while preserving line
// structure. Template-literal ${...} interpolations ARE kept (real code).
function stripNonCode(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === q) { i++; break; }
        if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
          // keep interpolation expression content (it is executable code)
          out += src[i++] + src[i++];
          continue;
        }
        i++;
      }
      out += ' ';
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// ---- Rule definitions ----------------------------------------------------------
const DB_MEMBERS = ['data', 'ensure', 'save', 'persist', 'atomic', 'atomicAsync', 'fastAtomic', 'log'];
const AUTH_MEMBERS = ['can', 'require', 'user', 'isAdmin', 'hasRole', 'permissions', 'login', 'logout', 'enter'];

const RULES = {
  ARCH001: {
    description: 'Direct DB global persistence access from UI/presentation code.',
    applies: (rel) => layerOf(rel) === 'ui',
    pattern: () => new RegExp('\\bDB\\s*\\.\\s*(?:' + DB_MEMBERS.join('|') + ')\\b(?!\\s*[=:])', 'g'),
  },
  ARCH002: {
    description: 'UI-layer globals (UI/Pages/toast) referenced from persistence/core/domain/security/support code (reverse upward dependency).',
    applies: (rel) => ['persistence', 'core', 'feature-domain', 'security', 'support'].includes(layerOf(rel)),
    pattern: () => /\b(?:UI|Pages|toast)\b(?!\s*[=:])/g,
  },
  ARCH003: {
    description: 'Auth global coupling outside designated auth/access-control locations (src/security/**, src/bootstrap.ts).',
    applies: (rel) => !rel.startsWith('src/security/') && rel !== 'src/bootstrap.ts',
    pattern: () => new RegExp('\\bAuth\\s*\\.\\s*(?:' + AUTH_MEMBERS.join('|') + ')\\b(?!\\s*[=:])', 'g'),
  },
  ARCH004: {
    description: 'Monkey-patching: reassignment of UI./DB./Auth. public members.',
    applies: () => true,
    pattern: () => /(?:^|[;{}\n]\s*)((?:UI|DB|Auth)\s*\.\s*[A-Za-z_$][\w$]*|\(\s*(?:UI|DB|Auth)\s+as\s+any\s*\)\s*\.\s*[A-Za-z_$][\w$]*)\s*=[^=]/gm,
  },
  ARCH005: {
    description: 'window/globalThis mutation inside src/**.',
    applies: () => true,
    pattern: () => /\b(?:window|globalThis)\s*(?:\.[A-Za-z_$][\w$]*\s*=[^=]|\[[^\]]+\]\s*=[^=])|\)\s*(?:\.[A-Za-z_$][\w$]*\s*=[^=]|\[[^\]]+\]\s*=[^=])/g,
  },
  ARCH006: {
    description: 'Forbidden cross-layer dependency hotspot (upward global reference against target layering UI->application->domain->persistence).',
    applies: () => true,
    pattern: null, // computed per-file below (sum over forbidden edges)
  },
};

// Globals and their owning layers, used by ARCH006.
const GLOBAL_OWNER = { UI: 'ui', Pages: 'ui', toast: 'ui', DB: 'persistence', Auth: 'security' };
// Allowed (downward/tolerated) edges in the legacy baseline direction sense:
//   ui -> persistence, ui -> security, feature-domain -> persistence, support -> persistence
const EDGE_ALLOWED = new Set(['ui>persistence', 'ui>security', 'feature-domain>persistence', 'support>persistence']);

function countArch006For(rel, code) {
  const l = layerOf(rel);
  let total = 0;
  for (const [g, gl] of Object.entries(GLOBAL_OWNER)) {
    if (gl === l) continue;
    if (EDGE_ALLOWED.has(l + '>' + gl)) continue;
    const m = code.match(new RegExp('\\b' + g + '\\b(?!\\s*[=:])', 'g'));
    if (m) total += m.length;
  }
  return total;
}

// ---- Scanning ------------------------------------------------------------------
function listSourceFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.ts$/.test(e.name)) out.push(path.relative(root, p).split(path.sep).join('/'));
    }
  })(dir);
  return out.sort();
}

function scan() {
  const srcDir = path.join(root, 'src');
  const files = listSourceFiles(srcDir);
  const result = {}; // ruleId -> { file: count }
  for (const rid of Object.keys(RULES)) result[rid] = {};
  for (const rel of files) {
    const raw = fs.readFileSync(path.join(root, rel), 'utf8');
    const code = stripNonCode(raw);
    for (const [rid, rule] of Object.entries(RULES)) {
      if (!rule.applies(rel)) continue;
      let count = 0;
      if (rid === 'ARCH006') {
        count = countArch006For(rel, code);
      } else {
        const m = code.match(rule.pattern());
        count = m ? m.length : 0;
      }
      if (count > 0) result[rid][rel] = count;
    }
  }
  return result;
}

// ---- Scan --------------------------------------------------------------------
const current = scan();

// ---- Baseline generation mode (used once in B02B; NOT part of the gate) ----
if (process.argv.includes('--generate-baseline')) {
  const rules = {};
  let total = 0;
  for (const [rid, rule] of Object.entries(RULES)) {
    const files = current[rid];
    const t = Object.values(files).reduce((a, b) => a + b, 0);
    total += t;
    rules[rid] = { description: rule.description, totalOccurrences: t, fileCount: Object.keys(files).length, files };
  }
  const doc = {
    version: 1,
    checkpointSha: process.env.ARCH_BASELINE_SHA || '',
    generatedBy: 'scripts/architecture-check.mjs --generate-baseline',
    identityModel: 'file path + normalized rule id + occurrence count (line numbers are NOT identity)',
    totalViolations: total,
    rules,
  };
  process.stdout.write(JSON.stringify(doc, null, 2) + '\n');
  process.exit(0);
}

// ---- Ratchet comparison ----------------------------------------------------------
let baseline;
try {
  baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
} catch (e) {
  console.error('ARCHITECTURE CHECK ERROR: cannot read baseline at ' + BASELINE_PATH);
  console.error(String(e.message || e));
  process.exit(1);
}

const violations = [];
const improvements = [];
let currentTotal = 0;
for (const [rid, basePerFile] of Object.entries(baseline.rules || {})) {
  const cur = current[rid] || {};
  const baseMap = basePerFile.files || {};
  const allFiles = new Set([...Object.keys(baseMap), ...Object.keys(cur)]);
  for (const f of [...allFiles].sort()) {
    const b = baseMap[f] || 0;
    const c = cur[f] || 0;
    currentTotal += c;
    if (c > b) {
      violations.push({ rule: rid, file: f, baseline: b, current: c, added: c - b, newFile: b === 0 });
    } else if (c < b) {
      improvements.push({ rule: rid, file: f, baseline: b, current: c, removed: b - c });
    }
  }
}
// Unknown rules present in current but not in baseline would be caught above
// only if declared; guard against a rule silently disappearing from scanner:
for (const rid of Object.keys(current)) {
  if (!(rid in (baseline.rules || {})) && Object.keys(current[rid]).length > 0) {
    violations.push({ rule: rid, file: '(rule missing from baseline)', baseline: 0, current: Object.values(current[rid]).reduce((a, x) => a + x, 0), added: 0, newFile: true });
  }
}

// ---- Report ----------------------------------------------------------------------
console.log('\n================ ARCHITECTURE CHECK (RATCHET) ================');
console.log('Baseline checkpoint : ' + (baseline.checkpointSha || 'unknown'));
console.log('Baseline version    : ' + (baseline.version ?? '?'));
for (const rid of Object.keys(RULES)) {
  const baseTotal = Object.values((baseline.rules[rid] || {}).files || {}).reduce((a, b) => a + b, 0);
  const curTotal = Object.values(current[rid] || {}).reduce((a, b) => a + b, 0);
  const status = curTotal <= baseTotal ? (curTotal < baseTotal ? 'IMPROVED' : 'PASS') : 'CHECK';
  console.log(`${rid}  baseline=${String(baseTotal).padStart(4)}  current=${String(curTotal).padStart(4)}  ${status}`);
}
console.log(`TOTAL GRANDFATHERED (baseline) : ${baseline.totalViolations ?? '-'}`);
console.log(`TOTAL CURRENT                  : ${currentTotal}`);
console.log(`NEW ARCHITECTURE VIOLATIONS    : ${violations.length}`);
console.log(`BASELINE IMPROVEMENTS          : ${improvements.length}`);
if (violations.length) {
  console.log('\n--- NEW ARCHITECTURE VIOLATIONS (gate failure) ---');
  for (const v of violations) {
    console.log(`  ${v.rule}  ${v.file}: baseline ${v.baseline} -> current ${v.current} (+${v.added})${v.newFile ? '  [NEW FILE FOR THIS RULE]' : ''}`);
  }
}
if (improvements.length) {
  console.log('\n--- IMPROVEMENTS (allowed; consider re-baselining downward later) ---');
  for (const v of improvements) console.log(`  ${v.rule}  ${v.file}: baseline ${v.baseline} -> current ${v.current} (-${v.removed})`);
}
const verdict = violations.length === 0;
console.log(`\nARCHITECTURE CHECK ${verdict ? 'PASS' : 'FAIL'}`);
console.log('==============================================================');
process.exit(verdict ? 0 : 1);
