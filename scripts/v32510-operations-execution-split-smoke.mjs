import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const ops=read('src/core/umrah/operations.ts'),exec=read('src/core/umrah/operations-execution.ts'),tc=read('tsconfig.json'),pkg=JSON.parse(read('package.json')),serverPkg=JSON.parse(read('server/package.json')),runtime=read('src/core/runtime.ts'),mobile=read('src/mobile.ts'),gradle=read('android/app/build.gradle');
const methods=['createVisaBatch','updateVisaItem','upsertTicket','createBusRun','autoAssignBuses','addIncident','setIncidentStatus'];
const server=read('server/src/server.ts');const [maj,min,patch]=pkg.version.split('.').map(Number),atLeast32510=maj>32||maj===32&&(min>5||min===5&&patch>=10),expectedAndroidCode=Number(pkg.version.replace(/\./g,''));
const checks=[
 ['release version is at least 32.5.10',atLeast32510],
 ['server source has no @ts-nocheck',!server.includes('@ts-nocheck')],
 ['server package version matches',serverPkg.version===pkg.version],
 ['web runtime version matches',runtime.includes(`version:'${pkg.version}'`)],
 ['mobile header version matches',mobile.includes(`X-ERP-Mobile-Version','${pkg.version}'`)],
 ['Android versionName/code match',gradle.includes(`versionName "${pkg.version}"`)&&gradle.includes(`versionCode ${expectedAndroidCode}`)],
 ['execution module compiled after core operations',tc.indexOf('src/core/umrah/operations-execution.ts')>tc.indexOf('src/core/umrah/operations.ts')],
 ['operations module below regular 100KB ceiling',fs.statSync(path.join(root,'src/core/umrah/operations.ts')).size<100000],
 ['execution module remains focused',fs.statSync(path.join(root,'src/core/umrah/operations-execution.ts')).size<30000],
 ['execution object is attached to UmrahCore_Ops',exec.includes('Object.assign(UmrahCore_Ops, UmrahCore_OperationsExecution)')],
 ...methods.map(m=>[`execution owns ${m}`,exec.includes(`${m}(`)&&!ops.includes(`${m}(`)])
];
const out={ok:checks.every(x=>x[1]),checks:checks.map(([name,pass])=>({name,pass}))};
console.log(JSON.stringify(out,null,2));if(!out.ok)process.exit(1);
