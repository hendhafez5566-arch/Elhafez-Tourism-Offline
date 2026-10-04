// Migrates a company from legacy-full (everything in erp_state.payload) to entity-backed (collections only in erp_entity_records).
// DEFAULT = DRY RUN (read-only). Nothing is written without --apply.
//   node scripts/state-migrate-cli.mjs --tenant default                 # dry-run report
//   node scripts/state-migrate-cli.mjs --tenant default --apply         # backup + transaction + verification
//   node scripts/state-migrate-cli.mjs --tenant default --verify <backupId>
//   node scripts/state-migrate-cli.mjs --tenant default --rollback      # entity-backed -> legacy-full, keeps newer data
//   node scripts/state-migrate-cli.mjs --tenant default --restore-backup <id> --force   # exact old payload, LOSES newer changes
//   add --all to run for every tenant (dry-run/apply)
// STOP THE APP before --apply and take a pg_dump too. The SQL below has NOT been run against a live PostgreSQL by its author.
import pg from 'pg';
import { dryRun, apply, verifyAfter, rollbackToLegacy, restoreBackup } from './lib/migration-runner.mjs';
const url = process.env.DATABASE_URL; if (!url) { console.error('DATABASE_URL is required'); process.exit(2); }
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; }, flag = n => process.argv.includes(n);
const pool = new pg.Pool({ connectionString: url, max: 2 });
const BATCH = 500;
const txApi = c => ({
  async getState(t) { const r = await c.query('select payload, schema_version, revision, storage_mode, entity_row_count, entity_present_keys from erp_state where tenant_key=$1', [t]); return r.rows[0] ? { ...r.rows[0], revision: Number(r.rows[0].revision) } : null; },
  async getStateForUpdate(t) { const r = await c.query('select payload, schema_version, revision, storage_mode, entity_row_count, entity_present_keys from erp_state where tenant_key=$1 for update', [t]); return r.rows[0] ? { ...r.rows[0], revision: Number(r.rows[0].revision) } : null; },
  async countRows(t) { return Number((await c.query('select count(*)::bigint n from erp_entity_records where tenant_key=$1', [t])).rows[0].n); },
  async readRows(t) { return (await c.query('select collection_key, entity_id, ordinal, data from erp_entity_records where tenant_key=$1 order by collection_key, ordinal, entity_id', [t])).rows; },
  async insertBackup(b) { const r = await c.query('insert into erp_state_migration_backup(tenant_key,revision,storage_mode,mirror_rows,note,payload) values($1,$2,$3,$4,$5,$6::jsonb) returning id', [b.tenant, b.revision, b.storage_mode, b.rows, b.note || '', JSON.stringify(b.payload)]); return Number(r.rows[0].id); },
  async getBackup(id) { const r = await c.query('select id, tenant_key, payload from erp_state_migration_backup where id=$1', [id]); return r.rows[0] || null; },
  async replaceRows(t, rows) {
    await c.query('delete from erp_entity_records where tenant_key=$1', [t]);
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH).map(r => ({ k: r.collection_key, o: r.ordinal, item: r.data }));
      await c.query(`insert into erp_entity_records(tenant_key,collection_key,entity_id,ordinal,branch_id,record_date,status,record_no,party_id,program_id,data,updated_at)
        select $1::text, x.k, x.item->>'id', x.o, coalesce(x.item->>'branchId',''), coalesce(x.item->>'date',x.item->>'createdAt',''), coalesce(x.item->>'status',''), coalesce(x.item->>'no',''),
               coalesce(x.item->>'partyId',x.item->>'customerId',x.item->>'supplierId',''), coalesce(x.item->>'programId',''), x.item, now()
        from jsonb_to_recordset($2::jsonb) as x(k text, o int, item jsonb)`, [t, JSON.stringify(chunk)]);
    }
  },
  async setEntityBacked(t, p) {
    await c.query(`update erp_state set payload=$2::jsonb, storage_mode='entity-backed', entity_row_count=$3, entity_present_keys=$4::text[] where tenant_key=$1`, [t, JSON.stringify(p.stripped), p.rowCount, p.presentKeys]);
    await c.query(`insert into erp_entity_mirror_meta(tenant_key,revision,row_count,present_keys,updated_at) values($1,$2,$3,$4::text[],now()) on conflict(tenant_key) do update set revision=excluded.revision,row_count=excluded.row_count,present_keys=excluded.present_keys,updated_at=now()`, [t, p.revision, p.rowCount, p.presentKeys]);
  },
  async setLegacyFull(t, full, o = {}) {
    await c.query(`update erp_state set payload=$2::jsonb, storage_mode='legacy-full', entity_row_count=0, entity_present_keys='{}'::text[] where tenant_key=$1`, [t, JSON.stringify(full)]);
    await c.query('delete from erp_entity_mirror_meta where tenant_key=$1', [t]);
    if (o.dropRows) await c.query('delete from erp_entity_records where tenant_key=$1', [t]);
  }
});
const db = {
  async readOnly(fn) { const c = await pool.connect(); try { await c.query('begin read only'); return await fn(txApi(c)); } finally { await c.query('rollback').catch(() => {}); c.release(); } },
  async transaction(fn) { const c = await pool.connect(); try { await c.query('begin'); const out = await fn(txApi(c)); await c.query('commit'); return out; } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); } }
};
async function ensureBackupTable() { await pool.query(`create table if not exists erp_state_migration_backup(id bigserial primary key, tenant_key text not null, taken_at timestamptz not null default now(), revision bigint not null, storage_mode text not null, mirror_rows bigint not null default 0, note text not null default '', payload jsonb not null)`); }
try {
  let tenants = flag('--all') ? (await pool.query('select tenant_key from erp_state order by tenant_key')).rows.map(r => r.tenant_key) : [arg('--tenant') || 'default'];
  for (const t of tenants) {
    if (flag('--rollback')) { console.log(JSON.stringify(await rollbackToLegacy(db, t), null, 1)); continue; }
    if (flag('--restore-backup')) { console.log(JSON.stringify(await restoreBackup(db, t, Number(arg('--restore-backup')), { force: flag('--force') }), null, 1)); continue; }
    if (flag('--verify')) { const r = await verifyAfter(db, t, Number(arg('--verify'))); console.log(JSON.stringify(r, null, 1)); if (!r.ok) process.exitCode = 1; continue; }
    if (!flag('--apply')) { console.log(JSON.stringify(await dryRun(db, t), null, 1)); continue; }
    const rep = await dryRun(db, t);
    if (rep.status !== 'ready') { console.log(`SKIP ${t}: ${rep.status}`, JSON.stringify(rep.blockedReasons || [])); if (rep.status === 'blocked') process.exitCode = 1; continue; }
    await ensureBackupTable();
    const res = await apply(db, t, { backupNote: 'part5 migrate ' + new Date().toISOString() });
    console.log(JSON.stringify(res, null, 1));
    const v = await verifyAfter(db, t, res.backupId);
    console.log(v.ok ? `POST-COMMIT VERIFY OK for ${t}. Backup id ${res.backupId} kept in erp_state_migration_backup (delete it yourself only after you approve).` : `POST-COMMIT VERIFY FAILED for ${t}: ${JSON.stringify(v.problems)}\nRun: --tenant ${t} --rollback`);
    if (!v.ok) process.exitCode = 1;
  }
} catch (e) { console.error('ERROR (transaction rolled back):', e.message); process.exitCode = 1; } finally { await pool.end(); }
