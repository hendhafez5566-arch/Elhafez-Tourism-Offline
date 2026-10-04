// `npm run module:check` — module graph gate for the Part 2 ES-module client.
// Single source of truth: scripts/lib/build-model.mjs (graph discovered from src/main.ts).
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { root, ENTRY, moduleGraph, orphanModules, commentOnlyStubs, allSourceFiles } from './lib/build-model.mjs';

const spec = JSON.parse(fs.readFileSync(path.join(root, 'docs/refactor/part2-module-order.json'), 'utf8'));
const problems = [];
const graph = moduleGraph();

// 1. MODULE ORDER: the graph must evaluate in exactly the order recorded from the former tsconfig.json "files" list.
const expected = [spec.late, ...spec.order, spec.entry];
if (spec.entry !== ENTRY) problems.push(`entry in part2-module-order.json is ${spec.entry}, expected ${ENTRY}`);
if (graph.order.length !== expected.length) problems.push(`module count ${graph.order.length} != ${expected.length}`);
graph.order.forEach((f, i) => { if (f !== expected[i]) problems.push(`order position ${i}: ${f} (expected ${expected[i]})`); });

// 2. ORPHANS: no production module may exist under src/ without being reachable from the entry.
const orphans = orphanModules(graph);
for (const f of orphans) problems.push(`orphan production module (not reachable from ${ENTRY}): ${f}`);

// 3. CIRCULAR DEPENDENCIES: none are allowed (the late-bindings registry exists to avoid them).
for (const c of graph.cycles) problems.push(`circular dependency: ${c.join(' -> ')}`);

// 4. DUPLICATE EVALUATIONS: main.ts must not list the same bare module twice, and the real bundle must contain each src module exactly once.
const mainText = fs.readFileSync(path.join(root, ENTRY), 'utf8');
const bare = [...mainText.matchAll(/^import '(\.[^']+)';$/gm)].map((m) => m[1]);
for (const spc of new Set(bare.filter((s, i) => bare.indexOf(s) !== i))) problems.push(`duplicate bare import in main.ts: ${spc}`);
const result = await build({ absWorkingDir: root, entryPoints: [ENTRY], bundle: true, write: false, metafile: true, format: 'iife', target: 'es2020', platform: 'browser', logLevel: 'silent', tsconfig: 'tsconfig.json' });
const bundled = Object.keys(result.metafile.inputs).filter((f) => f.startsWith('src/') && f.endsWith('.ts'));
if (new Set(bundled).size !== bundled.length) problems.push('esbuild metafile lists a module twice');
const g = new Set(graph.order), b = new Set(bundled);
for (const f of g) if (!b.has(f)) problems.push(`in module graph but missing from the bundle: ${f}`);
for (const f of b) if (!g.has(f)) problems.push(`in the bundle but unknown to the module graph: ${f}`);
const evaluations = new Map();
for (const out of Object.values(result.metafile.outputs)) for (const f of Object.keys(out.inputs)) if (f.startsWith('src/')) evaluations.set(f, (evaluations.get(f) || 0) + 1);
for (const [f, n] of evaluations) if (n > 1) problems.push(`module evaluated ${n} times: ${f}`);

// 5. Informational counters used by the Part 2 closeout report (legacy compatibility surface is intentionally kept).
const late = fs.readFileSync(path.join(root, spec.late), 'utf8');
const lateBindings = (late.match(/^export let /gm) || []).length;
const globalsBlock = mainText.slice(mainText.indexOf('__erpGlobals'));
const compatibilityGlobals = (globalsBlock.match(/^\s{4}\w+: \(\) => \w+,?$/gm) || []).length;
const stubs = commentOnlyStubs(graph);

const summary = { modules: graph.order.length, sourceFiles: allSourceFiles().length, lateBindings, compatibilityGlobals, orphanModules: orphans.length, commentOnlyStubs: stubs, circularDependencies: graph.cycles.length, duplicateEvaluations: [...evaluations.values()].filter((n) => n > 1).length };
if (problems.length) { console.error('FAIL module-check\n' + problems.slice(0, 20).join('\n')); console.error(JSON.stringify(summary)); process.exit(1); }
console.log(`PASS module-check: ${graph.order.length} modules, order == original tsconfig order, 0 orphans, 0 cycles, 0 duplicate evaluations`);
console.log(JSON.stringify(summary));
