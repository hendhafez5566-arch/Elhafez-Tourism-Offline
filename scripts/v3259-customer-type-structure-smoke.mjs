import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compiledFilesText} from './lib/build-model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const srcTs=walk('src').filter(f=>f.endsWith('.ts'));
const ui=read('src/ui/ui.ts'),nav=read('src/ui/navigation.ts'),css=read('src/styles.css'),prep=read('scripts/prepare-customer-build.mjs'),contracts=read('src/core/umrah/contracts.ts'),proc=read('src/core/umrah/procurement.ts'),ops=read('src/core/umrah/operations.ts'),exec=read('src/core/umrah/operations-execution.ts'),tc=compiledFilesText();
const checks=[
 ['frontend source has zero @ts-nocheck',srcTs.every(f=>!read(f).includes('@ts-nocheck'))],
 ['customer preparer does not reintroduce @ts-nocheck',!prep.includes('@ts-nocheck')],
 ['customer Owner workspace registration removed',!nav.includes("'vendor-owner':")&&!nav.includes("vendorowner:['")&&!ui.includes("rows.push({id:'vendor-owner'")],
 ['customer Owner CSS block removed',!css.includes('.vendor-owner-page')&&!css.includes('.vendor-owner-kpis')],
 ['customer CSS patch count materially reduced',(css.match(/!important/g)||[]).length<760],
 ['procurement split into focused module',proc.includes('const UmrahCore_Procurement')&&!contracts.includes('const UmrahCore_Procurement')],
 ['procurement module is compiled',tc.includes('src/core/umrah/procurement.ts')],
 ['contracts module is below regular size limit',fs.statSync(path.join(root,'src/core/umrah/contracts.ts')).size<100000],
 ['procurement module is focused',fs.statSync(path.join(root,'src/core/umrah/procurement.ts')).size<30000],
 ['execution workflow split into focused module',exec.includes('const UmrahCore_OperationsExecution')&&!ops.includes('createVisaBatch(o)')],
 ['execution module is compiled',tc.includes('src/core/umrah/operations-execution.ts')],
 ['operations module is below regular size limit',fs.statSync(path.join(root,'src/core/umrah/operations.ts')).size<100000],
 ['execution module is focused',fs.statSync(path.join(root,'src/core/umrah/operations-execution.ts')).size<30000]
];
const out={ok:checks.every(x=>x[1]),checks:checks.map(([name,pass])=>({name,pass}))};
console.log(JSON.stringify(out,null,2));if(!out.ok)process.exit(1);
