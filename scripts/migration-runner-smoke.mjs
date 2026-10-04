// Part 5 — tests the migration orchestration against an in-memory fake database with real transaction semantics
// (snapshot + restore on throw). This does NOT test the PostgreSQL SQL; see state-migrate-cli.mjs.
import { dryRun, apply, verifyAfter, rollbackToLegacy, restoreBackup } from './lib/migration-runner.mjs';
import { fingerprint, compare } from './lib/state-verify.mjs';
import { hydrate } from './lib/migration-plan.mjs';
let failed = 0; const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' ' + x}`); if (!c) failed++; };
function makeDb(payload, { corruptRows = false } = {}) {
  const S = { state: { default: { payload: structuredClone(payload), storage_mode: 'legacy-full', revision: 7, entity_row_count: 0, entity_present_keys: [] } }, rows: { default: [] }, backups: [], writes: 0 };
  const tx = () => ({
    async getState(t) { const s = S.state[t]; return s && structuredClone(s); }, async getStateForUpdate(t) { return this.getState(t); },
    async countRows(t) { return (S.rows[t] || []).length; }, async readRows(t) { return structuredClone(S.rows[t] || []); },
    async insertBackup(b) { S.writes++; S.backups.push({ id: S.backups.length + 1, tenant_key: b.tenant, payload: structuredClone(b.payload) }); return S.backups.length; },
    async getBackup(id) { return S.backups.find(x => x.id === id); },
    async replaceRows(t, rows) { S.writes++; S.rows[t] = structuredClone(rows); if (corruptRows && S.rows[t].length) S.rows[t][0].data.name = 'تالف'; },
    async setEntityBacked(t, p) { S.writes++; Object.assign(S.state[t], { payload: structuredClone(p.stripped), storage_mode: 'entity-backed', entity_row_count: p.rowCount, entity_present_keys: p.presentKeys }); },
    async setLegacyFull(t, full, o = {}) { if (o.dropRows) S.rows[t] = []; S.writes++; Object.assign(S.state[t], { payload: structuredClone(full), storage_mode: 'legacy-full', entity_row_count: 0, entity_present_keys: [] }); }
  });
  return { S, async readOnly(fn) { const w = S.writes, r = await fn(tx()); if (S.writes !== w) throw new Error('WRITE IN READ-ONLY'); return r; },
    async transaction(fn) { const snap = structuredClone({ state: S.state, rows: S.rows, backups: S.backups }); try { return await fn(tx()); } catch (e) { S.state = snap.state; S.rows = snap.rows; S.backups = snap.backups; throw e; } } };
}
const base = () => { const customers = [], journals = []; for (let i = 0; i < 300; i++) customers.push({ id: 'c' + i, name: 'عميل ' + i + (i % 9 ? '' : ' "خاص"'), phone: '010' + i });
  for (let i = 0; i < 900; i++) journals.push({ id: 'j' + i, lines: [{ accountId: '1300', debit: i + 0.1 * (i % 7), currency: i % 5 ? 'EGP' : 'SAR', partyType: 'customer', partyId: 'c' + (i % 300) }, { accountId: '4100', credit: i + 0.1 * (i % 7), currency: i % 5 ? 'EGP' : 'SAR' }] });
  return { settings: { baseCurrency: 'EGP' }, users: [{ id: 'u1' }], customers, journals, invoices: [] }; };

let db = makeDb(base()); const orig = structuredClone(db.S.state.default.payload);
const dr = await dryRun(db, 'default');
ok('dry-run: status ready, writes nothing', dr.status === 'ready' && db.S.writes === 0 && dr.wouldWriteRows === 1200);
ok('dry-run reports mirror absent (0 rows) honestly', dr.existingMirrorRows === 0 && dr.existingMirrorMatchesPayload === false);
const res = await apply(db, 'default', { backupNote: 'test' });
ok('apply: migrated + backup taken', res.status === 'migrated' && db.S.backups.length === 1 && db.S.state.default.storage_mode === 'entity-backed');
ok('apply: revision unchanged (no client resync forced)', db.S.state.default.revision === 7);
ok('apply: old data kept in backup, not deleted', compare(fingerprint(orig), fingerprint(db.S.backups[0].payload)).ok);
ok('apply: stripped payload no longer holds collections', !('customers' in db.S.state.default.payload) && !!db.S.state.default.payload.users);
const va = await verifyAfter(db, 'default', res.backupId); ok('verifyAfter: before == after', va.ok, JSON.stringify(va.problems));
ok('dry-run on migrated tenant says already_entity_backed', (await dryRun(db, 'default')).status === 'already_entity_backed');
let err = ''; try { await apply(db, 'default'); } catch (e) { err = e.message; } ok('apply twice is refused', err.startsWith('not_legacy_full'));
// user keeps working after migration, then rolls back: new writes must survive
db.S.rows.default.push({ collection_key: 'customers', entity_id: 'cNEW', ordinal: 300, data: { id: 'cNEW', name: 'عميل جديد بعد الترحيل' } }); db.S.state.default.entity_row_count++;
const rb = await rollbackToLegacy(db, 'default'); const full = db.S.state.default.payload;
ok('rollback: back to legacy-full with all collections', rb.status === 'rolled_back_to_legacy_full' && full.customers.length === 301 && full.journals.length === 900);
ok('rollback keeps data saved after migration', full.customers.some(c => c.id === 'cNEW'));
ok('rollback: trial balance unchanged', compare(fingerprint(orig), fingerprint({ ...full, customers: full.customers.filter(c => c.id !== 'cNEW') })).ok);
let e2 = ''; try { await restoreBackup(db, 'default', 1); } catch (e) { e2 = e.message; } ok('restore from backup requires explicit force', e2.startsWith('restore_loses'));
await restoreBackup(db, 'default', 1, { force: true }); ok('restore with force returns the exact original payload', compare(fingerprint(orig), fingerprint(db.S.state.default.payload)).ok);
// failure paths leave everything untouched
db = makeDb(base(), { corruptRows: true }); let e3 = ''; try { await apply(db, 'default'); } catch (e) { e3 = e.message; }
ok('corrupted copy is detected and the transaction rolls back', e3.startsWith('verification_failed') && db.S.state.default.storage_mode === 'legacy-full' && db.S.rows.default.length === 0 && db.S.backups.length === 0);
const dupData = base(); dupData.customers.push({ ...dupData.customers[0] }); db = makeDb(dupData); e3 = ''; try { await apply(db, 'default'); } catch (e) { e3 = e.message; }
ok('duplicate ids block the migration, nothing written', e3.startsWith('unsafe_data') && db.S.writes === 0 && (await dryRun(db, 'default')).status === 'blocked');
const unb = base(); unb.journals[3].lines[0].debit += 5; db = makeDb(unb); e3 = ''; try { await apply(db, 'default'); } catch (e) { e3 = e.message; }
ok('unbalanced source journals block the migration', e3 === 'source_journals_unbalanced' && db.S.writes === 0);
ok('unknown tenant', (await dryRun(db, 'nope')).status === 'not_found');
if (failed) { console.error(failed + ' failed'); process.exit(1); } console.log('\nMigration runner smoke passed');
