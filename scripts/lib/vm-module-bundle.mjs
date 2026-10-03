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

export async function bundleForVm(entrySource, { suppressBootstrap = false } = {}) {
  const plugins = [{
    name: 'differential-vm-entry',
    setup(build) {
      build.onResolve({ filter: /^differential:entry$/ }, () => ({ path: 'entry.ts', namespace: 'differential' }));
      build.onLoad({ filter: /.*/, namespace: 'differential' }, () => ({ contents: entrySource, loader: 'ts', resolveDir: root }));
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
  return result.outputFiles[0].text;
}
