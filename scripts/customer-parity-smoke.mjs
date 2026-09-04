import fs from 'node:fs';
import path from 'node:path';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const root=JSON.parse(read('package.json'));
const serverPkg=JSON.parse(read('server/package.json'));
const prepare=read('scripts/prepare-customer-build.mjs');
const docker=read('Dockerfile.customer');
const mobile=read('src/mobile.ts');
const pwa=read('src/pwa.ts');
const store=read('src/persistence/server-store.ts');
const main=read('android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java');
const resolver=read('mobile-customer/index.html');
const customerCfg=JSON.parse(read('capacitor.config.json'));
const workflow=read('.github/workflows/android-apk.yml');
const vendor=read('server/src/vendor.ts');
const runtime=read('src/core/runtime.ts');
const context=read('server/src/context.ts');

const checks=[];
const check=(name,pass)=>checks.push([name,!!pass]);
const writeTargets=[...prepare.matchAll(/new URL\('\.\.\/([^']+)'/g)].map(m=>m[1]).sort();
const allowed=['server/src/context.ts','server/src/server.ts','server/src/vendor.ts','src/commercial/vendor-owner.ts'].sort();
const customerFiles=fs.readdirSync(new URL('../mobile-customer/',import.meta.url)).sort();

check('root/server/runtime release aligned',root.version===serverPkg.version&&runtime.includes(`version:'${root.version}`));
check('Customer hardening is limited to the four security-boundary files',JSON.stringify(writeTargets)===JSON.stringify(allowed));
check('customer Docker builds the same root source after hardening',docker.includes('RUN node scripts/prepare-customer-build.mjs')&&docker.includes('RUN npm run build')&&docker.indexOf('prepare-customer-build.mjs')<docker.indexOf('npm run build'));
check('customer resolver is not a second ERP codebase',customerFiles.length===1&&customerFiles[0]==='index.html'&&!resolver.includes('app.js')&&!resolver.includes('styles.css'));
check('customer resolver opens runtime through persistent native shell',resolver.includes('window.NativeShell')&&resolver.includes('shell.openRuntime(u)'));
check('shared Android WebView exposes persistent NativeShell',main.includes('addJavascriptInterface(new NativeShellBridge(), "NativeShell")')&&main.includes('openRuntime(String url)')&&main.includes('.endsWith(".up.railway.app")'));
check('shared Android Back/lifecycle do not depend on Capacitor injection',main.includes('erp:native-back')&&main.includes('erp:native-state')&&mobile.includes("window.addEventListener('erp:native-back'")&&mobile.includes("window.addEventListener('erp:native-state'"));
check('mobile runtime accepts Capacitor or NativeShell',mobile.includes('if(!capacitorNative&&!shellNative)return')&&mobile.includes("shell:shellNative?'native-shell':'capacitor'"));
check('Customer keeps pull-to-refresh and refresh button from shared runtime',mobile.includes('installPullToRefresh')&&mobile.includes('nativeRefreshBtn')&&mobile.includes("refreshFromServer('pull')"));
check('native Customer disables stale PWA cache after runtime navigation',mobile.includes("getRegistrations")&&mobile.includes("startsWith('erp-shell-')")&&pwa.includes('NativeShell?.isNative?.()===true'));
check('server persistence treats NativeShell exactly as native Capacitor',store.includes('NativeShell?.isNative?.()===true')&&store.includes('const threshold=native?16384:49152'));
check('customer APK allows isolated Railway runtimes only',customerCfg?.server?.cleartext===false&&Array.isArray(customerCfg?.server?.allowNavigation)&&customerCfg.server.allowNavigation.includes('*.up.railway.app'));
check('Customer Android build contains no Tourism Vendor APK variant',workflow.includes('Tourism Customer Android')&&workflow.includes('com.elhafez.tourism.erp.customer')&&!workflow.includes('variant: [vendor, customer]')&&!workflow.includes('com.elhafez.tourism.erp.vendor'));
check('Customer resolver reads Elhafez Technology URL from native BuildConfig',main.includes('getOwnerBaseUrl()')&&main.includes('BuildConfig.ELHAFEZ_TECHNOLOGY_URL')&&resolver.includes('getOwnerBaseUrl')&&!resolver.includes('zonal-charm-production')); 
check('new customer provisioning does not freeze runtime version',!vendor.includes("env.ERP_APP_VERSION_OVERRIDE=appVersion"));
check('Customer contains no local release deployment authority',!vendor.includes('railwayDeploy(')&&!vendor.includes('ERP_APP_VERSION_OVERRIDE:rel.version'));
check('Customer local rollout is a hardened no-op owned by central Elhafez Technology',vendor.includes('vendorAutomaticRollout')&&vendor.includes("reason:'customer_build'"));
check('vendorAgentKey retained for central licensing/agent hooks',context.includes('export const vendorAgentKey=')&&prepare.includes("'vendorAutoRollout'")&&!prepare.includes("'vendorAutoRollout','vendorAgentKey'"));
check('customer compiled runtime still physically removes Vendor Center',prepare.includes('Vendor/Owner administration is physically excluded')&&prepare.includes('no Vendor Center UI/code'));

let bad=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)bad++}
console.log(JSON.stringify({ok:bad===0,version:root.version,checks:checks.length,customerDifference:allowed},null,2));
if(bad)process.exit(1);
