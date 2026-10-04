import { uiText, pagesText } from './lib/split-sources.mjs';
import {readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const read=async p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const exists=async p=>{try{await access(new URL(`../${p}`,import.meta.url));return true}catch{return false}};
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const [pkg,index,ui,nav,pages,bridge,suites,umrahData,authz,app]=await Promise.all([
 read('package.json'),read('index.html'),uiText(),read('src/ui/navigation.ts'),pagesText(),read('src/integrated/bridge.ts'),read('src/core/suites.ts'),read('src/core/umrah/data.ts'),read('server/src/authz.ts'),read('dist/app.js')
]);
const umrahSource=(await Promise.all(['runtime.ts','integration.ts','data.ts','contracts.ts','guided.ts','program-wizard.ts','program-wizard-validation.ts','program-wizard-finish.ts','operations.ts','operations-execution.ts','ui.ts','forms.ts','actions-print.ts'].map(x=>read(`src/core/umrah/${x}`)))).join('\n');

// HR is intentionally removed in v32.4.60, not merely hidden.
for(const p of ['src/core/hr','src/integrated/hr','tsconfig.hr-core.json','dist/core/hr.js','dist/core/hr.js.map'])assert(!await exists(p),`Removed HR artifact still exists: ${p}`);
assert(!pkg.includes('\"test:hr\"')&&!pkg.includes('tsconfig.hr-core.json'),'Package still references removed HR build/test');
assert(!index.includes('core/hr.js'),'HTML still loads removed HR runtime');
assert(!pages.includes("'hr-")&&!nav.includes("['hr-")&&!ui.includes("id:'hr'"),'Main ERP router/navigation still exposes HR');
assert(!suites.includes('HRCore_')&&!suites.includes("hr:"),'Core suite adapter still contains HR runtime');
assert(!authz.includes("'hr-suite'")&&!authz.includes('integratedModules?.hr'),'Server authorization still exposes HR module');

// Umrah remains a first-class ERP module after HR removal.
assert(!await exists('src/integrated/umrah'),'Legacy Umrah application source still exists');
assert(!await exists('scripts/build-native-modules.mjs'),'Legacy native module builder still exists');
assert(!await exists('tsconfig.umrah-core.json'),'Umrah still has a separate compiler/bundle configuration');
assert(!await exists('dist/core/umrah.js')&&!await exists('dist/core/umrah.js.map'),'Umrah still ships as a separate runtime chunk');
assert(index.includes('defer src="./app.js"')&&!index.includes('core/umrah.js'),'Main runtime script wiring is incorrect');
assert(pages.includes("'umrah-dashboard'(){return CoreSuites.render('umrah','umrah-dashboard')}")&&nav.includes("['umrah-programs'"),'Umrah routes are missing from the main ERP router/navigation');
assert(ui.includes('openModule(p){return this.openPage(p)}')&&!ui.includes('suiteTarget(p)')&&!ui.includes('ERPIntegration.api('),'Main router still has nested-suite lifecycle code');
assert(!bridge.includes('ERP_NATIVE_MODULES')&&!bridge.includes('ensureNative(name)')&&!bridge.includes('native-module-host')&&!bridge.includes('mount(name)'),'Central integration still contains nested application loader/mount code');
assert(suites.includes("if(name!=='umrah')return false")&&suites.includes('UmrahCore_DB.load()')&&!suites.includes('renderNav=()=>'),'Core adapter is not the expected Umrah-only host adapter');
assert(umrahData.includes("programs: 'umrahPrograms'")&&umrahData.includes("bookings: 'umrahBookings'")&&umrahData.includes("travelers: 'umrahTravelers'"),'Umrah root mapping is incomplete');
assert(umrahData.includes('DB.atomic(`umrah:${label}`')&&umrahData.includes('DB.save(false, { silentUi: true })'),'Umrah does not use the central ERP DB transaction/persistence path directly');
assert(!umrahSource.includes('localStorage')&&!umrahSource.includes('moduleStore')&&!umrahSource.includes('umrahStore'),'Umrah core still depends on a standalone persistence path');
assert(!bridge.includes('umrahStore:')&&!authz.includes('integratedModules?.umrah'),'Legacy Umrah compatibility store remains');
assert(authz.includes("'umrahPrograms'")&&authz.includes("'umrahBookings'")&&authz.includes("'umrahTravelers'"),'Server authorization does not recognize native Umrah collections');
/* Bundled by esbuild: top-level const becomes var and a name shared with a late-binding slot gets a numeric suffix, so match the real object definition. */
const defined=name=>new RegExp('\\b(?:const|var|let) '+name+'\\d* = \\{').test(app);
assert(defined('UmrahCore_DB')&&defined('UmrahCore_ProgramWizard')&&defined('UmrahCore_Actions'),'Umrah core is missing from the main ERP runtime');
assert(!umrahSource.includes('attachShadow(')&&!umrahSource.includes("createElement('iframe')"),'Umrah core contains nested iframe/Shadow DOM runtime');
const syntax=spawnSync(process.execPath,['--check',fileURLToPath(new URL('../dist/app.js',import.meta.url))],{encoding:'utf8'});
assert(syntax.status===0,`Main runtime has syntax errors: ${syntax.stderr}`);
console.log(JSON.stringify({ok:true,mode:'single-main-runtime',hrRemoved:true,routes:{umrah:true,hr:false},sameRouter:true,sameStore:true,shadowDom:false,iframe:false},null,2));
