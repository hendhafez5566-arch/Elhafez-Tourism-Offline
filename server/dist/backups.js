import { rebuildEntityMirror } from './entity-mirror.js';
import { createHash } from 'node:crypto';
import { pool, withTx } from './context.js';
import { loadState as currentState, loadStateForUpdate as currentStateForUpdate, saveState as persistStateRecord } from './repository/state-repository.js';
const canonical = (x) => x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? `[${x.map(canonical).join(',')}]` : `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}`;
const sha256 = (v) => createHash('sha256').update(Buffer.isBuffer(v) ? v : canonical(v)).digest('hex');
const cleanSource = (s) => ['manual', 'automatic', 'pre-upgrade', 'pre-period', 'snapshot'].includes(s) ? s : 'snapshot';
export async function storeLiveFile(t, fileId, fileName, mime, data) { const hash = sha256(data); await withTx(async (c) => { await c.query(`insert into erp_file_blobs(tenant_key,sha256,size,mime,data) values($1,$2,$3,$4,$5) on conflict(tenant_key,sha256) do nothing`, [t, hash, data.length, mime || 'application/octet-stream', data]); await c.query(`insert into erp_file_refs(tenant_key,file_id,file_name,mime,size,sha256,created_at,updated_at) values($1,$2,$3,$4,$5,$6,now(),now()) on conflict(tenant_key,file_id) do update set file_name=excluded.file_name,mime=excluded.mime,size=excluded.size,sha256=excluded.sha256,updated_at=now()`, [t, fileId, fileName || fileId, mime || 'application/octet-stream', data.length, hash]); await c.query('delete from erp_files where tenant_key=$1 and file_id=$2', [t, fileId]); }); return { sha256: hash, size: data.length }; }
export async function readLiveFile(t, fileId) { let r = await pool.query(`select r.file_name,r.mime,r.size,r.sha256,b.data from erp_file_refs r join erp_file_blobs b on b.tenant_key=r.tenant_key and b.sha256=r.sha256 where r.tenant_key=$1 and r.file_id=$2`, [t, fileId]); if (r.rowCount)
    return r.rows[0]; const old = await pool.query('select file_name,mime,size,data from erp_files where tenant_key=$1 and file_id=$2', [t, fileId]); if (!old.rowCount)
    return null; const f = old.rows[0]; await storeLiveFile(t, fileId, f.file_name, f.mime, Buffer.from(f.data)); r = await pool.query(`select r.file_name,r.mime,r.size,r.sha256,b.data from erp_file_refs r join erp_file_blobs b on b.tenant_key=r.tenant_key and b.sha256=r.sha256 where r.tenant_key=$1 and r.file_id=$2`, [t, fileId]); return r.rows[0] || null; }
export async function deleteLiveFile(t, fileId) { await pool.query('delete from erp_file_refs where tenant_key=$1 and file_id=$2', [t, fileId]); await pool.query('delete from erp_files where tenant_key=$1 and file_id=$2', [t, fileId]); await garbageCollectBlobs(t); }
export async function liveFileManifest(t) { await migrateLegacyFiles(t); const r = await pool.query(`select file_id as "id",file_name as "name",mime,size,sha256 from erp_file_refs where tenant_key=$1 order by file_id`, [t]); return r.rows.map((x) => ({ ...x, size: Number(x.size) })); }
export async function fileBlobsForManifest(t, manifest) { const hashes = [...new Set((manifest || []).map(x => String(x.sha256 || '')).filter(Boolean))]; if (!hashes.length)
    return []; const r = await pool.query(`select sha256,mime,size,data from erp_file_blobs where tenant_key=$1 and sha256=any($2::text[])`, [t, hashes]); return r.rows.map((x) => ({ sha256: x.sha256, mime: x.mime, size: Number(x.size), data: Buffer.from(x.data) })); }
