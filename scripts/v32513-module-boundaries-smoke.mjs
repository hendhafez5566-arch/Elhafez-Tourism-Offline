import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const bytes=p=>fs.statSync(path.join(root,p)).size;
const ts=read('tsconfig.json');
const wizard=read('src/core/umrah/program-wizard.ts'),wizardView=read('src/core/umrah/program-wizard-view.ts');
const forms=read('src/ui/forms.ts'),defs=read('src/ui/forms-definitions.ts');
const uforms=read('src/core/umrah/forms.ts'),contractForms=read('src/core/umrah/forms-contracts.ts');
const uui=read('src/core/umrah/ui.ts'),upages=read('src/core/umrah/ui-pages.ts');
const contracts=read('src/core/umrah/contracts.ts'),management=read('src/core/umrah/contracts-management.ts');
const order=(a,b)=>ts.indexOf(a)>=0&&ts.indexOf(a)<ts.indexOf(b);
const checks=[
 ['release is at least 32.5.13',(()=>{const v=JSON.parse(read('package.json')).version.split('.').map(Number);return v[0]>32||v[0]===32&&(v[1]>5||v[1]===5&&v[2]>=13)})()],
 ['program wizard view module compiled after core',order('src/core/umrah/program-wizard.ts','src/core/umrah/program-wizard-view.ts')],
 ['program wizard rendering moved out of core',!wizard.includes('\n    page() {')&&wizardView.includes('page() {')&&wizardView.includes('hotelStep(')&&bytes('src/core/umrah/program-wizard.ts')<70000],
 ['form definitions module compiled after form runtime',order('src/ui/forms.ts','src/ui/forms-definitions.ts')],
 ['large form definition table moved out of runtime',!forms.includes('\n def(type,c){')&&defs.includes('def(type,c){')&&bytes('src/ui/forms.ts')<60000],
 ['Umrah contract forms compiled after base forms',order('src/core/umrah/forms.ts','src/core/umrah/forms-contracts.ts')],
 ['contract allocation forms moved out of base forms',!uforms.includes('contractAllocation(kind, id)')&&contractForms.includes('contractAllocation(kind, id)')&&bytes('src/core/umrah/forms.ts')<75000],
 ['Umrah pages compiled after UI shell',order('src/core/umrah/ui.ts','src/core/umrah/ui-pages.ts')],
 ['Umrah page rendering moved out of UI shell',!uui.includes('const UmrahCore_Pages =')&&upages.includes('const UmrahCore_Pages =')&&bytes('src/core/umrah/ui.ts')<15000],
 ['contract management compiled after contract core',order('src/core/umrah/contracts.ts','src/core/umrah/contracts-management.ts')],
 ['contract management moved out of allocation core',!contracts.includes('\n    edit(kind, id)')&&!contracts.includes('\n    kpis()')&&management.includes('edit(kind, id)')&&management.includes('kpis()')&&bytes('src/core/umrah/contracts.ts')<65000],
 ['all new focused modules below 80KB',['src/core/umrah/program-wizard-view.ts','src/ui/forms-definitions.ts','src/core/umrah/forms-contracts.ts','src/core/umrah/ui-pages.ts','src/core/umrah/contracts-management.ts'].every(p=>bytes(p)<80000)]
];
const failed=checks.filter(([,ok])=>!ok);
console.log(JSON.stringify({ok:!failed.length,sizes:{wizard:bytes('src/core/umrah/program-wizard.ts'),wizardView:bytes('src/core/umrah/program-wizard-view.ts'),forms:bytes('src/ui/forms.ts'),definitions:bytes('src/ui/forms-definitions.ts'),umrahForms:bytes('src/core/umrah/forms.ts'),contractForms:bytes('src/core/umrah/forms-contracts.ts'),uiShell:bytes('src/core/umrah/ui.ts'),uiPages:bytes('src/core/umrah/ui-pages.ts'),contractCore:bytes('src/core/umrah/contracts.ts'),contractManagement:bytes('src/core/umrah/contracts-management.ts')},checks:checks.map(([name,pass])=>({name,pass}))},null,2));
if(failed.length)process.exit(1);
