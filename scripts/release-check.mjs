// `npm run release:check` — the final aggregate gate for the Part 2 ES-module baseline.
// Statuses: PASS | FAIL | ENVIRONMENT BLOCKED | NOT EXECUTED. A blocked or unexecuted step is NEVER reported as PASS.
// Exit code: 0 = everything PASS (browser may be NOT EXECUTED without --with-browser), 1 = at least one FAIL, 2 = no FAIL but something is BLOCKED.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { discover, toolchainProblems } from './refactor-check.mjs';
import { scan, counts } from './architecture-check.mjs';
import { root, ENTRY, compiledFiles, moduleGraph, orphanModules } from './lib/build-model.mjs';

const withBrowser = process.argv.includes('--with-browser');
const results = [];
const record = (name, status, detail = '') => { results.push({ name, status, detail }); console.log(`${status.padEnd(19)} ${name}${detail ? ' — ' + detail : ''}`); };
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
function run(command, args, timeout = 900000) { return spawnSync(command, args, { cwd: root, encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024 }); }
function step(name, fn) { try { const r = fn(); if (r) record(name, r.status, r.detail); } catch (e) { record(name, 'FAIL', String(e.message).split('\n')[0]); } }
const check = (ok, label) => { if (!ok) throw new Error(label); };
const staticFailures = [];
function staticCheck(label, ok) { if (!ok) staticFailures.push(label); }