export async function migrateLegacyFiles(t) { const tenants = t ? [t] : (await pool.query(`select distinct tenant_key from erp_files union select distinct tenant_key from erp_backup_files bf join erp_backups b on b.id=bf.backup_id`)).rows.map((x) => x.tenant_key); for (const tenant of tenants) {
    const old = await pool.query('select file_id,file_name,mime,size,data from erp_files where tenant_key=$1', [tenant]);
    for (const f of old.rows)
        await storeLiveFile(tenant, f.file_id, f.file_name, f.mime, Buffer.from(f.data));
    const bf = await pool.query(`select bf.backup_id,b.tenant_key,bf.file_id,bf.file_name,bf.mime,bf.size,bf.data from erp_backup_files bf join erp_backups b on b.id=bf.backup_id where b.tenant_key=$1`, [tenant]);
    for (const f of bf.rows) {
        const data = Buffer.from(f.data), hash = sha256(data);
        await pool.query(`insert into erp_file_blobs(tenant_key,sha256,size,mime,data) values($1,$2,$3,$4,$5) on conflict(tenant_key,sha256) do nothing`, [tenant, hash, data.length, f.mime || 'application/octet-stream', data]);
        await pool.query(`insert into erp_backup_file_refs(backup_id,file_id,file_name,mime,size,sha256) values($1,$2,$3,$4,$5,$6) on conflict(backup_id,file_id) do update set file_name=excluded.file_name,mime=excluded.mime,size=excluded.size,sha256=excluded.sha256`, [f.backup_id, f.file_id, f.file_name, f.mime, data.length, hash]);
    }
    if (bf.rowCount)
        await pool.query(`delete from erp_backup_files where backup_id in(select id from erp_backups where tenant_key=$1)`, [tenant]);
    const backups = await pool.query('select id,payload from erp_backups where tenant_key=$1', [tenant]);
    for (const b of backups.rows) {
        const refs = await backupManifest(Number(b.id));
        const checksum = sha256({ data: b.payload, attachments: refs.map(refLite) });
        await pool.query(`update erp_backups set checksum_sha256=$2,verified_at=coalesce(verified_at,now()),integrity_status='verified',attachment_count=$3,size_bytes=greatest(size_bytes,$4) where id=$1`, [b.id, checksum, refs.length, Buffer.byteLength(JSON.stringify(b.payload))]);
    }
    await garbageCollectBlobs(tenant);
} }
const refLite = (x) => ({ id: String(x.id || x.file_id || ''), sha256: String(x.sha256 || ''), size: Number(x.size || 0), name: String(x.name || x.file_name || ''), mime: String(x.mime || '') });
async function backupManifest(id) { const r = await pool.query(`select file_id as id,file_name as name,mime,size,sha256 from erp_backup_file_refs where backup_id=$1 order by file_id`, [id]); return r.rows.map((x) => ({ ...x, size: Number(x.size) })); }
export async function verifyBackup(t, id) { const r = await pool.query('select id,payload,checksum_sha256 from erp_backups where tenant_key=$1 and id=$2', [t, id]); if (!r.rowCount)
    throw Object.assign(new Error('backup_not_found'), { statusCode: 404 }); const row = r.rows[0], manifest = await backupManifest(id); let ok = sha256({ data: row.payload, attachments: manifest.map(refLite) }) === String(row.checksum_sha256 || ''); for (const m of manifest) {
    const b = await pool.query('select data,size from erp_file_blobs where tenant_key=$1 and sha256=$2', [t, m.sha256]);
    if (!b.rowCount || sha256(Buffer.from(b.rows[0].data)) !== m.sha256 || Number(b.rows[0].size) !== Number(m.size)) {
        ok = false;
        break;
    }
} await pool.query(`update erp_backups set integrity_status=$3,verified_at=now() where tenant_key=$1 and id=$2`, [t, id, ok ? 'verified' : 'failed']); return { ok, status: ok ? 'verified' : 'failed', checksum: row.checksum_sha256, attachments: manifest.length }; }
async function cleanupUnpinned(t) { const r = await pool.query(`select id from erp_backups where tenant_key=$1 and pinned=false order by created_at desc,id desc offset 3`, [t]); if (r.rowCount)
    await pool.query('delete from erp_backups where tenant_key=$1 and id=any($2::bigint[])', [t, r.rows.map((x) => Number(x.id))]); await garbageCollectBlobs(t); return r.rowCount || 0; }
export async function createBackup(t, label = 'Snapshot', source = 'snapshot', createdBy = 'system', providedState = null) { source = cleanSource(source); await migrateLegacyFiles(t); const st = providedState?.payload ? providedState : await currentState(t); if (!st?.payload)
    throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); const manifest = await liveFileManifest(t), checksum = sha256({ data: st.payload, attachments: manifest.map(refLite) }), size = Buffer.byteLength(JSON.stringify(st.payload)) + manifest.reduce((n, x) => n + Number(x.size || 0), 0); const id = await withTx(async (c) => { const r = await c.query(`insert into erp_backups(tenant_key,revision,schema_version,label,source,payload,created_by,checksum_sha256,verified_at,pinned,integrity_status,size_bytes,attachment_count) values($1,$2,$3,$4,$5,$6::jsonb,$7,$8,now(),false,'verified',$9,$10) returning id`, [t, Number(st.revision || 0), String(st.schema_version || st.schemaVersion || st.payload?.meta?.schema || ''), label, source, JSON.stringify(st.payload), createdBy, checksum, size, manifest.length]); const id = Number(r.rows[0].id); for (const f of manifest)
    await c.query(`insert into erp_backup_file_refs(backup_id,file_id,file_name,mime,size,sha256) values($1,$2,$3,$4,$5,$6)`, [id, f.id, f.name, f.mime, f.size, f.sha256]); return id; }); const verify = await verifyBackup(t, id); if (!verify.ok) {
    await pool.query('delete from erp_backups where id=$1', [id]);
    throw Object.assign(new Error('فشل التحقق من سلامة النسخة الاحتياطية'), { statusCode: 500 });
} await cleanupUnpinned(t); return { ok: true, id, checksum, sizeBytes: size, attachmentCount: manifest.length, source, status: 'verified' }; }
export async function listBackups(t) { await migrateLegacyFiles(t); const r = await pool.query(`select id,revision,schema_version,label,source,created_by,created_at,checksum_sha256,verified_at,pinned,integrity_status,size_bytes,attachment_count from erp_backups where tenant_key=$1 order by created_at desc,id desc`, [t]); return r.rows.map((x) => ({ ...x, id: Number(x.id), revision: Number(x.revision), size_bytes: Number(x.size_bytes || 0), attachment_count: Number(x.attachment_count || 0) })); }
export async function setBackupPinned(t, id, pinned) { const r = await pool.query('update erp_backups set pinned=$3 where tenant_key=$1 and id=$2 returning id', [t, id, !!pinned]); if (!r.rowCount)
    throw Object.assign(new Error('backup_not_found'), { statusCode: 404 }); if (!pinned)
    await cleanupUnpinned(t); return { ok: true, pinned: !!pinned }; }
