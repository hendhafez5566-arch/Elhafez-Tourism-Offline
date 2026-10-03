#!/usr/bin/env node
/* Codemod: script-model (module:none + outFile + manual file order) -> ES modules.
 * Uses the TypeScript Compiler API. Source text is only ever *added to* (imports at top,
 * export lists at bottom, late-binding setters after forward-referenced declarations);
 * no identifier is rewritten, so existing source-text assertions keep matching.
 * Usage: node modularize-src.cjs <projectRoot> [--tsmodule <path-to-typescript>] */
const path = require('path'), fs = require('fs');
const root = path.resolve(process.argv[2] || '.');
const tsIdx = process.argv.indexOf('--tsmodule');
const ts = require(tsIdx > 0 ? process.argv[tsIdx + 1] : 'typescript');
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
let orderRel = cfg.files.slice();
const LATE = 'src/core/late-bindings.ts', ENTRY = 'src/main.ts', EARLY = 'src/composition/early-presentation.ts';

// ---- Step 0: move the three hoisted composition functions that old top-level code calls before bootstrap.ts runs
const EARLY_FNS = ['composeStorePresentation', 'composeSessionPresentation', 'composeLegacyPurchaseFulfillment'];
(function moveEarly() {
  if (fs.existsSync(path.join(root, EARLY))) return;
  const bp = path.join(root, 'src/bootstrap.ts');
  const text = fs.readFileSync(bp, 'utf8');
  const sf = ts.createSourceFile(bp, text, ts.ScriptTarget.ES2020, true);
  const cuts = [];
  for (const st of sf.statements) if (ts.isFunctionDeclaration(st) && st.name && EARLY_FNS.includes(st.name.text)) cuts.push([st.getFullStart(), st.end, text.slice(st.getFullStart(), st.end)]);
  if (cuts.length !== EARLY_FNS.length) throw new Error('early functions not found: ' + cuts.length);
  let out = text;
  for (const [s, e] of cuts.slice().reverse()) out = out.slice(0, s) + out.slice(e);
  fs.writeFileSync(bp, out);
  fs.mkdirSync(path.dirname(path.join(root, EARLY)), { recursive: true });
  fs.writeFileSync(path.join(root, EARLY), '// Composition functions that legacy top-level code calls while the stores are being created.\n// They used to be hoisted function declarations in bootstrap.ts; they only build closures, so their\n// late-bound dependencies (UI, Auth, toast, DB) are resolved at call time through core/late-bindings.\n' + cuts.map(c => c[2].replace(/^\s*\n/, '')).join('\n') + '\n');
  const i = orderRel.indexOf('src/persistence/server-store.ts');
  orderRel.splice(i, 0, EARLY);
})();
if (!orderRel.includes(EARLY)) { const i = orderRel.indexOf('src/persistence/server-store.ts'); orderRel.splice(i, 0, EARLY); }
const files = orderRel.map(f => path.join(root, f));
const idx = new Map(files.map((f, i) => [f, i]));

const opts = { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], strict: false, skipLibCheck: true, noEmit: true, ignoreDeprecations: '6.0', rootDir: path.join(root, 'src'), types: [] };
const prog = ts.createProgram(files, opts);
const chk = prog.getTypeChecker();
const pre = ts.getPreEmitDiagnostics(prog);
if (pre.length) { console.error('pre-existing diagnostics:', pre.length); pre.slice(0, 5).forEach(d => console.error(ts.flattenDiagnosticMessageText(d.messageText, '\n'))); process.exit(2); }

// ---- top-level declarations
const decl = new Map(); // name -> {file, kind:'value'|'type', fn:boolean, stmt}
for (const f of files) {
  const sf = prog.getSourceFile(f);
  for (const st of sf.statements) {
    const put = (name, kind, fn) => { if (decl.has(name)) throw new Error('duplicate top-level ' + name); decl.set(name, { file: f, kind, fn, stmt: st }); };
    if (ts.isVariableStatement(st)) { for (const d of st.declarationList.declarations) { if (!ts.isIdentifier(d.name)) throw new Error('destructuring top-level in ' + rel(f)); if (!(st.declarationList.flags & ts.NodeFlags.Const)) throw new Error('non-const top-level ' + d.name.text); put(d.name.text, 'value', false); } }
    else if (ts.isFunctionDeclaration(st)) put(st.name.text, 'value', true);
    else if (ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) put(st.name.text, 'type', false);
    else if (ts.isClassDeclaration(st) || ts.isEnumDeclaration(st) || ts.isModuleDeclaration(st)) throw new Error('unsupported top-level ' + ts.SyntaxKind[st.kind]);
  }
}

