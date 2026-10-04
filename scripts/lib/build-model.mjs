// SINGLE SOURCE OF TRUTH for "which source files are part of the client bundle, and in what order".
// Before Part 2 this was the manual "files" list in tsconfig.json. It is now the real ES-module import graph
// that starts at src/main.ts (the Client entry point). Every checker (module-order, release, smokes, workflow
// checks) must call this file instead of keeping its own import scanner or reading tsconfig "files".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const ENTRY = 'src/main.ts';

const norm = (p) => path.posix.normalize(p);
function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) return walk(rel);
    return e.name.endsWith('.ts') && !e.name.endsWith('.d.ts') ? [rel] : [];
  }).sort();
}
/** Every production TypeScript file under src/. */
export function allSourceFiles() { return walk('src'); }

/** Static `import`/`export ... from` specifiers of one file (relative specifiers only). Type-only imports are erased by esbuild, so they do not count as evaluation edges. */
export function importsOf(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const out = [];
  const re = /^(import|export)\s+(type\s+)?(?:[^'";]*?\s+from\s+)?'(\.[^']+)';/gm;
  for (const m of text.matchAll(re)) {
    if (m[2]) continue; // import type / export type
    out.push(m[3]);
  }
  return out.map((s) => resolve(file, s));
}
export function resolve(from, spec) {
  const base = norm(path.posix.join(path.posix.dirname(from), spec));
  for (const candidate of [base + '.ts', base + '/index.ts', base]) if (candidate.endsWith('.ts') && fs.existsSync(path.join(root, candidate))) return candidate;
  throw new Error(`Cannot resolve ${spec} imported from ${from}`);
}

/**
 * Walks the module graph depth-first from the entry, exactly like the ES-module evaluation algorithm:
 * a module is evaluated after its dependencies, once. Returns the evaluation order, edges, back-edges (cycles)
 * and every import specifier that resolved to an already-seen file (duplicate-evaluation candidates).
 */
export function moduleGraph(entry = ENTRY) {
  const state = new Map(); // file -> 'visiting' | 'done'
  const order = [], edges = new Map(), cycles = [], duplicateSpecifiers = [];
  const visit = (file, stack) => {
    state.set(file, 'visiting');
    const deps = importsOf(file);
    edges.set(file, deps);
    const seenHere = new Set();
    for (const dep of deps) {
      if (seenHere.has(dep)) duplicateSpecifiers.push({ file, dep });
      seenHere.add(dep);
      const s = state.get(dep);
      if (s === 'visiting') cycles.push([...stack.slice(stack.indexOf(dep)), dep]);
      else if (!s) visit(dep, [...stack, dep]);
    }
    state.set(file, 'done');
    order.push(file);
  };
  visit(entry, [entry]);
  return { entry, order, edges, cycles, duplicateSpecifiers };
}

const hasCode = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').trim().length > 0;
/** Production modules (files that contain code) under src/ that are not reachable from the entry. */
export function orphanModules(graph = moduleGraph()) {
  const reached = new Set(graph.order);
  return allSourceFiles().filter((f) => !reached.has(f) && hasCode(f));
}
/** Comment-only stubs under src/ that are not part of the graph (kept on purpose, e.g. src/app.ts is read by module-size-check). */
export function commentOnlyStubs(graph = moduleGraph()) {
  const reached = new Set(graph.order);
  return allSourceFiles().filter((f) => !reached.has(f) && !hasCode(f));
}

/** Ordered list of compiled client files (evaluation order, entry excluded). Replaces the old tsconfig.json "files". */
export function compiledFiles() { return moduleGraph().order.filter((f) => f !== ENTRY); }
// Text with one quoted path per line, in compile order: lets legacy `includes('src/x.ts')` / `indexOf` assertions keep their meaning.
export function compiledFilesText() { return compiledFiles().map((f) => JSON.stringify(f)).join(',\n'); }