export async function deleteBackup(t, id) { const r = await pool.query('delete from erp_backups where tenant_key=$1 and id=$2 returning id', [t, id]); if (!r.rowCount)
    throw Object.assign(new Error('backup_not_found'), { statusCode: 404 }); await garbageCollectBlobs(t); return { ok: true }; }
export async function cleanOldBackups(t) { return { ok: true, deleted: await cleanupUnpinned(t) }; }
export async function restoreBackup(t, id) { const chk = await verifyBackup(t, id); if (!chk.ok)
    throw Object.assign(new Error('backup_integrity_failed'), { statusCode: 409 }); return withTx(async (c) => { await c.query('select pg_advisory_xact_lock(hashtext($1))', [`restore:${t}`]); const cur = await currentStateForUpdate(c, t); if (cur)
    await c.query(`insert into erp_state_history(tenant_key,revision,schema_version,payload,reason,pinned) values($1,$2,$3,$4::jsonb,'backup-restore-before',true)`, [t, Number(cur.revision), cur.schema_version, JSON.stringify(cur.payload)]); const b = await c.query('select payload,schema_version from erp_backups where tenant_key=$1 and id=$2', [t, id]); if (!b.rowCount)
    throw Object.assign(new Error('backup_not_found'), { statusCode: 404 }); const manifest = await backupManifest(id); await rebuildEntityMirror(c, t, b.rows[0].payload); await persistStateRecord(c, t, b.rows[0].payload, b.rows[0].schema_version); await c.query('delete from erp_file_refs where tenant_key=$1', [t]); for (const f of manifest)
    await c.query(`insert into erp_file_refs(tenant_key,file_id,file_name,mime,size,sha256,created_at,updated_at) values($1,$2,$3,$4,$5,$6,now(),now())`, [t, f.id, f.name, f.mime, f.size, f.sha256]); await c.query('delete from erp_sessions where tenant_key=$1', [t]); return { ok: true }; }); }
export async function maybeAutoBackup(t, providedState = null) { const r = await pool.query(`select created_at from erp_backups where tenant_key=$1 and source='automatic' order by created_at desc limit 1`, [t]); if (r.rowCount && Date.now() - new Date(r.rows[0].created_at).getTime() < 23 * 60 * 60 * 1000)
    return null; return createBackup(t, 'نسخة تلقائية يومية', 'automatic', 'system', providedState); }
export async function backupBeforeUpgrade(version = '') { const tenants = (await pool.query('select tenant_key from erp_state')).rows.map((x) => x.tenant_key), out = []; for (const t of tenants) {
    const r = await pool.query(`select 1 from erp_backups where tenant_key=$1 and source='pre-upgrade' and label=$2 limit 1`, [t, `قبل تحديث v${version}`]);
    if (!r.rowCount)
        out.push(await createBackup(t, `قبل تحديث v${version}`, 'pre-upgrade', 'system'));
} return { ok: true, count: out.length }; }
export async function garbageCollectBlobs(t) { const r = await pool.query(`delete from erp_file_blobs b where b.tenant_key=$1 and not exists(select 1 from erp_file_refs r where r.tenant_key=b.tenant_key and r.sha256=b.sha256) and not exists(select 1 from erp_backup_file_refs br join erp_backups bk on bk.id=br.backup_id where bk.tenant_key=b.tenant_key and br.sha256=b.sha256) and not exists(select 1 from erp_period_archives a,jsonb_array_elements(coalesce(a.attachment_manifest,'[]'::jsonb)) m where a.tenant_key=b.tenant_key and m->>'sha256'=b.sha256) returning sha256`, [t]); return r.rowCount || 0; }
export const __backupTest = { sha256, refLite };