// ---- references
const perFile = files.map(() => ({ runtime: new Map(), type: new Map() })); // name -> defFile
const SKIP_PARENT = (n, par) => ((ts.isVariableDeclaration(par) || ts.isFunctionDeclaration(par) || ts.isParameter(par) || ts.isBindingElement(par) || ts.isInterfaceDeclaration(par) || ts.isTypeAliasDeclaration(par) || ts.isTypeParameterDeclaration(par)) && par.name === n) || (ts.isPropertyAccessExpression(par) && par.name === n) || (ts.isPropertyAssignment(par) && par.name === n) || (ts.isQualifiedName(par) && par.right === n) || ((ts.isMethodDeclaration(par) || ts.isPropertyDeclaration(par) || ts.isPropertySignature(par) || ts.isMethodSignature(par) || ts.isGetAccessor(par) || ts.isSetAccessor(par)) && par.name === n) || ts.isLabeledStatement(par) || ts.isBreakOrContinueStatement(par) || (ts.isNamedTupleMember(par) && par.name === n) || (ts.isTypeReferenceNode(par) && false);
const inTypePosition = (n) => { for (let p = n.parent; p && !ts.isStatement(p); p = p.parent) if (ts.isTypeNode(p) && !ts.isExpressionWithTypeArguments(p)) return true; return false; };
for (const f of files) {
  const fi = idx.get(f), sf = prog.getSourceFile(f);
  (function walk(n) {
    if (ts.isIdentifier(n) && n.parent && !SKIP_PARENT(n, n.parent)) {
      let sym = chk.getSymbolAtLocation(n);
      if (ts.isShorthandPropertyAssignment(n.parent) && n.parent.name === n) sym = chk.getShorthandAssignmentValueSymbol(n.parent);
      const d = sym && sym.declarations && sym.declarations[0];
      if (d && d.getSourceFile().fileName !== f && idx.has(d.getSourceFile().fileName)) {
        const info = decl.get(n.text);
        if (info && info.file === d.getSourceFile().fileName) {
          const typeUse = info.kind === 'type' || inTypePosition(n);
          (typeUse ? perFile[fi].type : perFile[fi].runtime).set(n.text, info.file);
        }
      }
    }
    ts.forEachChild(n, walk);
  })(sf);
}

// ---- classify
const lateNames = new Set(); // forward-bound runtime names
const exportedValues = new Map(files.map(f => [f, new Set()])), exportedTypes = new Map(files.map(f => [f, new Set()]));
for (const [name, info] of decl) if (info.kind === 'value') exportedValues.get(info.file).add(name);
files.forEach((f, fi) => {
  for (const [name, df] of perFile[fi].runtime) if (idx.get(df) > fi) lateNames.add(name);
  for (const [name, df] of perFile[fi].type) { const info = decl.get(name); if (info.kind === 'type') exportedTypes.get(df).add(name); else exportedValues.get(df).add(name); }
});
for (const n of lateNames) exportedValues.get(decl.get(n).file).add(n);

const relSpec = (from, toRel) => { let r = path.posix.relative(path.posix.dirname(rel(from)), toRel.replace(/\.ts$/, '')); if (!r.startsWith('.')) r = './' + r; return r; };
const lateSpec = (f) => relSpec(f, LATE);

