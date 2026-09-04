import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/mobile.ts',import.meta.url),'utf8');
const store=await readFile(new URL('../src/persistence/server-store.ts',import.meta.url),'utf8');
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const release=pkg.version;
const checks=[
 ['server probe is not blocked by a stale offline flag',!source.includes("if(!networkConnected){markConnection(false")],
 ['device network hint is separate from server reachability',source.includes('deviceNetworkHint=true')],
 ['offline signal is delayed before display',source.includes("setTimeout(async()=>")&&source.includes("},2500)")],
 ['offline display requires failed server verification',source.includes("checkServerHealth('offline-confirm')")&&source.includes("confirmedOffline")],
 ['successful server check clears offline state',source.includes("if(connected)setOnline(true)")],
 ['successful probe cache expires instead of trusting stale availability forever',store.includes('this.available===true&&t-this._lastProbe<10000')&&!store.includes('if(!force&&this.available===true)return true')],
 ['failed probe cache is short enough for fast reconnect',store.includes('this.available===false&&t-this._lastProbe<3000')],
 ['connection can be invalidated on native lifecycle changes',store.includes('invalidateConnection(){this.available=null;this._lastProbe=0}')&&source.includes('ServerStore.invalidateConnection?.();clearSidebarLock()')],
 ['network return invalidates stale server state before health check',source.includes('if(deviceNetworkHint){ServerStore.invalidateConnection?.();setOnline(true);checkServerHealth(source);return}')],
 ['pending saves are flushed before a manual refresh',store.includes('async flushPending()')&&source.includes('const synced=await ServerStore.flushPending()')],
 ['manual refresh protects unsynced data instead of discarding it silently',source.includes('لن يتم التحديث الآن حفاظًا على التعديل المعلّق')&&!source.includes("DB.data=remote.data;DB.ensure();DB.syncBlocked=false;DB.lastSaveError='';ServerStore.discardPending?.();")],
 ['conflicted pending data is discarded only after explicit confirmation',source.includes('ويلغي التعديل المتعارض')&&source.includes("ServerStore.discardPending?.();DB.syncBlocked=false;DB.lastSaveError=''" )],
 ['Android release header is current',source.includes(`X-ERP-Mobile-Version','${release}'`)]
];
for(const [name,ok] of checks){if(!ok)throw new Error(`connectivity check failed: ${name}`)}
console.log(`android connectivity smoke: ${checks.length}/${checks.length} passed`);
