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
  const toastMarker = "function toast(msg,type='ok'){";
  if (!source.includes(toastMarker)) throw new Error('Runtime toast function was not found');
  let out = source.replace(
    toastMarker,
    `${toastMarker}const __notify=(globalThis).__notify;if(typeof __notify==='function')return arguments.length<2?__notify('toast',msg):__notify('toast',msg,type);`
  );
  const todayMarker = 'const today=()=>{';
  if (!out.includes(todayMarker)) throw new Error('Runtime today function was not found');
  out = out.replace(todayMarker, `${todayMarker}const __today=globalThis.__today;if(typeof __today==='function')return __today();`);
  const nowMarker = 'const now=()=>new Date().toISOString();';
  if (!out.includes(nowMarker)) throw new Error('Runtime now function was not found');
  out = out.replace(nowMarker, "const now=()=>{const __now=globalThis.__now;return typeof __now==='function'?__now():new Date().toISOString()};");
  const iidMarker = "const iid=()=>globalThis.crypto?.randomUUID?.()||('i-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));";
  if (!out.includes(iidMarker)) throw new Error('Runtime iid function was not found');
  out = out.replace(iidMarker, "const iid=()=>{const __iid=globalThis.__iid;return typeof __iid==='function'?__iid():(globalThis.crypto?.randomUUID?.()||('i-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)))};");
  return out;
}

function instrumentUmrahIntegrationForVm(source) {
  const marker = 'onReceipt(_r){return true},';
  if (!source.includes(marker)) throw new Error('Umrah receipt integration hook was not found');
  return source.replace(marker, "onReceipt(_r){const __receipt=globalThis.__umrahReceipt;return typeof __receipt==='function'?__receipt(_r):true},");
}

const browserPrelude = `
globalThis.__vmFakeToast = typeof globalThis.toast === 'function' ? globalThis.toast : undefined;
globalThis.__vmFakeIid = typeof globalThis.iid === 'function' ? globalThis.iid : undefined;
globalThis.__vmFakeNow = typeof globalThis.now === 'function' ? globalThis.now : undefined;
globalThis.__vmFakeToday = typeof globalThis.today === 'function' ? globalThis.today : undefined;
const __vmUmrah = globalThis.UmrahCore_ERP;
globalThis.__vmFakeUmrahReceipt = __vmUmrah && typeof __vmUmrah.onReceipt === 'function' ? __vmUmrah.onReceipt.bind(__vmUmrah) : undefined;
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

const browserPostlude = `
if (typeof globalThis.__vmFakeToast === 'function') globalThis.__notify = (kind,...args) => globalThis.__vmFakeToast(...args);
if (typeof globalThis.__vmFakeIid === 'function') globalThis.__iid = globalThis.__vmFakeIid;
if (typeof globalThis.__vmFakeNow === 'function') globalThis.__now = globalThis.__vmFakeNow;
if (typeof globalThis.__vmFakeToday === 'function') globalThis.__today = globalThis.__vmFakeToday;
if (typeof globalThis.__vmFakeUmrahReceipt === 'function') globalThis.__umrahReceipt = globalThis.__vmFakeUmrahReceipt;
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
      build.onLoad({ filter: /[\\/]src[\\/]core[\\/]umrah[\\/]integration\.ts$/ }, (args) => ({
        contents: instrumentUmrahIntegrationForVm(fs.readFileSync(args.path, 'utf8')),
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
  return browserPrelude + result.outputFiles[0].text + browserPostlude;
}