// ---- per-file edits
const stats = { files: files.length, importLines: 0, lateImports: 0, typeImports: 0, exportsValue: 0, exportsType: 0, lateSetters: 0 };
files.forEach((f, fi) => {
  const sf = prog.getSourceFile(f);
  let text = sf.text;
  const edits = [];
  const head = [];
  const byFile = new Map();
  const lateUse = [];
  for (const [name, df] of perFile[fi].runtime) { if (idx.get(df) > fi) lateUse.push(name); else { (byFile.get(df) || byFile.set(df, []).get(df)).push(name); } }
  const typeBy = new Map();
  for (const [name, df] of perFile[fi].type) { if (perFile[fi].runtime.has(name)) continue; (typeBy.get(df) || typeBy.set(df, []).get(df)).push(name); }
  for (const [df, names] of [...byFile].sort((a, b) => idx.get(a[0]) - idx.get(b[0]))) { head.push(`import { ${names.sort().join(', ')} } from '${relSpec(f, rel(df))}';`); stats.importLines++; }
  if (lateUse.length) { head.push(`import { ${lateUse.sort().join(', ')} } from '${lateSpec(f)}';`); stats.lateImports += lateUse.length; }
  for (const [df, names] of [...typeBy].sort((a, b) => idx.get(a[0]) - idx.get(b[0]))) { head.push(`import type { ${names.sort().join(', ')} } from '${relSpec(f, rel(df))}';`); stats.typeImports++; }
  // late setters for names defined here
  const defsHere = [...lateNames].filter(n => decl.get(n).file === f);
  const hoisted = defsHere.filter(n => decl.get(n).fn), after = new Map();
  for (const n of defsHere.filter(n => !decl.get(n).fn)) { const st = decl.get(n).stmt; (after.get(st) || after.set(st, []).get(st)).push(n); }
  if (defsHere.length) head.push(`import { ${defsHere.map(n => '__set_' + n).sort().join(', ')} } from '${lateSpec(f)}';`);
  if (hoisted.length) head.push(hoisted.sort().map(n => `__set_${n}(${n});`).join(' '));
  for (const [st, names] of after) { edits.push({ pos: st.end, text: '\n' + names.map(n => `__set_${n}(${n});`).join(' ') }); stats.lateSetters += names.length; }
  stats.lateSetters += hoisted.length;
  // tail exports
  const ev = [...exportedValues.get(f)].sort(), et = [...exportedTypes.get(f)].sort();
  const tail = [];
  if (ev.length) { tail.push(`export { ${ev.join(', ')} };`); stats.exportsValue += ev.length; }
  if (et.length) { tail.push(`export type { ${et.join(', ')} };`); stats.exportsType += et.length; }
  if (!ev.length && !et.length && !head.length) tail.push('export {};');
  edits.sort((a, b) => b.pos - a.pos);
  for (const e of edits) text = text.slice(0, e.pos) + e.text + text.slice(e.pos);
  const pre = head.length ? head.join('\n') + '\n' : '';
  fs.writeFileSync(f, pre + text.replace(/\s*$/, '\n') + (tail.length ? tail.join('\n') + '\n' : ''));
});

// ---- late-bindings module
{
  const lines = ['// Generated by scripts/codemods/modularize-src.cjs.', '// Late-bound live bindings for references that point at a file which, in the original manual order, was', '// initialised AFTER the referencing file. The owner assigns the value right after its declaration', '// (function declarations: at the top of the module, like hoisting), so initialisation order stays identical.'];
  for (const n of [...lateNames].sort()) {
    const info = decl.get(n), spec = relSpec(path.join(root, LATE), rel(info.file));
    lines.push(`export let ${n}: typeof import('${spec}').${n};`, `export function __set_${n}(value: typeof ${n}): void { ${n} = value; }`);
  }
  fs.mkdirSync(path.dirname(path.join(root, LATE)), { recursive: true });
  fs.writeFileSync(path.join(root, LATE), lines.join('\n') + '\n');
}

// ---- entry
{
  const L = ['// Generated entry. The import order below is the former tsconfig.json "files" order, so module', '// initialisation order is unchanged. The block at the end keeps the legacy global names on window.', `import './core/late-bindings';`];
  const e = (f) => relSpec(path.join(root, ENTRY), rel(f));
  for (const f of files) L.push(`import '${e(f)}';`);
  const vals = [];
  for (const f of files) { const names = [...exportedValues.get(f)].sort(); if (names.length) { L.push(`import { ${names.join(', ')} } from '${e(f)}';`); names.forEach(n => vals.push(n)); } }
  L.push('', '// Legacy global surface (window.DB, Auth, UI, Actions, ...) - live accessors, never copies.', 'const __erpGlobals: Record<string, () => unknown> = {', vals.map(n => `    ${n}: () => ${n}`).join(',\n'), '};');
  L.push('const __erpGlobalThis = globalThis as unknown as Record<string, unknown>;', 'for (const name of Object.keys(__erpGlobals)) {', '    if (name in __erpGlobalThis) continue;', '    const read = __erpGlobals[name];', '    Object.defineProperty(__erpGlobalThis, name, { configurable: true, enumerable: false, get: read, set(value) { Object.defineProperty(__erpGlobalThis, name, { value, writable: true, configurable: true, enumerable: false }); } });', '}', 'export {};');
  fs.writeFileSync(path.join(root, ENTRY), L.join('\n') + '\n');
  stats.globalNames = vals.length;
}

fs.writeFileSync(path.join(root, 'docs/refactor/part2-module-order.json'), JSON.stringify({ order: orderRel, lateBound: [...lateNames].sort(), entry: ENTRY, late: LATE, early: EARLY }, null, 1) + '\n');
console.log(JSON.stringify(stats, null, 1));
console.log('late-bound names:', lateNames.size);
