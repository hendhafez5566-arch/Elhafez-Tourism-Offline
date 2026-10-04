// `npm run types:ratchet` — type-safety ratchet. Numbers may go DOWN, never UP.
//   explicit `any` (AST, not text), @ts-ignore / @ts-expect-error / @ts-nocheck,
//   and the number of tsc errors per top-level folder when --noImplicitAny / --strictNullChecks are switched on.
// Baseline: docs/refactor/type-baseline.json. `--update` rewrites it but refuses to raise any number (use --allow-increase for a reviewed exception).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { root, allSourceFiles } from './lib/build-model.mjs';

const baselinePath = path.join(root, 'docs/refactor/type-baseline.json');
const serverFiles = () => fs.readdirSync(path.join(root, 'server/src')).filter((f) => f.endsWith('.ts')).map((f) => 'server/src/' + f);
const folderOf = (file) => (file.startsWith('server/') ? 'server/src' : file.split('/').slice(0, 2).join('/').replace(/\.ts$/, '') || 'src');
const bucket = (file) => { const p = file.split('/'); return p.length <= 2 ? 'src(root)' : p.slice(0, 2).join('/'); };

function astCounts() {
  let any = 0, suppressions = 0; const anyByFolder = {};
  for (const f of [...allSourceFiles(), ...serverFiles()]) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    suppressions += (text.match(/@ts-(?:ignore|expect-error|nocheck)/g) || []).length;
    const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true);
    let n = 0; (function visit(node) { if (node.kind === ts.SyntaxKind.AnyKeyword) n++; ts.forEachChild(node, visit); })(sf);
    any += n; if (n) anyByFolder[f.startsWith('server/') ? 'server/src' : bucket(f)] = (anyByFolder[f.startsWith('server/') ? 'server/src' : bucket(f)] || 0) + n;
  }
  return { explicitAny: any, tsSuppressions: suppressions, explicitAnyByFolder: anyByFolder };
}
function strictErrors(flag) {
  const r = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json', `--${flag}`], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const byFolder = {}; let total = 0;
  for (const line of (r.stdout || '').split('\n')) {
    const m = /^(src\/[^(]+)\(\d+,\d+\): error TS/.exec(line); if (!m) continue;
    total++; byFolder[bucket(m[1])] = (byFolder[bucket(m[1])] || 0) + 1;
  }
  return { total, byFolder };
}
const current = { ...astCounts(), noImplicitAny: strictErrors('noImplicitAny'), strictNullChecks: strictErrors('strictNullChecks') };
const flat = (o) => ({ explicitAny: o.explicitAny, tsSuppressions: o.tsSuppressions, 'noImplicitAny.total': o.noImplicitAny.total, 'strictNullChecks.total': o.strictNullChecks.total,
  ...Object.fromEntries(Object.entries(o.noImplicitAny.byFolder).map(([k, v]) => [`noImplicitAny.${k}`, v])), ...Object.fromEntries(Object.entries(o.strictNullChecks.byFolder).map(([k, v]) => [`strictNullChecks.${k}`, v])) });

if (process.argv.includes('--update')) {
  const old = fs.existsSync(baselinePath) ? flat(JSON.parse(fs.readFileSync(baselinePath, 'utf8'))) : null, now = flat(current);
  const raised = old ? Object.keys(now).filter((k) => now[k] > (old[k] ?? Infinity)) : [];
  if (raised.length && !process.argv.includes('--allow-increase')) { console.error('REFUSED: would raise ' + raised.join(', ')); process.exit(1); }
  fs.writeFileSync(baselinePath, JSON.stringify(current, null, 1) + '\n'); console.log('type baseline written'); console.log(JSON.stringify(flat(current), null, 1)); process.exit(0);
}
const base = flat(JSON.parse(fs.readFileSync(baselinePath, 'utf8'))), now = flat(current);
const worse = Object.keys(now).filter((k) => now[k] > (base[k] ?? 0)), better = Object.keys(base).filter((k) => (now[k] ?? 0) < base[k]);
console.log(JSON.stringify({ explicitAny: now.explicitAny, tsSuppressions: now.tsSuppressions, noImplicitAnyErrors: now['noImplicitAny.total'], strictNullChecksErrors: now['strictNullChecks.total'], improved: better.length }));
if (worse.length) { console.error('FAIL types:ratchet — increased: ' + worse.map((k) => `${k} ${base[k] ?? 0}->${now[k]}`).join(', ')); process.exit(1); }
console.log('PASS types:ratchet' + (better.length ? ` (${better.length} counters improved - run: node scripts/type-ratchet.mjs --update)` : ''));
