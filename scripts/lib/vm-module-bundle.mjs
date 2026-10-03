// Build current ES-module sources for differential VM execution with the same
// esbuild settings as the production browser bundle. Historical snapshots keep
// using their original concatenated-script compiler in the individual checks.
//
// Important: this helper never rewrites production function bodies. When a
// legacy differential test already provides deterministic globals, ES-module
// adapters expose those same fakes to the current graph. Stateful scenario
// fakes are activated only after module initialisation, so bootstrap work cannot
// consume scenario counters before the comparison starts.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { build } from 'esbuild';
import { root } from './build-model.mjs';

const runtimePath = path.join(root, 'src/core/runtime.ts');
const umrahIntegrationPath = path.join(root, 'src/core/umrah/integration.ts');

const runtimeGlobalOverrides = [
  'EPS', 'S', 'N', 'deep', 'byId', 'live', 'today', 'now',
  'formatDate', 'fmt', 'money', 'daysBetween', 'dateAddMonthsClamped',
  'Money'
];

function withoutBootstrapStartup(source) {
  const file = ts.createSourceFile('src/bootstrap.ts', source, ts.ScriptTarget.ES2020, true);
  const startup = file.statements.find((statement) =>
    ts.isExpressionStatement(statement) && statement.getText(file).startsWith('(async()=>'));
  if (!startup) throw new Error('Current bootstrap startup expression was not found');
  return source.slice(0, startup.getFullStart()) + source.slice(startup.end);
}

function resolvesTo(args, targetPath) {
  if (!args.resolveDir || !args.path.startsWith('.')) return false;
  const base = path.resolve(args.resolveDir, args.path);
  return [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]
    .some((candidate) => path.normalize(candidate) === path.normalize(targetPath));
}

function runtimeAdapter(realSpecifier) {
  const explicit = runtimeGlobalOverrides.map((name) =>
    `export const ${name}=Object.prototype.hasOwnProperty.call(globalThis,${JSON.stringify(name)})&&globalThis[${JSON.stringify(name)}]!==undefined?globalThis[${JSON.stringify(name)}]:real.${name};`
  ).join('\n');
  return `
import * as real from ${JSON.stringify(realSpecifier)};
export * from ${JSON.stringify(realSpecifier)};
${explicit}
export const iid=(...args)=>globalThis.__vmScenarioReady&&typeof globalThis.iid==='function'?globalThis.iid(...args):real.iid(...args);
export const toast=(...args)=>{
  if(typeof globalThis.__notify==='function'){
    const message=args[0],type=args.length>1?args[1]:'ok';
    return globalThis.__notify('toast',message,type);
  }
  if(globalThis.__vmScenarioReady&&typeof globalThis.toast==='function')return globalThis.toast(...args);
  return real.toast(...args);
};
`;
}

function globalAdapter(realSpecifier, names) {
  const explicit = names.map((name) =>
    `export const ${name}=Object.prototype.hasOwnProperty.call(globalThis,${JSON.stringify(name)})&&globalThis[${JSON.stringify(name)}]!==undefined?globalThis[${JSON.stringify(name)}]:real.${name};`
  ).join('\n');
  return `import * as real from ${JSON.stringify(realSpecifier)};\nexport * from ${JSON.stringify(realSpecifier)};\n${explicit}\n`;
}

const browserPrelude = `
globalThis.__vmScenarioReady=false;
if (typeof globalThis.location === 'undefined') {
  globalThis.location = { href:'https://vm.invalid/', origin:'https://vm.invalid', hostname:'vm.invalid', protocol:'https:', pathname:'/', search:'', hash:'', reload(){} };
}
if (typeof globalThis.document !== 'undefined') {
  if (typeof globalThis.document.addEventListener !== 'function') globalThis.document.addEventListener = () => {};
  if (typeof globalThis.document.removeEventListener !== 'function') globalThis.document.removeEventListener = () => {};
  if (typeof globalThis.document.querySelector !== 'function') globalThis.document.querySelector = () => null;
  if (typeof globalThis.document.querySelectorAll !== 'function') globalThis.document.querySelectorAll = () => [];
}
if (typeof globalThis.URLSearchParams === 'undefined') {
  globalThis.URLSearchParams = class URLSearchParams {
    constructor(input='') {
      const text=String(input||'').replace(/^\\?/,'');
      this._pairs=text?text.split('&').filter(Boolean).map(part=>{
        const i=part.indexOf('='), key=i<0?part:part.slice(0,i), value=i<0?'':part.slice(i+1);
        return [decodeURIComponent(key.replace(/\\+/g,' ')),decodeURIComponent(value.replace(/\\+/g,' '))];
      }):[];
    }
    get(name) { const row=this._pairs.find(([key])=>key===String(name)); return row?row[1]:null; }
    has(name) { return this._pairs.some(([key])=>key===String(name)); }
  };
}
`;
const browserPostlude = `\nglobalThis.__vmScenarioReady=true;\n`;

export async function bundleForVm(entrySource, { suppressBootstrap = false } = {}) {
  // Selected differential entries do not always pull every generated late-binding owner.
  // Production initialises ManualJournalRules before consumers, so mirror that owner here.
  const vmEntrySource = `import './src/accounting/manual-journal-rules.ts';\n${entrySource}`;
  const plugins = [{
    name: 'differential-vm-entry',
    setup(build) {
      build.onResolve({ filter: /^differential:entry$/ }, () => ({ path: 'entry.ts', namespace: 'differential' }));
      build.onResolve({ filter: /^differential:real-runtime$/ }, () => ({ path: runtimePath }));
      build.onResolve({ filter: /^differential:real-umrah-integration$/ }, () => ({ path: umrahIntegrationPath }));
      build.onResolve({ filter: /.*/ }, (args) => {
        if (resolvesTo(args, runtimePath)) return { path: runtimePath, namespace: 'differential-runtime-adapter' };
        if (resolvesTo(args, umrahIntegrationPath)) return { path: umrahIntegrationPath, namespace: 'differential-umrah-adapter' };
        return null;
      });
      build.onLoad({ filter: /.*/, namespace: 'differential' }, () => ({ contents: vmEntrySource, loader: 'ts', resolveDir: root }));
      build.onLoad({ filter: /.*/, namespace: 'differential-runtime-adapter' }, () => ({
        contents: runtimeAdapter('differential:real-runtime'),
        loader: 'ts',
        resolveDir: root
      }));
      build.onLoad({ filter: /.*/, namespace: 'differential-umrah-adapter' }, () => ({
        contents: globalAdapter('differential:real-umrah-integration', ['UmrahCore_ERP']),
        loader: 'ts',
        resolveDir: root
      }));
      if (suppressBootstrap) {
        build.onLoad({ filter: /[\\/]src[\\/]bootstrap\.ts$/ }, (args) => ({
          contents: withoutBootstrapStartup(fs.readFileSync(args.path, 'utf8')),
          loader: 'ts',
          resolveDir: path.dirname(args.path)
        }));
      }
    }
  }];
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['differential:entry'],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2020',
    platform: 'browser',
    charset: 'utf8',
    minify: false,
    keepNames: true,
    legalComments: 'none',
    tsconfig: 'tsconfig.json',
    plugins
  });
  return browserPrelude + result.outputFiles[0].text + browserPostlude;
}
