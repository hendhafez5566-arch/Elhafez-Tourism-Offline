// `npm run lint:ratchet` — runs ESLint and compares the number of errors/warnings with docs/refactor/lint-baseline.json.
// Errors must stay 0; warnings may go down, never up. Exit: 0 PASS, 1 FAIL, 2 ENVIRONMENT BLOCKED / NOT BASELINED (never reported as PASS).
//   node scripts/lint-ratchet.mjs --update   write the baseline from the current run (refuses to raise an existing baseline)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './lib/build-model.mjs';

const bin = path.join(root, 'node_modules/eslint/bin/eslint.js');
if (!fs.existsSync(bin)) { console.log('ENVIRONMENT BLOCKED: eslint is not installed (see docs/refactor/PART3_TOOLING_SETUP.md)'); process.exit(2); }
const r = spawnSync(process.execPath, [bin, 'src', 'server/src', 'scripts', '-f', 'json', '--no-error-on-unmatched-pattern'], { cwd: root, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
let results; try { results = JSON.parse(r.stdout); } catch { console.error('FAIL lint: ESLint produced no JSON\n' + (r.stderr || '').slice(0, 1500)); process.exit(1); }
const sum = (k) => results.reduce((n, f) => n + f[k], 0);
const byRule = {}; for (const f of results) for (const m of f.messages) byRule[m.ruleId || 'parse-error'] = (byRule[m.ruleId || 'parse-error'] || 0) + 1;
const now = { errors: sum('errorCount'), warnings: sum('warningCount'), byRule };
const file = path.join(root, 'docs/refactor/lint-baseline.json');
if (process.argv.includes('--update')) {
  if (fs.existsSync(file)) { const old = JSON.parse(fs.readFileSync(file, 'utf8')); if (now.errors > old.errors || now.warnings > old.warnings) { console.error('REFUSED: would raise the lint baseline'); process.exit(1); } }
  fs.writeFileSync(file, JSON.stringify(now, null, 1) + '\n'); console.log('lint baseline written', JSON.stringify({ errors: now.errors, warnings: now.warnings })); process.exit(0);
}
if (!fs.existsSync(file)) { console.log(`NOT BASELINED: ${now.errors} errors / ${now.warnings} warnings. Review them, then run: node scripts/lint-ratchet.mjs --update`); process.exit(2); }
const base = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log(JSON.stringify({ errors: now.errors, warnings: now.warnings, baselineWarnings: base.warnings }));
if (now.errors > 0 || now.warnings > base.warnings) { console.error(`FAIL lint:ratchet — errors ${now.errors} (must be 0), warnings ${base.warnings} -> ${now.warnings}`); process.exit(1); }
console.log('PASS lint:ratchet');
