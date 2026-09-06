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
  'v32547-mobile-clean-smoke.mjs',
  'v32548-clean-print-sidebar-smoke.mjs',
  'v32549-keyboard-autofill-smoke.mjs',
  'v32550-android-pdf-build-smoke.mjs',
  'v32551-clean-pdf-share-smoke.mjs',
  'v32552-native-backup-delivery-smoke.mjs',
  'v32553-party-comms-docs-print-smoke.mjs',
  'v32554-persistent-android-session-smoke.mjs',
  'v32555-auth-ui-clean-smoke.mjs',
  'v32556-ui-consistency-smoke.mjs',
  'v32559-unified-pdf-engine-smoke.mjs',
  'v32560-unified-print-whatsapp-smoke.mjs',
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
