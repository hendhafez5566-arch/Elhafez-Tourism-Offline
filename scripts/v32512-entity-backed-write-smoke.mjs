import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pkg=JSON.parse(read('package.json')),serverPkg=JSON.parse(read('server/package.json'));
const state=read('server/src/repository/postgres-state-repository.ts'),mirror=read('server/src/entity-mirror.ts'),migration=read('database/migrations/013_entity_backed_state_storage.sql'),server=read('server/src/server.ts'),backups=read('server/src/backups.ts'),archives=read('server/src/archives.ts'),recovery=read('server/src/auth-recovery.ts');
const directWrites=[server,backups,archives,recovery].flatMap((src,i)=>[...src.matchAll(/update erp_state set/gi)].map(m=>({i,pos:m.index})));
const checks=[
 ['release remains at least 32.5.12',(()=>{const v=pkg.version.split('.').map(Number);return serverPkg.version===pkg.version&&(v[0]>32||v[0]===32&&(v[1]>5||v[1]===5&&v[2]>=12))})()],
 ['storage-mode migration exists',/storage_mode text not null default 'legacy-full'/i.test(migration)&&/entity_row_count bigint/i.test(migration)&&/entity_present_keys text\[\]/i.test(migration)],
 ['write plan verifies mirror count before compaction',/actual!==summary\.rowCount/.test(mirror)&&/storageMode:'entity-backed'/.test(mirror)],
 ['write plan strips mirrored collections only after verification',/stripMirroredPayload/.test(mirror)&&/for\(const name of MIRRORED_COLLECTIONS\)delete out\[name\]/.test(mirror)],
 ['state persistence centralizes compact writes',/persistStateRecord/.test(state)&&/storage_mode=\$4/.test(state)&&/entity_row_count=\$5/.test(state)],
 ['entity-backed reads use state manifest and fail closed on inconsistency',/storageMode==='entity-backed'/.test(state)&&/entity_storage_inconsistent/.test(state)],
 ['application writers no longer update erp_state directly',directWrites.length===0],
 ['main write history stores hydrated full payload',/JSON\.stringify\(row\.payload\)/.test(server)&&/state-write/.test(server)],
 ['backup restore reads hydrated current state',/currentStateForUpdate\(c,t\)/.test(backups)&&/persistStateRecord/.test(backups)],
 ['period archive writes through centralized state persistence',/persistStateRecord\(c,t,plan\.active/.test(archives)],
 ['auth recovery writes through centralized state persistence',/persistStateRecord\(c,t,payload/.test(recovery)],
 ['new company state can be inserted compactly after mirror rebuild',/rebuildEntityMirror\(c,t,payload\);await insertStateRecord/.test(server)]
];
const out={ok:checks.every(x=>x[1]),checks:checks.map(([name,pass])=>({name,pass})),directWrites};console.log(JSON.stringify(out,null,2));if(!out.ok)process.exit(1);
