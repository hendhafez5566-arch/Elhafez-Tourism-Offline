// Build current ES-module sources for differential VM execution with the same
// esbuild settings as the production browser bundle. Historical snapshots keep
// using their original concatenated-script compiler in the individual checks.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { build } from 'esbuild';
import { root } from './build-model.mjs';

function withoutBootstrapStartup(source) {
  const file = ts.createSourceFile('src/bootstrap.ts', source, ts.ScriptTarget.ES2020, true);
  const startup = file.statements.find((statement) =>
    ts.isExpressionStatement(statement) && statement.getText(file).startsWith('(async()=>'));
  if (!startup) throw new Error('Current bootstrap startup expression was not found');
  return source.slice(0, startup.getFullStart()) + source.slice(startup.end);
}

function instrumentRuntimeForVm(source) {
  const marker = "function toast(msg,type='ok'){";
  if (!source.includes(marker)) throw new Error('Runtime toast function was not found');
  return source.replace(
    marker,
    `${marker}const __notify=(globalThis).__notify;if(typeof __notify==='function')return __notify('toast',msg,type);`
  );
}

const browserPrelude = `
if (typeof globalThis.location === 'undefined') {
  globalThis.location = { href:'https://vm.invalid/', origin:'https://vm.invalid', hostname:'vm.invalid', protocol:'https:', pathname:'/', search:'', hash:'', reload(){} };
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

export async function bundleForVm(entrySource, { suppressBootstrap = false } = {}) {
  const plugins = [{
    name: 'differential-vm-entry',
    setup(build) {
      build.onResolve({ filter: /^differential:entry$/ }, () => ({ path: 'entry.ts', namespace: 'differential' }));
      build.onLoad({ filter: /.*/, namespace: 'differential' }, () => ({ contents: entrySource, loader: 'ts', resolveDir: root }));
      build.onLoad({ filter: /[\\/]src[\\/]core[\\/]runtime\.ts$/ }, (args) => ({
        contents: instrumentRuntimeForVm(fs.readFileSync(args.path, 'utf8')),
        loader: 'ts',
        resolveDir: path.dirname(args.path)
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
  return browserPrelude + result.outputFiles[0].text;
}