// ---- 1. Static contract of the ES-module build model -------------------------------------------------------------
step('BUILD MODEL (es-modules, no legacy)', () => {
  const raw = read('tsconfig.json'), config = JSON.parse(raw), o = config.compilerOptions;
  staticCheck('tsconfig: module must not be "none"', String(o.module).toLowerCase() !== 'none');
  staticCheck('tsconfig: module is ES2020', String(o.module).toUpperCase() === 'ES2020' && o.target === 'ES2020');
  staticCheck('tsconfig: no outFile (legacy single-file output)', o.outFile === undefined && !/outFile/.test(raw));
  staticCheck('tsconfig: no manual "files" list', config.files === undefined);
  staticCheck('tsconfig: type-check only (noEmit)', o.noEmit === true);
  staticCheck('tsconfig: include is src/**/*.ts', JSON.stringify(config.include) === JSON.stringify(['src/**/*.ts']));
  const bundler = read('scripts/bundle-app.mjs');
  staticCheck(`bundler entry is ${ENTRY}`, /entryPoints:\s*\['src\/main\.ts'\]/.test(bundler) && ENTRY === 'src/main.ts');
  const graph = moduleGraph();
  staticCheck('main.ts is the graph root', graph.order[graph.order.length - 1] === ENTRY);
  for (const f of compiledFiles()) { const sf = ts.createSourceFile(f, read(f), ts.ScriptTarget.ES2020, true); staticCheck(`module parses: ${f}`, sf.parseDiagnostics.length === 0); }
  for (const f of fs.readdirSync(path.join(root, 'src'), { recursive: true }).filter((x) => String(x).endsWith('.ts')).map((x) => 'src/' + String(x).replaceAll(path.sep, '/')).concat(fs.readdirSync(path.join(root, 'server/src')).filter((x) => x.endsWith('.ts')).map((x) => 'server/src/' + x))) staticCheck(`no @ts-ignore/@ts-expect-error: ${f}`, !/@ts-(?:ignore|expect-error)/.test(read(f)));
  const bootstrap = read('src/bootstrap.ts');
  staticCheck('one startup composition root', (bootstrap.match(/\(async\(\)=>\{/g) || []).length === 1);
  staticCheck('startup order DB -> Commercial -> Auth', bootstrap.indexOf('await DB.init()') < bootstrap.indexOf('await Commercial.afterInit()') && bootstrap.indexOf('await Commercial.afterInit()') < bootstrap.lastIndexOf('await Auth.init()'));
  const order = compiledFiles();
  for (const [a, b] of [['src/platform/platform-contracts.ts', 'src/platform/browser-platform.ts'], ['src/application/contracts.ts', 'src/application/document-actions.ts'], ['src/ui/ui.ts', 'src/ui/data-table.ts'], ['src/ui/forms.ts', 'src/ui/forms-definitions.ts'], ['src/mobile.ts', 'src/pwa.ts'], ['src/pwa.ts', 'src/bootstrap.ts']]) staticCheck(`ordering ${a} -> ${b}`, order.indexOf(a) >= 0 && order.indexOf(a) < order.indexOf(b));
  const all = order.map(read).join('\n');
  for (const name of ['UI', 'Actions', 'Forms', 'Pages', 'CommercialActions', 'Auth', 'DB', 'Transactions', 'Invoices', 'Accounting', 'ManualJournal', 'CRM', 'Party360', 'UnifiedParty', 'Print', 'Reports', 'Statements', 'OutputCenter', 'PWA']) staticCheck(`public facade exists: ${name}`, new RegExp(`\\b(?:const|let|var)\\s+${name}\\b`).test(all));
  const mobile = read('src/mobile.ts');
  for (const token of ['ERP_MOBILE', 'NativeShell', 'NativePrint', 'window.fetch', 'checkAppRelease', 'applyPendingRelease']) staticCheck(`native contract: ${token}`, mobile.includes(token));
  if (staticFailures.length) throw new Error(`${staticFailures.length} failed: ${staticFailures.slice(0, 5).join(' | ')}`);
  return { status: 'PASS', detail: `${order.length} ordered modules, ${graph.order.length} in graph` };
});

// ---- 2. Immutable inventory and sha256 pins (tests / baselines / gates cannot be weakened silently) -----------------
step('TEST INVENTORY + PINS', () => {
  const baseline = JSON.parse(read('docs/refactor/refactor-baseline.json'));
  check(JSON.stringify(discover()) === JSON.stringify(baseline.tests.map((t) => t.file)), 'Node inventory drifted from the pinned 60 tests');
  check(baseline.tests.length === 60, 'Exactly 60 pinned Node tests');
  check(JSON.stringify(discover(root, '-browser-smoke.py')) === JSON.stringify(baseline.browser.map((t) => t.file)), 'Browser inventory drifted');
  check(baseline.browser.length === 6, 'Exactly six browser tests');
  const pins = JSON.parse(read('docs/refactor/part2-pins.json')).sha256;
  const bad = Object.entries(pins).filter(([f, h]) => !fs.existsSync(path.join(root, f)) || sha(f) !== h).map(([f]) => f);
  check(bad.length === 0, `pinned file changed: ${bad.slice(0, 4).join(', ')}${bad.length > 4 ? ' …' : ''} (intentional changes must update docs/refactor/part2-pins.json in the same review)`);
  const missing = [...baseline.tests, ...baseline.browser].filter((t) => !(t.file in pins));
  check(missing.length === 0, `test not pinned: ${missing[0]?.file}`);
  check(read('.gitignore') === 'node_modules/\n.env\n.env.*\n!.env.example\n*SECRETS*.txt\n*.log\n.DS_Store\n', 'Exact .gitignore');
  return { status: 'PASS', detail: `60 node + 6 browser tests, ${Object.keys(pins).length} pinned files` };
});

// ---- 3. Package scripts, pinned toolchain, lockfile sync, CI ----------------------------------------------------------
step('PACKAGE SCRIPTS', () => {
  const pkg = JSON.parse(read('package.json'));
  const want = { typecheck: /tsc -p tsconfig\.json/, build: /bundle-app\.mjs/, 'module:check': /module-order-check\.mjs/, 'architecture:check': /architecture-check\.mjs/, 'release:check': /release-check\.mjs/ };
  for (const [name, re] of Object.entries(want)) check(re.test(pkg.scripts[name] || ''), `package.json script "${name}" missing or not wired`);
  for (const dep of ['typescript', 'esbuild']) check(/^\d+\.\d+\.\d+$/.test(pkg.devDependencies[dep] || ''), `${dep} must be pinned to an exact version`);
  return { status: 'PASS', detail: Object.keys(want).join(', ') };
});
step('LOCKFILE SYNC (npm ci)', () => {
  const pkg = JSON.parse(read('package.json')), lock = JSON.parse(read('package-lock.json')), rootEntry = lock.packages[''];
  const problems = [];
  for (const group of ['dependencies', 'devDependencies']) for (const [name, spec] of Object.entries(pkg[group] || {})) {
    if (rootEntry[group]?.[name] !== spec) problems.push(`${group}.${name}: package.json ${spec} vs lock ${rootEntry[group]?.[name] ?? 'ABSENT'}`);
    const entry = lock.packages[`node_modules/${name}`];
    if (!entry) problems.push(`node_modules/${name} missing from lock`);
    else if (/^\d+\.\d+\.\d+$/.test(spec) && entry.version !== spec) problems.push(`${name}: lock resolves ${entry.version}, pinned ${spec}`);
  }
  if (problems.length) return { status: 'FAIL', detail: `${problems.length} mismatch(es): ${problems.slice(0, 3).join('; ')} — regenerate with network: npm install --package-lock-only` };
  return { status: 'PASS', detail: 'package.json and package-lock.json agree' };
});
step('CI WORKFLOW', () => {
  const ci = read('.github/workflows/ci.yml').split('\n').filter((l) => !l.trim().startsWith('#')).join('\n'); // comments may mention the keyword; only real YAML keys count
  check(!/continue-on-error/.test(ci), 'ci.yml must not use continue-on-error');
  for (const cmd of ['npm ci', 'npm run typecheck', 'npm run build', 'npm run module:check', 'npm run architecture:check', 'npm run release:check']) check(ci.includes(cmd), `ci.yml does not run: ${cmd}`);
  return { status: 'PASS', detail: 'no continue-on-error; all gates wired' };
});

// ---- 4. Executed gates ---------------------------------------------------------------------------------------------------
function exec(name, command, args, { ok = [0], blocked = [] } = {}) {
  step(name, () => {
    const r = run(command, args);
    const out = (r.stdout || '') + (r.stderr || '');
    if (ok.includes(r.status)) return { status: 'PASS', detail: out.trim().split('\n').filter((l) => /^PASS|^\{/.test(l)).slice(-1)[0]?.slice(0, 140) || '' };
    if (blocked.includes(r.status)) return { status: 'ENVIRONMENT BLOCKED', detail: out.trim().split('\n').find((l) => /BLOCKED/.test(l))?.slice(0, 200) || '' };
    process.stderr.write(out.slice(-2000));
    return { status: 'FAIL', detail: `exit ${r.status}` };
  });
}
const tool = toolchainProblems();
step('CLIENT TYPECHECK', () => { const r = run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json']); if (r.status === 0) return { status: 'PASS', detail: tool.some((p) => p.startsWith('typescript')) ? `NOTE: ${tool.find((p) => p.startsWith('typescript'))}` : '' }; process.stderr.write(r.stdout.slice(-2000)); return { status: 'FAIL', detail: 'tsc errors' }; });
exec('CLIENT BUILD (esbuild)', process.execPath, ['scripts/bundle-app.mjs']);
step('SERVER BUILD', () => {
  if (tool.length) return { status: 'ENVIRONMENT BLOCKED', detail: `toolchain not as pinned: ${tool.join('; ')}` };
  const r = run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'server/tsconfig.json']); if (r.status === 0) return { status: 'PASS', detail: '' }; process.stderr.write(r.stdout.slice(-2000)); return { status: 'FAIL', detail: 'tsc errors' };
});
exec('MODULE GRAPH / ORDER', process.execPath, ['scripts/module-order-check.mjs']);
exec('TYPE RATCHET (any / suppressions / noImplicitAny / strictNullChecks)', process.execPath, ['scripts/type-ratchet.mjs']);
exec('GOLDEN PRINT OUTPUT', 'python3', ['scripts/golden/print-golden.py'], { blocked: [3] });
// Style gates are optional until the one-time tooling install (docs/refactor/PART3_TOOLING_SETUP.md): reported, never faked as PASS.
exec('LINT RATCHET', process.execPath, ['scripts/lint-ratchet.mjs'], { blocked: [2] });
step('ARCHITECTURE RATCHET', () => {
  const baseline = JSON.parse(read('docs/refactor/architecture-accepted.json')), expected = {};
  for (const f of baseline.findings) expected[f.rule] = (expected[f.rule] || 0) + 1;
  const actual = counts(scan()); const worse = Object.keys(expected).filter((k) => actual[k] > expected[k]);
  const r = run(process.execPath, ['scripts/architecture-check.mjs']);
  if (worse.length || r.status !== 0) return { status: 'FAIL', detail: `increased: ${worse.join(',') || 'new signatures'}` };
  globalThis.__arch = actual;
  return { status: 'PASS', detail: Object.entries(actual).map(([k, v]) => `${k}=${v}`).join(' ') };
});
for (const [label, file] of [['APPLICATION CHECK', 'application-workflow-check'], ['BUSINESS CHECK', 'business-workflow-check'], ['PRESENTATION CHECK', 'presentation-platform-check']]) exec(label, process.execPath, [`scripts/${file}.mjs`], { blocked: [3] });
step(`NODE TEST BASELINE${withBrowser ? ' + BROWSER' : ''}`, () => {
  const r = run(process.execPath, ['scripts/refactor-check.mjs', ...(withBrowser ? [] : ['--skip-browser'])]);
  const out = r.stdout + r.stderr, summary = JSON.parse(out.trim().split('\n').filter((l) => l.startsWith('{"nodeTotal"')).pop() || '{}');
  const detail = `${summary.nodePass} PASS / ${summary.knownBaselineFailures} KNOWN / ${summary.newRegressions} NEW` + (withBrowser ? '' : '; browser NOT EXECUTED');
  globalThis.__nodeSummary = summary;
  if (summary.newRegressions > 0 || r.status === 1) { process.stderr.write(out.split('\n').filter((l) => l.startsWith('NEW REGRESSION')).join('\n') + '\n'); return { status: 'FAIL', detail }; }
  if (summary.environmentBlockers > 0) return { status: 'ENVIRONMENT BLOCKED', detail: detail + `; ${summary.environmentBlockers} blocker(s) (server build toolchain)` };
  return { status: 'PASS', detail };
});
if (!withBrowser) record('BROWSER ACCEPTANCE', 'NOT EXECUTED', 'run: npm run release:check -- --with-browser');
record('ANDROID REAL DEVICE', 'NOT EXECUTED', 'no device in this environment');

const failed = results.filter((r) => r.status === 'FAIL'), blocked = results.filter((r) => r.status === 'ENVIRONMENT BLOCKED');
console.log(JSON.stringify({ releaseCheck: failed.length ? 'FAIL' : blocked.length ? 'INCOMPLETE (ENVIRONMENT BLOCKED)' : 'PASS', fail: failed.map((r) => r.name), blocked: blocked.map((r) => r.name), architecture: globalThis.__arch, node: globalThis.__nodeSummary }));
process.exit(failed.length ? 1 : blocked.length ? 2 : 0);
