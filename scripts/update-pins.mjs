// Re-computes docs/refactor/part2-pins.json. Run ONLY as a deliberate, reviewed step (`npm run pins:update`)
// after an intentional change to a pinned test, baseline or gate. release-check fails when a pinned file drifts silently.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root } from './lib/build-model.mjs';
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'docs/refactor/refactor-baseline.json'), 'utf8'));
const files = [
  ...baseline.tests.map((t) => t.file), ...baseline.browser.map((t) => t.file),
  'docs/refactor/refactor-baseline.json', 'docs/refactor/architecture-baseline.json', 'docs/refactor/part2-module-order.json',
  'scripts/architecture-check.mjs', 'scripts/refactor-check.mjs', 'scripts/module-order-check.mjs', 'scripts/lib/build-model.mjs', 'scripts/lib/vm-module-bundle.mjs',
  'scripts/application-workflow-check.mjs', 'scripts/business-workflow-check.mjs', 'scripts/presentation-platform-check.mjs'
].sort();
const sha256 = Object.fromEntries(files.map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex')]));
fs.writeFileSync(path.join(root, 'docs/refactor/part2-pins.json'), JSON.stringify({ note: 'sha256 pins of tests, baselines and gates. Changing a pinned file requires re-running `npm run pins:update` in the same reviewed change.', sha256 }, null, 1) + '\n');
console.log(`pinned ${files.length} files`);
