import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const scripts=[
  'accounting-smoke.mjs',
  'advanced-accounting-smoke.mjs',
  'contracts-inventory-smoke.mjs',
  'umrah-workflow-smoke.mjs',
  'cancel-integrity-smoke.mjs',
  'offline-copy-smoke.mjs',
  'offline-whatsapp-pdf-smoke.mjs',
  'unified-party-accounting-smoke.mjs',
  'v32546-print-shortcuts-smoke.mjs',
  'system-ux-smoke.mjs',
  'clean-ui-smoke.mjs',
  'rocket-360-performance-smoke.mjs'
];
let failed=0;
for(const file of scripts){
  console.log(`\n===== ${file} =====`);
  const r=spawnSync(process.execPath,[path.join(root,'scripts',file)],{cwd:root,stdio:'inherit',env:process.env});
  if(r.status!==0){failed++;console.error(`FAILED ${file} (${r.status})`)}
}
console.log(`\nOffline node smoke summary: ${scripts.length-failed}/${scripts.length} passed`);
if(failed)process.exit(1);
