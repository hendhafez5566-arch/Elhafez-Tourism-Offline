import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const runtime=read('src/core/runtime.ts'), server=read('src/persistence/server-store.ts'), store=read('src/persistence/browser-store.ts'), mobile=read('src/mobile.ts'), seed=read('src/core/seed.ts'), cap=JSON.parse(read('capacitor.config.json')), gradle=read('android/app/build.gradle'), main=read('android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java'), actions=read('src/commercial/actions.ts');
const checks=[
 ['offline edition flag',/offlineEdition:true/.test(runtime)],
 ['separate offline schema/storage',/commercial-offline/.test(runtime)&&/commercial_offline_data/.test(runtime)],
 ['server never required',/remoteRequired\(\)\{if\(APP\.offlineEdition===true\)return false/.test(server)],
 ['server probe hard-disabled',/async probe\(force=false\)\{if\(APP\.offlineEdition===true\)/.test(server)],
 ['local datastore remains primary fallback',/return this\.localGet\(\)/.test(store)&&/localPut\(data\)/.test(store)],
 ['local save path does not require remote',/const remoteExpected=ServerStore\.remoteRequired/.test(store)],
 ['offline license active professional',/mode:'offline',status:'active',edition:'professional'/.test(seed)],
 ['mobile server health path short-circuited',/if\(offlineEdition\)\{[\s\S]*ERP_MOBILE\.refresh/.test(mobile)],
 ['no Railway navigation in native shell',/Offline copy is intentionally self-contained/.test(main)],
 ['Capacitor bundles full dist',cap.webDir==='dist'],
 ['separate Android app id',cap.appId==='com.elhafez.tourism.erp.offline'&&gradle.includes("com.elhafez.tourism.erp.offline")],
 ['owner URL not required for offline build',!gradle.includes('ELHAFEZ_TECHNOLOGY_URL is required for Customer APK builds')],
 ['local factory reset path exists',/if\(APP\.offlineEdition===true\)\{await DB\.factoryReset\(\)/.test(actions)],
 ['external backup local fallback preserved',/return deep\(DB\.data\)/.test(read('src/documents/attachments-backup.ts'))],
 ['local restore path preserved',/تمت استعادة النسخة على الجهاز/.test(read('src/documents/attachments-backup.ts'))]
];
const failed=checks.filter(x=>!x[1]);
console.log(JSON.stringify({ok:!failed.length,checks:checks.map(([name,pass])=>({name,pass}))},null,2));
if(failed.length)process.exit(1);
