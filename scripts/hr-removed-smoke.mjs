import { pagesText } from './lib/split-sources.mjs';
import fs from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(resolve(root,f),'utf8');
const exists=f=>fs.existsSync(resolve(root,f));
const checks=[
 ['HR source directory removed',!exists('src/core/hr')],
 ['HR compiler removed',!exists('tsconfig.hr-core.json')],
 ['HR runtime bundle removed',!exists('dist/core/hr.js')&&!exists('dist/core/hr.js.map')],
 ['HTML does not load HR runtime',!read('index.html').includes('core/hr.js')],
 ['PWA service worker does not precache deleted HR runtime',!read('pwa/sw.js').includes('core/hr.js')],
 ['navigation contains no HR route',!read('src/ui/navigation.ts').includes('hr-dashboard')&&!read('src/ui/navigation.ts').includes('hr-employees')],
 ['Pages registry contains no HR route',!pagesText().includes("'hr-")],
 ['core suite host is Umrah-only',!read('src/core/suites.ts').includes('HRCore_')&&!read('src/core/suites.ts').includes("hr:" )],
 ['seed has no HR workspace/license module',!read('src/core/seed.ts').includes("id:'hr'")&&!read('src/core/seed.ts').includes("'hr',")],
 ['commercial product no longer exposes HR',!read('src/commercial/product.ts').includes('hr-suite')&&!read('src/commercial/product.ts').includes("'hr':'hr")],
 ['client auth no longer exposes HR permission',!read('src/security/auth.ts').includes('hr-suite')],
 ['server auth no longer exposes HR permission',!read('server/src/authz.ts').includes('hr-suite')],
 ['license editions no longer contain HR module',!read('server/src/license.ts').match(/modules:[^\n]*['\"]hr['\"]/)],
 ['vendor editions no longer contain HR module',!exists('server/src/vendor.ts')||!read('server/src/vendor.ts').match(/modules:[^\n]*['\"]hr['\"]/)],
 ['old integrated HR state is purged on load',read('src/persistence/browser-store.ts').includes('if(d.integratedModules.hr)delete d.integratedModules.hr')],
 ['server migration purges persisted HR payload and workspace from live state/history',exists('database/migrations/008_remove_hr_module_state.sql')&&read('database/migrations/008_remove_hr_module_state.sql').includes("payload #- '{integratedModules,hr}'")&&read('database/migrations/008_remove_hr_module_state.sql').includes('update erp_state_history')&&read('database/migrations/008_remove_hr_module_state.sql').includes("x->>'id' <> 'hr'")],
 ['old HR workspace is filtered on load',read('src/persistence/browser-store.ts').includes("w.id!=='hr'")],
 ['official accounting collections are not blanket-deleted by HR cleanup',!read('src/persistence/browser-store.ts').includes('d.invoices=[]')&&!read('src/persistence/browser-store.ts').includes('d.receipts=[]')&&!read('src/persistence/browser-store.ts').includes('d.journal=[]')]
];
const failed=checks.filter(([,ok])=>!ok);console.log(JSON.stringify({ok:!failed.length,checks:checks.map(([name,pass])=>({name,pass}))},null,2));if(failed.length)process.exit(8);
