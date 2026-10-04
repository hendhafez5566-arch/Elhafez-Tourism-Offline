// Bundles src/main.ts (ES modules) into the single classic script dist/app.js.
// Output stays one IIFE file so index.html, sw.js, the Android sync and the smoke tests keep using ./app.js.
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('dist/', import.meta.url.replace(/scripts\/.*$/, '')), { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/main.ts'],
  outfile: 'dist/app.js',
  bundle: true,
  format: 'iife',
  target: 'es2020',
  platform: 'browser',
  charset: 'utf8',
  minify: false,
  keepNames: true,
  legalComments: 'none',
  sourcemap: false,
  logLevel: 'info',
  tsconfig: 'tsconfig.json'
});
if (result.errors.length) process.exit(1);
