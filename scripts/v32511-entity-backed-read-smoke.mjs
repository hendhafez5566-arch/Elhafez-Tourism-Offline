import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pkg=JSON.parse(read('package.json')),serverPkg=JSON.parse(read('server/package.json'));
const state=read('server/src/repository/postgres-state-repository.ts'),mirror=read('server/src/entity-mirror.ts'),core=read('server/src/entity-mirror-core.ts'),migration=read('database/migrations/012_entity_mirror_read_source.sql'),server=read('server/src/server.ts'),backups=read('server/src/backups.ts');
const checks=[
 ['release remains newer than the 32.5.11 read-source milestone',Number(pkg.version.split('.').at(-1))>=11&&serverPkg.version===pkg.version],
 ['mirror metadata migration exists',/create table if not exists erp_entity_mirror_meta/i.test(migration)],
 ['state read strips mirrored arrays before hydration',/payload-\$2::text\[\]/.test(state)],
 ['state read requires matching revision',/mirrorRevision===revision/.test(state)],
 ['state read has full-state fallback',/fallback=await c\.query\('select payload/.test(state)],
 ['state write locks through entity-backed reader',/currentStateForUpdate\(c,t\)/.test(server)&&/for update of s/.test(state)],
 ['mirror validates row count',/actual!==summary\.rowCount/.test(mirror)],
 ['mirror rejects duplicate or missing IDs',/ids\.has\(id\)/.test(core)&&/!id/.test(core)],
 ['startup initializes mirror metadata',/initializeEntityMirrorMetadata/.test(server)],
 ['writes record mirror revision',/markEntityMirrorRevision/.test(server)],
 ['support diagnostics exposes entity storage status',/entityMirrorStatus/.test(server)&&/entityStorage/.test(server)],
 ['backup/history preserve hydrated schema version',/row\.schema_version/.test(server)&&/st\.schema_version\|\|st\.schemaVersion/.test(backups)]
];
const out={ok:checks.every(x=>x[1]),checks:checks.map(([name,pass])=>({name,pass}))};console.log(JSON.stringify(out,null,2));if(!out.ok)process.exit(1);
